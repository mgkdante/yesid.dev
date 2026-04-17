# Slice 17h — Brand Bundle (Narrative + Assets)

**Status:** draft
**Priority:** 2
**Estimated effort:** ~3 sessions across 2 sub-slices (scope shrunk 2026-04-18 — see below)
**Depends on:** Slice 17a-4 merged to `main`
**Parent slice:** 17 (Standardization). 17h is the visual-design close — the bookend to 17a (tokens + primitives), 17a-5 (spacing + constitution), 17d (component API), 17e (motion). Slice 18 remains reserved for Payload CMS in the separate `yesid.dev-cms` repo.

## Scope shrink — 2026-04-18

The original 17h plan (10-11 sessions, 6 sub-slices) treated `brand/` as a generator-driven source-of-truth that would *own* tokens, CSS governance, and motion docs. That's been walked back.

**New rule (locked 2026-04-18):** `brand/` contains non-tech info and assets only. Narrative, principles, decisions, foundations write-ups, logos, screenshots. Nothing executable, no tokens, no generated files.

**Governance model:** `brand/` governs by convention, not automation. A brand decision captured in `brand/foundations/color.md` or `brand/decisions/*.md` is advisory — translating it into code (token edits, CSS changes, Tailwind theme updates) requires a dev or another channel (design critique, PR review). No script keeps them in sync; discipline does.

**Why the shrink:** physical separation between `brand/` (intent) and `src/` / `docs/reference/` (implementation + governance) makes it harder to break one while editing the other. A generator closes the gap fast but also makes a bad edit propagate fast. Manual translation is slower and safer.

**What died under the new rule:**

| Sub-slice (obsolete) | Why dead |
|---|---|
| 17h-1 Tokens consolidation + CONSTITUTION/CSS/MOTION move | Tokens stay in `src/lib/styles/tokens.css`; governance docs stay in `docs/reference/` |
| 17h-2 Code generator | No generator needed; nothing to generate |
| 17h-5 Source-of-truth refactor (CLAUDE/WORKFLOW/PLAN pointers) | Inline brand values remain valid in those docs; no cross-file pointer rewrite |
| 17h-6 `bun run brand:sync` orchestrator | Nothing to orchestrate |

Each of those sub-slice specs was stubbed in place with an OBSOLETE note on 2026-04-18.

**What survives (this slice):**

| Sub-slice | Name | Sessions | Spec |
|---|---|---|---|
| 17h-3 | Narrative docs + case study | 2 | [slice-17h-3-narrative-docs.md](slice-17h-3-narrative-docs.md) |
| 17h-4 | Logo + asset expansion | 1 | [slice-17h-4-logo-assets.md](slice-17h-4-logo-assets.md) |

## Objective

Turn `brand/` into a readable, portable, case-study-grade narrative package — principles + decisions + foundations write-ups + logos + paired screenshots. Optimized for both a hiring manager skimming the front door and an LLM grounding itself in brand context. Zero runtime code, zero generated files, zero tooling dependency.

## Context

Three problems converge in this slice (reshaped 2026-04-18):

1. **Brand-as-product.** Yesid is using `brand/` as a portfolio artifact for Alto / CDPQ Infra hiring managers. Today it's a dev dump: an outdated README, a legacy PDF, no narrative. 17h writes the missing narrative.
2. **LLM-readable brand context.** Claude Design (shipped 2026-04-17) consumes brand docs as text/vision heuristically. Paired `brand/foundations/*.md` + `brand/examples/*.png` + `.svelte.txt` files ground any vision LLM's understanding.
3. **The gap left by the shrink.** Without a generator enforcing token/CSS sync, `brand/foundations/color.md` and `src/lib/styles/tokens.css` can drift. The `decisions/*.md` folder plus manual PR review is the only enforcement. That's fine for a solo brand — the cost of enforcement beats the cost of drift at this scale.

## Architecture

