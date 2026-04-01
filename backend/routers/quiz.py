from fastapi import APIRouter, Depends, HTTPException

from models.quiz import QuizStartRequest, QuizQuestion, QuizAnswerRequest, QuizAnswerResult, QuizSummary
from middleware.auth import get_current_user
from services import quiz_service, tutor_service

router = APIRouter(prefix="/api/tutors/{tutor_id}/quiz", tags=["quiz"])


def _get_tutor_or_404(tutor_id: str, user_id: str):
    tutor = tutor_service.get_tutor(tutor_id, user_id)
    if not tutor:
        raise HTTPException(404, "Tutor not found")
    return tutor


@router.post("/start")
def start_quiz(tutor_id: str, req: QuizStartRequest, user_id: str = Depends(get_current_user)):
    tutor = _get_tutor_or_404(tutor_id, user_id)
    try:
        session_id = quiz_service.start_session(tutor_id, user_id, tutor.language, req)
        return {"session_id": session_id}
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/{session_id}/next", response_model=QuizQuestion)
def next_question(tutor_id: str, session_id: str, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    try:
        return quiz_service.get_next_question(session_id, user_id)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/{session_id}/answer", response_model=QuizAnswerResult)
def submit_answer(tutor_id: str, session_id: str, req: QuizAnswerRequest, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    try:
        return quiz_service.submit_answer(session_id, user_id, req.answer)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/{session_id}/end", response_model=QuizSummary)
def end_quiz(tutor_id: str, session_id: str, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    try:
        return quiz_service.end_session(session_id, user_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
