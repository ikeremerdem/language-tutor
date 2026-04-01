**Language Tutor Application Requirements**

The application helps users learn a target language from English. The target language is configurable (default: Greek) and the app is designed to serve one language at a time. All vocabulary, quizzes, and AI interactions are between English and the configured target language.

1. **Vocabulary Recording:** I should be able to record the words I learn. These words can be verbs, nouns, adjectives, etc. I should be able to enter a word in English and it should store it along with its type, the English word, its target language translation, and a notes field. Notes are used for grammar-specific information (e.g. article and gender for nouns, conjugation type for verbs, irregularities). Each English word can only be added once — duplicates are rejected.

2. **Word Lookup:** When adding a word, I should only need to enter the English word. The app should automatically look up the target language translation, word type, and notes using an LLM. I can review and edit the result before saving. If the word already exists in my vocabulary, a warning is shown immediately on lookup.

3. **Vocabulary List:** The vocabulary list should support filtering by text search (English or target language) and by word type, with pagination (20 words per page).

4. **Word Quiz:** It should have a word quiz. I should be able to select the source language (English or target language), then it would provide me a random word from my own vocabulary. I would be able to type the answer in the other language. It would state if it is right or wrong, display the correct answer along with the vocabulary notes, and then move on. At the end, it should give me statistics on how well I did in the session.

5. **Sentence Quiz:** The system should generate simple sentences using ONLY the words in my vocabulary, either in English or in the target language. I should be able to type in the translated version as an answer. It should check my answer semantically (handling word order, accent, and equivalent synonyms) and display the correct answer. At the end of the session it should display statistics.

6. **Dashboard:** It should have a dashboard with statistics: number of sessions, frequency of sessions per week, score trends, vocabulary count, most difficult words, etc.

7. **Web-based, local storage:** The app should be web-based. Initially it works with CSV files stored locally. It should be designed to migrate easily to a database later.

8. **LLM Provider:** The app should be configurable to work with any LLM provider (OpenAI, Anthropic, Ollama, LMStudio, etc.) using LiteLLM as the abstraction layer. Configuration is done via environment variables (`LLM_MODEL`, `LLM_API_KEY`, `LLM_API_BASE`).

9. **Target Language Configuration:** The target language is set via the `TARGET_LANGUAGE` environment variable (default: `Greek`). Changing it updates all LLM prompts, UI labels, and quiz direction labels automatically — no code changes required.
