from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from enum import Enum

from app.schemas.user import UserBriefResponse


class ChatMemberResponse(UserBriefResponse):
    last_read_at: Optional[datetime] = None


class ChatTypeEnum(str, Enum):
    direct = "direct"
    group = "group"
    event = "event"


class MessageTypeEnum(str, Enum):
    text = "text"
    image = "image"
    ticket = "ticket"
    payment_request = "payment_request"
    ticket_delivered = "ticket_delivered"
    payment_completed = "payment_completed"
    event_share = "event_share"


# Chat schemas
class ChatCreate(BaseModel):
    type: ChatTypeEnum
    name: Optional[str] = Field(None, max_length=100)
    member_ids: List[UUID]  # Initial members
    event_id: Optional[UUID] = None


class ChatResponse(BaseModel):
    id: UUID
    type: ChatTypeEnum
    name: Optional[str] = None
    event_id: Optional[UUID] = None
    members: List[ChatMemberResponse]
    last_message: Optional["MessageBriefResponse"] = None
    unread_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatListResponse(BaseModel):
    data: List[ChatResponse]
    total: int


# Message schemas
class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    type: MessageTypeEnum = MessageTypeEnum.text
    ticket_id: Optional[UUID] = None
    payment_amount: Optional[Decimal] = None


class MessageResponse(BaseModel):
    id: UUID
    content: str
    type: MessageTypeEnum
    ticket_id: Optional[UUID] = None
    payment_amount: Optional[Decimal] = None
    payment_request_id: Optional[UUID] = None
    sender: UserBriefResponse
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageBriefResponse(BaseModel):
    id: UUID
    content: str
    type: MessageTypeEnum
    sender_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageListResponse(BaseModel):
    data: List[MessageResponse]
    total: int
    page: int
    limit: int


# Member management
class ChatMemberAdd(BaseModel):
    user_ids: List[UUID]


# Ticket transfer
class TicketTransferCreate(BaseModel):
    ticket_id: UUID
