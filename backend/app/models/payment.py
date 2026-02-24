import uuid
from sqlalchemy import Column, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class PaymentRequest(Base, TimestampMixin):
    __tablename__ = "payment_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(
        SQLEnum("pending", "completed", "cancelled", name="payment_request_status_enum"),
        default="pending",
        nullable=False,
    )

    # Foreign Keys
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=False, unique=True)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)
    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relationships
    message = relationship("Message", foreign_keys=[message_id], backref="payment_request_ref")
    splits = relationship("PaymentSplit", back_populates="payment_request", lazy="selectin")
    requester = relationship("User")


class PaymentSplit(Base, TimestampMixin):
    __tablename__ = "payment_splits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(
        SQLEnum("pending", "accumulated", "deposit_used", name="split_status_enum"),
        default="pending",
        nullable=False,
    )

    # Foreign Keys
    payment_request_id = Column(UUID(as_uuid=True), ForeignKey("payment_requests.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relationships
    payment_request = relationship("PaymentRequest", back_populates="splits")
    user = relationship("User")
