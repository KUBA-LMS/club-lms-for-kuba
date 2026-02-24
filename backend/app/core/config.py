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
    APP_NAME: str = "Club LMS API"
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

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Naver Cloud Platform (Map SDK + Geocoding)
    NAVER_MAP_CLIENT_ID: str = ""
    NAVER_MAP_CLIENT_SECRET: str = ""

    # Naver Developers (Search API)
    NAVER_SEARCH_CLIENT_ID: str = ""
    NAVER_SEARCH_CLIENT_SECRET: str = ""

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
