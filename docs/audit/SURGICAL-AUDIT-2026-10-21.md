# Surgical Audit Report — QuizBuddyPPFtense (2026-10-21)

**Auditor:** surgical-audit v2.1 (10-Principal-Engineer polyglot multi-pass)
**Scope:** `QuizBuddyPPFtense/` — 11 implementation files + 4 test files
**Effective LOC:** 2,378 implementation + 628 test + 1,233 markup/style
**Method:** static AST/complexity telemetry, 25 jsdom runtime probes, a real
Chromium (Playwright 1.63) + axe-core 4.13 browser pass, and `npm audit`.

| Verdict                    | Value                                                                                                                            |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| Deterministic Health Score | **0 / 100** (`D_raw = 178`, `P_test = 7.8`, `M_kill = 48%`)                                                                      |
| Vibe-Debt Risk             | **CRITICAL** — driven by **1 × P0 + 13 × P1**                                                                                    |
| Quality floor              | **HIGH** — axe-core 0 violations, CLS 0.00013, 45/45 green, lint clean, compositor-only CSS, 0 console errors                    |
| Zero-mutation              | Verified: Merkle `tree_integrity_sha256` `18bb07b4234670e…` identical pre/post; `git status` and HEAD unchanged during the audit |

> **Read the score correctly.** The health formula weights a P0 at −18 and a
> P3 at −1, so it is effectively a count of high-severity findings, not a
> verdict on craftsmanship. This is a well-built app with a badly maintained
> _assurance layer_. Restricting to P0+P1 alone scores 13/100 (HIGH); the
> remaining defect mass is nit-level. The headline is **"1 P0 + 13 P1 in an
> otherwise strong codebase"** — not "0% good".

---

## 1. Systemic root cause: the assurance layer was never executed

