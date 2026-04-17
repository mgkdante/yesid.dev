# Slice 17h-1 — Tokens Consolidation + Brand-Ref Extraction

**Status:** draft
**Priority:** 2
**Estimated effort:** 2–3 sessions (added Task 4 to freshen CONSTITUTION/CSS/MOTION against slice-17 reality before moving)
**Depends on:** Slice 17e merged to `main`
**Parent:** `docs/slices/slice-17h-brand-bundle.md`

## Objective

Grow `brand/tokens.json` to cover the full brand surface the live site uses today, merge `colors.json` into it, fix factual errors in `brand/README.md`, delete the legacy PDF, **freshen `docs/reference/CONSTITUTION.md` / `CSS.md` / `MOTION.md` against slice-17 reality**, and then **move them into `brand/`** (`brand/CONSTITUTION.md`, `brand/CSS.md`, `brand/foundations/motion.md`) with redirect stubs at the old paths. Zero runtime behavior change — `tokens.json` is currently unconsumed and the moved docs are content-only.

**Why the freshening pass:** slice-17's heavy refactors (17a-3 color lockdown, 17a-5 constitution writing, 17a-6 Bits UI, 17d card unification, 17e motion consolidation) may have introduced drift between these reference docs and current code. Freshen before the `git mv` so history records the docs in their correct post-17 form at time of move. NOT a rewrite — targeted updates to stale tables, primitive counts, token values, and utility lists.

## Context

`tokens.json` today is a subset: only brand colors, dark/light background palettes, 5 font sizes, and 4 radii. The live site consumes a much richer set — 11-step type scale, full spacing tokens, motion tokens, shadow composites, z-index, opacity — all defined in `src/lib/styles/tokens.css` + `src/app.css @theme`. Before the generator can exist (17h-2), the JSON must be the canonical superset.

`colors.json` carries semantic tier (success, warning, error, info) that `tokens.json` is missing. Merge and delete.

`brand/README.md` tells readers to install fonts via Google Fonts — `src/app.html` confirms fonts are actually self-hosted via `@fontsource-variable`. Factual error, fix.

`brand/yesid_brand_guide.pdf` is 10KB of legacy PDF with 50+ repo references. Goes in this sub-slice; successor docs arrive in 17h-3.

**The extraction move** — `CONSTITUTION.md`, `CSS.md`, and `MOTION.md` have always been brand-scoped, but they've lived in `docs/reference/` since day 1. After 22+ slices, the `docs/` vs `brand/` split has clarified: brand-portable docs belong in `brand/`; site-specific process stays in `docs/`. This sub-slice ratifies the split via `git mv`, with redirect stubs at old paths so internal links keep working for one release. A decision entry (`2026-04-extracting-brand-from-docs.md`) in 17h-3 explains the reframe as part of the case study.

## Architecture

- `tokens.json` becomes the canonical superset in W3C DTCG format.
- No code consumes it yet — 17h-2 turns it into the source of truth. This sub-slice just gets the data right.
- Every leaf: `$value`, `$type`, optional `$description`.
- Composite tokens (shadows) use DTCG composite shape.
- Aliases use `{path.to.token}` — used sparingly, only where a semantic token references a brand primitive.
- `git mv` preserves file history for the three moved docs.

## Tech Stack

Plain JSON editing. `git mv`. Markdown link path fix-ups. No code changes.

## File Structure

### Modified
```
brand/tokens.json                      — EXPAND to full surface
brand/README.md                        — FIX font dependencies section
```

### Moved (git mv)
```
docs/reference/CONSTITUTION.md  →  brand/CONSTITUTION.md
docs/reference/CSS.md           →  brand/CSS.md
docs/reference/MOTION.md        →  brand/foundations/motion.md
```

### Redirect stubs (created at old paths post-move)
```
docs/reference/CONSTITUTION.md         — 3-line redirect
docs/reference/CSS.md                  — 3-line redirect
docs/reference/MOTION.md               — 3-line redirect
```

### Deleted
```
brand/colors.json                      — merged into tokens.json
brand/yesid_brand_guide.pdf            — permanently
```

