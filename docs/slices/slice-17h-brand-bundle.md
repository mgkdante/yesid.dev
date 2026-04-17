# Slice 17h — Brand Bundle + Source-of-Truth Refactor

**Status:** draft
**Priority:** 2
**Estimated effort:** 10–11 sessions across 6 sub-slices (17h-1 grew to 2–3 sessions once pre-move drift-freshening was added)
**Depends on:** Slice 17e (motion consolidation) merged to `main`
**Parent slice:** 17 (Standardization). 17h is the visual-design close — the bookend to 17a (tokens + primitives), 17a-5 (spacing + constitution), 17d (component API), 17e (motion). Slice 18 remains reserved for Payload CMS in the separate `yesid.dev-cms` repo.

## Objective

Turn `brand/` into the generator-driven single source of truth for the yesid. brand, extract brand-portable reference docs (`CONSTITUTION.md`, `CSS.md`, `MOTION.md`) from `docs/reference/` into `brand/`, and refactor every doc (CLAUDE.md, WORKFLOW.md, PLAN.md, root README, specs/plans templates) to reflect the new reality. Editing `brand/tokens.json` becomes the only path to change any brand value, and `brand/` ships as a clonable starter kit for future projects.

## Context

Three problems converge in this sub-slice:

1. **Token drift.** `brand/tokens.json` is stale and incomplete; the live `src/lib/styles/tokens.css` + `src/app.css @theme` are the real source of truth, hand-edited.
2. **Brand-as-product.** Yesid is using `brand/` as a portfolio artifact for Alto / CDPQ Infra hiring managers. Today it's a dev dump: an outdated README, a legacy PDF, no narrative.
3. **Docs/brand entanglement.** Reference docs that are *about the brand* (CONSTITUTION, CSS, MOTION) live in `docs/reference/` next to site-specific docs (ARCHITECTURE, WORKFLOW, PATTERNS). After 22+ slices of pattern-capture, the split between brand-portable and site-specific has become clear. Workflow has matured; `brand/` is where the extracted portable essence belongs.

**Path A (locked 2026-04-17):** no Figma, no Code Connect. Claude Design is the primary design consumer. Bundle ships three portable formats: W3C DTCG JSON, CSS custom properties, markdown.

**Constitution reframing:** `CONSTITUTION.md` is a brand artifact. It codifies layout, typography, motion, and a11y rules that *are* the brand — not just code governance. It moves into `brand/` in 17h-1. The `decisions/why-a-constitution.md` entry documents this reframe as part of the case study.

## Architecture

- `brand/tokens.json` is the one editable file for every brand value.
- `brand/scripts/generate.ts` emits 4 outputs: `brand/tokens.css`, `src/lib/styles/tokens.css`, `src/app.css @theme` partial (marker-bracketed), `brand/tailwind.brand.js`, `src/lib/brand.ts`.
- Generated files are committed; CI `verify.ts` fails on drift.
- Brand-portable reference docs move into `brand/`: `CONSTITUTION.md`, `CSS.md`, `foundations/motion.md`. Old paths in `docs/reference/` become 3-line redirect stubs.
- `brand/foundations/*.md` (color, typography, space, motion, voice, accessibility) + `BRAND.md` + `decisions/*.md` carry the narrative.
- `brand/logos/` gains lockups, clearspace, don'ts; `brand/examples/` pairs screenshots with source for LLM grounding.
- CLAUDE.md, WORKFLOW.md, PLAN.md, standardization.md, root README updated to reflect the `brand/` vs `docs/` split.
- `brand/colors.json` and `brand/yesid_brand_guide.pdf` deleted.

Full architecture + ADRs in `docs/specs/2026-04-17-slice-17h-brand-bundle-design.md`.

## Tech Stack

Bun + TypeScript (generator), W3C DTCG JSON, CSS custom properties, Tailwind v4 `@theme`, Sharp (SVG→PNG exports), Vitest (generator tests). Zero new runtime dependencies on the site.

## Sub-slices

| # | Name | Sessions | Spec |
|---|------|----------|------|
| 17h-1 | Tokens consolidation + pre-move drift-freshening + brand-ref extraction | 2–3 | [slice-17h-1-tokens-consolidation.md](slice-17h-1-tokens-consolidation.md) |
| 17h-2 | Code generator (`bun run brand:generate`) | 2 | [slice-17h-2-code-generator.md](slice-17h-2-code-generator.md) |
| 17h-3 | Narrative docs + case study (incl. constitution + extraction decisions) | 2 | [slice-17h-3-narrative-docs.md](slice-17h-3-narrative-docs.md) |
| 17h-4 | Logo + asset expansion | 1 | [slice-17h-4-logo-assets.md](slice-17h-4-logo-assets.md) |
| 17h-5 | Source-of-truth refactor (CLAUDE, WORKFLOW, PLAN, root README + pointers) | 1–2 | [slice-17h-5-source-of-truth.md](slice-17h-5-source-of-truth.md) |
| 17h-6 | `bun run brand:sync` orchestrator + CI verify | 1 | [slice-17h-6-sync-orchestrator.md](slice-17h-6-sync-orchestrator.md) |

