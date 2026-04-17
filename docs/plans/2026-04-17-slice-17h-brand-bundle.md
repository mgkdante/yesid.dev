# Slice 17h — Brand Bundle (Implementation Plan)

**Goal:** Turn `brand/` into the generator-driven, case-study-worthy single source of truth for the yesid. brand. Path A — no Figma, Claude Design as primary design consumer. Also extract brand-portable reference docs (CONSTITUTION, CSS, MOTION) from `docs/reference/` into `brand/`.
**Architecture:** W3C DTCG `tokens.json` is the one editable file. A Bun/TS generator emits CSS, Tailwind config, and TS types. Narrative lives in markdown. CONSTITUTION + CSS + MOTION become first-class brand artifacts at `brand/CONSTITUTION.md`, `brand/CSS.md`, `brand/foundations/motion.md`. No runtime code on the site changes.
**Tech stack:** Bun + TypeScript (generator), W3C DTCG JSON, CSS custom properties, Tailwind v4 `@theme`, Sharp (PNG exports), Vitest (generator tests). Zero new runtime deps on the site itself.
**Multi-session:** 10–11 sessions across 6 sub-slices (17h-1 grew from 1–2 to 2–3 sessions once drift-freshening was added pre-move). See Execution Order.
**Design spec:** `docs/specs/2026-04-17-slice-17h-brand-bundle-design.md`
**Depends on:** Slice 17e merged to `main`

---

## Sub-slice overview

| Sub-slice | Name | Est. sessions | Depends on |
|-----------|------|---------------|------------|
| 17h-1 | Tokens consolidation + freshen + brand-ref extraction (CONSTITUTION, CSS, MOTION) | 2–3 | 17e merged |
| 17h-2 | Code generator (`bun run brand:generate`) | 2 | 17h-1 |
| 17h-3 | Narrative docs + case study (incl. brand-vs-docs decision) | 2 | 17h-2 |
| 17h-4 | Logo + asset expansion | 1 | 17h-1 |
| 17h-5 | Source-of-truth refactor (CLAUDE, WORKFLOW, PLAN, root README + doc pointers) | 1–2 | 17h-1, 17h-2, 17h-3 |
| 17h-6 | `bun run brand:sync` orchestrator + CI verify | 1 | 17h-2, 17h-4 |

Total: 9–10 sessions for a confident estimate.

---

## File structure

### New files

```
brand/BRAND.md                                   — CREATE
brand/CONSTITUTION.md                            — MOVED from docs/reference/
brand/CSS.md                                     — MOVED from docs/reference/
brand/foundations/color.md                       — CREATE
brand/foundations/typography.md                  — CREATE
brand/foundations/space.md                       — CREATE
brand/foundations/motion.md                      — MOVED from docs/reference/MOTION.md
brand/foundations/voice.md                       — CREATE
brand/foundations/accessibility.md               — CREATE
brand/logos/lockup-horizontal.svg                — CREATE
brand/logos/lockup-stacked.svg                   — CREATE
brand/logos/clearspace.svg                       — CREATE
brand/logos/donts.svg                            — CREATE
brand/logos/exports/                             — CREATE (populated by sync)
brand/components.md                              — CREATE
brand/examples/                                  — CREATE (3–5 paired .png + .svelte.txt)
brand/decisions/2026-04-why-orange.md            — CREATE
brand/decisions/2026-04-why-edge-to-edge.md      — CREATE
brand/decisions/2026-04-why-a-constitution.md    — CREATE
brand/decisions/2026-04-extracting-brand-from-docs.md — CREATE
brand/decisions/2026-04-what-i-killed.md         — CREATE
brand/decisions/2026-04-path-a-no-figma.md       — CREATE
brand/scripts/generate.ts                        — CREATE
brand/scripts/sync.ts                            — CREATE
brand/scripts/verify.ts                          — CREATE
brand/scripts/export-logos.ts                    — CREATE
brand/scripts/export-examples.ts                 — CREATE
brand/scripts/__tests__/*.test.ts                — CREATE (3 files)
src/lib/brand.ts                                 — CREATE (generated)
```

### Modified files

