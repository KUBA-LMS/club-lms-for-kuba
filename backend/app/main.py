import logging
import logging.config
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import init_db
from app.core.limiter import limiter
from app.core.redis import close_redis
from app.services.ws_manager import manager
from app.services.message_cleanup import cleanup_service
from app.api.v1 import api_router

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.config.dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        },
    },
    "root": {
        "level": "DEBUG" if settings.DEBUG else "INFO",
        "handlers": ["console"],
    },
    "loggers": {
        "uvicorn": {"level": "INFO", "propagate": True},
        "uvicorn.access": {"level": "WARNING", "propagate": True},
        "sqlalchemy.engine": {"level": "WARNING", "propagate": True},
    },
})

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Request size limit (10 MB)
# ---------------------------------------------------------------------------

MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10 MB


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error("Database initialization failed: %s", e)
    try:
        await manager.start()
    except Exception as e:
        logger.error("WebSocket manager failed to start: %s", e)
    try:
        await cleanup_service.start()
    except Exception as e:
        logger.error("Message cleanup service failed to start: %s", e)
    yield
    await cleanup_service.stop()
    await manager.stop()
    await close_redis()
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# Middleware: request size limit
# ---------------------------------------------------------------------------

@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_SIZE:
        return JSONResponse(
            status_code=413,
            content={"detail": "Request body too large. Maximum size is 10 MB."},
        )
    return await call_next(request)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Welcome to Club LMS API"}


@app.get("/health")
async def health_check():
    """Health check: verifies DB and Redis connectivity."""
    from app.core.database import engine
    from app.core.redis import get_redis
    from sqlalchemy import text

    errors = {}

    # DB check
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        errors["database"] = str(e)

    # Redis check
    try:
        r = await get_redis()
        await r.ping()
    except Exception as e:
        errors["redis"] = str(e)

    if errors:
        logger.error("Health check failed: %s", errors)
        return JSONResponse(status_code=503, content={"status": "unhealthy", "errors": errors})

    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
