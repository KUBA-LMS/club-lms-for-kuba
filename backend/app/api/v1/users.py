from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, friendship
from app.schemas.user import (
    UserUpdate,
    UserResponse,
    UserBriefResponse,
    UserListResponse,
    UserProfileResponse,
)

router = APIRouter()


@router.get("/search", response_model=UserListResponse)
async def search_users(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search users by username or legal name."""
    offset = (page - 1) * limit
    search_term = f"%{q}%"

    # Count total
    count_query = select(func.count(User.id)).where(
        or_(
            User.username.ilike(search_term),
            User.legal_name.ilike(search_term),
        )
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get users
    query = (
        select(User)
        .where(
            or_(
                User.username.ilike(search_term),
                User.legal_name.ilike(search_term),
            )
        )
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        data=[
            UserBriefResponse(
                id=u.id, username=u.username, profile_image=u.profile_image
            )
            for u in users
        ],
        total=total,
        page=page,
        limit=limit,
    )


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

    # Check if they are friends
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


@router.get("/me/friends", response_model=UserListResponse)
async def get_friends(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's friends list."""
    offset = (page - 1) * limit

    # Get friend IDs
    friend_ids_query = select(friendship.c.friend_id).where(
        friendship.c.user_id == current_user.id
    )
    friend_ids_result = await db.execute(friend_ids_query)
    friend_ids = [row[0] for row in friend_ids_result.fetchall()]

    # Count total
    total = len(friend_ids)

    # Get friends with pagination
    if friend_ids:
        friends_query = (
            select(User).where(User.id.in_(friend_ids)).offset(offset).limit(limit)
        )
        friends_result = await db.execute(friends_query)
        friends = friends_result.scalars().all()
    else:
        friends = []

    return UserListResponse(
        data=[
            UserBriefResponse(
                id=f.id, username=f.username, profile_image=f.profile_image
            )
            for f in friends
        ],
        total=total,
        page=page,
        limit=limit,
    )


@router.post("/me/friends/{friend_id}", status_code=status.HTTP_201_CREATED)
async def add_friend(
    friend_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a user as friend."""
    if friend_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add yourself as friend",
        )

    # Check if user exists
    result = await db.execute(select(User).where(User.id == friend_id))
    friend = result.scalar_one_or_none()
    if not friend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check if already friends
    existing = await db.execute(
        select(friendship).where(
            (friendship.c.user_id == current_user.id)
            & (friendship.c.friend_id == friend_id)
        )
    )
    if existing.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already friends",
        )

    # Add friendship (bidirectional)
    await db.execute(
        friendship.insert().values(user_id=current_user.id, friend_id=friend_id)
    )
    await db.execute(
        friendship.insert().values(user_id=friend_id, friend_id=current_user.id)
    )
    await db.commit()

    return {"message": "Friend added successfully"}


@router.delete("/me/friends/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_friend(
    friend_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a friend."""
    # Remove both directions
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
