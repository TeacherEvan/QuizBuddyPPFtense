# Codebase State: QuizBuddyPPFtense (Next-Gen Expansion Baseline)

## Repository Metadata
- **Branch:** `main`
- **Tech Stack:** Vanilla JavaScript (ES2022 Modules), HTML5, CSS3 Neo-Glass System, Web Audio API, Vitest 5.x, JSDOM, ESLint 9.x.
- **Test Baseline:** 4 test files, 33/33 passing tests.
- **Git HEAD:** Clean working tree.

## Key Files
- `QuizBuddyPPFtense/index.html`: Entrypoint markup, dialog modals, game card, speed run indicators.
- `QuizBuddyPPFtense/css/style.css`: Neo-glass theme, streak aura animations, tactile buttons, responsive grid.
- `QuizBuddyPPFtense/js/data.js`: 90 vetted tense questions categorized by difficulty (`easy`: 40, `medium`: 30, `advance`: 20).
- `QuizBuddyPPFtense/js/state.js`: Resilient storage state with `isNonNegInt` sanitization, level progress, personal bests, and speed run state.
- `QuizBuddyPPFtense/js/app.js`: Main event orchestrator with `AbortController`, speed run timer loop, and Easter eggs.
- `QuizBuddyPPFtense/js/audio.js`: Zero-dependency Web Audio procedural sound synthesizer.

## Initial Risks & Considerations
- Retain full backward compatibility with stored `localStorage` schemas so existing scores and best streaks are never erased or corrupted.
- Maintain zero external network dependencies so offline gameplay functions seamlessly.
- Audio synthesis must handle browser autoplay policy gracefully without blocking or throwing unhandled rejections.
