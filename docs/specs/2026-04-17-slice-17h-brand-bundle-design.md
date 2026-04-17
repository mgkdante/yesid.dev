# Slice 17h — Brand Bundle + Source-of-Truth Refactor (Design Spec)

**Date:** 2026-04-17
**Status:** Draft — pending Yesid review
**Approach:** Path A — Claude Design as primary design tool, no Figma
**Slice position:** 17h — closing chapter of Slice 17 (Standardization). The visual-design bookend to 17a (tokens + primitives), 17a-5 (spacing + constitution), 17d (component API), and 17e (motion). Slice 18 remains reserved for Payload CMS in the separate `yesid.dev-cms` repo.
**Depends on:** Slice 17e (motion consolidation) merged to `main`

---

## 1. Goal

Turn `brand/` into the single source of truth for the yesid. brand — a public, generator-driven, case-study-worthy package that (a) keeps every brand value in one place, (b) ships formats Claude Design + Opus-class LLMs can read, (c) frames `docs/reference/CONSTITUTION.md` as the governance layer of the brand, not just of the codebase, and (d) reads like the work of a senior infrastructure engineer who manages brand cohesion as a product.

## 2. Design principles

1. **One input, many outputs.** `brand/tokens.json` is the only place a brand value gets edited. A Bun script regenerates `tokens.css`, `app.css @theme`, `tailwind.brand.js`, and typed TS — zero manual sync.
2. **Markdown + JSON, never PDF.** Narrative docs are markdown; machine-readable data is W3C DTCG JSON. These two formats outlive every design tool.
3. **Case study is the README.** `brand/README.md` is the front door for a non-technical reader. It pitches the system in the first paragraph and shows the workflow in the second.
4. **Ship the three portable currencies.** W3C tokens JSON, CSS custom properties, markdown. These are the formats Claude Design, Figma, Framer, and every successor tool will read.
5. **Generator is boring.** ~300 LOC, zero runtime deps, deterministic. If it's not obvious what a line does, the generator is wrong.
6. **Generated files are committed.** The diff tells the story. CI verifies regeneration is idempotent.
7. **Claude Design is a consumer, not a dependency.** We optimize `brand/` to be readable by Opus 4.7 (paired markdown + JSON + screenshots), but the bundle stands alone if Claude Design is offline, rate-limited, or pivots.
8. **The constitution is a brand artifact.** `docs/reference/CONSTITUTION.md` codifies the visual, layout, motion, and accessibility rules that *are* the brand. The bundle features it as a first-class asset, not as governance-only. Tokens are the values; the constitution is the law.

## 3. Reference sites + prior art

Audit of Primer, Polaris, Carbon, Geist, Linear, Supabase, Stripe informed this spec:

- **Tokens as an installable package** (Polaris, Primer, Carbon) — externalize, don't document.
- **Foundations vs Components split** — universal across every mature design system.
- **Principles over history** — five numbered principles beat any origin story.
- **Decisions folder** — short dated posts explaining *why* a choice was made. No one publishes this for a solo brand. It is the differentiator.
- **Domain voice: "quiet authority"** — declarative, short, zero adjectives. Carbon's prose filtered through Geist's craft.

What we deliberately skip: monorepo scaffolding, CODE_OF_CONDUCT/CONTRIBUTING boilerplate, codemod tooling. Solo brand at v1 — those read as cosplay.

## 4. Architecture overview

### 4.1 Directory layout (target)

