from fastapi import APIRouter, Depends
from middleware.auth import get_current_admin
from services import admin_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[admin_service.UserStats])
def user_stats(_: str = Depends(get_current_admin)):
    return admin_service.get_user_stats()
