from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List

from app.schemas.event import EventBriefResponse


class BookmarkCreate(BaseModel):
    event_id: UUID


class BookmarkToggleResponse(BaseModel):
    bookmarked: bool


class BookmarkWithEventResponse(BaseModel):
    id: UUID
    event: EventBriefResponse
    created_at: datetime

    model_config = {"from_attributes": True}


class BookmarkListResponse(BaseModel):
    data: List[BookmarkWithEventResponse]
    total: int
    page: int
    limit: int