```
brand/
├── README.md                   # Front-door: pitch + workflow + consumption
├── BRAND.md                    # Voice, tone, 5 principles, do/don't
├── CONSTITUTION.md             # MOVED from docs/reference/ — the law of the brand
├── CSS.md                      # MOVED from docs/reference/ — token lookup reference
├── tokens.json                 # W3C DTCG — SOURCE OF TRUTH
├── tokens.css                  # Generated from tokens.json
├── tailwind.brand.js           # Generated for downstream v3 consumers
├── foundations/
│   ├── color.md                # Palette, semantic roles, contrast proofs
│   ├── typography.md           # Inter + JetBrains Mono, scale, usage
│   ├── space.md                # Spacing scale + layout recipes
│   ├── motion.md               # MOVED from docs/reference/MOTION.md — motion language + tokens
│   ├── voice.md                # Tone, vocabulary, phrases to avoid
│   └── accessibility.md        # WCAG posture, keyboard, reduced motion
├── logos/
│   ├── wordmark-dark.svg
│   ├── wordmark-light.svg
│   ├── monogram-dark.svg
│   ├── monogram-light.svg
│   ├── monogram-orange.svg
│   ├── favicon.svg
│   ├── lockup-horizontal.svg   # NEW — wordmark + monogram horizontal
│   ├── lockup-stacked.svg      # NEW — wordmark stacked with tagline
│   ├── clearspace.svg          # NEW — diagram of minimum whitespace
│   ├── donts.svg               # NEW — "never do this" grid
│   └── exports/                # NEW — PNG 1x/2x/3x per logo
├── components.md               # Inventory of Svelte primitives + purpose
├── examples/                   # NEW — paired screenshot + source
│   ├── hero-1440.png
│   ├── hero-1440.svelte.txt
│   ├── services-375.png
│   ├── services-375.svelte.txt
│   └── … 3-5 pairs total
├── decisions/                  # NEW — the case-study hook
│   ├── 2026-04-why-orange.md
│   ├── 2026-04-why-edge-to-edge.md
│   ├── 2026-04-why-a-constitution.md        # NEW — the governance story
│   ├── 2026-04-extracting-brand-from-docs.md # NEW — why brand/ absorbed CONSTITUTION + CSS + MOTION
│   └── 2026-04-what-i-killed.md             # 5 seed entries (dropped path-a-no-figma per 2026-04-17 decision)
├── scripts/
│   ├── generate.ts             # JSON → 4 code outputs
│   ├── sync.ts                 # orchestrator: generate + PNG exports
│   └── verify.ts               # CI check: re-generate, diff, fail if drift
└── colors.json                 # DELETED — merged into tokens.json
    yesid_brand_guide.pdf       # DELETED — permanently
```

### 4.1.1 What moves from `docs/` to `brand/`

`docs/` was created at the start of the project. As the workflow matured, a split emerged: some reference docs codify the **brand as a product** (portable to any future project Yesid starts), others codify the **yesid.dev site specifically**. This slice ratifies the split.

**Moves to `brand/` (brand-portable — future-project-reusable):**

| From | To | Reason |
|------|-----|--------|
| `docs/reference/CONSTITUTION.md` | `brand/CONSTITUTION.md` | Layout, typography, motion, a11y, responsive, file-org rules. These are the brand's laws. |
| `docs/reference/CSS.md` | `brand/CSS.md` | Full token lookup + rules. Brand-adjacent, portable by construction. |
| `docs/reference/MOTION.md` | `brand/foundations/motion.md` | Motion language *is* part of the brand identity. |

**Stays in `docs/` (site-specific):**

| File | Why it stays |
|------|--------------|
| `docs/reference/ARCHITECTURE.md` | SvelteKit routes, component tree, data flow — not portable |
| `docs/reference/PATTERNS.md` | Solutions catalog for *this* site's problems |
| `docs/reference/WORKFLOW.md` | Yesid's workflow for yesid.dev — portable by analogy but specific by content |
| `docs/reference/TESTS.md` | Test index for *this* codebase |
| `docs/slices/`, `docs/plans/`, `docs/specs/`, `docs/handoffs/`, `docs/devlog/`, `docs/learn/`, `docs/roadmap/`, `docs/research/`, `docs/archive/` | Process + history for *this* project |

**Cross-link pattern:** `docs/reference/*.md` files that used to carry brand content get replaced with a one-line pointer + a short rationale paragraph. A hiring manager reading `brand/` never has to leave; an engineer working on the live site follows the pointer once.

**Future-project posture:** The bundle as shipped at 17h close is a clonable starter kit. A second project ("yesid-client-X") can copy `brand/` wholesale, adjust `tokens.json`, and inherit the constitution, foundations, and voice with zero edits. This is the portability test the bundle should pass.

### 4.2 Token architecture

`tokens.json` is the **single writable file** for brand values. Structure mirrors the active design system:

