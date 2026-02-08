import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime, Numeric, Enum as SQLEnum, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Event(Base, TimestampMixin):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    images = Column(ARRAY(String), default=list)
    event_type = Column(SQLEnum("official", "private", name="event_type_enum"), nullable=False)
    cost_type = Column(SQLEnum("free", "prepaid", "one_n", name="cost_type_enum"), nullable=False)
    cost_amount = Column(Numeric(10, 2), nullable=True)
    registration_start = Column(DateTime, nullable=False)
    registration_end = Column(DateTime, nullable=False)
    event_date = Column(DateTime, nullable=False)
    event_location = Column(String(500), nullable=True)
    max_slots = Column(Integer, nullable=False)
    current_slots = Column(Integer, default=0, nullable=False)

    # Foreign Keys
    provided_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    posted_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    club_id = Column(UUID(as_uuid=True), ForeignKey("clubs.id"), nullable=False)

    # Relationships
    provided_by = relationship("User", foreign_keys=[provided_by_id], back_populates="provided_events")
    posted_by = relationship("User", foreign_keys=[posted_by_id], back_populates="posted_events")
    club = relationship("Club", back_populates="events")
    registrations = relationship("Registration", back_populates="event")
