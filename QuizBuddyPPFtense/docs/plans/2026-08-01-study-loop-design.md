# Design: Study-Loop Improvements (Persist Progress, Shuffle, Replay)

**Repo:** `QuizBuddyPPFtense` (vanilla ES-modules quiz game)
**Date:** 2026-08-01
**Status:** Approved (proceed to plan)

## Problem

Three gaps hurt the app as a real study tool:

1. **No progress persistence.** `loadScores()` (state.js:45) restores only
   scores + bestStreak. `currentIndex` resets to 0 on every reload, so a
   refresh 12 questions into a 30-question level throws the learner back to Q1.
2. **Fixed order.** `getQuestionsForCurrentLevel()` (app.js:18) returns the raw
   array; options render in fixed position (app.js:93). Learners memorize
   positions, not tenses.
3. **No replay / loop.** `renderQuestion()` (app.js:77) disables answers on level
   completion with "pick another level". No Practice-Again path exists.

## Goals

- Resume a level at the exact question the learner left off (per level).
- Randomize question order and option order each time a level starts.
- Offer a Replay button on the completion screen that re-shuffles and restarts.

## Non-goals (YAGNI)

- No missed-questions review mode, keyboard shortcuts, PWA (separate recs).
- No i18n, no backend.

## Design

### State (state.js)

Add a `progress` map persisted alongside scores:

```
progress: { easy: <index>, medium: <index>, advance: <index> }
```

- `defaultProgress = { easy:0, medium:0, advance:0 }`
- `loadScores()` also reads + writes `progress[level]`.
- New export `setProgress(level, index)` → writes `state.progress[level]`, persists.
- `setLevel(level)` (explicit user selection) starts the level FRESH from index 0
  and zeroes `progress[level]`. Resume-on-reload is handled by `loadScores()`
  (see below), so picking a level always re-practices from the top.
- `resetScores()` resets progress to 0 for all levels too.
- `safeParse` gains `progress` validation (numeric per level, clamped ≥ 0) and
  also restores `currentLevel` so a reload resumes the exact in-progress level.
- `loadScores()` sets `currentIndex = progress[currentLevel]` — this is the
  ONLY resume path (page reload), driven by `init()` on boot.

### Shuffle (app.js)

- On `start-game` / `setLevel`, compute a shuffled question list for the level
  and a per-question shuffled option order. Stored in module scope:
  `let activeQuestions = []` and `let activeOptionOrder = {}` (questionIndex → [0,1,2] perm).
- `getQuestionsForCurrentLevel()` returns `activeQuestions`.
- `renderQuestion()` applies `activeOptionOrder[state.currentIndex]` to map the
  3 fixed buttons to the shuffled options, so option text differs each play and
  correct stays detectable.
- Use a seeded-optional `shuffle(array)` (Fisher–Yates). Default Math.random;
  injectable rng for tests.

### Replay (app.js + index.html)

- On completion branch of `renderQuestion()`, reveal a `#replay-btn`
  (already in DOM, hidden by default) instead of only disabling answers.
- `#replay-btn` click → re-shuffle same level, `setLevel(currentLevel)`,
  `showGame()`.
- Completion message stays; replay button replaces the dead-end.

## Test strategy (TDD — write failing tests first)

- state.test.js: persist + resume progress; setProgress clamps; resetScores
  zeroes progress; safeParse progress validation.
- app.test.js: shuffle changes order across two level starts; replay button
  re-shuffles and restarts; resume shows correct starting question after reload
  (simulate loadScores with stored progress).
- data.test.js: unchanged (must stay green).

## Risks

- Shuffling must keep `correct ∈ options` (guaranteed by permuting indexes).
- Existing focus/timer tests answer by text, so shuffle-safe. Verify green.

## Acceptance

- `npm test`, `npm run lint`, `npm run format -- --check` all pass.
- Manual: start easy, answer 3, reload → resumes at Q4. Start medium twice →
  different order. Completion → Replay restarts same level.
