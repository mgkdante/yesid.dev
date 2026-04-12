# Slice 0 — Repo Hygiene + Workflow Infrastructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize docs/, update CLAUDE.md and WORKFLOW.md with CI/CD branching, checkpoint protocol, and proactive tool selection — establishing infrastructure for Slice 17.

**Architecture:** Pure docs/config refactor. Zero code changes. File moves reorganize `docs/` into clear categories. CLAUDE.md and WORKFLOW.md get new sections for branching, checkpoints, and tool selection. `.gitignore` and `.claude/settings.local.json` get config updates.

**Tech Stack:** Git, markdown, JSON config

**Design spec:** `docs/specs/2026-04-11-slice-00-repo-hygiene-design.md`

---

## File Structure

### Files to Create

```
docs/slices/slice-00-checkpoint.md          — CREATE: session checkpoint file
docs/devlog/slice-00-repo-hygiene.md        — CREATE: devlog for this slice
docs/README.md                              — CREATE: directory index
docs/reference/CSS.md                       — CREATE: placeholder for 17a
docs/handoffs/handoff-slice-00.md           — CREATE: closing handoff
```

### Files to Modify

```
CLAUDE.md                                   — MODIFY: active slice, new sections, path updates
docs/reference/WORKFLOW.md                            — MODIFY: new phases, tool tables, path updates
.gitignore                                  — MODIFY: add .superpowers/brainstorm/
.claude/settings.local.json                 — MODIFY: disable worktrees
```

### Directories to Create

```
docs/reference/                             — Evergreen project docs
docs/roadmap/                               — Forward-looking docs
docs/specs/                                 — Design specs (promoted)
docs/plans/                                 — Implementation plans (promoted)
docs/archive/                               — Historical artifacts
docs/archive/brainstorms/                   — Visual companion HTMLs
docs/archive/mockups/                       — HTML mockups
```

### Files to Move (Task 2 + Task 3)

```
# Task 2: Archive
.superpowers/brainstorm/*                   → docs/archive/brainstorms/
docs/superpowers/mockups/*                  → docs/archive/mockups/

# Task 3: Reorganize
docs/reference/ARCHITECTURE.md                        → docs/reference/ARCHITECTURE.md
docs/reference/WORKFLOW.md                            → docs/reference/WORKFLOW.md
docs/reference/MOTION.md                              → docs/reference/MOTION.md
docs/reference/PATTERNS.md                            → docs/reference/PATTERNS.md
docs/reference/TESTS.md                               → docs/reference/TESTS.md
docs/roadmap/PLAN.md                                → docs/roadmap/PLAN.md
docs/roadmap/FUTURE_PHASES.md                       → docs/roadmap/FUTURE_PHASES.md
docs/plan/standardization.md                → docs/roadmap/standardization.md
docs/specs/*                    → docs/specs/
docs/plans/*                    → docs/plans/
docs/research/findings.md                            → docs/research/findings.md
docs/reference-upwork-lane-analysis.md      → docs/research/reference-upwork-lane-analysis.md
docs/design-psychology-report.md            → DELETE (duplicate of docs/research/design-psychology-report.md)
docs/archive/test_helper.md                         → docs/archive/test_helper.md
docs/slices/13-handoff-notes.md             → docs/archive/13-handoff-notes.md
docs/slices/13e-research/                   → docs/archive/13e-research/
```

### Directories to Remove (after moves)

```
docs/superpowers/                           — REMOVE (empty after moves)
docs/plan/                                  — REMOVE (empty after moves)
```

---

## Task 1: Create branch + checkpoint file + devlog

**Files:**
- Create: `docs/slices/slice-00-checkpoint.md`
- Create: `docs/devlog/slice-00-repo-hygiene.md`

- [ ] **Step 1: Create feature branch from main**

```bash
git checkout main
git pull origin main
git checkout -b feature/slice-00-repo-hygiene
```

- [ ] **Step 2: Create the checkpoint file**

Create `docs/slices/slice-00-checkpoint.md`:

