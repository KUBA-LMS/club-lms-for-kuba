from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.event import Event
from app.models.bookmark import Bookmark
from app.schemas.bookmark import (
    BookmarkCreate,
    BookmarkToggleResponse,
    BookmarkWithEventResponse,
    BookmarkListResponse,
)
from app.schemas.event import EventBriefResponse

router = APIRouter()


@router.post("/", response_model=BookmarkToggleResponse)
async def toggle_bookmark(
    data: BookmarkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle bookmark on an event. Returns whether event is now bookmarked."""
    # Verify event exists
    event_result = await db.execute(select(Event).where(Event.id == data.event_id))
    if not event_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    existing = await db.execute(
        select(Bookmark).where(
            and_(
                Bookmark.user_id == current_user.id,
                Bookmark.event_id == data.event_id,
            )
        )
    )
    bookmark = existing.scalar_one_or_none()

    if bookmark:
        await db.delete(bookmark)
        await db.commit()
        return BookmarkToggleResponse(bookmarked=False)
    else:
        new_bookmark = Bookmark(user_id=current_user.id, event_id=data.event_id)
        db.add(new_bookmark)
        await db.commit()
        return BookmarkToggleResponse(bookmarked=True)


@router.get("/", response_model=BookmarkListResponse)
async def list_bookmarks(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List current user's bookmarked events."""
    offset = (page - 1) * limit

    count_query = select(func.count(Bookmark.id)).where(
        Bookmark.user_id == current_user.id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = (
        select(Bookmark)
        .options(selectinload(Bookmark.event))
        .where(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    bookmarks = result.scalars().all()

    return BookmarkListResponse(
        data=[
            BookmarkWithEventResponse(
                id=bk.id,
                event=EventBriefResponse(
                    id=bk.event.id,
                    title=bk.event.title,
                    description=bk.event.description,
                    event_date=bk.event.event_date,
                    event_type=bk.event.event_type,
                    cost_type=bk.event.cost_type,
                    images=bk.event.images or [],
                    current_slots=bk.event.current_slots,
                    max_slots=bk.event.max_slots,
                    latitude=bk.event.latitude,
                    longitude=bk.event.longitude,
                ),
                created_at=bk.created_at,
            )
            for bk in bookmarks
        ],
        total=total,
        page=page,
        limit=limit,
    )
