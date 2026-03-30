from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.models.user import User, user_club
from app.services.notifications import notify_member_joined
from app.models.club import Club
from app.schemas.club import (
    ClubCreate,
    ClubUpdate,
    ClubResponse,
    ClubBriefResponse,
    ClubListResponse,
    MyClubResponse,
    SubgroupBriefResponse,
    JoinClubRequest,
)

router = APIRouter()


@router.get("/me/admin")
async def get_my_admin_clubs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return clubs where the current user is admin or lead."""
    if current_user.role == "superadmin":
        result = await db.execute(select(Club.id, Club.name).order_by(Club.name))
        return [{"id": str(cid), "name": cname} for cid, cname in result.fetchall()]

    result = await db.execute(
        select(Club.id, Club.name, user_club.c.role)
        .join(user_club, user_club.c.club_id == Club.id)
        .where(
            user_club.c.user_id == current_user.id,
            user_club.c.role.in_(["admin", "lead"]),
        )
        .order_by(Club.name)
    )
    return [{"id": str(cid), "name": cname, "role": role} for cid, cname, role in result.fetchall()]


@router.get("/me", response_model=list[MyClubResponse])
async def get_my_clubs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get clubs the current user belongs to, with role and subgroups."""
    # Get all clubs user belongs to, with their roles
    result = await db.execute(
        select(Club, user_club.c.role)
        .join(user_club, user_club.c.club_id == Club.id)
        .where(user_club.c.user_id == current_user.id)
        .order_by(Club.name)
    )
    rows = result.all()

    # Separate top-level groups and subgroups
    club_roles = {row[0].id: row[1] for row in rows}
    user_club_ids = set(club_roles.keys())

    # Get top-level clubs (no parent) user belongs to
    top_level = [row[0] for row in rows if row[0].parent_id is None]

    # For each top-level club, fetch subgroups that the user is also a member of
    responses = []
    for club in top_level:
        # Get subgroups of this club
        sub_result = await db.execute(
            select(Club).where(Club.parent_id == club.id).order_by(Club.name)
        )
        all_subgroups = sub_result.scalars().all()

        # Filter to subgroups user is a member of
        sub_responses = []
        for sg in all_subgroups:
            if sg.id in user_club_ids:
                sub_responses.append(
                    SubgroupBriefResponse(
                        id=sg.id,
                        name=sg.name,
                        logo_image=sg.logo_image,
                        role=club_roles.get(sg.id, "member"),
                    )
                )

        responses.append(
            MyClubResponse(
                id=club.id,
                name=club.name,
                logo_image=club.logo_image,
                role=club_roles.get(club.id, "member"),
                subgroups=sub_responses,
            )
        )

    # Also include subgroups where user is a member but NOT a member of the parent
    subgroup_clubs = [row[0] for row in rows if row[0].parent_id is not None]
    for sg in subgroup_clubs:
        if sg.parent_id not in user_club_ids:
            # User is in subgroup but not parent; show as top-level entry
            responses.append(
                MyClubResponse(
                    id=sg.id,
                    name=sg.name,
                    logo_image=sg.logo_image,
                    role=club_roles.get(sg.id, "member"),
                    subgroups=[],
                )
            )

    return responses


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
                parent_id=club.parent_id,
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
        parent_id=club.parent_id,
        created_at=club.created_at,
        updated_at=club.updated_at,
        member_count=member_count,
    )


@router.post("/", response_model=ClubResponse, status_code=status.HTTP_201_CREATED)
async def create_club(
    club_data: ClubCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new club/group. Any user can create a top-level club. Subgroups require admin/lead of parent."""
    from app.core.security import verify_club_admin

    # Subgroup: verify user is admin/lead of the parent club
    if club_data.parent_id:
        parent_result = await db.execute(
            select(Club).where(Club.id == club_data.parent_id)
        )
        if not parent_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent club not found",
            )
        await verify_club_admin(db, current_user, club_data.parent_id)

    # Check if club name already exists
    result = await db.execute(select(Club).where(Club.name == club_data.name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Club name already exists",
        )

    new_club = Club(**club_data.model_dump())
    db.add(new_club)
    await db.flush()

    # Auto-add creator as lead
    await db.execute(
        user_club.insert().values(
            user_id=current_user.id, club_id=new_club.id, role="lead"
        )
    )
    await db.commit()
    await db.refresh(new_club)

    return ClubResponse(
        id=new_club.id,
        name=new_club.name,
        description=new_club.description,
        logo_image=new_club.logo_image,
        university=new_club.university,
        parent_id=new_club.parent_id,
        created_at=new_club.created_at,
        updated_at=new_club.updated_at,
        member_count=1,
    )


@router.put("/{club_id}", response_model=ClubResponse)
async def update_club(
    club_id: UUID,
    club_update: ClubUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a club (admin/lead of this club only)."""
    from app.core.security import verify_club_admin
    await verify_club_admin(db, current_user, club_id)
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
        parent_id=club.parent_id,
        created_at=club.created_at,
        updated_at=club.updated_at,
        member_count=member_count,
    )


@router.delete("/{club_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_club(
    club_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a club (admin/lead of this club only)."""
    from app.core.security import verify_club_admin
    await verify_club_admin(db, current_user, club_id)
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

    # Insert with ON CONFLICT DO NOTHING to handle race conditions atomically
    result = await db.execute(
        pg_insert(user_club)
        .values(user_id=current_user.id, club_id=club_id, role="member")
        .on_conflict_do_nothing(index_elements=["user_id", "club_id"])
        .returning(user_club.c.user_id)
    )
    await db.commit()

    already_member = result.first() is None
    if already_member:
        return {
            "message": "Already a member of this club",
            "club": {"id": str(club.id), "name": club.name},
        }

    # Notify club channel subscribers in real-time
    await notify_member_joined(
        club_id=club_id,
        user_id=current_user.id,
        username=current_user.username,
        profile_image=current_user.profile_image,
    )

    return {
        "message": "Successfully joined club",
        "club": {"id": str(club.id), "name": club.name},
    }


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