```
brand/README.md                                  — REWRITE as front-door
brand/tokens.json                                — EXPAND to full surface
brand/tokens.css                                 — GENERATED (the one tokens file)
brand/tailwind.brand.js                          — GENERATED
src/app.css                                      — marker-bracketed @theme partial + @import '../brand/tokens.css'
package.json                                     — brand:* scripts
vitest.config.ts                                 — include brand/scripts tests
.github/workflows/*.yml (or equivalent)          — brand:verify step
CLAUDE.md                                        — Brand + CSS sections → pointers
docs/reference/ARCHITECTURE.md                   — CSS Architecture → pointer
docs/reference/WORKFLOW.md                       — brand/ vs docs/ rule + doc ecosystem update
docs/roadmap/PLAN.md                             — add 17h to sub-slice table + retro
docs/roadmap/standardization.md                  — add 17h row
README.md (project root)                         — thin edit: pointer to brand/
docs/slices/_TEMPLATE.md                         — remove inline brand values (if any)
docs/specs/*-design.md templates                 — remove inline brand values (if any)
```

### Redirect files (stubs at old paths after move)

```
docs/reference/CONSTITUTION.md                   — 3-line redirect to brand/CONSTITUTION.md
docs/reference/CSS.md                            — 3-line redirect to brand/CSS.md
docs/reference/MOTION.md                         — 3-line redirect to brand/foundations/motion.md
```

### Deleted files

```
brand/colors.json                                — merged into tokens.json
brand/yesid_brand_guide.pdf                      — permanently
```

---

## Sub-slice 17h-1 — Tokens consolidation + brand-ref extraction

**Est. sessions:** 2–3. Target: 7 tasks.

**Goal:** Expand `brand/tokens.json` to the full surface the site uses. Merge `colors.json`. Delete PDF. **Move `docs/reference/CONSTITUTION.md` → `brand/CONSTITUTION.md`, `docs/reference/CSS.md` → `brand/CSS.md`, `docs/reference/MOTION.md` → `brand/foundations/motion.md`** with redirect stubs. Zero behavior change.

### Task 1 — Audit token sources

Produce `brand/tokens-audit.md` (scratchpad). List every token from `tokens.json`, `colors.json`, `tokens.css`, `tailwind.brand.js`, `src/lib/styles/tokens.css`, `src/app.css @theme`. Mark presence in `tokens.json`.

**STOP.** Yesid confirms gap list.

### Task 2 — Expand `tokens.json` to full surface

Merge `colors.json` semantic tier. Add 11-step type scale, spacing, motion (duration + easing), shadow composites, z-index, opacity, full radius set. DTCG-compliant. Validate parses.

**STOP.** Yesid sanity-checks JSON shape before 17h-2 locks it in.

### Task 3 — Fix `brand/README.md` factual errors

Replace Google Fonts section with `@fontsource-variable`. Update file table for post-17h-1 reality. Keep thin — 17h-3 does the front-door rewrite.

**STOP.** Yesid confirms.

### Task 4 — Freshen CONSTITUTION / CSS / MOTION against slice-17 reality (pre-move)

**Context:** slice-17 landed heavy refactors (17a-3 color lockdown, 17a-5 constitution writing, 17a-6 Bits UI, 17d card unification, 17e motion consolidation). The three reference docs may carry drift from when each was last touched. Freshen BEFORE the `git mv` so the moved files capture current reality — the git history then shows the docs in their correct post-slice-17 form at time of move.

Do NOT rewrite from scratch. Audit + targeted updates only. Anything major that emerges becomes a separate follow-up slice.

**Files to freshen in place (still at `docs/reference/`):**
- `docs/reference/CONSTITUTION.md`
- `docs/reference/CSS.md`
- `docs/reference/MOTION.md`

**Audit checklist per file:**

For **`CONSTITUTION.md`**:
- § 2 Layout Model — confirm 4 grid recipes match what's in use today. 17d may have added/removed patterns.
- § 3 Spacing — token values match `src/lib/styles/tokens.css` today (5 semantic tokens present).
- § 4 Typography — 11-step type scale matches `src/app.css @theme` today.
- § 6 Component Standards — tier counts (56 ui/ + 15 brand/) match `src/lib/components/` today. Bits UI integration language post-17a-6 accurate.
- § 8 Motion — tokens match tokens.css; 17e motion consolidation patterns reflected (presets if adopted).
- § 9 Responsive — 5 breakpoints, viewport unit rules, overflow guarantee layers.
- § 13 Atomic Design — 3 tiers, Card surface rules reflect 17d's universal Card.
- Any inline version/date stamps brought current.
- Any `17*` references that are stale.

