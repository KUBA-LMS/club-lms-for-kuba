from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.ticket import Ticket
from app.models.registration import Registration
from app.models.event import Event
from app.schemas.ticket import (
    TicketResponse,
    TicketBriefResponse,
    TicketListResponse,
    TicketValidateRequest,
    TicketValidateResponse,
    OnePassTicketResponse,
    OnePassListResponse,
    SelfCheckinRequest,
    CheckinResponse,
)
from app.schemas.registration import RegistrationBriefResponse, RegistrationStatusEnum
from app.schemas.event import EventBriefResponse

router = APIRouter()


@router.get("/", response_model=TicketListResponse)
async def list_my_tickets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List current user's tickets."""
    offset = (page - 1) * limit

    # Get registrations for current user that have tickets
    base_query = (
        select(Ticket)
        .join(Registration)
        .options(selectinload(Ticket.registration).selectinload(Registration.event))
        .where(Registration.user_id == current_user.id)
    )

    count_query = (
        select(func.count(Ticket.id))
        .join(Registration)
        .where(Registration.user_id == current_user.id)
    )

    # Get total
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get tickets
    query = base_query.order_by(Ticket.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    tickets = result.scalars().all()

    return TicketListResponse(
        data=[
            TicketResponse(
                id=t.id,
                barcode=t.barcode,
                is_used=t.is_used,
                used_at=t.used_at,
                registration=RegistrationBriefResponse(
                    id=t.registration.id,
                    status=t.registration.status,
                    payment_status=t.registration.payment_status,
                    event_id=t.registration.event_id,
                    created_at=t.registration.created_at,
                ),
                event_title=t.registration.event.title if t.registration.event else None,
                event_date=t.registration.event.event_date if t.registration.event else None,
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
            for t in tickets
        ],
        total=total,
    )


@router.get("/onepass", response_model=OnePassListResponse)
async def get_onepass_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all active tickets for OnePass display with event details."""
    base_query = (
        select(Ticket)
        .join(Registration)
        .join(Event, Registration.event_id == Event.id)
        .options(
            selectinload(Ticket.registration).selectinload(Registration.event)
        )
        .where(
            Registration.user_id == current_user.id,
            Registration.status.in_(["confirmed", "checked_in"]),
        )
        .order_by(Event.event_date.asc())
    )

    result = await db.execute(base_query)
    tickets = result.scalars().all()

    return OnePassListResponse(
        data=[
            OnePassTicketResponse(
                id=t.id,
                barcode=t.barcode,
                is_used=t.is_used,
                used_at=t.used_at,
                registration_id=t.registration.id,
                registration_status=t.registration.status,
                event=EventBriefResponse(
                    id=t.registration.event.id,
                    title=t.registration.event.title,
                    event_date=t.registration.event.event_date,
                    event_type=t.registration.event.event_type,
                    cost_type=t.registration.event.cost_type,
                    images=t.registration.event.images or [],
                    current_slots=t.registration.event.current_slots,
                    max_slots=t.registration.event.max_slots,
                ),
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
            for t in tickets
        ],
        total=len(tickets),
    )


@router.post("/checkin", response_model=CheckinResponse)
async def self_checkin(
    checkin_data: SelfCheckinRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Self check-in by scanning barcode.

    Uses ``with_for_update`` to serialize concurrent scans of the same barcode
    so that the second scanner receives "already used" instead of both writing
    ``is_used = True`` successfully.
    """
    result = await db.execute(
        select(Ticket)
        .options(
            selectinload(Ticket.registration).selectinload(Registration.event),
            selectinload(Ticket.registration).selectinload(Registration.user),
        )
        .where(Ticket.barcode == checkin_data.barcode)
        .with_for_update()
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        return CheckinResponse(success=False, message="Ticket not found")

    # Regular users can self-checkin their own ticket.
    # Admins/leads of the event's club can also check-in on behalf of a user.
    if ticket.registration.user_id != current_user.id:
        from app.core.security import verify_club_admin
        try:
            await verify_club_admin(db, current_user, ticket.registration.event.club_id)
        except HTTPException:
            return CheckinResponse(success=False, message="This ticket does not belong to you")

    if ticket.is_used:
        return CheckinResponse(
            success=False,
            message=f"Ticket already used at {ticket.used_at}",
        )

    event = ticket.registration.event
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if event.event_date.date() > now.date():
        return CheckinResponse(success=False, message="Event has not started yet")

    ticket.is_used = True
    ticket.used_at = now
    ticket.registration.status = RegistrationStatusEnum.checked_in
    ticket.registration.checked_in_at = now

    await db.commit()
    await db.refresh(ticket)

    return CheckinResponse(
        success=True,
        message="Check-in Complete",
        ticket=OnePassTicketResponse(
            id=ticket.id,
            barcode=ticket.barcode,
            is_used=ticket.is_used,
            used_at=ticket.used_at,
            registration_id=ticket.registration.id,
            registration_status=ticket.registration.status,
            event=EventBriefResponse(
                id=event.id,
                title=event.title,
                event_date=event.event_date,
                event_type=event.event_type,
                cost_type=event.cost_type,
                images=event.images or [],
                current_slots=event.current_slots,
                max_slots=event.max_slots,
            ),
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
        ),
    )


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific ticket."""
    result = await db.execute(
        select(Ticket)
        .options(selectinload(Ticket.registration).selectinload(Registration.event))
        .where(Ticket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    # Check ownership or club admin/lead scope.
    if ticket.registration.user_id != current_user.id and current_user.role != "superadmin":
        from app.core.security import verify_club_admin
        await verify_club_admin(db, current_user, ticket.registration.event.club_id)

    return TicketResponse(
        id=ticket.id,
        barcode=ticket.barcode,
        is_used=ticket.is_used,
        used_at=ticket.used_at,
        registration=RegistrationBriefResponse(
            id=ticket.registration.id,
            status=ticket.registration.status,
            payment_status=ticket.registration.payment_status,
            event_id=ticket.registration.event_id,
            created_at=ticket.registration.created_at,
        ),
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


@router.post("/validate", response_model=TicketValidateResponse)
async def validate_ticket(
    validate_request: TicketValidateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Validate a ticket by barcode (typically for check-in)."""
    result = await db.execute(
        select(Ticket)
        .options(
            selectinload(Ticket.registration)
            .selectinload(Registration.event),
            selectinload(Ticket.registration).selectinload(Registration.user),
        )
        .where(Ticket.barcode == validate_request.barcode)
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        return TicketValidateResponse(
            valid=False,
            message="Ticket not found",
            ticket=None,
        )

    # Only the event's club admin/lead (or superadmin) may validate this ticket.
    if current_user.role != "superadmin":
        from app.core.security import verify_club_admin
        await verify_club_admin(db, current_user, ticket.registration.event.club_id)

    if ticket.is_used:
        return TicketValidateResponse(
            valid=False,
            message=f"Ticket already used at {ticket.used_at}",
            ticket=TicketResponse(
                id=ticket.id,
                barcode=ticket.barcode,
                is_used=ticket.is_used,
                used_at=ticket.used_at,
                registration=RegistrationBriefResponse(
                    id=ticket.registration.id,
                    status=ticket.registration.status,
                    payment_status=ticket.registration.payment_status,
                    event_id=ticket.registration.event_id,
                    created_at=ticket.registration.created_at,
                ),
                created_at=ticket.created_at,
                updated_at=ticket.updated_at,
            ),
        )

    # Check if event date is today or in the past
    event = ticket.registration.event
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if event.event_date.date() > now.date():
        return TicketValidateResponse(
            valid=False,
            message="Event has not started yet",
            ticket=TicketResponse(
                id=ticket.id,
                barcode=ticket.barcode,
                is_used=ticket.is_used,
                used_at=ticket.used_at,
                registration=RegistrationBriefResponse(
                    id=ticket.registration.id,
                    status=ticket.registration.status,
                    payment_status=ticket.registration.payment_status,
                    event_id=ticket.registration.event_id,
                    created_at=ticket.registration.created_at,
                ),
                created_at=ticket.created_at,
                updated_at=ticket.updated_at,
            ),
        )

    return TicketValidateResponse(
        valid=True,
        message="Ticket is valid",
        ticket=TicketResponse(
            id=ticket.id,
            barcode=ticket.barcode,
            is_used=ticket.is_used,
            used_at=ticket.used_at,
            registration=RegistrationBriefResponse(
                id=ticket.registration.id,
                status=ticket.registration.status,
                payment_status=ticket.registration.payment_status,
                event_id=ticket.registration.event_id,
                created_at=ticket.registration.created_at,
            ),
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
        ),
    )


@router.post("/{ticket_id}/use", response_model=TicketResponse)
async def use_ticket(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a ticket as used (admin/lead of the event's club only)."""
    result = await db.execute(
        select(Ticket)
        .options(
            selectinload(Ticket.registration).selectinload(Registration.event),
        )
        .where(Ticket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    if current_user.role != "superadmin":
        from app.core.security import verify_club_admin
        await verify_club_admin(db, current_user, ticket.registration.event.club_id)

    if ticket.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket is already used",
        )

    ticket.is_used = True
    ticket.used_at = datetime.now(timezone.utc).replace(tzinfo=None)

    # Also update registration status
    ticket.registration.status = RegistrationStatusEnum.checked_in
    ticket.registration.checked_in_at = datetime.now(timezone.utc).replace(tzinfo=None)

    await db.commit()
    await db.refresh(ticket)

    return TicketResponse(
        id=ticket.id,
        barcode=ticket.barcode,
        is_used=ticket.is_used,
        used_at=ticket.used_at,
        registration=RegistrationBriefResponse(
            id=ticket.registration.id,
            status=ticket.registration.status,
            payment_status=ticket.registration.payment_status,
            event_id=ticket.registration.event_id,
            created_at=ticket.registration.created_at,
        ),
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )
