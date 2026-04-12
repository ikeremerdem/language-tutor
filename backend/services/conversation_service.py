import json
import random
from datetime import datetime, timezone

from models.conversation import (
    PersonaWithContexts, PersonaContext, Conversation,
    ConversationMessage,
)
from services import vocabulary_service
from services.sentence_service import _chat
from services.supabase_client import supabase


def list_personas() -> list[PersonaWithContexts]:
    personas_data = supabase.table("personas").select("*").order("created_at").execute().data
    contexts_data = supabase.table("persona_contexts").select("*").order("created_at").execute().data

    contexts_by_persona: dict[str, list] = {}
    for c in contexts_data:
        contexts_by_persona.setdefault(c["persona_id"], []).append(c)

    result = []
    for p in personas_data:
        contexts = [PersonaContext(**c) for c in contexts_by_persona.get(p["id"], [])]
        result.append(PersonaWithContexts(**p, contexts=contexts))
    return result


def get_persona(persona_id: str) -> PersonaWithContexts | None:
    p = supabase.table("personas").select("*").eq("id", persona_id).single().execute().data
    if not p:
        return None
    contexts_data = supabase.table("persona_contexts").select("*").eq("persona_id", persona_id).order("created_at").execute().data
    contexts = [PersonaContext(**c) for c in contexts_data]
    return PersonaWithContexts(**p, contexts=contexts)


def start_conversation(
    tutor_id: str,
    user_id: str,
    language: str,
    persona_id: str,
    context_id: str | None,
) -> tuple[str, str, str]:
    """Returns (conversation_id, persona_name, first_message)."""
    persona = get_persona(persona_id)
    if not persona:
        raise ValueError("Persona not found")

    context_label = ""
    if context_id:
        ctx = next((c for c in persona.contexts if c.id == context_id), None)
        context_label = ctx.label if ctx else ""

    # Build vocabulary hint (up to 40 words, shuffled)
    words = vocabulary_service.list_words(tutor_id)
    sample = random.sample(words, min(40, len(words))) if words else []
    vocab_hint = "\n".join(f"- {w.english} = {w.target_language}" for w in sample) if sample else "(no vocabulary yet)"

    context_line = f"Context for this conversation: {context_label}" if context_label else ""

    prompt = f"""You are playing the role of a {persona.name}. {persona.persona_prompt}

The user is learning {language}. Their current vocabulary includes:
{vocab_hint}

{context_line}

First, assign yourself a realistic, culturally appropriate first name for a {language}-speaking {persona.name}.
Then start the conversation naturally in {language}, as that character. Use simple language suitable for a language learner. Try to naturally incorporate words from the user's vocabulary where they fit the context. Keep the opening message brief (1-3 sentences).

Respond with ONLY valid JSON (no markdown):
{{"persona_name": "...", "message": "...", "translation": "<English translation of message>"}}"""

    raw = _chat(prompt, temperature=0.9, max_tokens=400)
    parsed = json.loads(raw)
    persona_name: str = parsed["persona_name"]
    first_message: str = parsed["message"]
    first_translation: str = parsed.get("translation", "")

    # Create quiz session for this conversation
    session = supabase.table("quiz_sessions").insert({
        "tutor_id": tutor_id,
        "user_id": user_id,
        "quiz_type": "conversation",
        "source_language": "target_language",
        "total_questions": 0,
        "correct_answers": 0,
        "score_percent": 0.0,
        "started_at": datetime.now(timezone.utc).isoformat(),
    }).execute().data[0]

    # Persist conversation
    conv = supabase.table("conversations").insert({
        "tutor_id": tutor_id,
        "user_id": user_id,
        "persona_id": persona_id,
        "context_id": context_id,
        "persona_name": persona_name,
        "quiz_session_id": session["id"],
    }).execute().data[0]

    # Persist first message
    supabase.table("conversation_messages").insert({
        "conversation_id": conv["id"],
        "role": "persona",
        "content": first_message,
        "translation": first_translation,
    }).execute()

    return conv["id"], persona_name, first_message, first_translation


def translate_sentence(english_text: str, language: str) -> str:
    """Translate an English sentence to the target language."""
    prompt = f"""Translate the following English sentence into {language}. Return ONLY the translated sentence, no explanation, no markdown.

English: {english_text}
{language}:"""
    return _chat(prompt, temperature=0.3, max_tokens=200)


def _check_grammar(text: str, language: str) -> tuple[bool, str, str]:
    """Returns (is_correct, explanation, corrected_version)."""
    prompt = f"""You are a {language} language teacher. A student wrote the following in {language}:

"{text}"

Check if this is grammatically correct {language}. Be lenient with minor accent omissions, but flag real grammar mistakes.

Respond with ONLY valid JSON (no markdown):
{{"correct": true, "explanation": "", "corrected": ""}}

If there are mistakes, set correct to false and fill in:
- explanation: 1-2 sentences in English explaining what is wrong. You may quote the incorrect and correct {language} words/forms inline (e.g. "You used 'θέλω' but it should be 'θέλεις' for second person singular."). 
- If you really think that the response sounds unnatural, and there is a better way to express, also mention it in the explanation.
- corrected: the fully corrected sentence in {language}."""

    try:
        parsed = json.loads(_chat(prompt, temperature=0.3, max_tokens=200))
        ok: bool = bool(parsed.get("correct", True))
        explanation: str = parsed.get("explanation", "")
        corrected: str = parsed.get("corrected", "")
        return ok, explanation, corrected
    except Exception:
        return True, "", ""


