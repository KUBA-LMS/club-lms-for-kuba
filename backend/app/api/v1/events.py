from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.club import Club
from app.models.event import Event
from app.models.registration import Registration
from app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventBriefResponse,
    EventListResponse,
    EventFilterEnum,
    EventTypeEnum,
)
from app.schemas.user import UserBriefResponse
from app.schemas.club import ClubBriefResponse

router = APIRouter()


def build_event_response(event: Event) -> EventResponse:
    """Helper to build EventResponse from Event model."""
    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        images=event.images or [],
        event_type=event.event_type,
        cost_type=event.cost_type,
        cost_amount=event.cost_amount,
        registration_start=event.registration_start,
        registration_end=event.registration_end,
        event_date=event.event_date,
        event_location=event.event_location,
        max_slots=event.max_slots,
        current_slots=event.current_slots,
        provided_by=UserBriefResponse(
            id=event.provider.id,
            username=event.provider.username,
            profile_image=event.provider.profile_image,
        ),
        posted_by=UserBriefResponse(
            id=event.poster.id,
            username=event.poster.username,
            profile_image=event.poster.profile_image,
        ),
        club=ClubBriefResponse(
            id=event.club.id,
            name=event.club.name,
            logo_image=event.club.logo_image,
        ),
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


@router.get("/", response_model=EventListResponse)
async def list_events(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    filter: EventFilterEnum = EventFilterEnum.upcoming,
    event_type: Optional[EventTypeEnum] = None,
    club_id: Optional[UUID] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List events with filtering and pagination."""
    offset = (page - 1) * limit
    now = datetime.utcnow()

    # Build base query
    base_query = select(Event).options(
        selectinload(Event.provider),
        selectinload(Event.poster),
        selectinload(Event.club),
    )
    count_query = select(func.count(Event.id))

    conditions = []

    # Filter by time
    if filter == EventFilterEnum.upcoming:
        conditions.append(Event.event_date >= now)
    elif filter == EventFilterEnum.past:
        conditions.append(Event.event_date < now)

    # Filter by event type
    if event_type:
        conditions.append(Event.event_type == event_type)

    # Filter by club
    if club_id:
        conditions.append(Event.club_id == club_id)

    # Search
    if search:
        search_term = f"%{search}%"
        conditions.append(Event.title.ilike(search_term))

    if conditions:
        base_query = base_query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get events
    query = base_query.order_by(Event.event_date.asc()).offset(offset).limit(limit)
    result = await db.execute(query)
    events = result.scalars().all()

    return EventListResponse(
        data=[build_event_response(e) for e in events],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get event details."""
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.provider),
            selectinload(Event.poster),
            selectinload(Event.club),
        )
        .where(Event.id == event_id)
    )
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    return build_event_response(event)


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Create a new event (admin only)."""
    # Verify club exists
    club_result = await db.execute(select(Club).where(Club.id == event_data.club_id))
    if not club_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found",
        )

    # Validate dates
    if event_data.registration_end <= event_data.registration_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration end must be after registration start",
        )

    if event_data.event_date <= event_data.registration_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event date must be after registration end",
        )

    new_event = Event(
        **event_data.model_dump(),
        provided_by=current_user.id,
        posted_by=current_user.id,
        current_slots=0,
    )

    db.add(new_event)
    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.provider),
            selectinload(Event.poster),
            selectinload(Event.club),
        )
        .where(Event.id == new_event.id)
    )
    event = result.scalar_one()

    return build_event_response(event)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: UUID,
    event_update: EventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Update an event (admin only)."""
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.provider),
            selectinload(Event.poster),
            selectinload(Event.club),
        )
        .where(Event.id == event_id)
    )
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    update_data = event_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    await db.commit()
    await db.refresh(event)

    return build_event_response(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Delete an event (admin only)."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    await db.delete(event)
    await db.commit()


@router.get("/{event_id}/registrations")
async def get_event_registrations(
    event_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get registrations for an event (admin only)."""
    offset = (page - 1) * limit

    # Verify event exists
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    if not event_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # Count total
    count_query = select(func.count(Registration.id)).where(
        Registration.event_id == event_id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get registrations
    query = (
        select(Registration)
        .options(selectinload(Registration.user))
        .where(Registration.event_id == event_id)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    registrations = result.scalars().all()

    return {
        "data": [
            {
                "id": r.id,
                "status": r.status,
                "payment_status": r.payment_status,
                "checked_in_at": r.checked_in_at,
                "user": {
                    "id": r.user.id,
                    "username": r.user.username,
                    "profile_image": r.user.profile_image,
                },
                "created_at": r.created_at,
            }
            for r in registrations
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }
