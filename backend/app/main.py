import json
import logging
import logging.config
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any
from uuid import UUID

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
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
# Time-zone contract
# ---------------------------------------------------------------------------
# Backend stores every datetime as UTC (timezone-aware or naive-UTC). The API
# must always emit ISO-8601 strings *with* an explicit UTC marker so that any
# client -- native apps, browsers, third-party integrators -- parses them as
# UTC and renders in the user's device timezone via standard platform APIs.
#
# ``jsonable_encoder`` serializes naive datetimes without a tz suffix, which
# JavaScript then parses as LOCAL time. ``UTCJSONResponse`` rewrites that
# encoding so naive datetimes gain a ``+00:00`` offset on the wire.


def _utc_aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)


def _encode_for_json(value: Any) -> Any:
    if isinstance(value, datetime):
        return _utc_aware(value).isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, dict):
        return {k: _encode_for_json(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_encode_for_json(v) for v in value]
    return value


class UTCJSONResponse(JSONResponse):
    """Default response class for the app.

    Runs content through ``jsonable_encoder`` first (to turn Pydantic models
    and ORM objects into primitives) and then into our own encoder which
    guarantees every datetime is UTC-tagged.
    """

    def render(self, content: Any) -> bytes:
        encoded = jsonable_encoder(content)
        encoded = _encode_for_json(encoded)
        return json.dumps(
            encoded,
            ensure_ascii=False,
            allow_nan=False,
            separators=(",", ":"),
        ).encode("utf-8")

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
        logger.error("Database initialization failed: %s: %s", type(e).__name__, e)
        logger.error("DATABASE_URL scheme: %s", settings.DATABASE_URL.split("@")[0].split("://")[0] if "://" in settings.DATABASE_URL else "unknown")
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
    default_response_class=UTCJSONResponse,
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
# Middleware: security headers
# ---------------------------------------------------------------------------

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # HSTS only meaningful behind TLS; safe no-op on plain HTTP clients.
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # Baseline CSP: static files only need img-src self; API is JSON.
    response.headers["Content-Security-Policy"] = "default-src 'none'; img-src 'self' data: blob:; connect-src 'self'"
    return response

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

# Static file serving for uploaded images
_static_dir = Path("static/uploads")
_static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return {"message": "Welcome to ClubX API"}


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
        errors["database"] = f"{type(e).__name__}: {e}"

    # Redis check
    try:
        r = await get_redis()
        if r is not None:
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
