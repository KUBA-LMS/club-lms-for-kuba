from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import datetime
from decimal import Decimal, ROUND_CEILING

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.chat import Chat, ChatMember, Message
from app.models.payment import PaymentRequest, PaymentSplit
from app.schemas.payment import (
    PaymentRequestCreate,
    PaymentRequestResponse,
    PaymentSplitResponse,
    PaymentSplitAction,
)
from app.schemas.chat import MessageResponse
from app.schemas.user import UserBriefResponse
from app.services.notifications import notify_new_message, notify_chat_list_update

router = APIRouter()


@router.post("/chats/{chat_id}/payment-request", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_request(
    chat_id: UUID,
    data: PaymentRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a 1/N payment split request in a chat."""
    # Verify membership
    member_check = await db.execute(
        select(ChatMember).where(
            (ChatMember.chat_id == chat_id) & (ChatMember.user_id == current_user.id)
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this chat")

    # Validate all participant_ids are chat members
    for pid in data.participant_ids:
        p_check = await db.execute(
            select(ChatMember).where(
                (ChatMember.chat_id == chat_id) & (ChatMember.user_id == pid)
            )
        )
        if not p_check.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {pid} is not a chat member")

    # Calculate split amounts
    all_participants = [current_user.id] + [pid for pid in data.participant_ids if pid != current_user.id]
    n = len(all_participants)
    base_amount = (data.total_amount / n).quantize(Decimal("1"), rounding=ROUND_CEILING)
    remainder = data.total_amount - base_amount * n

    # Create message first
    content = f"Request 1/N: {int(data.total_amount):,} KRW"
    new_message = Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        content=content,
        type="payment_request",
        payment_amount=data.total_amount,
    )
    db.add(new_message)
    await db.flush()

    # Create payment request
    payment_req = PaymentRequest(
        total_amount=data.total_amount,
        message_id=new_message.id,
        chat_id=chat_id,
        requester_id=current_user.id,
    )
    db.add(payment_req)
    await db.flush()

    # Update message with payment_request_id
    new_message.payment_request_id = payment_req.id

    # Create splits for each participant
    for i, user_id in enumerate(all_participants):
        split_amount = base_amount
        if i == 0:
            split_amount = base_amount + remainder  # Requester absorbs rounding difference
        split = PaymentSplit(
            payment_request_id=payment_req.id,
            user_id=user_id,
            amount=split_amount,
        )
        db.add(split)

    # Update chat updated_at
    chat_query = select(Chat).where(Chat.id == chat_id)
    chat_result = await db.execute(chat_query)
    chat = chat_result.scalar_one()
    chat.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(new_message)

    # WS notifications
    try:
        created_at_str = new_message.created_at.isoformat()
        await notify_new_message(
            chat_id=chat_id, message_id=new_message.id,
            sender_id=current_user.id, sender_username=current_user.username,
            content=content, message_type="payment_request",
            created_at=created_at_str,
        )
        members_query = select(ChatMember.user_id).where(
            (ChatMember.chat_id == chat_id) & (ChatMember.user_id != current_user.id)
        )
        members_result = await db.execute(members_query)
        for row in members_result.fetchall():
            await notify_chat_list_update(
                user_id=row[0], chat_id=chat_id,
                last_message=content, last_message_type="payment_request",
                sender_username=current_user.username, timestamp=created_at_str,
            )
    except Exception:
        pass

    return MessageResponse(
        id=new_message.id,
        content=new_message.content,
        type=new_message.type,
        ticket_id=None,
        payment_amount=new_message.payment_amount,
        payment_request_id=payment_req.id,
        sender=UserBriefResponse(
            id=current_user.id,
            username=current_user.username,
            profile_image=current_user.profile_image,
        ),
        created_at=new_message.created_at,
    )


@router.post("/payment-splits/{split_id}/respond", response_model=PaymentSplitResponse)
async def respond_to_split(
    split_id: UUID,
    action: PaymentSplitAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Respond to a payment split (accumulate or use deposit)."""
    split_query = (
        select(PaymentSplit)
        .options(selectinload(PaymentSplit.user), selectinload(PaymentSplit.payment_request))
        .where((PaymentSplit.id == split_id) & (PaymentSplit.user_id == current_user.id))
    )
    split_result = await db.execute(split_query)
    split = split_result.scalar_one_or_none()

    if not split:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Split not found")

    if split.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Split already resolved")

    split.status = action.action
    await db.flush()

    # Check if all splits are resolved -> complete the payment request
    payment_req = split.payment_request
    all_splits_query = select(PaymentSplit).where(
        PaymentSplit.payment_request_id == payment_req.id
    )
    all_splits_result = await db.execute(all_splits_query)
    all_splits = all_splits_result.scalars().all()

    all_resolved = all(s.status != "pending" for s in all_splits)
    if all_resolved:
        payment_req.status = "completed"

        # Create a payment_completed message
        accumulated = sum(s.amount for s in all_splits if s.status == "accumulated")
        content = f"1/N Completed: {int(payment_req.total_amount):,} KRW"
        completed_msg = Message(
            chat_id=payment_req.chat_id,
            sender_id=payment_req.requester_id,
            content=content,
            type="payment_completed",
            payment_amount=payment_req.total_amount,
            payment_request_id=payment_req.id,
        )
        db.add(completed_msg)

    await db.commit()

    return PaymentSplitResponse(
        id=split.id,
        user=UserBriefResponse(
            id=current_user.id,
            username=current_user.username,
            profile_image=current_user.profile_image,
        ),
        amount=split.amount,
        status=split.status,
    )


@router.get("/payment-requests/{request_id}", response_model=PaymentRequestResponse)
async def get_payment_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a payment request with all splits."""
    pr_query = (
        select(PaymentRequest)
        .options(
            selectinload(PaymentRequest.splits).selectinload(PaymentSplit.user),
            selectinload(PaymentRequest.requester),
        )
        .where(PaymentRequest.id == request_id)
    )
    pr_result = await db.execute(pr_query)
    pr = pr_result.scalar_one_or_none()

    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment request not found")

    # Verify user is a participant
    is_participant = any(s.user_id == current_user.id for s in pr.splits)
    if not is_participant and pr.requester_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant")

    return PaymentRequestResponse(
        id=pr.id,
        total_amount=pr.total_amount,
        status=pr.status,
        requester=UserBriefResponse(
            id=pr.requester.id,
            username=pr.requester.username,
            profile_image=pr.requester.profile_image,
        ),
        splits=[
            PaymentSplitResponse(
                id=s.id,
                user=UserBriefResponse(
                    id=s.user.id,
                    username=s.user.username,
                    profile_image=s.user.profile_image,
                ),
                amount=s.amount,
                status=s.status,
            )
            for s in pr.splits
        ],
        created_at=pr.created_at,
    )