```
yesid/
├── color/
│   ├── brand/{primary,accent,primary-hover,accent-hover}
│   ├── semantic/{success,warning,error,info,destructive}   # merged from colors.json
│   ├── dark/{background,surface,elevated,…}                # flat today; mode-ready tomorrow
│   └── light/{background,surface,elevated,…}
├── font/{heading,body,mono}
├── size/
│   ├── hero, display, title, heading, subheading,
│   ├── body, body-lg, small, caption, mono, micro          # full 11-step scale
├── spacing/{page-x,section-y,card-gap,stack,cluster}       # new: matches tokens.css today
├── motion/
│   ├── duration/{instant,fast,normal,slow,slower}
│   └── easing/{default,out,in-out,bounce,decel}
├── radius/{sm,md,lg,xl,pill}
├── shadow/{glow-sm,glow-md,glow-lg,card,section,nav}
├── z-index/{base,content,rail,sheet,menu,nav}
└── opacity/{muted,dim,subtle,faint}
```

**W3C DTCG compliance:** every leaf carries `$value` and `$type`. Composite types (`shadow`) are declared as `{ $type: "shadow", $value: { color, offset-x, offset-y, blur, spread } }`. Aliases use `{alias.path}` syntax.

### 4.3 Generator pipeline

```
brand/tokens.json  ──►  scripts/generate.ts
                          │
                          ├─►  brand/tokens.css                      (THE one tokens file)
                          ├─►  brand/tailwind.brand.js               (legacy v3 consumers)
                          ├─►  src/app.css @theme partial            (marker-bracketed; inline in app.css)
                          └─►  src/lib/brand.ts                      (typed runtime map + TS types)

src/app.css imports brand/tokens.css via:  @import '../brand/tokens.css';
src/lib/styles/tokens.css is DELETED in 17h-2 (DRY — single tokens file at brand/tokens.css).
```

Key decisions:

- **DRY — one tokens file.** `brand/tokens.css` is the only `.css` with design tokens. `src/app.css` imports it via `@import '../brand/tokens.css';` (relative path — no Vite alias needed for `@import`). `src/lib/styles/tokens.css` is **deleted** in 17h-2. Any component that imported from `$lib/styles/tokens.css` gets retargeted or removed (check in 17h-2 Task 4).
- The `@theme` block stays inline in `src/app.css` — the generator owns the content between `/* BRAND:THEME:START */` and `/* BRAND:THEME:END */` markers. The `@theme inline { --color-*: var(--…) }` block stays hand-written because it maps semantic aliases Tailwind v4 can't derive from JSON alone.
- `src/lib/brand.ts` emits `as const` object + inferred types + a flat `tokenMap` for runtime lookup (`tokenMap['color.brand.primary']`).

### 4.4 Generator architecture (ADR)

**Decision:** homegrown Bun/TypeScript script, ~250–400 LOC.

**Rejected:** Style Dictionary (overkill for 4 string outputs, no built-in Tailwind v4 format, async class init adds 300–800ms to every pre-commit hook run). Tokens Studio CLI (wrapper over SD, same cost plus a second layer to learn).

**Why homegrown wins here:**

1. Four outputs, one input, all strings. No transform graph needed.
2. Tailwind v4 has no out-of-the-box SD format — you'd write a custom format anyway.
3. Pure-TS Bun script cold-starts in ~50ms; SD is ~500ms+.
4. Deterministic output is easier solo: sort keys, LF newlines, single writer, byte-stable.
5. No Figma round-trip today means Tokens Studio's one real win doesn't apply.

**Migration signal:** rewrite to Style Dictionary the moment any **two** of: (a) more than three output platforms (iOS/Android/Compose join), (b) designers start pushing from Tokens Studio with math expressions, (c) composite-token variants multiply past ~5 hand-rolled formatters, (d) per-platform transform groups become necessary.

**Module sketch (no code, just responsibilities):**

