# Codebase State: QuizBuddyPPFtense Baseline

## Metadata
- **Repository:** QuizBuddyPPFtense
- **Branch:** main
- **Commit:** e77379623f441d960d852f3180dc79d11804fbb8
- **Runtime:** Node.js v26.8.2, Vitest 5.0.1, ESLint 8.57.1

## Baseline Files & Metrics
- `QuizBuddyPPFtense/js/data.js` (60 questions: 30 easy, 20 medium, 10 advance)
- `QuizBuddyPPFtense/js/state.js` (State management + `localStorage` persistence)
- `QuizBuddyPPFtense/js/app.js` (DOM wiring, Fisher-Yates shuffle, timer management)
- `QuizBuddyPPFtense/index.html` (Application HTML structure)
- `QuizBuddyPPFtense/css/style.css` (Visual styling and animations)
- `QuizBuddyPPFtense/js/data.test.js` (5 tests passing)
- `QuizBuddyPPFtense/js/state.test.js` (8 tests passing)
- `QuizBuddyPPFtense/js/app.test.js` (6 tests passing)

## Known Issues from Surgical Audit
1. `P0-1`: Uncaught `SecurityError` in `localStorage.getItem()` crashes `init()`.
2. `P0-1b`: `safeParse` and `setProgress` accept `NaN`/`Infinity`.
3. `P1-1`: `#reset-scores-btn` causes answer button soft-lock and split-brain question grading.
4. `P1-2`: Out-of-bounds progress persists on level completion, trapping reload on completion screen.
5. `P2-1`: Orphaned `.game__burst` CSS selector without corresponding HTML element.
6. `P2-2`: Non-idempotent event registration in `setupEvents()`.
