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
- Each entry stores: word type, English word, target language translation, and a notes field.
- Notes capture grammar-specific information (e.g. article and gender for nouns, conjugation type for verbs, irregularities).
- Each English word can only be added once per tutor — duplicates are rejected.

## 4. Word Lookup

- When adding a word, the user only needs to enter the English word. The app automatically looks up the target language translation, word type, and grammar notes via LLM.
- The user can review and edit the result before saving.
- If the word already exists in the vocabulary, a warning is shown immediately.

## 5. Multiple Word Add

- The vocabulary page offers a **Multiple** mode alongside the single-word form.
- The user pastes a list of English words or phrases (one per line) into a textarea.
- The app processes them sequentially: looks each up via LLM and adds it if not already present.
- Each word shows a live status: added (✓), skipped duplicate (–), or failed (✕).
- A summary is shown at the end (X added · Y skipped · Z failed).

## 5a. Word Packages

- The vocabulary page also offers a **Load Package** mode.
- Word packages are JSON files stored in `backend/data/packages/`, each with a name, description, and a list of English words.
- The package browser shows all available packages as cards with name, description, and word count.
- Selecting a package runs the same sequential LLM lookup and add process as Multiple mode.
- Packages are language-agnostic — the same package file works for all target languages.
- New packages can be added by dropping a JSON file into `backend/data/packages/` with the format: `{"name": "...", "description": "...", "words": [...]}`.
- Built-in packages: Common Verbs, Common Nouns, Food & Drink, Travel, Numbers & Time, Body & Health.

## 6. Vocabulary List

- The vocabulary list supports filtering by:
  - Text search (English or target language)
  - Word type (verb, noun, adjective, etc.)
  - Performance: All words / New (never asked) / Correct ≥ 80% / Correct < 80% / Learned (streak ≥ threshold)
- Words that have never been asked display a "new" pill instead of a count of 0.
- Pagination shows 20 words per page.
- Words can be edited inline or deleted.

## 7. Word Quiz

- The quiz setup screen offers:
  - **Translation direction** — a visual toggle button showing e.g. `English → Greek`; clicking it swaps the direction.
  - **Focus** — three pill options:
    - *Balanced*: weighted mix of all words (new words and mistakes get higher weight); learned words excluded
    - *New words*: only words never practiced, selected uniformly at random
    - *Mistakes*: only words answered incorrectly at least once, weighted toward higher error rates; learned words excluded
  - **Number of questions** — quick-pick buttons (5 / 10 / 20 / 50) plus a custom input.
- The setup screen also shows a Vocabulary Status summary (New / Correct ≥ 80% / Correct < 80% / Learned) and recent session history.
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
  - **Left**: Recent session history (last 10 sessions).
  - **Right**: Vocabulary Status table (New / Correct ≥ 80% / Correct < 80% / ★ Learned with counts and share %), followed by Top 10 most difficult words (lowest accuracy, sorted ascending).
- A "Reset Statistics" button that clears all session history without affecting vocabulary.

## 10. Streak & Learned Words

- Each vocabulary word tracks a `current_streak` counter (consecutive correct answers).
- A correct quiz answer increments the streak; a wrong answer resets it to 0.
- A configurable backend constant `STREAK_LEARN_THRESHOLD` (default 5) determines when a word is considered **learned**.
- Learned words (streak ≥ threshold) are deprioritised: excluded from *Balanced* and *Mistakes* quiz pools (with a fallback to all words if every word is learned), and never selected for *New words* focus.
- The streak is displayed as a column in the vocabulary table. A star (★) is shown once a word is learned.

## 11. LLM Provider

- The app works with any LLM provider (OpenAI, Anthropic, Ollama, LMStudio, etc.) using LiteLLM as the abstraction layer.
- Configuration is done via environment variables: `LLM_MODEL`, `LLM_API_KEY`, `LLM_API_BASE`.

## 12. Data Storage

- All vocabulary, quiz sessions, and tutor data are stored in Supabase (PostgreSQL).
- Sentence structure templates remain file-based per language.
- Active quiz sessions are held in memory on the backend and persisted to Supabase when the session ends.
- Supabase service role key is used by the backend (bypasses RLS); the frontend uses the anon key only for authentication.
