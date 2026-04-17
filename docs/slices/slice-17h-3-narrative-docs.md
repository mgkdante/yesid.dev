# Slice 17h-3 — Narrative Docs + Case Study

**Status:** draft (updated 2026-04-18 for the 17h scope shrink — see parent slice; Task 0 added 2026-04-18 to freshen governance + process + project docs before narrative writing)
**Priority:** 2
**Estimated effort:** 2.5–3 sessions (7 tasks — Task 0 is a pre-narrative freshening pass across `docs/reference/*` + `docs/roadmap/*` + `CLAUDE.md` + root `README.md`; `docs/learn/` explicitly skipped)
**Depends on:** standalone (previously depended on 17h-2; 17h-2 killed 2026-04-18)
**Parent:** `docs/slices/slice-17h-brand-bundle.md`

## Objective

Write the human-readable face of `brand/`: `BRAND.md` (voice + 5 principles), six `foundations/*.md` files, `components.md` (primitive inventory), and four `decisions/*.md` seed entries. Rewrite `README.md` as the front-door. All markdown, case-study quality, LLM-parseable.

**Post-shrink note (2026-04-18):** Under the new 17h model, `brand/` contains narrative + assets only. Governance docs (`CONSTITUTION.md`, `CSS.md`, `MOTION.md`) stay at `docs/reference/`; token values stay in `src/lib/styles/tokens.css`. Every `foundations/*.md` in this sub-slice is **narrative** — it describes how the brand thinks about color / type / space / motion / voice / a11y and cross-links OUT to `docs/reference/*` for authoritative values + rules. The foundations docs do NOT duplicate or replace the governance docs; they frame them.

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
brand/foundations/motion.md            — CREATE (newly authored narrative; cross-links to docs/reference/MOTION.md for the authoritative motion doc — NOT moved)
brand/foundations/voice.md             — CREATE
brand/foundations/accessibility.md     — CREATE (cross-links to docs/reference/CONSTITUTION.md §7 — NOT moved)
brand/components.md                    — CREATE
brand/decisions/2026-04-why-orange.md                — CREATE
brand/decisions/2026-04-why-edge-to-edge.md          — CREATE
brand/decisions/2026-04-why-a-constitution.md        — CREATE (why docs/reference/CONSTITUTION.md exists and why brand/ points to it rather than owning it)
brand/decisions/2026-04-what-i-killed.md             — CREATE
```

### Modified
```
brand/README.md                        — REWRITE as front-door
```

---

## Session 1 — 17h-3.1

### Task 0: Freshen reference + process + project docs against current repo reality

**Files covered (scope expanded 2026-04-18):**

Deep audit (full checklist below — foundations docs cross-link INTO these with high specificity):
- `docs/reference/CONSTITUTION.md`
- `docs/reference/CSS.md`
- `docs/reference/MOTION.md`

Lighter audit (spot-check for obvious drift — dead slice refs, removed files, stale token/primitive counts, wrong version stamps):
- `docs/reference/ARCHITECTURE.md`
- `docs/reference/WORKFLOW.md`
- `docs/reference/TESTS.md`
- `docs/reference/PATTERNS.md`
- `docs/roadmap/PLAN.md`
- `docs/roadmap/standardization.md` (largely refreshed during the 17h planning shrink — spot-check for anything missed)
- `CLAUDE.md` (root)
- `README.md` (root)

**Out of Task 0 scope:** `docs/learn/` — explicitly skipped per Yesid's 2026-04-18 instruction. Learning docs carry historical point-in-time accuracy; a freshen pass there belongs to a future learning-docs refactor (originally planned as Slice 17g).

**Why this task exists.** Every `brand/foundations/*.md` written in Tasks 3–4 cross-links OUT to `docs/reference/*` for authoritative values + rules. If those docs (or anything they transitively cite — CLAUDE.md, README, ARCHITECTURE, PLAN) carry drift from 17a-3 / 17a-5 / 17a-6 / 17d / 17e / 17a-4 that was never cleaned up, the drift gets laundered into `brand/` as "narrative built on authoritative source" — but the source is stale. Claude Design + hiring managers + Figma designers would consume bad data permanently.

This task originated in the original 17h-1 Task 4 ("Freshen CONSTITUTION / CSS / MOTION against slice-17 reality pre-move"). 17h-1 was killed in the 2026-04-18 shrink but the freshen need stayed; Yesid expanded its scope 2026-04-18 to include project-level + process docs for the same laundering reason.

**Do NOT rewrite from scratch.** Audit + targeted updates only. Anything major that emerges becomes a separate follow-up slice, not a Task 0 expansion. The lighter-audit files especially: spot-check, don't rewrite.

**Audit checklist per file:**

For **`docs/reference/CONSTITUTION.md`**:
- § 2 Layout Model — 4 grid recipes match patterns currently in use post-17d.
- § 3 Spacing — 5 semantic spacing tokens match `src/lib/styles/tokens.css` exactly.
- § 4 Typography — 11-step type scale matches `src/app.css @theme` exactly.
- § 6 Component Standards — tier counts (56 ui/ + 13 brand/ per 17a-4 refresh) correct; Bits UI integration language post-17a-6 accurate; Card unification (17d) reflected.
- § 8 Motion — tokens match `tokens.css`; Snappy Doctrine (17e-6) present; 9-signature vocabulary listed; HomeCloser permitted exception documented.
- § 9 Responsive — 5 breakpoints, `dvh`/`svh`/`lvh` rules, overflow guarantee layers.
- § 13 Atomic Design — 3 tiers, Card surface rules reflect 17d's universal Card.
- Any inline version/date stamps brought current.
- Any `17*` slice references that are stale.

For **`docs/reference/CSS.md`**:
- "Last updated" date refreshed to today.
- Type scale table matches `src/app.css @theme` exactly.
- Color tokens table matches `src/lib/styles/tokens.css` exactly — every dark/light pair, every shadcn semantic token, every extension.
- Shadow tokens reflect the current `--shadow-*` set.
- Z-index scale matches.
- Brand Primitives section — 13 primitives per 17a-4 refresh (StatusDot with `ring` prop, SectionLabel, SectionHeading, StopLabel, MetroStation, ChevronToggle, GlowOverlay, MetricDisplay, CornerMarks, TerminalChrome, StickyPanel, SvgIcon, BlueprintShell).
- Migration note: 6 primitives migrated into `ui/` (Tag + NumberBadge → `ui/badge`, HazardStripe + GradientSeparator → `ui/separator`, BrandButton → `ui/button`, CardBase → `ui/card`) per `brand/index.ts`.
- Brand Utility Classes — 12 utilities in `app.css` (re-count via `grep -n "^\." src/app.css | head` to verify).
- Prose styling — 17d-4 blog detail page additions reflected.
- Global keyframes — `blink`, `pulse-glow`, `station-ping`, `typewriter-blink` (audit the canonical list).

For **`docs/reference/MOTION.md`**:
- Action catalog — matches `src/lib/motion/actions/` contents today (`boop`, `cursorGlow`, `magnetic`, `morphHover`, `wordmarkHover`, `scrollChain`). Post-17e: `reveal`, `ripple`, `tilt` cut.
- Principles — Snappy Doctrine reflected; scrub factories documented (`createHeroTimeline`, `createCrescendoScrub`, `createDrawScrub`).
- Lazy plugin loaders + shared ticker + IO-gated subscribers documented.
- Any references to deleted/renamed components retargeted.

**Lighter-audit checklist (spot-check only, do NOT rewrite):**

For **`docs/reference/ARCHITECTURE.md`**:
- Brand primitive tree matches 13 files on disk (was refreshed in 17a-4 — spot-check it held).
- No `motion/three` references (deleted in 17a-4).
- Motion tree post-17e (actions list, scrubs/, ticker, tokens).
- Repo structure matches current `src/` + `docs/` layout.

For **`docs/reference/WORKFLOW.md`**:
- Session-type system (Planning / Implementation / Closing) accurate.
- Tool/plugin table entries point at commands that still exist.
- Any `17*` slice references current.
- No references to killed 17h sub-slices (17h-1, 17h-2, 17h-5, 17h-6) as "planned work".

For **`docs/reference/TESTS.md`**:
- Test file counts match `find src/ -name "*.test.ts" | wc -l` rough.
- StatusDot + barrel test entries reflect 17a-4 updates.
- No entries for deleted test files (ReadingProgressBar, reveal, ripple, tilt, ScrollRail, Train tree, per 17e deletions).

For **`docs/reference/PATTERNS.md`**:
- 17a-4 entries present (CSS Outline for Halos, CRLF-Tolerant Frontmatter Parser).
- No patterns whose "Files" reference deleted files.
- "Discovered in: Slice NN" tags current.

For **`docs/roadmap/PLAN.md`**:
- Sub-slice table reflects completed slices through 17a-4.
- 17h roadmap row present + matches parent slice spec.
- `src/lib/motion/three/` reference removed (17a-4).
- Actions list doesn't mention deleted actions (`reveal`, `ripple`, `tilt`).

For **`docs/roadmap/standardization.md`**:
- 17a-4 row marked COMPLETE (done in 17a-4 handoff).
- 17h row matches parent slice spec (~3 sessions / 2 sub-slices).
- Spot-check the big "Remaining" narrative blocks for stale claims.

For **`CLAUDE.md`** (root):
- Active-slice + next-sub-slice pointers current (updated 2026-04-18 in the planning shrink — verify held).
- Completed Slices list includes 17a-4.
- Brand section's inline values (`#E07800`, `#FFB627`, Inter, JetBrains Mono, "yesid." lowercase + orange dot) verified against `src/lib/styles/tokens.css` + `src/app.css @theme`.
- Iteration Protocol + Git/PR Workflow evergreen — spot-check only.
- "Never" list doesn't reference killed 17h automation (no `brand:sync` mentions).
- Repo Structure list at the bottom matches `tree.txt`.

For **`README.md`** (root):
- Any brand values mentioned match current tokens.
- Any tech stack mentions accurate (SvelteKit version, Bun version, Tailwind v4).
- Any "see brand/ for…" pointers accurate or dropped.
- No references to killed 17h automation or a `bun run brand:sync` command.
- If the README is already minimal and evergreen, no-op is acceptable — record "spot-checked, no drift" in the scratchpad.

**Process:**

- [ ] **Step 1:** Handle the deep-audit trio first (`CONSTITUTION.md`, `CSS.md`, `MOTION.md`) — run the detailed checklist against the actual files on `main` (`src/lib/styles/tokens.css`, `src/app.css`, `src/lib/components/brand/`, `src/lib/motion/actions/`). Produce a short in-session scratchpad of every row that's stale.
- [ ] **Step 2:** Apply corrections to the deep-audit trio in place. Factual updates only — no restructuring, no expanded prose, no new sections. **STOP** between each of the 3 files so Yesid can approve the diff before the next one.
- [ ] **Step 3:** Handle the lighter-audit group (`ARCHITECTURE.md`, `WORKFLOW.md`, `TESTS.md`, `PATTERNS.md`, `PLAN.md`, `standardization.md`, `CLAUDE.md`, root `README.md`). For each: spot-check against the lighter checklist; if no drift, record "spot-checked, no drift" in scratchpad and move on; if drift found, apply the narrow fix. Batch these into a single STOP — they're spot-checks, not rewrites.
- [ ] **Step 4:** Diff every touched file against `main`. Confirm changes are narrow and factual. If any row's "correct value" is ambiguous or requires a design call, STOP and raise it with Yesid — do not force a guess.
- [ ] **Step 5:** Run `bun run test` + `bun run check` — catches any code example in the docs that got out of sync. Green required.
- [ ] **Step 6:** Delete the scratchpad.

**STOP.** Yesid confirms all freshened docs reflect reality. Tasks 1–6 build on these — if any are wrong, everything written after inherits the wrongness.

---

### Task 1: Rewrite `brand/README.md` as the front door

**Files:** `brand/README.md`.

- [ ] **Step 1:** 6 sections, under 120 lines total:
  1. **Pitch** (2 sentences). Who it's for. What changes when you use it.
  2. **What's inside**: table of top-level items + one-line purpose (foundations/, decisions/, logos/, examples/, components.md, BRAND.md).
  3. **How brand decisions become code**: 3-step workflow (decision captured in `brand/decisions/*.md` → dev translates to `src/lib/styles/tokens.css` / component edits → PR review verifies the translation). Call out explicitly: no generator, no `brand:sync`, no automation.
  4. **Where authoritative rules live**: pointer table — governance at `docs/reference/CONSTITUTION.md`, token values at `src/lib/styles/tokens.css`, CSS architecture at `docs/reference/CSS.md`, motion at `docs/reference/MOTION.md`. `brand/` is the narrative layer over these.
  5. **Consuming from another project**: clone `brand/` for narrative + assets; the code-level rules come from the other trees.
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

### Task 4: Write foundations — `voice.md`, `accessibility.md`, `motion.md`

**Files:** `brand/foundations/voice.md`, `brand/foundations/accessibility.md`, `brand/foundations/motion.md`.

**Post-shrink note:** 17h-1 was supposed to move `docs/reference/MOTION.md` into `brand/foundations/motion.md`. That move is dead. This task now authors `motion.md` as a **new narrative** that describes how the brand thinks about motion (principles, signature vocabulary, when to animate) and cross-links to `docs/reference/MOTION.md` for the authoritative implementation reference. Same pattern as `color.md` / `space.md` — narrative layer over the governance doc.

- [ ] **Step 1: `voice.md`** —
  - Expands `BRAND.md` tone section. Longer vocabulary table. More before/after pairs. UX copy patterns (button labels, error messages, empty states).
  - Voice samples from live site (hero, services, blog, contact).
  - Cross-link to `BRAND.md` (tone intro) for readers arriving here first.
- [ ] **Step 2: `accessibility.md`** —
  - WCAG posture. Cross-link to `docs/reference/CONSTITUTION.md §7` (accessibility) rather than duplicating — CONSTITUTION is the canonical rules document.
  - Keyboard navigation expectations.
  - Focus-visible style.
  - Reduced motion.
  - Touch target minimum.
  - Zero `svelte-ignore a11y_*` tolerance.
- [ ] **Step 3: `motion.md`** — NEWLY AUTHORED (previously planned as a move from `docs/reference/MOTION.md`; that move is dead).
  - What motion means for the brand — 3–4 sentences of intent.
  - The 9-signature vocabulary at a narrative level (hover, scrub, ambient, etc.), without the full implementation detail.
  - Cross-link to `docs/reference/MOTION.md` for the authoritative reference (tokens, factories, actions, bundle budgets).
  - Cross-link to `BRAND.md` principle #4 ("Motion with intent").
  - ≤ 200 lines — this is a narrative overview, not the full motion doc.
- [ ] **Step 4:** `voice.md`, `accessibility.md`, `motion.md` each ≤ 250 lines.

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

### Task 6: Write 4 decisions seed entries

**Files:**
- `brand/decisions/2026-04-why-orange.md`
- `brand/decisions/2026-04-why-edge-to-edge.md`
- `brand/decisions/2026-04-why-a-constitution.md`
- `brand/decisions/2026-04-what-i-killed.md`

**Post-shrink note:** Originally 6 seed decisions. Dropped: `path-a-no-figma.md` (Yesid dropped 2026-04-17 — tooling-internal, not public case-study material) and `extracting-brand-from-docs.md` (premise dead — the docs were never extracted under the 2026-04-18 shrunk scope).

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
  - Context: after 22+ slices, a governance document emerged (17a-5) codifying layout, typography, motion, and a11y rules. Why did a solo brand need a constitution, and why does it live at `docs/reference/CONSTITUTION.md` rather than inside `brand/`?
  - Options considered: stay informal (relies on memory, drifts); enforce via code review (doesn't scale to a team of one); write it down once (the answer).
  - Decision (2026-04-18 revision): CONSTITUTION.md lives at `docs/reference/CONSTITUTION.md` as the site's governance law. `brand/` points to it but does not own it — physical separation between narrative (`brand/`) and rules (`docs/reference/`) makes it harder to accidentally desync governance from the implementation it governs.
  - Rationale: layout, motion, and a11y rules *are* part of the brand intent — but the enforcement surface is the code. Keeping the constitution next to the code (`docs/reference/`) keeps a governance edit close to its implementation impact; `brand/foundations/*.md` narrates the intent in language that doesn't presuppose the code.
  - Consequences: every future slice is measured against the constitution at `docs/reference/CONSTITUTION.md`; changes to it require a `brand/decisions/*.md` entry explaining the intent change; future projects that fork `brand/` also fork (or copy) `docs/reference/CONSTITUTION.md` explicitly.
- [ ] **Step 4: `2026-04-what-i-killed.md`** —
  - Context: entropy fights in a fast-moving solo codebase.
  - List of killed things with one-sentence rationale: the PDF brand guide (markdown narrative replaces it), hardcoded hex colors (17a-3), layout wrapper components (17d), `colors.json` duplication (17h-3 deletion), Three.js preview pages (17a-4), the hero 3D scene (17a-4 — perf + a11y + reduced-motion-fallback-that-duplicated-SVG), and the 17h generator / source-of-truth automation (17h scope-shrink 2026-04-18 — chose physical separation + manual translation over generator-enforced sync).
  - Why this matters: what you kill defines the system as much as what you keep.
- [ ] **Step 5:** Each ≤ 200 lines. First person for decisions. Reads as senior-engineer reasoning, not marketing.
- [ ] **Step 6:** Link from `BRAND.md` principles to relevant decisions (e.g., principle "One orange" → why-orange; principle "Edge-to-edge" → why-edge-to-edge + why-a-constitution).

**STOP. Yesid reads all 6 as a hiring manager would. Adjusts tone.**

---

## Execution Order

Sequential 0 → 6.

- Session 1 (17h-3.1): Tasks 0, 1, 2. Task 3 can spill or start if time.
- Session 2 (17h-3.2): Tasks 3 (if not done), 4, 5, 6.

Task 0 is a hard prerequisite for everything after it — no foundation doc gets written until `docs/reference/*` is verified fresh.

Parallel option (Yesid's approval only): Tasks 3 + 4 could run side-by-side after Tasks 0-2 — both are independent foundation docs.

## Out of Scope

- Token editing (that's 17h-1).
- Code generator (that's 17h-2).
- Logo SVGs (that's 17h-4).
- Source-of-truth refactor of CLAUDE.md etc. (that's 17h-5).
- New principles that aren't in the live site's existing posture.

## Acceptance Criteria

- [ ] Task 0 done: `docs/reference/{CONSTITUTION,CSS,MOTION}.md` audited + freshened against current repo reality; every row verifiable against `src/`.
- [ ] All new markdown files exist and have substantive content:
  - `BRAND.md`, `components.md`, `README.md` (rewrite)
  - `foundations/{color,typography,space,motion,voice,accessibility}.md` (6 new — motion.md is newly authored narrative, not moved)
  - `decisions/2026-04-{why-orange, why-edge-to-edge, why-a-constitution, what-i-killed}.md` (4)
- [ ] Every `foundations/*.md` references token names literally (e.g. `--primary`, `--text-body`) as they appear in `src/lib/styles/tokens.css` / `src/app.css @theme`.
- [ ] Every `foundations/*.md` cross-links to `docs/reference/CSS.md` (token lookup) and/or `docs/reference/CONSTITUTION.md` (governance rules) where relevant. No cross-links to `brand/CONSTITUTION.md` or `brand/CSS.md` — those paths don't exist under the shrunk scope.
- [ ] `decisions/` has 4 dated entries.
- [ ] `BRAND.md` + `README.md` pass Yesid's "case study quality" check.
- [ ] No broken cross-links (manual scan — no automated markdown link checker in this slice).
- [ ] Claude reader test: fresh Claude instance given only `brand/README.md` can describe the system in 3 sentences, including that governance rules live at `docs/reference/` rather than in `brand/`.

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
2. `grep -rn -- "--primary\|--text-\|--space-" brand/foundations/` — every foundation doc references CSS custom property names by value.
3. `grep -rn "docs/reference" brand/foundations/` — every foundation doc cross-links out to the governance layer.
4. Claude reader test passes.
5. `BRAND.md` has exactly 5 principles, numbered.
6. `decisions/` has exactly 4 dated seed files.
