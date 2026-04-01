# Filos — Language Tutor: Requirements

The application helps users learn a target language from English. It is a multi-user application where each user can create one or more Language Tutors, each dedicated to a specific language. All vocabulary, quizzes, and AI interactions are between English and the tutor's configured language.

---

## 1. Authentication & Multi-User

- Users register and sign in with email and password via Supabase Auth.
- All data is scoped per user — no user can access another user's tutors or vocabulary.
- Row Level Security (RLS) is enforced at the database level.

## 2. Language Tutors

- After signing in, a user lands on the **My Tutors** page listing their tutors.
- A user can create a Language Tutor by selecting a language (currently: Greek, German, Spanish).
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

## 5. Bulk Word Add

- The vocabulary page offers a **Bulk** mode alongside the single-word form.
- The user pastes a list of English words or phrases (one per line) into a textarea.
- The app processes them sequentially: looks each up via LLM and adds it if not already present.
- Each word shows a live status: added (✓), skipped duplicate (–), or failed (✕).
- A summary is shown at the end (X added · Y skipped · Z failed).

## 6. Vocabulary List

- The vocabulary list supports filtering by text search (English or target language) and by word type.
- Pagination shows 20 words per page.
- Words can be edited inline or deleted.

## 7. Word Quiz

- The user configures a quiz: direction (English → target or target → English) and number of questions.
- Questions are drawn randomly from the user's vocabulary, weighted toward words answered incorrectly in the past.
- After each answer, the result (correct/incorrect), the correct answer, and grammar notes are displayed.
- At the end of the session, a summary shows score, per-word results, and session statistics.

## 8. Sentence Quiz

- The system generates simple sentences using ONLY words in the user's vocabulary, in either direction.
- The user types the translated sentence as an answer.
- Answers are checked semantically using an LLM (handling word order, accents, and equivalent synonyms).
- At the end of the session, statistics are displayed.
- Sentence structure templates are stored per language in `backend/data/<Language>/sentence_structures.csv`.

## 9. Dashboard

- Displays: total vocabulary count, total sessions, total questions answered, average score, best score.
- Weekly activity chart showing questions answered per day.
- Recent session history.
- Top 10 most difficult words (lowest accuracy rate, minimum 3 attempts).
- A "Reset Statistics" button that clears all session history without affecting vocabulary.

## 10. LLM Provider

- The app works with any LLM provider (OpenAI, Anthropic, Ollama, LMStudio, etc.) using LiteLLM as the abstraction layer.
- Configuration is done via environment variables: `LLM_MODEL`, `LLM_API_KEY`, `LLM_API_BASE`.

## 11. Data Storage

- All vocabulary, quiz sessions, and tutor data are stored in Supabase (PostgreSQL).
- Sentence structure templates remain file-based per language.
- Active quiz sessions are held in memory on the backend and persisted to Supabase when the session ends.
- Supabase service role key is used by the backend (bypasses RLS); the frontend uses the anon key only for authentication.
