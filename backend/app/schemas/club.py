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
    parent_id: Optional[UUID] = None


class ClubUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    logo_image: Optional[str] = None
    university: Optional[str] = Field(None, max_length=100)


class ClubResponse(ClubBase):
    id: UUID
    parent_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    member_count: Optional[int] = None

    model_config = {"from_attributes": True}


class ClubBriefResponse(BaseModel):
    id: UUID
    name: str
    logo_image: Optional[str] = None

    model_config = {"from_attributes": True}


class SubgroupBriefResponse(BaseModel):
    id: UUID
    name: str
    logo_image: Optional[str] = None
    role: Optional[str] = None

    model_config = {"from_attributes": True}


class MyClubResponse(BaseModel):
    id: UUID
    name: str
    logo_image: Optional[str] = None
    role: str = "member"
    subgroups: List[SubgroupBriefResponse] = []

    model_config = {"from_attributes": True}


class ClubListResponse(BaseModel):
    data: List[ClubResponse]
    total: int
    page: int
    limit: int


class JoinClubRequest(BaseModel):
    pass
