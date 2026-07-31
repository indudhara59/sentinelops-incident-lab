import pytest
from pydantic import ValidationError

from app.config import Settings


def test_environment_is_validated() -> None:
    with pytest.raises(ValidationError):
        Settings(environment="prod")  # type: ignore[arg-type]


def test_wildcard_cors_is_rejected() -> None:
    with pytest.raises(ValidationError, match="wildcard"):
        Settings(cors_origins=["*"])


def test_http_cors_origin_is_accepted() -> None:
    settings = Settings(cors_origins=["https://sentinelops.example"])
    assert settings.cors_origins == ["https://sentinelops.example"]


def test_production_requires_https_non_loopback_cors() -> None:
    with pytest.raises(ValueError, match="https"):
        Settings(
            environment="production", cors_origins=["http://localhost:3000"]
        ).validate_production()
    Settings(
        environment="production", cors_origins=["https://sentinelops.example"]
    ).validate_production()
