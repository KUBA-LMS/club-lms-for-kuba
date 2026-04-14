import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import get_redis
from app.models.user import User, user_club

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

ALGORITHM = "HS256"

# Redis key prefix for revoked JWT ids. The full key stores a sha256 of the raw token.
_REVOKE_PREFIX = "auth:revoked:"


def _token_fingerprint(token: str) -> str:
    """Stable, short, one-way identifier for a raw JWT. Used as Redis key."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def revoke_token(token: str) -> None:
    """Mark a JWT as revoked until its natural expiry.

    Stores the token's sha256 fingerprint in Redis with a TTL equal to the
    remaining lifetime of the token. Safe no-op when Redis is unavailable
    (falls back to the previous stateless behaviour).
    """
    payload = verify_token(token)
    if not payload:
        return
    exp = payload.get("exp")
    if exp is None:
        return
    remaining = int(exp - datetime.now(timezone.utc).replace(tzinfo=None).timestamp())
    if remaining <= 0:
        return

    redis_client = await get_redis()
    if redis_client is None:
        return
    await redis_client.set(f"{_REVOKE_PREFIX}{_token_fingerprint(token)}", "1", ex=remaining)


async def is_token_revoked(token: str) -> bool:
    redis_client = await get_redis()
    if redis_client is None:
        return False
    return await redis_client.exists(f"{_REVOKE_PREFIX}{_token_fingerprint(token)}") > 0


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc).replace(tzinfo=None) + expires_delta
    else:
        expire = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_reset_token(user_id: str) -> str:
    """Create a short-lived password reset token."""
    expire = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=30)
    to_encode = {"sub": user_id, "exp": expire, "type": "reset"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """Verify a JWT token and return its payload."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    if await is_token_revoked(token):
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Deprecated: use verify_club_admin for per-group checks.
    Kept for backward compat -- allows superadmin or any authenticated user
    (actual permission is checked by _verify_admin_club_access in admin.py).
    """
    return current_user


async def get_current_superadmin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required",
        )
    return current_user


async def verify_club_admin(
    db: AsyncSession, user: User, club_id
) -> None:
    """Raise 403 if user is not admin/lead of the specific club. Superadmins bypass."""
    from uuid import UUID
    if user.role == "superadmin":
        return
    cid = club_id if isinstance(club_id, UUID) else UUID(str(club_id))
    result = await db.execute(
        select(user_club.c.role).where(
            user_club.c.user_id == user.id,
            user_club.c.club_id == cid,
        )
    )
    row = result.first()
    if not row or row[0] not in ("admin", "lead"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or lead role required for this club",
        )
