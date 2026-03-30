import uuid
from sqlalchemy import Column, String, Enum as SQLEnum, Boolean, Table, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin

# Association table for user-club membership
user_club = Table(
    "user_club",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
    Column("club_id", UUID(as_uuid=True), ForeignKey("clubs.id"), primary_key=True),
    Column("role", String(20), server_default="member", nullable=False),
    Column("supervisor_id", UUID(as_uuid=True), ForeignKey("users.id"), nullable=True),
)

# Association table for friendships
friendship = Table(
    "friendships",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
    Column("friend_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    legal_name = Column(String(100), nullable=False)
    student_id = Column(String(20), unique=True, nullable=True)
    profile_image = Column(String(500), nullable=True)
    nationality = Column(String(50), nullable=True)
    gender = Column(SQLEnum("male", "female", "other", name="gender_enum"), nullable=True)
    role = Column(SQLEnum("member", "admin", "superadmin", name="role_enum"), default="member", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    bank_name = Column(String(50), nullable=True)
    bank_account_number = Column(String(50), nullable=True)
    account_holder_name = Column(String(100), nullable=True)

    # Relationships
    clubs = relationship(
        "Club", secondary=user_club, back_populates="members",
        primaryjoin="User.id == user_club.c.user_id",
        secondaryjoin="user_club.c.club_id == Club.id",
    )
    friends = relationship(
        "User",
        secondary=friendship,
        primaryjoin=id == friendship.c.user_id,
        secondaryjoin=id == friendship.c.friend_id,
        backref="friended_by",
    )
    registrations = relationship("Registration", back_populates="user")
    provided_events = relationship("Event", foreign_keys="Event.provided_by_id", back_populates="provided_by")
    posted_events = relationship("Event", foreign_keys="Event.posted_by_id", back_populates="posted_by")
    chat_memberships = relationship("ChatMember", back_populates="user")
    messages = relationship("Message", back_populates="sender")


class FriendRequest(Base, TimestampMixin):
    __tablename__ = "friend_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(
        SQLEnum("pending", "accepted", "rejected", name="friend_request_status_enum"),
        default="pending",
        nullable=False,
    )

    from_user = relationship("User", foreign_keys=[from_user_id], backref="sent_friend_requests")
    to_user = relationship("User", foreign_keys=[to_user_id], backref="received_friend_requests")
