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
    quiz_type       TEXT NOT NULL CHECK (quiz_type IN ('word','sentence')),
    source_language TEXT NOT NULL CHECK (source_language IN ('english','target_language')),
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    score_percent   FLOAT NOT NULL DEFAULT 0,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    details_json    JSONB NOT NULL DEFAULT '[]'
);

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
-- ============================================================

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

-- quiz_sessions policies
CREATE POLICY "Users can view own sessions"
    ON quiz_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions"
    ON quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions"
    ON quiz_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions"
    ON quiz_sessions FOR DELETE USING (auth.uid() = user_id);
