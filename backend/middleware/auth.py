import hashlib

from fastapi import Depends, HTTPException, Header
from services.supabase_client import supabase
from config import settings


def _hash_key(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


async def _resolve_api_key(raw_key: str) -> str:
    key_hash = _hash_key(raw_key)
    res = (
        supabase.table("api_keys")
        .select("id, user_id")
        .eq("key_hash", key_hash)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=401, detail="Invalid API key")
    row = res.data[0]
    supabase.table("api_keys").update({"last_used_at": "now()"}).eq("id", row["id"]).execute()
    return str(row["user_id"])


async def get_current_user(
    authorization: str = Header(None),
    x_api_key: str = Header(None, alias="X-API-Key"),
) -> str:
    """Accept either a Supabase JWT (Bearer) or an API key (X-API-Key or Bearer sk_...)."""
    if x_api_key:
        return await _resolve_api_key(x_api_key)

    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        if token.startswith("sk_"):
            return await _resolve_api_key(token)
        try:
            response = supabase.auth.get_user(token)
            return str(response.user.id)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

    raise HTTPException(status_code=401, detail="Missing authorization")


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
