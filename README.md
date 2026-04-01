# Filos — Language Tutor

A multi-user, web-based language learning application with vocabulary management, quizzes, and AI-powered sentence generation. Users register and create personal Language Tutors, each dedicated to a specific language.

## Features

- **Multi-user auth** — Register and sign in via Supabase Auth. Each user's data is fully isolated.
- **Language Tutors** — Create one tutor per language (Greek, German, Spanish). Switch between them freely.
- **Vocabulary Management** — Add words one at a time or in bulk. Auto-lookup translates, classifies, and adds grammar notes via LLM. Filter by text, word type, or performance (New / Correct ≥ 80% / Correct < 80%), with pagination.
- **Bulk Word Add** — Paste a list of English words (one per line); the app looks each up and adds it automatically, skipping duplicates.
- **Word Quiz** — Flashcards with a visual direction toggle, focus modes (Balanced / New words / Mistakes), and quick question count presets.
- **Sentence Quiz** — AI-generated sentences using only your vocabulary. Answers are checked semantically, handling word order and accent variations.
- **Dashboard** — Weekly activity chart, vocabulary status breakdown, recent sessions, and your 10 most difficult words.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, Pydantic |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Auth & Database | Supabase (PostgreSQL + Auth + Row Level Security) |
| AI | LiteLLM (supports OpenAI, Anthropic, Ollama, LMStudio, etc.) |

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An LLM API key (OpenAI, Anthropic, etc.) or a local model (Ollama, LMStudio)

### 1. Database Setup

Run `supabase/schema.sql` against your Supabase project (SQL Editor → paste → Run). This creates the `language_tutors`, `vocabulary`, and `quiz_sessions` tables with Row Level Security enabled.

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your credentials
```

`.env` configuration:

```bash
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LLM provider (pick one)
LLM_MODEL=openai/gpt-4o-mini
LLM_API_KEY=sk-your-key-here

# Anthropic
# LLM_MODEL=anthropic/claude-sonnet-4-5-20250929
# LLM_API_KEY=sk-ant-your-key-here

# Ollama (local, no key needed)
# LLM_MODEL=ollama/llama3
# LLM_API_BASE=http://localhost:11434

# LMStudio (local, no key needed)
# LLM_MODEL=openai/local-model
# LLM_API_BASE=http://localhost:1234/v1
```

Start the server:

```bash
uvicorn main:app --reload
```

API docs available at http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Edit .env with your Supabase public credentials
```

`.env` configuration:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Start the dev server:

```bash
npm run dev
```

Open http://localhost:5173

## User Flow

1. Register or sign in at `/register` / `/login`
2. Create a Language Tutor (Greek, German, or Spanish) on the **My Tutors** page
3. Enter a tutor to access its dashboard, vocabulary, and quizzes
4. All data (vocabulary, sessions, stats) is scoped per user and per tutor

## Project Structure

```
supabase/
  schema.sql              # Database schema and RLS policies

backend/
  main.py                 # FastAPI app entry point
  config.py               # Settings (Supabase keys, LLM config, supported languages)
  middleware/
    auth.py               # JWT verification via Supabase Auth
  models/                 # Pydantic schemas (vocabulary, quiz, stats, tutor)
  routers/                # API endpoints
    tutors.py             #   /api/tutors
    vocabulary.py         #   /api/tutors/{id}/vocabulary
    quiz.py               #   /api/tutors/{id}/quiz
    stats.py              #   /api/tutors/{id}/stats
  services/
    supabase_client.py    # Supabase service-role client
    tutor_service.py      # Language tutor CRUD
    vocabulary_service.py # Vocabulary CRUD (Supabase)
    quiz_service.py       # In-memory quiz sessions, persisted on end
    sentence_service.py   # LLM sentence generation
    stats_service.py      # Dashboard and session queries
  data/
    Greek/sentence_structures.csv
    German/sentence_structures.csv
    Spanish/sentence_structures.csv

frontend/src/
  lib/supabase.ts         # Supabase JS client (anon key, used for auth)
  context/
    AuthContext.tsx        # User auth state (user, loading, signOut)
    TutorContext.ts        # Active tutor state (tutorId, targetLanguage)
  api/client.ts           # Typed API client (JWT injected on every request)
  components/
    TutorLayout.tsx        # Loads tutor from URL param, provides TutorContext
    Layout.tsx             # App shell with nav and header
    BulkWordForm.tsx       # Bulk word add with per-word live status
    WordForm.tsx           # Single word add with LLM lookup
    WordTable.tsx          # Vocabulary list with inline editing
    QuizCard.tsx           # Active quiz question UI
    QuizSetup.tsx          # Quiz configuration and recent sessions
    ...
  hooks/useQuiz.ts        # Quiz state machine
  pages/
    LoginPage.tsx
    RegisterPage.tsx
    TutorsPage.tsx         # My Tutors list and tutor creation
    DashboardPage.tsx
    VocabularyPage.tsx
    WordQuizPage.tsx
    SentenceQuizPage.tsx
  types/index.ts          # TypeScript interfaces
```

## Adding a New Language

1. Add the language name to `SUPPORTED_LANGUAGES` in `backend/config.py`
2. Create `backend/data/<Language>/sentence_structures.csv` with sentence templates
3. The language will appear automatically in the tutor creation UI

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.
