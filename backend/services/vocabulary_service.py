from datetime import datetime, timezone

from models.vocabulary import Word, WordCreate, WordUpdate, DuplicateWordError
from services.supabase_client import supabase


def list_words(tutor_id: str) -> list[Word]:
    response = (
        supabase.table("vocabulary")
        .select("*")
        .eq("tutor_id", tutor_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [Word(**row) for row in response.data]


def get_word(word_id: str, tutor_id: str) -> Word | None:
    response = (
        supabase.table("vocabulary")
        .select("*")
        .eq("id", word_id)
        .eq("tutor_id", tutor_id)
        .single()
        .execute()
    )
    return Word(**response.data) if response.data else None


def add_word(tutor_id: str, user_id: str, data: WordCreate) -> Word:
    english_lower = data.english.strip().lower()
    existing = (
        supabase.table("vocabulary")
        .select("id")
        .eq("tutor_id", tutor_id)
        .ilike("english", english_lower)
        .execute()
    )
    if existing.data:
        raise DuplicateWordError(
            f"Word '{data.english.strip()}' already exists",
            existing_id=existing.data[0]["id"],
        )

    normalized_cats = [c.strip().lower() for c in data.categories if c.strip()]
    row = {
        "tutor_id": tutor_id,
        "user_id": user_id,
        "word_type": data.word_type.value,
        "english": data.english.strip(),
        "target_language": data.target_language.strip(),
        "notes": data.notes.strip(),
        "categories": normalized_cats,
    }
    response = supabase.table("vocabulary").insert(row).execute()
    return Word(**response.data[0])


def update_word(word_id: str, tutor_id: str, data: WordUpdate) -> Word | None:
    updates = {}
    for k, v in data.model_dump(exclude_unset=True).items():
        updates[k] = v.value if hasattr(v, "value") else v.strip() if isinstance(v, str) else v

    response = (
        supabase.table("vocabulary")
        .update(updates)
        .eq("id", word_id)
        .eq("tutor_id", tutor_id)
        .execute()
    )
    return Word(**response.data[0]) if response.data else None


def delete_word(word_id: str, tutor_id: str) -> bool:
    response = (
        supabase.table("vocabulary")
        .delete()
        .eq("id", word_id)
        .eq("tutor_id", tutor_id)
        .execute()
    )
    return len(response.data) > 0


def add_categories_to_word(word_id: str, tutor_id: str, new_cats: list[str]) -> Word | None:
    response = (
        supabase.table("vocabulary")
        .select("categories")
        .eq("id", word_id)
        .eq("tutor_id", tutor_id)
        .single()
        .execute()
    )
    if not response.data:
        return None
    existing_cats: list[str] = response.data.get("categories") or []
    normalized_new = [c.strip().lower() for c in new_cats if c.strip()]
    merged = list(dict.fromkeys(existing_cats + [c for c in normalized_new if c not in existing_cats]))
    update_response = (
        supabase.table("vocabulary")
        .update({"categories": merged})
        .eq("id", word_id)
        .eq("tutor_id", tutor_id)
        .execute()
    )
    return Word(**update_response.data[0]) if update_response.data else None


def record_answer(word_id: str, correct: bool) -> None:
    response = (
        supabase.table("vocabulary")
        .select("times_asked, times_correct, current_streak")
        .eq("id", word_id)
        .single()
        .execute()
    )
    if not response.data:
        return
    times_asked = response.data["times_asked"] + 1
    times_correct = response.data["times_correct"] + (1 if correct else 0)
    current_streak = (response.data["current_streak"] + 1) if correct else 0
    supabase.table("vocabulary").update({
        "times_asked": times_asked,
        "times_correct": times_correct,
        "last_asked": datetime.now(timezone.utc).isoformat(),
        "current_streak": current_streak,
    }).eq("id", word_id).execute()