```
brand/scripts/
├── generate.ts           entry: orchestrates everything, writes files atomically
├── parse.ts              read + validate tokens.json (DTCG shape, no unknown $type)
├── resolve.ts            resolve {alias} → leaf values; detect cycles; flatten paths
├── format-value.ts       per-$type value formatting (color hex, dimension rem, shadow composite)
├── emit-tokens-css.ts    → brand/tokens.css (the single tokens file — src/app.css imports it)
├── emit-theme-css.ts     → src/app.css @theme partial (static brand values)
├── emit-legacy-tw.ts     → brand/tailwind.brand.js (CJS for downstream)
├── emit-brand-ts.ts      → src/lib/brand.ts (as const + types + runtime map)
├── write.ts              deterministic serializer: sorted keys, LF, byte-stable
├── verify.ts             CI: run generator, git diff, fail on drift
└── __tests__/
    ├── determinism.test.ts     same input → byte-identical output
    ├── alias-resolution.test.ts cycles, missing refs, deep refs
    └── dtcg-shape.test.ts       invalid JSON rejected with clear errors
```

### 4.5 Claude Design integration posture

Claude Design (Anthropic Labs, shipped 2026-04-17) is **vision+LLM-driven**, not schema-strict. It reads whatever you give it at onboarding. Our posture:

- **Ship the three formats Opus 4.7 parses best:** W3C DTCG JSON (semantic, unambiguous), CSS custom properties (concrete values), markdown (narrative + rules).
- **Pair screenshots with source.** `brand/examples/` holds 3–5 `.png` + `.svelte.txt` pairs of the live site at 1440px and 375px. Vision models ground faster on paired image+code than on either alone.
- **Optimize READMEs for LLM reading.** Short headings, bullet lists, explicit tables, no hero marketing prose. A model should be able to extract token values, principles, and do/don't rules with zero prompting.
- **No live integration today.** Claude Design's MCP surface is promised "in coming weeks." When it ships, this bundle is already readable — no rework.

If Claude Design's capabilities change, the bundle doesn't. The formats are portable by construction.

### 4.6 Source-of-truth refactor

This is the doc-updating sub-slice. It has three parts:

**Part A — Extractions.** Move brand-portable reference docs from `docs/reference/` to `brand/`:

| From | To | After the move |
|------|-----|----------------|
| `docs/reference/CONSTITUTION.md` | `brand/CONSTITUTION.md` | `docs/reference/CONSTITUTION.md` becomes a 3-line redirect file |
| `docs/reference/CSS.md` | `brand/CSS.md` | same — redirect |
| `docs/reference/MOTION.md` | `brand/foundations/motion.md` | same — redirect |

Redirects, not deletions: internal links and existing docs keep working through one release. A future slice can delete the redirects once search results settle.

**Part B — Inline brand values replaced with pointers.** Every doc that hardcodes a hex, font name, or token value today gets rewritten to reference `brand/`:

- `CLAUDE.md` — Brand section shrinks to: one-line pitch + three rules (`yesid.` lowercase, dot is `--primary`, dark-first). Pointer to `brand/README.md` + `brand/BRAND.md`. CSS rules section points to `brand/CONSTITUTION.md` + `brand/CSS.md`.
- `docs/reference/ARCHITECTURE.md` "CSS Architecture" section → link to `brand/CSS.md`. "Brand" column in stack table → link to `brand/`.
- `docs/slices/_TEMPLATE.md` + `docs/specs/*-design.md` templates — purge any inline brand values.
- `README.md` (project root) — brief line acknowledging `brand/` as the bundle; no duplicated values.

**Part C — Workflow docs reflect the new reality.** The workflow *has* changed. `docs/` was built slice-by-slice; the brand/ extraction is the natural retrospective. Update:

- `docs/reference/WORKFLOW.md` — Phase 3 (Design Spec) + Phase 9 (Closing) reference `brand/` for any brand-scoped decisions. The "Document ecosystem" table (§19) gains a `brand/` section listing the bundle's files with purpose + update-trigger. Add a one-paragraph callout: "Brand-portable reference material lives in `brand/`; site-specific process lives in `docs/`."
- `docs/roadmap/PLAN.md` — add 17h as the closing sub-slice of Slice 17. Update the sub-slice table. Short retro paragraph: "17h ratified the split between brand (portable) and docs (site-specific)."
- `docs/roadmap/standardization.md` — add 17h row to the progress table. Update the "Phase 2 — Standardization" arc to include the visual-design close.