```markdown
# Slice 0 — Checkpoint

**Last updated:** 2026-04-11 | Session 1
**Branch:** feature/slice-00-repo-hygiene
**PR:** not yet created

## Current Position
- **Sub-slice:** Slice 0 (single slice)
- **Task:** 1 of 8
- **Status:** in-progress

## What's Merged Into Main
| Sub-slice | Branch | PR | Merged |
|-----------|--------|-----|--------|
| (none yet) | | | |

## What's In Progress
- Task 1: Create branch + checkpoint file + devlog

## Open Decisions
- None

## Blockers
- None

## Next Session Should
1. Read this file
2. Check out branch `feature/slice-00-repo-hygiene`
3. Resume at current task
```

- [ ] **Step 3: Create the devlog**

Create `docs/devlog/slice-00-repo-hygiene.md`:

```markdown
# Devlog — Slice 0: Repo Hygiene + Workflow Infrastructure

**Date:** 2026-04-11
**Branch:** feature/slice-00-repo-hygiene
**Spec:** docs/specs/2026-04-11-slice-00-repo-hygiene-design.md

## Session 1

### Goal
Reorganize docs/, update CLAUDE.md + WORKFLOW.md with CI/CD branching, checkpoint protocol, proactive tool selection.

### Decisions
- Branching: hybrid (one branch per sub-slice, commits per task, one PR to merge)
- Session continuity: devlog + checkpoint file
- Parallelism: strictly sequential for Slice 17
- Brainstorm artifacts: archived to docs/archive/brainstorms/
- Claude Code worktrees: disabled (feature branches provide isolation)

### Changes Log
(Updated as tasks complete)
```

- [ ] **Step 4: Commit**

```bash
git add docs/slices/slice-00-checkpoint.md docs/devlog/slice-00-repo-hygiene.md
git commit -m "chore(slice-00): create checkpoint file + devlog"
```

**STOP. Ask Yesid to verify the branch exists and files are created.**

---

## Task 2: Archive brainstorm artifacts

**Files:**
- Move: `.superpowers/brainstorm/` → `docs/archive/brainstorms/`
- Move: `docs/superpowers/mockups/` → `docs/archive/mockups/`
- Modify: `.gitignore`

- [ ] **Step 1: Create archive directories**

```bash
mkdir -p docs/archive/brainstorms
mkdir -p docs/archive/mockups
```

- [ ] **Step 2: Move brainstorm HTMLs to archive**

```bash
cp -r .superpowers/brainstorm/* docs/archive/brainstorms/
```

Note: We copy rather than move because `.superpowers/` may have git state files. The original gets gitignored in Task 7.

- [ ] **Step 3: Move mockups to archive**

```bash
cp -r docs/superpowers/mockups/* docs/archive/mockups/
```

- [ ] **Step 4: Verify archive contents**

```bash
ls docs/archive/brainstorms/ | head -5
ls docs/archive/mockups/
```

Expected: brainstorm session directories and mockup HTML files present.

- [ ] **Step 5: Commit**

```bash
git add docs/archive/
git commit -m "chore(slice-00): archive brainstorm HTMLs + mockups to docs/archive/"
```

**STOP. Ask Yesid to verify archive contains the expected files.**

---

## Task 3: Reorganize docs/ structure

**Files:**
- Create: `docs/reference/`, `docs/roadmap/`, `docs/specs/`, `docs/plans/`
- Move: all files per the File Structure section above
- Create: `docs/README.md`
- Create: `docs/reference/CSS.md` (placeholder)

- [ ] **Step 1: Create target directories**

```bash
mkdir -p docs/reference
mkdir -p docs/roadmap
mkdir -p docs/specs
mkdir -p docs/plans
```

