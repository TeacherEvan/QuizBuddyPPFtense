# Plan: Study-Loop Improvements — 2026-08-01

Build order (TDD — test first, watch fail, implement, watch pass, commit per task).

## Task 1 — Persist + resume progress in state.js

**Test (state.test.js, NEW, failing first):**

- `loadScores` restores `progress[level]` from storage.
- `setProgress(level, idx)` writes + persists; clamped ≥ 0.
- `resetScores` zeroes `progress` for all levels.
- `safeParse` returns default progress on malformed input.

**Impl (state.js):**

- Add `defaultProgress`, `state.progress`.
- Extend `safeParse` to validate `progress` (numeric per level).
- Extend `loadScores`/`saveScores` payload to include `progress`.
- Add `setProgress` export.
- `setLevel` sets `currentIndex = state.progress[level]`.

Commit: `feat(state): persist per-level progress + resume`

## Task 2 — Shuffle questions + options in app.js

**Test (app.test.js, NEW, failing first):**

- Starting the same level twice yields different question order (inject rng).
- `renderQuestion` renders options in shuffled order; correct still matches.
- Completion: replay button appears; click re-shuffles + restarts.

**Impl (app.js):**

- `shuffle(arr, rng)` Fisher–Yates (rng injectable, default Math.random).
- Module `activeQuestions`, `activeOptionOrder`.
- `getQuestionsForCurrentLevel` returns `activeQuestions`.
- On `setLevel`/game start: shuffle questions, compute per-question option perm.
- `renderQuestion` maps 3 buttons via `activeOptionOrder[index]`.
- `handleAnswer` compares against original `question.correct` (position-independent).

Commit: `feat(app): shuffle question + option order`

## Task 3 — Replay on completion

**Impl (index.html + app.js):**

- Add hidden `#replay-btn` in completion UI.
- `renderQuestion` completion branch reveals it.
- `#replay-btn` handler: re-shuffle current level, `setLevel`, `showGame`.

Commit: `feat(app): replay button on level complete`

## Task 4 — Verify full suite + lint + format

- `npm test` (12 existing + new must pass), `npm run lint`, `npm run format -- --check`.
- Manual sanity notes in design doc acceptance.

Commit: `chore: green tests after study-loop features`

## Execution mode

Subagent-driven is overkill for 3 small, well-understood vanilla-JS modules.
Implement directly in this session (parent), per superpowers subagent
mitigation (b): mechanical, low-risk, single-file changes. TDD still mandatory.
