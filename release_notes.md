# Release Notes

### 2026-04-04
- **Admin page** — Password-free `/admin` page protected server-side by `ADMIN_EMAIL`. Admin nav link is shown only to the admin user, detected via a backend check (no email exposed in the frontend bundle).
- **Empty vocabulary call to action** — Dashboard shows a banner with a direct link to the Load Package tab when the user has no words yet.
- **Disclaimer footer** — Pet project disclaimer by Kerem Erdem with contact email `languagetutor@kaloma.ai` and "Powered by kaloma.ai" added to all pages.
- **Vocabulary sorting** — Sort dropdown with 10 options: Newest/Oldest, A→Z/Z→A, Most/Least asked, Highest/Lowest accuracy, Highest/Lowest streak. Default is newest first.
- **Reverse word lookup** — Enter a target language word and click "← Lookup" to auto-fill English, word type, and notes.
- **Bulk target language input** — Direction toggle in the bulk word form to paste words in the target language instead of English.
- **Word categories** — Words can be tagged with free-form categories. Assignable on single add, bulk add, and package import. Duplicate words get categories merged. Filterable via dropdown on the vocabulary page.
- **Italian and French** — Added as supported languages alongside Greek, German, and Spanish.
- **Streak mechanism** — Words track a consecutive correct-answer streak. Words reaching the threshold are marked Learned and removed from quiz pools.
