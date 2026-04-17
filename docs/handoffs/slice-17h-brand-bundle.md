# Handoff: Slice 17h — Brand Bundle (Narrative + Assets)

## 1. Objective Completed

**Implemented:**

- `brand/` restructured from dev-dump into a narrative + assets bundle (per 2026-04-18 scope shrink).
- Task 0 freshen pass across reference docs — governance now matches as-shipped reality.
- Task 0 governance cleanup — removed 3 executable `brand/` files (`tokens.json`, `tokens.css`, `tailwind.brand.js`) that duplicated `src/` state without sync enforcement.
- Task 0 consumer repair — 3 components (`ServiceCard`, `ServiceSvgPanel`, `ProjectsStrip`) were silently rendering with `var(--space-stack) / var(--space-cluster)` tokens that had never been defined. Restored visual spacing with concrete `rem` values.
- Tasks 1–6 narrative writing — `README.md` (front door), `BRAND.md` (principles + voice), 6 `foundations/*.md` (color, typography, space, motion, voice, accessibility), `components.md` (ui/ + brand/ inventory), 4 `decisions/*.md` (why-orange, why-edge-to-edge, why-a-constitution, what-i-killed).
- Sub-slice 17h-4 — 4 new SVG logos (lockup-horizontal, lockup-stacked, clearspace, donts), restructured `brand/logos/` with 6 existing SVGs renamed, `scripts/export-logos.ts` (Sharp-based batch PNG export), `scripts/export-examples.ts` (Playwright-based paired screenshot capture), 2 new `package.json` scripts.
- Legacy deletions — `brand/colors.json`, `brand/yesid_brand_guide.pdf`.

**Intentionally not implemented:**

- Token generator (`bun run brand:generate`) — killed in 17h-1 scope shrink (2026-04-18). `brand/` stays narrative; `src/lib/styles/tokens.css` stays the code source of truth. PR review is the translation layer.
- Cross-file pointer refactor of `CLAUDE.md` / `WORKFLOW.md` / `PLAN.md` (17h-5 killed).
- `bun run brand:sync` orchestrator (17h-6 killed).
- Moving `CONSTITUTION.md` / `CSS.md` / `MOTION.md` into `brand/` — governance stays at `docs/reference/`.
- Running `brand:export-examples` to completion — Playwright launches hung on this Windows box for both Chromium and Firefox. Source-only pairs + regeneration README shipped instead. Flagged for follow-up (see § 8 Known Issues).

## 2. High-Level Summary

Slice 17h turned `brand/` from a small developer dump (1 PDF, 1 JSON palette, 1 CSS tokens dup, 1 Tailwind config) into a 22-file narrative + asset package:

- **12 markdown files** carry the narrative (README, BRAND, 6 foundations, components inventory, 4 decisions).
- **10 SVG logos** live under `brand/logos/` with 30 PNG exports (`brand/logos/exports/` at 1x/2x/3x).
- **2 Bun/TS scripts** under `brand/scripts/` — Sharp-based logo exporter (tested, idempotent, 30 PNGs written), Playwright-based example exporter (works in principle; blocked by Windows Playwright launch hang — documented).
- **3 source-only example pairs** under `brand/examples/` (home hero, service card, contact terminal) plus a README that explains the pair model and how to regenerate PNGs.

Parallel to `brand/` work, Task 0's freshen pass touched 9 reference docs (CONSTITUTION, CSS, MOTION, TESTS, ARCHITECTURE, standardization, PLAN, README, CLAUDE) to match current repo reality — key corrections: Tailwind v4 default breakpoints replace the never-overridden custom scheme, 13-primitive brand count replaces stale 15+, ghost tokens (`--container-prose`, `--space-stack`, `--space-cluster`, `--code-foreground`, `--deep`, `--live`, `--warning`, `--shadow-status`, `--z-footer`) removed from all doc tables, test count 785 → 782, utility class count 11 → 12 with `grid-rows-collapse` added.

The bundle is consumable in three ways: a hiring manager reads `BRAND.md` + `decisions/` + `examples/` as a case study; a vision LLM (Claude Design) reads `foundations/*.md` + `examples/*.{png,svelte.txt}` to ground brand posture before generating; a designer forks `brand/` and cross-walks to `src/lib/styles/tokens.css` + `docs/reference/*` for code-level enforcement.

## 3. Files Created

