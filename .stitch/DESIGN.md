# Filos — Your Language Companion

> **Design System:** Filos — Your Language Companion
> **Stitch Project ID:** `12749142568416210858`
> **Design System Asset ID:** `assets/7e709dd218ae4b3b95fbb52d1223115d`

---

## Brand Identity

**App Name:** Filos (φίλος = "friend" in Greek — the name is fixed regardless of the configured language)

**Tagline:** Your [target language] companion (dynamic, driven by the `TARGET_LANGUAGE` config)

**Logo:** Φ (Phi) monogram inside a circle, deep sapphire `#004688`. Clean, modern, iconic.

**Wordmark:** `Filos` in Manrope Bold, sapphire `#004688`. Tagline `Your Greek companion` in terracotta `#C15A1A` italic below.

---

## Creative North Star: Mediterranean Premium

This design evokes the clarity of Mediterranean light, the warmth of terracotta walls, and the depth of the Aegean sea. Learning a language should feel like an immersive cultural journey — premium, inspiring, and deeply human. The interface feels like a high-end cultural magazine meets language app.

---

## Color Palette

| Token | Hex | Role |
|---|---|---|
| **Sapphire (Primary)** | `#004688` | Navigation, primary CTAs, key accents |
| **Terracotta (Accent)** | `#C15A1A` | Secondary CTAs, "Filos" wordmark, warm highlights |
| **Marble White (BG)** | `#F8F6F2` | Main canvas — warm off-white |
| **Aegean Midnight** | `#0A2540` | Hero sections, dark overlays, deep gradient end |
| **Surface White** | `#FFFFFF` | Cards, elevated surfaces |
| **Surface Warm** | `#F0EDE8` | Subtle sectioning, hover states |
| **Success** | `#1A7A4A` | Correct answers, positive feedback |
| **Error** | `#BA1A1A` | Incorrect answers, errors |
| **Text Primary** | `#171C1F` | Body text (never pure black) |
| **Text Muted** | `#727783` | Labels, secondary text |

### Rules
- **No borders for sectioning** — use tonal layering (white card on marble bg creates natural edge)
- **No pure black** — use `#171C1F` for text
- Hero backgrounds: gradient `#004688` → `#0A2540` with subtle geometric pattern at 6% opacity

---

## Typography

| Role | Font | Weight | Usage |
|---|---|---|---|
| Display | Manrope | 700–800 | Hero headings, page titles (3–4rem) |
| Headline | Manrope | 600–700 | Section headings, stat numbers (1.5–2rem) |
| Body | Inter | 400–500 | Paragraph text, descriptions |
| Label | Inter | 500–600 | ALL CAPS, 0.08em letter-spacing for category headers |
| UI | Inter | 400 | Nav links, buttons, inputs |

---

## Elevation & Depth

- **Tonal Layering:** White card (`#FFFFFF`) on marble (`#F8F6F2`) = "soft lift" without shadows
- **Ambient Shadows:** 24–40px blur, 4–6% opacity, with a hint of sapphire tint
- **Nav:** Glassmorphism — `backdrop-blur: 16px`, `92% white opacity`

---

## Components

### Navigation
Sticky glassmorphism header: Φ logomark + "Filos" wordmark left | page links center | streak badge right.

### Cards
- No borders — tonal background shift only
- `12px` border radius
- Soft ambient shadow when floating

### Buttons
- **Primary:** Sapphire `#004688` fill, white text, 12px radius
- **Accent:** Terracotta `#C15A1A` fill, white text
- **Ghost:** No background, sapphire text + underline or border

### Word Type Pills
- Verb: sapphire `#004688`
- Noun: green `#1A7A4A`
- Adjective: purple `#5B21B6`
- Phrase: terracotta `#C15A1A`

### Quiz Feedback
- **Correct:** `#E8F5EE` green container, green text, checkmark icon
- **Incorrect:** `#FDECEA` red container, red text, explanation below

### Progress Bars
- Track: `#F0EDE8` warm surface
- Fill: sapphire gradient, `border-radius: 9999px`

---

## Screens

| Screen | State | File | Stitch ID |
|---|---|---|---|
| Dashboard | — | `.stitch/designs/dashboard-screen.html` | `screens/1107b98a2a034925a46d011e1fa4789e` |
| Vocabulary Table | — | `.stitch/designs/vocabulary-screen.html` | `screens/c23c33c7322e481ea3ea4420f6d2f8af` |
| Quiz Setup | — | `.stitch/designs/quiz-screen.html` (top section) | `screens/90415ffd99a24bcfbd516a9b29e6e671` |
| Word Quiz | Active question | `.stitch/designs/quiz-screen.html` | `screens/3035377033a44663bfc1450442cac353` |
| Word Quiz | Answer result | `.stitch/designs/quiz-result-screen.html` | `screens/f4532aafbea040b8a2928076ad0dc994` |
| Session Summary | — | `.stitch/designs/session-summary-screen.html` | `screens/49802131de4242deb114978e5a030d30` |
| Sentence Quiz | Active question | `.stitch/designs/sentence-quiz-screen.html` | `screens/ca8dc4f2206d4e16a14a06bfbe53872b` |

---

## Do's and Don'ts

### Do
- Use breathing room — generous spacing (`2.75–3.5rem`) between major sections
- Ensure target language characters have consistent `line-height` with Latin to prevent "jumping" text
- Use intentional asymmetry in grids (e.g. wider activity card to break monotony)

### Don't
- Use `#000000` — always use `#171C1F`
- Use 1px solid borders for sectioning — use tonal shifts
- Use sharp corners — minimum `8px` radius on all interactive elements
