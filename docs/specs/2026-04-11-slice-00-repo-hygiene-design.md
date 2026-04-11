# Slice 0 — Repo Hygiene + Workflow Infrastructure

**Status:** approved
**Date:** 2026-04-11
**Est. Sessions:** 1
**Depends on:** Slice 13 complete
**Branch:** `feature/slice-00-repo-hygiene`

---

## Objective

Reorganize `docs/`, update CLAUDE.md and WORKFLOW.md with CI/CD branching workflow, session checkpoint protocol, and proactive tool selection — establishing the infrastructure for Slice 17's 13-14 session refactor.

## Context

After 22+ slices, the docs directory has grown organically. Brainstorm HTMLs mix with specs, orphaned research files sit at the root, and there's no separation between evergreen reference docs and slice lifecycle artifacts. Meanwhile, all work has been committed directly to main with no PR review.

Slice 17 (Standardization) is a 7-sub-slice, 13-14 session refactor. It needs:
- **Proper branching** so changes are reviewed before merging
- **Session continuity** so context doesn't drift across sessions
- **Organized docs** so every session knows where to find and put things
- **Proactive tooling** so the AI harness reaches for the right tools automatically

This slice builds that infrastructure. Zero code changes — pure docs/config.

---

## Decisions (from brainstorm)

| Decision | Choice | Why |
|----------|--------|-----|
| PR granularity | Hybrid: one branch per sub-slice, commits per task, one PR to merge | Maps to iteration protocol. Granular review during work, clean merge history. |
| Session continuity | Devlog + checkpoint file | Checkpoint = single source of truth for resuming. Devlog = narrative. Together they prevent drift. |
| Parallelism | Strictly sequential | Dependency chain is real (17a → 17b → ... → 17g). Parallel work on a deep refactor invites conflicts. |
| Brainstorm artifacts | Archive with future knowledge extraction | HTMLs are ephemeral but contain workflow patterns worth extracting later. |
| Docs structure | Clear categories with one purpose per directory | Separates evergreen reference, roadmap, slice lifecycle, research, and archive. |

---

## Docs Reorganization

### Current Structure (problems)

```
docs/
  ARCHITECTURE.md, WORKFLOW.md, PLAN.md, ...  # mixed at root
  findings.md, test_helper.md, ...            # orphaned files
  design-psychology-report.md                 # duplicate of research/
  plan/standardization.md                     # one file, different location than PLAN.md
  superpowers/specs/                          # valuable but buried
  superpowers/plans/                          # valuable but buried
  superpowers/mockups/                        # ephemeral HTML mockups

.superpowers/brainstorm/                      # 25+ dirs, ~130 HTMLs, ephemeral
```

### Target Structure

```
docs/
├── reference/               # Evergreen project docs (read every session)
│   ├── ARCHITECTURE.md
│   ├── WORKFLOW.md
│   ├── MOTION.md
│   ├── PATTERNS.md
│   ├── TESTS.md
│   └── CSS.md              # (placeholder — created in 17a)
│
├── roadmap/                 # Where the project is headed
│   ├── PLAN.md
│   ├── FUTURE_PHASES.md
│   └── standardization.md
│
├── research/                # Competitive scans, analysis, findings
│   ├── findings.md
│   ├── design-psychology-report.md
│   ├── persuasion_analysis.md
│   ├── scroll_analysis.md
│   └── reference-upwork-lane-analysis.md
│
├── slices/                  # Slice specs (unchanged)
├── handoffs/                # Handoff reports (unchanged)
├── devlog/                  # Session logs (unchanged)
├── learn/                   # Knowledge base (unchanged, expanded in 17g)
│
├── specs/                   # Design specs (promoted from superpowers/specs/)
├── plans/                   # Implementation plans (promoted from superpowers/plans/)
│
└── archive/                 # Historical artifacts, not for daily use
    ├── brainstorms/         # Visual companion HTMLs (from .superpowers/brainstorm/)
    ├── mockups/             # HTML mockups (from superpowers/mockups/)
    ├── test_helper.md
    ├── 13-handoff-notes.md
    └── 13e-research/
```

### What Gets Deleted

- `docs/superpowers/` directory (contents moved to specs/, plans/, archive/mockups/)
- `docs/plan/` directory (contents moved to roadmap/)
- `docs/design-psychology-report.md` (duplicate of research/ copy)
- Loose orphaned files at docs/ root (moved to proper categories)

