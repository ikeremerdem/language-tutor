# Filos — Language Tutor: Requirements

The application helps users learn a target language from English. It is a multi-user application where each user can create one or more Language Tutors, each dedicated to a specific language. All vocabulary, quizzes, and AI interactions are between English and the tutor's configured language.

---

## 1. Authentication & Multi-User

- Users register and sign in with email and password via Supabase Auth.
- All data is scoped per user — no user can access another user's tutors or vocabulary.
- Row Level Security (RLS) is enforced at the database level.

## 2. Language Tutors

- After signing in, a user lands on the **My Tutors** page listing their tutors.
- A user can create a Language Tutor by selecting a language (currently: Greek, German, Spanish, Italian, French).
- Only one tutor per language per user is allowed (enforced by a database unique constraint).
- Entering a tutor scopes the entire app (vocabulary, quizzes, stats) to that tutor and language.
- Adding new supported languages requires adding the name to the backend config and creating a sentence structures CSV file — no other code changes required.

## 3. Vocabulary Recording

- Words can be verbs, nouns, adjectives, adverbs, prepositions, or other.
- Each entry stores: word type, English word, target language translation, a notes field, and one or more user-defined categories.
- Notes capture grammar-specific information (e.g. article and gender for nouns, conjugation type for verbs, irregularities).
- Categories are free-form lowercase tags (e.g. "travel", "food") assigned at creation time. Multiple categories can be added via a tag input (Enter or comma to commit, Backspace to remove).
- Each English word can only be added once per tutor — duplicates are rejected (but their categories can be merged, see §5 and §5a).

## 4. Word Lookup

- When adding a word, the user can look up from either direction:
  - **English → Target language**: Type an English word and click **Lookup** to auto-fill the translation, word type, and notes.
  - **Target language → English**: Type a word in the target language and click **← Lookup** to auto-fill the English translation, word type, and notes.
- The user can review and edit any auto-filled field before saving.
- If the resolved English word already exists in the vocabulary, a duplicate warning is shown.

## 5. Multiple Word Add

- The vocabulary page offers a **Multiple** mode alongside the single-word form.
- A direction toggle switches between **English** (English → target language lookup) and **[Target Language]** (target language → English lookup).
- The user can optionally enter one or more categories that will be applied to all words in the batch.
- The user pastes a list of words or phrases (one per line) into a textarea.
- The app processes them sequentially: looks each up via LLM and adds it if not already present.
  - English mode: resolves translation, word type, and notes from English.
  - Target language mode: resolves the English word, word type, and notes from the target language word.
- If a word already exists and categories were specified, those categories are merged into the existing word (not a full skip).
- Each word shows a live status: added (✓), skipped/categories updated (–), or failed (✕).
- A summary is shown at the end (X added · Y skipped · Z failed).

## 5a. Word Packages

- The vocabulary page also offers a **Load Package** mode.
- Word packages are JSON files stored in `backend/data/packages/`, each with a name, description, a list of English words, and a `category` field.
- The package browser shows all available packages as cards with name, description, word count, and category badge.
- Selecting a package shows a preview of all words (duplicates shown as strikethrough), and the number of new words to be added.
- Clicking "Load N words →" starts the sequential LLM lookup and import. A warning banner is shown during import; navigating away is blocked via `beforeunload`.
- When a word already exists in the vocabulary, the package's category is merged into that word's categories instead of skipping it entirely.
- Packages are language-agnostic — the same package file works for all target languages.
- New packages can be added by dropping a JSON file into `backend/data/packages/` with the format: `{"name": "...", "description": "...", "category": "...", "words": [...]}`.
- Built-in packages: Common Verbs, Common Nouns, Food & Drink, Travel, Numbers & Time, Body & Health, Colors.

## 6. Vocabulary List

- The vocabulary list supports sorting by:
  - **Newest first** (default) — most recently added words at the top
  - **Oldest first** — chronological order
  - **A → Z** / **Z → A** — alphabetical by English word
  - **Most asked** / **Least asked** — by times asked count
  - **Highest accuracy** / **Lowest accuracy** — by correct/asked ratio (never-asked words sort last)
  - **Highest streak** / **Lowest streak** — by current streak
- The vocabulary list supports filtering by:
  - Text search (English or target language)
  - Word type (verb, noun, adjective, etc.)
  - Status category: All words / New / Struggling / Learning / Learned (see §10)
  - User-defined category (dropdown appears when any categories exist)
- Words that have never been asked display a "New" pill instead of a count of 0.
- Pagination shows 20 words per page.
- Words can be edited inline (including categories) or deleted.
- The vocabulary table shows a Categories column with read-only teal pills in view mode and a tag input in edit mode.

## 7. Word Quiz

- The quiz setup screen offers:
  - **Translation direction** — a visual toggle button showing e.g. `English → Greek`; clicking it swaps the direction.
  - **Focus** — three pill options:
    - *Balanced*: weighted mix of all non-learned words (new and struggling words get higher weight)
    - *New words*: only words never practiced, selected uniformly at random
    - *Struggling*: only words where streak = 0 and asked at least once, weighted toward higher error rates
  - **Number of questions** — quick-pick buttons (5 / 10 / 20 / 50) plus a custom input.
