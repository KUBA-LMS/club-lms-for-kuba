from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.deposit import Deposit, DepositTransaction
from app.schemas.deposit import (
    DepositResponse,
    DepositTransactionResponse,
    DepositTransactionListResponse,
)

router = APIRouter()


@router.get("/me", response_model=List[DepositResponse])
async def get_my_deposits(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all deposits for the current user (one per club)."""
    from app.models.club import Club

    query = (
        select(Deposit, Club.name)
        .join(Club, Deposit.club_id == Club.id)
        .where(Deposit.user_id == current_user.id)
        .order_by(Deposit.created_at)
    )
    result = await db.execute(query)
    rows = result.all()

    return [
        DepositResponse(
            id=dep.id,
            balance=dep.balance,
            club_id=dep.club_id,
            club_name=club_name,
        )
        for dep, club_name in rows
    ]


@router.get("/{deposit_id}/transactions", response_model=DepositTransactionListResponse)
async def get_deposit_transactions(
    deposit_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get transaction history for a specific deposit."""
    # Verify ownership
    dep_result = await db.execute(
        select(Deposit).where(
            Deposit.id == deposit_id,
            Deposit.user_id == current_user.id,
        )
    )
    deposit = dep_result.scalar_one_or_none()
    if not deposit:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deposit not found")

    offset = (page - 1) * limit

    count_query = select(func.count(DepositTransaction.id)).where(
        DepositTransaction.deposit_id == deposit_id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = (
        select(DepositTransaction)
        .where(DepositTransaction.deposit_id == deposit_id)
        .order_by(DepositTransaction.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    txns = result.scalars().all()

    return DepositTransactionListResponse(
        data=[
            DepositTransactionResponse(
                id=t.id,
                amount=t.amount,
                balance_after=t.balance_after,
                description=t.description,
                created_at=t.created_at,
            )
            for t in txns
        ],
        total=total,
        page=page,
        limit=limit,
    )