| File | Purpose |
|------|---------|
| `brand/BRAND.md` | 5 numbered principles, tone, vocabulary, do/don't |
| `brand/components.md` | Read-only inventory of 56 ui/ + 13 brand/ primitives |
| `brand/foundations/color.md` | Color narrative + tokens + contrast posture |
| `brand/foundations/typography.md` | Inter + JetBrains Mono + 12-step scale + rules |
| `brand/foundations/space.md` | 3 semantic spacing tokens + clamp pattern |
| `brand/foundations/motion.md` | Motion intent + 9 signatures + Snappy Doctrine narrative |
| `brand/foundations/voice.md` | Tone, long vocabulary, UX copy patterns, voice samples |
| `brand/foundations/accessibility.md` | A11y posture, Bits UI rationale, reduced-motion contract |
| `brand/decisions/2026-04-why-orange.md` | Brand color decision record |
| `brand/decisions/2026-04-why-edge-to-edge.md` | Layout philosophy decision record |
| `brand/decisions/2026-04-why-a-constitution.md` | Governance decision record (why docs/reference owns it) |
| `brand/decisions/2026-04-what-i-killed.md` | Inventory of removed systems + rationale |
| `brand/examples/README.md` | Pair-model explanation + regeneration steps + known issue |
| `brand/examples/home-hero.svelte.txt` | HeroBanner source (awaiting paired PNG) |
| `brand/examples/service-card-sql.svelte.txt` | ServiceCard source (awaiting paired PNG) |
| `brand/examples/contact-terminal.svelte.txt` | ContactPage source (awaiting paired PNG) |
| `brand/logos/lockup-horizontal.svg` | Wordmark + tagline, horizontal lockup |
| `brand/logos/lockup-stacked.svg` | Wordmark above tagline, stacked lockup |
| `brand/logos/clearspace.svg` | Diagram of minimum clearspace (1y on all sides) |
| `brand/logos/donts.svg` | 4 incorrect uses with red-X overlays |
| `brand/logos/exports/*.png` | 30 PNG exports — 10 SVGs × 1x/2x/3x |
| `brand/scripts/export-logos.ts` | Sharp-based batch SVG → PNG exporter (idempotent, tested) |
| `brand/scripts/export-examples.ts` | Playwright-based paired screenshot capture (works on non-Windows envs) |

## 4. Files Modified

| File | What Changed | Why |
|------|--------------|-----|
| `brand/README.md` | Full rewrite as front door (6 sections, ~70 lines) | Task 1 deliverable |
| `docs/reference/CONSTITUTION.md` | Type scale gained `text-hero-mobile`; brand count 15+ → 13; `use:tilt` row removed; `--container-prose` + `--space-stack` + `--space-cluster` rows removed; breakpoints table switched to Tailwind v4 defaults | Task 0 freshen — actual-usage rule |
| `docs/reference/CSS.md` | Header date + status refreshed; type scale 9 → 12 (added hero rows); brand color tokens corrected (`--primary` not `--color-brand-primary`); RGB channel drift fixed; 4 phantom semantic tokens removed; 2 phantom shadow/z-index rows removed; spacing dropped to 3; container dropped to 2; brand primitives rewritten (15 → 13 + migration note); utility classes 11 → 12 | Task 0 freshen |
| `docs/reference/MOTION.md` | §11 SEO section — "Services" corrected to "home Projects + home Terminus + blog listing + projects listing + contact" for rotated `<h2>` claims | Task 0 freshen |
| `docs/reference/TESTS.md` | Date 2026-04-15 → 2026-04-18; total 785 → 782; stale `reveal.ts` row replaced with `boop.ts` | Task 0 freshen |
| `docs/reference/ARCHITECTURE.md` | Header date + status refreshed | Task 0 freshen |
| `docs/roadmap/standardization.md` | Progress table updated through 17a-4; breakpoint claim 360/520/768/1024/1440 → Tailwind defaults; spacing 5 → 3; containers 3 → 2; layout patterns renamed to 4 CSS Grid Recipes | Task 0 freshen |
| `README.md` (root) | Structure diagram updated to match current `docs/reference/` + `docs/roadmap/` layout; brand pointer updated | Task 0 freshen |
| `docs/slices/slice-17h-brand-bundle.md` | Deleted-file list expanded to include `tokens.json` / `tokens.css` / `tailwind.brand.js`; acceptance updated | Task 0 governance cleanup |
| `docs/plans/2026-04-17-slice-17h-brand-bundle.md` | Same deletion-list expansion | Task 0 governance cleanup |
| `src/app.css` (line 40-47) | Stale "translated from `brand/tailwind.brand.js`" comment replaced with description of `@theme` as the canonical Tailwind bridge + pointer to `brand/foundations/*.md` | Trio deletion |
| `src/lib/components/services/ServiceCard.svelte` (line 217) | `gap: var(--space-cluster)` → `gap: 0.75rem` | Consumer repair — token was never defined |
| `src/lib/components/services/ServiceSvgPanel.svelte` (lines 49, 62) | `padding: var(--space-stack)` → `padding: 1.5rem` (2 sites) | Same |
| `src/lib/components/services/ProjectsStrip.svelte` (line 65) | `gap: var(--space-stack)` → `gap: 1.5rem` | Same |
| `package.json` | Added `brand:export-logos` + `brand:export-examples` scripts; added `sharp` dev dep | Sub-slice 17h-4 |

## 5. Files Deleted

| File | Why |
|------|-----|
| `brand/colors.json` | Duplicated `tokens.css`; nothing consumed it; 17h shrink rule — narrative + assets only |
| `brand/yesid_brand_guide.pdf` | Replaced by markdown narrative; PDF is unreadable by LLMs and can't be versioned cleanly |
| `brand/tokens.json` | Ditto — never wired to a generator; drifted from `tokens.css` |
| `brand/tokens.css` | Duplicate of `src/lib/styles/tokens.css`; same drift problem |
| `brand/tailwind.brand.js` | Tailwind v3 config file; Tailwind v4 `@theme` in `src/app.css` is canonical |

