# Slice 17h-4 — Logo + Asset Expansion

**Status:** draft (updated 2026-04-18 for the 17h scope shrink — see parent slice)
**Priority:** 2
**Estimated effort:** 1 session
**Depends on:** standalone — `brand/` folder already exists on main; 17h-1 dependency dropped when 17h-1 was killed 2026-04-18
**Parent:** `docs/slices/slice-17h-brand-bundle.md`

## Objective

Expand `brand/logos/` with lockups, clearspace diagram, and a "don'ts" grid. Automate PNG exports at 1x/2x/3x. Set up `brand/examples/` with 3–5 paired screenshot + source files — the visual grounding data Claude Design (and any future vision-LLM design tool) uses to understand the brand in context.

## Context

Today `brand/logos/` has six SVGs: wordmark-dark, wordmark-light, monogram-dark, monogram-light, monogram-orange, favicon. Missing for a case-study-grade brand kit:

- **Lockups** — pre-composed compositions designers need (horizontal + stacked).
- **Clearspace diagram** — the minimum whitespace rule as a diagram, not just a sentence.
- **Don'ts grid** — the six things you should never do to the wordmark, visualized.
- **PNG exports** — every logo in 1x/2x/3x for consumers who can't use SVG.
- **Examples** — paired screenshot + source pairs that ground an LLM's understanding of how the brand renders in context.

Sharp handles SVG→PNG without a browser; Playwright handles paired screenshots from the running dev server.

## Architecture

Two export scripts, both idempotent:

- `brand/scripts/export-logos.ts` — reads every `.svg` under `brand/logos/`, emits `{name}-1x.png`, `{name}-2x.png`, `{name}-3x.png` into `brand/logos/exports/`.
- `brand/scripts/export-examples.ts` — starts the dev server via Claude Preview / Playwright, navigates to configured surfaces, screenshots at 1440px + 375px, extracts the component source subset, writes paired files to `brand/examples/`.

Both scripts run independently via `bun run brand:export-logos` / `bun run brand:export-examples`. They are NOT wired into a `brand:sync` orchestrator — 17h-6 was killed in the 2026-04-18 scope shrink; there is no orchestrator.

## Tech Stack

Bun, Sharp, Playwright MCP (or Claude Preview). No new runtime site deps.

## File Structure

### New
```
brand/logos/lockup-horizontal.svg      — CREATE
brand/logos/lockup-stacked.svg         — CREATE
brand/logos/clearspace.svg             — CREATE
brand/logos/donts.svg                  — CREATE
brand/logos/exports/                   — CREATE (populated by script)
brand/examples/                        — CREATE (populated by script)
brand/scripts/export-logos.ts          — CREATE
brand/scripts/export-examples.ts       — CREATE
```

### Modified
```
package.json                           — ADD "brand:export-logos", "brand:export-examples"
```

---

## Task 1: Create 4 new SVGs

**Files:** `brand/logos/{lockup-horizontal,lockup-stacked,clearspace,donts}.svg`.

- [ ] **Step 1: `lockup-horizontal.svg`** — monogram + wordmark side-by-side. Gap = lowercase-y height (per existing clearspace rule in README). Use existing monogram + wordmark paths; don't invent new geometry.
- [ ] **Step 2: `lockup-stacked.svg`** — wordmark centered over tagline "Digital infrastructure that moves." in `JetBrains Mono`. Match type scale `--text-caption` (currently 0.75rem / 12px — see `src/app.css @theme`).
- [ ] **Step 3: `clearspace.svg`** — wordmark in center, dashed boundary at y-height distance on all 4 sides, labeled "y-height" with an arrow. 800×400 viewBox.
- [ ] **Step 4: `donts.svg`** — 2×3 grid, 6 cells. Each cell: a miniature wordmark with a transformation applied (stretched, rotated, recolored dot, outlined, dropshadowed, non-lowercase) plus a red slash overlay. 1200×800 viewBox. Label each cell with the broken rule.
- [ ] **Step 5: Authoring choice.**
  - Option A: hand-author in a vector editor (Figma-free — use Inkscape, SVG-Edit, or raw SVG).
  - Option B: experiment with Claude Design — prompt it to generate lockups + don'ts grid. This is a good first test of the new tool's output.
  - Document which was used in the devlog for the case-study narrative.
- [ ] **Step 6: Flat SVGs only.**
  - No embedded rasters.
  - `<title>` and `<desc>` tags for accessibility.
  - `currentColor` for any non-brand-orange ink so the SVGs theme-switch.
  - Strip metadata / comments from editors.

**STOP. Yesid approves the 4 SVGs visually.**

---

## Task 2: `brand/scripts/export-logos.ts` via Sharp

**Files:**
- Create: `brand/scripts/export-logos.ts`
- Modify: `package.json` (add `"brand:export-logos": "bun brand/scripts/export-logos.ts"`)
- Populate: `brand/logos/exports/`

