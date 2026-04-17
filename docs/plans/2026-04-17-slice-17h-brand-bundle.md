# Slice 17h — Brand Bundle (Narrative + Assets) — Implementation Plan

**Goal:** Turn `brand/` into a readable, portable, case-study-grade narrative package. Hand-authored markdown + vector assets + paired examples. Zero runtime code, zero generated files.
**Architecture:** Physical separation between `brand/` (narrative + assets) and `src/` / `docs/reference/` (implementation + governance). `brand/` governs by convention, not automation. No generator. A brand decision captured in `brand/decisions/*.md` is advisory; a dev translates it into `src/lib/styles/tokens.css` + `docs/reference/CSS.md` + relevant component edits. PR review bridges the gap.
**Tech stack:** Markdown + SVG + Sharp (PNG exports) + Playwright/Claude Preview (paired screenshots). No new runtime site dependencies.
**Multi-session:** ~4 sessions across 2 sub-slices (shrunk from 10-11 / 6 sub-slices on 2026-04-18; 17h-3 Task 0 added then expanded 2026-04-18 to cover `docs/reference/*` + `docs/roadmap/*` + `CLAUDE.md` + root `README.md` — ~1 session for the freshen pass, `docs/learn/` excluded). See execution order below.
**Parent slice spec:** `docs/slices/slice-17h-brand-bundle.md`
**Original design spec:** `docs/specs/2026-04-17-slice-17h-brand-bundle-design.md` — carries the old generator-driven architecture as historical research; the top banner documents the 2026-04-18 shrink.
**Depends on:** Slice 17a-4 merged to `main`.

---

## Scope shrink summary (2026-04-18)

The original plan had 6 sub-slices and 10-11 sessions, with `brand/` as a generator-driven source-of-truth that absorbed `CONSTITUTION.md`, `CSS.md`, `MOTION.md` from `docs/reference/`. Yesid walked that back on 2026-04-18: `brand/` now contains non-tech info and assets only; governance stays at `docs/reference/`; code stays at `src/`. The reason is safety — physical separation makes it harder to break one while editing the other.

**Killed sub-slices (stubbed in place):**

| # | Sub-slice | Why dead |
|---|---|---|
| 17h-1 | Tokens consolidation + CONSTITUTION/CSS/MOTION move | Tokens stay in `src/lib/styles/tokens.css`; governance docs stay in `docs/reference/` |
| 17h-2 | Code generator (`bun run brand:generate`) | No generator needed |
| 17h-5 | Source-of-truth refactor | No cross-file pointer rewrite needed |
| 17h-6 | `bun run brand:sync` orchestrator | Nothing to orchestrate |

**Surviving sub-slices (this plan):**

| Sub-slice | Name | Sessions | Depends on |
|---|---|---|---|
| 17h-3 | Narrative docs + case study (incl. expanded Task 0 freshen pass) | 2.5–3 | standalone |
| 17h-4 | Logo + asset expansion | 1 | standalone |

17h-3 and 17h-4 are independent; can run in either order.

---

## File structure (target end-state)

### New files

```
brand/BRAND.md                                   — voice + 5 principles
brand/foundations/color.md                       — narrative; cross-links to docs/reference/CSS.md
brand/foundations/typography.md
brand/foundations/space.md
brand/foundations/motion.md                      — narrative; cross-links to docs/reference/MOTION.md
brand/foundations/voice.md
brand/foundations/accessibility.md               — cross-links to docs/reference/CONSTITUTION.md §7
brand/components.md                              — read-only primitive inventory
brand/logos/lockup-horizontal.svg
brand/logos/lockup-stacked.svg
brand/logos/clearspace.svg
brand/logos/donts.svg
brand/logos/exports/                             — populated by script: PNG 1x/2x/3x per SVG
brand/examples/                                  — populated by script: 3–5 .png + .svelte.txt pairs
brand/decisions/2026-04-why-orange.md
brand/decisions/2026-04-why-edge-to-edge.md
brand/decisions/2026-04-why-a-constitution.md
brand/decisions/2026-04-what-i-killed.md
brand/scripts/export-logos.ts
brand/scripts/export-examples.ts
```

### Modified files

```
brand/README.md                                  — rewritten as front-door
package.json                                     — adds brand:export-logos + brand:export-examples
```

### Deleted files

```
brand/colors.json                                — narrative supersedes; raw values live in src/lib/styles/tokens.css
brand/yesid_brand_guide.pdf                      — markdown narrative supersedes
```

### Not touched

```
src/lib/styles/tokens.css                        — token source of truth stays here
src/app.css @theme                               — Tailwind integration stays here
docs/reference/CONSTITUTION.md                   — governance stays here
docs/reference/CSS.md                            — token lookup + architecture stays here
docs/reference/MOTION.md                         — motion language stays here
CLAUDE.md, WORKFLOW.md, PLAN.md, root README     — unchanged; inline brand values stay valid
```

---

## Sub-slice 17h-3 — Narrative Docs + Case Study

**Est. sessions:** 2–2.5. Target: 7 tasks (Task 0 freshen pass + Tasks 1–6 narrative writing).

