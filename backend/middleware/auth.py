from fastapi import Depends, HTTPException, Header
from services.supabase_client import supabase
from config import settings


async def get_current_user(authorization: str = Header(...)) -> str:
    """Extract and verify the Supabase JWT, returning the user's UUID."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        response = supabase.auth.get_user(token)
        return str(response.user.id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_admin(authorization: str = Header(...)) -> str:
    """Verify the JWT and ensure the user is the configured admin. Returns user UUID."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        response = supabase.auth.get_user(token)
        user = response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if not settings.admin_email or user.email != settings.admin_email:
        raise HTTPException(status_code=403, detail="Admin access required")
    return str(user.id)
