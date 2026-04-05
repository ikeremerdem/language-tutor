from fastapi import APIRouter, Depends, HTTPException

from middleware.auth import get_current_user
from pydantic import BaseModel

from models.conversation import (
    PersonaWithContexts,
    StartConversationRequest,
    StartConversationResponse,
    SendMessageRequest,
    SendMessageResponse,
    ConversationMessage,
)


class TranslateSentenceRequest(BaseModel):
    text: str


class TranslateSentenceResponse(BaseModel):
    translation: str
from services import conversation_service, tutor_service

router = APIRouter(tags=["conversations"])


@router.get("/api/personas", response_model=list[PersonaWithContexts])
def list_personas(_: str = Depends(get_current_user)):
    return conversation_service.list_personas()


def _get_tutor_or_404(tutor_id: str, user_id: str):
    tutor = tutor_service.get_tutor(tutor_id, user_id)
    if not tutor:
        raise HTTPException(404, "Tutor not found")
    return tutor


@router.post("/api/tutors/{tutor_id}/conversations", response_model=StartConversationResponse)
def start_conversation(
    tutor_id: str,
    req: StartConversationRequest,
    user_id: str = Depends(get_current_user),
):
    tutor = _get_tutor_or_404(tutor_id, user_id)
    try:
        conv_id, persona_name, first_message, first_translation = conversation_service.start_conversation(
            tutor_id, user_id, tutor.language, req.persona_id, req.context_id
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    return StartConversationResponse(
        conversation_id=conv_id,
        persona_name=persona_name,
        first_message=first_message,
        first_message_translation=first_translation,
    )


@router.get(
    "/api/tutors/{tutor_id}/conversations/{conversation_id}/messages",
    response_model=list[ConversationMessage],
)
def get_messages(
    tutor_id: str,
    conversation_id: str,
    user_id: str = Depends(get_current_user),
):
    _get_tutor_or_404(tutor_id, user_id)
    try:
        return conversation_service.get_messages(conversation_id, user_id)
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.post("/api/tutors/{tutor_id}/conversations/translate", response_model=TranslateSentenceResponse)
def translate_sentence(
    tutor_id: str,
    req: TranslateSentenceRequest,
    user_id: str = Depends(get_current_user),
):
    tutor = _get_tutor_or_404(tutor_id, user_id)
    translation = conversation_service.translate_sentence(req.text, tutor.language)
    return TranslateSentenceResponse(translation=translation)


@router.post(
    "/api/tutors/{tutor_id}/conversations/{conversation_id}/messages",
    response_model=SendMessageResponse,
)
def send_message(
    tutor_id: str,
    conversation_id: str,
    req: SendMessageRequest,
    user_id: str = Depends(get_current_user),
):
    tutor = _get_tutor_or_404(tutor_id, user_id)
    try:
        reply, translation, grammar_ok, grammar_explanation, grammar_corrected = conversation_service.send_message(
            conversation_id, user_id, req.content, tutor.language
        )
    except ValueError as e:
        raise HTTPException(404, str(e))
    return SendMessageResponse(
        content=reply,
        translation=translation,
        grammar_ok=grammar_ok,
        grammar_explanation=grammar_explanation,
        grammar_corrected=grammar_corrected,
    )
