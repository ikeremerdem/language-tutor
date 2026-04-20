-- ============================================================
-- Filos Language Tutor — Supabase Schema
-- Run this in the Supabase SQL Editor to set up the database.
-- ============================================================

-- Language Tutors (one per language per user)
CREATE TABLE IF NOT EXISTS language_tutors (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language    TEXT NOT NULL CHECK (language IN ('Greek', 'German', 'Spanish', 'Italian', 'French')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    preferences JSONB NOT NULL DEFAULT '{"allow_small_errors": true}',
    UNIQUE (user_id, language)
);

-- Vocabulary words (scoped to a tutor)
CREATE TABLE IF NOT EXISTS vocabulary (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id        UUID NOT NULL REFERENCES language_tutors(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word_type       TEXT NOT NULL CHECK (word_type IN ('verb','noun','adjective','adverb','preposition','other')),
    english         TEXT NOT NULL,
    target_language TEXT NOT NULL DEFAULT '',
    notes           TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    times_asked     INTEGER NOT NULL DEFAULT 0,
    times_correct   INTEGER NOT NULL DEFAULT 0,
    last_asked      TIMESTAMPTZ,
    current_streak  INTEGER NOT NULL DEFAULT 0,
    categories      TEXT[] NOT NULL DEFAULT '{}',
    UNIQUE (tutor_id, english)
);

-- Quiz sessions (persisted when a quiz ends)
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id        UUID NOT NULL REFERENCES language_tutors(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_type       TEXT NOT NULL CHECK (quiz_type IN ('word','sentence','conversation')),
    source_language TEXT NOT NULL CHECK (source_language IN ('english','target_language')),
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    score_percent   FLOAT NOT NULL DEFAULT 0,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    details_json    JSONB NOT NULL DEFAULT '[]'
);

-- Word Packages (user-created, optionally public)
CREATE TABLE IF NOT EXISTS word_packages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL UNIQUE,
    description TEXT        NOT NULL DEFAULT '',
    category    TEXT        NOT NULL DEFAULT '',
    words       TEXT[]      NOT NULL DEFAULT '{}',
    word_count  INTEGER     NOT NULL DEFAULT 0,
    is_public   BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation Personas (admin-managed)
CREATE TABLE IF NOT EXISTS personas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    persona_prompt  TEXT NOT NULL DEFAULT '',
    image_url       TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contexts per persona (e.g. "Ordering food", "Paying bill")
CREATE TABLE IF NOT EXISTS persona_contexts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id  UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Active conversations (one per user per session)
CREATE TABLE IF NOT EXISTS conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id        UUID NOT NULL REFERENCES language_tutors(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    persona_id      UUID NOT NULL REFERENCES personas(id),
    context_id      UUID REFERENCES persona_contexts(id),
    persona_name    TEXT NOT NULL DEFAULT '',
    quiz_session_id UUID REFERENCES quiz_sessions(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages within a conversation
CREATE TABLE IF NOT EXISTS conversation_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role                TEXT NOT NULL CHECK (role IN ('persona', 'user')),
    content             TEXT NOT NULL,
    translation         TEXT NOT NULL DEFAULT '',
    grammar_ok          BOOLEAN,
    grammar_explanation TEXT NOT NULL DEFAULT '',
    grammar_corrected   TEXT NOT NULL DEFAULT '',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations"
    ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS for conversation_messages
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages of own conversations"
    ON conversation_messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can insert messages of own conversations"
    ON conversation_messages FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- personas and persona_contexts are managed by backend service role key (no RLS needed)

-- ============================================================
-- Migration: add current_streak (run on existing databases)
-- ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;
--
-- Migration: add categories (run on existing databases)
-- ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}';
--
-- Migration: add Italian and French language support (run on existing databases)
-- ALTER TABLE language_tutors DROP CONSTRAINT IF EXISTS language_tutors_language_check;
-- ALTER TABLE language_tutors ADD CONSTRAINT language_tutors_language_check
--   CHECK (language IN ('Greek', 'German', 'Spanish', 'Italian', 'French'));
--
-- Migration: add word_packages table (run on existing databases)
-- (copy the CREATE TABLE word_packages block above and run it)
--
-- Migration: add preferences column (run on existing databases)
-- ALTER TABLE language_tutors ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{"allow_small_errors": true}';
-- UPDATE language_tutors SET preferences = '{"allow_small_errors": true}' WHERE preferences = '{}';
--
-- Migration: add conversation tables (run on existing databases)
-- (copy and run the personas, persona_contexts, conversations, conversation_messages CREATE TABLE blocks above)
--
-- Migration: add conversation quiz type and quiz_session_id (run on existing databases)
-- ALTER TABLE quiz_sessions DROP CONSTRAINT IF EXISTS quiz_sessions_quiz_type_check;
-- ALTER TABLE quiz_sessions ADD CONSTRAINT quiz_sessions_quiz_type_check CHECK (quiz_type IN ('word','sentence','conversation'));
-- ALTER TABLE conversations ADD COLUMN IF NOT EXISTS quiz_session_id UUID REFERENCES quiz_sessions(id);
--
-- Migration: add api_keys table (run on existing databases)
-- (copy and run the CREATE TABLE api_keys block above, then the RLS + policies for api_keys)
-- ============================================================

-- API Keys (user-scoped, for programmatic access)
CREATE TABLE IF NOT EXISTS api_keys (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name         TEXT        NOT NULL,
    key_hash     TEXT        NOT NULL UNIQUE,
    key_prefix   TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    is_active    BOOLEAN     NOT NULL DEFAULT true
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE language_tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions    ENABLE ROW LEVEL SECURITY;

-- language_tutors policies
CREATE POLICY "Users can view own tutors"
    ON language_tutors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tutors"
    ON language_tutors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tutors"
    ON language_tutors FOR DELETE USING (auth.uid() = user_id);

-- vocabulary policies
CREATE POLICY "Users can view own vocabulary"
    ON vocabulary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vocabulary"
    ON vocabulary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vocabulary"
    ON vocabulary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vocabulary"
    ON vocabulary FOR DELETE USING (auth.uid() = user_id);

-- word_packages policies
ALTER TABLE word_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public packages"
    ON word_packages FOR SELECT USING (is_public OR auth.uid() = user_id);
CREATE POLICY "Users can create own packages"
    ON word_packages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own packages"
    ON word_packages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own packages"
    ON word_packages FOR DELETE USING (auth.uid() = user_id);

-- api_keys policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own api keys"
    ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api keys"
    ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own api keys"
    ON api_keys FOR DELETE USING (auth.uid() = user_id);

-- quiz_sessions policies
CREATE POLICY "Users can view own sessions"
    ON quiz_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions"
    ON quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions"
    ON quiz_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions"
    ON quiz_sessions FOR DELETE USING (auth.uid() = user_id);
