from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from enum import Enum

from app.schemas.user import UserBriefResponse, UserBankAccountResponse


class PaymentRequestCreate(BaseModel):
    total_amount: Decimal = Field(..., gt=0)
    participant_ids: List[UUID]


class PaymentSplitResponse(BaseModel):
    id: UUID
    user: UserBriefResponse
    amount: Decimal
    status: str
    sent_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PaymentRequestResponse(BaseModel):
    id: UUID
    total_amount: Decimal
    status: str
    requester: UserBriefResponse
    requester_bank: Optional[UserBankAccountResponse] = None
    splits: List[PaymentSplitResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class SettlementHistoryItem(BaseModel):
    id: UUID
    payment_request_id: UUID
    chat_id: UUID
    chat_name: Optional[str] = None
    direction: str  # "sent" or "received"
    counterpart: UserBriefResponse
    amount: Decimal
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SettlementHistoryResponse(BaseModel):
    data: List[SettlementHistoryItem]
    total: int
    page: int
    limit: int
