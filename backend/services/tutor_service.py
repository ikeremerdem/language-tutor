from config import SUPPORTED_LANGUAGES
from models.tutor import LanguageTutor, TutorCreate
from services.supabase_client import supabase


def list_tutors(user_id: str) -> list[LanguageTutor]:
    response = (
        supabase.table("language_tutors")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    return [LanguageTutor(**row) for row in response.data]


def get_tutor(tutor_id: str, user_id: str) -> LanguageTutor | None:
    response = (
        supabase.table("language_tutors")
        .select("*")
        .eq("id", tutor_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return LanguageTutor(**response.data) if response.data else None


def create_tutor(user_id: str, data: TutorCreate) -> LanguageTutor:
    if data.language not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported language: {data.language}. Choose from {SUPPORTED_LANGUAGES}")

    # Check one-per-language constraint (also enforced by DB UNIQUE)
    existing = (
        supabase.table("language_tutors")
        .select("id")
        .eq("user_id", user_id)
        .eq("language", data.language)
        .execute()
    )
    if existing.data:
        raise ValueError(f"You already have a {data.language} tutor")

    response = (
        supabase.table("language_tutors")
        .insert({"user_id": user_id, "language": data.language})
        .execute()
    )
    return LanguageTutor(**response.data[0])


def delete_tutor(tutor_id: str, user_id: str) -> bool:
    response = (
        supabase.table("language_tutors")
        .delete()
        .eq("id", tutor_id)
        .eq("user_id", user_id)
        .execute()
    )
    return len(response.data) > 0