Every prior sign-off — `docs/audit/SECURITY.md` ("0 Critical, 0 High, 0 Medium,
0 Low"), `docs/audit/RISK.md` ("LOW / NEGLIGIBLE RISK"),
`docs/audit/TRACEABILITY.md` ("READY"), `runtime/events.jsonl`
(`FINAL_AUDIT_PASS`) — was produced by a process that **never opened a
browser**. The archived study-loop plan states it plainly:

> _LOW-1: No Playwright E2E suite (static app, manual `curl -I` only)._

and `docs/plans/2026-10-20-NextGen-Expansion-DEBRIEF.md` §10 was headed
**"Playwright"** while its body described **JSDOM**. The four browser-only
defects below (P0-01, P1-09, P1-10, P1-03) are structurally invisible to
jsdom — no layout engine, no service worker, no accessibility tree — _and_
invisible to axe-core, which reported **0 violations** on a page containing a
live accessibility trap.

**Two of the four "verified" gates in this repository were red or broken:**

| Gate                        | Claimed              | Actual                                                                              |
| :-------------------------- | :------------------- | :---------------------------------------------------------------------------------- |
| `npm test`                  | 45/45 green          | **10/45 pass** under the locked toolchain; flaky at ~1-in-3 under the installed one |
| `npm run format -- --check` | "format clean"       | **7 files fail**; `prettier` not even linked into `node_modules/.bin`               |
| `npm ci`                    | "dev deps only"      | installs fine, but `npm audit` → **2 critical, 6 high, 1 moderate**                 |
| Live deployment             | "live Vercel deploy" | **404 NOT_FOUND on every path**                                                     |

---

## 2. Findings

### P0-01 — Malformed `localStorage` → uncaught `TypeError` → self-repeating crash loop

`js/state.js:81-85` (validator) · `js/app.js:300` (consumer) · `js/state.js:299`

`safeParse` accepts a persisted mistake if it has a string `id` and `sentence`.
It does **not** require `options`. But `renderQuestion` does
`question.options[order[index]]`. The validator is _weaker_ than its consumer,
at a trust boundary.

- **Reproduced:** seeding `localStorage` with `mistakes:[{id:'poison',sentence:'He ___ to the store.'}]` → `safeParse` accepts it → entering Review Mistakes throws an **uncaught** `TypeError: Cannot read properties of undefined (reading '0')` at `app.js:300`, captured via `window.onerror` with the stack `renderQuestion ← showGame ← reviewMistakesBtn.addEventListener`.
- **Impact:** the mistake is **unresolvable** — every re-entry of Review Mistakes re-throws, so the app is stuck in a repeating crash loop. Recovery requires clearing site data. The same vector also makes `recordMistake` throw (`TypeError: question.options is not iterable`) at `state.js:299`.
- **Precondition:** a malformed or legacy-schema payload. The app's own `recordMistake` always writes `options`, so the live trigger is schema drift or tampering — but the app explicitly claims a "defensive `safeParse`", and that defence has a hole.
- **Fix (R2):** one `normalizeMistake()` used by **both** `safeParse` and `recordMistake`; defensive read at the consumer (`question.options?.[order[index]] ?? ''`); drop-and-persist invalid records instead of carrying them forward.

### P1-09 — The dismissed welcome modal stays in the accessibility tree as an `aria-modal` dialog

`css/style.css:462-482` · `index.html:19-35` · `js/app.js:485-491`

`.modal` is hidden by removing `.modal--visible`, which only sets
`opacity: 0; pointer-events: none`. **`opacity: 0` does not remove an element
from the accessibility tree, and `pointer-events: none` does not remove it from
the tab order.** `role="dialog"` and `aria-modal="true"` are never removed and
the rest of the app is never marked `inert`.

- **Reproduced (Chromium, CDP `Accessibility.getFullAXTree`):** after clicking "Start Learning" the tree still contains `dialog "Welcome to QuizBuddy"` → `button "Start Learning"`, with `aria-modal="true"`, `display: grid`, `opacity: 0`, `aria-hidden: null`, `inert: false`, and the app content **not** marked inert.
- **Impact:** per the ARIA spec, `aria-modal="true"` tells AT that content outside the dialog is inert. A conforming screen reader therefore confines the user to a dialog that is visually gone — **the game becomes unreachable**. axe-core reports **0 violations** for this state.
- **Fix (R6):** `inert` on the dismissed modal (one attribute removes it from both the tab order and the AX tree) plus `visibility: hidden` in CSS and correct `aria-modal`/`aria-hidden` toggling.

### P1-10 — An invisible, focusable "Start Learning" button remains in the tab order

`css/style.css:462-482` · `index.html:32`

Same root cause, different symptom. `#start-btn` keeps `tabIndex: 0` and a live
bounding box. A **real keyboard Tab walk** (14 presses) reaches it at positions
5 and 13. It is focusable with a genuine focus ring (`2px solid rgb(127,181,255)`)
— but the ring is invisible because an ancestor has `opacity: 0`. A keyboard-only
user parks their focus in a dead control and presses Enter to re-fire a no-op
handler.

- **Fix (R6):** as above.

### P1-01 — A stale advance timer resurrects the game after "Time is UP!"

`js/app.js:433-437` · `js/app.js:230-251` · `js/app.js:447-456`

`handleAnswer` arms a 1100 ms `pendingAdvanceTimer`; `handleSpeedRunComplete`
stops the _speed-run interval_ but never cancels the advance timer, and
`renderQuestion` unconditionally re-enables the answer buttons (`app.js:310`).

- **Reproduced in real Chromium with real timers** (time-scaled build: 3 s run,
  400 ms advance — same code path, same relative window), driven inside the page
  against `performance.now()`:
  ```
  clicked at page-clock t=2714ms
  → sentence : "Water ___ at zero degrees Celsius."   (the "Time is UP!" screen was WIPED)
  → disabled : [false, false, false]                   (all three buttons RE-ENABLED)
  ```
- **Fix:** `cancelPendingAdvance()` as the first statement of
  `handleSpeedRunComplete`, plus a phase guard so `renderQuestion` is a no-op
  outside the `answering` phase (see R1).

### P1-02 — The sound theme and volume are write-only state

`js/state.js:354-364` · `js/audio.js:4-5` · `js/app.js:534-536`

`state.soundTheme` / `state.volume` are persisted but **never applied to the
audio engine**, and the theme toggle calls `audio.js`'s `setSoundTheme`, so
`state.soundTheme` is never written. Two independent representations of one
preference, never bridged.

- **Reproduced:** toggling the theme changes the audio module (`'neo' → '8bit'`)
  while `getState().soundTheme` stays `'neo'`; a persisted `'8bit'` is restored
  into state on reload while `getSoundTheme()` still reports `'neo'`. The user's
  theme selection silently reverts on every reload.
- **Fix (R3):** `state.js` owns the preference; `audio.js` becomes a pure
  renderer via `applySoundSettings({ soundTheme, volume })`; one `syncAudio()`
  bridge called at init and on every change.

### P1-03 — The service worker serves a stale build indefinitely

`sw.js:1` · `sw.js:25-41` · `sw.js:43-62`

`CACHE_NAME` is a hand-maintained literal; `activate` deletes every cache whose
key **differs** from it (rotation, not invalidation); the fetch handler is
cache-first for every GET.

- **Reproduced in real Chromium** against a real HTTP origin: after writing a
  new `js/app.js` to the server and reloading, the served file **did not**
  contain the new marker — the SW served the stale cached copy. Every deploy
  that does not hand-edit `sw.js` leaves all returning users on the previous
  build, silently, forever.
- **Fix (R4):** derive the cache name from a build hash; network-first for
  navigations; cache-first only for immutable assets.

### P1-04 — Offline navigation resolves `respondWith(undefined)`

`sw.js:43-62` (specifically `:59`)

`.catch(() => cached)` resolves with `undefined` when the network fails and
nothing is cached. `event.respondWith` requires a `Response`.

- **Reproduced in real Chromium:** navigating offline to an uncached URL fails
  with `net::ERR_FAILED` — the user gets a browser network error, not the app,
  and there is no offline fallback page.
- **Fix (R4):** for navigations, fall back to the cached `./index.html`; never
  resolve with `undefined`.

### P1-05 — Service-worker install is atomic

`sw.js:16-23`

`cache.addAll` rejects if **any** asset fails, so one 404 aborts the install
permanently (and the rejection is unhandled). A deploy that references an asset
before it is uploaded leaves every client stuck on the old build with no error.

- **Fix (R4):** `Promise.allSettled` per asset; fail the install only if the
  app shell is missing.

### P1-06 — Saved progress indexes a re-shuffled array

`js/app.js:74` · `js/app.js:46-53` · `js/app.js:644`

`buildActiveQuestions` shuffles with a fresh `Math.random()` on every load, so
the persisted `progress` is an index into a randomized array.

- **Reproduced:** two reloads at the same saved index 3 showed
  `"He ___ football on Sundays."` and `"The cat ___ on the sofa now."`
- **Fix (R5):** seeded Fisher–Yates whose seed derives from
  `(level, filter, persistedSessionSeed)`.

### P1-07 — `recordMistake` spreads an unvalidated array

`js/state.js:299`

`options: [...question.options]` throws `TypeError: question.options is not
iterable` when `options` is absent. Reachable via the same external-payload
vector as P0-01.

- **Fix (R2):** validate once, at the boundary.

### P1-08 — The speed-run clock counts ticks, not wall-clock time

`js/state.js:278-285` · `js/app.js:447-456`

Elapsed time is `ticks × interval`, which equals 60 s only if every tick fires
on schedule. **Measured** tick period in a foregrounded page: **1007 ms**
(0.7 % drift) → a nominal 60 s run lasts ~60.4 s. Under Chrome's intensive
background throttling (1 tick/min after 5 min hidden) or iOS Safari's timer
suspension, a "60-second" run can last minutes or freeze entirely.
_Confidence: mechanism proven and drift measured; the severe background case
was **not** empirically reproduced in this audit._

### P1-11 — The pinned dev toolchain carries 2 critical + 6 high advisories

`package.json:14-20` · `package-lock.json`

`npm audit --package-lock-only` against this repository's own lockfile reports
**9 vulnerabilities (2 critical, 6 high, 1 moderate)**:

| Package           | Sev          | Advisory                                                          | Range             |
| :---------------- | :----------- | :---------------------------------------------------------------- | :---------------- |
| `tinypool`        | **CRITICAL** | Prototype-pollution gadget → **RCE** in worker options            | `<= 2.1.0`        |
| `vitest`          | **CRITICAL** | Path traversal / **arbitrary file read** via `@vitest/mocker`     | `>=2.1.0 <4.1.11` |
| `vite`            | high         | `launch-editor` command execution; Windows `fs.existsSync` bypass | `>=7.0.0 <=7.3.6` |
| `js-yaml`         | high         | Quadratic CPU / OOM in `!!omap` + `maxTotalMergeKeys`             | `>=4.0.0 <4.3.2`  |
| `nanoid`          | high         | Infinite loop on negative/zero size                               | `<3.3.18`         |
| `postcss`         | high         | Path traversal via `sourceMappingURL`                             | `<=8.5.22`        |
| `brace-expansion` | high         | DoS / stack exhaustion (5 advisories)                             | `<1.1.21`         |
| `source-map-js`   | high         | Event-loop DoS                                                    | `>=1.0.0 <1.2.2`  |

`package.json` pins `vitest: "^3.0.0"` — squarely inside the vulnerable range.
These are devDependencies, so nothing ships to the browser; the exposure is a
developer workstation and CI runner executing a malicious or poisoned
dependency. `docs/audit/SECURITY.md` scored this "0 Critical, 0 High".

- **Fix:** `npm audit fix --force`, re-lock, add `npm audit --audit-level=high`
  to CI.

### P1-12 — The advertised live deployment does not exist

`README.md:5` · `QuizBuddyPPFtense/.gitignore` · repo root

`https://quiz-buddy-pp-ftense.vercel.app/` returns **404 `NOT_FOUND`** on every
path (`/`, `/index.html`, `/sw.js`, `/js/app.js`, `/css/style.css`,
`/manifest.webmanifest`) — Vercel's own edge (`server: Vercel`,
`x-vercel-error: NOT_FOUND`). GitHub Pages is **not** enabled (pages API 404).
The README's project structure claimed `.vercel/project.json` — that directory
does not exist and is **gitignored**, so it can never be committed. There is no
`vercel.json`, so nothing declares `outputDirectory`; the app lives in the
`QuizBuddyPPFtense/` subdirectory while the project root is the repo root,
which is exactly the shape that makes a naive auto-detect publish the wrong
directory.

