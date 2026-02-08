from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


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


# List response with pagination
class UserListResponse(BaseModel):
    data: List[UserResponse]
    total: int
    page: int
    limit: int
