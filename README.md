# Filos — Language Tutor

A multi-user, web-based language learning application with vocabulary management, quizzes, and AI-powered sentence generation. Users register and create personal Language Tutors, each dedicated to a specific language.

## Features

- **Multi-user auth** — Register and sign in via Supabase Auth. Each user's data is fully isolated.
- **Language Tutors** — Create one tutor per language (Greek, German, Spanish, Italian, French). Switch between them freely.
- **Vocabulary Management** — Add words one at a time, in bulk, or via pre-built packages. Auto-lookup works in both directions (English → target language or target language → English), classifying and adding grammar notes via LLM. Filter by text, word type, performance category, or user-defined category, with pagination.
- **Word Categories** — Words can be tagged with one or more user-defined categories (e.g. "travel", "food"). Categories are assigned when adding words individually, in bulk, or from a package. Duplicate words encountered during bulk/package import get the new category merged in rather than being skipped outright.
- **Multiple Word Add** — Paste a list of English words (one per line); the app looks each up and adds it automatically. Duplicates are skipped (or updated with any specified categories).
- **Word Packages** — Thematic word lists stored in Supabase. Any user can create packages, flag them as public (visible to all), and edit or delete their own. Public packages are visible to everyone. The 7 built-in packages (Common Verbs, Common Nouns, Food & Drink, Travel, Numbers & Time, Body & Health, Colors) are seeded via an admin endpoint. Each package has a category applied automatically on import. Preview words before importing, with duplicates shown as strikethrough.
- **Word Quiz** — Flashcards with a visual direction toggle, focus modes (Balanced / New words / Struggling), and quick question count presets. Learned words are automatically excluded from Balanced and Struggling pools.
- **Sentence Quiz** — AI-generated sentences using only your vocabulary. Answers are checked semantically, handling word order and accent variations.
- **Streak & Word Categories** — Each word tracks a correct-answer streak. Words are classified into four categories: **New** (never asked), **Struggling** (streak = 0, asked at least once), **Learning** (streak > 0 and < threshold), **Learned** (streak ≥ `STREAK_LEARN_THRESHOLD`, default 5). Learned words are removed from the active quiz pool.
- **Dashboard** — Weekly activity chart, vocabulary status by category (New / Struggling / Learning / Learned), words-by-type breakdown, recent sessions, and your 10 most difficult unlearned words.
- **Conversations** — Practice in realistic dialogues with AI personas (waiter, doctor, teacher…). Choose a persona and context, then chat in your target language. Each message gets grammar feedback and an optional English translation. Conversation sessions count toward your dashboard stats.
- **Admin** — A password-free admin page (`/admin`) accessible only to the configured admin email. Shows a user statistics table and a personas management panel (create, edit, delete personas and their conversation contexts).
- **Profile & API Keys** — Set your display name from the Profile page. Generate personal API keys (`sk_...`) to call the backend programmatically from scripts or integrations. Keys are shown once and can be revoked at any time.
- **MCP Server** — The backend exposes an MCP (Model Context Protocol) endpoint at `/mcp/sse`. Connect Claude Desktop or Claude Code with your API key to manage vocabulary and look up translations through natural language.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, Pydantic |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Auth & Database | Supabase (PostgreSQL + Auth + Row Level Security) |
| AI | LiteLLM (supports OpenAI, Anthropic, Ollama, LMStudio, etc.) |
| Hosting (frontend) | Vercel (free tier) |
| Hosting (backend) | Fly.io (free tier, 512MB VM) |

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An LLM API key (OpenAI, Anthropic, etc.) or a local model (Ollama, LMStudio)

### 1. Database Setup

Run `supabase/schema.sql` against your Supabase project (SQL Editor → paste → Run). This creates the `language_tutors`, `vocabulary`, and `quiz_sessions` tables with Row Level Security enabled.

### 1a. Storage Setup

