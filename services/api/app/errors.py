from collections.abc import Sequence
from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def error_payload(
    request: Request,
    *,
    code: str,
    message: str,
    details: dict[str, Any] | Sequence[Any] | None = None,
) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
            "request_id": getattr(request.state, "request_id", "unknown"),
        }
    }


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=error_payload(
            request,
            code="VALIDATION_FAILED",
            message="The request could not be processed.",
            details=exc.errors(),
        ),
    )


async def http_error_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    code = "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
    message = "The requested resource was not found." if exc.status_code == 404 else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=error_payload(request, code=code, message=message),
        headers=exc.headers,
    )


async def unexpected_error_handler(request: Request, exc: Exception) -> JSONResponse:
    # The exception is logged by middleware; the response is deliberately generic.
    return JSONResponse(
        status_code=500,
        content=error_payload(
            request,
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred.",
        ),
    )
