# yesid. Workflow — The Full Pipeline

**Version:** 2.0 | 2026-04-17 (Slice 17j Workflow Efficiency)
**Companion to:** `CLAUDE.md` (rules + governance), `roadmap/PLAN.md` (project roadmap), `reference/CONSTITUTION.md` (codebase law), `reference/VOCAB.md` (shared lexicon), `reference/MOTION.md` (animation), `reference/PATTERNS.md` (solutions)

This document defines **how work flows** — the operational mechanics. `CLAUDE.md` says *what rules govern*; this says *when, why, and in what order* to act on them. Every session follows this pipeline. No shortcuts.

---

## 1. Slice Hierarchy (Foundation)

Three levels. Strict meaning. **PR boundary is Level 2.**

| Level | Name | Example | Home |
|-------|------|---------|------|
| 1 | **Slice** | Slice 17 (Standardization) | `docs/slices/slice-17/` |
| 2 | **Sub-slice** — PR boundary | 17j (Workflow Efficiency) | `docs/slices/slice-17/slice-17j/` |
| 3 | **Task** — section in plan/log/handoff | 17j-3, 17j-3a | section in `plan.md`, not a folder |
| (4) | **Session** | `### Session 2026-04-17 — Task 17j-3` | heading in `log.md` |

### Per-sub-slice file bundle (4 files)

```
docs/slices/slice-NN/slice-NN<letter>/
  spec.md        → design + rationale. Written at sub-slice start. Amendments logged.
  plan.md        → task-by-task implementation. Sections = Level 3 tasks.
  log.md         → running work record. Session-by-session. Commands + errors + decisions.
  handoff.md     → self-appending closing report. Grows per-task, finalized at PR.
  CHECKPOINT.md  → ephemeral resume context (optional, deleted at PR close).
```

Each bundle is self-contained. AI reads just the file it needs.

### Self-appending handoff mechanics

- **At sub-slice start:** create `handoff.md` with a stub (Scope, Tasks completed, Follow-ups).
- **After each Level 3 task lands:** append `### Task NN-N: <name>` section with: Session date, Commit SHA, Files, What landed, Decisions (D-numbered), Follow-ups.
- **At PR time:** add `## Summary` and `## PR Body` sections. `gh pr create --body-file handoff.md`-adjacent content.
- **Reset to 0:** next sub-slice starts a fresh `handoff.md`.

The handoff is the PR body. Reviewer reads one file.

### Three-tier context model

- **Tier 1 (always-on, in repo):** governance docs (`docs/reference/**`, `docs/roadmap/**`), active slice's bundle, templates.
- **Tier 2 (fetch-on-command, cloud mirror + git):** shipped slice bundles at `<cloud>/yesid.dev/docs/archive/slices/slice-NN/slice-NN<letter>/`, historical specs/plans/devlogs/handoffs/research, Yesid's learn knowledge base at `<cloud>/yesid.dev/docs/learn/`.
- **Tier 3 (cloud indexes):** `<cloud>/yesid.dev/docs/COMPLETED-SLICES.md` + `INDEX.md` — AI reads these on command to find what exists, then fetches the specific artifact.

**Retrieval protocol (cheapest first):** in-context governance → cloud index → specific cloud artifact → `git show`.

Full model: `docs/ARCHIVE.md`.

---

## 2. Session Types

Every session is exactly one type. Declare it at the start.

| Type | Purpose | Artifacts | Duration |
|------|---------|-----------|----------|
| **Planning** | Research, brainstorm, design spec, implementation plan | `slice-NN<letter>/spec.md`, `plan.md` | 1 session |
| **Implementation** | Build one or more Level 3 tasks per Iteration Protocol | Code + tests + append to `log.md` and `handoff.md` | 1–3 sessions per sub-slice |
| **Closing** | Finalize handoff, update governance, run close-script | Final `handoff.md` sections, PR, close-script execution | 0.5–1 session |
| **Non-slice** | Bugfix / config / exploration / hotfix | `docs/sessions/YYYY-MM-DD-<name>.md` | < 1 session usually |

**Hard rule:** A session cannot be two types. Planning produces zero code. Implementation doesn't write specs but can amend them. Closing doesn't add features.

At session start: scan for uncommitted changes or commits made outside Claude Code. Document anything found in `log.md` (slice) or the session file (non-slice).

