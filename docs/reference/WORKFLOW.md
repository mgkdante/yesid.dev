# yesid. Workflow — The Full Pipeline

**Version:** 1.0 | April 2026
**Companion to:** `CLAUDE.md` (rules), `roadmap/PLAN.md` (roadmap), `MOTION.md` (animation), `PATTERNS.md` (solutions)

This document defines **how work flows** from idea to shipped code. CLAUDE.md says *what* to do; this says *when, why, and in what order*. Every session follows this pipeline. No shortcuts.

---

## 1. Session Types

Every session is exactly one type. Declare it at the start.

| Type | Purpose | Artifacts Produced | Duration |
|------|---------|-------------------|----------|
| **Planning** | Research, brainstorm, design spec, slice spec | `docs/specs/`, `docs/slices/`, `docs/research/findings.md` | 1 session |
| **Implementation** | Build one sub-slice, task by task | Code, tests, devlog | 1-3 sessions per sub-slice |
| **Closing** | Docs, handoff, learning docs, tree.txt, commit | `docs/handoffs/`, `docs/devlog/`, `docs/learn/` | 0.5-1 session |

**Hard rule:** A session cannot be two types. Planning sessions produce zero code. Implementation sessions don't write specs but can modify on iteration. Closing sessions don't add features.

---

## 2. The Pipeline (End-to-End)

```
IDEA
  |
  v
[Phase 1: Research]           — Scan competitors, read docs, find patterns
  |
  v
[Phase 2: Brainstorm]         — superpowers:brainstorming → design ideas
  |
  v
[Phase 3: Design Spec]        — Visual companion → docs/specs/
  |
  v
[Phase 4: Implementation Plan] — superpowers:writing-plans → docs/plans/
  |
  v
[Phase 5: Slice Spec]         — Concrete tasks → docs/slices/slice-NN.md
  |
  v
[Phase 6: Implementation]     — Task-by-task with approval gates
  |
  v
[Phase 7: Verification]       — Pre-completion checks + visual proof
  |
  v
[Phase 8: PR & Merge]         — Branch → PR → review → squash-merge
  |
  v
[Phase 9: Closing]            — Handoff, docs, learn, commit
  |
  v
SHIPPED
```

Each phase has specific tools, artifacts, and exit criteria. Skipping a phase creates debt that compounds.

---

## 3. Phase 1 — Research

**When:** Before any new page, section, or major feature.
**Goal:** Understand what great looks like. Never design in a vacuum.

### Process

1. **Competitive scan** — Use Chrome DevTools MCP to analyze 5-7 Awwwards-quality reference sites at 4 breakpoints (375px, 768px, 1440px, 1920px+).
2. **Extract patterns** — Document in `docs/research/findings.md`: typography DNA, color architecture, page rhythm, animation catalog, responsive strategies.
3. **Check PATTERNS.md** — Before inventing, check if a solved pattern already exists.
4. **Library docs** — Use Context7 MCP or Svelte MCP for API verification. Never guess API signatures.

### Tools

| Tool | Purpose |
|------|---------|
| Chrome DevTools MCP | `navigate_page`, `evaluate_script`, `take_screenshot`, `lighthouse_audit` — multi-breakpoint site analysis |
| `frontend-design-pro:analyze-site` | Structured competitive analysis |
| `frontend-design-pro:inspiration-analyzer` | Extract design patterns from reference sites |
| `frontend-design-pro:trend-researcher` | Latest UI/UX trends |
| Context7 MCP | Live docs for SvelteKit, GSAP, Tailwind, Three.js, Lenis |
| Svelte MCP | `get-documentation`, `svelte-autofixer` — Svelte 5 API reference |

### Artifacts

- `docs/research/findings.md` — Comprehensive scan results (typography, colors, layout, animation, responsive)
- Updated `docs/reference/PATTERNS.md` — Any new patterns discovered during research

### Exit Criteria