def send_message(
    conversation_id: str,
    user_id: str,
    user_content: str,
    language: str,
) -> str:
    """Persist user message, generate and persist persona reply. Returns reply content."""
    # Verify ownership
    conv_data = supabase.table("conversations").select("*").eq("id", conversation_id).eq("user_id", user_id).single().execute().data
    if not conv_data:
        raise ValueError("Conversation not found")

    conv = Conversation(**conv_data)
    persona = get_persona(conv.persona_id)
    if not persona:
        raise ValueError("Persona not found")

    context_label = ""
    if conv.context_id:
        ctx = next((c for c in persona.contexts if c.id == conv.context_id), None)
        context_label = ctx.label if ctx else ""

    # Grammar check the user's message
    grammar_ok, grammar_explanation, grammar_corrected = _check_grammar(user_content, language)

    # Persist user message with grammar result
    supabase.table("conversation_messages").insert({
        "conversation_id": conversation_id,
        "role": "user",
        "content": user_content,
        "grammar_ok": grammar_ok,
        "grammar_explanation": grammar_explanation,
        "grammar_corrected": grammar_corrected,
    }).execute()

    # Update quiz session stats
    if conv.quiz_session_id:
        s = supabase.table("quiz_sessions").select("total_questions, correct_answers").eq("id", conv.quiz_session_id).single().execute().data
        total = int(s["total_questions"]) + 1
        correct = int(s["correct_answers"]) + (1 if grammar_ok else 0)
        score = round(correct / total * 100, 1)
        supabase.table("quiz_sessions").update({
            "total_questions": total,
            "correct_answers": correct,
            "score_percent": score,
            "ended_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", conv.quiz_session_id).execute()

    # Fetch full history (including the message we just inserted)
    history = get_messages(conversation_id, user_id)

    # Build vocabulary hint
    words = vocabulary_service.list_words(conv.tutor_id)
    sample = random.sample(words, min(30, len(words))) if words else []
    vocab_hint = ", ".join(w.english for w in sample) if sample else "(none)"

    history_text = "\n".join(
        f"{conv.persona_name}: {m.content}" if m.role == "persona" else f"User: {m.content}"
        for m in history
    )

    context_line = f"Conversation context: {context_label}" if context_label else ""

    prompt = f"""You are {conv.persona_name}, a {persona.name}. {persona.persona_prompt}

Language: {language}
{context_line}

The user is learning {language}. Their vocabulary includes: {vocab_hint}

Conversation so far:
{history_text}

Reply as {conv.persona_name} in {language}. Be natural and conversational. Try to incorporate words from the user's vocabulary where natural. Keep your reply concise (1-4 sentences). Stay in character.

Respond with ONLY valid JSON (no markdown):
{{"message": "...", "translation": "<English translation of message>"}}"""

    raw = _chat(prompt, temperature=0.9, max_tokens=400)
    parsed = json.loads(raw)
    reply: str = parsed["message"]
    translation: str = parsed.get("translation", "")

    # Persist persona reply
    supabase.table("conversation_messages").insert({
        "conversation_id": conversation_id,
        "role": "persona",
        "content": reply,
        "translation": translation,
    }).execute()

    return reply, translation, grammar_ok, grammar_explanation, grammar_corrected


def get_messages(conversation_id: str, user_id: str) -> list[ConversationMessage]:
    # Verify ownership via conversation
    conv = supabase.table("conversations").select("id").eq("id", conversation_id).eq("user_id", user_id).execute().data
    if not conv:
        raise ValueError("Conversation not found")

    rows = supabase.table("conversation_messages").select("*").eq("conversation_id", conversation_id).order("created_at").execute().data
    return [ConversationMessage(**r) for r in rows]


# ── Admin persona management ──────────────────────────────────────────────────

def admin_list_personas() -> list[PersonaWithContexts]:
    return list_personas()


def admin_create_persona(name: str, description: str, persona_prompt: str, image_url: str) -> dict:
    return supabase.table("personas").insert({
        "name": name,
        "description": description,
        "persona_prompt": persona_prompt,
        "image_url": image_url,
    }).execute().data[0]


def admin_update_persona(persona_id: str, patch: dict) -> dict:
    return supabase.table("personas").update(patch).eq("id", persona_id).execute().data[0]


def admin_delete_persona(persona_id: str) -> None:
    supabase.table("personas").delete().eq("id", persona_id).execute()


def admin_create_context(persona_id: str, label: str) -> dict:
    return supabase.table("persona_contexts").insert({
        "persona_id": persona_id,
        "label": label,
    }).execute().data[0]


def admin_delete_context(context_id: str) -> None:
    supabase.table("persona_contexts").delete().eq("id", context_id).execute()
