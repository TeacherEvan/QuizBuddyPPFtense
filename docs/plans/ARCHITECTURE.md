# Target Architecture: QuizBuddyPPFtense Next-Gen Expansion

## Overview
Extends QuizBuddyPPFtense into an educational PWA featuring contextual grammar feedback, targeted error remediation, category filtering, accessible keyboard control, and enhanced procedural audio themes.

## Areas Being Edited
| Area | File | Purpose |
| :--- | :--- | :--- |
| Data Layer | `QuizBuddyPPFtense/js/data.js` | Add `explanation` and `tenseCategory` to questions; export helper functions |
| State Layer | `QuizBuddyPPFtense/js/state.js` | Manage `mistakes`, `activeFilter`, `soundTheme`, `volume`, `highContrast` with persistence |
| Audio Engine | `QuizBuddyPPFtense/js/audio.js` | Add themes ('neo' vs '8bit'), volume scaling, chiptune arpeggios |
| Orchestration | `QuizBuddyPPFtense/js/app.js` | Wire shortcuts, mistake review mode, tense filter, feedback cards |
| PWA Service Worker | `QuizBuddyPPFtense/sw.js` | Offline asset caching and install lifecycle |
| Web Manifest | `QuizBuddyPPFtense/manifest.webmanifest` | PWA installation descriptor and standalone display metadata |
| Presentation | `QuizBuddyPPFtense/css/style.css` | High-contrast styles, explanation pill, review panel, volume UI |
| DOM Structure | `QuizBuddyPPFtense/index.html` | Register SW, manifest link, audio settings drawer, mistake review button |
| Test Suites | `QuizBuddyPPFtense/js/*.test.js` | Unit and integration coverage for all added modules |

## Data & Control Flow
1. **Answer & Explanation Flow:**
   - When a user answers, `handleAnswer()` checks correctness.
   - If incorrect, question id/content is recorded to `state.mistakes` and persisted to `localStorage`.
   - Feedback card renders the correct option alongside the pedagogical `explanation` (e.g. "Signal word *yesterday* indicates simple past").
2. **Review Mistakes Mode:**
   - If `state.mistakes.length > 0`, a "Review Mistakes (N)" button appears on the level selection and completion screens.
   - Clicking launches a targeted session containing only missed questions. Correctly answering removes the item from mistakes.
3. **Audio Themes & Synthesis:**
   - Audio state tracks theme (`neo` harmonic vs `8bit` square-wave chiptune) and volume (0.0 to 1.0).
   - Audio functions synthesize procedural waveforms dynamically without remote audio clips.
4. **Offline PWA:**
   - `sw.js` caches `index.html`, `css/style.css`, `js/*.js`, and `manifest.webmanifest`.
   - Operates completely offline with `Cache-First` / `Stale-While-Revalidate` strategy.
