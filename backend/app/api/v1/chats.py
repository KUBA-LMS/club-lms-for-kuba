from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.chat import Chat, ChatMember, Message
from app.models.ticket import Ticket
from app.models.registration import Registration
from app.schemas.chat import (
    ChatCreate,
    ChatResponse,
    ChatMemberResponse,
    ChatListResponse,
    ChatTypeEnum,
    MessageCreate,
    MessageResponse,
    MessageBriefResponse,
    MessageListResponse,
    ChatMemberAdd,
    TicketTransferCreate,
)
from app.schemas.user import UserBriefResponse
from app.services.notifications import (
    notify_new_message,
    notify_chat_list_update,
    notify_read_receipt,
)

router = APIRouter()


def build_chat_response(
    chat: Chat,
    last_message: Optional[Message] = None,
    unread_count: int = 0,
) -> ChatResponse:
    """Helper to build ChatResponse."""
    members = [
        ChatMemberResponse(
            id=m.user.id,
            username=m.user.username,
            profile_image=m.user.profile_image,
            last_read_at=m.last_read_at,
        )
        for m in chat.members
    ]

    last_msg = None
    if last_message:
        last_msg = MessageBriefResponse(
            id=last_message.id,
            content=last_message.content,
            type=last_message.type,
            sender_id=last_message.sender_id,
            created_at=last_message.created_at,
        )

    return ChatResponse(
        id=chat.id,
        type=chat.type,
        name=chat.name,
        event_id=chat.event_id,
        members=members,
        last_message=last_msg,
        unread_count=unread_count,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
    )


async def _get_unread_count(db: AsyncSession, chat_id: UUID, user_id: UUID) -> int:
    """Compute unread message count for a user in a chat."""
    # Get member's last_read_at
    member_query = select(ChatMember.last_read_at).where(
        (ChatMember.chat_id == chat_id) & (ChatMember.user_id == user_id)
    )
    result = await db.execute(member_query)
    row = result.first()
    if not row:
        return 0

    last_read_at = row[0]
    if last_read_at is None:
        # Never read - count all messages not sent by this user
        count_query = select(func.count(Message.id)).where(
            (Message.chat_id == chat_id) & (Message.sender_id != user_id)
        )
    else:
        count_query = select(func.count(Message.id)).where(
            (Message.chat_id == chat_id)
            & (Message.sender_id != user_id)
            & (Message.created_at > last_read_at)
        )
    count_result = await db.execute(count_query)
    return count_result.scalar() or 0


async def _publish_message_notifications(
    db: AsyncSession,
    chat_id: UUID,
    message: Message,
    sender: User,
):
    """Publish WebSocket notifications after sending a message."""
    created_at_str = message.created_at.isoformat() if message.created_at else datetime.utcnow().isoformat()

    # Publish to chat channel (for users in the chat room)
    await notify_new_message(
        chat_id=chat_id,
        message_id=message.id,
        sender_id=sender.id,
        sender_username=sender.username,
        content=message.content,
        message_type=message.type,
        created_at=created_at_str,
        ticket_id=message.ticket_id,
        payment_amount=message.payment_amount,
        payment_request_id=message.payment_request_id,
    )

    # Publish to user channels for each OTHER member (chat list updates)
    members_query = select(ChatMember.user_id).where(
        (ChatMember.chat_id == chat_id) & (ChatMember.user_id != sender.id)
    )
    members_result = await db.execute(members_query)
    for row in members_result.fetchall():
        await notify_chat_list_update(
            user_id=row[0],
            chat_id=chat_id,
            last_message=message.content,
            last_message_type=message.type,
            sender_username=sender.username,
            timestamp=created_at_str,
        )


