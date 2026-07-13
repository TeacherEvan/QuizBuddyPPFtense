# QuizBuddy Tense Trainer

A vanilla JavaScript (ES Modules) tense recognition game for English learners. Practice past, present, and future tense forms across three difficulty levels.

**Live Demo:** https://quiz-buddy-pp-ftense.vercel.app/

---

## Features

| Feature            | Description                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Three Levels**   | Easy (simple past/present/future), Medium (perfect/progressive), Advance (perfect progressive + conditionals) |
| **60 Questions**   | 30 Easy / 20 Medium / 10 Advance — no duplicates per level                                                    |
| **Streak Scoring** | +1 point per correct answer; +1 bonus every 3rd correct in a row                                              |
| **Persistence**    | Scores & best streak saved to `localStorage` (survives browser close)                                         |
| **Accessibility**  | ARIA labels, live regions, focus management, keyboard navigable                                               |
| **Responsive**     | Stacks answer buttons vertically on mobile (< 540px)                                                          |
| **Zero Build**     | Pure ES modules — deploy static files anywhere                                                                |

---

## Quick Start

```bash
# Clone and enter project
cd QuizBuddyPPFtense

# Install dev dependencies (for lint/test/format)
npm ci

# Run tests
npm test

# Lint
npm run lint

# Format check
npm run format -- --check

# Serve locally (any static server)
npx serve .
# or
python3 -m http.server 8080
```

Open `http://localhost:8080` in a browser.

---

## Project Structure

```
QuizBuddyPPFtense/
├── index.html          # Entry point — loads js/app.js as ES module
├── css/
│   └── style.css       # All styling (CSS custom properties, animations)
├── js/
│   ├── app.js          # UI, event wiring, render loop, timer management
│   ├── state.js        # Mutable state + localStorage persistence
│   ├── data.js         # 60 question objects (level, sentence, options, correct)
│   ├── app.test.js     # Integration tests (jsdom + vitest + fake timers)
│   ├── state.test.js   # Unit tests for state logic
│   └── data.test.js    # Data integrity tests (shape, uniqueness, counts)
├── package.json        # Scripts + dev deps only (vitest, eslint, prettier)
├── eslint.config.js    # Flat ESLint config (ES2024, strict)
├── vitest.config.js    # jsdom environment, globals
├── .prettierrc         # Print width 100, single quotes, no semi
└── .vercel/project.json# Vercel project link (auto-deploys main branch)
```

---

## Architecture

```
index.html
  └── js/app.js (entry)
        ├── js/state.js   ← single mutable state singleton
        │     └── localStorage (optional)
        ├── js/data.js    ← immutable QUESTIONS array
        └── css/style.css
```

- **No framework** — vanilla ES modules, `type="module"` in HTML
- **State** — single `state` object in `state.js` module scope; exposed via getters/setters
- **Persistence** — `localStorage` key `quizbuddy_scores_v1`; graceful degradation on quota/private-mode
- **Timers** — one `pendingAdvanceTimer` handle; cancelled on level change / reset to avoid stale callbacks

---

## Data Format (data.js)

Each question:

```js
{
  level: 'easy' | 'medium' | 'advance',
  sentence: 'I ___ to school every day.',
  options: ['walk', 'walked', 'will walk'],
  correct: 'walk'
}
```

Validation (via `data.test.js`):

- 60 total questions (30/20/10 split)
- Every question has 3 unique options
- `correct` is always one of the options
- No duplicate sentences within a level

---

## Scripts

| Command                     | Description                   |
| --------------------------- | ----------------------------- |
| `npm test`                  | Run all tests (vitest, jsdom) |
| `npm run test:watch`        | Watch mode                    |
| `npm run lint`              | ESLint flat config            |
| `npm run format`            | Prettier write                |
| `npm run format -- --check` | Prettier check (CI gate)      |

---

## Deployment

**Vercel (auto):** Push to `main` → auto-deploys via linked project `quiz-buddy-pp-ftense`.

**Manual static hosting:** Upload the folder contents (index.html, css/, js/) to any static host (Netlify, Cloudflare Pages, GitHub Pages, Apache, Nginx).

No build step required.

---

## Accessibility Checklist

- [x] Semantic HTML (`main`, `section`, `article`, `header`, `footer`)
- [x] ARIA roles: `dialog`, `group`, `alert` (via live region)
- [x] `aria-live="polite"` on game area for score/streak announcements
- [x] Focus management: start button → level buttons → answer buttons → change level
- [x] Color contrast (WCAG AA) via CSS custom properties
- [x] Reduced motion respected (animations are transform/opacity only)
- [x] Keyboard operable (all interactive elements are `<button>`)

---

## License

MIT — free for educational use.

**Credit:** Teacher Evan (Ewaldt Botha)
