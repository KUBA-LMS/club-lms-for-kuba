from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from enum import Enum

from app.schemas.user import UserBriefResponse
from app.schemas.club import ClubBriefResponse


class EventTypeEnum(str, Enum):
    official = "official"
    private = "private"


class CostTypeEnum(str, Enum):
    free = "free"
    prepaid = "prepaid"
    one_n = "one_n"


class EventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    images: List[str] = []
    event_type: EventTypeEnum
    cost_type: CostTypeEnum
    cost_amount: Optional[Decimal] = None
    registration_start: datetime
    registration_end: datetime
    event_date: datetime
    event_location: Optional[str] = Field(None, max_length=500)
    max_slots: int = Field(..., gt=0)


class EventCreate(EventBase):
    club_id: UUID


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    images: Optional[List[str]] = None
    event_type: Optional[EventTypeEnum] = None
    cost_type: Optional[CostTypeEnum] = None
    cost_amount: Optional[Decimal] = None
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None
    event_date: Optional[datetime] = None
    event_location: Optional[str] = Field(None, max_length=500)
    max_slots: Optional[int] = Field(None, gt=0)


class EventResponse(EventBase):
    id: UUID
    current_slots: int
    provided_by: UserBriefResponse
    posted_by: UserBriefResponse
    club: ClubBriefResponse
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EventBriefResponse(BaseModel):
    id: UUID
    title: str
    event_date: datetime
    event_type: EventTypeEnum
    cost_type: CostTypeEnum
    images: List[str] = []
    current_slots: int
    max_slots: int

    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    data: List[EventResponse]
    total: int
    page: int
    limit: int


class EventWithStatusListResponse(BaseModel):
    data: List["EventWithStatusResponse"]
    total: int
    page: int
    limit: int


class EventFilterEnum(str, Enum):
    upcoming = "upcoming"
    past = "past"
    all = "all"


class UserRegistrationStatus(str, Enum):
    """User's registration status for an event."""
    registered = "registered"  # Confirmed registration
    open = "open"  # Can register
    requested = "requested"  # Pending registration
    closed = "closed"  # Registration period ended
    upcoming = "upcoming"  # Registration not yet open


class EventWithStatusResponse(EventResponse):
    """Event response with user's registration status."""
    user_status: UserRegistrationStatus
    user_registration_id: Optional[UUID] = None
