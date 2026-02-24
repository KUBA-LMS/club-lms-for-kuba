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

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.core.security import verify_token
from app.services.ws_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
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
                if not _can_subscribe(channel, user_id, user_role):
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
        logger.error(f"WS error for {user_id}: {e}")
    finally:
        await manager.disconnect(user_id)


def _can_subscribe(channel: str, user_id: str, user_role: str | None) -> bool:
    """Validate channel access."""
    if channel.startswith("user:"):
        return channel == f"user:{user_id}"
    if channel.startswith("event:") and ":admin" not in channel:
        return True
    if channel.endswith(":admin"):
        return user_role == "admin"
    if channel.startswith("chat:"):
        return True  # Membership enforced at REST layer
    if channel.startswith("club:"):
        return True  # Membership enforced at REST layer
    return False