- **Impact:** there is **no production instance**, so PWA installability, the
  service worker, offline behaviour and the icon set have never been validated
  against a real origin.
- **Fix:** add `vercel.json` with `{"buildCommand":"","outputDirectory":"QuizBuddyPPFtense"}`,
  re-link, redeploy, verify with `curl -w '%{http_code}'`, then update the
  README link. _(Done in part: the README no longer advertises a dead URL.)_

### P1-13 — The verification process that signed off "READY" never opened a browser

`docs/plans/2026-10-20-NextGen-Expansion-DEBRIEF.md` §10-§15 ·
`docs/plans/2026-10-21-Plastic-Surgery-DEBRIEF.md` ·
`docs/plans/2026-08-01-study-loop-RESOLVED.md` · `runtime/events.jsonl`

See §1 above. §11 additionally claims the docs and the source tree are _"in
complete agreement"_ — false on five counts (5 tense categories vs 3; `Enter`/
`Space` shortcuts never implemented; "33/33 tests" vs 45/45; "Cache-First /
Stale-While-Revalidate" vs cache-first with no revalidation; "audio theme & vol
serialized" vs never applied). §14/§15 record _"Remaining Work: None"_ and a
**READY** verdict on that basis.

- **Fix:** correct the claims (done — see §3) and add a real browser tier to CI.