- [ ] 5+ reference sites scanned at 4 breakpoints
- [ ] Typography, color, animation, and responsive patterns documented
- [ ] PATTERNS.md consulted — no reinventing solved problems
- [ ] Yesid has reviewed findings and confirmed direction

---

## 4. Phase 2 — Brainstorm

**When:** After research, before any design spec.
**Goal:** Turn research into concrete design ideas. This is where creativity happens.

### Process

1. **Invoke** `superpowers:brainstorming` — this is **mandatory** before any plan. No exceptions.
2. **Design ideation** — Generate 2-3 design approaches. Each approach should have a name, a one-sentence pitch, and key trade-offs.
3. **Present options** — Yesid picks the direction. Never self-select.
4. **Document** — Brainstorm artifacts go in `.superpowers/brainstorm/` (scratchpad, not a commitment).

### Tools

| Tool | Purpose |
|------|---------|
| `superpowers:brainstorming` | **Mandatory** — structured ideation before any plan |
| `web-designer:web-designer` | Full page design sessions |
| `frontend-design-pro:design-wizard` | Interactive design iteration |
| `ui-design:*` | Color systems, typography scales, responsive design, dark mode |
| `interaction-design:*` | Animation principles, micro-interactions, loading states |
| Figma MCP | `get_design_context`, `get_screenshot` — if designing in Figma first |

### Decision Framework

When presenting design options, structure each as:

```
**Option [A/B/C]: [Name]**
- Pitch: [one sentence]
- Visual feel: [descriptive]
- Animation approach: [GSAP techniques]
- Responsive strategy: [how it adapts]
- Risk: [what could go wrong]
- Sessions needed: [estimate]
```

### Exit Criteria

- [ ] `superpowers:brainstorming` invoked
- [ ] 2-3 design approaches presented with trade-offs
- [ ] Yesid selected direction
- [ ] Artifacts saved in `.superpowers/brainstorm/`

---

## 5. Phase 3 — Design Spec

**When:** After Yesid approves a brainstorm direction.
**Goal:** Translate the chosen direction into a visual specification that implementation can follow.

### Process

1. **Write design spec** — `docs/specs/YYYY-MM-DD-[name]-design.md`
2. **Section-by-section breakdown** — Each section of the page gets: layout description, responsive behavior, animation choreography, content source (data layer reference), and color/typography decisions.
3. **Self-review** — Read the spec as if you're implementing it cold. Would you know exactly what to build? If not, add detail.
4. **Yesid approval** — Spec must be approved before any implementation plan.

### Spec Structure (proven template from 19 specs)

```markdown
# [Name] Design Spec

**Date:** YYYY-MM-DD
**Status:** Draft | Approved
**Approach:** [Name of chosen brainstorm option]

## Goal
[What this delivers and for whom]

## Design Principles
[3-5 principles specific to this feature]

## Reference Sites
[Sites that informed this design + key patterns extracted]

## Page Architecture ([N] Sections)

### Section 1: [Name]
- **Layout:** [CSS Grid / Flexbox / Full-bleed]
- **Content source:** [data layer file + field]
- **Typography:** [sizes, weights, fonts]
- **Animation:** [GSAP technique, trigger, duration]
- **Responsive:** [mobile → tablet → desktop behavior]
- **Colors:** [token references]

### Section 2: [Name]
[same structure]

## Interactions
[Hover states, click behaviors, scroll-linked effects]

## Out of Scope
[What this does NOT include]
```

### Tools

| Tool | Purpose |
|------|---------|
| `design-systems:component-spec` | Write detailed component specifications |
| `interaction-design:micro-interaction-spec` | Specify hover/click/scroll interactions |
| `ui-design:responsive-design` | Responsive layout strategy |
| `ui-design:dark-mode-design` | Dark theme refinement |
| GSAP Master MCP | `understand_and_create_animation` — validate animation approach |

### Exit Criteria

