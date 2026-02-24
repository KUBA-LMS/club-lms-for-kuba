"""
Notification publisher for real-time WebSocket updates.
Call from API endpoints after successful DB commit.
"""

from uuid import UUID

from app.services.ws_manager import manager


async def notify_event_updated(event_id: UUID, current_slots: int, max_slots: int):
    """Broadcast slot changes to all viewers of an event."""
    await manager.publish(f"event:{event_id}", {
        "type": "event_updated",
        "channel": f"event:{event_id}",
        "data": {
            "event_id": str(event_id),
            "current_slots": current_slots,
            "max_slots": max_slots,
        },
    })


async def notify_registration_changed(
    user_id: UUID, event_id: UUID, registration_id: UUID, new_status: str,
):
    """Notify a specific user that their registration status changed."""
    await manager.publish(f"user:{user_id}", {
        "type": "registration_changed",
        "channel": f"user:{user_id}",
        "data": {
            "event_id": str(event_id),
            "registration_id": str(registration_id),
            "status": new_status,
        },
    })


async def notify_participants_changed(event_id: UUID):
    """Notify admin viewers to refresh participant list."""
    await manager.publish(f"event:{event_id}:admin", {
        "type": "participants_changed",
        "channel": f"event:{event_id}:admin",
        "data": {"event_id": str(event_id)},
    })


async def notify_participants_preview_changed(event_id: UUID):
    """Notify all event viewers that participant preview changed."""
    await manager.publish(f"event:{event_id}", {
        "type": "participants_preview_changed",
        "channel": f"event:{event_id}",
        "data": {"event_id": str(event_id)},
    })


async def notify_checkin(event_id: UUID, user_id: UUID, username: str):
    """Notify admin viewers that a check-in occurred."""
    await manager.publish(f"event:{event_id}:admin", {
        "type": "checkin",
        "channel": f"event:{event_id}:admin",
        "data": {
            "event_id": str(event_id),
            "user_id": str(user_id),
            "username": username,
        },
    })


# --- Chat notifications ---


async def notify_new_message(
    chat_id: UUID, message_id: UUID, sender_id: UUID,
    sender_username: str, content: str, message_type: str, created_at: str,
    ticket_id=None, payment_amount=None, payment_request_id=None,
):
    """Broadcast new message to all chat room subscribers."""
    data = {
        "message_id": str(message_id),
        "chat_id": str(chat_id),
        "sender_id": str(sender_id),
        "sender_username": sender_username,
        "content": content,
        "message_type": message_type,
        "created_at": created_at,
    }
    if ticket_id is not None:
        data["ticket_id"] = str(ticket_id)
    if payment_amount is not None:
        data["payment_amount"] = float(payment_amount)
    if payment_request_id is not None:
        data["payment_request_id"] = str(payment_request_id)

    await manager.publish(f"chat:{chat_id}", {
        "type": "new_message",
        "channel": f"chat:{chat_id}",
        "data": data,
    })


async def notify_chat_list_update(
    user_id: UUID, chat_id: UUID, last_message: str,
    last_message_type: str, sender_username: str, timestamp: str,
):
    """Notify a user that a chat they belong to has a new message (chat list update)."""
    await manager.publish(f"user:{user_id}", {
        "type": "chat_list_update",
        "channel": f"user:{user_id}",
        "data": {
            "chat_id": str(chat_id),
            "last_message": last_message,
            "last_message_type": last_message_type,
            "sender_username": sender_username,
            "timestamp": timestamp,
        },
    })


async def notify_read_receipt(chat_id: UUID, user_id: UUID, last_read_at: str):
    """Broadcast read receipt to all chat room subscribers."""
    await manager.publish(f"chat:{chat_id}", {
        "type": "read_receipt",
        "channel": f"chat:{chat_id}",
        "data": {
            "user_id": str(user_id),
            "last_read_at": last_read_at,
        },
    })


# --- Friend request notifications ---


async def notify_friend_request(
    to_user_id: UUID, request_id: UUID,
    from_user_id: UUID, from_username: str, from_profile_image: str | None,
):
    """Notify user of incoming friend request."""
    await manager.publish(f"user:{to_user_id}", {
        "type": "friend_request_received",
        "channel": f"user:{to_user_id}",
        "data": {
            "request_id": str(request_id),
            "from_user_id": str(from_user_id),
            "from_username": from_username,
            "from_profile_image": from_profile_image,
        },
    })


async def notify_friend_request_accepted(
    to_user_id: UUID, request_id: UUID,
    by_user_id: UUID, by_username: str, by_profile_image: str | None,
):
    """Notify the original requester that their request was accepted."""
    await manager.publish(f"user:{to_user_id}", {
        "type": "friend_request_accepted",
        "channel": f"user:{to_user_id}",
        "data": {
            "request_id": str(request_id),
            "by_user_id": str(by_user_id),
            "by_username": by_username,
            "by_profile_image": by_profile_image,
        },
    })
