import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration
from app.models.ticket import Ticket
from app.schemas.access_control import (
    ScanRequest,
    ScanResponse,
    ScanResultEnum,
    TicketStatusEnum,
    ParticipantResponse,
    ParticipantsListResponse,
    OverrideResponse,
    WalkInRequest,
    UserSearchResponse,
)
from app.schemas.club import ClubBriefResponse
from app.schemas.registration import RegistrationStatusEnum
from app.services.notifications import (
    notify_event_updated,
    notify_registration_changed,
    notify_participants_changed,
    notify_checkin,
)

router = APIRouter()


def _build_participant(user: User, registration: Optional[Registration] = None) -> ParticipantResponse:
    """Build ParticipantResponse from User and optional Registration."""
    ticket_status = TicketStatusEnum.not_applied
    registration_id = None
    registration_status = None
    checked_in_at = None

    if registration:
        registration_id = registration.id
        registration_status = registration.status
        checked_in_at = registration.checked_in_at

        if registration.status == "checked_in":
            ticket_status = TicketStatusEnum.checked_in
        elif registration.status == "confirmed":
            ticket_status = TicketStatusEnum.registered
        elif registration.status == "pending":
            ticket_status = TicketStatusEnum.requested

    clubs = [
        ClubBriefResponse(id=c.id, name=c.name, logo_image=c.logo_image)
        for c in (user.clubs or [])
    ]

    return ParticipantResponse(
        user_id=user.id,
        username=user.username,
        legal_name=user.legal_name,
        student_id=user.student_id,
        profile_image=user.profile_image,
        nationality=user.nationality,
        gender=user.gender,
        registration_id=registration_id,
        registration_status=registration_status,
        ticket_status=ticket_status,
        checked_in_at=checked_in_at,
        clubs=clubs,
    )


