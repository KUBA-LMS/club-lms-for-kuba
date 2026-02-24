from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from app.schemas.user import UserBriefResponse


class PaymentRequestCreate(BaseModel):
    total_amount: Decimal = Field(..., gt=0)
    participant_ids: List[UUID]


class PaymentSplitAction(BaseModel):
    action: str = Field(..., pattern="^(accumulate|use_deposit)$")


class PaymentSplitResponse(BaseModel):
    id: UUID
    user: UserBriefResponse
    amount: Decimal
    status: str

    model_config = {"from_attributes": True}


class PaymentRequestResponse(BaseModel):
    id: UUID
    total_amount: Decimal
    status: str
    requester: UserBriefResponse
    splits: List[PaymentSplitResponse]
    created_at: datetime

    model_config = {"from_attributes": True}