For **`CSS.md`**:
- "Last updated" date refreshed to today.
- Type scale table matches `src/app.css @theme` exactly.
- Color tokens table matches `src/lib/styles/tokens.css` exactly — every dark/light pair, every shadcn semantic token, every extension.
- Shadow tokens reflect the current `--shadow-*` set.
- Z-index scale matches.
- Brand Primitives section — 15 primitives (StatusDot, SectionLabel, StopLabel, Tag, NumberBadge, ChevronToggle, HazardStripe, GlowOverlay, MetricDisplay, BrandButton, CardBase, CornerMarks, TerminalChrome, StickyPanel, GradientSeparator).
- Brand Utility Classes — 11 utilities in app.css (`.brand-fade-line`, `.divider-dashed`, `.scrollbar-hidden`, `.brand-glow-hover`, `.img-desat`, `.grid-responsive-cards`, `.label-*`, `.prose-dark`, `.led-pulse`).
- Prose styling — 17d-4 blog detail page additions.
- Global keyframes — `blink`, `pulse-glow`, `station-ping`, `typewriter-blink`.

For **`MOTION.md`**:
- Action catalog — match `src/lib/motion/actions/` contents today (`boop, reveal, magnetic, ripple, tilt, cursorGlow, scrollChain`, plus any 17e additions).
- Principles — any 17e motion consolidation patterns (preset factories, reduced-motion enforcement at factory level) reflected.
- Any references to deleted/renamed components retargeted.

**Process:**
- [ ] **Step 1:** For each file, run the audit checklist, producing a `docs/reference/{FILE}-drift.md` scratchpad listing every row that's stale.
- [ ] **Step 2:** Apply corrections in place — factual updates only, no restructuring.
- [ ] **Step 3:** Delete the drift scratchpads.
- [ ] **Step 4:** Diff the three freshened files against the previous state. Confirm changes are narrow and factual (not architectural).
- [ ] **Step 5:** Run `bun run check` — catches any code example that got out of sync.

**STOP.** Yesid reads each freshened doc end-to-end and confirms it reflects reality.

### Task 5 — Move CONSTITUTION / CSS / MOTION into `brand/`

- `git mv docs/reference/CONSTITUTION.md brand/CONSTITUTION.md`
- `git mv docs/reference/CSS.md brand/CSS.md`
- `git mv docs/reference/MOTION.md brand/foundations/motion.md`
- Create redirect stub files at old paths:
  ```md
  # Moved

  This document moved to `brand/CONSTITUTION.md` in Slice 17h. See [brand/CONSTITUTION.md](../../brand/CONSTITUTION.md).
  ```
- Audit internal cross-links in moved files. Update any relative paths broken by the move (`../reference/CSS.md` → `./CSS.md` etc.).

**STOP.** Yesid confirms the three moved files still read correctly AND the redirects work.

### Task 6 — Delete `colors.json` + PDF, retarget references

- grep for `yesid_brand_guide.pdf` + `colors.json` across repo. Retarget all references to `brand/README.md` / `brand/tokens.json`.
- Delete both files.

**STOP.** Yesid confirms.

### Task 7 — Remove scratchpad, run tests

- Delete `brand/tokens-audit.md`.
- Run `bun run test` + `bun run check`. Both green.

**STOP.** 17h-1 complete.

### 17h-1 Acceptance

- `brand/tokens.json` is the DTCG superset.
- `brand/colors.json`, `brand/yesid_brand_guide.pdf` deleted.
- CONSTITUTION, CSS, MOTION moved into `brand/`, redirects at old paths.
- Site renders identically.

---

## Sub-slice 17h-2 — Code generator

**Est. sessions:** 2. Target: 7 tasks.

**Goal:** `bun run brand:generate` reads `tokens.json` and emits `brand/tokens.css` (the single tokens file), `src/app.css @theme` partial (marker-bracketed), `brand/tailwind.brand.js`, `src/lib/brand.ts`. `src/app.css` imports `brand/tokens.css` directly; `src/lib/styles/tokens.css` is deleted. Deterministic, idempotent, byte-stable.

