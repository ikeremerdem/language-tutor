import json
from config import settings
from services.sentence_service import _chat
from services.supabase_client import supabase
from models.reading import ReadingText, ReadingTextSummary

# Per-language instructions describing which tables/fields a word info card should
# contain for each word type. Loaded lazily and cached.
_template_cache: dict[str, str] = {}

# Generic fallback used when a language has no specific template file.
_GENERIC_TEMPLATE = """For each word type, build the info card as follows:
- verb: include a table titled "Conjugation (Present)" with headers ["Person", "Form"] covering all persons (I, you, he/she/it, we, you plural, they). Add the infinitive/base form in notes.
- noun: include a table titled "Forms" with the singular and plural, and state the gender/article in notes.
- adjective: state the base form and, if the language inflects adjectives, a short table of the main forms.
- other (adverb, preposition, pronoun, conjunction, article): no table is needed, just a clear explanation in notes."""


def _load_template(language: str) -> str:
    if language in _template_cache:
        return _template_cache[language]

    path = settings.data_dir / language / "word_info_template.md"
    template = path.read_text(encoding="utf-8") if path.exists() else _GENERIC_TEMPLATE
    _template_cache[language] = template
    return template


def _translate(text: str, into: str) -> str:
    prompt = f"""Translate the following text into {into}. Keep it natural and faithful to the original.
Preserve line breaks and paragraph structure. Respond with ONLY the {into} translation, no quotes, no explanation.

Text:
{text}"""
    return _chat(prompt, temperature=0.3, max_tokens=1500).strip()


def analyze_text(text: str, source: str, language: str) -> dict:
    """Return the text in the target language so it can be made interactive,
    along with its English translation (so the reader can reveal it on demand).
    source: "english" or "target". When "english", the text is translated to
    the target language; when "target" it is returned (lightly cleaned) as-is.
    Returns {"text": <target language>, "translation": <English>}.
    """
    if source == "english":
        original = text.strip()
        return {"text": _translate(original, language), "translation": original}

    target = text.strip()
    return {"text": target, "translation": _translate(target, "English")}


def create_reading_text(tutor_id: str, user_id: str, title: str, text: str, source: str, language: str) -> ReadingText:
    """Translate (if needed), then persist a reading text and return the full record."""
    analyzed = analyze_text(text, source, language)
    row = {
        "tutor_id": tutor_id,
        "user_id": user_id,
        "title": (title or "").strip() or "Untitled",
        "target_text": analyzed["text"],
        "english_text": analyzed["translation"],
        "source": "english" if source == "english" else "target",
    }
    response = supabase.table("reading_texts").insert(row).execute()
    return ReadingText(**response.data[0])


def list_reading_texts(tutor_id: str) -> list[ReadingTextSummary]:
    response = (
        supabase.table("reading_texts")
        .select("id, title, created_at")
        .eq("tutor_id", tutor_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [ReadingTextSummary(**row) for row in response.data]


def get_reading_text(text_id: str, tutor_id: str) -> ReadingText | None:
    response = (
        supabase.table("reading_texts")
        .select("*")
        .eq("id", text_id)
        .eq("tutor_id", tutor_id)
        .execute()
    )
    return ReadingText(**response.data[0]) if response.data else None


def delete_reading_text(text_id: str, tutor_id: str) -> bool:
    response = (
        supabase.table("reading_texts")
        .delete()
        .eq("id", text_id)
        .eq("tutor_id", tutor_id)
        .execute()
    )
    return len(response.data) > 0


def word_info(word: str, context: str, language: str) -> dict:
    """Return detailed, templated information about a single word as it appears in
    the given sentence/context. Returns a structured dict:
    {
      "word": str, "lemma": str, "english": str, "word_type": str,
      "notes": str,
      "tables": [{"title": str, "headers": [str], "rows": [[str]]}]
    }
    """
    template = _load_template(language)
    prompt = f"""You are a {language} language dictionary helping a learner read a text.
Explain the {language} word "{word}" as it is used in this sentence:

"{context}"

{template}

Respond with ONLY valid JSON (no markdown), using this exact schema:
{{
  "word": "{word}",
  "lemma": "<dictionary/base form of the word>",
  "english": "<English translation of this word in this context>",
  "word_type": "one of: verb, noun, adjective, adverb, preposition, pronoun, conjunction, article, other",
  "notes": "<brief learner notes; include article/gender for nouns, base/infinitive for verbs>",
  "tables": [
    {{"title": "<table title>", "headers": ["<col1>", "<col2>"], "rows": [["<a>", "<b>"]]}}
  ]
}}
If no table is appropriate for this word type, use an empty array for "tables"."""

    return json.loads(_chat(prompt, temperature=0.2, max_tokens=900))
