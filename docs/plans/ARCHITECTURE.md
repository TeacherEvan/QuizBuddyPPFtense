# Target Architecture: QuizBuddyPPFtense Feature Expansion

## Overview
Upgrades the presentation layer, expands pedagogical content, hardens state against edge-case corruption, and adds interactive Easter eggs while preserving zero external network dependencies and clean ES-module architecture.

## Areas Being Edited
| Area | File | Purpose |
| :--- | :--- | :--- |
| Data Layer | `QuizBuddyPPFtense/js/data.js` | Expand questions to 90 items (40/30/20) |
| State Layer | `QuizBuddyPPFtense/js/state.js` | SecurityError guard, integer type checking, reset persistence |
| Orchestration | `QuizBuddyPPFtense/js/app.js` | Reset-scores re-render, AbortController event listener management, Easter eggs |
| DOM Structure | `QuizBuddyPPFtense/index.html` | Mount `.game__burst` particle element |
| Presentation | `QuizBuddyPPFtense/css/style.css` | Chrono-Atelier Neo-Glass theme, tactile keycaps, streak aura tiers |
| Test Suites | `js/*.test.js` | Expanded assertion matrix (90 questions, error handling, reset flows) |

## Data & Control Flow
1. **Startup:** `init()` loads persisted state safely inside `try/catch`. If state has valid in-progress index `< questions.length`, enters game; otherwise defaults to level select/welcome modal.
2. **Gameplay:** Answering triggers streak increment, feedback, and schedules advance. If answered question is final question, sets `progress = 0` to prevent reload traps.
3. **Reset:** Clicking reset scores cancels pending timer, resets in-memory & stored scores, re-shuffles current level, and re-renders question #1.
4. **Easter Eggs:**
   - 5 clicks on `.modal__footer` unlocks Teacher Evan's Honor Roll quote.
   - Typing `tense` or `88mph` toggles chrono-warp effect and special message.
   - Hitting streaks 7, 10, or score 42 awards celebratory title in feedback/HUD.