- The setup screen also shows a Vocabulary Status summary (New / Struggling / Learning / Learned) and recent session history.
- After each answer, the result (correct/incorrect), the correct answer, and grammar notes are displayed.
- At the end of the session, a summary shows score, per-word results, and session statistics.

## 8. Sentence Quiz

- The quiz setup screen offers the same translation direction toggle and number of questions picker as the word quiz.
- The system generates simple sentences using ONLY words in the user's vocabulary, in either direction.
- The user types the translated sentence as an answer.
- Answers are checked semantically using an LLM (handling word order, accents, and equivalent synonyms).
- At the end of the session, statistics are displayed.
- Sentence structure templates are stored per language in `backend/data/<Language>/sentence_structures.csv`.

## 9. Dashboard

- Displays: total vocabulary count, total sessions, total questions answered, average score, best score.
- Weekly activity chart showing questions answered per day.
- Two-column panel below the chart:
  - **Left**: Words by Type breakdown table (verb, noun, adjective, etc. with counts and share %), followed by Recent session history (last 10 sessions).
  - **Right**: Vocabulary Status table (New / Struggling / Learning / Learned with counts and share %), followed by Top 10 most difficult words (lowest success rate, learned words excluded).
- A "Reset Statistics" button that clears all session history without affecting vocabulary.
- When vocabulary is empty, a call to action banner is displayed with a direct link that opens the Load Package tab on the Vocabulary page.

## 10. Streak & Word Status Categories

- Each vocabulary word tracks a `current_streak` counter (consecutive correct answers).
- A correct quiz answer increments the streak; a wrong answer resets it to 0.
- A configurable backend constant `STREAK_LEARN_THRESHOLD` (default 5) determines when a word is considered **Learned**.
- Words are classified into four status categories:
  - **New** — `times_asked = 0` (never practiced)
  - **Struggling** — `current_streak = 0` and asked at least once
  - **Learning** — `current_streak > 0` and `< STREAK_LEARN_THRESHOLD`
  - **Learned** — `current_streak ≥ STREAK_LEARN_THRESHOLD`
- Learned words are excluded from *Balanced* and *Struggling* quiz pools (with a fallback to all words if every word is learned), and never selected for *New words* focus.
- The streak is displayed as a column in the vocabulary table, with a ★ once a word is learned.
- Status category pills with icons are shown throughout the app (sparkles = New, exclamation = Struggling, trending-up = Learning, trophy = Learned).

## 13. Word Categories

- Every vocabulary word can have zero or more user-defined categories (stored as `TEXT[]` in the database).
- Categories are lowercase free-form tags assigned via a tag input component (Enter or comma to commit, Backspace to remove).
- Categories can be assigned when:
  - Adding a single word (tag input below the Notes field)
  - Adding multiple words in bulk (categories applied to all words in the batch)
  - Importing a word package (the package's `category` field is applied automatically)
- When a word already exists in the vocabulary and a category is specified (bulk or package import), the category is **merged** into the existing word's categories rather than skipping the word entirely.
- The vocabulary table shows categories as teal pills in view mode and a tag input in edit mode.
- The vocabulary list can be filtered by any category via a dropdown (shown only when categories exist).
- The `PATCH /api/tutors/{id}/vocabulary/{word_id}/categories` endpoint merges new categories into a word's existing set.

## 14. Admin

- An admin-only page is available at `/admin`, protected exclusively by the backend. The `ADMIN_EMAIL` environment variable on the server determines which account has access.
- The frontend requires only that the user is logged in to navigate to `/admin`. No admin identity is stored or exposed client-side.
- The backend `get_current_admin` dependency verifies the JWT email server-side and returns HTTP 403 if it does not match `ADMIN_EMAIL`. The frontend catches the 403 and redirects non-admin users silently to `/tutors`.
- The admin page displays a table of all registered users with columns: Email, Joined, Languages, Words, Sessions, plus a totals row.
- Data is fetched via `GET /api/admin/users`, which uses the Supabase service role auth API (`supabase.auth.admin.list_users()`) plus aggregated counts from the `language_tutors`, `vocabulary`, and `quiz_sessions` tables.
- Users are sorted by most recently registered first.

## 11. LLM Provider

- The app works with any LLM provider (OpenAI, Anthropic, Ollama, LMStudio, etc.) using LiteLLM as the abstraction layer.
- Configuration is done via environment variables: `LLM_MODEL`, `LLM_API_KEY`, `LLM_API_BASE`.

## 12. Data Storage

- All vocabulary, quiz sessions, and tutor data are stored in Supabase (PostgreSQL).
- Sentence structure templates remain file-based per language.
- Active quiz sessions are held in memory on the backend and persisted to Supabase when the session ends.
- Supabase service role key is used by the backend (bypasses RLS); the frontend uses the anon key only for authentication.