---

## CLAUDE.md Updates

### 1. Active Slice
- Close Slice 13 → add to completed list
- Set active slice: "Slice 0 — Repo Hygiene + Workflow Infrastructure"
- After Slice 0 merges: active becomes Slice 17

### 2. New Section: Git & PR Workflow

```markdown
## Git & PR Workflow

### Branch Strategy
- One branch per sub-slice: `feature/slice-{NN}{letter}`
- Branch from `main`, PR back to `main`
- Never commit directly to `main`

### Branch Naming
- feature/slice-00-repo-hygiene
- feature/slice-17a-design-system
- feature/slice-17b-service-layer
- feature/slice-17c-zod-schemas
- feature/slice-17d-component-api
- feature/slice-17e-motion-consolidation
- feature/slice-17f-test-architecture
- feature/slice-17g-learning-docs

### PR Protocol
1. All tasks complete and approved by Yesid
2. `bun run test` + `bun run check` pass
3. Create PR with summary of all changes
4. Yesid reviews PR on GitHub
5. Squash-merge to main
6. Delete feature branch
7. Next sub-slice branches from updated main

### Commit Convention (unchanged)
<type>(slice-NN): <description>
```

### 3. New Section: Session Checkpoint

```markdown
## Session Checkpoint

Every session reads and updates the checkpoint file:
- Located at `docs/slices/slice-{NN}-checkpoint.md`
- One per major slice (e.g., Slice 17 has one checkpoint, not seven)

Start of session: read checkpoint → resume where we left off.
End of session: update checkpoint → clean handoff to next session.

Contents: current sub-slice, task number, branch name, what's merged, what's pending, blockers.
```

### 4. New Section: Superpowers Output Paths

```markdown
### Superpowers Output Paths (Override Defaults)
- Design specs → `docs/specs/` (not docs/superpowers/specs/)
- Implementation plans → `docs/plans/` (not docs/superpowers/plans/)
- Visual companion HTMLs → ephemeral, `.gitignore`d
```

### 5. New Section: Tool Selection Protocol

```markdown
## Tool Selection Protocol

At each phase transition, check this map and invoke relevant tools.
Do not wait for Yesid to ask. Proactive tool use = higher quality output.

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
```

### 6. New Section: Proactive Tool Triggers

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

### 7. Updated Path References

All docs/ paths in CLAUDE.md update to new locations:
- `docs/WORKFLOW.md` → `docs/reference/WORKFLOW.md`
- `docs/PATTERNS.md` → `docs/reference/PATTERNS.md`
- `docs/ARCHITECTURE.md` → `docs/reference/ARCHITECTURE.md`
- `docs/MOTION.md` → `docs/reference/MOTION.md`
- `docs/TESTS.md` → `docs/reference/TESTS.md`
- `docs/superpowers/specs/` → `docs/specs/`
- `docs/superpowers/plans/` → `docs/plans/`

---

## WORKFLOW.md Updates

### New Phase: PR & Merge

Added between Implementation and Closing in the pipeline:

```
[Phase 6: Implementation] → [Phase 7: PR & Merge] → [Phase 8: Closing]
```

### Updated Tool-per-Phase Tables

Full skill + MCP + agent mapping per phase (see Tool Selection Protocol above — WORKFLOW.md mirrors the CLAUDE.md tables with additional narrative on when/why to use each tool).

### Enhancement Opportunities Table

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

---

## Checkpoint File Template

```markdown
# Slice {NN} — Checkpoint

**Last updated:** {date} | Session {N}
**Branch:** feature/slice-{NN}{letter}
**PR:** #{number} or "not yet created"

## Current Position
- **Sub-slice:** {current}
- **Task:** {N} of {total}
- **Status:** in-progress | waiting-for-approval | blocked

## What's Merged Into Main
| Sub-slice | Branch | PR | Merged |
|-----------|--------|-----|--------|
| (empty at start) | | | |

## What's In Progress
- {description of current task}

## Open Decisions
- [ ] {any unresolved decisions}

## Blockers
- {none or description}

## Next Session Should
1. Read this file
2. Check out branch `{branch}`
3. Resume at Task {N}
```

---

## .gitignore Updates

Add:
```
.superpowers/brainstorm/
```

---

## Task Breakdown