- [ ] **Step 2: Move evergreen docs to reference/**

```bash
git mv docs/reference/ARCHITECTURE.md docs/reference/ARCHITECTURE.md
git mv docs/reference/WORKFLOW.md docs/reference/WORKFLOW.md
git mv docs/reference/MOTION.md docs/reference/MOTION.md
git mv docs/reference/PATTERNS.md docs/reference/PATTERNS.md
git mv docs/reference/TESTS.md docs/reference/TESTS.md
```

- [ ] **Step 3: Move roadmap docs**

```bash
git mv docs/roadmap/PLAN.md docs/roadmap/PLAN.md
git mv docs/roadmap/FUTURE_PHASES.md docs/roadmap/FUTURE_PHASES.md
git mv docs/plan/standardization.md docs/roadmap/standardization.md
rmdir docs/plan
```

- [ ] **Step 4: Promote specs and plans**

```bash
git mv docs/specs/* docs/specs/
git mv docs/plans/* docs/plans/
```

- [ ] **Step 5: Consolidate research files**

```bash
git mv docs/research/findings.md docs/research/findings.md
git mv docs/reference-upwork-lane-analysis.md docs/research/reference-upwork-lane-analysis.md
git rm docs/design-psychology-report.md
```

(The duplicate is removed — `docs/research/design-psychology-report.md` already exists.)

- [ ] **Step 6: Move misc to archive**

```bash
git mv docs/archive/test_helper.md docs/archive/test_helper.md
git mv docs/slices/13-handoff-notes.md docs/archive/13-handoff-notes.md
git mv docs/slices/13e-research docs/archive/13e-research
```

- [ ] **Step 7: Remove empty directories**

```bash
rmdir docs/superpowers/mockups 2>/dev/null
rmdir docs/superpowers/specs 2>/dev/null
rmdir docs/superpowers/plans 2>/dev/null
rmdir docs/superpowers 2>/dev/null
```

- [ ] **Step 8: Create CSS.md placeholder**

Create `docs/reference/CSS.md`:

```markdown
# CSS Architecture

**Last updated:** 2026-04-11
**Status:** Placeholder — full documentation created in Slice 17a

See `CLAUDE.md` → CSS Architecture section for current rules.
Full design system documentation will be built in Slice 17a (Design System + CSS Consolidation).
```

- [ ] **Step 9: Create docs/README.md**

Create `docs/README.md`:

```markdown
# docs/ — Project Documentation

## Directory Index

| Directory | Purpose | When to Use |
|-----------|---------|-------------|
| `reference/` | Evergreen project docs — architecture, workflow, patterns, tests, motion, CSS | Read at session start. Update at slice close. |
| `roadmap/` | Forward-looking docs — master plan, future phases, standardization spec | Read when planning. Update when roadmap changes. |
| `slices/` | Slice specs — one per feature/sub-slice, uses `_TEMPLATE.md` | Read before implementation. Write during planning. |
| `specs/` | Design specs — visual/architectural specs from brainstorm sessions | Write during brainstorm. Read during planning + implementation. |
| `plans/` | Implementation plans — task-by-task breakdowns from design specs | Write during planning. Read during implementation. |
| `handoffs/` | Handoff reports — completion reports per slice, uses `_TEMPLATE.md` | Write at slice close. Read for historical context. |
| `devlog/` | Session logs — daily work logs with decisions, commands, changes | Write every session. Read to resume context. |
| `learn/` | Knowledge base — Obsidian-format concept docs organized by domain | Write at slice close. Read to learn/review concepts. |
| `research/` | Competitive scans, analysis, findings from research phases | Write during research. Read during brainstorm. |
| `archive/` | Historical artifacts — brainstorm HTMLs, old mockups, misc | Rarely accessed. Preserved for future knowledge extraction. |

## Key Files

- `reference/WORKFLOW.md` — How work flows from idea to shipped code
- `reference/ARCHITECTURE.md` — File structure, component tree, data flow
- `reference/PATTERNS.md` — Reusable solutions catalog from past slices
- `reference/MOTION.md` — Animation language and toolkit
- `reference/TESTS.md` — Test file index by category
- `reference/CSS.md` — CSS architecture and token catalog
- `roadmap/PLAN.md` — Master roadmap with slice table
- `roadmap/standardization.md` — Slice 17 standardization spec
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore(slice-00): reorganize docs/ — reference, roadmap, specs, plans, research, archive"
```

**STOP. Ask Yesid to verify the new directory structure matches the spec.**

---

## Task 4: Fix all internal references

**Files:**
- Modify: every `.md` file with old `docs/` paths

- [ ] **Step 1: Find all old path references**

Run grep to find all files referencing old paths:

```bash
grep -rl "docs/WORKFLOW\|docs/PATTERNS\|docs/ARCHITECTURE\|docs/MOTION\|docs/TESTS\|docs/PLAN\|docs/FUTURE_PHASES\|docs/superpowers/specs\|docs/superpowers/plans\|docs/findings\|docs/test_helper" --include="*.md" .
```

- [ ] **Step 2: Update references in each file found**

For every file returned in Step 1, update old paths to new paths:

| Old Path | New Path |
|----------|----------|
| `docs/reference/WORKFLOW.md` | `docs/reference/WORKFLOW.md` |
| `docs/reference/PATTERNS.md` | `docs/reference/PATTERNS.md` |
| `docs/reference/ARCHITECTURE.md` | `docs/reference/ARCHITECTURE.md` |
| `docs/reference/MOTION.md` | `docs/reference/MOTION.md` |
| `docs/reference/TESTS.md` | `docs/reference/TESTS.md` |
| `docs/roadmap/PLAN.md` | `docs/roadmap/PLAN.md` |
| `docs/roadmap/FUTURE_PHASES.md` | `docs/roadmap/FUTURE_PHASES.md` |
| `docs/specs/` | `docs/specs/` |
| `docs/plans/` | `docs/plans/` |
| `docs/research/findings.md` | `docs/research/findings.md` |
| `docs/archive/test_helper.md` | `docs/archive/test_helper.md` |

Important: Also update the WORKFLOW.md `**Companion to:**` header line (now at `docs/reference/WORKFLOW.md`) to reference sibling files:
```markdown
**Companion to:** `CLAUDE.md` (rules), `roadmap/PLAN.md` (roadmap), `MOTION.md` (animation), `PATTERNS.md` (solutions)
```

Also update the Document Ecosystem table in Section 17 of WORKFLOW.md — all paths must reflect new locations.

- [ ] **Step 3: Verify zero broken references**

```bash
grep -rn "docs/superpowers/" --include="*.md" . | grep -v "docs/archive/" | grep -v "docs/specs/2026-04-11-slice-00"
```

Expected: zero results (all old superpowers references moved, except the Slice 0 spec referencing its own history).

```bash
grep -rn "docs/WORKFLOW\.md\|docs/PATTERNS\.md\|docs/ARCHITECTURE\.md\|docs/MOTION\.md\|docs/TESTS\.md" --include="*.md" . | grep -v "docs/reference/"
```

Expected: zero results (all references updated to `docs/reference/` paths). Exception: CLAUDE.md references get updated in Task 5.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix(slice-00): update all internal doc references to new paths"
```

**STOP. Ask Yesid to spot-check a few files for correct references.**

---

## Task 5: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

This is the largest single task. CLAUDE.md gets 6 new/updated sections.

- [ ] **Step 1: Update completed slices list**

Change:
```
01, 02, 03, 04, 05, 06, 06b, 06d, A, B, B+, C, 07, 08, 09, 09b, 09c-1, 09c-2a, 09c-2b, 10, 10d+, 11, 12, 13a
```

To:
```
01, 02, 03, 04, 05, 06, 06b, 06d, A, B, B+, C, 07, 08, 09, 09b, 09c-1, 09c-2a, 09c-2b, 10, 10d+, 11, 12, 13
```

- [ ] **Step 2: Update active slice**

Replace the entire "Active slice" block with:

```markdown
**Active slice:** 0 — Repo Hygiene + Workflow Infrastructure

- Spec: `docs/specs/2026-04-11-slice-00-repo-hygiene-design.md`
- Plan: `docs/plans/2026-04-11-slice-00-repo-hygiene.md`
- Branch: `feature/slice-00-repo-hygiene`
- After merge: active slice becomes 17 — Standardization
```

- [ ] **Step 3: Update all docs path references in CLAUDE.md**

Update every `docs/` reference in the file:
- `docs/reference/WORKFLOW.md` → `docs/reference/WORKFLOW.md`
- `docs/reference/PATTERNS.md` → `docs/reference/PATTERNS.md`
- `docs/reference/ARCHITECTURE.md` → `docs/reference/ARCHITECTURE.md`
- `docs/reference/MOTION.md` → `docs/reference/MOTION.md`
- `docs/reference/TESTS.md` → `docs/reference/TESTS.md`
- `docs/reference/CSS.md` → `docs/reference/CSS.md`
- `docs/specs/` → `docs/specs/`
- `docs/plans/` → `docs/plans/`

- [ ] **Step 4: Add Git & PR Workflow section**

Add after the "Iteration Protocol" section:

```markdown
## Git & PR Workflow

### Branch Strategy
- One branch per sub-slice: `feature/slice-{NN}{letter}`
- Branch from `main`, PR back to `main`
- Never commit directly to `main`

### Branch Naming
- `feature/slice-00-repo-hygiene`
- `feature/slice-17a-design-system`
- `feature/slice-17b-service-layer`
- `feature/slice-17c-zod-schemas`
- `feature/slice-17d-component-api`
- `feature/slice-17e-motion-consolidation`
- `feature/slice-17f-test-architecture`
- `feature/slice-17g-learning-docs`

### PR Protocol
1. All tasks complete and approved by Yesid
2. `bun run test` + `bun run check` pass
3. Create PR with summary of all changes
4. Yesid reviews PR on GitHub
5. Squash-merge to main
6. Delete feature branch
7. Next sub-slice branches from updated main

### Commit Convention (unchanged)
`<type>(slice-NN): <description>`

Types: feat, fix, refactor, docs, test, chore, perf, ci
```

- [ ] **Step 5: Add Session Checkpoint section**

Add after "Git & PR Workflow":

```markdown
## Session Checkpoint

Every session reads and updates the checkpoint file:
- Located at `docs/slices/slice-{NN}-checkpoint.md`
- One per major slice (e.g., Slice 17 has one checkpoint, not seven)

Start of session: read checkpoint → resume where we left off.
End of session: update checkpoint → clean handoff to next session.

Contents: current sub-slice, task number, branch name, what's merged, what's pending, blockers.
```

- [ ] **Step 6: Add Superpowers Output Paths section**

Add in the "Plugins & Tools" section:

```markdown
### Superpowers Output Paths (Override Defaults)
- Design specs → `docs/specs/` (not docs/specs/)
- Implementation plans → `docs/plans/` (not docs/plans/)
- Visual companion HTMLs → ephemeral, `.gitignore`d
```

- [ ] **Step 7: Add Tool Selection Protocol section**

Add as a new major section after "Plugins & Tools". Full content is defined in the spec — copy the complete Tool Selection Protocol section from `docs/specs/2026-04-11-slice-00-repo-hygiene-design.md` section 5.

Include all phases: Research, Brainstorm, Planning, Implementation, Code Review, Verification, PR & Merge, Closing — each with ALWAYS and CONSIDER lists.

- [ ] **Step 8: Add Proactive Tool Triggers section**

Add immediately after Tool Selection Protocol. Full content from spec section 6:

```markdown
### Proactive Tool Triggers (Hard Rules)

1. Editing a .svelte file? → Check Svelte MCP autofixer
2. Using any library API? → Verify with Context7 first
3. Touching animation code? → Consult GSAP Master MCP
4. Adding/changing CSS tokens? → Use design-systems:design-token
5. Building a shared component? → Use design-systems:component-spec
6. Writing tests? → Use engineering:testing-strategy
7. About to claim "done"? → Run verification-before-completion
8. Creating a PR? → Run finishing-a-development-branch first
9. Starting any plan? → Run superpowers:brainstorming first
10. Refactoring code? → Use engineering:tech-debt to assess scope
```

- [ ] **Step 9: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(slice-00): update CLAUDE.md — close slice 13, add branching + checkpoint + tool protocol"
```

**STOP. Ask Yesid to review the updated CLAUDE.md, especially the new sections.**

---

## Task 6: Update WORKFLOW.md

**Files:**
- Modify: `docs/reference/WORKFLOW.md` (already moved in Task 3)

- [ ] **Step 1: Update the pipeline diagram**

Replace Section 2 pipeline with:

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

- [ ] **Step 2: Update Session Types table**

Update artifact paths in the Session Types table:
- `docs/specs/` → `docs/specs/`
- `docs/research/findings.md` → `docs/research/findings.md`

- [ ] **Step 3: Add Phase 7 — Verification section**

Add between Implementation and Closing:

```markdown
## Phase 7 — Verification

**When:** After implementing a task, before STOP.
**Goal:** Confirm the work is correct before presenting to Yesid.

### Tools

ALWAYS:
- `superpowers:verification-before-completion` → pre-completion sanity check
- Claude Preview → screenshot proof for UI tasks

CONSIDER:
- Chrome DevTools MCP (`lighthouse_audit`) → performance check
- `prototyping-testing:accessibility-test-plan` → a11y verification

### Exit Criteria
- [ ] `bun run test` + `bun run check` pass
- [ ] Pre-flight visual check done (UI tasks)
- [ ] Screenshot proof captured (UI tasks)
```

- [ ] **Step 4: Add Phase 8 — PR & Merge section**

Add after Verification:

```markdown
## Phase 8 — PR & Merge

**When:** All tasks in the sub-slice are approved by Yesid.
**Goal:** Create a PR, get final review, merge to main.

### Process

1. Run `superpowers:finishing-a-development-branch` — PR readiness checklist
2. Verify `bun run test` + `bun run check` pass on the branch
3. Create PR using `commit-commands:commit-push-pr` or GitHub MCP
4. PR summary includes: all changes, all tasks completed, test status
5. Yesid reviews on GitHub
6. Squash-merge to main
7. Delete feature branch
8. Next sub-slice branches from updated main

### Tools

| Tool | Purpose |
|------|---------|
| `superpowers:finishing-a-development-branch` | PR readiness checklist |
| `commit-commands:commit-push-pr` | Create the PR |
| GitHub MCP | PR management, review comments |

### Exit Criteria
- [ ] PR created with comprehensive summary
- [ ] Yesid approved on GitHub
- [ ] Squash-merged to main
- [ ] Feature branch deleted
```

- [ ] **Step 5: Update Section 15 — Session Start Protocol**

Add checkpoint step:

```markdown
## Session Start Protocol

Every session begins with:

1. **Declare session type** — Planning, Implementation, or Closing
2. **Read checkpoint** — `docs/slices/slice-{NN}-checkpoint.md` → resume where we left off
3. **Check out feature branch** — `git checkout feature/slice-{current}`
4. **Scan for drift** — Check for uncommitted changes or commits made outside Claude Code
5. **Read active slice spec** — `docs/slices/slice-NN.md`
6. **Check PATTERNS.md** — Any relevant solved patterns?
7. **Check memory** — Load relevant context from previous sessions
8. **State the goal** — What does "done" look like for this session?
```

- [ ] **Step 6: Update Section 16 — Session End Protocol**

Add checkpoint step:

```markdown
## Session End Protocol

Every session ends with:

1. **Update checkpoint** — `docs/slices/slice-{NN}-checkpoint.md` with current position
2. **Devlog entry** — What was done, decisions made, commands run
3. **Memory update** — Save non-obvious decisions and context for future sessions
4. **State next steps** — What should the next session start with?
5. **Tests passing** — Confirm `bun run test` and `bun run check` both green
6. **No loose ends** — Every open question documented in devlog
7. **Commit** — All changes committed to the feature branch
```

- [ ] **Step 7: Update Section 17 — Document Ecosystem table**

Update all paths to new locations. Add new entries for `docs/README.md` and checkpoint files.

- [ ] **Step 8: Add Enhancement Opportunities table**

Add as a new subsection in the Quick Reference (Section 19):

```markdown
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
```

- [ ] **Step 9: Commit**

```bash
git add docs/reference/WORKFLOW.md
git commit -m "docs(slice-00): update WORKFLOW.md — add verification, PR phases, checkpoint protocol, tool mapping"
```

**STOP. Ask Yesid to review the updated WORKFLOW.md.**

---

## Task 7: Update .gitignore + project config

**Files:**
- Modify: `.gitignore`
- Modify: `.claude/settings.local.json`

- [ ] **Step 1: Add brainstorm directory to .gitignore**

Append to `.gitignore`:

```
.superpowers/brainstorm/
```

- [ ] **Step 2: Disable Claude Code worktrees**

Update `.claude/settings.local.json` — add the worktree disable setting while preserving existing permissions:

```json
{
  "permissions": {
    "allow": [
      "Bash(bunx playwright:*)",
      "WebFetch(domain:reallygooddesigns.com)",
      "WebFetch(domain:www.wavespace.agency)",
      "mcp__plugin_everything-claude-code_exa__web_search_exa",
      "WebFetch(domain:lusion.co)",
      "WebFetch(domain:www.davidlangarica.dev)",
      "WebSearch",
      "WebFetch(domain:colorlib.com)",
      "Bash(bun run:*)"
    ]
  },
  "worktree": false
}
```

- [ ] **Step 3: Verify .gitignore works**

```bash
git status
```

Verify that `.superpowers/brainstorm/` files no longer appear as untracked (if they were).

- [ ] **Step 4: Commit**

```bash
git add .gitignore .claude/settings.local.json
git commit -m "chore(slice-00): gitignore brainstorm HTMLs + disable Claude worktrees"
```

**STOP. Ask Yesid to verify config changes.**

---

## Task 8: Closing

**Files:**
- Update: `docs/slices/slice-00-checkpoint.md`
- Update: `docs/devlog/slice-00-repo-hygiene.md`
- Create: `docs/handoffs/handoff-slice-00.md`
- Regenerate: `tree.txt`

- [ ] **Step 1: Verify builds and tests pass**

```bash
bun run build
bun run check
bun run test
```

All three must pass. No code was changed, but verify nothing broke from path changes.

- [ ] **Step 2: Update checkpoint to final state**

Update `docs/slices/slice-00-checkpoint.md` with:
- Status: complete
- All 8 tasks listed as done
- Next: create PR

- [ ] **Step 3: Write the devlog closing entry**

Update `docs/devlog/slice-00-repo-hygiene.md` with:
- All changes made per task
- Final directory structure
- Config changes applied

- [ ] **Step 4: Write the handoff report**

Create `docs/handoffs/handoff-slice-00.md` using the handoff template. Key sections:
- Files created/moved/deleted (full list)
- New CLAUDE.md sections added
- New WORKFLOW.md phases added
- Config changes (.gitignore, settings.local.json)
- Zero code changes — pure infrastructure

- [ ] **Step 5: Regenerate tree.txt**

```bash
cmd /c "tree /F /A | findstr /V /C:\"node_modules\" /C:\".git\" /C:\".remember\" /C:\"bun.lockb\" /C:\".svelte-kit\" /C:\".vercel\" /C:\".DS_Store\" > tree.txt"
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore(slice-00): closing — handoff, devlog, checkpoint, tree.txt"
```

- [ ] **Step 7: Create PR to main**

```bash
git push -u origin feature/slice-00-repo-hygiene
```

Then create PR with title: `chore: Slice 0 — Repo Hygiene + Workflow Infrastructure`

Body should include:
- Summary of all changes (docs reorg, CLAUDE.md updates, WORKFLOW.md updates, config)
- List of new sections added
- Acceptance criteria checklist

**STOP. Ask Yesid to review the PR on GitHub before merging.**

---

## Execution Order

All tasks are strictly sequential — each depends on the previous:

```
Task 1 (branch + checkpoint) 
  → Task 2 (archive brainstorms) 
    → Task 3 (reorganize docs/) 
      → Task 4 (fix references) 
        → Task 5 (update CLAUDE.md) 
          → Task 6 (update WORKFLOW.md) 
            → Task 7 (gitignore + config)
              → Task 8 (closing + PR)
```

No parallelization — file moves in Task 3 affect references in Task 4, which affect content in Tasks 5-6.

## Out of Scope

- No code changes
- No CSS work (Slice 17a)
- No knowledge extraction from brainstorm archives (future)
- No workflow plugin creation (future)
- No Slice 17 implementation work