### Session 1 — 17h-2.1

**Task 1 — Scaffold modules + failing tests (TDD RED).** Empty module skeletons in `brand/scripts/`; 3 failing tests (determinism, alias-resolution, DTCG-shape). **STOP.**

**Task 2 — Implement `parse.ts` + `resolve.ts`.** DTCG shape + alias tests green. **STOP.**

**Task 3 — Implement `format-value.ts` + `write.ts`.** All 3 tests green. **STOP.**

### Session 2 — 17h-2.2

**Task 4 — Emit `brand/tokens.css` (only). Delete `src/lib/styles/tokens.css`. Update `src/app.css` import.**
- Generator emits `brand/tokens.css` byte-identical to previously-merged content.
- Grep for `$lib/styles/tokens.css` imports across `src/`. Retarget or remove.
- Update `src/app.css`: replace `@import '$lib/styles/tokens.css';` with `@import '../brand/tokens.css';`.
- Delete `src/lib/styles/tokens.css`.
- Visual check at 1440px + 375px. Site renders identically.
**STOP.**

**Task 5 — Emit `@theme` partial into `src/app.css`** (marker-bracketed `/* BRAND:THEME:START/END */`). **STOP.**

**Task 6 — Emit `brand/tailwind.brand.js` + `src/lib/brand.ts`.** **STOP.**

**Task 7 — Add `brand:generate` to `package.json` + README snippet.** Clean-checkout run. **STOP.**

### 17h-2 Acceptance

- `bun run brand:generate` writes `brand/tokens.css`, `brand/tailwind.brand.js`, `src/app.css` @theme partial, `src/lib/brand.ts`. Content byte-identical to pre-refactor where applicable.
- `src/lib/styles/tokens.css` deleted; no import references remain.
- `src/app.css` imports `../brand/tokens.css`.
- Second run is a no-op.
- All 3 generator tests green.
- Site renders identically.

---

## Sub-slice 17h-3 — Narrative docs + case study

**Est. sessions:** 2. Target: 6 tasks.

**Goal:** Write `BRAND.md` (voice + 5 principles), 6 `foundations/*.md` files, `components.md`, 6 `decisions/*.md` seed entries. Rewrite `README.md` as front-door.

### Session 1 — 17h-3.1

**Task 1 — Rewrite `brand/README.md` as front-door.** 6 sections, ≤ 120 lines, Claude-reader test. Mentions `brand/CONSTITUTION.md` + `brand/CSS.md` as co-equal brand artifacts. **STOP.**

**Task 2 — Write `brand/BRAND.md`.** 5 principles, tone, vocabulary, phrasings, do/don't. Cross-links to `brand/CONSTITUTION.md` where relevant (e.g., principle "Edge-to-edge" → `CONSTITUTION.md § 2`). **STOP.**

**Task 3 — Foundations: `color.md`, `typography.md`, `space.md`.** 5-section template each. Reference `yesid.*` token paths. Contrast proofs in `color.md`. Cross-link to `CONSTITUTION.md` + `CSS.md`. **STOP.**

### Session 2 — 17h-3.2

**Task 4 — Foundations: `voice.md`, `accessibility.md`.** (motion.md already exists from 17h-1 move.) `accessibility.md` cross-links to `brand/CONSTITUTION.md` §7. **STOP.**

**Task 5 — `brand/components.md`.** Two tables: ui/ + brand/. **STOP.**

**Task 6 — 5 decisions seed entries.** (Yesid dropped `path-a-no-figma` 2026-04-17 — tooling-internal, not public-case-study material.)
- `2026-04-why-orange.md`
- `2026-04-why-edge-to-edge.md`
- `2026-04-why-a-constitution.md` — *why a solo brand writes a constitution; why CONSTITUTION.md is a brand artifact, not just a code-governance doc; how the constitution emerged from 22 slices of pattern-capture.*
- `2026-04-extracting-brand-from-docs.md` — *how the docs/reference vs brand split emerged during Slice 17; why 17h-1 moved CONSTITUTION, CSS, MOTION; the portability test (clone `brand/` into a new project).*
- `2026-04-what-i-killed.md`

