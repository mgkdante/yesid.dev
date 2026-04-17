# Slice 17h-5 — Source-of-Truth Refactor

**Status:** draft
**Priority:** 2
**Estimated effort:** 1–2 sessions
**Depends on:** 17h-1 (moves done), 17h-2 (generator producing), 17h-3 (narrative docs exist to point at)
**Parent:** `docs/slices/slice-17h-brand-bundle.md`

## Objective

Update every doc that references brand values, old `docs/reference/` locations, or the old workflow. The goal is that after 17h-5, `grep -rn "#E07800"` outside `brand/`, generated files, and historical logs returns zero hits — AND the workflow docs (CLAUDE.md, WORKFLOW.md, PLAN.md, standardization.md, root README) reflect the new `brand/` vs `docs/` split.

## Context

This is the doc-maintenance sub-slice the user explicitly scoped. Three scopes converge here:

1. **Inline brand values** — `#E07800`, `#FFB627`, font names, spacing values hardcoded in reference docs (CLAUDE.md, CONSTITUTION.md pre-move, CSS.md pre-move, ARCHITECTURE.md, spec/plan templates) get replaced with pointers to `brand/`.
2. **Old-location references** — everything pointing to `docs/reference/CONSTITUTION.md`, `CSS.md`, `MOTION.md` gets retargeted (or relies on redirect stubs — the stubs are a bridge, not the destination).
3. **Workflow reality** — `CLAUDE.md`, `docs/reference/WORKFLOW.md`, `docs/roadmap/PLAN.md`, `docs/roadmap/standardization.md`, and the project-root `README.md` get updates explaining the `brand/` vs `docs/` split, because the workflow *has* matured and the docs should reflect what's actually true.

This sub-slice runs last among content-producing ones — the pointers it writes can only be written once the targets exist.

## Architecture

- No code changes. No generator changes. Pure doc surgery.
- Greps are the verification mechanism. Pre-edit grep + post-edit grep produces a scoreboard.
- Workflow docs describe the current reality, not an aspirational future — write them at the end of 17h-5 after all moves are settled.
- Historical logs (`docs/devlog/`, `docs/handoffs/`) are frozen — do NOT rewrite them; treat as append-only history.

## Tech Stack

Markdown editing. `grep`. No code.

## File Structure

### Modified
```
CLAUDE.md                                — Brand + CSS sections shrink to pointers; Never list grows
docs/reference/ARCHITECTURE.md           — CSS Architecture section → pointer to brand/CSS.md
docs/reference/WORKFLOW.md               — brand/ vs docs/ rule + document-ecosystem table
docs/roadmap/PLAN.md                     — add 17h row + retro paragraph
docs/roadmap/standardization.md          — add 17h row; update Phase 2 arc
README.md (project root)                 — thin edit: one-paragraph pointer to brand/
docs/slices/_TEMPLATE.md                 — purge any inline brand values
docs/specs/*-design.md templates (if any hardcode values) — purge
```

### Not modified (frozen history)
```
docs/devlog/*.md                         — frozen; historical logs never rewritten
docs/handoffs/*.md                       — frozen
```

---

## Task 1: Audit every inline brand value + old-location reference

**Files:** none modified — this task produces a checklist.

- [ ] **Step 1: Brand value grep.**
  ```bash
  grep -rn "#E07800\|#FFB627\|#C96A00\|#E5A220" --include="*.md"
  ```
  Produce a hit list grouped by file. Mark each hit: (a) keep as-is (brand/, generated file, historical log), (b) replace with pointer, (c) remove entirely (duplicate of canonical).
- [ ] **Step 2: Old-location grep.**
  ```bash
  grep -rn "docs/reference/CONSTITUTION\|docs/reference/CSS\|docs/reference/MOTION" \
    --include="*.md" --include="*.ts" --include="*.svelte" --include="*.js"
  ```
  For each hit: (a) inside a redirect stub (keep), (b) historical log (keep — frozen), (c) active ref (retarget to `brand/`).
