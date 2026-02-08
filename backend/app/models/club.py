import uuid
from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.models.user import user_club


class Club(Base, TimestampMixin):
    __tablename__ = "clubs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    logo_image = Column(String(500), nullable=True)
    university = Column(String(100), nullable=True)

    # Relationships
    members = relationship("User", secondary=user_club, back_populates="clubs")
    events = relationship("Event", back_populates="club")