### Task 1: Create branch + checkpoint file + devlog
- Create `feature/slice-00-repo-hygiene` from main
- Create `docs/slices/slice-00-checkpoint.md`
- Create `docs/devlog/slice-00-repo-hygiene.md`

### Task 2: Archive brainstorm artifacts
- Move `.superpowers/brainstorm/` → `docs/archive/brainstorms/`
- Move `docs/superpowers/mockups/` → `docs/archive/mockups/`
- Add `.superpowers/brainstorm/` to `.gitignore`

### Task 3: Reorganize docs/ structure
- Create `docs/reference/` — move evergreen docs
- Create `docs/roadmap/` — move forward-looking docs
- Promote `docs/superpowers/specs/` → `docs/specs/`
- Promote `docs/superpowers/plans/` → `docs/plans/`
- Consolidate `docs/research/` — move orphaned files
- Move misc to `docs/archive/`
- Remove empty directories
- Create `docs/README.md` — index of all subdirectories with purpose and when to use each

### Task 4: Fix all internal references
- Grep every `.md` file for old paths → update to new locations
- Verify zero broken links

### Task 5: Update CLAUDE.md
- Close slice 13, set active slice
- Add Git & PR Workflow section
- Add Session Checkpoint section
- Add Superpowers Output Paths override
- Add Tool Selection Protocol
- Add Proactive Tool Triggers
- Update all path references

### Task 6: Update WORKFLOW.md
- Add PR & Merge phase
- Add Verification phase
- Update tool-per-phase tables
- Add enhancement opportunities
- Update internal references

### Task 7: Update .gitignore + project config
- Add `.superpowers/brainstorm/` to `.gitignore`
- Verify archive is tracked
- Disable Claude Code worktrees for this project in `.claude/settings.local.json`
  - Our feature branch strategy provides isolation — worktrees add a competing system
  - Prevents orphaned `claude/` branches cluttering the repo
  - Sessions work directly in the main checkout, on the feature branch

### Task 8: Closing
- Update checkpoint file
- Write devlog entry
- Write handoff report
- Regenerate `tree.txt`
- Create PR to main

---

## Acceptance Criteria

- [ ] Zero loose files in `docs/` root (all moved to subcategories; a `docs/README.md` index is optional)
- [ ] Every `.md` file's internal links resolve (no broken references)
- [ ] `docs/reference/` contains all evergreen project docs
- [ ] `docs/roadmap/` contains all forward-looking docs
- [ ] `docs/specs/` and `docs/plans/` promoted to top level
- [ ] `docs/archive/` contains all historical brainstorm/mockup artifacts
- [ ] `.superpowers/brainstorm/` in `.gitignore`
- [ ] `docs/README.md` exists as directory index
- [ ] Claude Code worktrees disabled in `.claude/settings.local.json`
- [ ] CLAUDE.md has: Git & PR Workflow, Session Checkpoint, Tool Selection Protocol, Proactive Tool Triggers
- [ ] CLAUDE.md active slice updated, slice 13 in completed list
- [ ] CLAUDE.md superpowers output paths overridden to new locations
- [ ] WORKFLOW.md has PR & Merge phase + full tool mapping + enhancement opportunities
- [ ] Checkpoint file exists and reflects final state
- [ ] Devlog documents all changes and decisions
- [ ] `bun run build` succeeds
- [ ] `bun run check` passes
- [ ] `bun run test` passes (no code changed, but verify nothing broke)

## Out of Scope

- No code changes (pure docs/config)
- No CSS work (that's 17a)
- No knowledge extraction from brainstorm archives (noted for future)
- No workflow plugin creation (noted in memory for future initiative)

## Learn

### CI/CD Branching for Solo Projects
**What it is:** Feature branch workflow where every logical unit of work gets its own branch, reviewed via PR before merging to main.
**Why it matters:** Even solo, PRs create review checkpoints. They prevent "oops I broke main" and create a clean audit trail of what changed and why.
**Try this:** After Slice 0 merges, check GitHub — you'll see the PR with a full summary of changes.
**Go deeper:** https://docs.github.com/en/get-started/quickstart/github-flow

### Session Checkpoint Pattern
**What it is:** A single file that captures exactly where work stands — current task, branch, what's merged, what's pending.
**Why it matters:** AI sessions start fresh with no memory. The checkpoint file is the handoff between sessions — it prevents context drift across a 13-14 session initiative.
**Try this:** At session start, read the checkpoint. At session end, update it. Notice how it anchors every session.
