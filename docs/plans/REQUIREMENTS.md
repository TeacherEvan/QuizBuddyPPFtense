# Requirements: QuizBuddyPPFtense Next-Gen Pedagogical & Experience Overhaul

## Overview
Implement the comprehensive user-approved feature expansions across 5 pillars:
1. **Pedagogical Explanations & Review System:**
   - Add educational tense explanations to questions so every sentence teaches *why* the answer is correct (identifying signal words, grammatical aspect: Simple vs Continuous vs Perfect vs Perfect Continuous).
   - Display tense badges and rich explanations on answer feedback.
   - Record incorrect answers into an "Error Log" and provide a "Review Mistakes" mode that allows users to review and retake only the questions they missed.
2. **Specialized Tense Focus Mode:**
   - Allow filtering/practicing by specific grammatical category: Past, Present, Future, or Perfect/Continuous focus, alongside existing difficulty levels.
3. **Accessibility (a11y) & Tactile Polish:**
   - Keyboard navigation shortcuts: numbers `1`, `2`, `3` (and `A`, `B`, `C`) for choosing answer options; `Space` / `Enter` for next/replay actions.
   - High contrast mode toggle for accessibility.
   - Mobile haptic vibration feedback via `navigator.vibrate` (with fallback).
4. **Offline PWA & Audio Evolution:**
   - Progressive Web App support: `manifest.webmanifest`, service worker (`sw.js`) enabling offline tense practice anywhere.
   - Sound system upgrade in `audio.js`: volume control, sound theme presets (Neo-Acoustic vs 8-Bit Chiptune).
5. **Architectural Hardening & Test Verification:**
   - 100% test coverage over new state routines, data schema backward compatibility, audio theme synth, and app interactivity.
   - Zero lint errors, fully responsive design.

## Acceptance Criteria Table
| AC ID | Requirement | Validation Method |
| :--- | :--- | :--- |
| **AC-001** | `js/data.js` questions support `explanation` and `tenseCategory` (past/present/future/etc.) with full fallback for legacy questions | `js/data.test.js` schema validation |
| **AC-002** | Wrong answers are tracked in state (`mistakes: []`) with persistence in `localStorage` | `js/state.test.js` mistake tracking tests |
| **AC-003** | User can enter "Review Mistakes" mode to practice only missed questions; cleared upon correct answer | `js/app.test.js` interactive test |
| **AC-004** | Tense explanations and badges render during answer feedback | `js/app.test.js` DOM check |
| **AC-005** | Category/Tense focus filtering allows practicing questions matching chosen tense category | `js/app.test.js` & `js/state.test.js` |
| **AC-006** | Keyboard shortcuts (`1`, `2`, `3`, `a`, `b`, `c`, `Enter`) select options and advance | `js/app.test.js` keydown simulation |
| **AC-007** | High contrast mode toggle persists in state and applies `.theme-high-contrast` | `js/app.test.js` theme test |
| **AC-008** | Audio engine in `js/audio.js` supports volume adjustment and theme switching ('neo' / '8bit') | `js/audio.test.js` |
| **AC-009** | PWA manifest (`manifest.webmanifest`) and Service Worker (`sw.js`) present with offline caching | File presence & syntax check |
| **AC-010** | All existing and new tests pass (100% green) and ESLint passes with 0 errors | `npm test` & `npm run lint` |
