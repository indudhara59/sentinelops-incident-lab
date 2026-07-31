from functools import lru_cache
from typing import Literal
from urllib.parse import urlparse

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Validated runtime configuration loaded from SENTINELOPS_* variables."""

    model_config = SettingsConfigDict(
        env_prefix="SENTINELOPS_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "SentinelOps API"
    app_version: str = "0.1.0"
    environment: Literal["development", "test", "staging", "production"] = "development"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    max_active_sessions: int = Field(default=50, ge=1, le=1_000)
    session_ttl_seconds: int = Field(default=1_800, ge=60, le=86_400)
    session_rate_limit_per_minute: int = Field(default=120, ge=10, le=10_000)

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, origins: list[str]) -> list[str]:
        if not origins:
            raise ValueError("at least one CORS origin is required")
        if "*" in origins:
            raise ValueError("wildcard CORS origins are not allowed")
        parsed = [urlparse(origin) for origin in origins]
        if any(item.scheme not in {"http", "https"} or not item.netloc for item in parsed):
            raise ValueError("CORS origins must use http or https")
        if any(item.path not in {"", "/"} or item.query or item.fragment for item in parsed):
            raise ValueError("CORS origins must not contain paths, queries, or fragments")
        return origins

    def validate_production(self) -> None:
        if not self.is_production:
            return
        if any(origin.startswith("http://") for origin in self.cors_origins):
            raise ValueError("production CORS origins must use https")
        if any("localhost" in origin or "127.0.0.1" in origin for origin in self.cors_origins):
            raise ValueError("production CORS origins must not use loopback hosts")

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
