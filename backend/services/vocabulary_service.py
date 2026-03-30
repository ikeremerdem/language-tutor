import uuid
from datetime import datetime, timezone

from config import settings
from models.vocabulary import Word, WordCreate, WordUpdate
from services.csv_store import CsvStore

COLUMNS = ["id", "word_type", "english", "greek", "notes", "created_at",
           "times_asked", "times_correct", "last_asked"]

_store = CsvStore(
    settings.data_dir / "vocabulary.csv",
    COLUMNS,
    column_defaults={"times_asked": "0", "times_correct": "0", "last_asked": ""},
)


def _attention_weight(word: Word) -> float:
    """Same formula as quiz selection: higher = needs more attention."""
    asked = word.times_asked
    if asked == 0:
        return 10.0
    accuracy = word.times_correct / asked
    return max(1.0, 5.0 * (1 - accuracy) + 2.0 / (1 + asked))


def list_words() -> list[Word]:
    rows = _store.read_all()
    words = [Word(**r) for r in rows]
    return sorted(words, key=_attention_weight, reverse=True)


def get_word(word_id: str) -> Word | None:
    row = _store.find_by_id(word_id)
    return Word(**row) if row else None


def add_word(data: WordCreate) -> Word:
    english_lower = data.english.strip().lower()
    for existing in _store.read_all():
        if existing["english"].strip().lower() == english_lower:
            raise ValueError(f"Word '{data.english.strip()}' already exists")
    row = {
        "id": uuid.uuid4().hex[:8],
        "word_type": data.word_type.value,
        "english": data.english.strip(),
        "greek": data.greek.strip(),
        "notes": data.notes.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "times_asked": "0",
        "times_correct": "0",
        "last_asked": "",
    }
    _store.append(row)
    return Word(**row)


def update_word(word_id: str, data: WordUpdate) -> Word | None:
    updates = {k: v.value if hasattr(v, "value") else v.strip() if isinstance(v, str) else v
                for k, v in data.model_dump(exclude_unset=True).items()}
    row = _store.update(word_id, updates)
    return Word(**row) if row else None


def delete_word(word_id: str) -> bool:
    return _store.delete(word_id)


def record_answer(word_id: str, correct: bool) -> None:
    row = _store.find_by_id(word_id)
    if not row:
        return
    times_asked = int(row.get("times_asked", 0)) + 1
    times_correct = int(row.get("times_correct", 0)) + (1 if correct else 0)
    _store.update(word_id, {
        "times_asked": str(times_asked),
        "times_correct": str(times_correct),
        "last_asked": datetime.now(timezone.utc).isoformat(),
    })
