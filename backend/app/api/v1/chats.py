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
from app.schemas.chat import (
    ChatCreate,
    ChatResponse,
    ChatListResponse,
    ChatTypeEnum,
    MessageCreate,
    MessageResponse,
    MessageBriefResponse,
    MessageListResponse,
    ChatMemberAdd,
)
from app.schemas.user import UserBriefResponse

router = APIRouter()


def build_chat_response(chat: Chat, last_message: Optional[Message] = None) -> ChatResponse:
    """Helper to build ChatResponse."""
    members = [
        UserBriefResponse(
            id=m.user.id,
            username=m.user.username,
            profile_image=m.user.profile_image,
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
        created_at=chat.created_at,
        updated_at=chat.updated_at,
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

    # Get last messages for each chat
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
        chat_responses.append(build_chat_response(chat, last_message))

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

    return build_chat_response(chat, last_message)


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

    await db.commit()
    await db.refresh(new_message)

    return MessageResponse(
        id=new_message.id,
        content=new_message.content,
        type=new_message.type,
        ticket_id=new_message.ticket_id,
        payment_amount=new_message.payment_amount,
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