@router.get("/", response_model=ChatListResponse)
async def list_chats(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List current user's chats."""
    offset = (page - 1) * limit

    # Get chat IDs for current user
    member_query = select(ChatMember.chat_id).where(
        ChatMember.user_id == current_user.id
    )
    member_result = await db.execute(member_query)
    chat_ids = [row[0] for row in member_result.fetchall()]

    if not chat_ids:
        return ChatListResponse(data=[], total=0)

    total = len(chat_ids)

    # Get chats with members
    chats_query = (
        select(Chat)
        .options(selectinload(Chat.members).selectinload(ChatMember.user))
        .where(Chat.id.in_(chat_ids))
        .order_by(Chat.updated_at.desc())
        .offset(offset)
        .limit(limit)
    )
    chats_result = await db.execute(chats_query)
    chats = chats_result.scalars().all()

    # Get last messages and unread counts for each chat
    chat_responses = []
    for chat in chats:
        last_msg_query = (
            select(Message)
            .where(Message.chat_id == chat.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_msg_result = await db.execute(last_msg_query)
        last_message = last_msg_result.scalar_one_or_none()

        unread_count = await _get_unread_count(db, chat.id, current_user.id)

        chat_responses.append(build_chat_response(chat, last_message, unread_count))

    return ChatListResponse(data=chat_responses, total=total)


@router.post("/", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(
    chat_data: ChatCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new chat."""
    # Validate members exist
    member_ids = list(set(chat_data.member_ids))
    if current_user.id not in member_ids:
        member_ids.append(current_user.id)

    users_query = select(User).where(User.id.in_(member_ids))
    users_result = await db.execute(users_query)
    users = users_result.scalars().all()

    if len(users) != len(member_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some users not found",
        )

    # For direct chats, check if one already exists
    if chat_data.type == ChatTypeEnum.direct and len(member_ids) == 2:
        other_id = [uid for uid in member_ids if uid != current_user.id][0]

        existing_query = (
            select(Chat)
            .join(ChatMember)
            .where(
                and_(
                    Chat.type == ChatTypeEnum.direct,
                    ChatMember.user_id.in_([current_user.id, other_id]),
                )
            )
            .group_by(Chat.id)
            .having(func.count(ChatMember.user_id) == 2)
        )
        existing_result = await db.execute(existing_query)
        existing_chat = existing_result.scalar_one_or_none()

        if existing_chat:
            # Return existing chat
            chat_query = (
                select(Chat)
                .options(selectinload(Chat.members).selectinload(ChatMember.user))
                .where(Chat.id == existing_chat.id)
            )
            chat_result = await db.execute(chat_query)
            chat = chat_result.scalar_one()
            return build_chat_response(chat)

    # Create chat
    new_chat = Chat(
        type=chat_data.type,
        name=chat_data.name,
        event_id=chat_data.event_id,
    )
    db.add(new_chat)
    await db.flush()

    # Add members
    for user_id in member_ids:
        member = ChatMember(chat_id=new_chat.id, user_id=user_id)
        db.add(member)

    await db.commit()

    # Reload with relationships
    chat_query = (
        select(Chat)
        .options(selectinload(Chat.members).selectinload(ChatMember.user))
        .where(Chat.id == new_chat.id)
    )
    chat_result = await db.execute(chat_query)
    chat = chat_result.scalar_one()

    return build_chat_response(chat)


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get chat details."""
    # Verify membership
    member_check = await db.execute(
        select(ChatMember).where(
            (ChatMember.chat_id == chat_id) & (ChatMember.user_id == current_user.id)
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this chat",
        )

    chat_query = (
        select(Chat)
        .options(selectinload(Chat.members).selectinload(ChatMember.user))
        .where(Chat.id == chat_id)
    )
    chat_result = await db.execute(chat_query)
    chat = chat_result.scalar_one_or_none()

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )

    # Get last message
    last_msg_query = (
        select(Message)
        .where(Message.chat_id == chat.id)
        .order_by(Message.created_at.desc())
        .limit(1)
    )
    last_msg_result = await db.execute(last_msg_query)
    last_message = last_msg_result.scalar_one_or_none()

    unread_count = await _get_unread_count(db, chat.id, current_user.id)

    return build_chat_response(chat, last_message, unread_count)


@router.get("/{chat_id}/messages", response_model=MessageListResponse)
async def get_chat_messages(
    chat_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get messages in a chat."""
    offset = (page - 1) * limit

    # Verify membership
    member_check = await db.execute(
        select(ChatMember).where(
            (ChatMember.chat_id == chat_id) & (ChatMember.user_id == current_user.id)
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this chat",
        )

    # Count total
    count_query = select(func.count(Message.id)).where(Message.chat_id == chat_id)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get messages
    messages_query = (
        select(Message)
        .options(selectinload(Message.sender))
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    messages_result = await db.execute(messages_query)
    messages = messages_result.scalars().all()

    return MessageListResponse(
        data=[
            MessageResponse(
                id=m.id,
                content=m.content,
                type=m.type,
                ticket_id=m.ticket_id,
                payment_amount=m.payment_amount,
                payment_request_id=m.payment_request_id,
                sender=UserBriefResponse(
                    id=m.sender.id,
                    username=m.sender.username,
                    profile_image=m.sender.profile_image,
                ),
                created_at=m.created_at,
            )
            for m in messages
        ],
        total=total,
        page=page,
        limit=limit,
    )


@router.post("/{chat_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    chat_id: UUID,
    message_data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to a chat."""
    # Verify membership
    member_check = await db.execute(
        select(ChatMember).where(
            (ChatMember.chat_id == chat_id) & (ChatMember.user_id == current_user.id)
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this chat",
        )

    # Create message
    new_message = Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        content=message_data.content,
        type=message_data.type,
        ticket_id=message_data.ticket_id,
        payment_amount=message_data.payment_amount,
    )
    db.add(new_message)

    # Update chat updated_at
    chat_query = select(Chat).where(Chat.id == chat_id)
    chat_result = await db.execute(chat_query)
    chat = chat_result.scalar_one()
    chat.updated_at = datetime.utcnow()

    # Mark sender's messages as read (they just sent one)
    sender_member_query = select(ChatMember).where(
        (ChatMember.chat_id == chat_id) & (ChatMember.user_id == current_user.id)
    )
    sender_member_result = await db.execute(sender_member_query)
    sender_member = sender_member_result.scalar_one()
    sender_member.last_read_at = datetime.utcnow()

    await db.commit()
    await db.refresh(new_message)

    # Publish WebSocket notifications (fire-and-forget)
    try:
        await _publish_message_notifications(db, chat_id, new_message, current_user)
    except Exception:
        pass  # WS failure should not block message delivery

    return MessageResponse(
        id=new_message.id,
        content=new_message.content,
        type=new_message.type,
        ticket_id=new_message.ticket_id,
        payment_amount=new_message.payment_amount,
        payment_request_id=new_message.payment_request_id,
        sender=UserBriefResponse(
            id=current_user.id,
            username=current_user.username,
            profile_image=current_user.profile_image,
        ),
        created_at=new_message.created_at,
    )


@router.post("/{chat_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_chat_read(
    chat_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all messages in a chat as read for the current user."""
    member_query = select(ChatMember).where(
        (ChatMember.chat_id == chat_id) & (ChatMember.user_id == current_user.id)
    )
    member_result = await db.execute(member_query)
    member = member_result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this chat",
        )

    now = datetime.utcnow()
    member.last_read_at = now
    await db.commit()

    # Broadcast read receipt to chat channel (for users in the chat room)
    try:
        await notify_read_receipt(chat_id, current_user.id, now.isoformat())
    except Exception:
        pass

    # Broadcast to user channels for ALL members including self
    # Self needs it to reset unread_count on chat list when reading from inside the room
    try:
        from app.services.ws_manager import manager
        members_query = select(ChatMember.user_id).where(
            ChatMember.chat_id == chat_id
        )
        members_result = await db.execute(members_query)
        for row in members_result.fetchall():
            await manager.publish(f"user:{row[0]}", {
                "type": "read_receipt",
                "channel": f"user:{row[0]}",
                "data": {
                    "chat_id": str(chat_id),
                    "user_id": str(current_user.id),
                    "last_read_at": now.isoformat(),
                },
            })
    except Exception:
        pass


@router.post("/{chat_id}/transfer-ticket", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def transfer_ticket(
    chat_id: UUID,
    data: TicketTransferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Transfer a ticket to a chat member and send a ticket message."""
    # Verify membership
    member_check = await db.execute(
        select(ChatMember).where(
            (ChatMember.chat_id == chat_id) & (ChatMember.user_id == current_user.id)
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this chat")

    # Verify ticket belongs to current user
    ticket_query = (
        select(Ticket)
        .join(Registration, Ticket.registration_id == Registration.id)
        .where(
            (Ticket.id == data.ticket_id)
            & (Registration.user_id == current_user.id)
            & (Ticket.is_used == False)
        )
    )
    ticket_result = await db.execute(ticket_query)
    ticket = ticket_result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found or not yours")

    # Get the event info for the message content
    reg_query = (
        select(Registration)
        .options(selectinload(Registration.event))
        .where(Registration.id == ticket.registration_id)
    )
    reg_result = await db.execute(reg_query)
    reg = reg_result.scalar_one()

    event_title = reg.event.title if reg.event else "Ticket"
    event_location = reg.event.event_location or ""
    event_date = reg.event.event_date.strftime("%b %d, %Y") if reg.event and reg.event.event_date else ""

    # Mark ticket as used (transferred)
    ticket.is_used = True

    # Create ticket_delivered message (from sender's perspective)
    content = f"{event_title}|{event_location}|{event_date}"
    new_message = Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        content=content,
        type="ticket_delivered",
        ticket_id=data.ticket_id,
    )
    db.add(new_message)

    # Update chat updated_at
    chat_query = select(Chat).where(Chat.id == chat_id)
    chat_result = await db.execute(chat_query)
    chat = chat_result.scalar_one()
    chat.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(new_message)

    # WS notifications
    try:
        await _publish_message_notifications(db, chat_id, new_message, current_user)
    except Exception:
        pass

    return MessageResponse(
        id=new_message.id,
        content=new_message.content,
        type=new_message.type,
        ticket_id=new_message.ticket_id,
        payment_amount=None,
        payment_request_id=None,
        sender=UserBriefResponse(
            id=current_user.id,
            username=current_user.username,
            profile_image=current_user.profile_image,
        ),
        created_at=new_message.created_at,
    )


@router.post("/{chat_id}/members", status_code=status.HTTP_201_CREATED)
async def add_chat_members(
    chat_id: UUID,
    member_data: ChatMemberAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add members to a group chat."""
    # Verify membership
    member_check = await db.execute(
        select(ChatMember).where(
            (ChatMember.chat_id == chat_id) & (ChatMember.user_id == current_user.id)
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this chat",
        )

    # Get chat
    chat_query = select(Chat).where(Chat.id == chat_id)
    chat_result = await db.execute(chat_query)
    chat = chat_result.scalar_one_or_none()

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )

    if chat.type == ChatTypeEnum.direct:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add members to a direct chat",
        )

    # Add new members
    for user_id in member_data.user_ids:
        # Check if already a member
        existing = await db.execute(
            select(ChatMember).where(
                (ChatMember.chat_id == chat_id) & (ChatMember.user_id == user_id)
            )
        )
        if existing.scalar_one_or_none():
            continue

        # Verify user exists
        user_check = await db.execute(select(User).where(User.id == user_id))
        if not user_check.scalar_one_or_none():
            continue

        member = ChatMember(chat_id=chat_id, user_id=user_id)
        db.add(member)

    await db.commit()

    return {"message": "Members added successfully"}


@router.delete("/{chat_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_chat_member(
    chat_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a member from a group chat (self or by admin)."""
    # Verify current user is a member
    member_check = await db.execute(
        select(ChatMember).where(
            (ChatMember.chat_id == chat_id) & (ChatMember.user_id == current_user.id)
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this chat",
        )

    # Get chat
    chat_query = select(Chat).where(Chat.id == chat_id)
    chat_result = await db.execute(chat_query)
    chat = chat_result.scalar_one_or_none()

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )

    if chat.type == ChatTypeEnum.direct:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove members from a direct chat",
        )

    # Only allow self-removal or admin removal
    if user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only remove yourself from group chats",
        )

    await db.execute(
        ChatMember.__table__.delete().where(
            (ChatMember.chat_id == chat_id) & (ChatMember.user_id == user_id)
        )
    )
    await db.commit()
