from fastapi import APIRouter, Depends, HTTPException

from middleware.auth import get_current_user
from models.reading import ReadingText, ReadingTextSummary, ReadingTextCreate
from services import reading_service, tutor_service

router = APIRouter(prefix="/api/tutors/{tutor_id}/reading", tags=["reading"])


def _get_tutor_or_404(tutor_id: str, user_id: str):
    tutor = tutor_service.get_tutor(tutor_id, user_id)
    if not tutor:
        raise HTTPException(404, "Tutor not found")
    return tutor


@router.get("/texts", response_model=list[ReadingTextSummary])
def list_texts(tutor_id: str, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    return reading_service.list_reading_texts(tutor_id)


@router.post("/texts", response_model=ReadingText, status_code=201)
def create_text(tutor_id: str, req: ReadingTextCreate, user_id: str = Depends(get_current_user)):
    tutor = _get_tutor_or_404(tutor_id, user_id)
    if not req.text.strip():
        raise HTTPException(400, "Text is required")
    try:
        return reading_service.create_reading_text(
            tutor_id, user_id, req.title, req.text, req.source, tutor.language
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to save reading text: {e}")


@router.get("/texts/{text_id}", response_model=ReadingText)
def get_text(tutor_id: str, text_id: str, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    text = reading_service.get_reading_text(text_id, tutor_id)
    if not text:
        raise HTTPException(404, "Reading text not found")
    return text


@router.delete("/texts/{text_id}", status_code=204)
def delete_text(tutor_id: str, text_id: str, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    if not reading_service.delete_reading_text(text_id, tutor_id):
        raise HTTPException(404, "Reading text not found")


@router.get("/word-info")
def word_info(tutor_id: str, word: str, context: str = "", user_id: str = Depends(get_current_user)):
    tutor = _get_tutor_or_404(tutor_id, user_id)
    try:
        return reading_service.word_info(word, context, tutor.language)
    except Exception as e:
        raise HTTPException(500, f"Word info failed: {e}")
