from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID
from enum import Enum

from app.schemas.club import ClubBriefResponse


class ScanResultEnum(str, Enum):
    entry_approved = "entry_approved"
    entry_denied_pending = "entry_denied_pending"
    entry_denied_no_ticket = "entry_denied_no_ticket"
    double_checked_in = "double_checked_in"


class TicketStatusEnum(str, Enum):
    registered = "registered"
    requested = "requested"
    checked_in = "checked_in"
    not_applied = "not_applied"


class ScanRequest(BaseModel):
    barcode: str


class ParticipantResponse(BaseModel):
    user_id: UUID
    username: str
    legal_name: str
    student_id: Optional[str] = None
    profile_image: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    registration_id: Optional[UUID] = None
    registration_status: Optional[str] = None
    ticket_status: TicketStatusEnum
    checked_in_at: Optional[datetime] = None
    clubs: List[ClubBriefResponse] = []

    model_config = {"from_attributes": True}


class ScanResponse(BaseModel):
    result: ScanResultEnum
    message: str
    participant: Optional[ParticipantResponse] = None


class ParticipantsListResponse(BaseModel):
    data: List[ParticipantResponse]
    total: int
    counts: Dict[str, int]


class OverrideResponse(BaseModel):
    success: bool
    message: str
    participant: Optional[ParticipantResponse] = None


class WalkInRequest(BaseModel):
    user_id: UUID


class UserSearchResponse(BaseModel):
    id: UUID
    username: str
    legal_name: str
    student_id: Optional[str] = None
    profile_image: Optional[str] = None

    model_config = {"from_attributes": True}
