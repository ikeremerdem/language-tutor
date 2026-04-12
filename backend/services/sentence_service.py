import csv
import json
import random
import litellm  # pyright: ignore[reportMissingImports]
from config import settings
from models.vocabulary import Word

# Sentence structures loaded lazily per language
_structures_cache: dict[str, list[tuple[str, float]]] = {}

SUBJECTS = [
    "I",
    "you (singular)",
    "he",
    "she",
    "it",
    "we",
    "you (plural)",
    "they",
    "you (formal)",
    "in the form [article] + [noun]",
    "in the form [indefinite article] + [noun]",
    "in the form [demonstrative] + [noun]",
]


def _load_structures(language: str) -> list[tuple[str, float]]:
    if language in _structures_cache:
        return _structures_cache[language]

    path = settings.data_dir / language / "sentence_structures.csv"
    entries: list[tuple[str, float]] = []
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                s = (row.get("structure") or "").strip()
                if not s:
                    continue
                try:
                    w = float((row.get("weight") or "1").strip() or "1")
                except ValueError:
                    w = 1.0
                entries.append((s, max(w, 0.001)))

    _structures_cache[language] = entries
    return entries


def _pick_structure(language: str) -> str:
    entries = _load_structures(language)
    if not entries:
        return "[subject] + [verb] + [object]"
    structs, weights = zip(*entries, strict=True)
    return random.choices(structs, weights=weights, k=1)[0]


def _random_singular_or_plural() -> str:
    return "singular" if random.random() < 0.5 else "plural"


def _random_seed() -> str:
    return "verb" if random.random() < 0.5 else "subject"


def _random_subject() -> str:
    return random.choice(SUBJECTS) + " and " + _random_singular_or_plural()


def _chat(prompt: str, temperature: float = 0.7, max_tokens: int = 200) -> str:
    kwargs: dict = {
        "model": settings.llm_model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": prompt}],
    }
    if settings.llm_api_key:
        kwargs["api_key"] = settings.llm_api_key
    if settings.llm_api_base:
        kwargs["api_base"] = settings.llm_api_base

    response = litellm.completion(**kwargs)
    return response.choices[0].message.content.strip()


def lookup_word(english: str, language: str) -> dict:
    """Look up an English word and return its target language translation, type, and notes.
    Returns {"target_language": str, "word_type": str, "notes": str}
    """
    prompt = f"""You are a {language} language dictionary. Translate the English word/phrase below to {language}.

Word: {english}

Respond with ONLY valid JSON (no markdown) with these fields:
- "target_language": the {language} translation (use the most common/standard form). Do not add the articles here.
- "word_type": one of "verb", "noun", "adjective", "adverb", "preposition", "other"
- "notes": helpful notes for a learner. Keep it brief. If applicable, state the article here.

{{"target_language": "...", "word_type": "...", "notes": "..."}}"""

    return json.loads(_chat(prompt))


def lookup_word_reverse(target_word: str, language: str) -> dict:
    """Look up a target language word and return its English translation, type, and notes.
    Returns {"english": str, "word_type": str, "notes": str}
    """
    prompt = f"""You are a {language} language dictionary. Translate the {language} word/phrase below to English.

Word: {target_word}

Respond with ONLY valid JSON (no markdown) with these fields:
- "english": the English translation (use the most common/standard form, no articles)
- "word_type": one of "verb", "noun", "adjective", "adverb", "preposition", "other"
- "notes": helpful notes for a learner. Keep it brief. If applicable, state the {language} article or grammar notes here.

{{"english": "...", "word_type": "...", "notes": "..."}}"""

    return json.loads(_chat(prompt))


