import uuid

from sqlalchemy import Column, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Bookmark(Base, TimestampMixin):
    __tablename__ = "bookmarks"
    __table_args__ = (
        UniqueConstraint("user_id", "event_id", name="uq_bookmark_user_event"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False, index=True)

    user = relationship("User", backref="bookmarks")
    event = relationship("Event", backref="bookmarks")
