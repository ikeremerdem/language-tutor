from collections import Counter
from pydantic import BaseModel
from services.supabase_client import supabase


class UserStats(BaseModel):
    user_id: str
    email: str
    created_at: str
    language_count: int
    word_count: int
    session_count: int


def get_user_stats() -> list[UserStats]:
    # Fetch all registered users via the admin auth API
    users_page = supabase.auth.admin.list_users()
    users = {str(u.id): u for u in users_page}

    # Aggregate counts per user_id from each table
    tutor_rows = supabase.table("language_tutors").select("user_id").execute().data
    word_rows = supabase.table("vocabulary").select("user_id").execute().data
    session_rows = supabase.table("quiz_sessions").select("user_id").execute().data

    tutor_counts: Counter = Counter(r["user_id"] for r in tutor_rows)
    word_counts: Counter = Counter(r["user_id"] for r in word_rows)
    session_counts: Counter = Counter(r["user_id"] for r in session_rows)

    result = [
        UserStats(
            user_id=uid,
            email=u.email or "",
            created_at=str(u.created_at),
            language_count=tutor_counts.get(uid, 0),
            word_count=word_counts.get(uid, 0),
            session_count=session_counts.get(uid, 0),
        )
        for uid, u in users.items()
    ]
    # Sort by most recently registered first
    result.sort(key=lambda s: s.created_at, reverse=True)
    return result
