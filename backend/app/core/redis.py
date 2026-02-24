import redis.asyncio as redis

from app.core.config import settings

_pool: redis.ConnectionPool | None = None


async def get_redis_pool() -> redis.ConnectionPool:
    global _pool
    if _pool is None:
        _pool = redis.ConnectionPool.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=20,
        )
    return _pool


async def get_redis() -> redis.Redis:
    pool = await get_redis_pool()
    return redis.Redis(connection_pool=pool)


async def close_redis():
    global _pool
    if _pool:
        await _pool.aclose()
        _pool = None
