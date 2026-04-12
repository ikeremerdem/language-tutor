import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response

from middleware.auth import get_current_admin
from models.conversation import (
    PersonaWithContexts, PersonaCreate, PersonaUpdate, PersonaContextCreate,
)
from services import admin_service, conversation_service
from services.supabase_client import supabase

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/check")
def check(_: str = Depends(get_current_admin)):
    return {"ok": True}


@router.get("/users", response_model=list[admin_service.UserStats])
def user_stats(_: str = Depends(get_current_admin)):
    return admin_service.get_user_stats()


# ── Persona image upload ──────────────────────────────────────────────────────

PERSONA_BUCKET = "persona-images"

@router.post("/personas/upload-image")
async def upload_persona_image(file: UploadFile = File(...), _: str = Depends(get_current_admin)):
    contents = await file.read()
    ext = (file.filename or "image").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        raise HTTPException(400, "Unsupported image format")
    filename = f"{uuid.uuid4()}.{ext}"
    supabase.storage.from_(PERSONA_BUCKET).upload(filename, contents, {"content-type": file.content_type or "image/jpeg"})
    url = supabase.storage.from_(PERSONA_BUCKET).get_public_url(filename)
    return {"url": url}


# ── Persona management ────────────────────────────────────────────────────────

@router.get("/personas", response_model=list[PersonaWithContexts])
def list_personas(_: str = Depends(get_current_admin)):
    return conversation_service.admin_list_personas()


@router.post("/personas", response_model=dict)
def create_persona(body: PersonaCreate, _: str = Depends(get_current_admin)):
    return conversation_service.admin_create_persona(
        body.name, body.description, body.persona_prompt, body.image_url
    )


@router.patch("/personas/{persona_id}", response_model=dict)
def update_persona(persona_id: str, body: PersonaUpdate, _: str = Depends(get_current_admin)):
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    if not patch:
        raise HTTPException(400, "Nothing to update")
    return conversation_service.admin_update_persona(persona_id, patch)


@router.delete("/personas/{persona_id}", status_code=204)
def delete_persona(persona_id: str, _: str = Depends(get_current_admin)):
    conversation_service.admin_delete_persona(persona_id)
    return Response(status_code=204)


@router.post("/personas/{persona_id}/contexts", response_model=dict)
def create_context(persona_id: str, body: PersonaContextCreate, _: str = Depends(get_current_admin)):
    return conversation_service.admin_create_context(persona_id, body.label)


@router.delete("/personas/{persona_id}/contexts/{context_id}", status_code=204)
def delete_context(persona_id: str, context_id: str, _: str = Depends(get_current_admin)):
    conversation_service.admin_delete_context(context_id)
    return Response(status_code=204)
