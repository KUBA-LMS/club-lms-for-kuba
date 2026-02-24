from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum

from app.schemas.club import ClubBriefResponse


class GenderEnum(str, Enum):
    male = "male"
    female = "female"
    other = "other"


class UserRoleEnum(str, Enum):
    member = "member"
    admin = "admin"


# Base schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    legal_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    student_id: Optional[str] = Field(None, max_length=20)
    profile_image: Optional[str] = None
    nationality: Optional[str] = Field(None, max_length=50)
    gender: Optional[GenderEnum] = None


# Create schemas
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserSignUp(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    legal_name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8)
    profile_image: Optional[str] = None
    student_id: Optional[str] = Field(None, max_length=20)
    nationality: Optional[str] = Field(None, max_length=50)
    gender: Optional[GenderEnum] = None


# Update schemas
class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    legal_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    student_id: Optional[str] = Field(None, max_length=20)
    nationality: Optional[str] = Field(None, max_length=50)
    gender: Optional[GenderEnum] = None


class UserProfileImageUpdate(BaseModel):
    profile_image: str


class UserBankAccountUpdate(BaseModel):
    bank_name: str = Field(..., min_length=1, max_length=50)
    bank_account_number: str = Field(..., min_length=1, max_length=50)
    account_holder_name: str = Field(..., min_length=1, max_length=100)


class UserBankAccountResponse(BaseModel):
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    account_holder_name: Optional[str] = None

    model_config = {"from_attributes": True}


# Response schemas
class UserResponse(BaseModel):
    id: UUID
    username: str
    legal_name: str
    email: Optional[str] = None
    student_id: Optional[str] = None
    profile_image: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[GenderEnum] = None
    role: UserRoleEnum
    is_active: bool
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    account_holder_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserBriefResponse(BaseModel):
    id: UUID
    username: str
    profile_image: Optional[str] = None

    model_config = {"from_attributes": True}


class UserProfileResponse(BaseModel):
    id: UUID
    username: str
    profile_image: Optional[str] = None
    nationality: Optional[str] = None
    is_friend: bool = False

    model_config = {"from_attributes": True}


class FriendRequestStatusEnum(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


# Friend/search item with common clubs
class UserSearchItemResponse(BaseModel):
    id: UUID
    username: str
    profile_image: Optional[str] = None
    is_friend: bool = False
    request_status: Optional[str] = None  # "sent", "received", or None
    request_id: Optional[UUID] = None
    common_clubs: List[ClubBriefResponse] = []

    model_config = {"from_attributes": True}


class UserFriendItemResponse(BaseModel):
    id: UUID
    username: str
    profile_image: Optional[str] = None
    common_clubs: List[ClubBriefResponse] = []

    model_config = {"from_attributes": True}


# List response with pagination
class UserListResponse(BaseModel):
    data: List[UserResponse]
    total: int
    page: int
    limit: int


class UserSearchListResponse(BaseModel):
    data: List[UserSearchItemResponse]
    total: int
    page: int
    limit: int


class UserFriendListResponse(BaseModel):
    data: List[UserFriendItemResponse]
    total: int
    page: int
    limit: int


# Friend request schemas
class FriendRequestResponse(BaseModel):
    id: UUID
    from_user: UserBriefResponse
    to_user: UserBriefResponse
    status: FriendRequestStatusEnum
    common_clubs: List[ClubBriefResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class FriendRequestListResponse(BaseModel):
    data: List[FriendRequestResponse]
    total: int
