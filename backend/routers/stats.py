from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from models.stats import DashboardStats, RecentSession
from middleware.auth import get_current_user
from services import stats_service, tutor_service

router = APIRouter(prefix="/api/tutors/{tutor_id}/stats", tags=["stats"])


def _get_tutor_or_404(tutor_id: str, user_id: str):
    tutor = tutor_service.get_tutor(tutor_id, user_id)
    if not tutor:
        raise HTTPException(404, "Tutor not found")
    return tutor


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(tutor_id: str, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    return stats_service.get_dashboard(tutor_id)


@router.get("/sessions/{quiz_type}", response_model=list[RecentSession])
def sessions_by_type(tutor_id: str, quiz_type: str, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    return stats_service.get_sessions_by_type(tutor_id, quiz_type)


@router.delete("/reset", status_code=204)
def reset_stats(tutor_id: str, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    stats_service.reset_stats(tutor_id)
    return Response(status_code=204)
