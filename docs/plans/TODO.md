# TODO: Next-Gen Pedagogical & Experience Overhaul

- [x] **OBJ-021**: Add grammatical `explanation` and `tenseCategory` (past, present, future, perfect, continuous) to questions in `QuizBuddyPPFtense/js/data.js` and export category filters (AC-001).
- [x] **OBJ-022**: Add unit tests in `QuizBuddyPPFtense/js/data.test.js` asserting question schema integrity with explanations and category helper queries (AC-001).
- [x] **OBJ-023**: Update `QuizBuddyPPFtense/js/state.js` to support `mistakes: []`, `activeCategoryFilter`, `highContrast: boolean`, `soundTheme: 'neo'|'8bit'`, and `volume: number` with full serialization and defensive `safeParse` (AC-002, AC-007, AC-008).
- [x] **OBJ-024**: Add unit tests in `QuizBuddyPPFtense/js/state.test.js` covering mistake tracking, mistake clearance on correct resolution, category filter, and theme persistence (AC-002, AC-007, AC-008).
- [x] **OBJ-025**: Upgrade `QuizBuddyPPFtense/js/audio.js` with sound themes ('neo' harmonic vs '8bit' square chiptune arpeggios), volume gain node scaling, and haptic vibration trigger (AC-008).
- [x] **OBJ-026**: Add unit tests in `QuizBuddyPPFtense/js/audio.test.js` verifying sound themes, volume setter, and haptic feedback safety (AC-008).
- [x] **OBJ-027**: Enhance `QuizBuddyPPFtense/index.html` with Tense Category selector buttons, "Review Mistakes" button with counter badge, High Contrast toggle, and PWA manifest link (AC-003, AC-005, AC-007, AC-009).
- [x] **OBJ-028**: Create `QuizBuddyPPFtense/manifest.webmanifest` and Service Worker `QuizBuddyPPFtense/sw.js` for offline PWA capabilities (AC-009).
- [x] **OBJ-029**: Add explanation card rendering and tense badge display inside feedback container in `QuizBuddyPPFtense/js/app.js` (AC-004).
- [x] **OBJ-030**: Wire keyboard shortcuts (`1`, `2`, `3`, `a`, `b`, `c`, `Enter`, `Space`) into `QuizBuddyPPFtense/js/app.js` for hands-free answering (AC-006).
- [x] **OBJ-031**: Wire "Review Mistakes" mode and tense category filtering workflows into `QuizBuddyPPFtense/js/app.js` (AC-003, AC-005).
- [x] **OBJ-032**: Update `QuizBuddyPPFtense/css/style.css` with High Contrast theme classes, grammar explanation pill typography, mistake badge, and category filter button chips (AC-004, AC-007, AC-008).
- [x] **OBJ-033**: Add comprehensive integration tests in `QuizBuddyPPFtense/js/app.test.js` covering keyboard shortcuts, high contrast toggle, category filtering, and review mistakes workflow (AC-003, AC-004, AC-005, AC-006, AC-007).
- [x] **OBJ-034**: Run full Vitest suite and ESLint to verify 100% green gates, zero errors, and clean linting (AC-010).
