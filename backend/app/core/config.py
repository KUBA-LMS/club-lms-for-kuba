"""
Application configuration settings.

SECURITY WARNING:
    This file contains DEFAULT values only for development convenience.
    All sensitive values (SECRET_KEY, DATABASE_URL, etc.) MUST be set via .env file.
    NEVER commit actual credentials to this file or version control.

    Required .env variables for production:
    - SECRET_KEY: Generate a secure random key
    - DATABASE_URL: Your actual database connection string
    - CORS_ORIGINS: Allowed origins for your deployment
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "ClubX API"
    DEBUG: bool = True
    DEV_MODE: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8002

    # Database
    # WARNING: Override this in .env file. Never use default in production.
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/club_lms"

    # CORS - comma-separated string from env, converted to list
    # WARNING: Configure allowed origins in .env file for your environment.
    CORS_ORIGINS: str = "http://localhost:8081,http://localhost:19006"

    # JWT
    # WARNING: MUST be changed in production. Set via .env file.
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Superadmin (set in .env for production; if empty, auto-generated on seed)
    SUPERADMIN_PASSWORD: str = ""

    # Admin dashboard IP whitelist (comma-separated; empty = allow all)
    ADMIN_IP_WHITELIST: str = ""

    # Redis (empty = disable Redis features)
    REDIS_URL: str = ""

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@clubx.app"
    EMAIL_FROM_NAME: str = "ClubX"
    FRONTEND_BASE_URL: str = "https://clubx.app"

    # Naver Cloud Platform (Map SDK + Geocoding)
    NAVER_MAP_CLIENT_ID: str = ""
    NAVER_MAP_CLIENT_SECRET: str = ""

    # Naver Developers (Search API)
    NAVER_SEARCH_CLIENT_ID: str = ""
    NAVER_SEARCH_CLIENT_SECRET: str = ""

    # Kakao (Local Search API)
    KAKAO_REST_API_KEY: str = ""

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_database_url(cls, v):
        # Fly.io sets postgres:// but asyncpg needs postgresql+asyncpg://
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, list):
            return ",".join(v)
        return v

    def get_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