**Part D — Secondary doc updates.** Any doc that mentions removed files:

- Everything pointing to `yesid_brand_guide.pdf` → retarget to `brand/BRAND.md`.
- Everything pointing to `brand/colors.json` → retarget to `brand/tokens.json`.
- Everything pointing to `docs/reference/CONSTITUTION.md` → retarget to `brand/CONSTITUTION.md` (if not handled by the redirect file).

The refactor exit-test: a `grep -rn "#E07800\|#FFB627\|yesid_brand_guide\|colors\.json" --include="*.md"` scan should show hits only in (a) `brand/`, (b) generated files, (c) historical `docs/devlog/` + `docs/handoffs/` (frozen in time — do not rewrite history).

## 5. Page architecture (bundle IA)

### 5.1 `brand/README.md`

Front-door for non-technical readers. Structure:

1. **Pitch** (2 sentences): what this is, who it's for.
2. **Quick start**: `bun run brand:generate` + consumption snippets.
3. **What's inside**: table of top-level folders with one-line purpose.
4. **Editing the brand**: "open `tokens.json`, change a value, run `bun run brand:sync`, commit."
5. **Consuming from another project**: three 5-line recipes (CSS custom props, Tailwind v3, raw JSON).
6. **Version + license + contact**.

Under 120 lines. No hero marketing.

### 5.2 `brand/BRAND.md`

The voice document. Structure:

1. **Five principles** (numbered, ≤ 2 lines each).
2. **Tone** (one paragraph: "declarative, short, engineer-meets-designer").
3. **Vocabulary** (table: preferred terms, terms to avoid, why).
4. **Example phrasings** (before/after table — 5 rows).
5. **Do / Don't** (visual-adjacent rules, cross-links to `foundations/` for deep dives).

Under 150 lines.

### 5.3 `brand/foundations/*.md`

Each foundation doc follows the same shape:

1. **What it is** (one paragraph, plain English).
2. **Tokens** (table pointing into `tokens.json` paths).
3. **Rules** (numbered, ≤ 5 bullets).
4. **Examples** (3 short "good / bad" pairs, code-formatted).
5. **When to extend** (criteria for adding a new value).

Each doc ≤ 250 lines. Lives alongside the code it governs; references `tokens.json` paths literally (e.g., `yesid.color.brand.primary`).

### 5.4 `brand/decisions/*.md`

The case-study hook. 3–5 short dated entries at launch, growing over time. Each entry:

1. **Title** — starts with "Why" or "What".
2. **Date** — ISO.
3. **Context** (1 paragraph).
4. **Options considered** (bulleted, with tradeoffs).
5. **Decision** + **Rationale** (the short version).
6. **Consequences** (what this locks in, what it leaves open).

This is the "senior engineer manages brand as a product" moment. Nobody else publishes these for a solo brand. Each doc ≤ 200 lines.

Seed entries for 17h-3:

- `2026-04-why-orange.md` — #E07800 vs alternatives.
- `2026-04-why-edge-to-edge.md` — the viewport-is-the-canvas stance.
- `2026-04-why-a-constitution.md` — why a solo brand codifies layout/type/motion/a11y rules as a governance document; why CONSTITUTION.md counts as a brand artifact.
- `2026-04-extracting-brand-from-docs.md` — the workflow-maturity story: `docs/` was day-1 scaffolding; over 22+ slices a split emerged between brand-portable reference material and site-specific process; 17h ratifies the split by moving CONSTITUTION, CSS, and MOTION into `brand/`.
- `2026-04-what-i-killed.md` — the PDF, hardcoded hex, layout wrappers, etc.

(Dropped `path-a-no-figma` — the no-Figma tooling call is internal; its rationale stays in the devlog. `decisions/` is for brand-scoped choices readable as a hiring-manager case study.)

**Voice across all narrative files — impersonal.** BRAND.md, foundations/, AND decisions/ all use impersonal prose (Carbon-style). No "I chose" / first-person subject — prefer "the decision", "the bundle", or passive where honest. Tighter, more case-study-grade register. Matches the prior-art audit's "quiet authority" tone.

### 5.5 `brand/components.md`