def generate_sentence(
    words: list[Word],
    source_language: str,
    language: str,
    previous_sentences: list[str] | None = None,
) -> dict:
    """Generate a sentence using vocabulary words.
    source_language: "english" or "target_language"
    language: display name e.g. "Greek"
    Returns {"sentence": str, "translation": str, "word_id": str}
    """
    src_lang_name = language if source_language == "target_language" else "English"
    tgt_lang_name = "English" if source_language == "target_language" else language

    shuffled = list(words)
    random.shuffle(shuffled)
    word_list = "\n".join(f"- {w.english} = {w.target_language}" for w in shuffled)

    nouns = [w for w in shuffled if w.word_type == "noun"]
    verbs = [w for w in shuffled if w.word_type == "verb"]

    sentence_structure = _pick_structure(language)
    seed_type = _random_seed()
    subject_form = _random_subject()

    if seed_type == "verb":
        verb = random.choice(verbs) if verbs else None
        seed_constraint = (
            f"Use this verb: {verb.english} ({verb.target_language}), "
            f"the subject should be {subject_form}. "
            f"If needed pick a noun ONLY from the vocabulary provided."
        )
    else:
        subject = random.choice(nouns) if nouns else None
        seed_constraint = (
            f"The subject should be {subject_form}. "
            f"The noun it depicts is {subject.english} ({subject.target_language}). "
            f"If the subject is 'you', give in parenthesis if it is singular, formal or plural."
        )

    object_count = _random_singular_or_plural()
    avoid_block = ""
    if previous_sentences:
        avoid_block = "\n\nDo NOT generate any of these sentences (already used):\n" + "\n".join(
            f"- {s}" for s in previous_sentences
        )

    prompt = f"""I want you to generate a sentence for a language quiz.
        Generate a short, simple {src_lang_name} sentence using basic grammar.
        The sentence structure should be {sentence_structure}.
        {seed_constraint}. Only use present tense.
        Select a verb ONLY from the vocabulary words provided.
        If you decide to use an object, select a noun ONLY from the vocabulary words provided and it should be {object_count}.
        You can use adjectives, but select them ONLY from the vocabulary words provided.
        You can use personal pronouns (he, she, you, etc.), demonstrative pronouns (this, that, etc.), indefinite articles (a, an), prepositions (in, into, from, etc.), conjunctions.
        If the words, subjects, objects I have given you contain a disambiguation explanation in parenthesis (e.g. "you (singular)", "you (plural)", "you (formal)"), consider it and also keep them in the sentence you generate.
        When I say use ONLY from the vocabulary words provided, I mean do not use a word that is not in the vocabulary.
        The sentences should follow common sense and be realistic. {avoid_block}

        Vocabulary:
        {word_list}

        Respond with ONLY valid JSON (no markdown):
        {{"sentence": "<{src_lang_name} sentence>", "translation": "<{tgt_lang_name} translation>", "word_id": "<id of the main word used>"}}"""

    print(prompt)
    return json.loads(_chat(prompt, temperature=1.0))


def check_sentence_answer(
    original_sentence: str,
    correct_translation: str,
    user_answer: str,
    target_language: str,
) -> dict:
    """Use LLM to check if the user's translation is semantically correct.
    target_language: display name e.g. "Greek".
    Returns {"correct": bool, "explanation": str}
    """
    prompt = f"""You are a {target_language} language tutor checking a student's translation.

Original sentence: {original_sentence}
Expected translation: {correct_translation}
Student's answer: {user_answer}
Target language: {target_language}

The student's answer should convey the same meaning. Be lenient with:
- Minor spelling/accent differences in {target_language}
- Word order variations
- Article differences
- Equivalent synonyms

If the answer is totally correct, give a brief encouraging note (1 sentence) as explanation. 
Do not consider a sentence wrong, if the ending dot is missing. If the student's answer is correct, but the ending dot is missing, set correct to true and set explanation to: "Your sentence is correct, but the ending dot is missing."

If the answer is incorrect:
- If the answer is completely unrelated or nonsensical, set explanation to: "You are totally off this time :("
- Otherwise, explain in 2-3 sentences what specifically went wrong. Point out the incorrect words or grammar and explain the correct form. Be helpful and encouraging.

Respond with ONLY valid JSON (no markdown):
{{"correct": true/false, "explanation": "<explanation>"}}"""

    return json.loads(_chat(prompt))


def generate_package_words(name: str, description: str, category: str) -> list[str]:
    """Use LLM to generate up to 50 English words for a word package based on its description."""
    context_parts = [f'Package name: "{name}"'] if name else []
    if description:
        context_parts.append(f'Description: "{description}"')
    if category:
        context_parts.append(f'Category: "{category}"')
    context = "\n".join(context_parts)

    prompt = f"""You are a language learning expert. Generate a list of English words or short phrases suitable for a vocabulary package.

{context}

Requirements:
- Generate up to 50 words or short phrases that would fit most into the context of the package description 
- Each entry should be a single English word or short phrase (e.g. "to run", "house", "beautiful")
- NEVER use the article "the" for the nouns you generate. They can be within longer phrases, but not on their own.
- Use the base/infinitive form for verbs (e.g. "to eat" not "eating")
- Use the most common/simple form for nouns and adjectives
- Make them relevant to the package description and category
- No duplicates

Respond with ONLY a JSON array of strings, no markdown, no explanation:
["word1", "word2", ...]"""

    result = json.loads(_chat(prompt, temperature=0.8, max_tokens=800))
    if not isinstance(result, list):
        return []
    return [str(w).strip() for w in result if w][:50]