### Touched (pointer updates only)
```
~50 files with references to yesid_brand_guide.pdf — point to brand/README.md
Any doc referencing docs/reference/CONSTITUTION/CSS/MOTION — internal links keep working through redirects; full retarget happens in 17h-5
```

---

## Task 1: Audit current brand value sources

Produce `brand/tokens-audit.md` (scratchpad, deleted before close). List every token currently in play across `tokens.json`, `colors.json`, `tokens.css`, `tailwind.brand.js`, `src/lib/styles/tokens.css`, `src/app.css @theme`. For each token: name, current value, source, present in `tokens.json` yes/no.

**Files:**
- Read: `brand/tokens.json`, `brand/colors.json`, `brand/tokens.css`, `brand/tailwind.brand.js`, `src/lib/styles/tokens.css`, `src/app.css`
- Create: `brand/tokens-audit.md` (temporary)

- [ ] **Step 1:** Compile canonical token list grouped by domain (color, font, size, spacing, motion, radius, shadow, z-index, opacity).
- [ ] **Step 2:** Mark every row: "in tokens.json ✓" or "missing".
- [ ] **Step 3:** Commit.
  ```bash
  git add brand/tokens-audit.md
  git commit -m "chore(slice-17h-1): brand token audit scratchpad"
  ```

**STOP.** Share audit with Yesid. Confirm gap list before JSON edits.

---

## Task 2: Expand `tokens.json` to full surface

**Files:**
- Modify: `brand/tokens.json`

- [ ] **Step 1:** Merge `colors.json` semantic tier under `yesid.color.semantic.*` (success, warning, error, info, destructive) with `$type: "color"`.
- [ ] **Step 2:** Expand type scale under `yesid.size.*` to all 11 tokens: `hero, hero-mobile, display, title, heading, subheading, body, body-lg, small, caption, mono, micro`. `$type: "dimension"`, `$value` preserves the clamp string verbatim (e.g., `"clamp(4rem, min(9vw, 11svh), 8.125rem)"`).
- [ ] **Step 3:** Add `yesid.spacing.*` — `page-x, section-y, card-gap, stack, cluster`. `$type: "dimension"`.
- [ ] **Step 4:** Add `yesid.motion.duration.*` (instant, fast, normal, slow, slower) — `$type: "duration"`. Add `yesid.motion.easing.*` (default, out, in-out, bounce, decel) — `$type: "cubicBezier"`, `$value: [x1,y1,x2,y2]`.
- [ ] **Step 5:** Add `yesid.radius.*` — include `pill` (9999px). `$type: "dimension"`.
- [ ] **Step 6:** Add `yesid.shadow.*` — `glow-sm, glow-md, glow-lg, card, section, nav`. Use DTCG composite shape where possible; fall back to string if composite gets ugly.
- [ ] **Step 7:** Add `yesid.z-index.*` — base, content, rail, sheet, menu, nav. `$type: "number"`.
- [ ] **Step 8:** Add `yesid.opacity.*` — muted, dim, subtle, faint. `$type: "number"`.
- [ ] **Step 9:** Add `$description` to non-obvious tokens.
- [ ] **Step 10:** Validate.
  ```bash
  bun --print 'JSON.parse(await Bun.file("brand/tokens.json").text())'
  ```
- [ ] **Step 11:** Diff against `brand/tokens-audit.md` — confirm zero gaps.

**STOP.** Ask Yesid to sanity-check the expanded JSON shape before 17h-2 locks it in.

---

## Task 3: Fix `brand/README.md` factual errors

**Files:**
- Modify: `brand/README.md`

- [ ] **Step 1:** Replace "Font dependencies" section. Remove the Google Fonts `<link>` snippet. New content: "Fonts are self-hosted via `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono`. See `src/app.html` and `src/routes/+layout.svelte` for loading. Zero external font requests."
- [ ] **Step 2:** Update the file table — remove `colors.json`, remove `yesid_brand_guide.pdf` (both deleted in this slice). Add `CONSTITUTION.md`, `CSS.md`, `foundations/motion.md` (moved in Task 4).
- [ ] **Step 3:** Keep it thin. 17h-3 does the full front-door rewrite.

