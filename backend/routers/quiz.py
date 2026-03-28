from fastapi import APIRouter, HTTPException

from models.quiz import QuizStartRequest, QuizQuestion, QuizAnswerRequest, QuizAnswerResult, QuizSummary
from services import quiz_service

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.post("/start")
def start_quiz(req: QuizStartRequest):
    try:
        session_id = quiz_service.start_session(req)
        return {"session_id": session_id}
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/{session_id}/next", response_model=QuizQuestion)
def next_question(session_id: str):
    try:
        return quiz_service.get_next_question(session_id)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/{session_id}/answer", response_model=QuizAnswerResult)
def submit_answer(session_id: str, req: QuizAnswerRequest):
    try:
        return quiz_service.submit_answer(session_id, req.answer)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/{session_id}/end", response_model=QuizSummary)
def end_quiz(session_id: str):
    try:
        return quiz_service.end_session(session_id)
    except ValueError as e:
        raise HTTPException(400, str(e))