### When to use non-slice vs slice

Use a **non-slice session** when:
- Touches < 5 files
- No spec needed (scope fits in a paragraph)
- Commits as-is, optional PR
- No multi-session plan required

Use a **slice (or sub-slice)** when:
- Spec makes the work clearer
- Multi-session work likely
- Multiple Level 3 tasks, each with STOP gates
- Ships via PR

---

## 3. The Pipeline (End-to-End)

```
IDEA
  │
  ▼
[1 Research]        Scan competitors, read docs, find patterns
  │
  ▼
[2 Brainstorm]      superpowers:brainstorming → 2–3 design options, Yesid picks
  │
  ▼
[3 Design Spec]     docs/slices/slice-NN/slice-NN<letter>/spec.md
  │
  ▼
[4 Plan]            docs/slices/slice-NN/slice-NN<letter>/plan.md (task list)
  │
  ▼
[5 Implementation]  Task-by-task with approval gates (Iteration Protocol)
  │
  ▼
[6 Verification]    Pre-completion checks + visual proof before each STOP
  │
  ▼
[7 PR & Merge]      Branch → PR → review → squash-merge
  │
  ▼
[8 Closing]         Finalize handoff → governance updates → bun run slice:close
  │
  ▼
SHIPPED → bundle lives in cloud archive, COMPLETED-SLICES.md updated
```

Each phase has specific tools, artifacts, and exit criteria. Skipping creates debt that compounds.

---

## 4. Phase 1 — Research

**When:** Before any new page, section, or major feature.
**Goal:** Understand what great looks like. Never design in a vacuum.

### Process

1. **Competitive scan** — Chrome DevTools MCP to analyze 5–7 Awwwards-quality references at 4 breakpoints (375 / 768 / 1440 / 1920+).
2. **Extract patterns** — Typography, color, rhythm, animation, responsive.
3. **Check PATTERNS.md** — Before inventing, check if a solved pattern exists.
4. **Library docs** — Context7 MCP or Svelte MCP for API verification. Never guess.

### Exit criteria

- [ ] 5+ references scanned at 4 breakpoints
- [ ] Patterns documented (in the upcoming `spec.md` under Research section, or in a shared research doc if cross-slice)
- [ ] PATTERNS.md consulted
- [ ] Yesid confirmed direction

---

## 5. Phase 2 — Brainstorm

**When:** After research, before any spec.
**Goal:** Turn research into 2–3 concrete design options. Yesid picks.

### Process

1. **Invoke `superpowers:brainstorming`** — mandatory. No exceptions.
2. **Generate 2–3 options** — Each option: name, one-sentence pitch, visual feel, animation approach, responsive strategy, risk, session estimate.
3. **Present to Yesid** — Never self-select.
4. **Scratch artifacts** — `.superpowers/brainstorm/` (ephemeral).

### Exit criteria

- [ ] `superpowers:brainstorming` invoked
- [ ] 2–3 options presented with trade-offs
- [ ] Yesid selected
- [ ] Brainstorm artifacts saved

---

## 6. Phase 3 — Design Spec

**When:** After Yesid approves a brainstorm direction.
**Goal:** Translate direction into a visual specification that implementation can follow cold.

### Process

1. Write `docs/slices/slice-NN/slice-NN<letter>/spec.md` using `docs/slices/_TEMPLATE-SUBSLICE/spec.md`.
2. Section-by-section breakdown: layout, content source, animation, responsive, colors.
3. **Self-review cold.** If you couldn't implement this from the spec alone, add detail.
4. Yesid approval before any plan.

### Spec structure

```markdown
# Sub-Slice <NN><letter> — <Name>

Status: Draft | Approved
Approach: <brainstorm option name>

## Goal
## Design Principles
## Reference Sites
## Page Architecture (N Sections)
  Each: layout / content source / typography / animation / responsive / colors
## Interactions
## Out of Scope
```

### Exit criteria

- [ ] `spec.md` written in the bundle folder
- [ ] Every section defined (layout, content, animation, responsive)
- [ ] Self-reviewed cold
- [ ] Yesid approved

---

## 7. Phase 4 — Implementation Plan

**When:** After spec approved.
**Goal:** Break the spec into Level 3 tasks, each with a STOP gate.

### Process