**STOP.** Yesid confirms on disk.

---

## Task 4: Freshen CONSTITUTION / CSS / MOTION against slice-17 reality (pre-move)

**Files (edited in place at old `docs/reference/` locations):**
- `docs/reference/CONSTITUTION.md`
- `docs/reference/CSS.md`
- `docs/reference/MOTION.md`

**Principle:** targeted factual corrections only. No restructuring. Anything architectural that emerges is out of scope — capture in a devlog TODO, tackle in a follow-up slice.

**Audit checklist per file:**

### CONSTITUTION.md

- [ ] § 2 Layout Model — 4 CSS grid recipes still match what's in use (check against `src/lib/components/` usage).
- [ ] § 3 Spacing — 5 semantic tokens match `src/lib/styles/tokens.css` today.
- [ ] § 4 Typography — 11-step type scale matches `src/app.css @theme` exactly.
- [ ] § 6 Component Standards — tier counts (56 ui/, 15 brand/) match `src/lib/components/` today. Bits UI integration language post-17a-6 accurate. Card tier rules reflect 17d.
- [ ] § 8 Motion — duration + easing tokens match tokens.css. 17e motion consolidation patterns reflected (presets, factory-level reduced-motion enforcement, if adopted).
- [ ] § 9 Responsive — 5 breakpoints, viewport unit rules, 7-layer overflow guarantee.
- [ ] § 13 Atomic Design — 3 tiers, Card surface rules reflect 17d's universal Card. Anti-patterns list current.
- [ ] Any stale `17*` references retargeted or removed.
- [ ] Version / date stamps brought current.

### CSS.md

- [ ] "Last updated" date → today.
- [ ] Type scale table matches `src/app.css @theme` exactly.
- [ ] Color tokens table — every dark/light pair, every shadcn semantic token (`--card`, `--popover`, `--ring`, `--input`, `--secondary`, `--destructive`, etc.) matches `src/lib/styles/tokens.css`.
- [ ] Shadow tokens — current `--shadow-*` set with `color-mix()` usage.
- [ ] Z-index scale — 7 levels (base, content, rail, footer, sheet, menu, nav).
- [ ] Spacing tokens — 5 semantic tokens.
- [ ] Container widths — 3 tokens (content, wide, prose).
- [ ] Breakpoints — 5 canonical (sm/md/lg/xl/2xl).
- [ ] Radius tokens — 5 levels incl. pill.
- [ ] Opacity scale — 4 levels.
- [ ] Brand Primitives section — 15 primitives exact (StatusDot, SectionLabel, StopLabel, Tag, NumberBadge, ChevronToggle, HazardStripe, GlowOverlay, MetricDisplay, BrandButton, CardBase, CornerMarks, TerminalChrome, StickyPanel, GradientSeparator). Prop lists match component sources.
- [ ] Brand Utility Classes — 11 utilities in app.css (`.brand-fade-line`, `.divider-dashed`, `.scrollbar-hidden`, `.brand-glow-hover`, `.img-desat`, `.grid-responsive-cards`, `.label-section`, `.label-station`, `.label-metric`, `.prose-dark`, `.led-pulse`).
- [ ] Prose styling block reflects 17d-4 blog detail additions.
- [ ] Global keyframes — `blink`, `pulse-glow`, `station-ping`, `typewriter-blink`.

### MOTION.md

- [ ] Action catalog matches `src/lib/motion/actions/` today: `boop, reveal, magnetic, ripple, tilt, cursorGlow, scrollChain`, plus anything added in 17e.
- [ ] Any 17e motion-consolidation patterns (preset factories, factory-level reduced-motion) reflected.
- [ ] References to deleted/renamed components retargeted.
- [ ] Any `data-lenis-prevent` references updated for the `use:scrollChain` replacement (if relevant).

**Process:**