- [ ] **Step 3: Deleted-file grep.**
  ```bash
  grep -rn "yesid_brand_guide\|colors\.json" --include="*.md"
  ```
  Redirect every non-frozen hit to `brand/README.md` / `brand/BRAND.md` (per 17h-3's new file) / `brand/tokens.json`.
- [ ] **Step 4: Font-name grep.**
  ```bash
  grep -rn "'Inter'\|Inter Variable\|JetBrains Mono" --include="*.md" | grep -v "^brand/"
  ```
  Most hits are legitimate explanations (historical logs, code examples in specs). Flag hardcoded values in *reference* docs that should be `yesid.font.*` pointers.
- [ ] **Step 5: Produce `docs/slices/slice-17h-5-audit.md`** (scratchpad, deleted before close). Checklist per file with action per row.

**STOP.** Yesid reviews the checklist before editing.

---

## Task 2: Update `CLAUDE.md`

**Files:** `CLAUDE.md`

- [ ] **Step 1: Brand (Non-Negotiable) section** — shrink to:
  - One-sentence pitch (pointer to `brand/README.md`).
  - Three rules that are rules, not values: (a) `yesid.` is always lowercase, (b) the dot is always `var(--primary)`, (c) dark theme default.
  - Pointer: "Full system: `brand/README.md`, `brand/BRAND.md`, `brand/CONSTITUTION.md`, `brand/CSS.md`. Motion: `brand/foundations/motion.md`."
  - No hex codes. No font names. No type scale values.
- [ ] **Step 2: CSS Architecture section** — replace with a pointer:
  - "See `brand/CONSTITUTION.md` (governance) and `brand/CSS.md` (token reference)."
  - Keep the 3-layer note only if it's the one-line summary that adds value; otherwise point.
- [ ] **Step 3: Never list** — add two entries:
  - "Hardcode brand values (hex, font names, spacing) outside `brand/` — edit `brand/tokens.json` and run `bun run brand:sync`."
  - "Put brand-portable reference docs in `docs/reference/` — they belong in `brand/`."
- [ ] **Step 4: Repo Structure section** — update the folder listing so `brand/` has its post-17h shape. Document that `docs/reference/` is site-specific (ARCHITECTURE, PATTERNS, WORKFLOW, TESTS); brand reference lives in `brand/`.
- [ ] **Step 5: Tool Selection Protocol** — confirm reference paths still valid post-extraction. Any mention of `docs/reference/CONSTITUTION.md` → `brand/CONSTITUTION.md` etc.

**STOP.** Yesid reads full CLAUDE.md end-to-end, confirms rules still coherent, no contradictions.

---

## Task 3: Update `docs/reference/ARCHITECTURE.md` + root `README.md` + templates

**Files:** `docs/reference/ARCHITECTURE.md`, `README.md` (project root), `docs/slices/_TEMPLATE.md`, `docs/specs/*-design.md` templates if any.

- [ ] **Step 1: `ARCHITECTURE.md` "CSS Architecture" section** — replace table of CSS layers with a pointer to `brand/CSS.md`. Keep the stack table but change "Brand" row source to `brand/`.
- [ ] **Step 2: `README.md` (project root)** — thin edit:
  - One paragraph after the project intro: "Brand bundle lives in `brand/`. It's the single source of truth for tokens, voice, constitution, and design-system rules. Edit `brand/tokens.json` + run `bun run brand:sync` to propagate."
  - Link to `brand/README.md`.
  - Do NOT rewrite the rest of the root README — that's a separate future slice tied to the public-launch decision.
- [ ] **Step 3: `docs/slices/_TEMPLATE.md`** — check if any placeholder values leak brand specifics. If yes, replace with `{brand value — see brand/tokens.json}` placeholders.
- [ ] **Step 4: Design/plan templates** — same treatment if they exist.

**STOP.** Yesid reviews each.

---

## Task 4: Update workflow + roadmap docs (reflect new reality)

**Files:** `docs/reference/WORKFLOW.md`, `docs/roadmap/PLAN.md`, `docs/roadmap/standardization.md`.

- [ ] **Step 1: `docs/reference/WORKFLOW.md`** —
  - Add a one-paragraph "brand/ vs docs/" callout near the top (before § 3):
    > **Two reference homes.** Brand-portable reference material (tokens, constitution, motion language, voice) lives in `brand/`. Site-specific process (ARCHITECTURE, PATTERNS, WORKFLOW, TESTS) lives in `docs/reference/`. A new project clones `brand/`; `docs/` stays with this repo.
  - **§ 19 (Document ecosystem table)** — add a `brand/` section listing: `brand/README.md`, `BRAND.md`, `CONSTITUTION.md`, `CSS.md`, `foundations/*.md`, `decisions/*.md`, `tokens.json`. One-line purpose + update trigger per row.
  - **§ 3 (Research)** — Tools table gains a row: "Brand bundle (`brand/`) — reference for all brand-scoped decisions."
  - **§ 5 (Design Spec), § 6 (Implementation Plan)** — note that brand-scoped decisions follow `brand/CONSTITUTION.md` and record new rules via `brand/decisions/*.md` when appropriate.
  - **§ 11 (Closing)** — add: "If the slice changes brand tokens, constitution, or foundations, ensure `brand/` is updated and a `decisions/` entry recorded."
- [ ] **Step 2: `docs/roadmap/PLAN.md`** —
  - Add 17h row to the Slice 17 sub-slice table.
  - Short retro paragraph in the Slice 17 section: "17h ratified the split between brand (portable) and docs (site-specific). CONSTITUTION, CSS, and MOTION moved into `brand/`. Future projects clone `brand/` as a starter kit."
  - If a Slice 18 (Payload CMS) entry already exists in PLAN.md, confirm its scope unchanged (Payload in the separate `yesid.dev-cms` repo).
- [ ] **Step 3: `docs/roadmap/standardization.md`** —
  - Add a `17h` row to the progress table: "17h — Brand Bundle (Path A) — planned — 9–10 sessions".
  - Update the "Phase 2 — Standardization" arc description to include "17h: visual-design close / brand bundle".
  - Short paragraph noting 17h is the capstone — visual design ratifying what the prior 17a–17g sub-slices produced.

**STOP.** Yesid reviews each workflow doc end-to-end. Confirms they describe *what is*, not *what might be*.

---

## Task 5: Retarget stale references + grep verify + scratchpad cleanup

**Files:** any doc still carrying stale refs after Tasks 2–4.

- [ ] **Step 1: Work through the checklist from Task 1** — apply each remaining retarget.
- [ ] **Step 2: Final greps.**
  ```bash
  # Brand values outside permitted homes
  grep -rn "#E07800" --include="*.md" \
    | grep -v "^brand/" \
    | grep -v "^docs/devlog/" \
    | grep -v "^docs/handoffs/" \
    | grep -v "^docs/learn/"
  ```
  Expected: zero hits.
  ```bash
  # Old CONSTITUTION/CSS/MOTION paths
  grep -rn "docs/reference/CONSTITUTION\|docs/reference/CSS\|docs/reference/MOTION" \
    --include="*.md" --include="*.ts" --include="*.svelte" \
    | grep -v "^docs/reference/CONSTITUTION.md:\|^docs/reference/CSS.md:\|^docs/reference/MOTION.md:" \
    | grep -v "^docs/devlog/\|^docs/handoffs/"
  ```
  Expected: zero hits (redirect stub self-references excluded; history frozen).
  ```bash
  # Dangling PDF / colors.json refs
  grep -rn "yesid_brand_guide\|colors\.json" --include="*.md" \
    | grep -v "^docs/devlog/\|^docs/handoffs/"
  ```
  Expected: zero hits outside `brand/`.
- [ ] **Step 3: Delete `docs/slices/slice-17h-5-audit.md` scratchpad.**
- [ ] **Step 4: Run `bun run test` + `bun run check`. Both green.**

**STOP.** 17h-5 complete. Yesid confirms the greps show zero hits. Site renders identically.

---

## Execution Order

Tasks 1 → 2 → 3 → 4 → 5. Strictly sequential.

Tasks 2 and 3 could parallelize with Yesid approval, but the risk of overlapping edits on the same doc (ARCHITECTURE.md) makes sequential safer.

## Out of Scope

- Rewriting historical devlogs or handoffs (frozen).
- Deleting redirect stubs (that happens in a future cleanup slice).
- Full rewrite of project-root `README.md` (thin pointer edit only).
- Adding new content to CLAUDE.md beyond the pointer edits + Never entries.
- Changing the docs directory structure (`docs/reference/` stays; three files move out but the folder keeps its site-specific role).

## Acceptance Criteria

- [ ] CLAUDE.md Brand + CSS Architecture sections are pointers, not duplicated values.
- [ ] CLAUDE.md Never list gains the two new entries (hardcode values, wrong reference home).
- [ ] `docs/reference/ARCHITECTURE.md` CSS section is a pointer.
- [ ] Root `README.md` mentions `brand/` with a pointer.
- [ ] `docs/reference/WORKFLOW.md` carries the explicit `brand/` vs `docs/` rule + the expanded Document ecosystem table.
- [ ] `docs/roadmap/PLAN.md` has a 17h row.
- [ ] `docs/roadmap/standardization.md` has a 17h row.
- [ ] Final greps return zero hits for (a) hex codes outside permitted homes, (b) old paths outside redirects + history, (c) deleted filenames outside history.
- [ ] `bun run test` + `bun run check` green.
- [ ] Site renders identically.

## Learn

### Greps as verification
**What it is:** Instead of trusting a checklist, a `grep` at the end proves the refactor is complete.
**Why it matters:** Checklists drift; regexes don't. A passing grep is machine-checked evidence.
**Try this:** After Task 5, re-run the greps after a week. If new hits appear, something slipped.

### History is frozen
**What it is:** Past devlogs, handoffs, and dated docs describe what was true at a point in time. They don't get rewritten when the world changes.
**Why it matters:** Rewriting history creates two problems: (a) historical context is lost, (b) greps become unreliable. Leave the past alone.
**Try this:** Find a `#E07800` reference in `docs/devlog/`. It's fine. The doc describes a slice that happened when that hex lived in `docs/`.

### Write docs about the current reality
**What it is:** WORKFLOW.md, PLAN.md, CLAUDE.md describe what's true *now*. Write them at the end, not the beginning, of a refactor.
**Why it matters:** Early writing captures aspirations; those aspirations drift during implementation. Late writing captures facts.
**Try this:** After Task 4, compare the new WORKFLOW.md paragraph to the drafts you considered earlier. The final version should be more concrete — not less.

## Verify

1. Three greps (brand values, old paths, deleted filenames) all return zero hits outside frozen homes.
2. `cat CLAUDE.md | grep -c "#E07800"` returns 0.
3. `cat docs/reference/WORKFLOW.md | grep -c "brand/"` returns a meaningful number (≥ 5 — the new rule + ecosystem table entries).
4. `cat docs/roadmap/PLAN.md | grep -c "17h"` returns at least 1.
5. `cat docs/roadmap/standardization.md | grep -c "17h"` returns at least 1.
6. `bun run test` + `bun run check` green.
7. Site renders identically at 1440px and 375px on hero, services, blog, contact.
