"""
WebSocket ConnectionManager with Redis pub/sub for cross-process broadcasting.

Architecture:
- Each WebSocket client is tracked by user_id
- Clients subscribe to channels (event:{id}, user:{id}, event:{id}:admin)
- Messages published via Redis pub/sub reach all server processes
- Background task listens to Redis and forwards to local WebSocket clients
"""

import asyncio
import json
import logging
from typing import Dict, Set

from fastapi import WebSocket
import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)

_BACKOFF_BASE = 2
_BACKOFF_MAX = 60


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.channel_subscriptions: Dict[str, Set[str]] = {}
        self.user_channels: Dict[str, Set[str]] = {}
        self._subscriber_task: asyncio.Task | None = None
        self._pubsub: aioredis.client.PubSub | None = None
        self._running = False

    async def start(self):
        self._running = True
        if settings.REDIS_URL:
            self._subscriber_task = asyncio.create_task(self._redis_subscriber())
        else:
            logger.warning("REDIS_URL not set, running without Redis pub/sub")
        logger.info("WebSocket manager started")

    async def stop(self):
        self._running = False
        if self._subscriber_task:
            self._subscriber_task.cancel()
            try:
                await self._subscriber_task
            except asyncio.CancelledError:
                pass
        if self._pubsub:
            await self._pubsub.aclose()
        logger.info("WebSocket manager stopped")

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id in self.active_connections:
            logger.info("Replacing existing connection for user %s", user_id)
            try:
                await self.active_connections[user_id].close(code=4001)
            except Exception:
                pass
            await self._cleanup_user(user_id)

        self.active_connections[user_id] = websocket
        self.user_channels[user_id] = set()
        await self._subscribe_channel(user_id, f"user:{user_id}")
        logger.info("WS connected: user=%s total=%d", user_id, len(self.active_connections))

    async def disconnect(self, user_id: str):
        channels = list(self.user_channels.get(user_id, []))
        for ch in channels:
            await self._unsubscribe_channel(user_id, ch)
        self.active_connections.pop(user_id, None)
        self.user_channels.pop(user_id, None)
        logger.info("WS disconnected: user=%s total=%d", user_id, len(self.active_connections))

    async def subscribe(self, user_id: str, channel: str):
        logger.debug("WS subscribe: user=%s channel=%s", user_id, channel)
        await self._subscribe_channel(user_id, channel)

    async def unsubscribe(self, user_id: str, channel: str):
        logger.debug("WS unsubscribe: user=%s channel=%s", user_id, channel)
        await self._unsubscribe_channel(user_id, channel)

    async def send_to_user(self, user_id: str, message: dict):
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.warning("send_to_user failed: user=%s error=%s — disconnecting", user_id, e)
                await self.disconnect(user_id)
        else:
            msg_type = message.get("type", "unknown")
            if msg_type not in ("pong",):
                logger.debug("send_to_user: no connection for user=%s type=%s", user_id, msg_type)

    async def publish(self, channel: str, message: dict):
        """Publish via Redis so all processes receive the message."""
        msg_type = message.get("type", "unknown")
        logger.debug("WS publish: channel=%s type=%s", channel, msg_type)
        try:
            from app.core.redis import get_redis
            r = await get_redis()
            if r is None:
                await self._broadcast_local(channel, message)
                return
            payload = json.dumps({"channel": channel, "message": message})
            await r.publish(f"ws:{channel}", payload)
        except Exception as e:
            logger.warning("Redis publish failed (%s), falling back to local broadcast", e)
            await self._broadcast_local(channel, message)

    # -- Internal --

    async def _subscribe_channel(self, user_id: str, channel: str):
        if channel not in self.channel_subscriptions:
            self.channel_subscriptions[channel] = set()
            if self._pubsub:
                try:
                    await self._pubsub.subscribe(f"ws:{channel}")
                except Exception as e:
                    logger.warning("Redis subscribe error: %s", e)
        self.channel_subscriptions[channel].add(user_id)
        self.user_channels.setdefault(user_id, set()).add(channel)

    async def _unsubscribe_channel(self, user_id: str, channel: str):
        if channel in self.channel_subscriptions:
            self.channel_subscriptions[channel].discard(user_id)
            if not self.channel_subscriptions[channel]:
                del self.channel_subscriptions[channel]
                if self._pubsub:
                    try:
                        await self._pubsub.unsubscribe(f"ws:{channel}")
                    except Exception:
                        pass
        if user_id in self.user_channels:
            self.user_channels[user_id].discard(channel)

    async def _cleanup_user(self, user_id: str):
        channels = list(self.user_channels.get(user_id, []))
        for ch in channels:
            await self._unsubscribe_channel(user_id, ch)
        self.user_channels.pop(user_id, None)

    async def _broadcast_local(self, channel: str, message: dict):
        user_ids = list(self.channel_subscriptions.get(channel, set()))
        msg_type = message.get("type", "unknown")
        logger.debug(
            "WS local broadcast: channel=%s type=%s recipients=%s",
            channel, msg_type, user_ids,
        )
        for uid in user_ids:
            await self.send_to_user(uid, message)

    async def _redis_subscriber(self):
        """Background task: listen to Redis pub/sub and forward to local clients."""
        await asyncio.sleep(1)
        attempt = 0

        while self._running:
            try:
                r = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5,
                )
                self._pubsub = r.pubsub()

                channels = list(self.channel_subscriptions.keys())
                if channels:
                    for channel in channels:
                        await self._pubsub.subscribe(f"ws:{channel}")
                else:
                    await self._pubsub.subscribe("ws:__heartbeat__")

                logger.info("Redis subscriber connected")
                attempt = 0  # reset backoff on successful connection

                while self._running:
                    msg = await self._pubsub.get_message(
                        ignore_subscribe_messages=True, timeout=1.0,
                    )
                    if msg is None:
                        continue
                    if msg["type"] != "message":
                        continue
                    try:
                        data = json.loads(msg["data"])
                        channel = data["channel"]
                        message = data["message"]
                        await self._broadcast_local(channel, message)
                    except (json.JSONDecodeError, KeyError):
                        pass

            except asyncio.CancelledError:
                break
            except Exception as e:
                self._pubsub = None
                delay = min(_BACKOFF_BASE ** attempt, _BACKOFF_MAX)
                attempt += 1
                logger.warning(
                    "Redis subscriber error: %s — reconnecting in %.0fs (attempt %d)",
                    e, delay, attempt,
                )
                await asyncio.sleep(delay)


manager = ConnectionManager()