In the Supabase dashboard go to **Storage → New bucket**, create a bucket named `persona-images` and set it to **Public**. This is required for admin persona image uploads.

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
2. Create a Language Tutor (Greek, German, Spanish, Italian, or French) on the **My Tutors** page
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
    auth.py               # JWT + API key verification (dual-mode)
  mcp_server.py           # MCP server tools + auth middleware (mounted at /mcp)
  models/                 # Pydantic schemas (vocabulary, quiz, stats, tutor)
  routers/                # API endpoints
    tutors.py             #   /api/tutors
    vocabulary.py         #   /api/tutors/{id}/vocabulary
    quiz.py               #   /api/tutors/{id}/quiz
    stats.py              #   /api/tutors/{id}/stats
    packages.py           #   /api/packages (CRUD, DB-backed)
    conversations.py      #   /api/tutors/{id}/conversations + /api/personas
    api_keys.py           #   /api/api-keys (create, list, revoke)
    admin.py              #   /api/admin (admin-only, personas + user stats)
  services/
    supabase_client.py    # Supabase service-role client
    tutor_service.py      # Language tutor CRUD
    vocabulary_service.py # Vocabulary CRUD (Supabase)
    quiz_service.py       # In-memory quiz sessions, persisted on end
    sentence_service.py   # LLM sentence generation
    stats_service.py      # Dashboard and session queries
    scoring.py            # Central scoring: word_weight, word_category, is_learned
    admin_service.py      # Admin: user stats via Supabase auth admin API
  data/
    Greek/sentence_structures.csv
    German/sentence_structures.csv
    Spanish/sentence_structures.csv
    Italian/sentence_structures.csv
    French/sentence_structures.csv
    packages/                     # Legacy JSON files (used only for seed migration)
      common_verbs.json
      common_nouns.json
      food_and_drink.json
      travel.json
      numbers_and_time.json
      body_and_health.json
      colors.json

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
    PackageWordForm.tsx    # Package browser → preview → import flow
    TagInput.tsx           # Tag/category input component (Enter or comma to commit)
    WordCategoryTag.tsx    # Read-only teal pill for user-defined categories
    CategoryPill.tsx       # Status pill for New / Struggling / Learning / Learned
    QuizCard.tsx           # Active quiz question UI
    QuizSetup.tsx          # Quiz configuration and recent sessions
    StatsChart.tsx         # Weekly activity chart
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
    ConversationSetupPage.tsx
    ConversationChatPage.tsx
    ProfilePage.tsx        # Display name + API key management
    AdminPage.tsx          # Admin user statistics table
    AdminPersonasPage.tsx  # Persona CRUD
  types/index.ts          # TypeScript interfaces
```

## Production Deployment

The recommended production setup:

```
Users → Vercel (frontend) → Fly.io (backend) → Supabase (DB + Auth)
```

### Frontend → Vercel

1. Connect your GitHub repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL` — your Fly.io backend URL (e.g. `https://filos-tutor.fly.dev`)
4. Deploy — Vercel auto-deploys on every push to `main`

`frontend/vercel.json` handles SPA routing so direct URLs don't 404.

### Backend → Fly.io

Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/), then from the `backend/` folder:

```bash
fly auth login
fly apps create filos-tutor        # choose a globally unique name
fly secrets set \
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_ANON_KEY="your-anon-key" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  LLM_MODEL="openai/gpt-4o-mini" \
  LLM_API_KEY="sk-your-key" \
  ALLOWED_ORIGINS_STR="https://your-app.vercel.app" \
  ADMIN_EMAIL="your-admin-email@example.com"
fly deploy
```

The app runs as a Docker container (see `backend/Dockerfile`) with 1 gunicorn + uvicorn worker on 512MB RAM — required due to litellm's memory footprint.

> **Note:** Fly.io requires a credit card on file to run beyond the 5-minute trial. You won't be charged within the free tier (3 shared VMs included).

Health check endpoint: `GET /api/health`

### MCP Server (Claude Desktop / Claude Code)

The backend exposes an MCP server at `/mcp/sse` using the SSE transport.

1. Generate an API key from the **Profile** page in the app.
2. Add the following to your Claude Desktop or Claude Code MCP config:

```json
{
  "mcpServers": {
    "filos": {
      "type": "sse",
      "url": "https://<your-fly-app>.fly.dev/mcp/sse",
      "headers": { "X-API-Key": "sk_..." }
    }
  }
}
```

Available tools: `list_tutors`, `get_vocabulary`, `lookup_word`, `add_word`, `delete_word`.

### CORS

The backend reads `ALLOWED_ORIGINS_STR` as a comma-separated list of allowed origins. For local development the default is `http://localhost:5173`. For production set it to your Vercel URL.

---

## Adding a New Language

1. Add the language name to `SUPPORTED_LANGUAGES` in `backend/config.py`
2. Create `backend/data/<Language>/sentence_structures.csv` with sentence templates
3. The language will appear automatically in the tutor creation UI

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.
