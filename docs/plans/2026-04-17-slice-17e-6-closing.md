# Slice 17e-6 Closing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out Slice 17e. Rewrite `docs/reference/MOTION.md` from scratch (v2.0 — replaces the stale v1.0 that still references deleted Three.js/Threlte and the now-forbidden `use:reveal` vocabulary). Amend `docs/reference/CONSTITUTION.md` with a Snappy Doctrine section (incorporating D266 — drawing motion is doctrine-compatible on enter). Update `docs/reference/CSS.md` with motion-token references. Run Lighthouse audits on every route × desktop + mobile (H1 decision) and verify Performance ≥ 98 desktop / ≥ 90 mobile per design spec §6.1. Verify bundle-size budgets per §6.2. Write the motion knowledge base under `docs/learn/motion/` (mandatory per CLAUDE.md closing checklist). Devlog + handoff + tree.txt. Final commit.

**Architecture:** Documentation + verification slice. Zero production code changes except cleanup / comment passes if needed. Heavy on docs, Lighthouse, and learning knowledge capture.

**Tech Stack:** Markdown docs, Chrome DevTools MCP (Lighthouse + performance traces), `bun run bundle-size` (`rollup-plugin-visualizer` from 17e-1), SvelteKit preview build.

**Spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` (§6.1 Lighthouse targets, §6.2 bundle budgets, §6.5 verification workflow, §9.1 sub-slice scope, §9.4 success criteria). Design spec amendments queued: §3.2 to add Terminus as crescendo target (D263); §2 to add drawing-motion exception (D266). MOTION.md v2.0 supersedes v1.0 (stale — references deleted Three.js/Threlte and forbidden `use:reveal`).

**Branch:** `feature/slice-17e-6-closing` (branched from `main` after 17e-5 merges)

**Depends on:** 17e-1, 17e-2, 17e-3, 17e-4, 17e-5 all merged. Lighthouse audits measure the full-stack end state.

**Blocks:** Nothing. Slice 17e is done after this merges. Next slice is 17a-4 Dead Code Cleanup per the checkpoint roadmap.

**Estimated sessions:** 0.5–1 (design spec §9.1)

---

## File Structure

### Created

| File | Purpose |
|---|---|
| `docs/reference/MOTION.md` (v2.0 — overwrites v1.0) | Canonical motion-layer reference — 9-signature vocabulary, factory APIs, shared ticker, lazy plugins, reduced-motion contract, SEO contract, bundle budgets, MetroNetwork SVGO re-run procedure |
| `docs/slices/slice-17e-6-closing.md` | Narrow slice spec |
| `docs/handoffs/handoff-slice-17e.md` | Full-slice closing handoff summarizing all 6 sub-slices |
| `docs/devlog/2026-04-17-slice-17e-closing.md` | Closing devlog per `docs/devlog/_TEMPLATE.md` |
| `docs/learn/motion/snappy-doctrine.md` | Learning doc — the doctrine, its rationale, what counts as a violation (including D266) |
| `docs/learn/motion/signature-vocabulary.md` | Learning doc — the 9 signatures, when to use each, the permitted-exceptions pattern |
| `docs/learn/motion/scrub-factory-pattern.md` | Learning doc — sync-factory convention, preload-then-construct, reduced-motion branch, destroy return |
| `docs/learn/motion/shared-ticker-pattern.md` | Learning doc — one `gsap.ticker` + subscribers, IntersectionObserver offscreen pause, why |
| `docs/learn/motion/lazy-gsap-plugins.md` | Learning doc — `loadDrawSVG`/`loadMorphSVG`/`loadFlip`/`loadCustomEase` pattern, Load Veil trade-off |
| `docs/learn/motion/ssr-inline-svg.md` | Learning doc — Vite `?raw` import + SVGO CLI for LCP-critical SVG, when to inline vs fetch |

### Modified

| File | Change |
|---|---|
| `docs/reference/CONSTITUTION.md` | Add Snappy Doctrine section (reproduces design spec §2); add D266 clarification ("drawing motion IS the content"); amend any §governance table to include motion vocabulary |
| `docs/reference/CSS.md` | Add entries for `--duration-instant`/`--ease-out`/`--ease-in-out` (added in 17e-1); add motion-token usage examples; document `.led-pulse` utility (added in 17e-5); document `.typewriter-cursor` utility (added in 17e-4) |
| `docs/reference/ARCHITECTURE.md` | Update motion-layer section: `motion/actions/` + `motion/scrubs/` + `motion/utils/` + `motion/stores/` + `motion/tokens.ts` + `motion/svg/MetroNetwork.svelte` only. Delete references to `motion/components/ScrollRail`, `motion/svg/Train*`, `motion/utils/heroTimeline.ts`, `motion/utils/heroScrollLock.ts`, `motion/utils/morphHelpers.ts`, `motion/utils/listingAnimations.ts` — all deleted across 17e-2 / 17e-3 / 17e-4 / 17e-5. |
| `docs/reference/TESTS.md` | Add entries for 17e-added test files: `motion/tokens.test.ts`, `motion/utils/ticker.test.ts`, `motion/utils/flip.test.ts`, `motion/scrubs/*.test.ts`, `motion/actions/morphHover.test.ts`. Remove entries for deleted test files. |
| `docs/roadmap/standardization.md` | Strike through 17e rows as COMPLETE; mark 17a-4 as next |
| `docs/slices/slice-17-checkpoint.md` | Update: 17e status = COMPLETE; log D263–D267; list all 6 sub-slice PRs (as they merged in two batches — PR #15 for 17e-2+17e-3, and whatever numbers 17e-4 / 17e-5 / this one end up with) |
| `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` | Append "Amendments (2026-04-17)" section: D263 Terminus crescendo, D264 heroScrollLock cut, D265 MetroNetwork ?raw+SVGO, D266 drawing motion exception, D267 E2+F+G2 |
| `tree.txt` | Regenerate per CLAUDE.md closing convention |

### Not touched (correctly deferred)

- **Lighthouse CI integration** — design spec §6.6 says manual verification is sufficient for 17e; CI is scope creep.
- **17a-4 dead-code cleanup** — next slice after 17e closes. Handoff calls this out.
- **`ProjectMiniCard` orphan** (flagged in 17e-2) — 17a-4 addresses.
- **`FilterGroup.accentColor` unused prop** (flagged in 17e-2) — 17a-4.
- **SplitText lazy migration** — blocked by wordmarkHover; any future slice.
- **MotionPathPlugin lazy migration** — blocked by StackConnections; any future slice.
- **CloserGraffiti factory rebuild** — optional polish, out of scope.

---

## Task 1: Write slice spec for 17e-6

**Files:**
- Create: `docs/slices/slice-17e-6-closing.md`

- [ ] **Step 1: Write slice spec**

Content for `docs/slices/slice-17e-6-closing.md`:

```markdown
# Slice 17e-6 — Closing

**Status:** In progress
**Branch:** `feature/slice-17e-6-closing`
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-17-slice-17e-6-closing.md`
**Depends on:** 17e-1 through 17e-5 all merged
**Blocks:** Nothing. Slice 17e is done after this merges.

## What

Close Slice 17e. Rewrite MOTION.md v2.0, amend CONSTITUTION.md with Snappy Doctrine + D266, update CSS.md + ARCHITECTURE.md + TESTS.md, run Lighthouse audits on every route × desktop + mobile (H1 decision), verify §6.2 bundle budgets, write motion learning knowledge base under `docs/learn/motion/`, devlog, handoff, tree.txt, final commit.

## Outcomes

1. `docs/reference/MOTION.md` v2.0 replaces v1.0. Covers: the 9-signature vocabulary, factory APIs (`createCrescendoScrub`, `createDrawScrub`, `createHeroTimeline`), `use:` actions (`boop`, `cursorGlow`, `magnetic`, `morphHover`, `wordmarkHover`), shared ticker subscribe/unsubscribe, lazy GSAP plugin loaders, `.led-pulse` + `.typewriter-cursor` utilities, reduced-motion contract per signature, SEO contract, MetroNetwork SVGO re-run procedure.
2. `docs/reference/CONSTITUTION.md` has a new Snappy Doctrine section reproducing design spec §2 + §3 + §4.3, with D266 clarification ("drawing motion IS the content; pure fade/scale/stagger reveals are the violation").
3. `docs/reference/CSS.md` documents `--duration-instant`, `--ease-out`, `--ease-in-out` (added 17e-1), `.led-pulse` (added 17e-5), `.typewriter-cursor` (added 17e-4).
4. `docs/reference/ARCHITECTURE.md` motion-layer section matches the post-17e file structure.
5. `docs/reference/TESTS.md` includes all 17e-added test files and removes deleted ones.
6. `docs/learn/motion/` has 6 Obsidian-format learning docs (YAML frontmatter, `[[wikilinks]]`, tags: `learn` + `motion` + difficulty): snappy-doctrine, signature-vocabulary, scrub-factory-pattern, shared-ticker-pattern, lazy-gsap-plugins, ssr-inline-svg.
7. Lighthouse audits: 10 routes × desktop + mobile = 20 runs. All Performance scores ≥ design spec §6.1 targets (desktop ≥ 98, mobile ≥ 90). Accessibility / SEO / Best Practices ≥ 100 per route.
8. Bundle sizes per route verified against §6.2 budgets (home 120 KB, listings 80 KB, detail pages 70 KB, about 70 KB, contact 60 KB, tech-stack 80 KB — all gzipped initial JS).
9. Design spec amended with D263–D267.
10. Checkpoint updated; 17e marked COMPLETE.
11. Handoff report + devlog written.
12. `tree.txt` regenerated.

## Acceptance criteria

- [ ] All outcomes verified
- [ ] MOTION.md v2.0 is the authoritative motion reference; v1.0 contents are completely superseded
- [ ] CONSTITUTION.md Snappy Doctrine section is part of the governance contract
- [ ] Lighthouse results pasted into `docs/devlog/2026-04-17-slice-17e-closing.md`: 20 row table showing route × viewport × Performance / Accessibility / Best Practices / SEO
- [ ] Every Performance score meets §6.1
- [ ] Every bundle per route meets §6.2 budget (or flagged with rationale in handoff if not)
- [ ] `bun run test` + `bun run check` pass
- [ ] Every learning doc in `docs/learn/motion/` has Obsidian frontmatter (YAML with `type`, `tags`, `difficulty`, `created`) and at least one `[[wikilink]]` to a related doc
- [ ] `tree.txt` reflects the current tree
- [ ] Final commit: `feat: complete slice 17e — Motion Re-Engineering` per CLAUDE.md closing convention

## Non-goals

- Lighthouse CI integration (§6.6)
- 17a-4 dead-code cleanup (next slice)
- Any net-new motion features

## Iteration log

(Fill in per task as the session progresses.)
```

- [ ] **Step 2: Commit**

```bash
git add docs/slices/slice-17e-6-closing.md
git commit -m "docs(slice-17e-6): slice spec for closing"
```

STOP. Tell Yesid:
> "Wrote the 17e-6 slice spec. Approve before I start the big documentation pass."

---

## Task 2: Run Lighthouse audits across all routes (desktop + mobile)

**Files:**
- Create: `docs/devlog/2026-04-17-slice-17e-closing.md` — start of devlog, populate with the 20-row Lighthouse table at this task's end

**Rationale:** Decision H1 — audit every route to verify §6.1 Performance targets. 10 routes × 2 viewports = 20 runs. Design spec acceptance criteria §9.4 requires this evidence.

- [ ] **Step 1: Start the production preview server**

Production builds reflect real optimizations (minification, tree-shaking, CSS purging). Lighthouse on `bun run dev` is inaccurate for perf scoring.

```bash
bun run build
bun run preview --host
```

Server comes up on `http://localhost:4173` (or next available). Leave it running in a background terminal.

- [ ] **Step 2: Enumerate the routes to audit**

Per §6.2 bundle budgets + the actual pages on the site:

1. `/` — home (hero + Manifesto + Projects + Services + Closer)
2. `/blog` — blog listing (professional)
3. `/blog/personal` — blog listing (personal)
4. `/blog/[any-slug]` — blog detail (use the current most-recent published post)
5. `/projects` — projects listing
6. `/projects/[any-slug]` — project detail (use the most-recent)
7. `/services` — services listing
8. `/services/[any-id]` — services detail (use `sql-development` or similar)
9. `/about`
10. `/contact`
11. `/tech-stack`

That's 11 routes, not 10; the design spec §6.2 grouping loses personal vs professional blog distinction. Audit all 11.

- [ ] **Step 3: Chrome DevTools MCP Lighthouse audits — desktop**

Use the Chrome DevTools MCP `lighthouse_audit` tool for each route.

For each route:
```
Chrome DevTools MCP > lighthouse_audit
  url: http://localhost:4173/<route>
  device: desktop
  categories: [performance, accessibility, best-practices, seo]
```

Record Performance / Accessibility / Best Practices / SEO scores in the devlog table.

If any Performance score is below the §6.1 target (desktop ≥ 98):
- Note the specific metric failing (FCP, LCP, CLS, INP, TBT)
- Add to handoff's "known gaps" section
- Decide: block the slice close or document as known regression for a follow-up ticket

- [ ] **Step 4: Chrome DevTools MCP Lighthouse audits — mobile**

Same 11 routes, `device: mobile` (Moto G4 throttled emulation — Lighthouse default).

§6.1 targets: mobile Performance ≥ 90 (stretch 95+), Accessibility + SEO + Best Practices ≥ 100.

- [ ] **Step 5: Populate the devlog table**

Open `docs/devlog/2026-04-17-slice-17e-closing.md` and add:

```markdown
## Lighthouse audit results

Run: `bun run build && bun run preview` on 2026-04-17 local. Chrome DevTools MCP `lighthouse_audit` on each route × desktop + mobile.

### Desktop (target: Perf ≥ 98, A11y + SEO + BP = 100)

| Route | Perf | A11y | BP | SEO | Notes |
|---|---|---|---|---|---|
| `/` | — | — | — | — | — |
| `/blog` | — | — | — | — | — |
| `/blog/personal` | — | — | — | — | — |
| `/blog/[slug]` | — | — | — | — | — |
| `/projects` | — | — | — | — | — |
| `/projects/[slug]` | — | — | — | — | — |
| `/services` | — | — | — | — | — |
| `/services/[id]` | — | — | — | — | — |
| `/about` | — | — | — | — | — |
| `/contact` | — | — | — | — | — |
| `/tech-stack` | — | — | — | — | — |

### Mobile (target: Perf ≥ 90 stretch ≥ 95, A11y + SEO + BP = 100)

| Route | Perf | A11y | BP | SEO | Notes |
|---|---|---|---|---|---|
| `/` | — | — | — | — | — |
| `/blog` | — | — | — | — | — |
| `/blog/personal` | — | — | — | — | — |
| `/blog/[slug]` | — | — | — | — | — |
| `/projects` | — | — | — | — | — |
| `/projects/[slug]` | — | — | — | — | — |
| `/services` | — | — | — | — | — |
| `/services/[id]` | — | — | — | — | — |
| `/about` | — | — | — | — | — |
| `/contact` | — | — | — | — | — |
| `/tech-stack` | — | — | — | — | — |
```

Fill in actual numbers.

- [ ] **Step 6: Commit partial devlog**

```bash
git add docs/devlog/2026-04-17-slice-17e-closing.md
git commit -m "docs(slice-17e-6): Lighthouse audit results — 22 runs"
```

STOP. Tell Yesid:
> "Task 2 done: 22 Lighthouse runs captured (11 routes × desktop + mobile). Results pasted into the closing devlog. Summary:
> - Desktop Perf range: [min–max]. Target was ≥ 98. [All met / N failing: …]
> - Mobile Perf range: [min–max]. Target was ≥ 90. [All met / N failing: …]
> - A11y + SEO + BP across the board: [100/100/100 consistently? Or any failures?]
>
> If any scores fail, I've flagged them. Approve to move to Task 3 (bundle-size verification vs §6.2 budgets)."

---

## Task 3: Bundle-size verification vs §6.2 budgets

**Files:**
- Modify: `docs/devlog/2026-04-17-slice-17e-closing.md` — add bundle-size verification table

**Rationale:** Design spec §6.2 sets hard budgets per route. 17e-1 established baselines; 17e-2 through 17e-5 reported deltas. This task is the final verification that every route meets its budget.

- [ ] **Step 1: Run bundle-size**

```bash
bun run bundle-size
```

Opens `dist/stats.html` — the `rollup-plugin-visualizer` treemap.

- [ ] **Step 2: Read per-route initial JS gzipped sizes from stats.html**

For each route entry chunk, note the total gzipped size including transitively-imported shared chunks (use the treemap's "Gzipped size" column).

- [ ] **Step 3: Compare to §6.2 budgets**

Append to the devlog:

```markdown
## Bundle-size verification (§6.2 budgets)

Target budgets per design spec §6.2:

| Route | Budget (gzip) | Actual (gzip) | Δ vs budget |
|---|---|---|---|
| `/` (home) | 120 KB | — | — |
| `/blog` (listing) | 80 KB | — | — |
| `/blog/[slug]` (detail) | 70 KB | — | — |
| `/projects` (listing) | 80 KB | — | — |
| `/projects/[slug]` (detail) | 70 KB | — | — |
| `/services` (listing) | 80 KB | — | — |
| `/services/[slug]` (detail) | 70 KB | — | — |
| `/about` | 70 KB | — | — |
| `/contact` | 60 KB | — | — |
| `/tech-stack` | 80 KB | — | — |
```

Fill in actuals. Any over-budget route must be flagged in the handoff with a rationale (e.g., "home is over by 3 KB because of inlined MetroNetwork SVG — unavoidable for LCP optimization; revisit if mobile Perf drops").

- [ ] **Step 4: Commit**

```bash
git add docs/devlog/2026-04-17-slice-17e-closing.md
git commit -m "docs(slice-17e-6): bundle-size verification vs §6.2 budgets"
```

STOP. Tell Yesid:
> "Task 3 done. Bundle-size verification recorded. [N routes within budget; M routes over — rationale in handoff]. Approve to move to Task 4 (MOTION.md v2.0)."

---

## Task 4: Write MOTION.md v2.0

**Files:**
- Overwrite: `docs/reference/MOTION.md`

**Rationale:** MOTION.md v1.0 is stale (mandates deleted Three.js/Threlte, documents forbidden `use:reveal`). Full rewrite from scratch, based on the post-17e file structure.

- [ ] **Step 1: Draft MOTION.md v2.0 structure**

Sections:

1. **Overview** — what the motion layer is, what it governs, where to find things
2. **The Snappy Doctrine** — reproduce / link to CONSTITUTION.md Snappy Doctrine section
3. **The 9-signature vocabulary** — table + per-signature brief (name, targets, behavior, file location, usage)
4. **Interaction actions** (`motion/actions/`) — `boop`, `cursorGlow`, `magnetic`, `morphHover`, `wordmarkHover`. For each: signature shape, params, reduced-motion behavior, usage example
5. **Scroll-scrub factories** (`motion/scrubs/`) — `createCrescendoScrub`, `createDrawScrub`, `createHeroTimeline`. For each: signature, opts, preload-plugin requirement, reduced-motion behavior, usage example
6. **Idle ambient** — `.led-pulse`, `.typewriter-cursor`, hero typewriter. For each: purpose, where it runs (shared ticker or pure CSS), offscreen pause strategy
7. **Shared ticker** — `motion/utils/ticker.ts` `subscribe(id, fn)` / `unsubscribe(id)` API. Why one RAF. How consumers integrate.
8. **Tokens** — `motion/tokens.ts` + `src/lib/styles/tokens.css`. Parity test. How to add a new duration/ease token.
9. **Lazy GSAP plugins** — `loadDrawSVG`, `loadMorphSVG`, `loadFlip`, `loadCustomEase`. Route-level preload pattern. Why lazy.
10. **Reduced-motion contract** — table listing every signature and its reduced-motion behavior
11. **SEO × motion contract** — reproduce / reference design spec §8
12. **Bundle budgets** — reproduce design spec §6.2 numbers; point to `bun run bundle-size` procedure
13. **MetroNetwork SVG re-optimization procedure** — the SVGO CLI command, when to re-run (whenever the SVG source is updated)
14. **Anti-patterns** — what not to do, what not to add (fade-up on load, scale-in on scroll-into-view, staggered list entrance on mount, new RAF loops)
15. **Migration notes** — where v1.0 content went; Three.js/Threlte references dropped; `use:reveal` vocabulary deleted; `heroTimeline.ts` / `heroScrollLock.ts` / `listingAnimations.ts` / `morphHelpers.ts` deleted — what replaced each
16. **Changelog** — date and summary of v2.0

- [ ] **Step 2: Write the file**

Heavy writing. Base the content on:
- Design spec §2 (doctrine), §3 (vocabulary), §4 (architecture), §5 (mobile + reduced-motion), §6 (perf), §7 (load veil), §8 (SEO)
- 17e-1 through 17e-5 slice specs (for actual API shapes)
- Source file signatures (pull actual function signatures from `motion/actions/*` + `motion/scrubs/*` + `motion/utils/*`)

Expected size: 500–900 lines of markdown.

- [ ] **Step 3: Verify cross-references**

Every `[[wikilink]]` or markdown link in MOTION.md resolves:
- To existing files (`docs/reference/CONSTITUTION.md`, etc.)
- To specific design spec sections with correct anchor
- To source files with correct path

```bash
grep -oE "\[\[.*?\]\]|\]\([^)]+\)" docs/reference/MOTION.md | head -30
```

- [ ] **Step 4: Commit**

```bash
git add docs/reference/MOTION.md
git commit -m "docs(slice-17e-6): MOTION.md v2.0 — supersedes v1.0 (deleted Three.js/Threlte + use:reveal)"
```

STOP. Tell Yesid:
> "Task 4 done: MOTION.md v2.0 written from scratch. [N] sections covering doctrine, vocabulary, factory APIs, shared ticker, tokens, lazy plugins, reduced-motion, SEO, bundle budgets, SVGO procedure, anti-patterns, v1.0 migration notes. Please review the table of contents; if any section is missing or over/under-detailed, flag it before I move on. Approve to move to Task 5 (CONSTITUTION.md amendment)."

---

## Task 5: Amend CONSTITUTION.md with Snappy Doctrine section (+ D266)

**Files:**
- Modify: `docs/reference/CONSTITUTION.md`

**Rationale:** CLAUDE.md says CONSTITUTION.md is the "law of the codebase." Motion governance belongs here. Add a Snappy Doctrine section incorporating D266's drawing-motion clarification.

- [ ] **Step 1: Read current CONSTITUTION.md structure**

```bash
grep "^##\|^###" docs/reference/CONSTITUTION.md | head -30
```

Find a logical insertion point. Likely after the existing "CSS Architecture" / "Spacing & Layout" sections, before any "Closing" / "Changelog" sections. A new top-level section titled "Motion Doctrine" or "Snappy Doctrine" is appropriate.

- [ ] **Step 2: Draft the section**

Contents (approximate, adjust to match CONSTITUTION.md's existing prose style):

```markdown
## Motion Doctrine — Snappy

> Content renders at its final state on page load. Zero entrance animations.
> Motion triggers only on **interaction**, **scroll-scrub**, or **idle ambient**.
> Source: Slice 17e design spec §2 (2026-04-16).

### Forbidden

- `use:reveal` action (deleted 17e-2)
- Fade-up on load (`gsap.from({ y, opacity: 0 })` on mount)
- Scale-in on enter (`scale: 0 → 1` on scroll entry)
- SplitText char-stagger on enter (replaced by scroll-scrub crescendo)
- Staggered list entrances on mount
- "Appear when scrolled to" reveals of any kind
- New `requestAnimationFrame` or `setInterval` ambient loops outside of `motion/utils/ticker.ts`

### The 9-signature vocabulary

Closed at 9. Future slices may not add new signatures without amending this section.

| # | Signature | Lane | Trigger |
|---|---|---|---|
| 1 | Boop | Interaction | hover/click/focus |
| 2 | Cursor glow + magnetic | Interaction | hover + pointer move |
| 3 | Wordmark hover | Interaction | hover |
| 4 | SVG morph hover | Interaction | hover/tap |
| 5 | MetroNetwork hero scrub | Scroll-scrub | scroll (pinned) |
| 6 | DrawSVG scrub (other SVGs) | Scroll-scrub | scroll (through section) |
| 7 | Crescendo scrub | Scroll-scrub | scroll (through section) |
| 8 | LED pulse | Idle ambient | always (IO-gated) |
| 9 | Typewriter idle | Idle ambient | on-load (one-shot, IO-aware) |

### Permitted exception (exactly one)

**HomeCloser graffiti** retains an on-enter DrawSVG timeline + hover interactions.
Justified by placement as the "Terminus" — the narrative destination where a
flourish reinforces arrival.

### D266 — Drawing motion is not a reveal

Drawing motion (`drawSVG: 0% → 100%`, morphSVG tracing, motionPath tracing) is
doctrine-compatible on enter. The motion IS the content. Pure fade-up / scale-in /
stagger reveals remain forbidden — they read as loading states.

**Acceptable on enter:**
- `SvgIcon.animateDraw` — pure DrawSVG
- `SvgIcon.animateDrawFill` — DrawSVG + fill-opacity
- `SvgIcon.animateMorph` — opacity + scale combined with the shape's construction
- `DataFlowDiagram` — DrawSVG lines
- `StackConnections` — DrawSVG paths

**Forbidden:**
- `opacity: 0 → 1` alone
- `scale: 0 → 1` or `y: 30 → 0` alone
- stagger fade-up
- any "reveals when scrolled into view"

### Reference

Full motion documentation: `docs/reference/MOTION.md`.

### Changelog

- 2026-04-17: Motion Doctrine section added (Slice 17e-6 closing). D263–D267 logged in design spec amendments.
```

- [ ] **Step 3: Commit**

```bash
git add docs/reference/CONSTITUTION.md
git commit -m "docs(slice-17e-6): add Snappy Doctrine section to CONSTITUTION.md (D266)"
```

STOP. Tell Yesid:
> "Task 5 done: CONSTITUTION.md now has a Motion Doctrine section. D266 formalized. Approve to move to Task 6 (CSS.md + ARCHITECTURE.md + TESTS.md updates)."

---

## Task 6: Update CSS.md + ARCHITECTURE.md + TESTS.md

**Files:**
- Modify: `docs/reference/CSS.md`
- Modify: `docs/reference/ARCHITECTURE.md`
- Modify: `docs/reference/TESTS.md`

**Rationale:** These reference docs must reflect the post-17e file structure + token set + test catalog.

- [ ] **Step 1: CSS.md additions**

Add entries (insert in logical place per existing CSS.md structure):

- Motion tokens — document `--duration-instant`, `--ease-out`, `--ease-in-out` (added 17e-1). Show current set:
  ```
  --duration-instant: 100ms
  --duration-fast: 150ms
  --duration-normal: 200ms
  --duration-slow: 300ms
  --duration-slower: 500ms
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1)
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1)
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)
  ```
- `.led-pulse` utility class — added in 17e-5, consolidates 4× scoped keyframes
- `.typewriter-cursor` utility class — added in 17e-4, replaces `setInterval` blink
- How motion/tokens.ts mirrors these (parity test in `motion/tokens.test.ts`)

- [ ] **Step 2: ARCHITECTURE.md motion-layer section**

Open ARCHITECTURE.md, find the motion-layer section. Replace with the post-17e structure:

```
src/lib/motion/
├── actions/          — Svelte actions for the interaction lane (signatures 1–4)
│   ├── boop.ts
│   ├── cursorGlow.ts
│   ├── magnetic.ts
│   ├── morphHover.ts          — signature 4 (17e-5)
│   ├── wordmarkHover.ts
│   ├── scrollChain.ts         — utility action (not in doctrine)
│   └── index.ts
├── scrubs/           — Scroll-linked factories (signatures 5–7)
│   ├── createCrescendoScrub.ts
│   ├── createDrawScrub.ts
│   ├── createHeroTimeline.ts
│   └── index.ts
├── stores/           — prefersReducedMotion store
│   ├── reducedMotion.ts
│   └── index.ts
├── svg/              — motion-owned SVG components
│   ├── MetroNetwork.svelte    — inlined via Vite ?raw (17e-4)
│   └── MetroNetwork.test.ts
├── utils/            — motion infrastructure
│   ├── device.ts
│   ├── flip.ts                — FLIP filter transitions (17e-2)
│   ├── gsap.ts                — eager + lazy plugin registration
│   ├── heroTypewriter.ts      — ambient typewriter (17e-4 + 17e-5)
│   ├── lenis.ts               — Lenis smoothscroll bridge
│   ├── stagger.ts
│   ├── ticker.ts              — shared gsap.ticker (17e-1)
│   └── index.ts
├── tokens.ts         — TS mirror of tokens.css motion tokens (17e-1)
├── tokens.test.ts    — parity test
└── index.ts          — barrel
```

Remove references to deleted symbols:
- `motion/components/ScrollRail.svelte` (deleted 17e-2)
- `motion/svg/Train*` tree (deleted 17e-2)
- `motion/utils/heroTimeline.ts` (deleted 17e-4)
- `motion/utils/heroScrollLock.ts` (deleted 17e-4)
- `motion/utils/morphHelpers.ts` (deleted 17e-5)
- `motion/utils/listingAnimations.ts` (deleted 17e-2)
- `motion/actions/reveal.ts` / `ripple.ts` / `tilt.ts` (deleted 17e-2)

- [ ] **Step 3: TESTS.md catalog**

Add to TESTS.md (under Motion or equivalent section):

- `motion/tokens.test.ts` (17e-1) — parity between tokens.css and tokens.ts
- `motion/utils/ticker.test.ts` (17e-1) — subscribe/unsubscribe
- `motion/utils/flip.test.ts` (17e-2) — FLIP primitives
- `motion/scrubs/createCrescendoScrub.test.ts` (17e-3)
- `motion/scrubs/createDrawScrub.test.ts` (17e-3)
- `motion/scrubs/createHeroTimeline.test.ts` (17e-4)
- `motion/actions/morphHover.test.ts` (17e-5)

Remove entries for deleted test files:
- `motion/actions/reveal.test.ts`, `ripple.test.ts`, `tilt.test.ts` (17e-2)
- `motion/components/ScrollRail.test.ts` (17e-2)
- `motion/svg/Train.test.ts`, `TrainJourney.test.ts`, `train-path.test.ts` (17e-2)
- `motion/utils/heroTimeline.test.ts` (17e-4, if existed)
- `motion/utils/heroScrollLock.test.ts` (17e-4, if existed)
- `motion/utils/morphHelpers.test.ts` (17e-5, if existed)
- `motion/utils/listingAnimations.test.ts` (17e-2, if existed)

- [ ] **Step 4: Commit**

```bash
git add docs/reference/CSS.md docs/reference/ARCHITECTURE.md docs/reference/TESTS.md
git commit -m "docs(slice-17e-6): update CSS.md, ARCHITECTURE.md, TESTS.md for post-17e state"
```

STOP. Tell Yesid:
> "Task 6 done: CSS.md has motion tokens + new utility classes; ARCHITECTURE.md motion-layer tree matches reality; TESTS.md catalog updated with +7 / -8+ test files. Approve to move to Task 7 (learning docs)."

---

## Task 7: Write motion learning docs

**Files:**
- Create: `docs/learn/motion/snappy-doctrine.md`
- Create: `docs/learn/motion/signature-vocabulary.md`
- Create: `docs/learn/motion/scrub-factory-pattern.md`
- Create: `docs/learn/motion/shared-ticker-pattern.md`
- Create: `docs/learn/motion/lazy-gsap-plugins.md`
- Create: `docs/learn/motion/ssr-inline-svg.md`

**Rationale:** CLAUDE.md closing checklist Item 4: mandatory learning docs for every slice. Obsidian format — YAML frontmatter (`type`, `tags`, `difficulty`, `created`), `[[wikilinks]]`, tags include `learn` + domain + difficulty. These are long-lived reference material for future-me / future agents.

- [ ] **Step 1: Template each learning doc**

Common frontmatter shape:

```yaml
---
type: learn
domain: motion
tags: [learn, motion, snappy-doctrine, slice-17e]
difficulty: intermediate
created: 2026-04-17
slice: 17e-6
---
```

Standard sections per doc:
- **What** — one-paragraph definition
- **Why it matters** — the problem it solves, the alternative
- **How** — concrete pattern with code example(s)
- **When** — when to apply, when not to
- **Pitfalls** — common mistakes
- **Related** — `[[wikilinks]]` to companion docs

- [ ] **Step 2: Write `snappy-doctrine.md`**

The doctrine, its rationale ("content renders at final state on load"), the 3 triggers, the forbidden list, the D266 clarification. Reference CONSTITUTION.md. Reference MOTION.md.

- [ ] **Step 3: Write `signature-vocabulary.md`**

The 9 signatures, table with name + lane + trigger + example consumer. The "closed at 9" rule. How future work earns a new signature.

- [ ] **Step 4: Write `scrub-factory-pattern.md`**

Sync factory convention: `(target, opts) => () => void`. Caller preloads plugins. Reduced-motion renders final state + no-op destroy. Code example walking through `createCrescendoScrub`.

- [ ] **Step 5: Write `shared-ticker-pattern.md`**

One `gsap.ticker.add` fans out to N subscribers via `subscribe(id, fn)`. Why this beats N independent RAFs. IntersectionObserver offscreen pause pattern. Code example migrating a `setInterval` consumer.

- [ ] **Step 6: Write `lazy-gsap-plugins.md`**

`loadDrawSVG`/`loadMorphSVG`/`loadFlip`/`loadCustomEase`/`loadSplitText` pattern. Preload at route setup for scroll-scrubs; lazy on first event for hover interactions. Why lazy — bundle size, Load Veil principle. Code example showing `await loadDrawSVG()` then `createDrawScrub(...)`.

- [ ] **Step 7: Write `ssr-inline-svg.md`**

Vite `?raw` import + `{@html}` pattern. When to inline (LCP-critical assets) vs when to serve static (decorative, lazy-visible). SVGO CLI procedure. Tradeoff: bigger HTML payload, faster paint.

- [ ] **Step 8: Commit**

```bash
git add docs/learn/motion/
git commit -m "docs(slice-17e-6): motion learning knowledge base (6 concepts)"
```

STOP. Tell Yesid:
> "Task 7 done: 6 motion learning docs created under `docs/learn/motion/`. Obsidian format with frontmatter + wikilinks. Approve to move to Task 8 (design spec amendments + handoff + final close)."

---

## Task 8: Design spec amendments, checkpoint, handoff, devlog, tree.txt, final commit

**Files:**
- Modify: `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` — append amendments section
- Modify: `docs/slices/slice-17-checkpoint.md` — mark 17e COMPLETE; log D263–D267
- Modify: `docs/roadmap/standardization.md` — strike through 17e rows; mark 17a-4 as next
- Create: `docs/handoffs/handoff-slice-17e.md` — full-slice closing handoff
- Modify: `docs/devlog/2026-04-17-slice-17e-closing.md` — add final section closing the loop (already has Lighthouse + bundle tables from Tasks 2–3)
- Regenerate: `tree.txt`

- [ ] **Step 1: Append "Amendments (2026-04-17)" section to design spec**

At the bottom of `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`:

```markdown
## Amendments (2026-04-17)

- **D263** — Terminus rotated label is a crescendo scrub target. The Closer doctrine exception (§3.4) covers ONLY the in-section DrawSVG graffiti timeline, not the edge title. §3.2 table row "Crescendo scrub" updated: target list is "Manifesto 3-line statement, rotated edge titles on Projects + Services + Terminus sections."
- **D264** — `heroScrollLock.ts` cut in 17e-4. Typewriter becomes pure ambient (signature 9) — runs on shared ticker + CSS-keyframe cursor blink. First-visit "plays at you" scroll-lock removed.
- **D265** — MetroNetwork SVG inlined via Vite `?raw` import + one-time `svgo` CLI pass. Source file is the optimized committed version. Re-run procedure documented in `docs/reference/MOTION.md` v2.0.
- **D266** — Drawing motion (DrawSVG stroke-tracing, morphSVG path tracing, motionPath tracing) is doctrine-compatible even on enter. The drawing IS the content, not a delivery mechanism. §2 Forbidden list clarified: pure fade-up / scale-in / stagger reveals remain forbidden (they read as loading states); drawing-motion entries do not. Affected re-classification: `SvgIcon.animateDraw`, `SvgIcon.animateDrawFill`, `SvgIcon.animateMorph` (cleared as drawing motion), `DataFlowDiagram` DrawSVG entrance (cleared), `StackConnections` DrawSVG entrance (cleared). Still violations: `SvgIcon.animateStagger` (deleted 17e-5), `StackScenarioCard` fade-up (deleted 17e-5).
- **D267** — (E2) morphHelpers.ts promoted to `actions/morphHover.ts` Svelte action, not file-level rename. (F) Keep `SvgIcon.animateMorph`; delete `SvgIcon.animateStagger` + `StackScenarioCard` fade-up. (G2) Ripple stays cut; doctrine vocabulary stays at 9 signatures.
```

- [ ] **Step 2: Update checkpoint**

Edit `docs/slices/slice-17-checkpoint.md`:
- Header: "17e: Motion Re-Engineering COMPLETE — all 6 sub-slices merged"
- Under each 17e sub-slice: `COMPLETE (PR #NN merged)`
- Decisions section: log D263 through D267 with one-line summaries
- Next sub-slice: 17a-4 Dead Code Cleanup

- [ ] **Step 3: Update roadmap**

Edit `docs/roadmap/standardization.md` — mark the 17e row COMPLETE. Strike-through or success-checkmark convention per existing file style.

- [ ] **Step 4: Write the full-slice handoff**

Create `docs/handoffs/handoff-slice-17e.md` per `docs/handoffs/_TEMPLATE.md`:

Sections:
1. **Objective Completed** — what Slice 17e delivered across all 6 sub-slices (motion rebuild, 9-signature vocabulary, Snappy Doctrine enforced, ambient consolidation, Lighthouse targets hit)
2. **High-Level Summary** — 3–5 sentences
3. **Files Created** (aggregate across sub-slices): `motion/tokens.ts`, `motion/utils/ticker.ts`, `motion/utils/flip.ts`, `motion/scrubs/*.ts`, `motion/actions/morphHover.ts`, `docs/learn/motion/*.md`, 6 slice specs, etc.
4. **Files Deleted**: 25+ files across orphan deletions, reveal/ripple/tilt, heroTimeline/heroScrollLock, morphHelpers, listingAnimations, Train tree, ScrollRail
5. **Commands Executed** — summary list across all 6 sub-slices (bun adds, svgo runs, lighthouse audits)
6. **Validation Results** — final test count, check status, Lighthouse scores (point to devlog table), bundle sizes (point to devlog table)
7. **Errors Encountered** — summarize across sub-slices (SVGO caveats, test-environment adjustments, MotionPathPlugin assumption correction, SplitText async-refactor deferral)
8. **Iterations** — visual tuning moments (Manifesto crescendo scale range, hero phase choreography)
9. **Assumptions Made** — SVGO output = visually-identical; MotionPathPlugin stays eager (StackConnections); SplitText stays eager (wordmarkHover sync coupling)
10. **Known Gaps / Deferred Work** — SplitText lazy, MotionPathPlugin lazy, CloserGraffiti factory rebuild, audit-flagged on-enter violations remaining (none after 17e-5), ripple restore, light-theme motion polish
11. **What Yesid Should Know** — any non-obvious findings, tuning sensitivities
12. **Next Recommended Slice** — 17a-4 Dead Code Cleanup (per checkpoint roadmap)
13. **Final Status** — COMPLETE

- [ ] **Step 5: Close out the devlog**

Edit `docs/devlog/2026-04-17-slice-17e-closing.md` — add:
- Closing summary section
- D263–D267 recap
- Links to MOTION.md v2.0, CONSTITUTION.md Snappy Doctrine, learning docs
- Pointer to the handoff

- [ ] **Step 6: Regenerate tree.txt**

Per CLAUDE.md closing convention:

```bash
cmd /c 'tree /F /A | findstr /V /C:"node_modules" /C:".git" /C:".remember" /C:"bun.lockb" /C:".svelte-kit" /C:".vercel" /C:".DS_Store" > tree.txt'
```

- [ ] **Step 7: Final check + test**

```bash
bun run check 2>&1 | tail -5
bun run test 2>&1 | tail -10
```

Expected: 0 errors. Tests all pass.

- [ ] **Step 8: Final commit per CLAUDE.md convention**

```bash
git add -A
git commit -m "feat: complete slice 17e — Motion Re-Engineering

Full-slice closing across 6 sub-slices:
- 17e-1 Motion foundation (tokens, ticker, lazy loaders, normalizeScroll removed)
- 17e-2 Snappy Sweep (deleted use:reveal + 27 sites; orphan motion code removed)
- 17e-3 Scrub Factories (createCrescendoScrub, createDrawScrub; Manifesto rebuilt; draw-scrub on Blueprints)
- 17e-4 Hero Timeline (createHeroTimeline; inline MetroNetwork SVG; cut heroScrollLock; CSS cursor blink)
- 17e-5 Interaction Consolidation (use:morphHover action; .led-pulse global; ambient on shared ticker + IO-gated)
- 17e-6 Closing (MOTION.md v2.0; Snappy Doctrine in CONSTITUTION.md; learning docs; Lighthouse audits)

9-signature vocabulary locked. Snappy Doctrine enforced. Ambient loops pause when offscreen.
Decisions D241–D267 logged. Lighthouse + bundle budgets verified."
```

- [ ] **Step 9: Push branch**

```bash
git push -u origin feature/slice-17e-6-closing
```

STOP. Tell Yesid:
> "Slice 17e COMPLETE.
>
> **What landed across 6 sub-slices:**
> - Motion foundation (17e-1): tokens, shared ticker, lazy plugins, tap-vs-click fix
> - Snappy Sweep (17e-2): 27 use:reveal removed, orphan motion deleted, FLIP extracted
> - Scrub Factories (17e-3): createCrescendoScrub + createDrawScrub; Manifesto rebuilt
> - Hero Timeline (17e-4): createHeroTimeline factory; MetroNetwork inlined via ?raw+SVGO; heroScrollLock cut
> - Interaction Consolidation (17e-5): use:morphHover action; .led-pulse global; ambient on shared ticker + IO-gated
> - Closing (17e-6): MOTION.md v2.0; Snappy Doctrine in CONSTITUTION.md; D266 D267 amendments; learning docs × 6; Lighthouse audits recorded
>
> **Decisions logged:** D259 → D267 (9 new decisions from 17e-1 through 17e-6).
>
> **Verification:**
> - Tests: [N/N pass]
> - `bun run check`: 0 errors
> - Lighthouse: [summary — all targets met, or flagged exceptions]
> - Bundle budgets: [all met, or flagged exceptions]
>
> Branch `feature/slice-17e-6-closing` pushed. Ready for final squash-merge to main. Slice 17 motion re-engineering is done. Next slice per the roadmap is 17a-4 Dead Code Cleanup."

---

## Spec coverage self-check

Every §9.1 17e-6 scope item + §9.4 success criteria met:

- ✅ Rewrite MOTION.md v2.0 — Task 4
- ✅ Amend CONSTITUTION.md with Snappy Doctrine — Task 5
- ✅ Update CSS.md motion-token references — Task 6
- ✅ Lighthouse audits all routes desktop + mobile — Task 2 (H1)
- ✅ Bundle-size verification vs §6.2 — Task 3
- ✅ Learning docs under `docs/learn/motion/` — Task 7
- ✅ Devlog + handoff + tree.txt — Task 8
- ✅ Design spec amendments for D263–D267 — Task 8 Step 1
- ✅ Final commit per CLAUDE.md convention — Task 8 Step 8

---

## Definition of done (17e-6) — and full Slice 17e

- All 8 tasks approved by Yesid
- MOTION.md v2.0 is the live reference; v1.0 content superseded
- CONSTITUTION.md Snappy Doctrine section is in place
- Lighthouse: every route meets §6.1 Performance target (or exceptions documented in handoff)
- Bundle-size: every route within §6.2 budget (or exceptions documented)
- 6 learning docs live in `docs/learn/motion/` with Obsidian format
- Handoff report reads coherently across all 6 sub-slices
- Devlog captures Lighthouse + bundle tables + decisions recap
- `tree.txt` current
- `bun run test` + `bun run check` pass
- Branch pushed
- Final commit matches CLAUDE.md format
- Ready for squash-merge
- **Slice 17e is complete** — next is 17a-4 Dead Code Cleanup