All impersonal voice (no "I chose" — "the decision", passive where honest). Each ≤ 200 lines. **STOP.**

### 17h-3 Acceptance

- All narrative + decisions files exist, Yesid-approved.
- `brand/` reads as a case study.
- Every foundation cross-links to `CONSTITUTION.md` + `CSS.md`.

---

## Sub-slice 17h-4 — Logo + asset expansion

**Est. sessions:** 1. Target: 3 tasks.

**Goal:** Create lockups, clearspace, don'ts SVGs. Automate PNG exports. Set up `brand/examples/` paired screenshots.

**Task 1 — Create 4 new SVGs** (lockup-horizontal, lockup-stacked, clearspace, donts). Optional: trial Claude Design here. **STOP.**

**Task 2 — `brand/scripts/export-logos.ts`** via Sharp. 1x/2x/3x PNGs for every SVG. **STOP.**

**Task 3 — `brand/scripts/export-examples.ts` + 3–5 paired screenshots** at 1440px + 375px. Opus-reading test. **STOP.**

### 17h-4 Acceptance

- `brand/logos/` has 4 new SVGs + exports.
- `brand/examples/` has 3–5 paired screenshots + source.

---

## Sub-slice 17h-5 — Source-of-truth refactor

**Est. sessions:** 1–2. Target: 5 tasks.

**Goal:** Update every doc that references brand values, old locations, or old workflow. This is the doc-maintenance sub-slice the user explicitly scoped: CLAUDE.md, WORKFLOW.md, PLAN.md, standardization.md, root README, reference pointers.

### Task 1 — Audit every inline brand value + old-location reference

- `grep -rn "#E07800\|#FFB627\|#C96A00\|#E5A220" --include="*.md"` — list all hits.
- `grep -rn "docs/reference/CONSTITUTION\|docs/reference/CSS\|docs/reference/MOTION" --include="*.md" --include="*.svelte" --include="*.ts"` — list all hits.
- `grep -rn "yesid_brand_guide\|colors\.json" --include="*.md"` — list all hits.
- Produce checklist per file: what replaces what.

**STOP.** Yesid reviews before editing.

### Task 2 — Update `CLAUDE.md`

- **Brand section:** shrink to pitch + 3 rules. Pointer: "See `brand/README.md` and `brand/BRAND.md`. Full design system: `brand/CONSTITUTION.md` + `brand/CSS.md`. Motion: `brand/foundations/motion.md`."
- **CSS Architecture section:** pointer to `brand/CONSTITUTION.md` (governance) + `brand/CSS.md` (token lookup).
- **Never list:** add entry: "Hardcode brand values in `docs/` or components — edit `brand/tokens.json` and run `bun run brand:sync`."
- **Plugins & Tools:** confirm reference paths still valid post-extraction.

**STOP.** Yesid reads full CLAUDE.md end-to-end, confirms rules still coherent.

### Task 3 — Update `docs/reference/` + root README + templates

- `docs/reference/ARCHITECTURE.md` — CSS Architecture section → pointer to `brand/CSS.md`. Stack table "Brand" references → pointer.
- `README.md` (project root) — thin edit: one-paragraph "Brand bundle lives in `brand/`" with a one-line pitch. Defers full rewrite to a future slice.
- `docs/slices/_TEMPLATE.md` — purge any inline brand values (check first).
- `docs/specs/*-design.md` templates — same.

**STOP.** Yesid reviews.

### Task 4 — Update workflow + roadmap docs (reflect new reality)

- `docs/reference/WORKFLOW.md`:
  - Add one-paragraph "brand/ vs docs/" callout before § 3.
  - § 19 (Document ecosystem) — add `brand/` section listing the bundle's files with purpose + update-trigger.
  - § 3 (Research), § 5 (Design Spec), § 11 (Closing) — note `brand/` as the reference point for brand-scoped decisions.
- `docs/roadmap/PLAN.md`:
  - Add Slice 17h row to the sub-slice table.
  - Retro paragraph in the Slice 17 section: "17h ratified the split between brand (portable) and docs (site-specific)."
  - If Slice 18 (Payload CMS) entry exists, confirm its scope hasn't shifted.
