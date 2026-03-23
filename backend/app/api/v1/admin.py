import csv
import io
import logging
import uuid
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_admin_user, get_current_superadmin
from app.models.user import User, user_club
from app.models.club import Club
from app.models.event import Event
from app.models.registration import Registration
from app.models.deposit import Deposit, DepositTransaction
from app.models.ticket import Ticket
from app.schemas.admin import (
    AdminMemberResponse,
    AdminMemberListResponse,
    AdminMemberDepositInfo,
    DepositAdjustRequest,
    SearchNonMemberResponse,
    SearchNonMemberListResponse,
    CommonGroupInfo,
    AdminOrganizationResponse,
    AdminProfileResponse,
    OrgStats,
    SubgroupCardResponse,
    LeadInfo,
    SubgroupMemberResponse,
    SubgroupMemberListResponse,
    AdminEventResponse,
    AdminEventListResponse,
    AdminTaskResponse,
    AdminTaskListResponse,
    TaskUserInfo,
    TaskEventInfo,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _verify_club_exists(db: AsyncSession, club_id: UUID) -> Club:
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()
    if not club:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club not found")
    return club


async def _verify_admin_club_access(db: AsyncSession, club_id: UUID, current_user: User) -> None:
    """Verify that the admin user is a member of the given club.
    Superadmins have unrestricted access."""
    if current_user.role == "superadmin":
        return
    membership = await db.execute(
        select(user_club).where(
            user_club.c.user_id == current_user.id,
            user_club.c.club_id == club_id,
        )
    )
    if not membership.first():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this club",
        )


async def _get_or_create_deposit(db: AsyncSession, user_id: UUID, club_id: UUID) -> Deposit:
    result = await db.execute(
        select(Deposit).where(Deposit.user_id == user_id, Deposit.club_id == club_id)
    )
    deposit = result.scalar_one_or_none()
    if not deposit:
        deposit = Deposit(user_id=user_id, club_id=club_id, balance=Decimal("0"))
        db.add(deposit)
        await db.flush()
    return deposit


# ---------------------------------------------------------------------------
# Member Management
# ---------------------------------------------------------------------------

@router.get("/clubs/{club_id}/members", response_model=AdminMemberListResponse)
async def get_club_members(
    club_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get club members with roles and deposit info."""
    await _verify_club_exists(db, club_id)
    await _verify_admin_club_access(db, club_id, current_user)
    offset = (page - 1) * limit

    # Total count
    count_result = await db.execute(
        select(func.count(user_club.c.user_id)).where(user_club.c.club_id == club_id)
    )
    total = count_result.scalar()

    # Get members with roles
    members_query = (
        select(User, user_club.c.role)
        .join(user_club, user_club.c.user_id == User.id)
        .where(user_club.c.club_id == club_id)
        .order_by(User.username)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(members_query)
    rows = result.all()

    data = []
    for user, club_role in rows:
        # Get deposit for this user + club
        dep_result = await db.execute(
            select(Deposit).where(Deposit.user_id == user.id, Deposit.club_id == club_id)
        )
        deposit = dep_result.scalar_one_or_none()

        recent_txns = []
        deposit_id = None
        balance = Decimal("0")

        if deposit:
            deposit_id = deposit.id
            balance = deposit.balance
            txn_result = await db.execute(
                select(DepositTransaction)
                .where(DepositTransaction.deposit_id == deposit.id)
                .order_by(DepositTransaction.created_at.desc())
                .limit(5)
            )
            recent_txns = [
                {
                    "id": t.id,
                    "amount": t.amount,
                    "balance_after": t.balance_after,
                    "description": t.description,
                    "created_at": t.created_at,
                }
                for t in txn_result.scalars().all()
            ]

        data.append(
            AdminMemberResponse(
                id=user.id,
                username=user.username,
                legal_name=user.legal_name,
                student_id=user.student_id,
                profile_image=user.profile_image,
                nationality=user.nationality,
                gender=user.gender,
                club_role=club_role,
                is_admin=user.role == "admin",
                deposit=AdminMemberDepositInfo(
                    deposit_id=deposit_id,
                    balance=balance,
                    recent_transactions=recent_txns,
                ),
            )
        )

    return AdminMemberListResponse(data=data, total=total, page=page, limit=limit)


@router.put("/clubs/{club_id}/members/{user_id}/admin-toggle")
async def toggle_admin_role(
    club_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Toggle User.role between 'admin' and 'member'."""
    await _verify_club_exists(db, club_id)
    await _verify_admin_club_access(db, club_id, current_user)

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Verify user is a member of this club
    membership = await db.execute(
        select(user_club).where(
            user_club.c.user_id == user_id, user_club.c.club_id == club_id
        )
    )
    if not membership.first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not a member of this club")

    if user.role == "superadmin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify superadmin role")

    new_role = "member" if user.role == "admin" else "admin"
    user.role = new_role
    await db.commit()

    logger.info(
        "admin_toggle: actor=%s club=%s target=%s new_role=%s",
        current_user.id, club_id, user_id, new_role,
    )
    return {"is_admin": user.role == "admin"}