@router.post("/{event_id}/scan", response_model=ScanResponse)
async def scan_barcode(
    event_id: UUID,
    scan_data: ScanRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """Scan a barcode at event entrance for check-in."""
    # Verify event exists
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Find ticket by barcode (try as-is first, then with CLX-/KUBA- prefix for legacy)
    barcode_value = scan_data.barcode
    ticket_result = await db.execute(
        select(Ticket)
        .options(
            selectinload(Ticket.registration).selectinload(Registration.user).selectinload(User.clubs),
            selectinload(Ticket.registration).selectinload(Registration.event),
        )
        .where(Ticket.barcode.in_([barcode_value, f"CLX-{barcode_value}", f"KUBA-{barcode_value}"]))
    )
    ticket = ticket_result.scalar_one_or_none()

    if not ticket:
        # Fallback: try interpreting barcode as user ID (auto_selection mode)
        print(f"[SCAN DEBUG] barcode='{scan_data.barcode}' event_id={event_id}")
        try:
            user_id = UUID(scan_data.barcode)
        except (ValueError, AttributeError) as e:
            print(f"[SCAN DEBUG] UUID parse failed: {e}")
            return ScanResponse(
                result=ScanResultEnum.entry_denied_no_ticket,
                message="Ticket not found",
            )

        print(f"[SCAN DEBUG] parsed user_id={user_id}")
        reg_result = await db.execute(
            select(Registration)
            .options(
                selectinload(Registration.user).selectinload(User.clubs),
                selectinload(Registration.ticket),
            )
            .where(
                Registration.user_id == user_id,
                Registration.event_id == event_id,
                Registration.status != RegistrationStatusEnum.cancelled,
            )
        )
        registration = reg_result.scalar_one_or_none()
        print(f"[SCAN DEBUG] registration={registration}, ticket={registration.ticket if registration else None}, status={registration.status if registration else None}")

        if not registration:
            return ScanResponse(
                result=ScanResultEnum.entry_denied_no_ticket,
                message="No registration found for this user at this event",
            )

        if not registration.ticket:
            # Registration exists but no ticket (e.g. pending payment)
            participant = _build_participant(registration.user, registration)
            if registration.status == "pending":
                return ScanResponse(
                    result=ScanResultEnum.entry_denied_pending,
                    message="Registration Requested - Not yet approved",
                    participant=participant,
                )
            return ScanResponse(
                result=ScanResultEnum.entry_denied_no_ticket,
                message="No ticket for this registration",
                participant=participant,
            )

        ticket = registration.ticket
    else:
        # Verify ticket belongs to this event
        if ticket.registration.event_id != event_id:
            return ScanResponse(
                result=ScanResultEnum.entry_denied_no_ticket,
                message="Ticket does not belong to this event",
            )

    user = ticket.registration.user
    registration = ticket.registration
    participant = _build_participant(user, registration)

    # Already used
    if ticket.is_used:
        return ScanResponse(
            result=ScanResultEnum.double_checked_in,
            message="Double Checked-in",
            participant=participant,
        )

    # Pending registration
    if registration.status == "pending":
        return ScanResponse(
            result=ScanResultEnum.entry_denied_pending,
            message="Registration Requested - Not yet approved",
            participant=participant,
        )

    # Confirmed -> approve entry
    if registration.status == "confirmed":
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        ticket.is_used = True
        ticket.used_at = now
        registration.status = RegistrationStatusEnum.checked_in
        registration.checked_in_at = now
        await db.commit()

        # Real-time notifications
        await notify_checkin(event_id, user.id, user.username)
        await notify_participants_changed(event_id)
        await notify_registration_changed(
            user.id, event_id, registration.id, "checked_in",
        )

        # Rebuild participant with updated status
        participant = _build_participant(user, registration)

        return ScanResponse(
            result=ScanResultEnum.entry_approved,
            message="Entry Approved",
            participant=participant,
        )

    # Any other status
    return ScanResponse(
        result=ScanResultEnum.entry_denied_no_ticket,
        message=f"Invalid registration status: {registration.status}",
        participant=participant,
    )


@router.get("/{event_id}/participants", response_model=ParticipantsListResponse)
async def get_participants(
    event_id: UUID,
    status_filter: Optional[str] = Query(None, description="Filter: registered/requested/checked_in"),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """Get all participants for an event with their check-in status."""
    # Verify event exists
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Get all non-cancelled registrations with user + clubs
    query = (
        select(Registration)
        .options(
            selectinload(Registration.user).selectinload(User.clubs),
            selectinload(Registration.ticket),
        )
        .where(
            Registration.event_id == event_id,
            Registration.status != RegistrationStatusEnum.cancelled,
        )
        .order_by(Registration.created_at.asc())
    )

    result = await db.execute(query)
    registrations = result.scalars().all()

    # Build participants and compute counts
    participants = []
    counts = {"registered": 0, "requested": 0, "checked_in": 0, "not_applied": 0}

    for reg in registrations:
        participant = _build_participant(reg.user, reg)
        ts = participant.ticket_status
        if ts in counts:
            counts[ts] += 1
        participants.append(participant)

    # Apply filter
    if status_filter:
        participants = [p for p in participants if p.ticket_status == status_filter]

    return ParticipantsListResponse(
        data=participants,
        total=len(registrations),
        counts=counts,
    )


@router.post("/{event_id}/override/{registration_id}", response_model=OverrideResponse)
async def override_registration(
    event_id: UUID,
    registration_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """Override a pending registration to confirmed (admin only)."""
    # Get registration with relations
    result = await db.execute(
        select(Registration)
        .options(
            selectinload(Registration.user).selectinload(User.clubs),
            selectinload(Registration.event),
            selectinload(Registration.ticket),
        )
        .where(Registration.id == registration_id)
    )
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

    if registration.event_id != event_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration does not belong to this event")

    if registration.status != "pending":
        return OverrideResponse(
            success=False,
            message=f"Cannot override: registration status is '{registration.status}'",
            participant=_build_participant(registration.user, registration),
        )

    # Override: pending -> confirmed
    registration.status = RegistrationStatusEnum.confirmed
    registration.payment_status = "completed"

    # Create ticket
    await db.flush()
    barcode = str(secrets.randbelow(10**12 - 10**11) + 10**11)
    ticket = Ticket(
        registration_id=registration.id,
        barcode=barcode,
    )
    db.add(ticket)

    await db.commit()

    # Real-time notifications
    await notify_registration_changed(
        registration.user_id, event_id, registration_id, "confirmed",
    )
    await notify_participants_changed(event_id)

    print(f"[ACCESS CONTROL] Override by admin {current_admin.username}: "
          f"registration {registration_id} -> confirmed (event {event_id})")

    participant = _build_participant(registration.user, registration)

    return OverrideResponse(
        success=True,
        message="Registration approved successfully",
        participant=participant,
    )


@router.get("/users/search", response_model=list[UserSearchResponse])
async def search_users(
    q: str = Query(..., min_length=1, description="Search by name, username, or student ID"),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """Search users by name, username, or student ID (admin only)."""
    pattern = f"%{q}%"
    result = await db.execute(
        select(User)
        .where(
            (User.username.ilike(pattern))
            | (User.legal_name.ilike(pattern))
            | (User.student_id.ilike(pattern))
        )
        .limit(10)
    )
    users = result.scalars().all()
    return [
        UserSearchResponse(
            id=u.id,
            username=u.username,
            legal_name=u.legal_name,
            student_id=u.student_id,
            profile_image=u.profile_image,
        )
        for u in users
    ]


@router.post("/{event_id}/walk-in", response_model=OverrideResponse)
async def walk_in_register(
    event_id: UUID,
    data: WalkInRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """Walk-in: register + confirm + ticket + check-in in one step (admin only)."""
    # Verify event
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Verify user
    user_result = await db.execute(
        select(User).options(selectinload(User.clubs)).where(User.id == data.user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Check if already registered
    existing = await db.execute(
        select(Registration).where(
            Registration.user_id == data.user_id,
            Registration.event_id == event_id,
            Registration.status != RegistrationStatusEnum.cancelled,
        )
    )
    if existing.scalar_one_or_none():
        return OverrideResponse(
            success=False,
            message="User is already registered for this event",
        )

    # Create registration (checked_in directly)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    registration = Registration(
        user_id=data.user_id,
        event_id=event_id,
        status=RegistrationStatusEnum.checked_in,
        payment_status="completed",
        checked_in_at=now,
    )
    db.add(registration)
    await db.flush()

    # Create ticket (already used)
    barcode = str(secrets.randbelow(10**12 - 10**11) + 10**11)
    ticket = Ticket(
        registration_id=registration.id,
        barcode=barcode,
        is_used=True,
        used_at=now,
    )
    db.add(ticket)

    # Update event slots
    event.current_slots += 1

    await db.commit()

    # Real-time notifications
    await notify_event_updated(event_id, event.current_slots, event.max_slots)
    await notify_checkin(event_id, data.user_id, user.username)
    await notify_participants_changed(event_id)

    print(f"[ACCESS CONTROL] Walk-in by admin {current_admin.username}: "
          f"user {user.username} -> checked_in (event {event_id})")

    participant = _build_participant(user, registration)

    return OverrideResponse(
        success=True,
        message=f"{user.legal_name} has been registered and checked in",
        participant=participant,
    )
