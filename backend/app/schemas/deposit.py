from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from uuid import UUID


class DepositResponse(BaseModel):
    id: UUID
    balance: Decimal
    club_id: UUID
    club_name: str

    model_config = {"from_attributes": True}


class DepositTransactionResponse(BaseModel):
    id: UUID
    amount: Decimal
    balance_after: Decimal
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DepositTransactionListResponse(BaseModel):
    data: List[DepositTransactionResponse]
    total: int
    page: int
    limit: int