### P2-01 … P2-13 — Medium

| ID    | Defect                                                                                                                                                                                                             | Location                                                             |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| P2-01 | `loadScores()` does not reset `bestStreaks` (or the speed-run fields) when storage is empty — stale bests survive a storage reset while scores reset to 0                                                          | `js/state.js:139-153`                                                |
| P2-02 | Review-mode completion claims _"All recorded mistakes have been reviewed!"_ while mistakes are still pending                                                                                                       | `js/app.js:276-278`                                                  |
| P2-03 | No `document.readyState` guard — a module evaluated after `DOMContentLoaded` leaves the app **completely inert** (reproduced)                                                                                      | `js/app.js:672`                                                      |
| P2-04 | Review mode leaves `state.progress` stale — a reload mid-review drops the user into the normal level at a stale index (reproduced)                                                                                 | `js/state.js:161` · `js/app.js:427-431`                              |
| P2-05 | Speed-run points are also added to the persisted level score (reproduced)                                                                                                                                          | `js/state.js:252-256`                                                |
| P2-06 | AC-006 requires `Enter`/`Space`; not implemented, yet marked complete                                                                                                                                              | `js/app.js:599-635` · `docs/plans/REQUIREMENTS.md`                   |
| P2-07 | Forced synchronous reflow per answer (`void gameCard.offsetWidth`). **Measured** A/B via CDP: removing it saves 1.83 layouts, 6.4 ms layout, 25.3 ms style-recalc and ~72.5 ms of main-thread task time per answer | `js/app.js:377`                                                      |
| P2-08 | God functions: `setupEvents` CC 21 (178 L), `playSound` CC 23 (119 L), `safeParse` CC 19 (85 L), `handleAnswer` CC 18, `updateHud` CC 17                                                                           | `js/app.js`, `js/audio.js`, `js/state.js`                            |
| P2-09 | `buildActiveQuestions` silently falls back to the unfiltered level when a filter matches nothing — the chip then lies (latent: every shipped level×category pair has ≥ 3 questions)                                | `js/app.js:66-71`                                                    |
| P2-10 | Prior audit artifacts assert false assurance ("LOW RISK", "0 findings", "Timers … cleared on level switch, reset, or unmount")                                                                                     | `docs/audit/*`                                                       |
| P2-11 | 7 comment-only `catch` blocks, incl. a swallow-all around the entire audio synthesis path                                                                                                                          | `js/audio.js:176-178` · `js/state.js:115/136/188` · `index.html:145` |
| P2-12 | `state.currentIndex` ⇄ `state.progress` — one fact, two representations, manually synchronised from the UI layer                                                                                                   | `js/state.js:223-237`                                                |
| P2-13 | The documented format CI gate is red and `prettier` is not linked into `node_modules/.bin`                                                                                                                         | `package.json` · `.prettierrc`                                       |
| P2-14 | `aria-live` granularity: only `#game` (the whole panel) and the insight box are live regions; the README claims dedicated score/streak regions                                                                     | `index.html:83,127`                                                  |
| P2-15 | The installed toolchain is a pnpm store symlinked from a different project; the "45/45 green" gate was never reproducible from the committed lockfile                                                              | `node_modules/`                                                      |

