# Debrief: QuizBuddyPPFtense Plastic Surgery (Visual Overhaul)

## 1. Executive Summary

A precision visual pass over the QuizBuddy tense trainer, executed under the
**Plastic Surgery** model (Alignment Gate → Investigate → Plan → Implement →
Verify). The visual skin was rebuilt while the functional core stayed
immutable. Measured result: **visual health score 80 → 100**, **cumulative
layout shift 0.134 / 0.723 / 0.014 → ≈0.001** (desktop / mobile / small),
**axe-core WCAG 2.1 AA violations 0**, and the automated suite stays at
**45/45 green**.

> **⚠️ Correction 2026-10-21.** The original wording here claimed *"a
> pre-existing flaky test eliminated"*, and §8 claimed *"45/45, 10/10 runs
> green"*. **Neither held.** The D17 fix was incomplete: `afterEach` re-imported
> `./app.js` to reach `__teardown`, so the teardown could target a different
> module instance than the one under test, leaving its `DOMContentLoaded`
> listener registered. Each later dispatch fanned out to every accumulated
> instance and a stale instance answered the keyboard shortcut with its own
> question bank — a ~1-in-3 failure. The test file now captures the imported
> instance and tears down exactly that one. Verified: **10/10 green** on the
> locked toolchain (vitest 3.2.6 / jsdom 26.1.0) after the fix. See
> [`docs/audit/SURGICAL-AUDIT-2026-10-21.md`](../docs/audit/SURGICAL-AUDIT-2026-10-21.md).

## 2. Alignment Lock

| Axis | Verdict | Evidence |
| :--- | :--- | :--- |
| Mobile / Desktop | **Hybrid** | `manifest.webmanifest` (`display: standalone`), viewport meta, ≤540 px breakpoint, offline PWA |
| Private / Commercial | **Commercial (public release)** | *(2026-10-21: the "live Vercel deploy" is **not** currently reachable — every path on `quiz-buddy-pp-ftense.vercel.app` returns `404 NOT_FOUND`; see the audit report)* MIT licence, `localStorage` persistence, documented a11y contract |
| Adult / All audiences | **All audiences** | ESL grammar trainer for students (Teacher Evan credit) |

Workspace theme preserved: deep-space neon arcade. Rendering stack: vanilla ES
modules + hand-written CSS, zero build.

## 3. Defect Catalogue (pre-op)

| # | Defect | Location | Severity |
| :--- | :--- | :--- | :--- |
| D1 | `backdrop-filter: blur(18px)` over the 16 px frame budget | `css/style.css` | Medium |
| D2 | `transform: translateZ(0)` on resting buttons/cards (permanent VRAM) | `css/style.css` | Medium |
| D3 | No `prefers-reduced-motion` guard (README claimed compliance) | `css/style.css` | High |
| D4 | No `:focus-visible` styling anywhere | `css/style.css` | High |
| D5 | Hover affordances applied on touch devices (hover-sticking) | `css/style.css` | Medium |
| D6 | `body` filter animation (`warpPulse`) repainted the whole document every frame | `css/style.css` | High |
| D7 | Live counters reflowed the HUD on every question (CLS driver) | `css/style.css` | High |
| D8 | Grammar insight + feedback appearing resized the card (CLS driver) | `css/style.css` | High |
| D9 | Answer buttons reflowed when an option was longer (`min-width` + flex) | `css/style.css` | Medium |
| D10 | Panel width `min(740px, 94vw)` overflowed the mobile gutter | `css/style.css` | Medium |
| D11 | `transition: all` on the focus chips | `css/style.css` | Low |
| D12 | Answer-button keycap markup was dead (`textContent` wiped it) | `index.html` / `js/app.js` | Medium |
| D13 | Disabled answer buttons never dimmed (inline `opacity` beat `:disabled`) | `js/app.js` | Medium |
| D14 | No visible "correct answer" reveal after a response | `js/app.js` | Low |
| D15 | Manifest referenced icons that did not exist (PWA not installable) | `manifest.webmanifest` | High |
| D16 | `panel--hidden` was outranked by `.btn { display: inline-flex }` | `css/style.css` | High |
| D17 | Stale app instances leaked across Vitest cases (flaky keyboard test, ~40 % failure) | `js/app.js` / `js/app.test.js` | High |
| D18 | Tag row (tense badge + keyboard hint) wrapped on narrow viewports, resizing the card | `css/style.css` | High |
| D19 | Grammar-insight text shifted inside its reserved box whenever the insight length changed | `css/style.css` | Medium |
| D20 | Reservations were measured with one font — a wider system font broke them | `css/style.css` | High |
| D21 | Feedback copy was ~40 % longer than needed, forcing a taller reserved box | `js/app.js` | Low |

## 4. Implementation

### 4.1 Six-state tactile buttons
Default / hover / active / focus-visible / loading / disabled, expressed with
CSS custom properties per variant (`--edge-offset`, `--edge-color`,
`--rest-shadow`, `--hover-shadow`, `--press-shadow`, `--specular-alpha`).
Hover is gated behind `@media (hover: hover) and (pointer: fine)`; the glow is
an opacity-veiled `::after` instead of a `filter: brightness()` repaint; the
press state lands in 25 ms with an inverted inset shadow.

### 4.2 Depth ladder & speculars
Every raised surface gained a 1 px inset top-edge specular; panel blur reduced
18 px → 14 px (1 layer, ≤16 px budget); `contain: layout style` on panels and
`contain: layout paint` on the game card.

