from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.schemas.registration import RegistrationBriefResponse, RegistrationStatusEnum
from app.schemas.event import EventBriefResponse


class TicketResponse(BaseModel):
    id: UUID
    barcode: str
    is_used: bool
    used_at: Optional[datetime] = None
    registration: RegistrationBriefResponse
    event_title: Optional[str] = None
    event_date: Optional[datetime] = None
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


class OnePassTicketResponse(BaseModel):
    id: UUID
    barcode: str
    is_used: bool
    used_at: Optional[datetime] = None
    registration_id: UUID
    registration_status: RegistrationStatusEnum
    event: EventBriefResponse
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OnePassListResponse(BaseModel):
    data: List[OnePassTicketResponse]
    total: int


class SelfCheckinRequest(BaseModel):
    barcode: str


class CheckinResponse(BaseModel):
    success: bool
    message: str
    ticket: Optional[OnePassTicketResponse] = None
