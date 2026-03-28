import csv
import json
import random
from re import sub
import litellm  # pyright: ignore[reportMissingImports]
from config import settings
from models.vocabulary import Word

# Load sentence structures (with optional weights) once at startup
_sentence_structure_entries: list[tuple[str, float]] = []
_structures_path = settings.data_dir / "sentence_structures.csv"

# List of English subject pronouns, singular and plural
SUBJECTS = [
    "I",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "you (formal)",
    "in the form [article] + [noun]",
    "in the form [indefinite article] + [noun]",
    "in the form [demonstrative] + [noun]",
]


if _structures_path.exists():
    with open(_structures_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            s = (row.get("structure") or "").strip()
            if not s:
                continue
            try:
                w = float((row.get("weight") or "1").strip() or "1")
            except ValueError:
                w = 1.0
            if w <= 0:
                w = 1.0
            _sentence_structure_entries.append((s, w))


def _pick_sentence_structure() -> str:
    if not _sentence_structure_entries:
        return "[subject] + [verb] + [object]"
    structs, weights = zip(*_sentence_structure_entries, strict=True)
    return random.choices(structs, weights=weights, k=1)[0]

def _random_singular_or_plural() -> str:
    return "singular" if random.random() < 0.5 else "plural"

def _random_seed () -> str:
    return "verb" if random.random() < 0.5 else "subject"

def _random_subject () -> str:
    return random.choice(SUBJECTS) + " and " + _random_singular_or_plural()

def _chat(prompt: str, temperature: float = 0.7) -> str:
    kwargs: dict = {
        "model": settings.llm_model,
        "max_tokens": 200,
        "temperature": temperature,
        "messages": [{"role": "user", "content": prompt}],
    }
    if settings.llm_api_key:
        kwargs["api_key"] = settings.llm_api_key
    if settings.llm_api_base:
        kwargs["api_base"] = settings.llm_api_base

    response = litellm.completion(**kwargs)
    return response.choices[0].message.content.strip()


def lookup_word(english: str) -> dict:
    """Look up an English word and return its Greek translation, type, and notes.
    Returns {"greek": str, "word_type": str, "notes": str}
    """
    prompt = f"""You are a Greek language dictionary. Translate the English word/phrase below to Greek.

Word: {english}

Respond with ONLY valid JSON (no markdown) with these fields:
- "greek": the Greek translation (use the most common/standard form)
- "word_type": one of "verb", "noun", "adjective", "adverb", "preposition", "other"
- "notes": helpful notes for a learner, e.g. for nouns include the article (ο/η/το) and gender, for verbs note if it's type A or B conjugation, any irregularities. Keep it brief.

{{"greek": "...", "word_type": "...", "notes": "..."}}"""

    text = _chat(prompt)
    return json.loads(text)


def generate_sentence(words: list[Word], source_language: str, previous_sentences: list[str] | None = None) -> dict:
    """Generate a sentence using a subset of vocabulary words.
    Returns {"sentence": str, "translation": str, "word_id": str}
    """
    shuffled = list(words)
    random.shuffle(shuffled)
    word_list = "\n".join(
        f"- {w.english} = {w.greek}" for w in shuffled
    )

    # Assign a random noun from the vocabulary to random_subject
    nouns = [w for w in shuffled if w.word_type == "noun"]
    verbs = [w for w in shuffled if w.word_type == "verb"]
    # adjectives = [w for w in shuffled if w.word_type == "adjective"]

    sentence_structure = _pick_sentence_structure()

    seed_type = _random_seed()
    subject_form = _random_subject()
    if seed_type == "verb":
        verb = random.choice(verbs) if verbs else None
        seed_constraint = f"Use this verb: {verb.english} ({verb.greek}), the subject should be {subject_form}. If needed pick a noun ONLY from the vocabulary provided. "
    else:
        subject = random.choice(nouns) if nouns else None
        seed_constraint = f"The subject shuold be {subject_form}. The noun it depicts is {subject.english} ({subject.greek})."

    object_count = _random_singular_or_plural()

    avoid_block = ""
    if previous_sentences:
        avoid_block = "\n\nDo NOT generate any of these sentences (already used):\n" + "\n".join(
            f"- {s}" for s in previous_sentences
        )
    

    target_language = "english" if source_language == "greek" else "greek"
    tense_constraint = "Only use present tense."

    prompt = f"""I want you to generate a sentence for a language quiz.
        Generate a short, simple {source_language} sentence using basic grammar. 
        The sentence structure should be {sentence_structure}.
        {seed_constraint}. {tense_constraint}
        Select a verb ONLY from the vocabulary words provided.
        If you decide to use an object, select a noun ONLY from the vocabulary words provided and it should be {object_count}.
        You can use adjectives, but select them ONLY from the vocabulary words provided.
        You can use personal pronouns (he, she, you, etc.), demonstrative pronouns (this, that, etc.), indefinite articles (a, an), prepositions (in, into, from, etc.), conjunctions. They would add variety to the sentences. 
        When I say use ONLY from the vocabulary words provided, I mean do not use a word that is not in the vocabulary.
        The sentences should follow common sense, should be realistic, not just random words brought together. Do not bring any verbs and subjects together, that are not realistic, if possible. {avoid_block}

        Vocabulary:
        {word_list}

        Respond with ONLY valid JSON (no markdown):
        {{"sentence": "<{source_language} sentence>", "translation": "<{target_language} translation>", "word_id": "<id of the main word used>"}}"""

    print(prompt)
    text = _chat(prompt, temperature=1.0)
    return json.loads(text)


def check_sentence_answer(original_sentence: str, correct_translation: str,
                          user_answer: str, target_language: str) -> dict:
    """Use LLM to check if the user's translation is semantically correct.
    Returns {"correct": bool, "explanation": str}
    """
    prompt = f"""You are a Greek language tutor checking a student's translation.

Original sentence: {original_sentence}
Expected translation: {correct_translation}
Student's answer: {user_answer}
Target language: {target_language}

The student's answer should convey the same meaning. Be lenient with:
- Minor spelling/accent differences in Greek
- Word order variations
- Article differences
- Equivalent synonyms

If the answer is correct, give a brief encouraging note (1 sentence).

If the answer is incorrect:
- If the answer is completely unrelated or nonsensical, set explanation to: "You are totally off this time :("
- Otherwise, explain in 2-3 sentences what specifically went wrong. Point out the incorrect words or grammar and explain the correct form. Be helpful and encouraging.

Respond with ONLY valid JSON (no markdown):
{{"correct": true/false, "explanation": "<explanation as described above>"}}"""

    text = _chat(prompt)
    return json.loads(text)
