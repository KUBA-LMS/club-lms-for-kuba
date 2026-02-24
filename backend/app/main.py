from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.core.redis import close_redis
from app.services.ws_manager import manager
from app.services.message_cleanup import cleanup_service
from app.api.v1 import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    try:
        await init_db()
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        print("Application will continue without database connection.")
    try:
        await manager.start()
    except Exception as e:
        print(f"Warning: WebSocket manager failed to start: {e}")
    try:
        await cleanup_service.start()
    except Exception as e:
        print(f"Warning: Message cleanup service failed to start: {e}")
    yield
    # Shutdown
    await cleanup_service.stop()
    await manager.stop()
    await close_redis()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Welcome to Club LMS API"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
