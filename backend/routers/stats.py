from fastapi import APIRouter
from fastapi.responses import Response

from models.stats import DashboardStats
from services import stats_service

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard():
    return stats_service.get_dashboard()


@router.delete("/reset", status_code=204)
def reset_stats():
    stats_service.reset_stats()
    return Response(status_code=204)
