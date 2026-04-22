# <slice-name>/<subslice-name> — Plan

> Sub-slice-level execution plan (Level 2, PR boundary). Sub-slices do NOT have sub-sub-slices — tasks below are implemented directly via Iteration Protocol. Tasks have NO files; they live in TodoWrite (Claude Code) or Codex equivalent (D19).

> **For agentic workers:** REQUIRED SUB-SKILL — use `superpowers:executing-plans` (or `superpowers:subagent-driven-development` for parallel-eligible tasks) to execute this plan. Steps use checkbox (`- [ ]`) syntax for tracking. STOP at every task per Iteration Protocol.

**Goal:** <!-- FILL IN: one sentence outcome (matches spec.md § Goal). -->

**Architecture:** <!-- FILL IN: high-level approach in one or two sentences. What gets added / changed / removed and how it connects to existing seams. -->

**Tech Stack:** <!-- FILL IN: relevant subset for this sub-slice (or "inherited from project — no stack changes"). -->

**Branch:** <!-- FILL IN: feature/slice-<name>-<letter> --> (worktree per D18: `.worktrees/<slice>-<letter>/`)

**Multi-session estimate:** <!-- FILL IN: typically 1–2 sessions for a sub-slice. If >3, consider splitting. -->

**Spec:** [./spec.md](spec.md) · **Parent slice plan:** [../plan.md](../plan.md)

**Prerequisite:** <!-- FILL IN: prior sub-slices / external state required, or "none". -->

<!-- FILL IN: replace `<slice-name>` and `<subslice-name>` in the title. -->

---

## Important context

> What an executing AI / engineer needs to know BEFORE reading the tasks. Transit-style preamble — keeps execution aligned with prior decisions.