- [ ] **Step 1: Per-file drift scan.** Work through the checklist with files + repo side by side. Produce `docs/reference/{FILE}-drift.md` scratchpads listing every row to fix.
- [ ] **Step 2: Apply factual corrections** in place — no restructuring, no added sections.
- [ ] **Step 3: `bun run check`** — catches any code example in the reference docs that drifted from type signatures.
- [ ] **Step 4: Diff the freshened files.** Confirm changes are narrow (factual) not broad (architectural). If a section genuinely needs restructuring, stop and add a TODO to the devlog; do not rewrite in this task.
- [ ] **Step 5: Delete the drift scratchpads.**

**STOP.** Yesid reads each freshened doc end-to-end and confirms it reflects reality.

---

## Task 5: Move CONSTITUTION / CSS / MOTION into `brand/`

**Files:**
- Move: `docs/reference/CONSTITUTION.md` → `brand/CONSTITUTION.md`
- Move: `docs/reference/CSS.md` → `brand/CSS.md`
- Move: `docs/reference/MOTION.md` → `brand/foundations/motion.md`
- Create: redirect stubs at old paths

- [ ] **Step 1:** Ensure `brand/foundations/` exists.
  ```bash
  mkdir -p brand/foundations
  ```
- [ ] **Step 2:** `git mv` the three files.
  ```bash
  git mv docs/reference/CONSTITUTION.md brand/CONSTITUTION.md
  git mv docs/reference/CSS.md brand/CSS.md
  git mv docs/reference/MOTION.md brand/foundations/motion.md
  ```
- [ ] **Step 3:** Create 3-line redirect stubs at the old paths.
  Example for CONSTITUTION:
  ```md
  # Moved

  This document moved to [`brand/CONSTITUTION.md`](../../brand/CONSTITUTION.md) in Slice 17h. Brand-portable reference material lives in `brand/`; site-specific process stays in `docs/`.
  ```
- [ ] **Step 4:** Audit internal cross-links in the three moved files.
  ```bash
  grep -n "docs/reference\|\.\./reference\|\.\./\.\./" brand/CONSTITUTION.md brand/CSS.md brand/foundations/motion.md
  ```
  Fix any relative paths broken by the move. Before: `../reference/CSS.md`. After: `./CSS.md` (for CONSTITUTION.md → CSS.md link).
- [ ] **Step 5:** Verify renders in a Markdown preview.
  - Redirect stub at `docs/reference/CONSTITUTION.md`: click-through to `brand/CONSTITUTION.md` works.
  - `brand/CONSTITUTION.md` content intact, internal links resolve.
  - Same for CSS.md + motion.md.

**STOP.** Yesid confirms the three moved files read correctly AND the redirects work.

---

## Task 6: Delete legacy files + retarget references

**Files:**
- Delete: `brand/yesid_brand_guide.pdf`, `brand/colors.json`
- Modify: every `.md`, `.ts`, `.svelte` that references the PDF or `colors.json`

- [ ] **Step 1:** Find all PDF references.
  ```bash
  grep -rn "yesid_brand_guide.pdf" --include="*.md" --include="*.ts" --include="*.svelte"
  ```
  Expected: 50+ hits (`project_brand_digital_infra.md`, `CLAUDE.md` Brand section, various specs).
- [ ] **Step 2:** Find all `colors.json` references.
  ```bash
  grep -rn "colors.json" --include="*.md" --include="*.ts" --include="*.js"
  ```
