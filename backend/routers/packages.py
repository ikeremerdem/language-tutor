from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from middleware.auth import get_current_user
from services.supabase_client import supabase
from services.sentence_service import generate_package_words

router = APIRouter(prefix="/api/packages", tags=["packages"])


class PackageSummary(BaseModel):
    id: str
    user_id: str
    name: str
    description: str
    category: str
    word_count: int
    is_public: bool
    created_at: str


class PackageDetail(PackageSummary):
    words: list[str]


class PackageCreate(BaseModel):
    name: str
    description: str = ""
    category: str = ""
    words: list[str] = []
    is_public: bool = False


class PackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    words: Optional[list[str]] = None
    is_public: Optional[bool] = None


class GenerateWordsRequest(BaseModel):
    name: str = ""
    description: str = ""
    category: str = ""


@router.post("/generate-words")
def generate_words(data: GenerateWordsRequest, _: str = Depends(get_current_user)):
    words = generate_package_words(data.name, data.description, data.category)
    return {"words": words}


@router.get("", response_model=list[PackageSummary])
def list_packages(user_id: str = Depends(get_current_user)):
    rows = (
        supabase.table("word_packages")
        .select("id,user_id,name,description,category,word_count,is_public,created_at")
        .or_(f"is_public.eq.true,user_id.eq.{user_id}")
        .order("created_at", desc=False)
        .execute()
        .data
    )
    return rows


@router.get("/{pkg_id}", response_model=PackageDetail)
def get_package(pkg_id: str, user_id: str = Depends(get_current_user)):
    row = (
        supabase.table("word_packages")
        .select("*")
        .eq("id", pkg_id)
        .single()
        .execute()
        .data
    )
    if not row:
        raise HTTPException(status_code=404, detail="Package not found")
    if not row["is_public"] and row["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return row


@router.post("", response_model=PackageDetail, status_code=201)
def create_package(data: PackageCreate, user_id: str = Depends(get_current_user)):
    row = (
        supabase.table("word_packages")
        .insert({
            "user_id": user_id,
            "name": data.name,
            "description": data.description,
            "category": data.category,
            "words": data.words,
            "word_count": len(data.words),
            "is_public": data.is_public,
        })
        .execute()
        .data[0]
    )
    return row


@router.put("/{pkg_id}", response_model=PackageDetail)
def update_package(pkg_id: str, data: PackageUpdate, user_id: str = Depends(get_current_user)):
    existing = (
        supabase.table("word_packages")
        .select("user_id")
        .eq("id", pkg_id)
        .single()
        .execute()
        .data
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Package not found")
    if existing["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can edit this package")

    update = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if "words" in update:
        update["word_count"] = len(update["words"])

    row = (
        supabase.table("word_packages")
        .update(update)
        .eq("id", pkg_id)
        .execute()
        .data[0]
    )
    return row


@router.delete("/{pkg_id}", status_code=204)
def delete_package(pkg_id: str, user_id: str = Depends(get_current_user)):
    existing = (
        supabase.table("word_packages")
        .select("user_id")
        .eq("id", pkg_id)
        .single()
        .execute()
        .data
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Package not found")
    if existing["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can delete this package")

    supabase.table("word_packages").delete().eq("id", pkg_id).execute()