- **`brand/` contents:** narrative markdown (README, BRAND, foundations, components, decisions) + vector assets (logos, lockups, clearspace, don'ts) + paired examples (PNG + source snippets).
- **No generated files.** Every file is hand-authored (except the PNG exports + example screenshots from 17h-4's scripts).
- **No cross-compilation to `src/`.** Nothing in `brand/` emits into `src/`; nothing in `src/` imports from `brand/`. The two trees are physically separate; the relationship is documentary.
- **Governance loop:** brand decision → captured in `brand/decisions/*.md` → dev translates to `src/` (tokens, components) and `docs/reference/` (CONSTITUTION, CSS) → PR review verifies the translation matches the decision.
- **`docs/reference/CONSTITUTION.md`, `CSS.md`, `MOTION.md` stay where they are.** Not moved. Reference docs inside `brand/` cross-link *out* to them (`../docs/reference/CONSTITUTION.md`) when they need to cite authoritative rules.

## Tech Stack

Markdown + SVG + PNG (Sharp for exports). One Bun/TS script for PNG batch-export (17h-4); one for paired-example screenshots. Zero new runtime dependencies on the site.

## File Structure

### New files

```
brand/BRAND.md                                — voice + 5 principles
brand/foundations/color.md                    — narrative: how we think about color; cross-links to docs/reference/CSS.md
brand/foundations/typography.md               — narrative: Inter + JetBrains Mono, scale, usage
brand/foundations/space.md                    — narrative: spacing scale, layout recipes
brand/foundations/motion.md                   — narrative: motion language; cross-links to docs/reference/MOTION.md
brand/foundations/voice.md                    — narrative: tone, vocabulary, phrasings
brand/foundations/accessibility.md            — narrative: posture; cross-links to docs/reference/CONSTITUTION.md §7
brand/components.md                           — primitive inventory (ui/ + brand/), read-only
brand/examples/                               — paired screenshots + source (3–5 pairs)
brand/decisions/2026-04-why-orange.md
brand/decisions/2026-04-why-edge-to-edge.md
brand/decisions/2026-04-why-a-constitution.md
brand/decisions/2026-04-what-i-killed.md
brand/logos/lockup-horizontal.svg
brand/logos/lockup-stacked.svg
brand/logos/clearspace.svg
brand/logos/donts.svg
brand/logos/exports/                          — PNG 1x/2x/3x per logo (from script)
brand/scripts/export-logos.ts                 — Sharp-based batch PNG export
brand/scripts/export-examples.ts              — Playwright paired-screenshot script
```

### Modified files

```
brand/README.md                               — rewritten as front-door
brand/colors.json                             — DELETED (superseded by brand/foundations/color.md narrative; raw values live in src/lib/styles/tokens.css)
brand/yesid_brand_guide.pdf                   — DELETED (superseded by markdown narrative)
package.json                                  — adds "brand:export-logos", "brand:export-examples" scripts
```

### Not touched (explicitly left where they are)

```
src/lib/styles/tokens.css                     — token values stay here
src/app.css @theme                            — Tailwind integration stays here
docs/reference/CONSTITUTION.md                — governance stays here
docs/reference/CSS.md                         — token lookup + architecture stays here
docs/reference/MOTION.md                      — motion language stays here
CLAUDE.md                                     — inline brand values stay; no pointer rewrite
docs/reference/WORKFLOW.md                    — unchanged
docs/roadmap/PLAN.md                          — unchanged beyond the 17h roadmap row
README.md (project root)                      — unchanged
```

## Execution Order

```
17h-3 (Narrative) ──┐
                    ├──► Slice 17h closes
17h-4 (Assets) ─────┘
```

17h-3 and 17h-4 are fully independent. Either order works. Parallel is possible with explicit approval (not default).

## Out of Scope

- Figma files or library (Path A locked from the original 17h design spec — unchanged).
- Claude Design live MCP integration (not shipped yet).
- Light-theme site launch.
- New brand colors or palette redesign.
- Payload CMS (Slice 18, separate repo).
- Component API changes (`components.md` is read-only inventory).
- Accessibility audit (`foundations/accessibility.md` documents current posture only).
- Token generator + source-of-truth automation (explicitly killed 2026-04-18).
- Moving CONSTITUTION / CSS / MOTION into `brand/` (explicitly killed 2026-04-18).
- External npm publish.
- Public-launch narrative rewrite of root README.

## Acceptance Criteria

- [ ] `brand/BRAND.md` exists with 5 numbered principles + tone + vocabulary.
- [ ] `brand/foundations/*.md` exists for color, typography, space, motion, voice, accessibility (6 files), each cross-linking to `docs/reference/*` where authoritative rules live.
- [ ] `brand/components.md` exists, read-only inventory of ui/ + brand/ primitives.
- [ ] `brand/decisions/` has 4 dated seed entries (why-orange, why-edge-to-edge, why-a-constitution, what-i-killed).
- [ ] `brand/README.md` rewritten as front-door (≤ 120 lines, non-technical-reader 90-second test).
- [ ] `brand/logos/` has 4 new SVGs (lockup-horizontal, lockup-stacked, clearspace, donts) + `exports/` populated with PNG 1x/2x/3x.
- [ ] `brand/examples/` has 3–5 paired `.png` + `.svelte.txt` pairs.
- [ ] `brand/colors.json` and `brand/yesid_brand_guide.pdf` deleted.
- [ ] `package.json` has `brand:export-logos` + `brand:export-examples` scripts.
- [ ] Site renders identically before/after — zero runtime code changes.
- [ ] `bun run test` + `bun run check` green.
- [ ] A non-technical reader opens `brand/README.md` and understands the system in under 90 seconds.
- [ ] A fresh Claude instance, given any `brand/foundations/*.md`, can extract 3–5 concrete brand rules with no additional prompting.

## Learn

### Governance by convention vs. automation
**What it is:** A brand system can enforce consistency via a generator (one source, many outputs, CI verifies) OR via discipline (narrative in one place, implementation in another, human PR review bridges the gap). Same end state, different failure modes.
**Why it matters:** Automation scales better and rules out drift — but a bad edit propagates instantly. Discipline is slower and may drift — but a bad edit stays local until someone reviews. 17h picked discipline for a solo brand at this scale; the tradeoff was explicit.
**Try this:** Read `brand/foundations/color.md` and `src/lib/styles/tokens.css`. If they diverge, which one is wrong? (Answer: the one that wasn't updated alongside the other — and PR review should have caught it.)
**Go deeper:** Contrast this with Polaris / Primer / Carbon — they ship generators because their scale demands it. Solo brands get to pick.

### Narrative brand vs. tooling brand
**What it is:** Most brand bundles ship as installable packages (tokens as npm, assets as releases). yesid.'s brand ships as a documentation bundle — human-readable narrative first, machine-readable schemas absent on purpose.
**Why it matters:** The audience is a hiring manager, not a downstream codebase. Prose + decisions + screenshots beat typed tokens for that audience. If the audience shifts (new project forks `brand/`), add the schemas then — not now.

### Decision records as case study
**What it is:** Dated short-form posts explaining *why* a design-system choice was made. `decisions/2026-04-why-orange.md`, not a changelog.
**Why it matters:** Solo brands don't publish these — which makes your `decisions/` folder the differentiator for hiring managers and clients.
**Go deeper:** https://adr.github.io/

## Verify

1. `ls brand/` — only markdown, logos (SVG + exports), examples, scripts. No `.json` other than optional metadata. No generated `tokens.css`. No `CONSTITUTION.md` / `CSS.md` / `MOTION.md` duplicates.
2. `cat brand/README.md` — 90-second non-technical-reader test passes.
3. `grep -rn "tokens.json\|brand:generate\|brand:sync" brand/` — zero hits (the machinery isn't there).
4. `cat brand/foundations/color.md` — cross-links out to `docs/reference/CSS.md` for authoritative token values.
5. Fresh clone of `brand/` into a scratch directory: `brand/README.md` still opens sensibly; cross-links to `../docs/reference/` are documented as expected-broken (the bundle is standalone for narrative, not for rules).
6. Open `brand/decisions/2026-04-why-a-constitution.md` — reads as senior-engineer case-study prose; explains why governance lives at `docs/reference/CONSTITUTION.md` and not here.
