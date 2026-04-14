from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    create_reset_token,
    get_current_user,
    verify_token,
    revoke_token,
    oauth2_scheme,
)
from app.core.email import send_password_reset_email
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    TokenResponse,
    RefreshTokenRequest,
    PasswordForgotRequest,
    PasswordResetRequest,
    PasswordChangeRequest,
)
from app.schemas.user import UserSignUp, UserResponse

router = APIRouter()


@router.get("/check-username")
@limiter.limit("30/minute")
async def check_username(
    request: Request,
    username: str,
    db: AsyncSession = Depends(get_db),
):
    """Check whether a username is available for signup.

    Applies the same format rules as signup (Instagram-style: 3-30 chars,
    lowercase alphanumeric plus `.` and `_`, no leading/trailing/consecutive
    periods) and does a case-insensitive existence check. ``reason`` is
    informational so the client can render the correct message.
    """
    import re
    from sqlalchemy import func as sa_func

    candidate = (username or "").strip()
    if not candidate or len(candidate) < 3:
        return {"available": False, "reason": "too_short"}
    if len(candidate) > 30:
        return {"available": False, "reason": "too_long"}
    if not re.fullmatch(r"[a-z0-9._]+", candidate):
        return {"available": False, "reason": "invalid_chars"}
    if candidate.startswith("."):
        return {"available": False, "reason": "leading_period"}
    if candidate.endswith("."):
        return {"available": False, "reason": "trailing_period"}
    if ".." in candidate:
        return {"available": False, "reason": "consecutive_periods"}

    result = await db.execute(
        select(User).where(sa_func.lower(User.username) == candidate.lower())
    )
    if result.scalar_one_or_none():
        return {"available": False, "reason": "taken"}
    return {"available": True}


@router.get("/check-email")
@limiter.limit("20/minute")
async def check_email(
    request: Request,
    email: str,
    db: AsyncSession = Depends(get_db),
):
    """Check whether an email is available for signup.

    Format-validates the same way signup does (local@domain.tld with a
    2+ char TLD) and runs a case-insensitive existence check. Stricter
    rate limit than username check because email enumeration is a more
    sensitive signal than handle enumeration.
    """
    import re
    from sqlalchemy import func as sa_func

    candidate = (email or "").strip().lower()
    if not candidate:
        return {"available": False, "reason": "empty"}
    if len(candidate) > 255:
        return {"available": False, "reason": "too_long"}
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]{2,}", candidate):
        return {"available": False, "reason": "invalid_format"}

    result = await db.execute(
        select(User).where(sa_func.lower(User.email) == candidate)
    )
    if result.scalar_one_or_none():
        return {"available": False, "reason": "taken"}
    return {"available": True}


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def signup(request: Request, user_data: UserSignUp, db: AsyncSession = Depends(get_db)):
    """Register a new user.

    Usernames and emails are matched case-insensitively to prevent near-duplicate
    accounts (``john`` vs ``John``, ``a@X.com`` vs ``a@x.com``). Emails are stored
    lowercased; usernames preserve the submitted casing for display.
    """
    from sqlalchemy.exc import IntegrityError
    from sqlalchemy import func as sa_func

    username_norm = user_data.username.strip()
    legal_name_norm = user_data.legal_name.strip()
    email_norm = (user_data.email or "").strip().lower() or None

    if not username_norm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is required")
    if not legal_name_norm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Legal name is required")

    # Case-insensitive uniqueness checks
    result = await db.execute(
        select(User).where(sa_func.lower(User.username) == username_norm.lower())
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    if email_norm is not None:
        result = await db.execute(
            select(User).where(sa_func.lower(User.email) == email_norm)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=username_norm,
        hashed_password=hashed_password,
        legal_name=legal_name_norm,
        email=email_norm,
        student_id=user_data.student_id,
        profile_image=user_data.profile_image,
        nationality=user_data.nationality,
        gender=user_data.gender,
    )

    db.add(new_user)
    try:
        await db.commit()
    except IntegrityError:
        # Race: another concurrent signup took the username/email between our check and commit.
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already taken",
        )
    await db.refresh(new_user)

    return new_user


@router.post("/login", response_model=LoginResponse)
@limiter.limit("10/minute")
async def login(request: Request, login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with username/email and password. Match is case-insensitive on both."""
    from sqlalchemy import func as sa_func

    candidate = (login_data.username_or_email or "").strip()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is required",
        )

    result = await db.execute(
        select(User).where(
            (sa_func.lower(User.email) == candidate.lower())
            | (sa_func.lower(User.username) == candidate.lower())
        )
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.role == "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin must use the admin dashboard",
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token."""
    payload = verify_token(refresh_data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile."""
    return current_user


@router.post("/logout")
async def logout(
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
):
    """Logout current user and revoke the current access token.

    The token is stored (as a sha256 fingerprint) in Redis with a TTL equal to
    its remaining lifetime. If Redis is unavailable the call degrades gracefully
    to the previous stateless behaviour -- the client is still expected to
    discard the token.
    """
    await revoke_token(token)
    return {"message": "Successfully logged out"}


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(
    request: Request, data: PasswordForgotRequest, db: AsyncSession = Depends(get_db)
):
    """Request password reset email."""
    from sqlalchemy import func as sa_func

    normalized_email = (data.email or "").strip().lower()
    result = await db.execute(
        select(User).where(sa_func.lower(User.email) == normalized_email)
    )
    user = result.scalar_one_or_none()

    # Always return success to prevent email enumeration
    if user:
        reset_token = create_reset_token(str(user.id))
        await send_password_reset_email(user.email, reset_token)

    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    request: PasswordResetRequest, db: AsyncSession = Depends(get_db)
):
    """Reset password using reset token."""
    payload = verify_token(request.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.hashed_password = get_password_hash(request.new_password)
    await db.commit()

    return {"message": "Password has been reset successfully"}


@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change password for authenticated user."""
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    current_user.hashed_password = get_password_hash(request.new_password)
    await db.commit()

    return {"message": "Password changed successfully"}
