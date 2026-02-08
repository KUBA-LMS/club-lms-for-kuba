from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ClubBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    logo_image: Optional[str] = None
    university: Optional[str] = Field(None, max_length=100)


class ClubCreate(ClubBase):
    pass


class ClubUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    logo_image: Optional[str] = None
    university: Optional[str] = Field(None, max_length=100)


class ClubResponse(ClubBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    member_count: Optional[int] = None

    model_config = {"from_attributes": True}


class ClubBriefResponse(BaseModel):
    id: UUID
    name: str
    logo_image: Optional[str] = None

    model_config = {"from_attributes": True}


class ClubListResponse(BaseModel):
    data: List[ClubResponse]
    total: int
    page: int
    limit: int


class JoinClubRequest(BaseModel):
    pass  # Can add additional fields like reason, etc.
