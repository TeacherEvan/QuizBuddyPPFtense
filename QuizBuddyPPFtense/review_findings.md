# Review Findings - QuizBuddy Tense Trainer

Audit date: 2026-07-12. Scope: full source tree (QuizBuddyPPFtense).
Gates run this session: eslint (clean), prettier (clean), vitest (5/5 pass).

## Summary

The code is clean, well-separated, and free of functional bugs, security
vectors, or null-deref crashes. Findings are concentrated in (1) the stale
report that preceded this run, (2) test-coverage gaps, and (3) minor
consistency / a11y nits. No CRITICAL or HIGH correctness issues found.

## Findings

### F1 — STALE audit_report.md (was wrong, now regenerated) — HIGH (process)

The committed `audit_report.md` claimed "no tests configured" and "no linter",
and listed outdated line counts. Both claims were false (tests + eslint exist
and pass). Anyone trusting it would have started from wrong premises.
**Status**: Regenerated in this run with verified data. No further action.

### F2 — No data-integrity test for QUESTIONS — MEDIUM

`js/data.js` holds the entire game content (60 questions). Nothing verifies:

- every question has `sentence` (string), `options` (array len 3), `correct`
  (string), `tense` (string), `level` (one of easy/medium/advance);
- `correct` is actually one of `options`;
- per-level counts are as intended.
  A single bad edit to `data.js` (e.g. `correct` not in `options`) would ship a
  broken/unwinnable question with zero test signal.
  **Fix**: add `js/data.test.js`. (Done this run.)

### F3 — canvas.js has zero test coverage — MEDIUM

`initCanvas` ctx-missing guard and `Boid.move/applyRules` bounds math are
unverified. The only reason `app.test.js` stays green is that jsdom returns a
falsy `getContext` and `initCanvas` bails early — meaning the animation path
is never exercised in CI.
**Fix**: add `js/canvas.test.js` (ctx-missing guard + position-bounds smoke).
(Done this run.)

### F4 — app.js logic thinly tested — LOW

Only the double-submit guard is covered. Correct/wrong feedback text,
level-complete branch, change-level, reset-scores, and HUD values are
untested. Functional risk is low (logic is simple), but regression protection
is weak.
**Recommendation**: add targeted tests if content/UX changes are planned.

### F5 — `updateHud` uses un-cached `getQuestionsByLevel` — LOW (consistency)

`renderQuestion` uses the memoized `getQuestionsForCurrentLevel()`; `updateHud`
(lines 56) calls the raw `getQuestionsByLevel(state.currentLevel)` directly.
Both return identical results today, so no bug — but the two code paths can
diverge if filtering logic ever changes. Prefer the cached getter in both.

### F6 — Dead `#burst` element — LOW (style)

### F6 — `#burst` element appears dead but is CSS-wired — LOW (style, verified NON-defect)

`index.html` line 63 declares `<div id="burst" ...>`; no JS references it, BUT
the CSS rule `.game--correct .game__burst` (style.css:257) triggers the `burst`
keyframe animation whenever `gameCard` receives `.game--correct` — which
`handleAnswer` does on every correct answer. The element is functional via the
class toggle, not orphaned. **Conclusion: NOT a defect; leaving as-is.** If
visual confirmation is desired, open the game and answer one question correctly.

### F7 — Focus not moved on level-complete — LOW (a11y)

When a level is finished, `answerButtons` are disabled but focus is not
relocated (e.g. to `#change-level-btn`). Screen-reader / keyboard users can be
left stranded on a disabled control. Minor, since the change-level button is
visible.

### F8 — `safeParse` old-format path resets bestStreak — LOW (historical)

When parsing a legacy flat `{easy,medium,advance}` payload (pre-bestStreak),
`safeParse` returns `bestStreak: 0`. The app only ever writes the new
`{scores,bestStreak}` shape, so this only affects data written by an even
older build. Not a live bug; noted for completeness.

## Non-issues (checked, clean)

- DOM contract: all 18 `getElementById`/`querySelector` targets exist in index.html.
- Security: no network calls, no `innerHTML`/`eval`, all user-facing text set
  via `textContent`. No injection surface.
- `initCanvas` visibilitychange handling: hidden cancels the scheduled frame,
  visible starts exactly one loop — no stacked animation loops.
- localStorage: quota/disabled errors caught; `addPoint` won't throw.
- `getState` returns defensive copies; module singleton is safe for this SPA.

## Recommended next action (Phase 4)

Apply F2 + F3 test additions (done), then optionally F5 (cache getter
consistency), F6 (drop dead `#burst`), F7 (focus on complete). None are
blocking; the app is shippable as-is.
