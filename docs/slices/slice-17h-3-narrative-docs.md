# Slice 17h-3 — Narrative Docs + Case Study

**Status:** draft
**Priority:** 2
**Estimated effort:** 2 sessions
**Depends on:** 17h-2
**Parent:** `docs/slices/slice-17h-brand-bundle.md`

## Objective

Write the human-readable face of `brand/`: `BRAND.md` (voice + 5 principles), six `foundations/*.md` files, `components.md` (primitive inventory), and four `decisions/*.md` seed entries. Rewrite `README.md` as the front-door. All markdown, case-study quality, LLM-parseable.

## Context

Prior-art audit (Primer, Polaris, Carbon, Geist, Linear, Supabase, Stripe) produced a clear pattern: mature brand bundles ship numbered principles, a foundations/components split, and — for maturity — a decisions folder. The decisions folder is the differentiator nobody publishes for a solo brand. This sub-slice writes yesid.dev's version, sized for one person.

Claude Design (shipped 2026-04-17) consumes brand docs as text/vision heuristically via Opus 4.7. The docs written here are optimized for both readings — human and LLM.

## Architecture

Every doc follows the "declarative, short, engineer-meets-designer" voice identified in the audit. Source of tone: Carbon's prose filtered through Geist's craft.

Shared structure conventions:

| Doc type | Template sections |
|----------|-------------------|
| `README.md` (front-door) | pitch → quick start → what's inside → editing → consuming → version |
| `BRAND.md` | principles (5) → tone → vocabulary → phrasings → do/don't |
| `foundations/*.md` | what it is → tokens → rules → examples → when to extend |
| `decisions/*.md` | context → options → decision + rationale → consequences |
| `components.md` | table per tier (ui/, brand/) |

## Tech Stack

Markdown. Cross-links using relative paths (`../foundations/color.md`). Token references as literal JSON paths (`yesid.color.brand.primary`) — greppable.

## File Structure

### New
```
brand/BRAND.md                         — CREATE
brand/foundations/color.md             — CREATE
brand/foundations/typography.md        — CREATE
brand/foundations/space.md             — CREATE
brand/foundations/motion.md            — CREATE
brand/foundations/voice.md             — CREATE
brand/foundations/accessibility.md     — CREATE
brand/components.md                    — CREATE
brand/decisions/2026-04-why-orange.md                — CREATE
brand/decisions/2026-04-why-edge-to-edge.md          — CREATE
brand/decisions/2026-04-what-i-killed.md             — CREATE
brand/decisions/2026-04-path-a-no-figma.md           — CREATE
```

### Modified
```
brand/README.md                        — REWRITE as front-door
```

---

## Session 1 — 17h-3.1

### Task 1: Rewrite `brand/README.md` as the front door

**Files:** `brand/README.md`.

- [ ] **Step 1:** 6 sections, under 120 lines total:
  1. **Pitch** (2 sentences). Who it's for. What changes when you use it.
  2. **Quick start**: `bun run brand:generate` + 3 consumption snippets (CSS custom props, Tailwind v3 config, raw JSON).
  3. **What's inside**: table of top-level items + one-line purpose.
  4. **Editing the brand**: 4-step workflow (edit `tokens.json` → run `bun run brand:sync` → review diff → commit).
  5. **Consuming from another project**: 5-line recipes for 3 scenarios.
  6. **Version + contact**.
- [ ] **Step 2:** Voice check — no marketing adjectives. "Design system for yesid.dev" not "A beautiful, thoughtful design system…".
- [ ] **Step 3:** Open in Claude chat. Ask a fresh instance "what is this directory?". If it can't answer in 3 sentences from the README alone, rewrite.

**STOP. Yesid reads and line-edits.**

### Task 2: Write `brand/BRAND.md`

**Files:** `brand/BRAND.md`.

- [ ] **Step 1:** Draft 5 principles. Seed (subject to Yesid edit):
  1. **Edge-to-edge.** The viewport is the canvas. Text centers for readability; visual elements use the edges.
  2. **Dark-first.** Dark is the default. Light is a theme, not a retrofit.
  3. **One orange.** `yesid.color.brand.primary` (`#E07800`) is the only interactive brand hue. Everywhere else uses semantic tokens.
  4. **Motion with intent.** Every animation serves navigation, feedback, or emphasis. Nothing decorative without purpose.
  5. **No fluff.** No marketing adjectives. No hero decorations that don't carry meaning. Craft visible, not performative.