## File Structure

### New files (top-level)

```
brand/BRAND.md                                — voice + 5 principles
brand/CONSTITUTION.md                         — MOVED from docs/reference/
brand/CSS.md                                  — MOVED from docs/reference/
brand/foundations/{color,typography,space,motion,voice,accessibility}.md
brand/logos/{lockup-horizontal,lockup-stacked,clearspace,donts}.svg
brand/logos/exports/                          — PNG 1x/2x/3x
brand/components.md                           — primitive inventory
brand/examples/                               — paired screenshots + source
brand/decisions/2026-04-*.md                  — 6 seed entries
brand/scripts/{generate,sync,verify,export-logos,export-examples}.ts
brand/scripts/__tests__/*.test.ts
src/lib/brand.ts                              — generated types + tokenMap
```

### Modified files

```
brand/README.md                               — rewritten as front-door
brand/tokens.json                             — expanded to full surface
brand/tokens.css                              — now GENERATED
brand/tailwind.brand.js                       — now GENERATED
src/lib/styles/tokens.css                     — now GENERATED
src/app.css                                   — marker-bracketed @theme partial
package.json                                  — brand:* scripts
.github/workflows/*.yml                       — brand:verify step
CLAUDE.md                                     — Brand + CSS sections → pointers
docs/reference/ARCHITECTURE.md                — CSS Architecture → link
docs/reference/WORKFLOW.md                    — brand/ vs docs/ rule + ecosystem table
docs/roadmap/PLAN.md                          — add 17h row + retro paragraph
docs/roadmap/standardization.md               — add 17h row
README.md (project root)                      — thin edit: pointer to brand/
docs/slices/_TEMPLATE.md                      — remove inline brand values
```

### Redirect stubs (at old paths post-move)

```
docs/reference/CONSTITUTION.md                — redirects to brand/CONSTITUTION.md
docs/reference/CSS.md                         — redirects to brand/CSS.md
docs/reference/MOTION.md                      — redirects to brand/foundations/motion.md
```

### Deleted files

```
brand/colors.json                             — merged into tokens.json
brand/yesid_brand_guide.pdf                   — permanently
```

### Reused (no changes needed)

```
brand/logos/{wordmark,monogram}-{dark,light,orange}.svg
brand/logos/favicon.svg
```

## Execution Order

```
17h-1 ──► 17h-2 ──► 17h-3 ──┐
   │                         │
   └──► 17h-4 ───────────────┤
                             ├──► 17h-5 ──► 17h-6
                             │
          (17h-4 only needs tokens.json + moves stable — parallel-safe with 17h-3)
```

