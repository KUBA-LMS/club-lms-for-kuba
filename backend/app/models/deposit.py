import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Deposit(Base, TimestampMixin):
    """Per-user, per-club deposit balance."""
    __tablename__ = "deposits"
    __table_args__ = (
        UniqueConstraint("user_id", "club_id", name="uq_deposit_user_club"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    balance = Column(Numeric(12, 2), nullable=False, default=0)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    club_id = Column(UUID(as_uuid=True), ForeignKey("clubs.id"), nullable=False, index=True)

    user = relationship("User")
    club = relationship("Club")
    transactions = relationship(
        "DepositTransaction",
        back_populates="deposit",
        order_by="DepositTransaction.created_at.desc()",
        lazy="dynamic",
    )


class DepositTransaction(Base, TimestampMixin):
    """Individual ledger entry for a deposit. Positive = top-up, negative = deduction."""
    __tablename__ = "deposit_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    amount = Column(Numeric(12, 2), nullable=False)
    balance_after = Column(Numeric(12, 2), nullable=False)
    description = Column(String(300), nullable=False)

    deposit_id = Column(UUID(as_uuid=True), ForeignKey("deposits.id"), nullable=False, index=True)

    deposit = relationship("Deposit", back_populates="transactions")
