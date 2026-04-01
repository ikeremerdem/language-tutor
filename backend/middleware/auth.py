from fastapi import Depends, HTTPException, Header
from services.supabase_client import supabase


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
