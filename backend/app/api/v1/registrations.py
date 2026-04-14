import logging
import secrets
import uuid as uuid_lib
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration
from app.models.ticket import Ticket
from app.schemas.registration import (
    RegistrationCreate,
    RegistrationResponse,
    RegistrationListResponse,
    RegistrationStatusEnum,
    PaymentStatusEnum,
)
from app.schemas.user import UserBriefResponse
from app.schemas.event import EventBriefResponse
from app.services.notifications import (
    notify_event_updated,
    notify_registration_changed,
    notify_participants_changed,
    notify_participants_preview_changed,
)

router = APIRouter()


def build_registration_response(reg: Registration) -> RegistrationResponse:
    """Helper to build RegistrationResponse."""
    return RegistrationResponse(
        id=reg.id,
        status=reg.status,
        payment_status=reg.payment_status,
        checked_in_at=reg.checked_in_at,
        user=UserBriefResponse(
            id=reg.user.id,
            username=reg.user.username,
            profile_image=reg.user.profile_image,
        ),
        event=EventBriefResponse(
            id=reg.event.id,
            title=reg.event.title,
            event_date=reg.event.event_date,
            event_type=reg.event.event_type,
            cost_type=reg.event.cost_type,
            images=reg.event.images or [],
            current_slots=reg.event.current_slots,
            max_slots=reg.event.max_slots,
        ),
        created_at=reg.created_at,
        updated_at=reg.updated_at,
    )


@router.post("/", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def create_registration(
    reg_data: RegistrationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register for an event."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)  # naive UTC for DB comparison

    # Lock event row to prevent concurrent slot overbooking
    event_result = await db.execute(
        select(Event).where(Event.id == reg_data.event_id).with_for_update()
    )
    event = event_result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # Check registration window
    if now < event.registration_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration has not started yet",
        )

    if now > event.registration_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration has ended",
        )

    # Check if already registered
    existing = await db.execute(
        select(Registration).where(
            (Registration.user_id == current_user.id)
            & (Registration.event_id == reg_data.event_id)
            & (Registration.status != RegistrationStatusEnum.cancelled)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered for this event",
        )

    # Re-check slots under lock (prevents overbooking race condition)
    if event.current_slots >= event.max_slots:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is full",
        )

    # Determine initial status based on cost type
    initial_status = RegistrationStatusEnum.pending
    payment_status = PaymentStatusEnum.pending

    if event.cost_type == "free":
        initial_status = RegistrationStatusEnum.confirmed
        payment_status = PaymentStatusEnum.completed

    # Create registration
    new_registration = Registration(
        user_id=current_user.id,
        event_id=reg_data.event_id,
        status=initial_status,
        payment_status=payment_status,
    )

    db.add(new_registration)

    # Update event slots (safe under row lock)
    event.current_slots += 1

    # Create ticket if confirmed
    if initial_status == RegistrationStatusEnum.confirmed:
        await db.flush()  # ensure registration.id is assigned
        barcode = str(secrets.randbelow(10**12 - 10**11) + 10**11)
        ticket = Ticket(
            registration_id=new_registration.id,
            barcode=barcode,
        )
        db.add(ticket)

    await db.commit()

    # Real-time notifications
    await notify_event_updated(reg_data.event_id, event.current_slots, event.max_slots)
    await notify_registration_changed(
        current_user.id, reg_data.event_id, new_registration.id, initial_status,
    )
    await notify_participants_changed(reg_data.event_id)
    await notify_participants_preview_changed(reg_data.event_id)

    # Reload with relationships
    result = await db.execute(
        select(Registration)
        .options(
            selectinload(Registration.user),
            selectinload(Registration.event),
        )
        .where(Registration.id == new_registration.id)
    )
    registration = result.scalar_one()

    return build_registration_response(registration)


@router.get("/", response_model=RegistrationListResponse)
async def list_my_registrations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[RegistrationStatusEnum] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List current user's registrations."""
    offset = (page - 1) * limit

    base_query = (
        select(Registration)
        .options(
            selectinload(Registration.user),
            selectinload(Registration.event),
        )
        .where(Registration.user_id == current_user.id)
    )
    count_query = select(func.count(Registration.id)).where(
        Registration.user_id == current_user.id
    )

    if status:
        base_query = base_query.where(Registration.status == status)
        count_query = count_query.where(Registration.status == status)

    # Get total
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get registrations
    query = base_query.order_by(Registration.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    registrations = result.scalars().all()

    return RegistrationListResponse(
        data=[build_registration_response(r) for r in registrations],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{registration_id}", response_model=RegistrationResponse)
async def get_registration(
    registration_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific registration."""
    result = await db.execute(
        select(Registration)
        .options(
            selectinload(Registration.user),
            selectinload(Registration.event),
        )
        .where(Registration.id == registration_id)
    )
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found",
        )

    # Only allow owner, superadmin, or admin/lead of the event's club to view.
    if registration.user_id != current_user.id and current_user.role != "superadmin":
        from app.core.security import verify_club_admin
        # verify_club_admin raises 403 when the caller is not admin/lead of this club
        await verify_club_admin(db, current_user, registration.event.club_id)

    return build_registration_response(registration)


@router.post("/{registration_id}/cancel", response_model=RegistrationResponse)
async def cancel_registration(
    registration_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a registration."""
    result = await db.execute(
        select(Registration)
        .options(
            selectinload(Registration.user),
            selectinload(Registration.event),
        )
        .where(Registration.id == registration_id)
    )
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found",
        )

    # Only allow owner to cancel
    if registration.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this registration",
        )

    if registration.status == RegistrationStatusEnum.cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is already cancelled",
        )

    if registration.status == RegistrationStatusEnum.checked_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel after check-in",
        )

    # Cancel registration
    registration.status = RegistrationStatusEnum.cancelled

    # Update event slots (lock row to prevent concurrent modification)
    event_result = await db.execute(
        select(Event).where(Event.id == registration.event_id).with_for_update()
    )
    event = event_result.scalar_one()
    if event.current_slots > 0:
        event.current_slots -= 1

    await db.commit()
    await db.refresh(registration)

    # Real-time notifications
    await notify_event_updated(registration.event_id, event.current_slots, event.max_slots)
    await notify_registration_changed(
        current_user.id, registration.event_id, registration.id, "cancelled",
    )
    await notify_participants_changed(registration.event_id)
    await notify_participants_preview_changed(registration.event_id)

    return build_registration_response(registration)


@router.post("/{registration_id}/checkin", response_model=RegistrationResponse)
async def checkin_registration(
    registration_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check in a registration (admin only or self)."""
    result = await db.execute(
        select(Registration)
        .options(
            selectinload(Registration.user),
            selectinload(Registration.event),
        )
        .where(Registration.id == registration_id)
    )
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found",
        )

    # Allow admin or owner
    if registration.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to check in this registration",
        )

    if registration.status != RegistrationStatusEnum.confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration must be confirmed before check-in",
        )

    registration.status = RegistrationStatusEnum.checked_in
    registration.checked_in_at = datetime.now(timezone.utc).replace(tzinfo=None)

    await db.commit()
    await db.refresh(registration)

    return build_registration_response(registration)