**Goal:** Write the human-readable face of `brand/` — BRAND.md (voice + 5 principles), six foundations write-ups, components.md inventory, 4 decisions seed entries. Rewrite README.md as the front door. Every file is hand-authored markdown; no generated content.

**Key tuning from original 17h-3 spec:**
- **Task 0 added 2026-04-18** — audit + freshen `docs/reference/{CONSTITUTION,CSS,MOTION}.md` before any foundation doc cross-links into them. Replaces the freshen pass that was in the killed 17h-1. Prevents drift from being laundered into `brand/`.
- `motion.md` is **newly authored** in `brand/foundations/` as narrative, NOT moved from `docs/reference/MOTION.md`. The authoritative motion doc stays at `docs/reference/MOTION.md`; `brand/foundations/motion.md` cross-links there.
- `accessibility.md` cross-links to `docs/reference/CONSTITUTION.md §7`, not to `brand/CONSTITUTION.md` (the constitution never moves).
- 2 decisions dropped: `path-a-no-figma.md` (Yesid dropped 2026-04-17 — tooling-internal) and `extracting-brand-from-docs.md` (premise dead — docs were never extracted in the shrunk scope). That leaves 4 seed decisions.

See `docs/slices/slice-17h-3-narrative-docs.md` for task-level detail.

### 17h-3 acceptance (updated)

- `BRAND.md`, `components.md`, rewritten `README.md` exist.
- 6 `foundations/*.md` files exist; each cross-links to `docs/reference/CSS.md` and/or `docs/reference/CONSTITUTION.md` where authoritative rules live.
- 4 dated `decisions/*.md` entries exist.
- Claude reader test passes on `brand/README.md` (3-sentence summary).
- No broken cross-links.

---

## Sub-slice 17h-4 — Logo + Asset Expansion

**Est. sessions:** 1. Target: 3 tasks.

**Goal:** Create 4 new SVGs (lockup-horizontal, lockup-stacked, clearspace, donts). Automate PNG exports (Sharp). Set up `brand/examples/` paired screenshots via Playwright/Claude Preview.

**Key tuning from original 17h-4 spec:**
- Dependency simplifies from "17h-1 merged" to "brand/ folder exists" (it already does).
- No wiring into a `brand:sync` orchestrator (17h-6 is dead). Scripts run standalone via `bun run brand:export-logos` / `bun run brand:export-examples`.

See `docs/slices/slice-17h-4-logo-assets.md` for task-level detail.

### 17h-4 acceptance (unchanged)

- 4 new SVGs in `brand/logos/`, each with `<title>` + `<desc>`, flat (no embedded rasters), `currentColor` where appropriate.
- `brand/logos/exports/` has PNG 1x/2x/3x per SVG (10 logos × 3 sizes = 30 PNGs).
- `brand/examples/` has 3–5 `.png` + `.svelte.txt` pairs.
- `bun run brand:export-logos` and `bun run brand:export-examples` idempotent.
- Sharp added to dev deps.

---

## Execution order

```
17h-3 (Narrative) ──┐
                    ├──► Slice 17h closes
17h-4 (Assets) ─────┘
```

Either order works. Parallel is possible with explicit approval (not default).

## Out of scope

- Figma files or library (Path A locked — unchanged from original).
- Claude Design live MCP integration.
- Light-theme launch.
- New brand colors.
- Payload CMS (Slice 18, separate repo).
- Component API changes (`components.md` is read-only inventory).
- Accessibility audit beyond documenting current posture.
- Token generator / source-of-truth automation (explicitly killed 2026-04-18).
- Moving CONSTITUTION / CSS / MOTION into `brand/` (explicitly killed 2026-04-18).
- External npm publish.
- Public-launch README rewrite.

## Global acceptance

- [ ] `bun run test` + `bun run check` green.
- [ ] Site renders identically before/after (no `src/` code or CSS changes).
- [ ] `brand/colors.json` + `brand/yesid_brand_guide.pdf` deleted.
- [ ] Every `brand/foundations/*.md` cross-links to `docs/reference/` for authoritative values.
- [ ] `brand/` contains no `tokens.json`, no `tokens.css`, no generator scripts, no sync scripts — only narrative + assets.
- [ ] A non-technical reader opens `brand/README.md` and understands the system in under 90 seconds.
- [ ] A fresh Claude instance given any `brand/foundations/*.md` extracts 3–5 concrete brand rules with no additional prompting.

## What Yesid will learn

- **Governance by convention.** Why a solo brand can rely on PR review + narrative docs instead of a generator — and when that tradeoff flips (i.e., when you'd add the generator later, probably at the first fork of `brand/` into a second project).
- **Narrative brand vs. tooling brand.** Primer / Polaris / Carbon ship typed packages. `brand/` ships a readable bundle. Same discipline, different audience.
- **Decision records as case study.** `decisions/*.md` is the differentiator for a solo brand's hiring-manager audience.
- **Paired-example grounding for vision LLMs.** Screenshot + source pair teaches a vision model a brand rule faster than either alone.
- **What to kill and when.** The 2026-04-18 shrink is its own case study: scope overshot, trimmed back, decisions logged.
