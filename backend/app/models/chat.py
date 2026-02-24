import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Chat(Base, TimestampMixin):
    __tablename__ = "chats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(SQLEnum("direct", "group", "event", name="chat_type_enum"), nullable=False)
    name = Column(String(100), nullable=True)

    # Foreign Keys (optional for event chats)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=True)

    # Relationships
    members = relationship("ChatMember", back_populates="chat")
    messages = relationship("Message", back_populates="chat", order_by="Message.created_at")


class ChatMember(Base):
    __tablename__ = "chat_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    joined_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_read_at = Column(DateTime, nullable=True)

    # Foreign Keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="chat_memberships")
    chat = relationship("Chat", back_populates="members")


class Message(Base, TimestampMixin):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    type = Column(
        SQLEnum(
            "text", "image", "ticket", "payment_request",
            "ticket_delivered", "payment_completed", "event_share",
            name="message_type_enum",
        ),
        default="text",
        nullable=False,
    )
    # Metadata for special message types
    ticket_id = Column(UUID(as_uuid=True), nullable=True)
    payment_amount = Column(Numeric(10, 2), nullable=True)
    payment_request_id = Column(UUID(as_uuid=True), nullable=True)  # No FK to avoid circular dep

    # Foreign Keys
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relationships
    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User", back_populates="messages")