- [ ] **Step 1:** `sharp` installed as a dev dep — `bun add -d sharp`. Document in devlog.
- [ ] **Step 2:** Script logic —
  - Glob `brand/logos/*.svg` (top level only, skip `exports/`).
  - For each SVG, emit `{basename}-1x.png` (256px wide), `{basename}-2x.png` (512px), `{basename}-3x.png` (1024px).
  - Preserve transparency.
  - Use `sharp(buf).resize({ width }).png().toFile(out)`.
- [ ] **Step 3: Idempotent** — same input → same output. Skip write if content hash matches.
- [ ] **Step 4:** Run `bun run brand:export-logos`. Expected: 10 logos × 3 sizes = 30 PNGs under `brand/logos/exports/`.
- [ ] **Step 5:** Spot-check crispness at each size (open a few in a viewer).

**STOP. Yesid verifies exports folder.**

---

## Task 3: `brand/scripts/export-examples.ts` + paired examples

**Files:**
- Create: `brand/scripts/export-examples.ts`
- Modify: `package.json` (`"brand:export-examples": "bun brand/scripts/export-examples.ts"`)
- Create: 3–5 `brand/examples/{name}-{viewport}.png` + `{name}-{viewport}.svelte.txt` pairs

- [ ] **Step 1: Pick 3–5 surfaces** that span the brand:
  - `hero-1440` — home hero (typography showcase + orange dot).
  - `hero-375` — mobile hero.
  - `services-1440` — services listing (edge-to-edge layout).
  - `blog-row-1440` — blog listing (card surface + hover).
  - `contact-terminal-1440` — contact page (terminal chrome + mono type).
  - Criteria: exercise typography scale, cover dark theme, mix Tier 1 + Tier 2 components.
- [ ] **Step 2: Screenshot logic** — use Playwright MCP or Claude Preview to:
  - Start the dev server (`bun run dev` already running, or spawn).
  - Navigate to each surface.
  - Resize viewport to 1440×900 (desktop) or 375×667 (mobile).
  - Take full-surface screenshot into `brand/examples/{name}-{viewport}.png`.
- [ ] **Step 3: Source extraction** — for each screenshot, identify the component file(s) that render it. Write a subset to `brand/examples/{name}-{viewport}.svelte.txt`:
  - The relevant template block.
  - The relevant `<style>` block.
  - No imports or data-layer wiring — just the rendered-output-relevant code.
- [ ] **Step 4: Opus-reading test** — open a fresh Claude chat. Upload one paired `.png` + `.svelte.txt`. Ask "what brand rules does this demonstrate?" — should extract orange, Inter, edge-to-edge, dark theme, mono annotations without prompting.

**STOP. Yesid approves the surface list and the Opus extraction.**

---

## Execution Order

Tasks 1 → 2 → 3. Task 2 can start in parallel with Task 3 if Task 1's SVGs are complete and dev server is running.

## Out of Scope

- Animated GIF / video examples (static PNG only).
- WebP / AVIF PNG alternatives (PNG only for this slice — see open question #6 in design spec).
- Figma exports of any kind (Path A locked — no Figma).
- Brand asset licensing / usage agreements (documented in BRAND.md, not generated).

## Acceptance Criteria

- [ ] `brand/logos/` has 4 new SVGs: lockup-horizontal, lockup-stacked, clearspace, donts.
- [ ] Every SVG has `<title>` + `<desc>`, is flat (no embedded rasters), uses `currentColor` where appropriate.
- [ ] `brand/logos/exports/` has 30 PNGs (10 logos × 3 sizes).
- [ ] `brand/examples/` has 3–5 `.png` + `.svelte.txt` pairs.
- [ ] `bun run brand:export-logos` and `bun run brand:export-examples` run cleanly and are idempotent.
- [ ] Sharp added to `package.json` dev deps.
- [ ] `bun run test` + `bun run check` green.

## Learn

### SVG as the native brand format
**What it is:** Vector-only assets with `<title>`, `<desc>`, and `currentColor`. Theme-switchable, resolution-independent, screen-reader-friendly.
**Why it matters:** A PNG is a one-size export; an SVG is the source. Your `brand/logos/` ships sources; `exports/` ships derivatives.
**Try this:** After Task 1, open one of your SVGs in a text editor. Every tag should be readable — no binary, no embedded raster.
**Go deeper:** https://svgwg.org/svg2-draft/

### Paired-example grounding for vision LLMs
**What it is:** A model that sees an image + the code that produced it learns the rule faster than from either alone. Screenshot + source.txt = grounded rule extraction.
**Why it matters:** Claude Design (and any vision LLM) will use `brand/examples/` to understand *how* the brand renders, not just what the tokens say. Code alone is abstract; image alone is ambiguous.
**Try this:** After Task 3, open one pair in Claude chat. Ask "what typography rules does this demonstrate?" Should hit the scale, the weight, the letter-spacing.

## Verify

1. `ls brand/logos/*.svg | wc -l` — at least 10 (6 existing + 4 new).
2. `ls brand/logos/exports/*.png | wc -l` — at least 30.
3. `ls brand/examples/` — 3–5 paired `.png` + `.svelte.txt`.
4. `bun run brand:export-logos` runs in under 10 seconds.
5. Second run of `brand:export-logos` is a no-op (content-hash skip).
6. Opus-reading test passes on at least one example pair.