### P3-01 … P3-17 — Low

Nine orphaned exports (`data.js` ×3, `state.js` ×3, `audio.js` ×3) · an
unreachable branch (`app.js:579-581`) · a Linux-only absolute font path and an
undeclared Pillow dependency in `scripts/generate_icons.py` · nested
`aria-live` regions · a dialog with no focus trap and no Escape handler ·
swallowed service-worker registration failures · no CSP · no `<noscript>` ·
magic constants (the 60 s run length is duplicated) · eight module-level
mutable singletons in `app.js` · documentation drift · no audio
`disconnect()` · an unvalidated 90-question data literal · `getState()` deep-copy
churn · three stale branch refs to a since-removed canvas/boids architecture
(see the correction below) ·
`HERMES_PLAN.ai.json` promising a "spaced-repetition study loop" that does not
exist.

---

## 3. What was fixed in this cycle

| Fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Files                                            | Verification                                                                                                                                 |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test suite reproducibility.** Node ≥ 22.4's experimental `localStorage` global (value `undefined` without `--localstorage-file`) shadows jsdom's real `Storage` inside vitest 3's jsdom environment, so `localStorage.clear()` threw and **35 of 45 tests failed** under the committed lockfile. A setup file now re-points the global at jsdom's real per-origin Storage.                                                                                                                                                                                                                                                             | `js/test-setup.js` (new), `vitest.config.js`     | 45/45 × 5 runs on vitest 3.2.6 / jsdom 26.1.0; 45/45 on vitest 5.0.1 / jsdom 30.1.0                                                          |
| **The ~1-in-3 flaky keyboard test.** `afterEach` re-imported `./app.js` to reach `__teardown`, so teardown could target a different module instance than the one under test, leaving its `DOMContentLoaded` listener registered. Each later dispatch fanned out to every accumulated instance and a **stale instance answered the keydown with its own question bank** (traced to a question whose correct answer was `"called"` while the DOM showed one whose answer was `"will visit"`). The test now captures the imported instance and tears down exactly that one; the app tracks every controller it creates and aborts them all. | `js/app.test.js`, `js/app.js`                    | 10/10 green; a 120-trial real-browser probe confirms the app's keyboard shortcut was always correct — the defect was entirely in the harness |
| **The format gate.** `prettier --write` across 7 files; `prettier --check .` now passes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 7 files                                          | `prettier --check .` → clean                                                                                                                 |
| **False assurance.** The dead "Live Demo" link, the "Playwright" heading that described JSDOM, the "0 findings" security verdict, the "LOW RISK" classification, the "10/10 runs green" and "live Vercel deploy" claims are all corrected or explicitly superseded.                                                                                                                                                                                                                                                                                                                                                                      | `README.md`, `docs/audit/*`, `docs/plans/*`      | —                                                                                                                                            |
| **CI.** The repository had **no `.github/` directory at all** — every gate was advisory. A workflow now enforces install → format → lint → test → audit. **Caveat: the account is locked for billing, so GitHub Actions refuses to start the job** ("The job was not started because your account is locked due to a billing issue"). The workflow is valid and will run once the account is unlocked; until then the identical gates are enforced by the new `npm run verify` script.                                                                                                                                                   | `.github/workflows/ci.yml` (new), `package.json` | —                                                                                                                                            |