- [ ] **Step 2:** Tone paragraph — 4–6 sentences. "Declarative, short, zero adjectives. Engineer-meets-designer. Written in the register of an RFC or a transit safety notice."
- [ ] **Step 3:** Vocabulary table — preferred terms / avoid / why. 8–12 rows.
  - Example: "digital infrastructure" over "data engineering"; "projects" over "work"; "yesid." always lowercase; dot always `--brand-primary`.
- [ ] **Step 4:** Before/after phrasings — 5 rows, marketing vs. yesid voice.
- [ ] **Step 5:** Do/Don't — 6–8 rules with inline cross-links to `foundations/*.md` for deep dives.

**STOP. Yesid approves voice + principles. Taste call.**

### Task 3: Write foundations — `color.md`, `typography.md`, `space.md`

**Files:** `brand/foundations/color.md`, `typography.md`, `space.md`.

- [ ] **Step 1: `color.md`** —
  - What it is: palette governed by semantic tokens.
  - Tokens: table referencing `yesid.color.*` paths.
  - Rules: 5 bullets. Examples: "Never use raw hex in components. Orange appears only on interactive surfaces. Semantic tokens carry meaning, not color."
  - Examples: 3 good/bad pairs in fenced code.
  - Contrast proofs: every dark-theme text/bg pair with computed ratio (use a tool, document the numbers).
  - When to extend: criteria (pattern appears on 3+ surfaces, semantic role is distinct).
- [ ] **Step 2: `typography.md`** —
  - Inter + JetBrains Mono, self-hosted via `@fontsource-variable`.
  - Full 11-step scale table.
  - Rules: body ≥ 16px, mono ≥ 13px, micro only for chrome annotations.
  - Examples: hero vs title vs body.
- [ ] **Step 3: `space.md`** —
  - 5 semantic spacing tokens + Tailwind default scale.
  - When to use which.
  - Clamp values explained.
- [ ] **Step 4:** Each ≤ 250 lines.

**STOP. Yesid reviews all three.**

---

## Session 2 — 17h-3.2

### Task 4: Write foundations — `voice.md`, `accessibility.md` (motion.md exists from 17h-1 move)

**Files:** `brand/foundations/voice.md`, `brand/foundations/accessibility.md`.

**Note:** `brand/foundations/motion.md` was moved here in 17h-1 from `docs/reference/MOTION.md`. This task does NOT re-create it. If edits are needed to align with the foundations template, make them here — but the content is the authoritative motion doc from the start.

- [ ] **Step 1: `voice.md`** —
  - Expands `BRAND.md` tone section. Longer vocabulary table. More before/after pairs. UX copy patterns (button labels, error messages, empty states).
  - Voice samples from live site (hero, services, blog, contact).
  - Cross-link to `BRAND.md` (tone intro) for readers arriving here first.
- [ ] **Step 2: `accessibility.md`** —
  - WCAG posture. Cross-link to `brand/CONSTITUTION.md` §7 (accessibility) rather than duplicating — CONSTITUTION is the canonical rules document.
  - Keyboard navigation expectations.
  - Focus-visible style.
  - Reduced motion.
  - Touch target minimum.
  - Zero `svelte-ignore a11y_*` tolerance.
- [ ] **Step 3: Light-touch pass on `motion.md`** (already-moved from docs/reference/).
  - Verify cross-links still work post-move.
  - Optional: add a top-of-file pointer to `brand/BRAND.md` principle #4 ("Motion with intent") if missing.
  - Do NOT rewrite content.
- [ ] **Step 4:** `voice.md` and `accessibility.md` each ≤ 250 lines.

**STOP. Yesid reviews.**

### Task 5: Write `brand/components.md`

**Files:** `brand/components.md`.