One table: `src/lib/components/ui/`* + `src/lib/components/brand/*` with name, one-line purpose, variants/props, demo page. Links out to the component file. Regenerated manually when `17a-6` / `17d` added primitives; no generator — the cost of drift is low and the narrative value of a human-written one-liner per component is high.

## 6. Responsive / accessibility

This slice ships no runtime code changes. The live site is untouched. But the bundle **is** documentation of the responsive + a11y posture, and those docs must stay honest.

- `brand/foundations/accessibility.md` summarizes WCAG posture, reduced-motion stance, touch target rules, keyboard nav expectations.
- Contrast proofs live in `foundations/color.md` — every dark-theme text/background pair listed with computed ratio.
- Motion rules in `foundations/motion.md` reference the duration/easing tokens *from JSON* — regenerated if values change.

## 7. Out of scope (prevents drift)

- **No Figma files.** Path A locked. Figma is a future concern, not this slice.
- **No Claude Design live integration.** The MCP surface isn't shipped yet. Slice documents the handoff posture; it doesn't wire one.
- **No light-theme launch.** Tokens stay defined for both themes (already true today). Actually switching the site is a separate decision.
- **No new brand colors.** This slice refactors structure; it does not redesign the palette.
- **No Payload CMS integration.** Separate repo (`yesid.dev-cms`), separate slice (Slice 18, distinct from this 17h).
- **No component library API changes.** `components.md` is a read-only inventory.
- **No accessibility audit.** `foundations/accessibility.md` documents the current posture, not a new one.
- **No external distribution.** No npm publish. `brand/` stays in-repo for now; publishing is a future decision.

## 8. Risks + mitigations


| Risk                                                               | Severity | Mitigation                                                                                                |
| ------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------- |
| Generator + `brand/tokens.css` diverge from `tokens.json`          | High     | CI `verify.ts` regenerates and diffs on every push; fails the build on drift                              |
| Components importing `$lib/styles/tokens.css` directly break after deletion | Medium | 17h-2 Task 4 greps for `$lib/styles/tokens.css` imports; retargets or removes before deleting the file |
| CONSTITUTION / CSS / MOTION carry drift from slice-17 refactors at time of move | High | 17h-1 Task 4 runs a per-file audit against current code (`src/lib/styles/tokens.css`, `src/app.css`, `src/lib/components/`, `src/lib/motion/`) and applies factual corrections BEFORE `git mv`. Result: history records the docs in their correct post-17 form at move time, not a stale earlier snapshot. |
| W3C DTCG schema updates break `tokens.json`                        | Medium   | Pin to current DTCG draft (2024-10); document the pin in `decisions/`                                     |
| Claude Design pivots or shuts down                                 | Medium   | Bundle's three portable formats stand alone; no integration to rip out                                    |
| `colors.json` → `tokens.json` merge breaks downstream scripts      | Low      | grep for `colors.json` first (confirmed unused outside `brand/`); keep a redirect comment for one release |
| PDF deletion breaks existing `yesid_brand_guide.pdf` links         | Low      | 50+ doc references confirmed; all now point to README                                                     |
| Logo PNG export tool choice (Sharp vs Playwright) adds dep         | Low      | Use Sharp — already Bun-compatible, no browser required                                                   |
| Generator can't express composite shadows cleanly                  | Medium   | Write the formatter first; if it's ugly, adopt Style Dictionary early (before the rest of the slice)      |
| `brand/` grows beyond 6 folders                                    | Medium   | Hard cap documented in `README.md`; new categories require a `decisions/` entry                           |
| Source-of-truth refactor breaks search/navigation in existing docs | Low      | Keep link text explicit (`brand/foundations/color.md`), not renamed                                       |
| `docs/reference/CONSTITUTION.md` move breaks 60+ existing cross-links | Medium | Leave redirect file at old path for one release; run link-check pass in 17h-5 Task 1 before move          |
| WORKFLOW.md + PLAN.md updates drift from real workflow if written too early | Low | Write these at the END of 17h-5, after all moves done — describes *what is*, not *what should be*   |
| Contributors unclear whether new reference docs go in `brand/` or `docs/reference/` | Medium | `WORKFLOW.md` gets an explicit "brand vs docs/" rule; CLAUDE.md "Never" list gains matching entry         |


