"""
Expo Push Notification service.
Sends push notifications to mobile devices via Expo's push API.
"""

import logging
from typing import Optional
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push(
    token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
):
    """Send a single push notification via Expo Push API."""
    if not token or not token.startswith("ExponentPushToken["):
        return

    message = {
        "to": token,
        "sound": "default",
        "title": title,
        "body": body,
    }
    if data:
        message["data"] = data

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                EXPO_PUSH_URL,
                json=message,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=10.0,
            )
            if resp.status_code != 200:
                logger.warning("Expo push failed: %s", resp.text)
    except Exception as e:
        logger.warning("Push notification error: %s", e)


async def send_push_bulk(
    tokens: list[str],
    title: str,
    body: str,
    data: Optional[dict] = None,
):
    """Send push notifications to multiple tokens."""
    messages = []
    for token in tokens:
        if not token or not token.startswith("ExponentPushToken["):
            continue
        msg = {
            "to": token,
            "sound": "default",
            "title": title,
            "body": body,
        }
        if data:
            msg["data"] = data
        messages.append(msg)

    if not messages:
        return

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=10.0,
            )
            if resp.status_code != 200:
                logger.warning("Expo push bulk failed: %s", resp.text)
    except Exception as e:
        logger.warning("Push notification bulk error: %s", e)


async def send_push_to_user(
    db: AsyncSession,
    user_id: UUID,
    title: str,
    body: str,
    data: Optional[dict] = None,
):
    """Send push notification to a specific user by user_id."""
    result = await db.execute(
        select(User.push_token).where(User.id == user_id)
    )
    token = result.scalar_one_or_none()
    if token:
        await send_push(token, title, body, data)


async def send_push_to_users(
    db: AsyncSession,
    user_ids: list[UUID],
    title: str,
    body: str,
    data: Optional[dict] = None,
    exclude_user_id: Optional[UUID] = None,
):
    """Send push notification to multiple users."""
    if not user_ids:
        return

    query = select(User.push_token).where(
        User.id.in_(user_ids),
        User.push_token.isnot(None),
    )
    if exclude_user_id:
        query = query.where(User.id != exclude_user_id)

    result = await db.execute(query)
    tokens = [row[0] for row in result.all() if row[0]]
    if tokens:
        await send_push_bulk(tokens, title, body, data)