- `docs/roadmap/standardization.md`:
  - Add 17h row to the progress table: "17h — Brand Bundle (Path A) — planned".
  - Update the "Phase 2 — Standardization" arc to include 17h as the visual-design close.

**STOP.** Yesid reviews each workflow doc end-to-end.

### Task 5 — Retarget stale references + grep verify

- Retarget every reference to deleted files or moved files.
- Final grep: `grep -rn "#E07800" --include="*.md" | grep -v "^brand/\|^docs/devlog/\|^docs/handoffs/"` — should return zero hits (historical logs frozen).
- Same for fonts, old paths.

**STOP.** 17h-5 complete. Yesid confirms the greps.

### 17h-5 Acceptance

- CLAUDE.md Brand + CSS sections are pointers.
- WORKFLOW.md + PLAN.md + standardization.md reflect the brand/docs split.
- Root README.md points to `brand/`.
- Zero stale paths to `docs/reference/CONSTITUTION|CSS|MOTION.md` outside the redirect stubs.
- Zero hardcoded brand values outside `brand/`, generated files, and historical logs.

---

## Sub-slice 17h-6 — `bun run brand:sync` orchestrator + CI verify

**Est. sessions:** 1. Target: 3 tasks.

**Goal:** One command regenerates everything. CI verifies idempotency.

**Task 1 — `brand/scripts/sync.ts`** orchestrates: `brand:generate` → `brand:export-logos` → `brand:export-examples`. Reports diff summary. **STOP.**

**Task 2 — `brand/scripts/verify.ts`** for CI: runs generator, `git diff --exit-code` on brand + generated site files. Wire into CI yml. Test failure path. **STOP.**

**Task 3 — Final `brand/README.md` pass** — full workflow + CI paragraph. **STOP.**

### 17h-6 Acceptance

- `bun run brand:sync` works end-to-end.
- CI `brand:verify` step passes on clean, fails on drift.

---

## Execution order

```
17h-1 ──► 17h-2 ──► 17h-3 ──┐
   │                         │
   └──► 17h-4 ───────────────┤
                             ├──► 17h-5 ──► 17h-6
                             │
          (17h-4 only needs tokens.json stable — parallel-safe with 17h-3)
```

**Sequential by necessity:** 17h-1 before everything (JSON + moves must land). 17h-5 after 17h-3 (narrative docs must exist before docs point at them). 17h-6 last.

**Parallelizable (with Yesid's approval only):** 17h-3 + 17h-4 after 17h-1.

## Out of Scope

- Figma (Path A locked).
- Claude Design live MCP integration (not shipped).
- Light-theme launch.
- New brand colors.
- Payload CMS (Slice 18, separate repo).
- Component API changes (inventory only).
- Accessibility audit (document current posture only).
- External npm publish.
- Public-launch narrative rewrite for root README (separate future slice).

## Global acceptance

- [ ] `bun run test` + `bun run check` green.
- [ ] `bun run brand:verify` in CI passes.
- [ ] `grep -rn "#E07800" --include="*.md"` outside `brand/`, generated files, historical logs → zero hits.
- [ ] `docs/reference/CONSTITUTION.md` / `CSS.md` / `MOTION.md` are redirect files; content in `brand/`.
- [ ] CLAUDE.md + WORKFLOW.md + PLAN.md + standardization.md + root README reflect the new reality.
- [ ] Site renders identically before/after.
- [ ] Fresh clone of `brand/` into a sibling project works standalone.
- [ ] `brand/decisions/` has 5 dated seed entries; all impersonal voice.
- [ ] `src/lib/styles/tokens.css` deleted; `src/app.css` imports `../brand/tokens.css`.

## What Yesid will learn

- **W3C DTCG tokens** — emerging standard, `$value` + `$type`, aliases.
- **Generator-driven design systems** — one input, many outputs. Deterministic. Diff-reviewable.
- **Brand as governance** — why codifying layout/motion/a11y rules as a constitution is brand work, not just engineering work.
- **Docs extraction** — how to tell brand-portable docs from site-specific process; why the split matters for future projects.
- **The three portable currencies** — W3C JSON, CSS custom properties, markdown.
- **Decision records as case study** — `decisions/*.md` is the differentiator for a solo brand.
- **Source-of-truth discipline** — one edit propagates; grep verifies; CI enforces.
