import json
import litellm  # pyright: ignore[reportMissingImports]
from config import settings
from models.vocabulary import Word


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
    import random
    shuffled = list(words)
    random.shuffle(shuffled)
    word_list = "\n".join(
        f"- {w.english} = {w.greek}" for w in shuffled
    )

    # Assign a random noun from the vocabulary to random_subject
    nouns = [w for w in shuffled if w.word_type == "noun"]
    verbs = [w for w in shuffled if w.word_type == "verb"]
    adjectives = [w for w in shuffled if w.word_type == "adjective"]

    subject = random.choice(nouns) if nouns else None
    subject_count = "singular" if random.random() < 0.5 else "plural"
    object_count = "singular" if random.random() < 0.5 else "plural"
    if subject:
        subject_selection = f"The subject is {subject.english} ({subject.greek}) and is {subject_count}."
    else:
        subject_selection = "The subject is a random noun."

    avoid_block = ""
    if previous_sentences:
        avoid_block = "\n\nDo NOT generate any of these sentences (already used):\n" + "\n".join(
            f"- {s}" for s in previous_sentences
        )
    
    target_language = "english" if source_language == "greek" else "greek"

    prompt = f"""I want you to generate a sentence for a language quiz.
Generate a short, simple {source_language} sentence using one or more of these vocabulary words. 
The sentence should be 3-7 words long and use basic grammar. The subject selection: {subject_selection}
Select a verb ONLY from the vocabulary words provided.
If you decide to use an object, select a noun ONLY from the vocabulary words provided and it should be {object_count}.
You can use adjectives after the verb "to be", but select them ONLY from the vocabulary words provided.
You can use personal pronouns (he, she, you, etc.), demonstrative pronouns (this, that, etc.), articles, prepositions (in, into, from, etc.), conjunctions, etc. 
When I say use ONLY from the vocabulary words provided, I mean do not use a word that is not in the vocabulary.
The sentences should make sense, not just random words brought together. {avoid_block}

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

Respond with ONLY valid JSON (no markdown):
{{"correct": true/false, "explanation": "<brief explanation>"}}"""

    text = _chat(prompt)
    return json.loads(text)
