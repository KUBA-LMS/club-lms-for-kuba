from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from app.schemas.deposit import DepositTransactionResponse


# --- Member Management ---

class AdminMemberDepositInfo(BaseModel):
    deposit_id: Optional[UUID] = None
    balance: Decimal = Decimal("0")
    recent_transactions: List[DepositTransactionResponse] = []


class AdminMemberResponse(BaseModel):
    id: UUID
    username: str
    legal_name: Optional[str] = None
    student_id: Optional[str] = None
    profile_image: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    club_role: str  # "member" or "lead" from user_club
    is_admin: bool  # User.role == "admin"
    deposit: AdminMemberDepositInfo

    model_config = {"from_attributes": True}


class AdminMemberListResponse(BaseModel):
    data: List[AdminMemberResponse]
    total: int
    page: int
    limit: int


class DepositAdjustRequest(BaseModel):
    amount: Decimal = Field(..., description="Positive for top-up, negative for deduction")
    description: str = Field(..., min_length=1, max_length=300)


# --- Member Search ---

class CommonGroupInfo(BaseModel):
    id: UUID
    name: str
    logo_image: Optional[str] = None


class SearchNonMemberResponse(BaseModel):
    id: UUID
    username: str
    legal_name: Optional[str] = None
    profile_image: Optional[str] = None
    common_groups: List[CommonGroupInfo] = []


class SearchNonMemberListResponse(BaseModel):
    data: List[SearchNonMemberResponse]
    total: int


# --- Organization ---

class AdminProfileResponse(BaseModel):
    id: UUID
    username: str
    legal_name: Optional[str] = None
    student_id: Optional[str] = None
    profile_image: Optional[str] = None


class OrgStats(BaseModel):
    subgroups: int
    admins: int
    normal_users: int


class LeadInfo(BaseModel):
    id: UUID
    username: str
    profile_image: Optional[str] = None


class SubgroupCardResponse(BaseModel):
    id: UUID
    name: str
    logo_image: Optional[str] = None
    member_count: int
    admin_count: int
    normal_count: int
    leads: List[LeadInfo] = []


class AdminOrganizationResponse(BaseModel):
    my_profile: AdminProfileResponse
    supervisor_names: List[str] = []
    lead_name: Optional[str] = None
    stats: OrgStats
    subgroups: List[SubgroupCardResponse]


class SubgroupMemberResponse(BaseModel):
    id: UUID
    username: str
    profile_image: Optional[str] = None
    is_admin: bool
    club_role: str
    deposit_balance: Decimal = Decimal("0")
    managed_member_count: Optional[int] = None
    managed_admin_count: Optional[int] = None
    managed_normal_count: Optional[int] = None


class SubgroupMemberListResponse(BaseModel):
    data: List[SubgroupMemberResponse]
    total: int
    page: int
    limit: int


# --- Event Management ---

class AdminEventResponse(BaseModel):
    id: UUID
    title: str
    images: List[str] = []
    event_date: datetime
    event_type: str
    cost_type: str
    cost_amount: Optional[Decimal] = None
    status: str  # "open" or "expired"
    registration_count: int
    max_slots: int
    event_location: Optional[str] = None


class AdminEventListResponse(BaseModel):
    upcoming: List[AdminEventResponse]
    past: List[AdminEventResponse]
    total_upcoming: int
    total_past: int
    past_page: int
    past_limit: int


# --- Task Management ---

class TaskUserInfo(BaseModel):
    id: UUID
    username: str
    profile_image: Optional[str] = None


class TaskEventInfo(BaseModel):
    id: UUID
    title: str
    event_date: datetime
    event_type: str
    cost_type: str


class AdminTaskResponse(BaseModel):
    registration_id: UUID
    user: TaskUserInfo
    event: TaskEventInfo
    status: str  # "pending", "confirmed", "cancelled"
    timeout_seconds: int  # seconds remaining until registration_end
    created_at: datetime


class AdminTaskListResponse(BaseModel):
    current: List[AdminTaskResponse]
    history: List[AdminTaskResponse]