Parallelizable (with Yesid's approval only): 17h-3 + 17h-4 after 17h-1.
Sequential by necessity: 17h-1 first, 17h-5 after 17h-1+17h-2+17h-3, 17h-6 last.

## Out of Scope

- Figma files or library (Path A locked).
- Claude Design live MCP integration (not shipped yet).
- Light-theme site launch (separate future slice).
- New brand colors or palette redesign.
- Payload CMS (Slice 18, separate repo).
- Component API changes (`components.md` is read-only inventory).
- Accessibility audit (`foundations/accessibility.md` documents current posture only).
- External npm publish.
- Public-launch narrative rewrite of root README (future slice — this one does a thin pointer edit).

## Acceptance Criteria

- [ ] Editing `brand/tokens.json` + `bun run brand:sync` is the ONLY path to change a brand value.
- [ ] `bun run brand:verify` in CI passes on clean, fails on drift.
- [ ] `grep -rn "#E07800"` outside `brand/`, generated files, and historical `docs/devlog/` / `docs/handoffs/` returns zero hits.
- [ ] `brand/colors.json` and `brand/yesid_brand_guide.pdf` deleted.
- [ ] `brand/CONSTITUTION.md`, `brand/CSS.md`, `brand/foundations/motion.md` exist; old paths are redirects.
- [ ] `brand/decisions/` has 6 dated seed entries (orange, edge-to-edge, why-a-constitution, extracting-brand-from-docs, what-i-killed, path-a-no-figma).
- [ ] CLAUDE.md Brand + CSS sections are pointers, not duplicated values.
- [ ] `docs/reference/WORKFLOW.md` explicitly states the `brand/` vs `docs/` rule.
- [ ] `docs/roadmap/PLAN.md` and `docs/roadmap/standardization.md` reflect 17h.
- [ ] Root `README.md` has a brief pointer to `brand/`.
- [ ] Site renders identically before/after — zero runtime behavior change.
- [ ] `bun run test` + `bun run check` green.
- [ ] A non-technical reader opens `brand/README.md` and understands the system in under 90 seconds.
- [ ] Fresh clone of `brand/` into a sibling directory parses standalone (no broken `../docs/` references).

## Learn

### The brand/docs split
**What it is:** Reference material that's portable across future projects (tokens, constitution, motion language, voice) lives in `brand/`. Reference material specific to *this site* (ARCHITECTURE, PATTERNS, WORKFLOW, TESTS) lives in `docs/reference/`.
**Why it matters:** A brand is a product. If you start "yesid-client-X" tomorrow, you clone `brand/`, swap tokens, inherit the constitution. You don't clone `docs/` — that's site-specific process and history.
**Try this:** After 17h-1 moves, try to imagine a new repo. Paste `brand/` in. Does it work? Anything broken is an implicit `brand/ → docs/` dependency that shouldn't exist.
**Go deeper:** Primer's `primer/primitives` (tokens), `primer/design` (narrative), `primer/octicons` (icons) — three separable packages. Our `brand/` collapses the pattern for one person.

### W3C Design Tokens (DTCG)
**What it is:** `{ "group": { "token": { "$value": "...", "$type": "color" } } }`. Aliases: `{group.token}`. Composites (shadow): `$value` is an object.
**Why it matters:** The emerging standard. Figma Tokens Studio, Claude Design, Style Dictionary all read it.
**Try this:** After 17h-1, trace one token — `yesid.color.brand.primary` — through every output it will populate in 17h-2.
**Go deeper:** https://www.designtokens.org/tr/drafts/

### Constitution as brand artifact
**What it is:** A governance document that codifies layout, typography, motion, and a11y rules. Not a code style guide — a rules document for how the brand behaves in pixels.
**Why it matters:** A brand isn't just color and type. It's how sections space, how motion feels, how layout decisions get made. If those rules aren't codified, they drift.
**Try this:** After 17h-1 moves, read `brand/CONSTITUTION.md` as a new designer arriving. Does it tell you how yesid.dev *feels*, not just how it's coded? If not, the reframe needs more work in 17h-3's foundations docs.

### Generator-driven design systems
**What it is:** One input file → many output formats via a deterministic script. No hand-syncing. Diffs tell the story.
**Why it matters:** This is how Polaris, Primer, Carbon ship tokens. The generator codifies the pattern so future collaborators can't break the link between source and output.
**Try this:** After 17h-2, change `yesid.color.brand.primary` from `#E07800` to `#E08000`. Run `bun run brand:sync`. Diff the generated files. Watch the change propagate.

### Decision records as case study
**What it is:** Dated short-form posts explaining *why* a design-system choice was made. `decisions/2026-04-why-orange.md`, not a changelog.
**Why it matters:** Solo brands don't publish these — which makes your `decisions/` folder the differentiator for hiring managers and clients.
**Try this:** After 17h-3, read the 6 seed decisions end-to-end. Ask: would a hiring manager at Alto click "next"? If no, the tone is wrong.
**Go deeper:** https://adr.github.io/

## Verify

1. From a clean branch, run `bun run brand:sync`. Every file regenerates; `git status` shows expected changes or nothing.
2. Edit `brand/tokens.json` — change `yesid.color.brand.primary` from `#E07800` to something else. Run `bun run brand:sync`. Confirm diffs appear in: `brand/tokens.css`, `src/lib/styles/tokens.css`, `src/app.css` (inside markers), `brand/tailwind.brand.js`, `src/lib/brand.ts` — and nowhere else.
3. Revert. Run `bun run brand:verify`. Exit 0.
4. Hand-edit a generated file. Run `bun run brand:verify`. Exit 1 with clear diff message.
5. `grep -rn "#E07800" docs/ CLAUDE.md src/` — zero hits outside generated files and historical logs.
6. `cat docs/reference/CONSTITUTION.md` — shows the redirect stub, not content.
7. `cat brand/CONSTITUTION.md` — shows the real content.
8. Open `brand/README.md` — non-technical reader understands the system in 90 seconds.
9. Open `brand/decisions/2026-04-why-a-constitution.md` — reads as senior-engineer case-study prose.
10. Copy `brand/` into a scratch directory. Open `brand/README.md` there. No broken links to `../docs/`.