1. Invoke `superpowers:writing-plans`.
2. Estimate sessions — each sub-slice gets a session count. Default to multi-session.
3. Identify dependencies — sequential tasks ordered; independent ones flagged as parallel candidates (with Yesid's approval).
4. Write `plan.md` in the bundle folder.

### Plan structure

```markdown
# Sub-Slice <NN><letter> — Implementation Plan

Goal | Architecture | Tech Stack | Multi-session estimate | Design spec reference

## File Structure
  Files to modify / create

## Task 1: <Name>
  Files: ...
  - [ ] Step 1
  - [ ] Step 2
  - [ ] Step 3: run tests + pre-flight visual check
  **STOP. Ask Yesid to verify.**

## Task 2: <Name>
  ...

## Execution Order
## Out of Scope
```

### Session estimation

| Complexity | Tasks | Sessions |
|------------|-------|----------|
| Data layer only | 2–3 | 1 |
| Single component + tests | 3–4 | 1 |
| Full page | 5–8 | 2–3 |
| Interactive system | 8+ | 3–4 |
| Multi-page feature | 10+ | 4–8 |

**Always tell Yesid the estimate upfront.** Never surprise.

### Exit criteria

- [ ] `plan.md` in bundle
- [ ] Session estimate given
- [ ] Dependencies mapped
- [ ] Yesid approved

---

## 8. Phase 5 — Implementation (The Iteration Protocol)

**You are done when Yesid says you are done.** Tests passing is necessary but not sufficient.

### Per-task flow (never skip, never batch)

```
1. READ the Level 3 task from plan.md
2. IMPLEMENT one task
3. RUN bun run test + bun run check → both pass
4. PRE-FLIGHT visual check (UI tasks only):
   — State expected layout at 1440px + 375px
   — Flag overflow/missing content
   — Fix obvious issues before STOP
5. APPEND to log.md (running record) AND handoff.md (reviewer summary)
6. STOP → Tell Yesid:
   — What you built (one sentence)
   — What to check at http://localhost:5173 (specific behaviors)
   — Decisions made
7. WAIT for Yesid's response
8a. Issues → Fix, retest, STOP again
8b. Approval → Next task, repeat from 1
```

### Iteration rules (non-negotiable)

1. Never batch multiple tasks. One task, one approval.
2. Never write the final handoff summary before approval (but DO append per-task sections as tasks land).
3. Never say "I think this should work." Yesid confirms on his screen.
4. Never continue coding after completing a task. The STOP is mandatory.
5. Ambiguous feedback → ask clarifying question before changing code.
6. Never close a sub-slice without the handoff complete and OS-quirks/VOCAB updates done.

### The test table (after every test run)

```
| Test File | Test Name | Status | Failure Reason |
|-----------|-----------|--------|----------------|
| src/...   | it(...)   | PASS   |                |
| src/...   | it(...)   | FAIL   | Expected X, got Y (line NN) |
```

**Never say "some tests failed" without listing every failure by name.**

### Handling iteration feedback

| Feedback Type | Action |
|--------------|--------|
| Layout/positioning fix | Fix in component, retest, STOP |
| Content change | Update data layer (never hardcode), retest, STOP |
| Remove element | Remove, update tests, STOP |
| Design pivot | Ask clarifying questions, may need new brainstorm |
| Architecture change | Update spec (amendments log), may need new sub-slice |

Average iterations per task: 2–4. Plan for this.

---

## 9. Phase 6 — Verification

**When:** After implementing a task, before STOP.
**Goal:** Confirm correctness before presenting to Yesid.

1. `bun run test` + `bun run check` pass
2. Pre-flight visual check for UI tasks
3. Screenshot proof via Claude Preview for UI tasks
4. Fix obvious problems before STOP

Tools: see §19 Tool Selection Protocol → Verification.

---

## 10. Phase 7 — PR & Merge

**When:** All tasks in the sub-slice are approved. Handoff finalized.

1. Verify `bun run test` + `bun run check` pass on the branch.
2. `gh pr create` with handoff.md content as the body.
3. Yesid reviews on GitHub.
4. Squash-merge to `main`.
5. Delete feature branch.
6. Run `bun run slice:close <N> <letter>` (the close-script) — mirrors bundle to cloud archive, deletes repo folder, updates `COMPLETED-SLICES.md`.
7. Next sub-slice branches from updated `main`.

**Commit convention:** `<type>(slice-NN<letter>): <description>`. Types: feat, fix, refactor, docs, test, chore, perf, ci.

**Branch naming:** `feature/slice-{NN}{letter}` — one branch per sub-slice.

---

## 11. Phase 8 — Closing Checklist

**When:** ALL Level 3 tasks approved. PR ready to create OR just squash-merged.

**Hard checklist — every item mandatory, in order:**

1. **Finalize `handoff.md`** — add `## Summary` + `## PR Body` sections. All per-task appends verified complete.
2. **Governance doc updates:**
   - `docs/reference/CONSTITUTION.md` — if any constitutional principle changed
   - `docs/reference/CSS.md` — if tokens, @theme values, scoped styles, z-index, or animation CSS changed
   - `docs/reference/MOTION.md` — if motion patterns, signatures, or tooling changed
   - `docs/reference/TESTS.md` — every test added/changed/removed, placed in correct category
   - `docs/reference/ARCHITECTURE.md` — if file structure, component tree, or data flow changed
   - `docs/reference/PATTERNS.md` — every reusable solution discovered
3. **VOCAB.md update** — any new brand / industry / workflow term introduced in the sub-slice added to `docs/reference/VOCAB.md`.
4. **OS-quirk logging** — if the slice solved a platform-specific issue (robocopy quirk, Node flag, shell escaping), append to `<cloud>/claude-knowledge/os-quirks/<os>.md` with Problem / Root cause / Fix / Date / Slice. **Hard step, not a suggestion.**
5. **Learn doc** — if the slice introduced a durable concept worth codifying, write `<cloud>/yesid.dev/docs/learn/<domain>/<concept>.md` (Obsidian format: YAML frontmatter, `[[wikilinks]]`, tags).
6. **`tree.txt`** — regenerate:
   ```powershell
   cmd /c "tree /F /A | findstr /V /C:\"node_modules\" /C:\".git\" /C:\".remember\" /C:\"bun.lockb\" /C:\".svelte-kit\" /C:\".vercel\" /C:\".DS_Store\" > tree.txt"
   ```
7. **Commit, push, create PR** — `gh pr create --title "..." --body-file path/to/handoff.md` (or derived PR body).
8. **Post-merge:** `bun run slice:close <N> <letter>` — bundles moves to cloud, folder deleted, index updated.

**The workflow self-enhances:** any mistake caught during this sub-slice becomes a permanent checklist rule here. If you had to re-learn something, it belongs in an OS-quirk, learn doc, VOCAB entry, or PATTERN entry before the slice closes.

---

## 12. Cross-Platform Setup + OS-Quirks Registry

The workflow is OS-agnostic via one env var + a persistent quirks registry.

### Env var

**`YESITO_CLOUD_ROOT`** — points to the local cloud directory.

| OS | Default |
|----|---------|
| Windows | `C:\Users\<user>\Yesito\cloud` |
| macOS | `~/Yesito/cloud` |
| Linux | `~/Yesito/cloud` |

Set via shell profile (Unix) or System Environment Variables (Windows). Scripts fall back to `path.join(os.homedir(), 'Yesito', 'cloud')`.

### OS-quirks registry

Lives at `<cloud>/claude-knowledge/os-quirks/`:

- `README.md` — how the registry works
- `windows.md` — Windows-specific command fixes
- `macos.md` — macOS-specific
- `linux.md` — Linux-specific
- `cross-platform.md` — universal patterns

**Retrieval:** Before troubleshooting a platform command, check the relevant file. Grep first, ask second.

**Write rule:** When solving an OS-specific issue, append to the relevant file with: Problem / Root cause / Fix / Date / Slice. This is enforced as step 4 of the closing checklist.

---

## 13. Quality Gates

### Before every task completion

- [ ] `bun run test` passes
- [ ] `bun run check` passes (zero errors)
- [ ] Pre-flight visual check done (UI)
- [ ] No hardcoded strings (data layer + LocalizedString)
- [ ] No hardcoded colors (tokens.css or Tailwind brand)
- [ ] Error handling present
- [ ] `prefers-reduced-motion` respected (animation)

### Before every sub-slice close

- [ ] All tasks approved by Yesid
- [ ] `handoff.md` finalized (Summary + PR Body sections added)
- [ ] All governance doc updates done
- [ ] VOCAB entries added for new terms
- [ ] OS-quirks appended (if any)
- [ ] Learn docs written (if durable concepts)
- [ ] `tree.txt` regenerated
- [ ] Full test suite green

### Before deploy (eventual)

- [ ] Lighthouse: Performance > 90, Accessibility > 90
- [ ] Mobile tested at 375px
- [ ] No console errors
- [ ] JSON-LD schema valid
- [ ] Brand compliance verified

---

## 14. Parallel Work Rules

### Allowed

- **Research only** — Multiple agents scanning different reference sites
- **Independent exploration** — Reading, searching with no dependency
- **Yesid must approve** — Never self-decide to parallelize implementation

### Not allowed

- Implementation tasks with dependencies
- Anything that writes to the same files
- When parallelizing would scatter thinking

### Agent selection

| Situation | Agent | Why |
|-----------|-------|-----|
| Complex feature request | `planner` | Break into phases |
| Code just written | `code-reviewer` | Quality check |
| Bug fix or new feature | `tdd-guide` | Tests first |
| Architectural decision | `architect` | System design |
| Build fails | `build-error-resolver` | Minimal diffs |
| Security-sensitive | `security-reviewer` | OWASP check |
| Performance concern | `performance-optimizer` | Bottleneck analysis |
| E2E flow | `e2e-runner` | Playwright generation |
| Codebase search | `Explore` | Multi-file search |

---

## 15. Data-Driven Architecture (Non-Negotiable)

Every string on the site comes from the data layer. Not optional.

```
src/lib/data/types.ts       → Interface definitions
src/lib/data/<domain>.ts    → Content objects (LocalizedString)
src/lib/data/index.ts       → Barrel exports
Component.svelte            → resolveLocale(content.field)
```

### Adding content

1. Define interface in `types.ts`
2. Create content object in a data file
3. Export from `index.ts`
4. Component imports from `$lib/data`, calls `resolveLocale()`
5. Write data integrity tests
6. **Never put a raw string in a `.svelte` file**

### COALESCE pattern

```typescript
resolveLocale({ en: "Hello", fr: "Bonjour" }, 'es')
// → "Hello" (falls through to English). Empty strings treated as missing.
```

---

## 16. CSS + Motion (pointers)

**CSS:** Full rules in `docs/reference/CSS.md`. Governance in `CONSTITUTION.md`. Three layers: semantic tokens (`src/lib/styles/tokens.css`) → brand utilities (`src/app.css` `@theme`) → component scope (`<style>`). Top rules: zero hardcoded colors, no `!important`, no inline `style=`, mobile-first, logical properties, no `vh`, no arbitrary Tailwind spacing.

**Motion:** Full reference in `docs/reference/MOTION.md` v2. Snappy Doctrine in `CONSTITUTION.md §8`. 9-signature vocabulary. Shared `gsap.ticker` with IO-gated subscribers. Lazy GSAP plugins. Always verify GSAP API with GSAP Master MCP or Context7. `prefers-reduced-motion` respected everywhere.

---

## 17. Session Start Protocol

Every session begins with:

1. **Declare session type** — Planning, Implementation, Closing, or Non-slice
2. **Read checkpoint** — `docs/slices/slice-NN-checkpoint.md` (or `docs/slices/slice-NN/CHECKPOINT.md` after Task 3b of Slice 17j) → resume where we left off
3. **Check out feature branch** — `git checkout feature/slice-NN<letter>`
4. **Scan for drift** — Check for uncommitted changes or commits made outside Claude Code
5. **Read active bundle** — `spec.md`, `plan.md`, `log.md`, `handoff.md`
6. **Check PATTERNS.md + VOCAB.md** — Any relevant solved patterns? Any term already codified?
7. **State the goal** — What does "done" look like for this session?

---

## 18. Session End Protocol

Every session ends with:

1. **Update checkpoint** — Current position (sub-slice, task, next step)
2. **Append to `log.md`** — What was done, decisions, commands, errors
3. **Append to `handoff.md`** — If tasks landed, add their sections
4. **Ensure tests pass** — `bun run test` + `bun run check` green
5. **Commit** — All changes on the feature branch
6. **State next steps** — What should the next session start with?

---

## 19. Tool Selection Protocol

At each phase transition, invoke relevant tools. Proactive tool use = higher quality output.

### Research Phase

ALWAYS:
- Chrome DevTools MCP → multi-breakpoint competitive scan
- Context7 MCP → verify API signatures before assuming
- `frontend-design-pro:analyze-site` → structured site analysis
- `frontend-design-pro:trend-researcher` → current UI/UX trends

CONSIDER:
- `frontend-design-pro:inspiration-analyzer` → studying specific reference sites
- `deep-research` → broader web research needed
- Figma MCP → Figma designs exist for the feature

### Brainstorm Phase

ALWAYS:
- `superpowers:brainstorming` → mandatory, never skip
- Visual companion → offer for any question with visual content

CONSIDER:
- `frontend-design-pro:design-wizard` → interactive design decisions
- `frontend-design-pro:color-curator` → color palette exploration
- `frontend-design-pro:typography-selector` → font pairing decisions
- `ui-design:color-system` → designing color tokens
- `ui-design:typography-scale` → designing type scales
- `ui-design:spacing-system` → designing spacing tokens
- `design-systems:design-token` → organizing token architecture
- `design-systems:naming-convention` → naming tokens/components
- `design-systems:theming-system` → designing theme switching
- `interaction-design:animation-principles` → designing motion

### Planning Phase

ALWAYS:
- `superpowers:writing-plans` → structured plan creation
- Planner agent → complex feature decomposition

CONSIDER:
- Architect agent → architectural decisions
- `engineering:architecture` → system design evaluation
- `engineering:testing-strategy` → planning test approach
- `engineering:tech-debt` → planning refactors
- `api-design` → designing service layer interfaces

### Implementation Phase

ALWAYS:
- Svelte MCP (`svelte-autofixer`) → every Svelte file edit
- Context7 MCP → before using any library API
- `superpowers:executing-plans` → follow the plan
- Claude Preview → visual verification after UI tasks

CONSIDER:
- GSAP Master MCP → any animation work
- `tdd-workflow` → new features (RED → GREEN → REFACTOR)
- `design-systems:component-spec` → building shared components
- `design-systems:accessibility-audit` → adding ARIA/a11y
- `design-systems:pattern-library` → organizing shared patterns
- `ui-design:responsive-design` → responsive layout decisions
- `ui-design:dark-mode-design` → theme-aware component work
- `ui-design:visual-hierarchy` → layout and emphasis decisions
- `interaction-design:micro-interaction-spec` → hover/click interactions
- `interaction-design:state-machine` → complex component states
- `interaction-design:loading-states` → loading/skeleton patterns

### Code Review Phase (after every task)

ALWAYS:
- Code Reviewer agent → general quality
- TypeScript Reviewer agent → TS-specific issues

CONSIDER:
- Security Reviewer agent → auth, input handling, API calls
- `engineering:code-review` → structured review checklist
- `prototyping-testing:heuristic-evaluation` → UI quality check

### Verification Phase (before every STOP)

ALWAYS:
- `superpowers:verification-before-completion` → pre-completion check
- Claude Preview → screenshot proof for UI tasks

CONSIDER:
- Chrome DevTools MCP (`lighthouse_audit`) → performance check
- `prototyping-testing:accessibility-test-plan` → a11y verification

### PR & Merge Phase

ALWAYS:
- `superpowers:finishing-a-development-branch` → PR readiness checklist
- `commit-commands:commit-push-pr` → create the PR
- GitHub MCP → PR management

### Closing Phase

ALWAYS:
- Doc Updater agent → update ARCHITECTURE.md, README, TESTS.md
- `engineering:documentation` → technical docs quality

CONSIDER:
- `continuous-learning` → extract patterns from this slice's work
- `design-systems:documentation-template` → structured docs

### Proactive Tool Triggers (Hard Rules)

1. Editing a `.svelte` file? → Check Svelte MCP autofixer
2. Using any library API? → Verify with Context7 first
3. Touching animation code? → Consult GSAP Master MCP
4. Adding/changing CSS tokens? → Use `design-systems:design-token`
5. Building a shared component? → Use `design-systems:component-spec`
6. Writing tests? → Use `engineering:testing-strategy`
7. About to claim "done"? → Run `verification-before-completion`
8. Creating a PR? → Run `finishing-a-development-branch` first
9. Starting any plan? → Run `superpowers:brainstorming` first
10. Refactoring code? → Use `engineering:tech-debt` to assess scope
11. Hitting an OS-specific command error? → Check `<cloud>/claude-knowledge/os-quirks/<os>.md` FIRST

---

## 20. Document Ecosystem

**Tier 1 — always loaded, in repo:**

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| `CLAUDE.md` | Rules, core principles, hard rules, brand | When rules change |
| `docs/reference/WORKFLOW.md` | This file — operational mechanics | When process evolves |
| `docs/reference/CONSTITUTION.md` | Codebase law | When a principle changes |
| `docs/reference/CSS.md` | Token catalog, style rules | Every CSS change |
| `docs/reference/MOTION.md` | Animation language + toolkit | When motion patterns change |
| `docs/reference/PATTERNS.md` | Reusable solutions catalog | After every slice (if new patterns) |
| `docs/reference/ARCHITECTURE.md` | File structure, component tree, data flow | When structure changes |
| `docs/reference/TESTS.md` | Test file index | Every test add/change/remove |
| `docs/reference/VOCAB.md` | Shared lexicon | Every slice close (new terms) |
| `docs/reference/ARCHIVE.md` | Three-tier model + retrieval/write protocols | When archival model evolves |
| `docs/roadmap/PLAN.md` | Per-project master plan + slice index | Every slice close |
| `docs/roadmap/FUTURE_PHASES.md` | Parked cross-project wishlist | When Phase A ships |
| `docs/slices/slice-NN/README.md` | Per-Level-1-slice direction + sub-slice index | Per sub-slice close |
| `docs/slices/slice-NN/CHECKPOINT.md` | Live slice state | Every session start/end |
| `docs/slices/slice-NN/slice-NN<letter>/` | Active sub-slice bundle (4 files) | Per session |
| `docs/sessions/` | Non-slice session records | Per non-slice session |

**Tier 2 — fetch-on-command, in cloud:**

| Location | Purpose |
|----------|---------|
| `<cloud>/yesid.dev/docs/archive/slices/slice-NN/slice-NN<letter>/` | Shipped sub-slice bundles |
| `<cloud>/yesid.dev/docs/learn/<domain>/<concept>.md` | Yesid's Obsidian knowledge base |
| `<cloud>/claude-knowledge/token-efficacy/` | Portable research corpus |
| `<cloud>/claude-knowledge/os-quirks/<os>.md` | Cross-project OS command registry |
| `<cloud>/claude-config/` | Config snapshots |

**Tier 3 — cloud indexes (the bridge):**

| Location | Purpose |
|----------|---------|
| `<cloud>/yesid.dev/docs/COMPLETED-SLICES.md` | One-liner index of every shipped slice |
| `<cloud>/yesid.dev/docs/INDEX.md` | Cloud mirror map |

---

## 21. Proven Rhythms (Extracted from 22+ Slices)

### What works

- **One task, one approval.** Batching always leads to rework.
- **Design before code.** Brainstorm + spec = 2–3 iterations. Skip them = 4–5+.
- **Data layer first.** Types + content before components. Testable from day one.
- **Pre-flight catches 80% of visual bugs.** Read your own code for layout issues before STOP.
- **PATTERNS.md saves hours.** Entrance-animation hover guard, SplitText cleanup, SVG paint-server — each discovered painfully once. Consult before implementing.
- **Self-appending handoff > end-of-slice handoff.** Appending per-task catches decisions while they're fresh.

### What doesn't work

- Jumping to code without a spec → scope creep and rework
- Parallel implementation without approval → lower quality, feedback harder to apply
- Guessing GSAP/Svelte APIs → verify with Context7 or GSAP Master MCP
- Hardcoding content "to iterate faster" → always creates cleanup work
- Skipping pre-flight visual check → obvious layout problems hit Yesid
- Manual mirror-and-delete at close → loses the index update, accretion returns

---

## 22. The Self-Enhancing Workflow (Core Principle)

Every mistake solved in one sub-slice becomes a closing-checklist rule so it cannot recur. Quality compounds slice-over-slice.

If during a sub-slice you:
- Re-solved an OS command issue → it belongs in `os-quirks/<os>.md`
- Re-invented a pattern → it belongs in `PATTERNS.md`
- Re-derived a term → it belongs in `VOCAB.md`
- Re-learned a codebase principle → it belongs in `CONSTITUTION.md`
- Re-discovered a durable concept → it belongs in learn/

Before closing, ask: "what did I learn that I don't want to re-learn?" Codify it. The workflow gets smarter automatically.
