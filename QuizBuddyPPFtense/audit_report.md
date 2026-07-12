# Audit Report - QuizBuddy Tense Trainer (QuizBuddyPPFtense)

> Regenerated 2026-07-12 by code-review skill. The previous report was STALE:
> it claimed "no tests configured" and "no linter", and listed wrong line counts
> (data.js 73 → now 376, app.js 168 → now 196). Those claims were false — the
> project has vitest/eslint/prettier and passing tests. This run re-ran all
> baselines from scratch.

## 1. Scope

- **Target**: Static client-side tense-trainer game (vanilla ES modules, no build step).
- **Entry point**: `index.html` → `<script type="module" src="js/app.js">`.
- **Not a git repo** — reviewed working tree as-is.

## 2. Static Inventory (current, verified)

| File             | Lines | Role                                               |
| ---------------- | ----- | -------------------------------------------------- |
| index.html       | 75    | Markup, element IDs consumed by app.js             |
| css/style.css    | 338   | Styling (not reviewed for logic)                   |
| js/app.js        | 196   | Bootstrap, DOM wiring, event handlers, HUD/render  |
| js/state.js      | 140   | State module (singleton), localStorage persistence |
| js/data.js       | 376   | QUESTIONS data (easy 30 / medium 20 / advance 10)  |
| js/canvas.js     | 253   | Boids background animation                         |
| js/state.test.js | 55    | Unit tests for state.js (4 tests)                  |
| js/app.test.js   | 42    | DOM integration test for app.js (1 test)           |
| eslint.config.js | 22    | ESLint flat config (recommended + project rules)   |
| vitest.config.js | 8     | jsdom env, globals on                              |
| package.json     | 20    | scripts: test/lint/format; devDeps only            |

**Total source lines**: ~1,078 (excl. tests/config).

## 3. Dependency Graph

```
index.html
 ├── css/style.css
 └── js/app.js  (module)
      ├── js/data.js      (QUESTIONS)
      ├── js/state.js     (state singleton + localStorage)
      └── js/canvas.js    (Boids animation; browser-only APIs)
```

- **Runtime deps**: none (zero `dependencies`).
- **External/storage**: browser `localStorage` (key `quizbuddy_scores_v1`), DOM, Canvas 2D, `requestAnimationFrame`.
- **Dev tooling**: vitest, eslint, prettier, jsdom.

## 4. Test Coverage Baseline (current)

- **Test runner**: vitest v3.2.6, jsdom environment.
- **Test files**: 2 (`state.test.js`, `app.test.js`).
- **Test count**: 5. **Pass rate**: 5/5 (100%).
- **Result**: `vitest run` → "Test Files 2 passed (2) / Tests 5 passed (5)".

### Coverage gaps (see review_findings.md)

- `js/data.js`: NO test guarding question-data integrity (shape, `correct ∈ options`, per-level counts).
- `js/canvas.js`: NO test. Boids math + `initCanvas` ctx-missing guard are entirely unverified.
- `js/app.js`: 1 integration test (double-submit guard) only. No coverage for correct/wrong feedback, level-complete message, change-level, reset-scores, HUD values.

## 5. Lint / Format Baseline (current)

- `eslint .` → **0 errors** (clean).
- `prettier --check .` → **All matched files use Prettier code style!** (clean).
- No `tsc` (plain JS, no type layer).
- One benign stderr line during `app.test.js`: jsdom `Not implemented: HTMLCanvasElement.prototype.getContext` — caught safely because `initCanvas` returns early when `ctx` is falsy. Not a failure.

## 6. TODOs / FIXMEs

- None found in source.
