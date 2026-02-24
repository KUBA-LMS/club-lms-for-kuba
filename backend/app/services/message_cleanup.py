"""
Periodic cleanup of old chat messages.

Deletes messages older than RETENTION_DAYS to keep the database lean.
Runs as a background asyncio task during app lifespan.
Also cleans up associated payment_requests and payment_splits.
"""

import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy import delete, select

from app.core.database import AsyncSessionLocal
from app.models.chat import Message
from app.models.payment import PaymentRequest, PaymentSplit

logger = logging.getLogger(__name__)

RETENTION_DAYS = 7
CLEANUP_INTERVAL_HOURS = 6  # Run every 6 hours
BATCH_SIZE = 500  # Delete in batches to avoid long locks


async def cleanup_old_messages() -> int:
    """Delete messages older than RETENTION_DAYS. Returns count deleted."""
    cutoff = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
    total_deleted = 0

    async with AsyncSessionLocal() as db:
        # 1. Find old message IDs
        while True:
            old_msg_stmt = (
                select(Message.id)
                .where(Message.created_at < cutoff)
                .limit(BATCH_SIZE)
            )
            result = await db.execute(old_msg_stmt)
            msg_ids = [row[0] for row in result.fetchall()]

            if not msg_ids:
                break

            # 2. Find payment requests linked to these messages
            pr_stmt = select(PaymentRequest.id).where(
                PaymentRequest.message_id.in_(msg_ids)
            )
            pr_result = await db.execute(pr_stmt)
            pr_ids = [row[0] for row in pr_result.fetchall()]

            # 3. Delete payment splits for these payment requests
            if pr_ids:
                await db.execute(
                    delete(PaymentSplit).where(PaymentSplit.payment_request_id.in_(pr_ids))
                )
                # 4. Delete payment requests
                await db.execute(
                    delete(PaymentRequest).where(PaymentRequest.id.in_(pr_ids))
                )

            # 5. Delete the messages
            await db.execute(
                delete(Message).where(Message.id.in_(msg_ids))
            )
            await db.commit()
            total_deleted += len(msg_ids)

            # Yield control between batches
            await asyncio.sleep(0.1)

    return total_deleted


async def message_cleanup_loop():
    """Background loop that periodically cleans old messages."""
    # Wait a bit after startup before first run
    await asyncio.sleep(60)

    while True:
        try:
            deleted = await cleanup_old_messages()
            if deleted > 0:
                logger.info(f"Message cleanup: deleted {deleted} messages older than {RETENTION_DAYS} days")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Message cleanup error: {e}")

        await asyncio.sleep(CLEANUP_INTERVAL_HOURS * 3600)


class MessageCleanupService:
    def __init__(self):
        self._task: asyncio.Task | None = None

    async def start(self):
        self._task = asyncio.create_task(message_cleanup_loop())
        logger.info(f"Message cleanup service started (retention={RETENTION_DAYS}d, interval={CLEANUP_INTERVAL_HOURS}h)")

    async def stop(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Message cleanup service stopped")


cleanup_service = MessageCleanupService()