- [ ] **Step 1:** Two tables —
  - **Tier 1 — ui/** (56 shadcn-svelte scaffolded): name, one-line purpose, variants. Keep rows short — these are headless-first, brand-tokens-skinned.
  - **Tier 2 — brand/** (15 hand-built per CSS.md): name, one-line purpose, props, variants, what it replaces. Longer rows.
- [ ] **Step 2:** Every row links to the source file path.
- [ ] **Step 3:** Short preamble — "This is a living inventory. It does not regenerate; update by hand when 17a-6 or 17d lands a new primitive."
- [ ] **Step 4:** No inline code snippets — too much volume. Link out.

**STOP. Yesid reviews.**

### Task 6: Write 6 decisions seed entries

**Files:**
- `brand/decisions/2026-04-why-orange.md`
- `brand/decisions/2026-04-why-edge-to-edge.md`
- `brand/decisions/2026-04-why-a-constitution.md`
- `brand/decisions/2026-04-extracting-brand-from-docs.md`
- `brand/decisions/2026-04-what-i-killed.md`
- `brand/decisions/2026-04-path-a-no-figma.md`

- [ ] **Step 1: `2026-04-why-orange.md`** —
  - Context: picking a brand color for a solo digital-infrastructure practice.
  - Options considered: blue (generic enterprise), red (too urgent), purple (wrong category signal), orange (transit/construction/warmth).
  - Decision: `#E07800` orange, paired with `#FFB627` yellow accent.
  - Rationale: transit metaphor, construction signaling, high contrast on dark bg, WCAG AA on `#141414`.
  - Consequences: orange is the ONLY brand hue; everywhere else uses semantic tokens.
- [ ] **Step 2: `2026-04-why-edge-to-edge.md`** —
  - Context: choosing a layout philosophy.
  - Options: centered-container bootstrap-era (safe, boring); full-bleed with decorative edges (Awwwards-era, risky); hybrid (text centers, visuals bleed).
  - Decision: hybrid — `<main>` is free; sections choose their layout; containers are for text readability only.
  - Rationale: desktop real estate isn't wasted; text stays readable; personality through structure.
  - Consequences: every section manages its own constraints; `brand/CONSTITUTION.md` §2 codifies this.
- [ ] **Step 3: `2026-04-why-a-constitution.md`** —
  - Context: after 22+ slices, a governance document emerged (17a-5) codifying layout, typography, motion, and a11y rules. Why did a solo brand need a constitution?
  - Options considered: stay informal (relies on memory, drifts); enforce via code review (doesn't scale to a team of one); write it down once (the answer).
  - Decision: CONSTITUTION.md lives in `brand/` as a first-class brand artifact, alongside tokens.json and BRAND.md.
  - Rationale: layout, motion, and a11y rules *are* the brand. Tokens alone don't capture "edge-to-edge," "dvh not vh," "no nested scroll containers," "touch targets 44×44px below xl:". A brand without a constitution is just a color palette.
  - Consequences: every future slice is measured against the constitution; changes to the constitution require a `decisions/` entry; future projects clone the constitution alongside the tokens.
- [ ] **Step 4: `2026-04-extracting-brand-from-docs.md`** —
  - Context: `docs/reference/` was created on day 1 with six files. By slice 17, three of them (CONSTITUTION, CSS, MOTION) had become brand-portable — they could ship intact to a second yesid-branded project. The other three (ARCHITECTURE, PATTERNS, WORKFLOW, TESTS) are site-specific.
  - Options considered: keep everything in `docs/` (simple but conflates two audiences); duplicate into `brand/` (drift risk); move the portable ones into `brand/` with redirect stubs (chosen).
  - Decision: in 17h-1, `git mv docs/reference/CONSTITUTION.md brand/CONSTITUTION.md` etc. Redirect stubs at old paths for one release; content is authoritative at new paths.
  - Rationale: a hiring manager reading `brand/` shouldn't have to leave. An engineer working on the site follows a pointer once. Future projects clone `brand/` with the constitution, tokens, and motion language intact.
  - Consequences: `brand/` is a standalone starter kit. `docs/` is this project's process + history. The split is explicit in `docs/reference/WORKFLOW.md` (updated in 17h-5).
- [ ] **Step 5: `2026-04-what-i-killed.md`** —
  - Context: entropy fights in a fast-moving solo codebase.
  - List of killed things with one-sentence rationale: the PDF brand guide (markdown + generator replaced it), hardcoded hex colors (17a-3), layout wrapper components (17d), `colors.json` duplication (17h-1), Three.js preview pages (17a-4), and the `/brand` directory in any non-yesid tool.
  - Why this matters: what you kill defines the system as much as what you keep.
- [ ] **Step 6: `2026-04-path-a-no-figma.md`** —
  - Context: choosing between Figma, Claude Design, or hybrid.
  - Options considered (with research findings): Starter-tier Figma (no library publish, single-mode Variables), Pro upgrade ($15/mo, still no Code Connect — that's Org/Ent), Claude Design (vision+LLM, no schema, shipped 2026-04-17), hybrid.
  - Decision: Path A — Claude Design only. No Figma.
  - Rationale: Code Connect needs Organization; Claude Design covers the token/narrative handoff; the 3 portable formats (DTCG JSON, CSS vars, markdown) outlive any tool.
  - Consequences: `brand/` IS the handoff; Claude Design consumes directly; bundle is Figma-ready if that ever comes back.
- [ ] **Step 7:** Each ≤ 200 lines. First person for decisions. Reads as senior-engineer reasoning, not marketing.
- [ ] **Step 8:** Link from `BRAND.md` principles to relevant decisions (e.g., principle "One orange" → why-orange; principle "Edge-to-edge" → why-edge-to-edge + why-a-constitution).

**STOP. Yesid reads all 6 as a hiring manager would. Adjusts tone.**

---

## Execution Order

Sequential 1 → 6.

Tasks 1, 2 in Session 1. Tasks 3 can spill or start in Session 1. Tasks 4, 5, 6 in Session 2.

Parallel option (Yesid's approval only): Tasks 3 + 4 could run side-by-side after Task 2 — both are independent foundation docs.

## Out of Scope

- Token editing (that's 17h-1).
- Code generator (that's 17h-2).
- Logo SVGs (that's 17h-4).
- Source-of-truth refactor of CLAUDE.md etc. (that's 17h-5).
- New principles that aren't in the live site's existing posture.

## Acceptance Criteria

- [ ] All new markdown files exist and have substantive content:
  - `BRAND.md`, `components.md`, `README.md` (rewrite)
  - `foundations/{color,typography,space,voice,accessibility}.md` (5 new; motion.md exists from 17h-1)
  - `decisions/2026-04-{why-orange, why-edge-to-edge, why-a-constitution, extracting-brand-from-docs, what-i-killed, path-a-no-figma}.md` (6)
- [ ] Every `foundations/*.md` references `yesid.*` token paths literally.
- [ ] Every `foundations/*.md` cross-links to `brand/CONSTITUTION.md` + `brand/CSS.md` where relevant.
- [ ] `decisions/` has 6 dated entries.
- [ ] `BRAND.md` + `README.md` pass Yesid's "case study quality" check.
- [ ] No broken cross-links (manual scan — no automated markdown link checker in this slice).
- [ ] Claude reader test: fresh Claude instance given only `brand/README.md` can describe the system in 3 sentences.

## Learn

### Decision records (ADR-lite)
**What it is:** Short dated posts explaining *why* a choice was made. Not a changelog, not history — reasoning.
**Why it matters:** Hiring managers and future-you both benefit. Solo brands don't publish these — yours will.
**Try this:** Read all 4 seed entries. Would a hiring manager at Alto click "next" to another? If no, the tone is wrong.
**Go deeper:** https://adr.github.io/

### Writing for LLMs + humans
**What it is:** Structure that both Opus 4.7 and a new designer can parse — short sections, tables, literal token paths, no marketing.
**Why it matters:** Your docs are consumed by both audiences. Writing them twice (once for humans, once as a prompt) is a losing trade.
**Try this:** After Task 4, paste any `foundations/*.md` into Claude chat with "what rules does this imply for my designs?" The model should extract 3–5 concrete rules with no additional prompting.

## Verify

1. Every file under 250 lines (foundations) or 200 lines (decisions).
2. `grep -rn "yesid.color\|yesid.font\|yesid.size" brand/foundations/` — every foundation doc references token paths by name.
3. Claude reader test passes.
4. `BRAND.md` has exactly 5 principles, numbered.
5. `decisions/` has exactly 4 dated seed files.