- <!-- FILL IN: current state of the system this sub-slice modifies -->
- <!-- FILL IN: what already works (so the executor doesn't re-build it) -->
- <!-- FILL IN: what does NOT exist yet that this sub-slice creates -->
- <!-- FILL IN: relevant prior decisions from spec.md (D-numbered) the executor should respect -->
- <!-- FILL IN: dependencies on other sub-slices / external systems and their state -->
- <!-- FILL IN: anything intentionally NOT in scope (one-line; full list in § Out of scope) -->

## Read these files first

> Files the executor must read in full before touching code. Sequencing matters — list in read-order.

- <!-- FILL IN: spec.md (always) -->
- <!-- FILL IN: parent plan ../plan.md -->
- <!-- FILL IN: governance docs (e.g., AGENTS.md, docs/reference/<rule>.md) relevant to this sub-slice -->
- <!-- FILL IN: source files the sub-slice will modify or depend on (give full paths) -->
- <!-- FILL IN: prior sub-slice handoffs.md if this builds on shipped work -->

## Hard constraints

> Non-negotiable boundaries for this sub-slice. Violating any of these triggers STOP + ask owner.

- <!-- FILL IN: e.g., "Do not modify the database schema." -->
- <!-- FILL IN: e.g., "Do not refactor unrelated files." -->
- <!-- FILL IN: e.g., "Do not introduce a new dependency without approval." -->
- <!-- FILL IN: e.g., "Keep <storage> as <backend> — do not migrate." -->
- <!-- FILL IN: e.g., "Do not invent a second <X> when one is enough." -->
- <!-- FILL IN: e.g., "Implementation must remain boring, minimal, explicit." -->

## Canonical commands

> Ground truth for verification, build, run during this sub-slice. Typically inherited from the parent slice plan; restate here so the executor doesn't have to cross-reference.

| Purpose       | Command                                              |
| ------------- | ---------------------------------------------------- |
| Install       | <!-- FILL IN or "inherited from parent" -->          |
| Build         | <!-- FILL IN or "inherited" -->                      |
| Test (unit)   | <!-- FILL IN or "inherited" -->                      |
| Test (E2E)    | <!-- FILL IN, "inherited", or "n/a" -->              |
| Lint          | <!-- FILL IN or "inherited" -->                      |
| Typecheck     | <!-- FILL IN, "inherited", or "n/a" -->              |
| Run locally   | <!-- FILL IN or "inherited" -->                      |
| Migrate (DB)  | <!-- FILL IN, "inherited", or "n/a" -->              |
| Run secrets   | <!-- FILL IN: e.g., `op run --env-file=.env -- <cmd>` or "inherited" --> |

## Session layout

> How this sub-slice breaks into wall-clock sessions. Most sub-slices run in 1–2 sessions; >3 is a re-scope signal.

- **Session 1 — <goal>** — implement Tasks <N>–<M>. Closing budget at task <K>.
- **Session 2 — <goal>** — implement remaining tasks. Run `/workflow-close-slice` at end.

<!-- FILL IN per the actual shape. Adjust task assignments as scope shifts. -->

## File structure

> Tables of every file this sub-slice creates, modifies, or removes. Prevents drift; gives reviewers / future engineers an at-a-glance scope summary. Keep separate tables per category (Create / Modify / Delete / Outside-repo).

### Files to create

| Path | Created in task | Purpose |
|------|-----------------|---------|
| <!-- FILL IN: `path/to/new-file.ts` --> | <!-- task <slice-tag>-N --> | <!-- FILL IN --> |

### Files to modify

| Path | Modified in task | Change |
|------|------------------|--------|
| <!-- FILL IN: `path/to/existing-file.ts` --> | <!-- task <slice-tag>-N --> | <!-- FILL IN --> |

### Files to delete

| Path | Deleted in task | Why |
|------|-----------------|-----|
| <!-- FILL IN: `path/to/obsolete-file.ts` --> | <!-- task <slice-tag>-N --> | <!-- FILL IN --> |

### Files outside repo (cloud, global config, etc.)

| Path | Touched in task | Action |
|------|-----------------|--------|
| <!-- FILL IN: e.g., `<cloud>/<project>/docs/learn/<concept>.md` --> | <!-- task <slice-tag>-N --> | <!-- create / modify / delete --> |

## Tasks

> Each task = one Level 3 unit. Each ends with **STOP. Ask owner to verify before next task.** Iteration Protocol applies (per AGENTS.md § Iteration Protocol). Average 2–4 iterations per task.

---

### Task <slice-tag>-1 — <task title>

- **Goal:** <!-- FILL IN: one-sentence outcome. -->
- **Files:**
  - Create: <!-- FILL IN: `path/to/file` -->
  - Modify: <!-- FILL IN: `path/to/file` -->
  - Test: <!-- FILL IN: `path/to/test` -->
- **Dependencies:** <!-- FILL IN: prior tasks / external state required, or "none" -->

**Steps:**

- [ ] **Step 1:** <!-- FILL IN: exact instruction. Be specific — file paths, function names, test names. -->
- [ ] **Step 2:** <!-- FILL IN -->
- [ ] **Step 3:** <!-- FILL IN -->
- [ ] **Step 4:** Run canonical verification commands (see § Canonical commands). All must pass.
- [ ] **Step 5:** Pre-flight check (UI / output-shape work only) — state expected output, flag overflow / missing / shape mismatch, fix obvious issues.
- [ ] **Step 6:** Append per-task section to `../devlog.md` current session block AND a `### Task <slice-tag>-1` block to `./handoff.md` per the handoff template.

**Verification:**

<!-- FILL IN: which canonical command(s) prove this task is done + what a green result looks like. Be specific (e.g., "pytest tests/test_foo.py: 12 passed" not "tests pass"). -->

**STOP. Ask owner to verify before Task 2.**

> State to owner: what you built (one sentence), what to verify (specific behaviors / outputs / URLs), any decisions made, the budget row. Each devlog session block AND each handoff per-task entry MUST carry tool attribution (`Tool:` / `Planned by:` / `Implemented by:`) per AGENTS.md § Session header format.

---

### Task <slice-tag>-2 — <task title>

<!-- Same structure. STOP gate at the end. -->

**STOP. Ask owner to verify before Task 3.**

---

### Task <slice-tag>-3 — <task title>

<!-- Same structure. -->

**STOP. Ask owner to verify before close.**

---

<!-- Add / remove task blocks as needed. Typical sub-slice: 2–5 tasks. If you reach 8+, the sub-slice is probably too large — split it before starting. -->

## Execution order

> Which tasks depend on which. Which can parallelize (owner approval required for parallel implementation per AGENTS.md § Hard rules).

- Task <slice-tag>-1 → Task <slice-tag>-2 → Task <slice-tag>-3 (sequential)
- <!-- FILL IN: any branches / parallel-eligible tasks if applicable -->

## Validation to run

> Acceptance gates. Run after every task completion AND once at the end of the sub-slice (per AGENTS.md § Slice Closing). Owner approval at end gate is mandatory.

After every task:
- <!-- FILL IN: e.g., `bun run test` — green -->
- <!-- FILL IN: e.g., `bun run check` — 0 errors -->
- <!-- FILL IN: pre-flight visual check at canonical breakpoints if UI -->

At sub-slice close (before `/workflow-close-slice`):
- <!-- FILL IN: full test suite green -->
- <!-- FILL IN: lint clean -->
- <!-- FILL IN: type check clean -->
- <!-- FILL IN: handoff.md per-task sections all present -->
- <!-- FILL IN: any integration / E2E check that proves the sub-slice goal end-to-end -->

## Common pitfalls

> Traps to avoid in this sub-slice. Reference `<cloud>/workflow-knowledge/os-quirks/<os>.md` for cross-project platform-specific gotchas if your project maintains one.

- <!-- FILL IN: e.g., "Don't run `bun install` from the worktree — use the main repo checkout." -->
- <!-- FILL IN: e.g., "Migration `0007` requires `init-db` not `alembic upgrade head` directly." -->
- <!-- FILL IN: e.g., "GitHub Actions cron is UTC — local Eastern check is not the same." -->
- <!-- FILL IN: domain-specific gotchas surfaced during planning -->

## Out of scope

> Things this sub-slice explicitly does NOT do. Prevents scope drift mid-execution. Use this section liberally; future sub-slices reference it.

- <!-- FILL IN: e.g., "Does not implement <feature Y> — that lands in sub-slice <letter>." -->
- <!-- FILL IN: e.g., "Does not change <subsystem Z>." -->
- <!-- FILL IN: e.g., "No DB schema changes — those land in sub-slice <letter>." -->

## Notes

<!-- FILL IN: cross-cutting context, links to prior art / research, anything else the executor should know that doesn't fit above. -->
