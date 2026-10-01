"""
API dependencies module.
"""
from fastapi import Header, HTTPException
from ..config import settings


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Enforces API Key check when REQUIRE_API_KEY is enabled."""
    if not settings.REQUIRE_API_KEY:
        return
    if not settings.API_ACCESS_KEY or x_api_key != settings.API_ACCESS_KEY:
        raise HTTPException(status_code=401, detail="Missing or invalid X-API-Key header.")
