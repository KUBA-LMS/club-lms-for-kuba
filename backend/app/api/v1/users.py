from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, FriendRequest, friendship, user_club
from app.schemas.club import ClubBriefResponse
from app.schemas.user import (
    UserUpdate,
    UserResponse,
    UserBriefResponse,
    UserBankAccountUpdate,
    UserBankAccountResponse,
    UserListResponse,
    UserProfileResponse,
    UserSearchItemResponse,
    UserSearchListResponse,
    UserFriendItemResponse,
    UserFriendListResponse,
    FriendRequestResponse,
    FriendRequestListResponse,
)
from app.services.notifications import (
    notify_friend_request,
    notify_friend_request_accepted,
)

router = APIRouter()


# --- Helper: compute common clubs ---

async def _get_my_club_ids(db: AsyncSession, user_id: UUID) -> set:
    result = await db.execute(
        select(user_club.c.club_id).where(user_club.c.user_id == user_id)
    )
    return {row[0] for row in result.fetchall()}


def _common_clubs(user_clubs, my_club_ids: set) -> List[ClubBriefResponse]:
    return [
        ClubBriefResponse(id=c.id, name=c.name, logo_image=c.logo_image)
        for c in user_clubs if c.id in my_club_ids
    ]


# --- Search ---

@router.get("/search", response_model=UserSearchListResponse)
async def search_users(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search users by username or legal name. Excludes current user.
    Includes is_friend and pending request_status."""
    offset = (page - 1) * limit
    search_term = f"%{q}%"

    base_filter = [
        User.id != current_user.id,
        or_(
            User.username.ilike(search_term),
            User.legal_name.ilike(search_term),
        ),
    ]

    count_query = select(func.count(User.id)).where(*base_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = (
        select(User)
        .options(selectinload(User.clubs))
        .where(*base_filter)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    users = result.scalars().all()

    # Friend IDs
    friend_ids_result = await db.execute(
        select(friendship.c.friend_id).where(
            friendship.c.user_id == current_user.id
        )
    )
    friend_ids = {row[0] for row in friend_ids_result.fetchall()}

    # Pending requests sent by me
    sent_result = await db.execute(
        select(FriendRequest.to_user_id, FriendRequest.id).where(
            FriendRequest.from_user_id == current_user.id,
            FriendRequest.status == "pending",
        )
    )
    sent_requests = {row[0]: row[1] for row in sent_result.fetchall()}

    # Pending requests received by me
    received_result = await db.execute(
        select(FriendRequest.from_user_id, FriendRequest.id).where(
            FriendRequest.to_user_id == current_user.id,
            FriendRequest.status == "pending",
        )
    )
    received_requests = {row[0]: row[1] for row in received_result.fetchall()}

    my_club_ids = await _get_my_club_ids(db, current_user.id)

    data = []
    for u in users:
        request_status = None
        request_id = None
        if u.id in friend_ids:
            pass  # is_friend=True, no request
        elif u.id in sent_requests:
            request_status = "sent"
            request_id = sent_requests[u.id]
        elif u.id in received_requests:
            request_status = "received"
            request_id = received_requests[u.id]

        data.append(UserSearchItemResponse(
            id=u.id,
            username=u.username,
            profile_image=u.profile_image,
            is_friend=u.id in friend_ids,
            request_status=request_status,
            request_id=request_id,
            common_clubs=_common_clubs(u.clubs, my_club_ids),
        ))

    return UserSearchListResponse(
        data=data, total=total, page=page, limit=limit,
    )


# --- User profile ---

@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a user's public profile."""
    result = await db.execute(
        select(User).options(selectinload(User.clubs)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    is_friend = False
    friend_query = select(friendship).where(
        or_(
            (friendship.c.user_id == current_user.id)
            & (friendship.c.friend_id == user_id),
            (friendship.c.user_id == user_id)
            & (friendship.c.friend_id == current_user.id),
        )
    )
    friend_result = await db.execute(friend_query)
    if friend_result.first():
        is_friend = True

    return UserProfileResponse(
        id=user.id,
        username=user.username,
        profile_image=user.profile_image,
        nationality=user.nationality,
        is_friend=is_friend,
    )


# --- Update profile ---

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user's profile."""
    update_data = user_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return current_user


# --- Bank account ---

@router.get("/me/bank-account", response_model=UserBankAccountResponse)
async def get_bank_account(
    current_user: User = Depends(get_current_user),
):
    """Get current user's bank account info."""
    return UserBankAccountResponse(
        bank_name=current_user.bank_name,
        bank_account_number=current_user.bank_account_number,
        account_holder_name=current_user.account_holder_name,
    )


@router.put("/me/bank-account", response_model=UserBankAccountResponse)
async def update_bank_account(
    data: UserBankAccountUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register or update bank account."""
    current_user.bank_name = data.bank_name
    current_user.bank_account_number = data.bank_account_number
    current_user.account_holder_name = data.account_holder_name
    await db.commit()
    await db.refresh(current_user)
    return UserBankAccountResponse(
        bank_name=current_user.bank_name,
        bank_account_number=current_user.bank_account_number,
        account_holder_name=current_user.account_holder_name,
    )


@router.delete("/me/bank-account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bank_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove bank account info."""
    current_user.bank_name = None
    current_user.bank_account_number = None
    current_user.account_holder_name = None
    await db.commit()


# --- Push token ---


@router.put("/me/push-token", status_code=status.HTTP_200_OK)
async def update_push_token(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register or update the user's Expo push token."""
    token = payload.get("push_token")
    current_user.push_token = token
    await db.commit()
    return {"status": "ok"}


@router.delete("/me/push-token", status_code=status.HTTP_204_NO_CONTENT)
async def delete_push_token(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove the user's push token (e.g. on logout)."""
    current_user.push_token = None
    await db.commit()


# --- Friends list ---

@router.get("/me/friends", response_model=UserFriendListResponse)
async def get_friends(
    q: Optional[str] = Query(None, description="Filter friends by username"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's friends list with common clubs."""
    offset = (page - 1) * limit

    friend_ids_query = select(friendship.c.friend_id).where(
        friendship.c.user_id == current_user.id
    )
    friend_ids_result = await db.execute(friend_ids_query)
    friend_ids = [row[0] for row in friend_ids_result.fetchall()]

    if not friend_ids:
        return UserFriendListResponse(data=[], total=0, page=page, limit=limit)

    friends_filter = [User.id.in_(friend_ids)]
    if q:
        friends_filter.append(User.username.ilike(f"%{q}%"))

    count_query = select(func.count(User.id)).where(*friends_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    friends_query = (
        select(User)
        .options(selectinload(User.clubs))
        .where(*friends_filter)
        .offset(offset)
        .limit(limit)
    )
    friends_result = await db.execute(friends_query)
    friends = friends_result.scalars().all()

    my_club_ids = await _get_my_club_ids(db, current_user.id)

    data = []
    for f in friends:
        data.append(UserFriendItemResponse(
            id=f.id,
            username=f.username,
            profile_image=f.profile_image,
            common_clubs=_common_clubs(f.clubs, my_club_ids),
        ))

    return UserFriendListResponse(
        data=data, total=total, page=page, limit=limit,
    )


# --- Send friend request ---

@router.post("/me/friends/{friend_id}", status_code=status.HTTP_201_CREATED)
async def send_friend_request(
    friend_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a friend request to another user."""
    if friend_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add yourself as friend",
        )

    # Check target exists
    result = await db.execute(select(User).where(User.id == friend_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check already friends
    existing_friend = await db.execute(
        select(friendship).where(
            (friendship.c.user_id == current_user.id)
            & (friendship.c.friend_id == friend_id)
        )
    )
    if existing_friend.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already friends",
        )

    # Check pending request already exists (either direction). The same block
    # is repeated after a possible IntegrityError to handle the race where A
    # and B both try to send a request simultaneously.
    async def _existing_pending():
        q = await db.execute(
            select(FriendRequest).where(
                FriendRequest.status == "pending",
                or_(
                    and_(
                        FriendRequest.from_user_id == current_user.id,
                        FriendRequest.to_user_id == friend_id,
                    ),
                    and_(
                        FriendRequest.from_user_id == friend_id,
                        FriendRequest.to_user_id == current_user.id,
                    ),
                ),
            )
        )
        return q.scalar_one_or_none()

    existing = await _existing_pending()
    if existing:
        # If THEY already sent us a request, auto-accept
        if existing.from_user_id == friend_id:
            return await _accept_request(db, existing, current_user)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Friend request already pending",
        )

    # Create new request. If a simultaneous request from the other side lands
    # first, we converge on "friends" by auto-accepting the inverse request.
    from sqlalchemy.exc import IntegrityError

    req = FriendRequest(
        from_user_id=current_user.id,
        to_user_id=friend_id,
    )
    db.add(req)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        existing = await _existing_pending()
        if existing and existing.from_user_id == friend_id:
            return await _accept_request(db, existing, current_user)
        # If the existing request is our own, treat as success (idempotent).
        if existing and existing.from_user_id == current_user.id:
            await db.refresh(existing)
            req = existing
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Friend request already pending",
            )
    await db.refresh(req)

    # WS notification
    await notify_friend_request(
        to_user_id=friend_id,
        request_id=req.id,
        from_user_id=current_user.id,
        from_username=current_user.username,
        from_profile_image=current_user.profile_image,
    )

    from app.services.push import send_push_to_user
    await send_push_to_user(
        db, friend_id,
        title="Friend Request",
        body=f"{current_user.username} sent you a friend request",
        data={"type": "friend_request", "request_id": str(req.id)},
    )

    return {"message": "Friend request sent", "request_id": str(req.id)}


# --- List incoming friend requests ---

@router.get("/me/friend-requests", response_model=FriendRequestListResponse)
async def get_friend_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get pending incoming friend requests."""
    query = (
        select(FriendRequest)
        .options(
            selectinload(FriendRequest.from_user).selectinload(User.clubs),
        )
        .where(
            FriendRequest.to_user_id == current_user.id,
            FriendRequest.status == "pending",
        )
        .order_by(FriendRequest.created_at.desc())
    )
    result = await db.execute(query)
    requests = result.scalars().all()

    my_club_ids = await _get_my_club_ids(db, current_user.id)

    data = []
    for r in requests:
        data.append(FriendRequestResponse(
            id=r.id,
            from_user=UserBriefResponse(
                id=r.from_user.id,
                username=r.from_user.username,
                profile_image=r.from_user.profile_image,
            ),
            to_user=UserBriefResponse(
                id=current_user.id,
                username=current_user.username,
                profile_image=current_user.profile_image,
            ),
            status=r.status,
            common_clubs=_common_clubs(r.from_user.clubs, my_club_ids),
            created_at=r.created_at,
        ))

    return FriendRequestListResponse(data=data, total=len(data))


# --- Accept / reject friend request ---

async def _accept_request(db: AsyncSession, req: FriendRequest, current_user: User):
    """Shared logic for accepting a friend request."""
    req.status = "accepted"

    # Create bidirectional friendship
    await db.execute(
        friendship.insert().values(user_id=req.from_user_id, friend_id=req.to_user_id)
    )
    await db.execute(
        friendship.insert().values(user_id=req.to_user_id, friend_id=req.from_user_id)
    )
    await db.commit()

    # Notify the requester
    await notify_friend_request_accepted(
        to_user_id=req.from_user_id,
        request_id=req.id,
        by_user_id=current_user.id,
        by_username=current_user.username,
        by_profile_image=current_user.profile_image,
    )

    from app.services.push import send_push_to_user
    await send_push_to_user(
        db, req.from_user_id,
        title="Friend Request Accepted",
        body=f"{current_user.username} accepted your friend request",
        data={"type": "friend_request_accepted", "by_user_id": str(current_user.id)},
    )

    return {"message": "Friend request accepted"}


@router.post("/me/friend-requests/{request_id}/accept")
async def accept_friend_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept a friend request."""
    result = await db.execute(
        select(FriendRequest).where(FriendRequest.id == request_id)
    )
    req = result.scalar_one_or_none()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.to_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your request")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already handled")

    return await _accept_request(db, req, current_user)


@router.post("/me/friend-requests/{request_id}/reject")
async def reject_friend_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject a friend request."""
    result = await db.execute(
        select(FriendRequest).where(FriendRequest.id == request_id)
    )
    req = result.scalar_one_or_none()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.to_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your request")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already handled")

    req.status = "rejected"
    await db.commit()

    return {"message": "Friend request rejected"}


# --- Remove friend ---

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deactivate and anonymize the current user's account."""
    import secrets

    # Remove friendships
    await db.execute(
        friendship.delete().where(
            or_(
                friendship.c.user_id == current_user.id,
                friendship.c.friend_id == current_user.id,
            )
        )
    )

    # Cancel pending friend requests
    await db.execute(
        select(FriendRequest).where(
            or_(
                FriendRequest.from_user_id == current_user.id,
                FriendRequest.to_user_id == current_user.id,
            ),
            FriendRequest.status == "pending",
        )
    )
    from sqlalchemy import update as sa_update
    await db.execute(
        sa_update(FriendRequest)
        .where(
            or_(
                FriendRequest.from_user_id == current_user.id,
                FriendRequest.to_user_id == current_user.id,
            ),
            FriendRequest.status == "pending",
        )
        .values(status="rejected")
    )

    # Remove club memberships
    await db.execute(
        user_club.delete().where(user_club.c.user_id == current_user.id)
    )

    # Anonymize and deactivate user
    random_suffix = secrets.token_hex(4)
    current_user.username = f"deleted_{random_suffix}"
    current_user.legal_name = "Deleted User"
    current_user.email = None
    current_user.student_id = None
    current_user.profile_image = None
    current_user.nationality = None
    current_user.bank_name = None
    current_user.bank_account_number = None
    current_user.account_holder_name = None
    current_user.is_active = False

    await db.commit()


@router.delete("/me/friends/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_friend(
    friend_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a friend (bidirectional)."""
    await db.execute(
        friendship.delete().where(
            (friendship.c.user_id == current_user.id)
            & (friendship.c.friend_id == friend_id)
        )
    )
    await db.execute(
        friendship.delete().where(
            (friendship.c.user_id == friend_id)
            & (friendship.c.friend_id == current_user.id)
        )
    )
    await db.commit()
