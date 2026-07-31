import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1 import router as v1_router
from app.config import get_settings
from app.errors import (
    http_error_handler,
    store_error_handler,
    unexpected_error_handler,
    validation_error_handler,
)
from app.logging import configure_logging
from app.middleware import request_context_middleware
from app.simulation.store import StoreError, store

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings.validate_production()
    configure_logging(settings.log_level)
    store.max_sessions = settings.max_active_sessions
    store.ttl_seconds = settings.session_ttl_seconds
    store.rate_limit = settings.session_rate_limit_per_minute
    app.state.session_store = store

    async def cleanup_sessions() -> None:
        try:
            while True:
                await asyncio.sleep(30)
                await store.cleanup()
        except asyncio.CancelledError:
            return

    cleanup_task = asyncio.create_task(cleanup_sessions(), name="session-ttl-cleanup")
    yield
    cleanup_task.cancel()
    with suppress(asyncio.CancelledError):
        await cleanup_task
    await store.close()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Authoritative, ephemeral API for a safe simulated incident-response lab.",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Accept", "Content-Type", "X-Request-ID", "Idempotency-Key"],
    expose_headers=["X-Request-ID"],
)
app.add_middleware(GZipMiddleware, minimum_size=1_024)
app.middleware("http")(request_context_middleware)
app.add_exception_handler(RequestValidationError, validation_error_handler)  # type: ignore[arg-type]
app.add_exception_handler(StarletteHTTPException, http_error_handler)  # type: ignore[arg-type]
app.add_exception_handler(Exception, unexpected_error_handler)
app.add_exception_handler(StoreError, store_error_handler)  # type: ignore[arg-type]
app.include_router(v1_router)


@app.get("/", tags=["meta"])
async def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "message": "Safe, simulated incident-response learning API.",
        "version": settings.app_version,
    }


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready", tags=["health"])
async def readiness() -> dict[str, str | int]:
    return {
        "status": "ready",
        "session_store": "available",
        "active_sessions": len(store.sessions),
    }


@app.get("/_test/error", include_in_schema=False)
async def test_error(request: Request) -> None:
    if settings.environment != "test":
        raise StarletteHTTPException(status_code=404)
    raise RuntimeError("deliberate test error")