- [ ] **Step 3:** Replace every PDF reference with `brand/README.md` (BRAND.md doesn't exist yet; 17h-5 re-routes to BRAND.md once 17h-3 creates it).
- [ ] **Step 4:** Replace every `colors.json` reference with `brand/tokens.json`.
- [ ] **Step 5:** Delete the files.
  ```bash
  rm brand/yesid_brand_guide.pdf brand/colors.json
  ```

**STOP.** Yesid confirms nothing points to deleted files.

---

## Task 7: Remove `brand/tokens-audit.md` scratchpad

**Files:**
- Delete: `brand/tokens-audit.md`

- [ ] **Step 1:** Confirm Task 2 covered every gap row.
- [ ] **Step 2:** Delete scratchpad.
  ```bash
  rm brand/tokens-audit.md
  git add -A && git commit -m "chore(slice-17h-1): remove audit scratchpad"
  ```
- [ ] **Step 3:** Run `bun run test` + `bun run check`. Both green (no code changed).

**STOP.** 17h-1 complete. Yesid approves before 17h-2 starts.

---

## Execution Order

Tasks 1→2→3→4→5→6→7, strictly sequential. Each STOP is mandatory.

Task 4 (freshening) is the newly-added scope — typically spans its own session. The move (Task 5) should be a discrete commit AFTER freshening lands so the git history shows the docs in their correct post-17 state at move time.

## Out of Scope

- Generator implementation (that's 17h-2).
- Narrative docs (that's 17h-3).
- Source-of-truth refactor of CLAUDE.md, WORKFLOW.md, PLAN.md, root README (that's 17h-5).
- Renaming existing `tokens.json` schema keys (keep `yesid.color.brand.primary` shape).
- **Restructuring** CONSTITUTION/CSS/MOTION (Task 4 does targeted factual freshening only; architectural rewrites are a separate slice).

## Acceptance Criteria

- [ ] `brand/tokens.json` contains every brand value the site uses today, DTCG-compliant.
- [ ] No `$type` is undefined. No `$value` is missing.
- [ ] `brand/colors.json` deleted.
- [ ] `brand/yesid_brand_guide.pdf` deleted; every referencing doc points to `brand/README.md`.
- [ ] `brand/README.md` Font Dependencies section is factually correct (`@fontsource-variable`, not Google Fonts).
- [ ] `brand/CONSTITUTION.md`, `brand/CSS.md`, `brand/foundations/motion.md` exist with **freshened** content reflecting slice-17 reality; internal cross-links resolve; Yesid has read each end-to-end.
- [ ] `docs/reference/CONSTITUTION.md`, `CSS.md`, `MOTION.md` are 3-line redirect stubs.
- [ ] `bun run test` + `bun run check` green.
- [ ] Site renders identically — `tokens.json` not yet consumed, moved docs are content-only.

## Learn

### W3C Design Tokens format
**What it is:** `{ "group": { "token": { "$value": "...", "$type": "color" } } }`. Aliases: `{group.token}`. Composites (shadow): `$value` is an object.
**Why it matters:** It's the portable spec every tool is converging on.
**Try this:** Open your expanded `tokens.json` and trace one token — say `yesid.color.brand.primary` — through every output file it will populate in 17h-2.
**Go deeper:** https://www.designtokens.org/tr/drafts/

### `git mv` preserves history
**What it is:** `git mv old new` records the file as a rename rather than a delete + add. `git log --follow` traces history across the move.
**Why it matters:** Moved docs keep their blame, their history, their provenance — important for CONSTITUTION.md which carries 22 slices of evolution.
**Try this:** After Task 4, run `git log --follow brand/CONSTITUTION.md`. You should see commits from when the file was at `docs/reference/CONSTITUTION.md`.

### Brand vs docs: the portability test
**What it is:** A reference doc is brand-portable if you could paste it into a new project and it would still make sense. Site-specific docs reference routes, components, or workflow that only exist here.
**Why it matters:** CONSTITUTION codifies rules that apply to any yesid-branded product. ARCHITECTURE describes THIS SvelteKit codebase.
**Try this:** After Task 4, open `brand/CONSTITUTION.md`. Does any line only make sense *because of* `src/`? If so, that line should move back to `docs/reference/ARCHITECTURE.md`.

## Verify

1. `cat brand/tokens.json | jq .` parses cleanly.
2. `ls brand/` shows: `README.md`, `CONSTITUTION.md`, `CSS.md`, `tokens.json`, `tokens.css`, `tailwind.brand.js`, `logos/`, `foundations/motion.md` (no PDF, no `colors.json`).
3. `cat docs/reference/CONSTITUTION.md` shows a redirect stub, not content.
4. `cat brand/CONSTITUTION.md` shows the real content.
5. `git log --follow brand/CONSTITUTION.md` shows history from the old path.
6. `grep -r "yesid_brand_guide.pdf" docs/ CLAUDE.md` returns zero hits.
7. `grep -r "colors.json" docs/ src/ CLAUDE.md` returns zero hits outside `brand/`.
8. `bun run test` + `bun run check` pass.
