"""
WebSocket endpoint with JWT authentication and channel subscriptions.

Connect: ws://host/api/v1/ws?token=<JWT>

Client -> Server:
  {"type": "subscribe", "channel": "event:<uuid>"}
  {"type": "unsubscribe", "channel": "event:<uuid>"}
  {"type": "ping"}

Server -> Client:
  {"type": "subscribed", "channel": "..."}
  {"type": "unsubscribed", "channel": "..."}
  {"type": "pong"}
  {"type": "error", "message": "..."}
  {"type": "<notification>", "channel": "...", "data": {...}}
"""

import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_token
from app.models.chat import ChatMember
from app.models.user import user_club
from app.services.ws_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    # Authenticate via JWT
    payload = verify_token(token)
    if not payload or not payload.get("sub"):
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = str(payload["sub"])
    user_role = payload.get("role")

    await manager.connect(websocket, user_id)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await manager.send_to_user(user_id, {
                    "type": "error", "message": "Invalid JSON",
                })
                continue

            msg_type = msg.get("type")

            if msg_type == "ping":
                await manager.send_to_user(user_id, {"type": "pong"})

            elif msg_type == "subscribe":
                channel = msg.get("channel", "")
                if not await _can_subscribe(db, channel, user_id, user_role):
                    await manager.send_to_user(user_id, {
                        "type": "error",
                        "message": f"Cannot subscribe to: {channel}",
                    })
                    continue
                await manager.subscribe(user_id, channel)
                await manager.send_to_user(user_id, {
                    "type": "subscribed", "channel": channel,
                })

            elif msg_type == "unsubscribe":
                channel = msg.get("channel", "")
                await manager.unsubscribe(user_id, channel)
                await manager.send_to_user(user_id, {
                    "type": "unsubscribed", "channel": channel,
                })

            else:
                await manager.send_to_user(user_id, {
                    "type": "error",
                    "message": f"Unknown type: {msg_type}",
                })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("WS error for user %s: %s", user_id, e)
    finally:
        await manager.disconnect(user_id)


def _parse_uuid(text: str) -> UUID | None:
    try:
        return UUID(text)
    except (ValueError, TypeError):
        return None


async def _can_subscribe(
    db: AsyncSession,
    channel: str,
    user_id: str,
    user_role: str | None,
) -> bool:
    """Validate channel access. Enforces membership for chat:* and club:* at WS layer."""
    if not channel:
        return False

    if channel.startswith("user:"):
        return channel == f"user:{user_id}"

    if channel.endswith(":admin"):
        return user_role == "admin"

    if channel.startswith("event:"):
        # Event channels are broadcast-safe (no PII in payload).
        return True

    if channel.startswith("chat:"):
        chat_id = _parse_uuid(channel[len("chat:") :])
        if chat_id is None:
            return False
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            return False
        result = await db.execute(
            select(ChatMember).where(
                ChatMember.chat_id == chat_id,
                ChatMember.user_id == user_uuid,
            )
        )
        return result.first() is not None

    if channel.startswith("club:"):
        club_id = _parse_uuid(channel[len("club:") :])
        if club_id is None:
            return False
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            return False
        result = await db.execute(
            select(user_club).where(
                user_club.c.user_id == user_uuid,
                user_club.c.club_id == club_id,
            )
        )
        return result.first() is not None

    return False
