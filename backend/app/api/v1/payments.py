from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
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
    SettlementHistoryItem,
    SettlementHistoryResponse,
)
from app.schemas.chat import MessageResponse
from app.schemas.user import UserBriefResponse, UserBankAccountResponse
from app.services.notifications import (
    notify_new_message,
    notify_chat_list_update,
    notify_split_status_changed,
)

router = APIRouter()


@router.post("/chats/{chat_id}/payment-request", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_request(
    chat_id: UUID,
    data: PaymentRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a 1/N payment split request in a chat."""
    # Verify requester has bank account registered
    if not current_user.bank_name or not current_user.bank_account_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please register your bank account in Settings before requesting payment",
        )

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


@router.post("/payment-splits/{split_id}/mark-sent", response_model=PaymentSplitResponse)
async def mark_split_sent(
    split_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Participant marks their split as sent (they've transferred money externally)."""
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Split is not pending")

    split.status = "sent"
    split.sent_at = datetime.utcnow()
    await db.commit()

    # WS notification
    try:
        await notify_split_status_changed(
            chat_id=split.payment_request.chat_id,
            payment_request_id=split.payment_request.id,
            split_id=split.id,
            user_id=current_user.id,
            new_status="sent",
        )
    except Exception:
        pass

    return PaymentSplitResponse(
        id=split.id,
        user=UserBriefResponse(
            id=current_user.id,
            username=current_user.username,
            profile_image=current_user.profile_image,
        ),
        amount=split.amount,
        status=split.status,
        sent_at=split.sent_at,
        confirmed_at=split.confirmed_at,
    )


@router.post("/payment-splits/{split_id}/confirm", response_model=PaymentSplitResponse)
async def confirm_split(
    split_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Requester confirms they received the payment for a split."""
    split_query = (
        select(PaymentSplit)
        .options(
            selectinload(PaymentSplit.user),
            selectinload(PaymentSplit.payment_request),
        )
        .where(PaymentSplit.id == split_id)
    )
    split_result = await db.execute(split_query)
    split = split_result.scalar_one_or_none()

    if not split:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Split not found")

    # Only the requester can confirm
    if split.payment_request.requester_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the requester can confirm")
    if split.status != "sent":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Split must be in 'sent' status to confirm")

    split.status = "confirmed"
    split.confirmed_at = datetime.utcnow()
    await db.flush()

    # Check if all splits are confirmed -> complete the payment request
    payment_req = split.payment_request
    all_splits_query = select(PaymentSplit).where(
        PaymentSplit.payment_request_id == payment_req.id
    )
    all_splits_result = await db.execute(all_splits_query)
    all_splits = all_splits_result.scalars().all()

    all_confirmed = all(s.status == "confirmed" for s in all_splits)
    if all_confirmed:
        payment_req.status = "completed"

        # Create a payment_completed message
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

    # WS notification
    try:
        await notify_split_status_changed(
            chat_id=payment_req.chat_id,
            payment_request_id=payment_req.id,
            split_id=split.id,
            user_id=split.user_id,
            new_status="confirmed",
        )
        # If completed, also send the completed message notification
        if all_confirmed:
            await db.refresh(completed_msg)
            await notify_new_message(
                chat_id=payment_req.chat_id,
                message_id=completed_msg.id,
                sender_id=payment_req.requester_id,
                sender_username=current_user.username,
                content=content,
                message_type="payment_completed",
                created_at=completed_msg.created_at.isoformat(),
            )
    except Exception:
        pass

    return PaymentSplitResponse(
        id=split.id,
        user=UserBriefResponse(
            id=split.user.id,
            username=split.user.username,
            profile_image=split.user.profile_image,
        ),
        amount=split.amount,
        status=split.status,
        sent_at=split.sent_at,
        confirmed_at=split.confirmed_at,
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

    requester_bank = None
    if pr.requester.bank_name:
        requester_bank = UserBankAccountResponse(
            bank_name=pr.requester.bank_name,
            bank_account_number=pr.requester.bank_account_number,
            account_holder_name=pr.requester.account_holder_name,
        )

    return PaymentRequestResponse(
        id=pr.id,
        total_amount=pr.total_amount,
        status=pr.status,
        requester=UserBriefResponse(
            id=pr.requester.id,
            username=pr.requester.username,
            profile_image=pr.requester.profile_image,
        ),
        requester_bank=requester_bank,
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
                sent_at=s.sent_at,
                confirmed_at=s.confirmed_at,
            )
            for s in pr.splits
        ],
        created_at=pr.created_at,
    )


@router.get("/payments/settlement-history", response_model=SettlementHistoryResponse)
async def get_settlement_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get settlement history for the current user (both sent and received)."""
    offset = (page - 1) * limit

    # Get all splits involving the current user
    splits_query = (
        select(PaymentSplit)
        .options(
            selectinload(PaymentSplit.user),
            selectinload(PaymentSplit.payment_request).selectinload(PaymentRequest.requester),
        )
        .join(PaymentRequest, PaymentSplit.payment_request_id == PaymentRequest.id)
        .where(
            or_(
                PaymentSplit.user_id == current_user.id,
                PaymentRequest.requester_id == current_user.id,
            )
        )
        .order_by(PaymentSplit.created_at.desc())
    )

    # Count total
    from sqlalchemy import func
    count_query = (
        select(func.count(PaymentSplit.id))
        .join(PaymentRequest, PaymentSplit.payment_request_id == PaymentRequest.id)
        .where(
            or_(
                PaymentSplit.user_id == current_user.id,
                PaymentRequest.requester_id == current_user.id,
            )
        )
    )
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Paginated results
    paginated_query = splits_query.offset(offset).limit(limit)
    result = await db.execute(paginated_query)
    splits = result.scalars().all()

    data = []
    seen = set()
    for s in splits:
        pr = s.payment_request
        # Skip duplicates (requester sees their own splits)
        if s.id in seen:
            continue
        seen.add(s.id)

        # Skip requester's own split entry when they are the payer
        if s.user_id == pr.requester_id:
            continue

        if pr.requester_id == current_user.id:
            # I'm the requester -> direction is "received"
            direction = "received"
            counterpart = UserBriefResponse(
                id=s.user.id,
                username=s.user.username,
                profile_image=s.user.profile_image,
            )
        else:
            # I'm a participant -> direction is "sent"
            direction = "sent"
            counterpart = UserBriefResponse(
                id=pr.requester.id,
                username=pr.requester.username,
                profile_image=pr.requester.profile_image,
            )

        data.append(SettlementHistoryItem(
            id=s.id,
            payment_request_id=pr.id,
            chat_id=pr.chat_id,
            direction=direction,
            counterpart=counterpart,
            amount=s.amount,
            status=s.status,
            created_at=s.created_at,
        ))

    return SettlementHistoryResponse(
        data=data, total=total, page=page, limit=limit,
    )
