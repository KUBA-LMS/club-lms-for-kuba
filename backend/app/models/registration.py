import uuid
from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Registration(Base, TimestampMixin):
    __tablename__ = "registrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status = Column(
        SQLEnum("pending", "confirmed", "cancelled", "checked_in", name="registration_status_enum"),
        default="pending",
        nullable=False,
    )
    payment_status = Column(
        SQLEnum("pending", "completed", "refunded", name="payment_status_enum"),
        default="pending",
        nullable=False,
    )
    checked_in_at = Column(DateTime, nullable=True)

    # Foreign Keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="registrations")
    event = relationship("Event", back_populates="registrations")
    ticket = relationship("Ticket", back_populates="registration", uselist=False)