- [ ] Design spec written in `docs/specs/`
- [ ] Every section has layout, content source, animation, and responsive behavior defined
- [ ] Self-reviewed: implementable by a cold reader
- [ ] Yesid approved

---

## 6. Phase 4 — Implementation Plan

**When:** After design spec is approved.
**Goal:** Break the design into concrete, ordered tasks that can be implemented one at a time.

### Process

1. **Invoke** `superpowers:writing-plans` — generates the plan structure.
2. **Estimate sessions** — Each sub-slice gets a session count. Never assume one session. Default to multi-session.
3. **Identify dependencies** — Tasks that depend on each other run sequentially. Independent tasks are candidates for parallel agents (with Yesid's approval only).
4. **Write plan** — `docs/plans/YYYY-MM-DD-[name].md`

### Plan Structure (proven template from 11 plans)

```markdown
# [Name] Implementation Plan

**Goal:** [one sentence]
**Architecture:** [high-level approach]
**Tech Stack:** [relevant subset]
**Multi-session:** [how many sessions, one sub-slice per session]
**Design spec:** [path to spec]

## File Structure
### Files to modify
### Files to create

## Sub-slice [NN][a]: [Name]

### Task 1: [Name]
**Files:** [create/modify paths]
- [ ] Step 1: [exact instruction]
- [ ] Step 2: [exact instruction]
- [ ] Step 3: Run tests
**STOP. Ask Yesid to verify.**

### Task 2: [Name]
[same structure]

## Execution Order
[dependency graph]

## Out of Scope
[prevents drift]
```

### Sub-slice Convention

Split into sub-slices (10a, 10b, 10c...) when:
- 6+ tasks in a slice
- Multiple concerns (data layer + UI + animation)
- Tasks span different files/domains

Each sub-slice gets its own handoff. Naming follows the pattern: `slice-09c-1`, `slice-09c-2a`.

### Session Estimation Rules

| Complexity | Tasks | Sessions |
|-----------|-------|----------|
| Data layer only | 2-3 | 1 |
| Single component + tests | 3-4 | 1 |
| Full page (multiple components) | 5-8 | 2-3 |
| Interactive system (diagram, configurator) | 8+ | 3-4 |
| Full site feature (multi-page) | 10+ | 4-8 |

**Always tell Yesid the estimate upfront.** Never surprise with "this will take another session."

### Tools

| Tool | Purpose |
|------|---------|
| `superpowers:writing-plans` | Structured plan generation |
| `planner` agent | Complex feature implementation planning |
| `architect` agent | Architectural decisions (data model, component structure) |

### Exit Criteria

- [ ] Plan written in `docs/plans/`
- [ ] Sub-slices identified with session estimates
- [ ] Dependencies mapped
- [ ] Yesid reviewed and approved

---

## 7. Phase 5 — Slice Spec

**When:** After plan is approved. Before any implementation.
**Goal:** Convert the plan into a spec that CLAUDE.md's Iteration Protocol can execute.

### Process

1. **Write slice spec** — `docs/slices/slice-NN-[name].md` using `docs/slices/_TEMPLATE.md`
2. **Every task ends with STOP** — This is the approval gate. No batching.
3. **Include acceptance criteria** — Specific, testable, no ambiguity.
4. **Include Learn section** — Concepts Yesid should understand after this slice.

### Spec Quality Checklist

Before marking a spec ready:
- [ ] Every task has explicit file paths (create/modify)
- [ ] Every task ends with `**STOP. Ask Yesid to verify.**`
- [ ] Acceptance criteria are testable (not "looks good")
- [ ] Out of scope is defined (prevents drift)
- [ ] Dependencies between tasks are documented
- [ ] Learn section identifies concepts for `docs/learn/`

### The Spec ≠ Implementation Details Rule

Specs describe **outcomes**, not implementation. If a spec says "reduce max rotation from 3 to 1.5 degrees," the real spec is: "tilt should feel weighty and subtle, not jittery." Extract the desired OUTCOME, then decide the implementation. Log decisions in the devlog.

### Exit Criteria

- [ ] Slice spec written in `docs/slices/` using template
- [ ] Every task has STOP gate
- [ ] Acceptance criteria are specific and testable
- [ ] Yesid approved the spec

---

## 8. Phase 6 — Implementation (The Iteration Protocol)

**When:** Slice spec is approved and ready.
**Goal:** Build exactly what the spec says. No more, no less.

### Per-Task Flow (never skip, never batch)

```
1. READ the slice spec task
     |
2. IMPLEMENT one task
     |
3. RUN `bun run test` + `bun run check` → both must pass
     |
4. PRE-FLIGHT visual check (UI tasks only)
     |  - State expected layout at desktop (1440px) and mobile (375px)
     |  - Flag anything that might cause layout issues
     |  - Fix obvious problems before showing Yesid
     |
5. STOP → Tell Yesid:
     |  - What you built (one sentence)
     |  - What to check on localhost:5173 (specific behaviors)
     |  - Decisions made
     |
6. WAIT for Yesid's response
     |
7a. Issues reported → Fix, retest, STOP again
7b. Approved → Move to next task, repeat from step 1
```

### Tools by Implementation Phase

**Data Layer Tasks:**
| Tool | Purpose |
|------|---------|
| Svelte MCP | SvelteKit API patterns, type definitions |
| Context7 | Library docs (Vitest, testing-library) |
| `tdd-guide` agent | Enforce RED → GREEN → REFACTOR |

**Component Building Tasks:**
| Tool | Purpose |
|------|---------|
| Svelte MCP | `svelte-autofixer` — catch Svelte 5 runes mistakes |
| GSAP Master MCP | `understand_and_create_animation`, `optimize_for_performance` |
| Context7 | Tailwind v4 docs, GSAP API reference |
| Claude Preview | `preview_start`, `preview_snapshot`, `preview_screenshot` — visual verification |
| `frontend-design:frontend-design` | Component generation with brand constraints |

**Animation Tasks:**
| Tool | Purpose |
|------|---------|
| GSAP Master MCP | `create_production_pattern`, `debug_animation_issue` |
| Three.js MCP | `learn_threejs` — Threlte scene building |
| Chrome DevTools MCP | `performance_start_trace`, `performance_stop_trace` — animation performance |
| `interaction-design:animation-principles` | GSAP choreography guidance |

**Testing Tasks:**
| Tool | Purpose |
|------|---------|
| `tdd-guide` agent | Write tests first, enforce 80%+ coverage |
| Context7 | Vitest API, testing-library/svelte |
| `build-error-resolver` agent | When `bun run check` fails |

**Visual Verification (Claude Preview):**
```
preview_start → preview_snapshot → preview_console_logs
  → fix issues → preview_screenshot → share proof with Yesid
```

### Iteration Rules (Non-Negotiable)

1. **Never batch multiple tasks.** One task, one approval, then next.
2. **Never write the handoff before approval.**
3. **Never say "I think this should work."** Yesid confirms on his screen.
4. **Never continue coding after completing a task.** The STOP is mandatory.
5. **Ambiguous feedback:** Ask a clarifying question before changing code.
6. **Never close a slice without updating docs/learn/.**

### The Test Table (after every test run)

```
| Test File | Test Name | Status | Failure Reason |
|-----------|-----------|--------|----------------|
| src/...   | it(...)   | PASS   |                |
| src/...   | it(...)   | FAIL   | Expected X, got Y (line NN) |
```

Never say "some tests failed" without listing every failure by name.

### Handling Iteration Feedback

Feedback follows the pattern observed across 22 handoffs:

| Feedback Type | Action | Example |
|--------------|--------|---------|
| Layout/positioning fix | Fix in component, retest, STOP | "Terminal background shorter than wrapper" |
| Content change | Update data layer (never hardcode), retest, STOP | "Change job title to digital infrastructure" |
| Remove element | Remove, update tests, STOP | "Remove the orange line at the bottom" |
| Design pivot | Ask clarifying questions, may need new brainstorm | "Merge hero + manifesto into one section" |
| Architecture change | Update spec, may need new sub-slice | "All text must come from data layer" |

**Average iterations per slice:** 2-4. Plan for this. First-try approval is rare and means the spec was unusually detailed.

---

## 9. Phase 7 — Verification

**When:** After implementing a task, before STOP.
**Goal:** Confirm the work is correct before presenting to Yesid.

### Process
1. `bun run test` + `bun run check` — both must pass
2. Pre-flight visual check (UI tasks) — state expected layout at desktop/mobile
3. Screenshot proof via Claude Preview (UI tasks)
4. Fix obvious problems before STOP

**Tools:** See `CLAUDE.md` → Tool Selection Protocol → Verification Phase.

---

## 10. Phase 8 — PR & Merge

**When:** All tasks in the sub-slice are approved by Yesid.
**Goal:** Create a PR, get final review, merge to main.

### Process
1. Verify `bun run test` + `bun run check` pass on the branch
2. Create PR with summary of all changes and test status
3. Yesid reviews on GitHub
4. Squash-merge to main
5. Delete feature branch
6. Next sub-slice branches from updated main

**Full protocol:** See `CLAUDE.md` → Git & PR Workflow.

---

## 11. Phase 9 — Closing

**When:** ALL tasks in the slice are approved by Yesid.
**Goal:** Document everything, update all reference docs, commit.

### Closing Checklist (in order)

```
1. HANDOFF REPORT
   └─ docs/handoffs/handoff-slice-NN.md (use _TEMPLATE.md)
   └─ All 14 sections filled honestly
   └─ Every file created/modified listed
   └─ Every error documented (even resolved ones)
   └─ Iteration table shows all feedback rounds

2. DEVLOG
   └─ docs/devlog/YYYY-MM-DD.md (use _TEMPLATE.md)
   └─ Session start/end times
   └─ Every command executed
   └─ Every decision with rationale
   └─ Packages added (with why)

3. ARCHITECTURE.md
   └─ Update if structure changed (new routes, components, data types)

4. README.md
   └─ Update if setup/usage changed

5. TESTS.md
   └─ Update for every test added/changed/removed
   └─ Place entries under correct category (Data Layer, Components, Motion, Routes)
   └─ Never append to bottom — find the right section

6. LEARNING DOCS
   └─ docs/learn/[domain]/[concept].md
   └─ Check: did this slice introduce any concept not yet documented?
   └─ If missing: create using docs/learn/_template.md
   └─ If exists: add new file paths to "How We Use It" table
   └─ Update docs/learn/meta.json
   └─ Obsidian format: YAML frontmatter, wikilinks, tags

7. CSS.md (if any CSS changes)
   └─ New tokens, @theme values, scoped styles, z-index values, animations
   └─ Document: name, purpose, where consumed, why

8. PATTERNS.md (if new patterns discovered)
   └─ Name, problem, solution, files, reuse-when

9. TREE.TXT
   └─ cmd /c "tree /F /A | findstr /V /C:"node_modules" /C:".git" /C:".remember" /C:"bun.lockb" /C:".svelte-kit" /C:".vercel" /C:".DS_Store" > tree.txt"

10. COMMIT
    └─ git add -A && git commit -m "feat: complete slice NN — [short desc]" && git push
```

### Closing Tools

| Tool | Purpose |
|------|---------|
| `superpowers:finishing-a-development-branch` | Branch completion workflow |
| `superpowers:verification-before-completion` | Final verification before claiming done |
| Chrome DevTools MCP | `lighthouse_audit` — performance score |
| `chrome-devtools-mcp:a11y-debugging` | Accessibility check |
| Playwright MCP | E2E critical flow verification |
| `code-reviewer` agent | Final code quality review |
| `vercel-plugin:deploy` | Deploy to production |

---

## 12. Quality Gates

### Before Every Task Completion

- [ ] `bun run test` passes
- [ ] `bun run check` passes (zero type errors)
- [ ] Pre-flight visual check done (UI tasks)
- [ ] No hardcoded strings (all through data layer + LocalizedString)
- [ ] No hardcoded colors (all through tokens.css or Tailwind brand)
- [ ] Error handling present
- [ ] `prefers-reduced-motion` respected (animation tasks)

### Before Every Slice Close

- [ ] All tasks approved by Yesid
- [ ] Handoff report complete (all 14 sections)
- [ ] Devlog written
- [ ] TESTS.md updated
- [ ] PATTERNS.md updated (if applicable)
- [ ] Learning docs updated (mandatory — slice isn't done without this)
- [ ] tree.txt regenerated
- [ ] `bun run test` — full suite green
- [ ] `bun run check` — zero errors

### Before Deploy

- [ ] Lighthouse audit: Performance > 90, Accessibility > 90
- [ ] Mobile tested at 375px
- [ ] No console errors
- [ ] JSON-LD schema valid
- [ ] Brand compliance: colors, fonts, dark theme, "yesid." formatting

---

## 13. Parallel Work Rules

### When Parallel Agents Are Allowed

- **Research only** — Multiple agents scanning different reference sites
- **Independent exploration** — Searching docs, reading files with no dependency
- **Yesid must approve** — Never self-decide to parallelize implementation

### When Parallel Agents Are NOT Allowed

- Implementation tasks with dependencies
- Anything that writes to the same files
- When parallelizing would scatter thinking or degrade quality

### Agent Selection Guide

| Situation | Agent | Why |
|-----------|-------|-----|
| Complex feature request | `planner` | Break into phases before coding |
| Code just written | `code-reviewer` | Quality check immediately |
| Bug fix or new feature | `tdd-guide` | Write tests first |
| Architectural decision | `architect` | System design analysis |
| Build fails | `build-error-resolver` | Fix with minimal diffs |
| Security-sensitive code | `security-reviewer` | OWASP Top 10 check |
| Performance concern | `performance-optimizer` | Bottleneck analysis |
| E2E user flow | `e2e-runner` | Playwright test generation |
| Need codebase context | `Explore` agent | Fast multi-file search |

---

## 14. Data-Driven Architecture (Non-Negotiable)

Every string on the site comes from the data layer. This is not optional.

### Content Flow

```
src/lib/data/types.ts          → Interface definitions
src/lib/data/[domain].ts       → Content objects (LocalizedString)
src/lib/data/index.ts          → Barrel exports
Component.svelte               → resolveLocale(content.field)
```

### Adding Content Checklist

1. Define the interface in `types.ts` (or extend existing)
2. Create content object in a data file
3. Export from `index.ts`
4. Component imports from `$lib/data` and calls `resolveLocale()`
5. Write data integrity tests
6. Never put a raw string in a `.svelte` file

### The COALESCE Pattern

```typescript
resolveLocale({ en: "Hello", fr: "Bonjour" }, 'es')
// Returns "Hello" — falls through to English
// Empty strings treated as missing values
```

---

## 15. CSS Architecture Enforcement

Three layers, strict separation. See `docs/reference/CSS.md` for the full reference.

```
tokens.css (semantic tokens)
    ↓ consumed by
app.css @theme (brand utilities)
    ↓ consumed by
Component <style> (scoped layout)
```

### Before Adding Any CSS

1. Check: Does a token exist? → Use `var(--token)`
2. Check: Does a Tailwind class exist? → Use the class
3. Neither exists? → Add to `tokens.css` first, then document in CSS.md
4. Complex layout? → Use scoped `<style>` in the component

---

## 16. Animation Workflow

### Before Animating

1. Read `docs/reference/MOTION.md` — The motion language, principles, and toolkit
2. Check `docs/reference/PATTERNS.md` — Solved animation patterns (entrance guards, SplitText cleanup, FLIP conflicts, etc.)
3. Verify API with GSAP Master MCP — Never guess GSAP method signatures

### Animation Checklist

- [ ] Follows MOTION.md principles (directional, earned, spring physics, layered timing, purposeful)
- [ ] `prefers-reduced-motion` respected
- [ ] ScrollTrigger cleaned up on destroy
- [ ] SplitText reverted in correct order (inner before outer)
- [ ] Entrance animation guards hover handlers (`entranceDone` flag)
- [ ] No competing transforms on the same element

### Tools for Animation

| Tool | Purpose |
|------|---------|
| GSAP Master MCP | `understand_and_create_animation` — design animation approach |
| GSAP Master MCP | `optimize_for_performance` — audit animation performance |
| GSAP Master MCP | `debug_animation_issue` — fix broken animations |
| Chrome DevTools MCP | `performance_start_trace` / `performance_stop_trace` — frame rate analysis |
| Context7 | GSAP ScrollTrigger, SplitText, DrawSVG, MorphSVG, MotionPath API docs |

---

## 17. Session Start Protocol

Every session begins with:

1. **Declare session type** — Planning, Implementation, or Closing
2. **Read checkpoint** — `docs/slices/slice-{NN}-checkpoint.md` → resume where we left off
3. **Check out feature branch** — `git checkout feature/slice-{current}`
4. **Scan for drift** — Check for uncommitted changes or commits made outside Claude Code
5. **Read active slice spec** — `docs/slices/slice-NN.md`
6. **Check PATTERNS.md** — Any relevant solved patterns?
7. **Check memory** — Load relevant context from previous sessions
8. **State the goal** — What does "done" look like for this session?

---

## 18. Session End Protocol

Every session ends with:

1. **Update checkpoint** — `docs/slices/slice-{NN}-checkpoint.md` with current position
2. **Devlog entry** — What was done, decisions made, commands run
3. **Memory update** — Save non-obvious decisions and context for future sessions
4. **State next steps** — What should the next session start with?
5. **Tests passing** — Confirm `bun run test` and `bun run check` both green
6. **No loose ends** — Every open question documented in devlog
7. **Commit** — All changes committed to the feature branch

---

## 19. Document Ecosystem

| Document | Purpose | Update Frequency |
|----------|---------|-----------------|
| `CLAUDE.md` | Rules, protocols, brand | When rules change |
| `docs/reference/WORKFLOW.md` | This file — how work flows | When process evolves |
| `docs/roadmap/PLAN.md` | Master roadmap, slice table, summaries | Every slice close |
| `docs/reference/MOTION.md` | Animation language and toolkit | When motion patterns change |
| `docs/reference/PATTERNS.md` | Reusable solutions catalog | After every slice (if new patterns) |
| `docs/reference/ARCHITECTURE.md` | File structure, component tree, data flow | When structure changes |
| `docs/reference/TESTS.md` | Test file index | Every test add/change/remove |
| `docs/reference/CSS.md` | Token catalog, style rules | Every CSS change |
| `docs/roadmap/FUTURE_PHASES.md` | Post-launch roadmap (parked) | When Phase A ships |
| `docs/slices/` | Slice specs (one per feature) | Before implementation |
| `docs/specs/` | Design specs | During design phase |
| `docs/plans/` | Implementation plans | During planning phase |
| `docs/handoffs/` | Completion reports | After slice approval |
| `docs/devlog/` | Daily work logs | Every session |
| `docs/learn/` | Knowledge base for Yesid | Every slice close |
| `docs/README.md` | Directory index | When docs structure changes |
| `docs/slices/slice-{NN}-checkpoint.md` | Session continuity checkpoint | Every session start/end |

---

## 20. Proven Rhythms (Extracted from 22 Slices)

### What Works

- **One task, one approval.** Batching tasks always leads to rework. The overhead of stopping is cheaper than the cost of building the wrong thing for 3 tasks.
- **Design before code.** Every slice that started with a brainstorm + design spec had fewer iterations (2-3) than slices that jumped to code (4-5+). Slice 06d took 5 iterations; slices 11-12 took 2 each after the design spec practice was established.
- **Data layer first.** Build types and content before components. Components that import from `$lib/data` are immediately testable. Components with inline strings are not.
- **Pre-flight catches 80% of visual bugs.** Reading your own code for layout issues before showing Yesid eliminates most "the background is shorter than the wrapper" feedback rounds.
- **PATTERNS.md saves hours.** The entrance animation hover guard, SplitText cleanup order, and SVG paint-server patterns were each discovered through painful iteration. Consulting PATTERNS.md before implementing animation avoids repeating those lessons.

### What Doesn't Work

- **Jumping to code without a spec.** Results in scope creep, rework, and "I thought the spec said..." conversations.
- **Parallel implementation without approval.** Produces lower quality and makes feedback harder to apply.
- **Guessing GSAP/Svelte APIs.** Always verify with Context7 or GSAP Master MCP. The API you remember is often wrong or outdated.
- **Hardcoding content "to iterate faster."** Always creates cleanup work later. The data layer is fast to write and makes testing trivial.
- **Skipping pre-flight visual check.** The first 3 iterations of most slices were wasted on obvious layout problems that code review would have caught.

---

## 21. Quick Reference: Plugin-to-Phase Map

| Phase | Primary Plugins/Tools |
|-------|----------------------|
| **Research** | Chrome DevTools MCP, `frontend-design-pro:analyze-site`, `frontend-design-pro:trend-researcher`, Context7 |
| **Brainstorm** | `superpowers:brainstorming`, `web-designer`, `frontend-design-pro:design-wizard`, `ui-design:*`, `interaction-design:*` |
| **Design Spec** | `design-systems:component-spec`, `interaction-design:micro-interaction-spec`, `ui-design:responsive-design`, GSAP Master |
| **Planning** | `superpowers:writing-plans`, `planner` agent, `architect` agent |
| **Implementation** | Svelte MCP, GSAP Master, Context7, Claude Preview, `tdd-guide`, `build-error-resolver` |
| **Quality** | `code-reviewer`, `security-reviewer`, Chrome DevTools `lighthouse_audit`, Playwright MCP |
| **Verification** | `superpowers:verification-before-completion`, Claude Preview, Chrome DevTools `lighthouse_audit` |
| **PR & Merge** | `superpowers:finishing-a-development-branch`, `commit-commands:commit-push-pr`, GitHub MCP |
| **Closing** | Doc Updater agent, `engineering:documentation`, `continuous-learning`, `vercel-plugin:deploy` |

**Full tool protocol with ALWAYS/CONSIDER lists:** See `CLAUDE.md` → Tool Selection Protocol.

### Enhancement Opportunities (Skills Not Yet Wired In)

| Tool | What It Does | When To Use |
|------|-------------|-------------|
| `superpowers:finishing-a-development-branch` | PR checklist before merge | End of every sub-slice |
| `superpowers:verification-before-completion` | Pre-completion sanity check | Before every STOP |
| `frontend-design-pro:design-wizard` | Interactive design decisions | During brainstorm sessions |
| `engineering:code-review` | Structured code review | After implementation tasks |
| `engineering:testing-strategy` | Test plan design | 17f (test architecture) |
| `design-systems:design-token` | Token organization | 17a (CSS consolidation) |
| `design-systems:component-spec` | Component API specs | 17d (component standardization) |
| `design-systems:theming-system` | Theme architecture | 17a (light theme prep) |
| `design-systems:accessibility-audit` | WCAG compliance | 17d (ARIA audit) |
| `design-systems:pattern-library` | Pattern organization | 17d (shared UI shells) |
| `interaction-design:animation-principles` | Motion language | 17e (motion consolidation) |
| `ui-design:responsive-design` | Responsive strategy | 17a (breakpoint system) |
| `continuous-learning` | Pattern extraction | Every closing session |
