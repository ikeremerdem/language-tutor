from datetime import datetime, timezone

from models.vocabulary import Word, WordCreate, WordUpdate
from services.supabase_client import supabase


def _attention_weight(word: Word) -> float:
    asked = word.times_asked
    if asked == 0:
        return 10.0
    accuracy = word.times_correct / asked
    return max(1.0, 5.0 * (1 - accuracy) + 2.0 / (1 + asked))


def list_words(tutor_id: str) -> list[Word]:
    response = (
        supabase.table("vocabulary")
        .select("*")
        .eq("tutor_id", tutor_id)
        .execute()
    )
    words = [Word(**row) for row in response.data]
    return sorted(words, key=_attention_weight, reverse=True)


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
        raise ValueError(f"Word '{data.english.strip()}' already exists")

    row = {
        "tutor_id": tutor_id,
        "user_id": user_id,
        "word_type": data.word_type.value,
        "english": data.english.strip(),
        "target_language": data.target_language.strip(),
        "notes": data.notes.strip(),
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


def record_answer(word_id: str, correct: bool) -> None:
    response = (
        supabase.table("vocabulary")
        .select("times_asked, times_correct")
        .eq("id", word_id)
        .single()
        .execute()
    )
    if not response.data:
        return
    times_asked = response.data["times_asked"] + 1
    times_correct = response.data["times_correct"] + (1 if correct else 0)
    supabase.table("vocabulary").update({
        "times_asked": times_asked,
        "times_correct": times_correct,
        "last_asked": datetime.now(timezone.utc).isoformat(),
    }).eq("id", word_id).execute()
