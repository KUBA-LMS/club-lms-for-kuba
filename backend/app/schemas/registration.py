from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum

from app.schemas.user import UserBriefResponse
from app.schemas.event import EventBriefResponse


class RegistrationStatusEnum(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    checked_in = "checked_in"


class PaymentStatusEnum(str, Enum):
    pending = "pending"
    completed = "completed"
    refunded = "refunded"


class RegistrationCreate(BaseModel):
    event_id: UUID


class RegistrationResponse(BaseModel):
    id: UUID
    status: RegistrationStatusEnum
    payment_status: PaymentStatusEnum
    checked_in_at: Optional[datetime] = None
    user: UserBriefResponse
    event: EventBriefResponse
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RegistrationBriefResponse(BaseModel):
    id: UUID
    status: RegistrationStatusEnum
    payment_status: PaymentStatusEnum
    event_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class RegistrationListResponse(BaseModel):
    data: List[RegistrationResponse]
    total: int
    page: int
    limit: int


class CheckInRequest(BaseModel):
    pass  # Can add barcode verification, etc.