@router.put("/clubs/{club_id}/members/{user_id}/lead-toggle")
async def toggle_lead_role(
    club_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Toggle user_club.role between 'lead' and 'member'."""
    await _verify_club_exists(db, club_id)
    await _verify_admin_club_access(db, club_id, current_user)

    result = await db.execute(
        select(user_club.c.role).where(
            user_club.c.user_id == user_id, user_club.c.club_id == club_id
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not a member of this club")

    new_role = "member" if row[0] == "lead" else "lead"
    await db.execute(
        user_club.update()
        .where(user_club.c.user_id == user_id, user_club.c.club_id == club_id)
        .values(role=new_role)
    )
    await db.commit()

    logger.info(
        "lead_toggle: actor=%s club=%s target=%s new_role=%s",
        current_user.id, club_id, user_id, new_role,
    )
    return {"club_role": new_role}


@router.delete("/clubs/{club_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    club_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Remove a member from the club."""
    await _verify_club_exists(db, club_id)
    await _verify_admin_club_access(db, club_id, current_user)

    result = await db.execute(
        select(user_club).where(
            user_club.c.user_id == user_id, user_club.c.club_id == club_id
        )
    )
    if not result.first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in club")

    await db.execute(
        user_club.delete().where(
            user_club.c.user_id == user_id, user_club.c.club_id == club_id
        )
    )
    await db.commit()
    logger.info("remove_member: actor=%s club=%s removed=%s", current_user.id, club_id, user_id)


# ---------------------------------------------------------------------------
# Deposit Management
# ---------------------------------------------------------------------------

@router.post("/clubs/{club_id}/members/{user_id}/deposit")
async def adjust_deposit(
    club_id: UUID,
    user_id: UUID,
    body: DepositAdjustRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Top up or deduct deposit for a member."""
    await _verify_club_exists(db, club_id)
    await _verify_admin_club_access(db, club_id, current_user)

    # Verify membership
    membership = await db.execute(
        select(user_club).where(
            user_club.c.user_id == user_id, user_club.c.club_id == club_id
        )
    )
    if not membership.first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not a member of this club")

    deposit = await _get_or_create_deposit(db, user_id, club_id)

    new_balance = deposit.balance + body.amount
    if new_balance < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Current: {deposit.balance}, requested deduction: {abs(body.amount)}",
        )

    deposit.balance = new_balance

    txn = DepositTransaction(
        amount=body.amount,
        balance_after=new_balance,
        description=body.description,
        deposit_id=deposit.id,
    )
    db.add(txn)
    await db.commit()

    logger.info(
        "deposit_adjust: actor=%s club=%s target=%s amount=%s new_balance=%s desc=%r",
        current_user.id, club_id, user_id, body.amount, new_balance, body.description,
    )
    return {
        "deposit_id": str(deposit.id),
        "balance": float(new_balance),
        "transaction_id": str(txn.id),
    }


@router.get("/clubs/{club_id}/members/{user_id}/deposit/transactions")
async def get_member_deposit_transactions(
    club_id: UUID,
    user_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get deposit transactions for a member in a club."""
    await _verify_admin_club_access(db, club_id, current_user)
    deposit_result = await db.execute(
        select(Deposit).where(Deposit.user_id == user_id, Deposit.club_id == club_id)
    )
    deposit = deposit_result.scalar_one_or_none()
    if not deposit:
        return {"data": [], "total": 0, "page": page, "limit": limit}

    offset = (page - 1) * limit
    count_result = await db.execute(
        select(func.count(DepositTransaction.id)).where(DepositTransaction.deposit_id == deposit.id)
    )
    total = count_result.scalar()

    txn_result = await db.execute(
        select(DepositTransaction)
        .where(DepositTransaction.deposit_id == deposit.id)
        .order_by(DepositTransaction.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    txns = txn_result.scalars().all()

    return {
        "data": [
            {
                "id": t.id,
                "amount": float(t.amount),
                "balance_after": float(t.balance_after),
                "description": t.description,
                "created_at": t.created_at.isoformat(),
            }
            for t in txns
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


# ---------------------------------------------------------------------------
# Member Search (non-members)
# ---------------------------------------------------------------------------

@router.get("/clubs/{club_id}/search-non-members", response_model=SearchNonMemberListResponse)
async def search_non_members(
    club_id: UUID,
    query: str = Query("", max_length=100),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Search users who are NOT members of this club."""
    await _verify_club_exists(db, club_id)
    await _verify_admin_club_access(db, club_id, current_user)

    # Get existing member IDs
    existing_ids_result = await db.execute(
        select(user_club.c.user_id).where(user_club.c.club_id == club_id)
    )
    existing_member_ids = {row[0] for row in existing_ids_result.fetchall()}

    # Build search query
    search_query = select(User).where(User.is_active == True)
    if existing_member_ids:
        search_query = search_query.where(User.id.notin_(existing_member_ids))

    if query:
        search_term = f"%{query}%"
        search_query = search_query.where(
            (User.username.ilike(search_term)) | (User.legal_name.ilike(search_term))
        )

    search_query = search_query.order_by(User.username).limit(limit)
    result = await db.execute(search_query)
    users = result.scalars().all()

    # Get common clubs for each user
    data = []
    for u in users:
        # Get clubs this user belongs to
        user_clubs_result = await db.execute(
            select(Club.id, Club.name, Club.logo_image)
            .join(user_club, user_club.c.club_id == Club.id)
            .where(user_club.c.user_id == u.id)
        )
        user_clubs = user_clubs_result.fetchall()

        # Get clubs the current admin belongs to
        admin_clubs_result = await db.execute(
            select(user_club.c.club_id).where(user_club.c.user_id == current_user.id)
        )
        admin_club_ids = {row[0] for row in admin_clubs_result.fetchall()}

        common = [
            CommonGroupInfo(id=c_id, name=c_name, logo_image=c_logo)
            for c_id, c_name, c_logo in user_clubs
            if c_id in admin_club_ids
        ]

        data.append(
            SearchNonMemberResponse(
                id=u.id,
                username=u.username,
                legal_name=u.legal_name,
                profile_image=u.profile_image,
                common_groups=common,
            )
        )

    return SearchNonMemberListResponse(data=data, total=len(data))


@router.post("/clubs/{club_id}/members/{user_id}", status_code=status.HTTP_201_CREATED)
async def add_member_to_club(
    club_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Add a user to the club as a member."""
    await _verify_club_exists(db, club_id)
    await _verify_admin_club_access(db, club_id, current_user)

    # Check user exists
    user_result = await db.execute(select(User).where(User.id == user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Check not already a member
    existing = await db.execute(
        select(user_club).where(
            user_club.c.user_id == user_id, user_club.c.club_id == club_id
        )
    )
    if existing.first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member")

    await db.execute(
        user_club.insert().values(user_id=user_id, club_id=club_id, role="member")
    )
    await db.commit()

    logger.info("add_member: actor=%s club=%s added=%s", current_user.id, club_id, user_id)
    return {"message": "Member added successfully"}


# ---------------------------------------------------------------------------
# Organization
# ---------------------------------------------------------------------------

@router.get("/clubs/{club_id}/organization", response_model=AdminOrganizationResponse)
async def get_organization(
    club_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get organization overview for a club."""
    club = await _verify_club_exists(db, club_id)
    await _verify_admin_club_access(db, club_id, current_user)

    # My profile
    my_profile = AdminProfileResponse(
        id=current_user.id,
        username=current_user.username,
        legal_name=current_user.legal_name,
        student_id=current_user.student_id,
        profile_image=current_user.profile_image,
    )

    # Get subgroups
    subgroups_result = await db.execute(
        select(Club).where(Club.parent_id == club_id).order_by(Club.name)
    )
    subgroups = subgroups_result.scalars().all()

    total_admins = 0
    total_normal = 0
    subgroup_cards = []

    for sg in subgroups:
        # Count members by role
        members_result = await db.execute(
            select(User.role, func.count(User.id))
            .join(user_club, user_club.c.user_id == User.id)
            .where(user_club.c.club_id == sg.id)
            .group_by(User.role)
        )
        role_counts = dict(members_result.fetchall())
        admin_count = role_counts.get("admin", 0)
        normal_count = role_counts.get("member", 0)
        member_count = admin_count + normal_count

        total_admins += admin_count
        total_normal += normal_count

        # Get leads
        leads_result = await db.execute(
            select(User.id, User.username, User.profile_image)
            .join(user_club, user_club.c.user_id == User.id)
            .where(user_club.c.club_id == sg.id, user_club.c.role == "lead")
        )
        leads = [
            LeadInfo(id=lid, username=lname, profile_image=limg)
            for lid, lname, limg in leads_result.fetchall()
        ]

        subgroup_cards.append(
            SubgroupCardResponse(
                id=sg.id,
                name=sg.name,
                logo_image=sg.logo_image,
                member_count=member_count,
                admin_count=admin_count,
                normal_count=normal_count,
                leads=leads,
            )
        )

    # Also count members in the parent club itself for stats
    parent_members_result = await db.execute(
        select(User.role, func.count(User.id))
        .join(user_club, user_club.c.user_id == User.id)
        .where(user_club.c.club_id == club_id)
        .group_by(User.role)
    )
    parent_role_counts = dict(parent_members_result.fetchall())

    # Get supervisor names (leads of the parent club)
    supervisors_result = await db.execute(
        select(User.username)
        .join(user_club, user_club.c.user_id == User.id)
        .where(user_club.c.club_id == club_id, user_club.c.role == "lead")
    )
    supervisor_names = [row[0] for row in supervisors_result.fetchall()]

    # Get lead name for current user in this club
    lead_result = await db.execute(
        select(user_club.c.role).where(
            user_club.c.user_id == current_user.id, user_club.c.club_id == club_id
        )
    )
    lead_row = lead_result.first()
    lead_name = current_user.username if lead_row and lead_row[0] == "lead" else None

    return AdminOrganizationResponse(
        my_profile=my_profile,
        supervisor_names=supervisor_names,
        lead_name=lead_name,
        stats=OrgStats(
            subgroups=len(subgroups),
            admins=parent_role_counts.get("admin", 0),
            normal_users=parent_role_counts.get("member", 0),
        ),
        subgroups=subgroup_cards,
    )


@router.get("/clubs/{club_id}/subgroups/{subgroup_id}/members", response_model=SubgroupMemberListResponse)
async def get_subgroup_members(
    club_id: UUID,
    subgroup_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get members of a subgroup with deposit info."""
    await _verify_admin_club_access(db, club_id, current_user)
    # Verify subgroup belongs to parent
    sg_result = await db.execute(
        select(Club).where(Club.id == subgroup_id, Club.parent_id == club_id)
    )
    if not sg_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subgroup not found")

    offset = (page - 1) * limit
    count_result = await db.execute(
        select(func.count(user_club.c.user_id)).where(user_club.c.club_id == subgroup_id)
    )
    total = count_result.scalar()

    members_result = await db.execute(
        select(User, user_club.c.role)
        .join(user_club, user_club.c.user_id == User.id)
        .where(user_club.c.club_id == subgroup_id)
        .order_by(User.username)
        .offset(offset)
        .limit(limit)
    )
    rows = members_result.fetchall()

    data = []
    for user, crole in rows:
        # Get deposit balance for parent club
        dep_result = await db.execute(
            select(Deposit.balance).where(Deposit.user_id == user.id, Deposit.club_id == club_id)
        )
        dep_row = dep_result.first()
        balance = dep_row[0] if dep_row else Decimal("0")

        data.append(
            SubgroupMemberResponse(
                id=user.id,
                username=user.username,
                profile_image=user.profile_image,
                is_admin=user.role == "admin",
                club_role=crole,
                deposit_balance=balance,
            )
        )

    return SubgroupMemberListResponse(data=data, total=total, page=page, limit=limit)


# ---------------------------------------------------------------------------
# Event Management
# ---------------------------------------------------------------------------

@router.get("/clubs/{club_id}/events", response_model=AdminEventListResponse)
async def get_club_events(
    club_id: UUID,
    past_page: int = Query(1, ge=1),
    past_limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get club events split into upcoming (all) and past (paginated)."""
    await _verify_club_exists(db, club_id)
    await _verify_admin_club_access(db, club_id, current_user)
    now_naive = datetime.now(timezone.utc).replace(tzinfo=None)

    async def _build_event_item(ev: Event) -> AdminEventResponse:
        reg_count_result = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.event_id == ev.id,
                Registration.status.in_(["pending", "confirmed", "checked_in"]),
            )
        )
        reg_count = reg_count_result.scalar()
        ev_date = ev.event_date
        if ev_date.tzinfo is not None:
            ev_date = ev_date.replace(tzinfo=None)
        return AdminEventResponse(
            id=ev.id,
            title=ev.title,
            images=ev.images or [],
            event_date=ev.event_date,
            event_type=ev.event_type,
            cost_type=ev.cost_type,
            cost_amount=ev.cost_amount,
            status="open" if ev_date > now_naive else "expired",
            registration_count=reg_count,
            max_slots=ev.max_slots,
            event_location=ev.event_location,
        )

    # Upcoming: all events in the future (typically few, no pagination needed)
    upcoming_result = await db.execute(
        select(Event)
        .where(Event.club_id == club_id, Event.event_date > now_naive)
        .order_by(Event.event_date.asc())
    )
    upcoming_events = upcoming_result.scalars().all()
    total_upcoming = len(upcoming_events)

    # Past: paginated
    total_past_result = await db.execute(
        select(func.count(Event.id)).where(
            Event.club_id == club_id, Event.event_date <= now_naive
        )
    )
    total_past = total_past_result.scalar()

    past_result = await db.execute(
        select(Event)
        .where(Event.club_id == club_id, Event.event_date <= now_naive)
        .order_by(Event.event_date.desc())
        .offset((past_page - 1) * past_limit)
        .limit(past_limit)
    )
    past_events = past_result.scalars().all()

    upcoming = [await _build_event_item(ev) for ev in upcoming_events]
    past = [await _build_event_item(ev) for ev in past_events]

    return AdminEventListResponse(
        upcoming=upcoming,
        past=past,
        total_upcoming=total_upcoming,
        total_past=total_past,
        past_page=past_page,
        past_limit=past_limit,
    )


# ---------------------------------------------------------------------------
# Task Management (Registration Approval)
# ---------------------------------------------------------------------------

@router.get("/clubs/{club_id}/tasks", response_model=AdminTaskListResponse)
async def get_club_tasks(
    club_id: UUID,
    search: Optional[str] = Query(None, max_length=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get pending registration tasks and history for a club."""
    await _verify_club_exists(db, club_id)
    await _verify_admin_club_access(db, club_id, current_user)
    now = datetime.now(timezone.utc)

    # Base query: registrations for events in this club
    base_query = (
        select(Registration, User, Event)
        .join(User, Registration.user_id == User.id)
        .join(Event, Registration.event_id == Event.id)
        .where(Event.club_id == club_id)
    )

    if search:
        search_term = f"%{search}%"
        base_query = base_query.where(
            (User.username.ilike(search_term)) | (Event.title.ilike(search_term))
        )

    # Current tasks: pending registrations
    current_query = (
        base_query.where(Registration.status == "pending")
        .order_by(Registration.created_at.desc())
    )
    current_result = await db.execute(current_query)
    current_rows = current_result.all()

    # History: confirmed or cancelled
    history_query = (
        base_query.where(Registration.status.in_(["confirmed", "cancelled"]))
        .order_by(Registration.updated_at.desc())
        .limit(50)
    )
    history_result = await db.execute(history_query)
    history_rows = history_result.all()

    def _build_task(reg: Registration, user: User, event: Event) -> AdminTaskResponse:
        reg_end = event.registration_end
        if reg_end.tzinfo is None:
            reg_end = reg_end.replace(tzinfo=timezone.utc)
        timeout = max(0, int((reg_end - now).total_seconds()))

        return AdminTaskResponse(
            registration_id=reg.id,
            user=TaskUserInfo(id=user.id, username=user.username, profile_image=user.profile_image),
            event=TaskEventInfo(
                id=event.id,
                title=event.title,
                event_date=event.event_date,
                event_type=event.event_type,
                cost_type=event.cost_type,
            ),
            status=reg.status,
            timeout_seconds=timeout,
            created_at=reg.created_at,
        )

    return AdminTaskListResponse(
        current=[_build_task(r, u, e) for r, u, e in current_rows],
        history=[_build_task(r, u, e) for r, u, e in history_rows],
    )


@router.post("/registrations/{registration_id}/approve")
async def approve_registration(
    registration_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Approve a pending registration."""
    result = await db.execute(
        select(Registration).where(Registration.id == registration_id)
    )
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

    if reg.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration is not pending (current: {reg.status})",
        )

    # Increment event slots
    event_result = await db.execute(select(Event).where(Event.id == reg.event_id))
    event = event_result.scalar_one()

    # Verify admin has access to this event's club
    await _verify_admin_club_access(db, event.club_id, current_user)

    reg.status = "confirmed"
    reg.payment_status = "completed"
    event.current_slots += 1

    # Create ticket
    barcode = f"CLX-{uuid.uuid4().hex[:12].upper()}"
    ticket = Ticket(barcode=barcode, registration_id=reg.id)
    db.add(ticket)

    await db.commit()

    logger.info(
        "approve_registration: actor=%s reg=%s user=%s event=%s",
        current_user.id, registration_id, reg.user_id, reg.event_id,
    )
    return {"message": "Registration approved", "registration_id": str(reg.id)}


@router.post("/registrations/{registration_id}/decline")
async def decline_registration(
    registration_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Decline a pending registration."""
    result = await db.execute(
        select(Registration).where(Registration.id == registration_id)
    )
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

    if reg.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration is not pending (current: {reg.status})",
        )

    # Verify admin has access to this event's club
    event_result = await db.execute(select(Event).where(Event.id == reg.event_id))
    event = event_result.scalar_one()
    await _verify_admin_club_access(db, event.club_id, current_user)

    reg.status = "cancelled"
    await db.commit()

    logger.info(
        "decline_registration: actor=%s reg=%s user=%s event=%s",
        current_user.id, registration_id, reg.user_id, reg.event_id,
    )
    return {"message": "Registration declined", "registration_id": str(reg.id)}


# ---------------------------------------------------------------------------
# CSV Export
# ---------------------------------------------------------------------------

@router.get("/events/{event_id}/export-csv")
async def export_event_csv(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Export event participants as CSV."""
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    await _verify_admin_club_access(db, event.club_id, current_user)

    # Get all registrations with user info
    regs_result = await db.execute(
        select(Registration, User)
        .join(User, Registration.user_id == User.id)
        .where(Registration.event_id == event_id)
        .order_by(Registration.created_at)
    )
    rows = regs_result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Username", "Legal Name", "Student ID", "Nationality", "Gender",
        "Registration Status", "Payment Status", "Checked In At", "Registered At",
    ])

    for reg, user in rows:
        writer.writerow([
            user.username,
            user.legal_name or "",
            user.student_id or "",
            user.nationality or "",
            user.gender or "",
            reg.status,
            reg.payment_status,
            reg.checked_in_at.isoformat() if reg.checked_in_at else "",
            reg.created_at.isoformat(),
        ])

    output.seek(0)
    safe_title = event.title.replace(" ", "_")[:30]
    filename = f"{safe_title}_participants.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ---------------------------------------------------------------------------
# Superadmin Dashboard APIs
# ---------------------------------------------------------------------------

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    """Aggregate stats for the superadmin dashboard."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_clubs = (await db.execute(select(func.count(Club.id)))).scalar()
    total_events = (await db.execute(select(func.count(Event.id)))).scalar()
    pending_regs = (
        await db.execute(
            select(func.count(Registration.id)).where(Registration.status == "pending")
        )
    ).scalar()

    return {
        "total_users": total_users,
        "total_clubs": total_clubs,
        "total_events": total_events,
        "pending_registrations": pending_regs,
    }


@router.get("/dashboard/recent-registrations")
async def get_recent_registrations(
    limit: int = Query(8, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    """Get recent registrations across all clubs for the dashboard."""
    result = await db.execute(
        select(Registration, User, Event)
        .join(User, Registration.user_id == User.id)
        .join(Event, Registration.event_id == Event.id)
        .order_by(Registration.created_at.desc())
        .limit(limit)
    )
    rows = result.all()

    return {
        "data": [
            {
                "id": str(reg.id),
                "username": user.username,
                "event": event.title,
                "status": reg.status,
                "created_at": reg.created_at.isoformat() if reg.created_at else None,
            }
            for reg, user, event in rows
        ]
    }


@router.get("/dashboard/weekly-activity")
async def get_weekly_activity(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    """Get daily user signup counts for the last 7 days."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    days = []
    day_labels = ["월", "화", "수", "목", "금", "토", "일"]

    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        count = (
            await db.execute(
                select(func.count(User.id)).where(
                    User.created_at >= day_start,
                    User.created_at < day_end,
                )
            )
        ).scalar()

        days.append({
            "day": day_labels[day_start.weekday()],
            "count": count,
            "date": day_start.strftime("%Y-%m-%d"),
        })

    return {"data": days}


@router.get("/users")
async def list_all_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    role: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    """List all users with search and role filtering (superadmin only)."""
    query = select(User)

    if search:
        term = f"%{search}%"
        query = query.where(
            (User.username.ilike(term))
            | (User.legal_name.ilike(term))
            | (User.student_id.ilike(term))
        )
    if role:
        query = query.where(User.role == role)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    query = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "data": [
            {
                "id": str(u.id),
                "username": u.username,
                "legal_name": u.legal_name,
                "email": u.email,
                "student_id": u.student_id,
                "profile_image": u.profile_image,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/all-clubs")
async def list_all_clubs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    """List all clubs with member counts (superadmin only)."""
    clubs_result = await db.execute(
        select(Club).order_by(Club.created_at.desc())
    )
    clubs = clubs_result.scalars().all()

    data = []
    for club in clubs:
        member_count = (
            await db.execute(
                select(func.count()).where(user_club.c.club_id == club.id)
            )
        ).scalar()

        subgroup_count = (
            await db.execute(
                select(func.count(Club.id)).where(Club.parent_id == club.id)
            )
        ).scalar()

        data.append({
            "id": str(club.id),
            "name": club.name,
            "description": club.description,
            "university": club.university,
            "logo_image": club.logo_image,
            "parent_id": str(club.parent_id) if club.parent_id else None,
            "member_count": member_count,
            "subgroup_count": subgroup_count,
            "created_at": club.created_at.isoformat() if club.created_at else None,
        })

    return {"data": data, "total": len(data)}


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: UUID,
    role: str = Query(..., regex="^(member|admin)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    """Change a user's role (superadmin only). Cannot modify superadmin accounts."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.role == "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify superadmin role",
        )

    user.role = role
    await db.commit()

    return {"message": f"User '{user.username}' role updated to '{role}'", "role": role}