## 6. Files Moved / Renamed

| From | To | Reason |
|------|-----|--------|
| `brand/favicon.svg` | `brand/logos/favicon.svg` | Consolidate all logos under `brand/logos/` |
| `brand/logo-wordmark-dark.svg` | `brand/logos/wordmark-dark.svg` | Same, plus name simplification |
| `brand/logo-wordmark-light.svg` | `brand/logos/wordmark-light.svg` | Same |
| `brand/logo-monogram-dark.svg` | `brand/logos/monogram-dark.svg` | Same |
| `brand/logo-monogram-light.svg` | `brand/logos/monogram-light.svg` | Same |
| `brand/logo-monogram-orange.svg` | `brand/logos/monogram-orange.svg` | Same |

None of these were referenced from `src/` (the site uses `src/lib/assets/favicon.svg` + `static/favicon.svg`), so the moves are safe.

## 7. Data Model Changes

None. `brand/` carries narrative; `src/` data types are unchanged.

## 8. Known Issues

### Playwright headless launch hangs on this Windows box

`brand/scripts/export-examples.ts` launches a Playwright browser via `chromium.launch()` (or `firefox.launch()` via `PLAYWRIGHT_BROWSER=firefox`). On this Windows dev machine, both hang indefinitely after the browser process spawns — the Juggler / CDP debug pipe never reports ready within the 30–45s timeout. The script exits with `TimeoutError: launch: Timeout Nms exceeded`.

The hang is environmental, not a script bug. Reproducible by calling `chromium.launch()` directly with no options. Workarounds not yet validated:

- Run the script on macOS / Linux / CI.
- Try `channel: 'chrome'` to launch system Chrome (not the bundled Chromium).
- Check Windows Defender / antivirus exclusion on `C:\Users\otalo\AppData\Local\ms-playwright\`.

Until the launch issue is resolved, `brand/examples/` ships with 3 source-only pairs (`.svelte.txt`). The paired PNGs will need to be captured from a working environment and committed.

### Consumer repair wasn't token-restored

`ServiceCard.svelte` et al. now use hardcoded `0.75rem` / `1.5rem` values where they previously used ghost tokens. If the team wants the values to re-parameterise as semantic tokens, the path is:

1. Add `--space-cluster: 0.75rem` + `--space-stack: 1.5rem` to `src/lib/styles/tokens.css`.
2. Add doc rows in `docs/reference/CSS.md § Spacing Tokens` + `CONSTITUTION.md § 3`.
3. Rewrite the consumers back to `var(--space-stack)` / `var(--space-cluster)`.

This was explicitly the option-b choice during Task 0 (2026-04-18) — keeping it hardcoded avoids re-introducing tokens that were documented-only for an extended period without a clear design owner.

## 9. Test Results

```
bun run test       → 782/782 pass  (unchanged from baseline — this slice adds no test files; see note below)
bun run check      → 0 errors, 19 pre-existing warnings (unchanged from baseline)
```

No new tests. The narrative markdown + assets are outside the test harness. `export-logos.ts` + `export-examples.ts` live under `brand/scripts/` which is intentionally excluded from `src/` — they're not part of the app; Vitest does not scan them.

## 10. Handoff Note for Next Slice

- 17h parent slice is **complete** — both 17h-3 (narrative) and 17h-4 (assets) landed in this branch (`feature/slice-17h-3-task0-freshen`).
- Ready for a single 17h PR. Per Yesid's 2026-04-18 rule, ship as one PR covering both sub-slices.
- `brand/examples/` PNG side remains empty until Playwright launch is fixed or the script is run on a different environment.
- Follow-up slice candidates surfaced during Task 0: (a) rewire `--space-stack` / `--space-cluster` as real tokens if the team decides the semantic layer is wanted back; (b) revisit whether the device-coverage matrix (CONSTITUTION § 9) and Tailwind default breakpoints should be aligned (currently orthogonal — `sm:` fires at 640px, not at 360px as the matrix's "Phone" class starts).

## Concepts Documented

| Action | File | Domain |
|--------|------|--------|
| Created | `brand/foundations/color.md` | brand |
| Created | `brand/foundations/typography.md` | brand |
| Created | `brand/foundations/space.md` | brand |
| Created | `brand/foundations/motion.md` | brand |
| Created | `brand/foundations/voice.md` | brand |
| Created | `brand/foundations/accessibility.md` | brand |
| Created | `brand/decisions/2026-04-why-orange.md` | brand (decision record) |
| Created | `brand/decisions/2026-04-why-edge-to-edge.md` | brand (decision record) |
| Created | `brand/decisions/2026-04-why-a-constitution.md` | brand (decision record) |
| Created | `brand/decisions/2026-04-what-i-killed.md` | brand (decision record) |

_`docs/learn/` was explicitly excluded from Task 0 — no additions made there per 2026-04-18 scope._
