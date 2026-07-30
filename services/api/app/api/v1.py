from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.config import Settings, get_settings

router = APIRouter(prefix="/api/v1", tags=["status"])


class StatusResponse(BaseModel):
    service: str
    version: str
    status: str
    environment: str


@router.get("/status", response_model=StatusResponse)
async def status(settings: Annotated[Settings, Depends(get_settings)]) -> StatusResponse:
    return StatusResponse(
        service=settings.app_name,
        version=settings.app_version,
        status="operational",
        environment=settings.environment,
    )
