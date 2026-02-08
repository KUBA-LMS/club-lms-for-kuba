from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.schemas.registration import RegistrationBriefResponse


class TicketResponse(BaseModel):
    id: UUID
    barcode: str
    is_used: bool
    used_at: Optional[datetime] = None
    registration: RegistrationBriefResponse
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TicketBriefResponse(BaseModel):
    id: UUID
    barcode: str
    is_used: bool
    event_title: Optional[str] = None
    event_date: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TicketListResponse(BaseModel):
    data: List[TicketResponse]
    total: int


class TicketValidateRequest(BaseModel):
    barcode: str


class TicketValidateResponse(BaseModel):
    valid: bool
    message: str
    ticket: Optional[TicketResponse] = None
