import hashlib
import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from middleware.auth import get_current_user
from services.supabase_client import supabase

router = APIRouter(prefix="/api/api-keys", tags=["api-keys"])


class ApiKeyCreate(BaseModel):
    name: str


class ApiKeyOut(BaseModel):
    id: str
    name: str
    key_prefix: str
    created_at: str
    last_used_at: str | None
    is_active: bool


class ApiKeyCreated(BaseModel):
    key: str
    api_key: ApiKeyOut


def _hash_key(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


@router.get("", response_model=list[ApiKeyOut])
def list_api_keys(user_id: str = Depends(get_current_user)):
    res = (
        supabase.table("api_keys")
        .select("id, name, key_prefix, created_at, last_used_at, is_active")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


@router.post("", response_model=ApiKeyCreated, status_code=201)
def create_api_key(data: ApiKeyCreate, user_id: str = Depends(get_current_user)):
    raw_key = "sk_" + secrets.token_hex(40)
    key_hash = _hash_key(raw_key)
    key_prefix = raw_key[:12]

    res = (
        supabase.table("api_keys")
        .insert({
            "user_id": user_id,
            "name": data.name,
            "key_hash": key_hash,
            "key_prefix": key_prefix,
        })
        .execute()
    )
    row = res.data[0]
    return ApiKeyCreated(
        key=raw_key,
        api_key=ApiKeyOut(
            id=row["id"],
            name=row["name"],
            key_prefix=row["key_prefix"],
            created_at=row["created_at"],
            last_used_at=row.get("last_used_at"),
            is_active=row["is_active"],
        ),
    )


@router.delete("/{key_id}", status_code=204)
def revoke_api_key(key_id: str, user_id: str = Depends(get_current_user)):
    res = (
        supabase.table("api_keys")
        .delete()
        .eq("id", key_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "API key not found")
