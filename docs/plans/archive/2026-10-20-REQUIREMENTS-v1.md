# Requirements: QuizBuddyPPFtense Feature Expansion & Architectural Hardening

## Overview
Implement the planned feature additions and architectural hardening identified in the surgical audit:
1. +10 Extra sentences per difficulty level (Easy: 30->40, Medium: 20->30, Advance: 10->20, Total: 60->90 questions).
2. Appealing visual revamp following artistic frontend-engineering practices ("Chrono-Atelier Neo-Glass" design system with tactile keycaps, glowing sentence blank pill, aurora mesh backdrop, and dynamic streak aura).
3. Interactive Easter Eggs for users to discover (5x click on footer credit, secret keyboard code "tense"/"88mph", streak milestone ranks).
4. Core architectural fixes:
   - State hardening: `loadScores` graceful fallback on blocked storage / `SecurityError`, `safeParse` integer validation (`isNonNegInt`) preventing `NaN`/`Infinity` poisoning, clamped progress.
   - App orchestration: Reset scores re-renders question and prevents button soft-lock, level completion progress wrap, and `setupEvents` idempotency via `AbortController`.
   - Mount missing `.game__burst` DOM element in `index.html`.

## Acceptance Criteria Table
| AC ID | Requirement | Validation Method |
| :--- | :--- | :--- |
| **AC-001** | `js/data.js` contains 40 Easy, 30 Medium, 20 Advance questions (90 total) | `js/data.test.js` passes asserting exact lengths |
| **AC-002** | All 90 questions contain unique options, valid `correct` answer within options, non-empty sentence with `___` | `js/data.test.js` integrity assertions |
| **AC-003** | `js/state.js` handles `localStorage.getItem` throwing `SecurityError` or blocked storage gracefully | `js/state.test.js` mock throw test |
| **AC-004** | `js/state.js` `safeParse` & `setProgress` reject `NaN` and `Infinity` | `js/state.test.js` boundary tests |
| **AC-005** | `js/app.js` `#reset-scores-btn` re-renders active level cleanly without button soft-lock | `js/app.test.js` interactive test |
| **AC-006** | `js/app.js` wraps completed level progress so reloads do not get stuck on completion card | `js/app.test.js` reload test |
| **AC-007** | `index.html` has `.game__burst` mounted inside `#game-card` | DOM query test / inspection |
| **AC-008** | `css/style.css` provides modern artistic aesthetic: aurora backdrop, 3D tactile buttons, dynamic streak aura | Visual inspection and syntax validity |
| **AC-009** | 3 Easter eggs implemented (Teacher Evan credit 5x click, keyboard sequence, streak/score milestone) | Unit/integration tests & code inspection |
| **AC-010** | All existing and new tests pass (100% green) and ESLint passes with 0 errors | `npm test` & `npm run lint` exit code 0 |