## 9. Success criteria

This slice ships successfully when:

1. A non-technical reader can open `brand/README.md` and understand what the brand system is + how to edit it in under 90 seconds.
2. Changing `#E07800` to `#E08000` anywhere requires exactly one edit: `brand/tokens.json`. `bun run brand:sync` propagates. Site renders correctly with no component edits.
3. `bun run brand:verify` (CI) passes — regeneration is idempotent, no drift.
4. Claude Design, pointed at `brand/`, can produce a design mock that respects orange + Inter + dark-first without additional prompting. (Manually verified by Yesid.)
5. Every doc in the repo that used to hardcode a brand value now references `brand/`. `grep -r "#E07800"` outside `brand/`, `generated files`, and migration comments returns zero hits.
6. `bun run test` + `bun run check` green.
7. `brand/decisions/` has five seed entries (orange, edge-to-edge, why-a-constitution, extracting-brand-from-docs, what-i-killed) that a hiring manager reads as a case study, not a dev log. All impersonal voice.
8. `docs/reference/CONSTITUTION.md`, `docs/reference/CSS.md`, `docs/reference/MOTION.md` are redirect files; content lives in `brand/`.
9. `docs/reference/WORKFLOW.md` and `docs/roadmap/PLAN.md` reflect the `brand/`-vs-`docs/` split explicitly.
10. A fresh clone of `brand/` into a sibling project works standalone — no implicit dependency on `docs/`.

## 10. Open questions (for Yesid)

These are the strategic calls the spec leaves open. Each surfaces a decision rather than a default.

**Answered 2026-04-17:**

1. **`brand/` publishing — IN-REPO.** No npm publish, no separate site. Ships as part of the yesid.dev repo.
2. **Duplicated `tokens.css` — DRY.** Generator emits only to `brand/tokens.css`. `src/app.css` imports it via relative path (`@import '../brand/tokens.css';`). `src/lib/styles/tokens.css` is deleted in 17h-2.
3. **`decisions/` seed entries — 5, not 6.** Drop `path-a-no-figma` (rationale stays in devlog; the tooling choice isn't public-case-study material). Keep: why-orange, why-edge-to-edge, why-a-constitution, extracting-brand-from-docs, what-i-killed.
4. **Voice — impersonal throughout.** BRAND.md, foundations, AND decisions/ all use impersonal prose (Carbon-style). No "I chose" — "the decision" or passive. Tighter, more case-study-grade.
5. **`git mv` + redirect stubs** — confirmed.
6. **Root `README.md` — thin pointer edit** — confirmed. Full rewrite deferred to future public-launch slice.

**Still open (not yet decided):**

A. **`components.md` scope** — all 71 components or only the 15 brand/ primitives? (Default: all 71, with ui/ rows marked "shadcn scaffolded" to keep rows short.)
B. **Logo PNG export formats** — 1x/2x/3x PNG only, or also WebP? (Default: PNG only.)
C. **`brand/CSS.md` after `tokens.json` lands** — hand-written narrative reference, or generated token table? (Default: hand-written. Tokens are in `tokens.json`; CSS.md is the human-readable overview.)
D. **Pre-commit hook** — add `brand:verify` as a pre-commit hook, or CI only? (Default: CI only.)
E. **Future-project clonability test** — paste `brand/` into a toy SvelteKit repo during 17h acceptance, or defer? (Default: defer until the first real reuse.)

## 11. Glossary

- **DTCG** — Design Tokens Community Group, W3C-incubated spec for design tokens as JSON.
- **Source of truth** — the one editable file whose values propagate to all consumers.
- **Case study** — the `brand/` directory treated as a portfolio artifact for hiring managers + clients.
- **Portable formats** — W3C JSON, CSS custom properties, markdown. These are the three formats that outlive any design tool.
- **Claude Design** — Anthropic Labs product (shipped 2026-04-17). Vision+LLM design tool. Consumes heuristically, no schema.
- **Generator** — `brand/scripts/generate.ts`. Reads `tokens.json`, emits four code files. Idempotent.

