from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID
from datetime import datetime

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
)
from app.schemas.registration import RegistrationBriefResponse, RegistrationStatusEnum

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
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
            for t in tickets
        ],
        total=total,
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

    # Check ownership
    if ticket.registration.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this ticket",
        )

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
    # Only admins can validate tickets
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can validate tickets",
        )

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
    now = datetime.utcnow()
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
    """Mark a ticket as used (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can use tickets",
        )

    result = await db.execute(
        select(Ticket)
        .options(selectinload(Ticket.registration))
        .where(Ticket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    if ticket.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket is already used",
        )

    ticket.is_used = True
    ticket.used_at = datetime.utcnow()

    # Also update registration status
    ticket.registration.status = RegistrationStatusEnum.checked_in
    ticket.registration.checked_in_at = datetime.utcnow()

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