**Not yet fixed** (deliberately left as tracked work, with reproduction steps in
this report): P0-01, P1-01 … P1-12, and the P2/P3 backlog.

---

## 4. Recommended remediation order

1. **Containment** — P0-01 (R2: one `normalizeMistake` at the boundary),
   P1-09/P1-10 (R6: `inert` the dismissed modal), P1-11 (`npm audit fix`).
2. **Reliability** — P1-01 (cancel the advance timer at run end), P1-03/04/05
   (R4: versioned cache, network-first navigations, resilient precache),
   P1-02 (R3: single owner for sound settings), P1-06 (R5: seeded shuffle),
   P1-07, P1-08 (wall-clock deadline).
3. **Release integrity** — P1-12 (`vercel.json` + redeploy), P1-13 (add the
   browser tier to CI: AX-tree assertion, Tab-walk assertion, SW redeploy
   assertion, offline-navigation assertion, axe in all three UI states).
4. **Structure** — R1 (explicit phase table instead of the boolean/timer soup),
   R2 (extract the schema validator), R3 (audio command table), then the
   P2/P3 backlog: delete the nine orphaned exports and the unreachable branch,
   split the live regions, add a focus trap, a CSP and a `<noscript>`, fix the
   icon generator's font resolution, and re-baseline `docs/plans/*`.

---

## 5. Evidence and integrity

- **Zero mutation during the audit.** `tree_integrity_sha256`
  `18bb07b4234670e5556fc42f8c9fee75023aa5807ec3036da3e34f96e872e8ff` identical
  before and after; `git status --porcelain` and `git rev-parse HEAD`
  unchanged; no repository file mtime changed. All probes ran against copies
  in `/tmp/opencode/audit/`.
- **Tools:** `preflight_telemetry.py` (v2.1, vendored-dir exclusion applied to
  a /tmp copy), `espree`-based AST complexity (the bundled scanner's
  arrow-function regex matches nothing in this codebase and reported CC = 1 for
  every file), Vitest 5.0.1 / 3.2.6, jsdom 30.1.0 / 26.1.0, Playwright 1.63.0
  - Chromium, axe-core 4.13.0, `npm audit`.
- **25 jsdom probes**, all passing (each asserts the _defect_, so a pass
  confirms the bug), plus a real-browser pass: smoke, axe across three UI
  states, layout A/B via CDP `Performance.getMetrics`, CLS via
  `PerformanceObserver`, focus-ring and touch-target measurement, SW
  registration/cache/staleness, offline navigation, AX-tree capture, keyboard
  Tab walk, and a 120-trial keyboard-shortcut probe.
- **Two of my own findings were false positives and were withdrawn after
  measurement**: a suspected missing `:focus-visible` ring (the ring is real —
  my earlier reading came from programmatic `.focus()`, which does not match
  `:focus-visible`) and a suspected sub-44 px touch target (the element was the
  _hidden_ modal's button at `scale(0.98)`; **0 visible** interactive elements
  are under 44×44). A third claim — that the speed run stretched under
  throttling — was **overstated** and was downgraded to "mechanism proven, drift
  measured at 1007 ms/tick, severe case not reproduced".
- **One finding was corrected after publication:** the three `copilot/*` branches
  were initially described as "orphaned, never-merged work". They were in fact
  **merged (squashed) in May 2026** as PRs #1, #3 and #5, and their canvas/boids
  feature was subsequently **removed** by commit `3fd6b40`. The branches are
  stale _refs_ pointing at pre-squash commits of a deleted architecture;
  merging them again would revert the plan, audit and runtime files. The
  description is corrected above.
- **One environment limitation is outside the repository's control:** GitHub
  Actions refuses to start jobs on this account because it is locked for
  billing. The CI workflow is therefore present and valid but cannot execute
  here; `npm run verify` enforces the same gates locally.
