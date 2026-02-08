from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.models.user import User, user_club
from app.models.club import Club
from app.schemas.club import (
    ClubCreate,
    ClubUpdate,
    ClubResponse,
    ClubBriefResponse,
    ClubListResponse,
    JoinClubRequest,
)

router = APIRouter()


@router.get("/", response_model=ClubListResponse)
async def list_clubs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all clubs with pagination."""
    offset = (page - 1) * limit

    # Build base query
    base_query = select(Club)
    count_query = select(func.count(Club.id))

    if search:
        search_term = f"%{search}%"
        base_query = base_query.where(Club.name.ilike(search_term))
        count_query = count_query.where(Club.name.ilike(search_term))

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get clubs
    query = base_query.offset(offset).limit(limit)
    result = await db.execute(query)
    clubs = result.scalars().all()

    # Get member counts
    club_responses = []
    for club in clubs:
        member_count_query = select(func.count(user_club.c.user_id)).where(
            user_club.c.club_id == club.id
        )
        member_count_result = await db.execute(member_count_query)
        member_count = member_count_result.scalar()

        club_responses.append(
            ClubResponse(
                id=club.id,
                name=club.name,
                description=club.description,
                logo_image=club.logo_image,
                university=club.university,
                created_at=club.created_at,
                updated_at=club.updated_at,
                member_count=member_count,
            )
        )

    return ClubListResponse(data=club_responses, total=total, page=page, limit=limit)


@router.get("/{club_id}", response_model=ClubResponse)
async def get_club(
    club_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get club details."""
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()

    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found",
        )

    # Get member count
    member_count_query = select(func.count(user_club.c.user_id)).where(
        user_club.c.club_id == club.id
    )
    member_count_result = await db.execute(member_count_query)
    member_count = member_count_result.scalar()

    return ClubResponse(
        id=club.id,
        name=club.name,
        description=club.description,
        logo_image=club.logo_image,
        university=club.university,
        created_at=club.created_at,
        updated_at=club.updated_at,
        member_count=member_count,
    )


@router.post("/", response_model=ClubResponse, status_code=status.HTTP_201_CREATED)
async def create_club(
    club_data: ClubCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Create a new club (admin only)."""
    # Check if club name already exists
    result = await db.execute(select(Club).where(Club.name == club_data.name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Club name already exists",
        )

    new_club = Club(**club_data.model_dump())
    db.add(new_club)
    await db.commit()
    await db.refresh(new_club)

    return ClubResponse(
        id=new_club.id,
        name=new_club.name,
        description=new_club.description,
        logo_image=new_club.logo_image,
        university=new_club.university,
        created_at=new_club.created_at,
        updated_at=new_club.updated_at,
        member_count=0,
    )


@router.put("/{club_id}", response_model=ClubResponse)
async def update_club(
    club_id: UUID,
    club_update: ClubUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Update a club (admin only)."""
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()

    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found",
        )

    update_data = club_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(club, field, value)

    await db.commit()
    await db.refresh(club)

    # Get member count
    member_count_query = select(func.count(user_club.c.user_id)).where(
        user_club.c.club_id == club.id
    )
    member_count_result = await db.execute(member_count_query)
    member_count = member_count_result.scalar()

    return ClubResponse(
        id=club.id,
        name=club.name,
        description=club.description,
        logo_image=club.logo_image,
        university=club.university,
        created_at=club.created_at,
        updated_at=club.updated_at,
        member_count=member_count,
    )


@router.delete("/{club_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_club(
    club_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Delete a club (admin only)."""
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()

    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found",
        )

    await db.delete(club)
    await db.commit()


@router.post("/{club_id}/join", status_code=status.HTTP_201_CREATED)
async def join_club(
    club_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Join a club."""
    # Check if club exists
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()

    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found",
        )

    # Check if already a member
    existing = await db.execute(
        select(user_club).where(
            (user_club.c.user_id == current_user.id) & (user_club.c.club_id == club_id)
        )
    )
    if existing.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already a member of this club",
        )

    # Join club
    await db.execute(
        user_club.insert().values(user_id=current_user.id, club_id=club_id)
    )
    await db.commit()

    return {"message": "Successfully joined club"}


@router.delete("/{club_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_club(
    club_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Leave a club."""
    # Check if member
    existing = await db.execute(
        select(user_club).where(
            (user_club.c.user_id == current_user.id) & (user_club.c.club_id == club_id)
        )
    )
    if not existing.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not a member of this club",
        )

    await db.execute(
        user_club.delete().where(
            (user_club.c.user_id == current_user.id) & (user_club.c.club_id == club_id)
        )
    )
    await db.commit()


@router.get("/{club_id}/members", response_model=list)
async def get_club_members(
    club_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get members of a club."""
    offset = (page - 1) * limit

    # Check if club exists
    result = await db.execute(select(Club).where(Club.id == club_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found",
        )

    # Get member user IDs
    member_ids_query = (
        select(user_club.c.user_id)
        .where(user_club.c.club_id == club_id)
        .offset(offset)
        .limit(limit)
    )
    member_ids_result = await db.execute(member_ids_query)
    member_ids = [row[0] for row in member_ids_result.fetchall()]

    if not member_ids:
        return []

    # Get users
    users_query = select(User).where(User.id.in_(member_ids))
    users_result = await db.execute(users_query)
    users = users_result.scalars().all()

    return [
        {"id": u.id, "username": u.username, "profile_image": u.profile_image}
        for u in users
    ]