### 4.3 Zero-jitter telemetry
- `tabular-nums` on all readouts plus a `.tnum` utility class.
- Measured minimum widths for every HUD pill, so a counter can never resize
  its box.
- The speed-run timer keeps its slot reserved when idle.
- The game card is a flex column with a fixed height budget: the sentence,
  the grammar insight and the feedback each reserve the worst-case number of
  lines for the current breakpoint (measured, not guessed).
- The insight slot reserves its height but carries no chrome of its own — the
  visible card hugs the text, so the reserved area reads as card padding
  instead of an empty box, and the insight text never moves inside it.
- The answer row is a 3-column grid of equal columns with a reserved 2-line
  button height.
- The keyboard-shortcut hint is dropped on touch devices and below 420 px
  (there is no physical keyboard to shortcut with, and the hint used to wrap
  the tag row and resize the card).

### 4.4 Font-robustness (second pass)
Reservations are only as good as the metrics they were measured with, so the
layout was re-verified against 7 font stacks (system-ui, DejaVu Sans,
Liberation Sans, Noto Sans, Verdana, DejaVu Serif, monospace) at 6 viewport
widths (1280 / 700 / 540 / 390 / 360 / 320) — 42 combinations, each measured
across the idle → answered → advanced states. The first pass failed on
wrapping tag rows and on under-reserved insight boxes; after the fixes all
42 combinations are pixel-stable.

### 4.4 Motion & input
- `prefers-reduced-motion` collapses spatial motion while keeping the
  spinners/indicators.
- The Chrono Warp easter egg now animates an opacity/transform overlay
  instead of the `filter` on `<body>`.
- `touch-action: manipulation`, `user-select: none` and tap-highlight
  suppression on all controls.

### 4.5 Answer reveal & keycaps
- `data-key` + a CSS `::before` keycap renders the 1/2/3 shortcut hint without
  touching the button's `textContent` contract (the suite asserts on
  `textContent`).
- `aria-label` is kept in sync with the visible option so the decorative
  keycap never pollutes the accessible name.
- After a response the chosen option turns red and the correct option green
  (`btn--is-wrong` / `btn--is-correct`); the locked state uses a class instead
  of an inline `opacity`.

### 4.6 PWA completeness
`scripts/generate_icons.py` procedurally renders `icons/icon-{180,192,512}.png`
from the in-app palette; the manifest gains `scope`/`purpose`; the service
worker caches the icons (`quizbuddy-cache-v3`).

### 4.7 Test-infrastructure repair (D17)
`app.js` exposes `__teardown()` (mirroring the existing `__setRng` hook) which
aborts the `AbortController`, cancels the pending advance timer and detaches
the `DOMContentLoaded` listener. `app.test.js` calls it in `afterEach`.
Before: 4/10 runs failed. After: 10/10 runs green.

## 5. Files Changed

1. `QuizBuddyPPFtense/css/style.css` (visual skin, rewritten)
2. `QuizBuddyPPFtense/index.html` (keycap markup, utility classes, icon links)
3. `QuizBuddyPPFtense/js/app.js` (reveal classes, `aria-label`, teardown hook, HUD copy)
4. `QuizBuddyPPFtense/js/app.test.js` (teardown in `afterEach`)
5. `QuizBuddyPPFtense/manifest.webmanifest`
6. `QuizBuddyPPFtense/sw.js`
7. `QuizBuddyPPFtense/scripts/generate_icons.py` (new)
8. `QuizBuddyPPFtense/icons/icon-{180,192,512}.png` (new)
9. `QuizBuddyPPFtense/README.md` (accuracy + visual engineering notes)

## 6. Validation

| Gate | Before | After |
| :--- | :--- | :--- |
| `npm test` | 45 passed, ~40 % flaky runs | **45/45, 10/10 runs green** *(2026-10-21: the flake was **not** eliminated here and persisted at ~1-in-3 until the teardown was corrected; it is now genuinely fixed and 10/10 green on the locked toolchain — see the correction note in §1)* |
| `npm run lint` | clean | **clean** |
| Plastic Surgery preflight linter | 80/100, 7 defects | **100/100, 0 defects** |
| CLS (desktop / mobile / 320 px) | 0.134 / 0.723 / 0.014 | **0.0001 / 0.0009 / 0.0006** |
| axe-core WCAG 2.1 AA | not measured | **0 violations** (4 viewports) |
| Font × viewport stability | not measured | **42/42 combinations stable** |
| Horizontal overflow | panel exceeded the gutter | **none** (1280 / 390 / 320) |
| Console errors | — | **none** |
| Offline boot (service worker) | icons 404 | **cached, boots offline** |

## 7. Preserved Contracts (zero functional regression)

- Every `id`, `data-level`, `data-category`, `data-option`, `data-key`
  selector, `role` and `aria-*` attribute is unchanged.
- `js/state.js`, `js/data.js`, `js/audio.js` are untouched — no state, storage
  or audio contract moved.
- The `btn.textContent === question.correct` contract used by the test suite
  still holds; the keycap is a pseudo-element.
- The `localStorage` schema (`quizbuddy_scores_v1`) is unchanged, so existing
  scores survive.

## 8. Residual Risk

- The grammar-insight and feedback text lengths are variable; the reserved
  heights are sized from the current data set and re-verified against seven
  font stacks. Adding a much longer explanation would require re-measuring
  the reservations (the panel would grow by one line, not reflow).
- The rare 10-streak Easter-egg message is longer than a typical feedback
  line; at ≤360 px it adds a line to the reserved box.
- The insight card grows downward as the insight gets longer (by design); the
  reserved area absorbs it so nothing below moves.
