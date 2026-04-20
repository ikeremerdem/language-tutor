"""
Filos MCP server — exposes language tutor tools over HTTP (SSE transport).

Mount point: /mcp  (configured in main.py)
Auth:        X-API-Key header (generated from Profile page)

Claude Desktop / Claude Code config example:
  {
    "mcpServers": {
      "filos": {
        "type": "sse",
        "url": "https://<your-fly-app>.fly.dev/mcp/sse",
        "headers": { "X-API-Key": "sk_..." }
      }
    }
  }
"""

import contextvars
import hashlib

from mcp.server.fastmcp import FastMCP
from starlette.responses import JSONResponse

from models.vocabulary import WordCreate, WordType
from services import tutor_service, vocabulary_service
from services.sentence_service import lookup_word as svc_lookup_word
from services.supabase_client import supabase

# ── User identity context ────────────────────────────────────────────────────
# Set by _ApiKeyAuthMiddleware on every request; read by tool handlers.
_user_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("mcp_user_id")


def _current_user() -> str:
    return _user_id_var.get()


def _verified_tutor(tutor_id: str, user_id: str):
    tutor = tutor_service.get_tutor(tutor_id, user_id)
    if not tutor:
        raise ValueError(f"Tutor '{tutor_id}' not found or does not belong to this user.")
    return tutor


# ── MCP server ───────────────────────────────────────────────────────────────

mcp = FastMCP("Filos Language Tutor")


@mcp.tool()
def list_tutors() -> list[dict]:
    """
    List all language tutors for the current user.
    Returns each tutor's id, language, and creation date.
    Use the returned id as tutor_id in all other tools.
    """
    tutors = tutor_service.list_tutors(_current_user())
    return [{"id": t.id, "language": t.language, "created_at": t.created_at} for t in tutors]


@mcp.tool()
def lookup_word(tutor_id: str, english_word: str) -> dict:
    """
    Look up the translation, word type, and usage notes for an English word using AI.
    Returns: target_language (translated word), word_type, notes.
    Use this before add_word to fill in the correct values.
    """
    tutor = _verified_tutor(tutor_id, _current_user())
    try:
        return svc_lookup_word(english_word, tutor.language)
    except Exception as e:
        raise ValueError(f"Lookup failed: {e}")


@mcp.tool()
def get_vocabulary(tutor_id: str) -> list[dict]:
    """
    Get all vocabulary words saved in a tutor.
    Returns id, english, target_language, word_type, notes, categories,
    times_asked, times_correct, and current_streak for each word.
    """
    _verified_tutor(tutor_id, _current_user())
    words = vocabulary_service.list_words(tutor_id)
    return [w.model_dump() for w in words]


@mcp.tool()
def add_word(
    tutor_id: str,
    english: str,
    word_type: str,
    target_language: str,
    notes: str = "",
    categories: list[str] | None = None,
) -> dict:
    """
    Add a new vocabulary word to a tutor.
    word_type must be one of: verb, noun, adjective, adverb, preposition, other.
    Tip: call lookup_word first to get the correct target_language and word_type.
    """
    user_id = _current_user()
    _verified_tutor(tutor_id, user_id)
    try:
        wt = WordType(word_type)
    except ValueError:
        raise ValueError(f"Invalid word_type '{word_type}'. Must be one of: {[e.value for e in WordType]}")
    data = WordCreate(
        word_type=wt,
        english=english,
        target_language=target_language,
        notes=notes,
        categories=categories or [],
    )
    word = vocabulary_service.add_word(tutor_id, user_id, data)
    return word.model_dump()


@mcp.tool()
def delete_word(tutor_id: str, word_id: str) -> dict:
    """Remove a vocabulary word by its ID. Returns {deleted: true/false}."""
    _verified_tutor(tutor_id, _current_user())
    deleted = vocabulary_service.delete_word(word_id, tutor_id)
    return {"deleted": deleted}


# ── Auth ASGI middleware ─────────────────────────────────────────────────────
# Pure ASGI (not BaseHTTPMiddleware) so that context vars propagate reliably
# into tool handlers that run during POST /messages/ processing.

class _ApiKeyAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        raw_key = headers.get(b"x-api-key", b"").decode()

        if not raw_key:
            response = JSONResponse({"error": "Missing X-API-Key header"}, status_code=401)
            await response(scope, receive, send)
            return

        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        res = (
            supabase.table("api_keys")
            .select("id, user_id")
            .eq("key_hash", key_hash)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )

        if not res.data:
            response = JSONResponse({"error": "Invalid API key"}, status_code=401)
            await response(scope, receive, send)
            return

        row = res.data[0]
        supabase.table("api_keys").update({"last_used_at": "now()"}).eq("id", row["id"]).execute()

        token = _user_id_var.set(str(row["user_id"]))
        try:
            await self.app(scope, receive, send)
        finally:
            _user_id_var.reset(token)


def create_mcp_app():
    """Return the MCP ASGI app wrapped with API key authentication."""
    return _ApiKeyAuthMiddleware(mcp.sse_app())
