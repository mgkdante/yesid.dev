# Workflow reference

Detailed reference for the slice-based workflow practiced in this project. Pairs with the tool-agnostic contract in `AGENTS.md` (root) and the per-tool overlays in [`tools/`](tools/).

## The 8-phase pipeline (end-to-end)

Every L-slice flows through 8 phases in order. M-slices collapse phases 2–4 into an inline paragraph at the top of `devlog.md`. S-slices skip phases 1–4 entirely and go straight to implementation with a non-slice session file recording the work.

```
IDEA
  │
  ▼
[1 Research]        Scan competitors / prior art / library docs
  │
  ▼
[2 Brainstorm]      Mandatory brainstorming skill → 2–3 design options, owner picks
  │
  ▼
[3 Design Spec]     docs/slices/<slice>/<sub>/spec.md
  │
  ▼
[4 Plan]            docs/slices/<slice>/<sub>/plan.md (task list)
  │
  ▼
[5 Implementation]  Task-by-task with approval gates (Iteration Protocol)
  │
  ▼
[6 Verification]    Pre-completion checks + visible proof before each STOP
  │
  ▼
[7 PR & Merge]      Branch → PR → review → squash-merge
  │
  ▼
[8 Closing]         Finalize handoff → governance updates → close-script
  │
  ▼
SHIPPED → bundle archived per docs/ARCHIVE.md, indices updated
```

Each phase has specific tools, artifacts, and exit criteria. Skipping creates debt that compounds — for L-slices. For M/S, not all phases apply (see `AGENTS.md § Slice sizing`).

## Three-tier context model

The AI never reads everything. Context loads in three deliberate tiers — cheapest first.

| Tier   | Where it lives                                              | Loading                                                                |
|--------|-------------------------------------------------------------|------------------------------------------------------------------------|
| Tier 1 | In the repo: `AGENTS.md`, `CLAUDE.md`, `docs/reference/**`, `docs/roadmap/**`, the active slice bundle, templates | **Always-on.** Auto-loaded by both Claude Code and Codex on session start. |
| Tier 2 | Cloud / external: shipped slice bundles (`<cloud>/<project>/docs/archive/slices/...`), historical specs / plans / devlogs / handoffs / research, the project's learn knowledge base | **Fetch-on-command.** AI reads deliberately when context warrants — never auto-loaded.   |
| Tier 3 | Cloud indexes: `<cloud>/<project>/docs/COMPLETED-SLICES.md`, `INDEX.md`, etc. | **Bridge.** AI reads to discover what exists in Tier 2, then fetches the specific artifact. |

**Retrieval protocol (cheapest first):** in-context governance → cloud index (Tier 3) → specific cloud artifact (Tier 2) → `git show <sha>:<path>` (last resort).

**Write protocol:** the closing-checklist (Phase 8) mirrors a shipped slice from Tier 1 to Tier 2 (cloud archive) + deletes it from the repo + appends a one-liner to the Tier 3 index. Self-pruning — Tier 1 stays small.

Full retrieval / write detail: `docs/ARCHIVE.md` (project-specific home).

## Document ecosystem

Every project that scaffolds from this workflow ends up with the same document hierarchy. Specifics (filenames, paths to project-specific governance docs) vary; the shape is universal.

### Tier 1 — always-loaded, in repo

| Document                                | Purpose                                                                              | Update frequency         |
|-----------------------------------------|--------------------------------------------------------------------------------------|--------------------------|
| `AGENTS.md`                             | Tool-agnostic workflow contract — rules, principles, abstract roles                  | When workflow rules change |
| `CLAUDE.md`                             | Claude Code entry pointer + role bindings (thin pointer to `AGENTS.md`)              | When Claude bindings change |
| `docs/reference/tools/<tool>.md`        | Per-tool overlay (role bindings, slash commands, absolute thresholds)                | When tool mechanics change |
| `docs/reference/WORKFLOW.md`            | This file — operational mechanics                                                    | When process evolves       |
| `docs/reference/VOCAB.md`               | Workflow-universal vocabulary (Slice, Sub-slice, Task, Iteration Protocol, STOP, …) | Via `/workflow-update` → plugin PR → `/workflow-pull` |
| `docs/reference/ARCHIVE.md`             | Three-tier model + retrieval / write protocols                                       | When archival model evolves (plugin-side) |
| `docs/project/<DOMAIN>.md`              | Project-specific governance: `CONSTITUTION.md`, `CSS.md`, `MOTION.md`, `PATTERNS.md`, `TESTS.md`, `ARCHITECTURE.md`, `BINDINGS.md`, `STACK.md`, `VOCAB.md`, `BRAND.md`, `SERVICES.md`, or operator-created EMERGENT `<DOMAIN>.md`. | Per-domain rules change (directly hand-edit — project-owned) |
| `docs/roadmap/PLAN.md`                  | Per-project master plan + slice index                                                | Every slice close          |
| `docs/slices/<slice>/plan.md`           | Active slice plan (Sub-slices table for multi-sub-slice slices)                      | Per session                |
| `docs/slices/<slice>/devlog.md`         | Self-appending session record across all sub-slices                                  | Every session              |
| `docs/slices/<slice>/<sub>/`            | Active sub-slice bundle (`plan.md` + `spec.md` + `handoff.md`)                       | Per session                |
| `docs/sessions/<YYYY-MM-DD>-<topic>.md` | Non-slice session records                                                            | Per non-slice session      |
| `docs/_TEMPLATES/`                      | Slice + sub-slice + session templates (slice/, subslice/, session/)                  | Updated via `/workflow-pull` |
| `docs/project/`                         | Project-owned governance docs — DEFAULT skeletons (STACK, BINDINGS, ARCHITECTURE, TESTS, VOCAB, CONSTITUTION) + OPTIONAL templates (BRAND, CSS, MOTION, PATTERNS, SERVICES) + EMERGENT (operator-created `<DOMAIN>.md` files). See `docs/project/README.md`. | Per slice (D11) — codify re-derived rules at slice close |

### Tier 2 — fetch-on-command, in cloud

| Location                                                          | Purpose                                            |
|-------------------------------------------------------------------|----------------------------------------------------|
| `<cloud>/<project>/docs/archive/slices/<slice>/<sub>/`            | Shipped sub-slice bundles                          |
| `<cloud>/<project>/docs/learn/<domain>/<concept>.md`              | Project's durable knowledge base (Obsidian-style)  |
| `<cloud>/workflow-knowledge/<topic>/`                             | Cross-project portable research corpus             |
| `<cloud>/workflow-knowledge/os-quirks/<os>.md`                    | Cross-project OS command registry                  |
| `<cloud>/<tool>-config/`                                          | Per-tool config snapshots                          |

### Tier 3 — cloud indexes (the bridge)

| Location                                          | Purpose                                              |
|---------------------------------------------------|------------------------------------------------------|
| `<cloud>/<project>/docs/COMPLETED-SLICES.md`      | One-liner index of every shipped slice               |
| `<cloud>/<project>/docs/INDEX.md`                 | Cloud mirror map                                     |

## Cross-platform setup + OS-quirks registry

The workflow is OS-agnostic via one env var + a persistent quirks registry that lives in the cloud (Tier 2).

### Env var pattern

Each project picks a single env var that points to its local cloud directory. Convention: `<VENDOR>_CLOUD_ROOT`. Scripts fall back to `path.join(os.homedir(), '<vendor>', 'cloud')`.

| OS      | Default                                            |
|---------|----------------------------------------------------|
| Windows | `C:\Users\<user>\<vendor>\cloud`                   |
| macOS   | `~/<vendor>/cloud`                                 |
| Linux   | `~/<vendor>/cloud`                                 |

Set via shell profile (Unix) or System Environment Variables (Windows).

### OS-quirks registry

Lives at `<cloud>/workflow-knowledge/os-quirks/`:

- `README.md` — how the registry works
- `windows.md` — Windows-specific command fixes
- `macos.md` — macOS-specific
- `linux.md` — Linux-specific
- `cross-platform.md` — universal patterns

**Retrieval rule:** before troubleshooting a platform-specific command, grep the relevant file. Grep first, ask second.

**Write rule:** when solving an OS-specific issue, append to the relevant file with: Problem / Root cause / Fix / Date / Slice. **Enforced as Phase 8 closing-checklist step 4.** No exceptions — the next person (or future you) will hit the same quirk.

The registry is cross-project: a Windows fix solved during one project is available to every other project the operator runs.

## Slice hierarchy

| Level | Name          | Example                       | Folder form                            | PR boundary? |
|-------|---------------|-------------------------------|----------------------------------------|--------------|
| 1     | **Slice**     | Slice 17 (Standardization)    | `docs/slices/slice-17/`                | for single-level slices only |
| 2     | **Sub-slice** | 17j (Workflow Efficiency)     | `docs/slices/slice-17/17j/`            | yes — every sub-slice = one PR |
| 3     | **Task**      | 17j-3, 17j-3a                 | not a folder — a TodoWrite entry + commit | no |

### Slice shape — single-level vs multi-sub-slice

- **Single-level slice**: no sub-slices; slice IS the PR boundary. Slice dir contains `plan.md + devlog.md + spec.md + handoff.md`.
- **Multi-sub-slice slice**: slice dir contains `plan.md + devlog.md` only. Each sub-slice dir contains `plan.md + spec.md + handoff.md`. Each sub-slice = its own PR.

Choose shape at slice-open (or defer to first planning session).

## Per-slice bundle files

| File         | Level        | Purpose                                                                             |
|--------------|--------------|-------------------------------------------------------------------------------------|
| `plan.md`    | slice + sub  | Decisions + sequencing for the slice / sub-slice. Tasks live in TodoWrite.          |
| `spec.md`    | sub-slice (or slice for single-level) | Design decisions (D1, D2, ...), acceptance criteria, risks. |
| `handoff.md` | sub-slice (or slice for single-level) | PR body + peer-review notes + deferred risks. Populated at PR-boundary close. |
| `devlog.md`  | slice only   | Self-appending session record across all sub-slices + tasks. Shared by all tools.  |

Tasks never get their own files. They live in TodoWrite / Codex tracker only.

## Session types

Declare at the start of every session.

| Type               | What happens                                                       | Artifacts                                              |
|--------------------|--------------------------------------------------------------------|--------------------------------------------------------|
| **Planning**       | Research, brainstorm, design, slice-level + sub-slice-level plans  | `spec.md` + `plan.md` at relevant level                |
| **Implementation** | One or more Level-3 tasks per Iteration Protocol                   | Code, tests, append to `devlog.md` + `handoff.md` section |
| **Closing**        | Finalize `handoff.md`, run `workflow-close-slice`                  | `handoff.md` final + PR                                |
| **Non-slice**      | Bugfix / config / exploration outside any slice                    | `docs/sessions/<YYYY-MM-DD>-<topic>.md`                |

## Session Start Protocol

Every session begins with this 9-step checklist. Skipping a step is how slices drift.

1. **Declare session type + slice size** — Planning / Implementation / Closing / Non-slice, and L / M / S (per `AGENTS.md § Slice sizing`).
2. **Read the active slice's `devlog.md`** — last session's closing block is the resume point. Specifically the § Outstanding + § Tasks status (TodoWrite snapshot) sections.
3. **Check out the slice / sub-slice branch** — `git checkout feature/slice-<NN>-<letter>` (L/M) or stay on `main` (S non-slice). For worktree-backed slices: `EnterWorktree(path: ".worktrees/<slice>-<letter>")` (D18).
4. **Scan for drift** — uncommitted changes, commits made outside the AI tool, divergence from origin. Document any drift in the new session's "What happened" section.
5. **Read the active bundle, scaled to slice size:**
   - **L-slice:** full bundle (`spec.md` + `plan.md` + `devlog.md` + `handoff.md`).
   - **M-slice:** just the slice's `devlog.md` (carries the inline 1-paragraph plan).
   - **S-slice:** nothing extra — non-slice session file gets created during the session.
6. **Populate the live tracker** (`TodoWrite` for Claude Code, equivalent for Codex) — from `plan.md` for L-slices (one entry per Level-3 task); from the inline plan paragraph for M-slices. Exactly one entry `in_progress` at a time (per `AGENTS.md § Session progress tracking`).
7. **Check pattern + vocab catalogs** — any relevant solved patterns? Any term already codified? Avoids re-deriving.
8. **Announce the budget row** — `Model: <name> | Context: <used> / <window> (<%>) — <state>`. Required on Implementation + Closing sessions per Iteration Protocol.
9. **State the goal** — what does "done" look like for THIS session? Confirms shared understanding before code lands.

## Session End Protocol

Every session ends with this 7-step checklist. Closes the loop so the next session (this tool, the other tool, or future-you) can resume cold.

1. **Final live-tracker state** — mark completed tasks completed; leave the next task in `in_progress` or `pending` as the resume point.
2. **Append closing block to `devlog.md`** — full session-header format (`Tool:` / `Session type:` / `Focus:` / `Picking up from:` + `### What happened` / `### Commits` / `### Tasks status` (live-tracker snapshot) / `### Outstanding` / `### Budget`). Per `AGENTS.md § Session header format`.
3. **Append per-task entries to `handoff.md`** — for any tasks that landed this session, add the per-task append block (Planned by / Implemented by / Commit / Files / What landed / Decisions / Reviews / Follow-ups / Tests).
4. **Ensure verification commands pass** — full canonical set per `plan.md § Canonical commands`. Green before commit.
5. **Commit + push** — all changes on the slice / sub-slice branch (or `main` for non-slice per AGENTS.md § Session types). Commit convention `<type>(<slice-tag>): <description>`.
6. **Update slice-level `plan.md`** if scope amended mid-session — log in § Amendments table.
7. **State next session's start condition** — what the next session should resume with. Include recommended model (per `AGENTS.md § Stage → role routing`) and expected slice size for the next session.

The `devlog.md` closing block is the durable resume point. The live tracker is ephemeral session-surface UI. Both layers, neither replaces the other.

## Phase 1 — Research

**When:** Before any new feature, page, or major capability.
**Goal:** Understand what great looks like. Never design in a vacuum.

### Process

1. **Competitive / prior-art scan** — analyze 5–7 reference implementations relevant to the domain. For UI work: multi-breakpoint screenshots. For data/infra work: read 2–3 production codebases solving similar problems. For library/API work: read the official docs and 1–2 well-regarded wrappers.
2. **Extract patterns** — note recurring choices (architecture, naming, layout, rhythm, error handling, retention).
3. **Check pattern catalog** — before inventing a new pattern, search the project's `docs/project/PATTERNS.md` (or equivalent EMERGENT doc) for an existing solved instance.
4. **Verify library / API behavior** — never guess function signatures or invariants. Use the project's documentation-lookup tool (Context7 MCP, official docs, Devin etc.) to confirm.

### Exit criteria

- [ ] 5+ references scanned (or domain-equivalent depth)
- [ ] Patterns documented (in the upcoming `spec.md` § Reference sites / prior art, OR in a shared research doc if cross-slice)
- [ ] Project pattern catalog consulted
- [ ] Owner confirmed direction

## Phase 2 — Brainstorm

**When:** After research, before any spec.
**Goal:** Turn research into 2–3 concrete design options. Owner picks.

### Process

1. **Invoke the brainstorming skill** — mandatory. The skill produces structured option-sets with explicit tradeoffs. No exceptions, even if the answer "feels obvious" — feeling-obvious is a failure mode.
2. **Generate 2–3 options** — each option states: name, one-sentence pitch, key visual / structural feel, animation / interaction approach (if UI), responsive / scaling strategy, risk, session estimate.
3. **Present to owner** — never self-select. The AI's job is to surface tradeoffs, not to decide.
4. **Save scratch artifacts** — wireframes, sketches, query plans, schema drafts go in an ephemeral location (e.g., `.brainstorm/` or `docs/scratch/`).

### Exit criteria

- [ ] Brainstorming skill invoked
- [ ] 2–3 options presented with explicit tradeoffs
- [ ] Owner selected one
- [ ] Brainstorm artifacts saved

## Phase 3 — Design Spec

**When:** After owner approves a brainstorm direction.
**Goal:** Translate direction into a specification implementation can follow cold.

### Process

1. Write `docs/slices/<slice>/<sub>/spec.md` from `docs/_TEMPLATES/subslice/spec.md`.
2. Section-by-section breakdown: Goal / Why this sub-slice / Pillars (if multi-pillar) / Core principle / Durable outputs / Reference sites / Context / Architecture / Scope (In + Out) / Design decisions (D-numbered) / File-touch summary / Acceptance criteria / Open questions / Risks.
3. **Self-review cold.** Re-read the spec from the perspective of an implementing AI / engineer who has never seen this conversation. If they could not implement from the spec alone, add detail.
4. Owner approval before any plan.

### Spec structure (skeleton)

```markdown
# <slice-name>/<subslice-name> — Spec

## Metadata             (table: status / priority / depends on / unblocks / size / sessions / branch)
## Goal                 (one paragraph outcome)
## Why this sub-slice   (carved-out rationale)
## Pillars              (optional — multi-pillar sub-slices only)
## Core principle       (one anchor statement)
## Durable outputs      (artifacts beyond the immediate code change)
## Reference sites / prior art
## Context              (problem + prior decisions + constraints)
## Architecture         (high-level approach, paths-named)
## Scope                (### In scope + ### Out of scope)
## Design decisions     (D1, D2, ... each with Chosen / Alternatives / Why / Tradeoff / Affects)
## File-touch summary
## Acceptance criteria  (verifiable checklist)
## Open questions
## Risks
## Amendments log
```

### Exit criteria

- [ ] `spec.md` written in the bundle folder per template
- [ ] Every required section filled (no `<!-- FILL IN -->` left)
- [ ] Self-reviewed cold
- [ ] Owner approved

## Phase 4 — Implementation Plan

**When:** After spec approved.
**Goal:** Break the spec into Level-3 tasks, each with a STOP gate.

### Process

1. Invoke the plan-writing skill (e.g., `superpowers:writing-plans`).
2. Estimate sessions — each sub-slice gets a session count. Default to multi-session for non-trivial work.
3. Identify dependencies — sequential tasks ordered; independent ones flagged as parallel candidates (with owner approval).
4. Write `plan.md` per the **plan-authoring discipline** (see `AGENTS.md § Plan authoring discipline`).

### Plan-authoring discipline (recap — full rule in AGENTS.md)

Plans specify **decisions and sequencing**, NOT boilerplate code. The executing AI at runtime has full context of the current codebase, reads affected files, and writes code matching local patterns. Over-specified plans lock in assumptions and waste tokens twice.

**Plan SHOULD include:** task list with dependencies / estimates / acceptance, files affected, commands to run, commit message shape, **one canonical example** of each non-obvious pattern, pattern-establishing code (interface types, contracts, novel algorithms).

**Plan should NOT pre-specify:** boilerplate delegation code, mechanical find/replace work, full test bodies for obvious assertions, pattern-following code after the pattern is shown once.

**Rule of thumb:** if the executor could produce the code in 30 seconds by reading the target file, don't pre-write it. Describe the transformation; trust execution-time judgment for the rest.

### Plan structure (skeleton)

```markdown
# <slice-name>/<subslice-name> — Plan

## Important context
## Read these files first
## Hard constraints
## Canonical commands         (table)
## Session layout
## File structure             (4 tables: Create / Modify / Delete / Outside-repo)

## Tasks
### Task <slice-tag>-1 — <title>
  - Goal / Files / Dependencies / Steps (checkbox) / Verification
  **STOP. Ask owner to verify before Task 2.**
### Task <slice-tag>-2 — <title>
  ...

## Execution order
## Validation to run           (after every task + at sub-slice close)
## Common pitfalls
## Out of scope
```

### Session estimation guide

| Complexity                    | Tasks  | Sessions  |
|-------------------------------|--------|-----------|
| Single module + tests          | 2–3    | 1         |
| Single component + tests       | 3–4    | 1         |
| Full page / feature            | 5–8    | 2–3       |
| Interactive system             | 8+     | 3–4       |
| Multi-page / multi-system feature | 10+ | 4–8       |

**Always tell owner the estimate upfront.** Surprise multi-session scope is a planning failure.

### Exit criteria

- [ ] `plan.md` in bundle per template
- [ ] Session estimate given to owner
- [ ] Dependencies mapped
- [ ] Owner approved

## Phase 5 — Implementation (Iteration Protocol)

**You are done when the owner says you are done.** Verification commands passing is necessary but not sufficient.

The full 8-step Iteration Protocol lives in `AGENTS.md § Iteration Protocol` (single canonical home). Per-task flow summary:

```
1. READ the Level-3 task from the live tracker (TodoWrite / Codex equivalent)
2. IMPLEMENT one task
3. RUN verification commands → all pass
4. PRE-FLIGHT check (UI / output-shape work) — state expected output, fix obvious issues
5. STOP → tell owner: what built, what to verify, decisions, budget row
6. UPDATE tracker + append to slice-level devlog.md + per-task one-liner to handoff.md
7. WAIT for owner reply
8a. Issues → fix, re-run verification, STOP again (Iterations table row)
8b. Approval → next task, repeat from 1
```

### Test result table (after every test run)

```markdown
| Test File         | Test Name              | Status | Failure Reason                          |
|-------------------|------------------------|--------|------------------------------------------|
| <path>            | it(<name>)             | PASS   |                                          |
| <path>            | it(<name>)             | FAIL   | Expected X, got Y (line NN)              |
```

**Never say "some tests failed" without listing every failure by name.** If all pass, still list what ran.

### Iteration feedback handling

| Feedback type           | Action                                                                  |
|-------------------------|-------------------------------------------------------------------------|
| Layout / positioning    | Fix in component, retest, STOP                                          |
| Content / copy          | Update data layer (never hardcode), retest, STOP                        |
| Remove element          | Remove + update tests, STOP                                             |
| Design pivot            | Ask clarifying questions; may need new brainstorm                       |
| Architecture change     | Update spec amendments log; may need new sub-slice                      |

**Average iterations per task: 2–4.** Plan for the loop; don't treat the first STOP as the only one.

### Iteration rules (non-negotiable — recap from AGENTS.md)

1. Never batch multiple tasks. One task, one approval.
2. Never write the final handoff summary before approval (per-task one-liners append as work lands).
3. Never claim "I think this should work" — owner confirms on their screen / runtime / output.
4. Never continue coding after a STOP. The STOP is mandatory.
5. Ambiguous feedback → ask a clarifying question before changing code.
6. Never close a sub-slice without handoff complete and governance updates done.

## Phase 6 — Verification

**When:** After implementing a task, before STOP.
**Goal:** Confirm correctness before presenting to owner.

1. Run full canonical verification commands (test + lint + typecheck — see project's `plan.md § Canonical commands`). All must pass.
2. Pre-flight check (UI / output-shape work): state expected layout / response shape / file count, scan for overflow / missing / mismatch, fix obvious issues.
3. **Visible proof for UI tasks** — screenshot via the project's preview tool, OR sample output for backend/data tasks. Owner should see what changed without having to re-derive it.
4. Fix obvious problems before STOP. The owner's time is for review, not for catching mistakes the AI should have caught.

Tools per phase: see `AGENTS.md § Tool selection` (or the project's tool-overlay).

## Phase 7 — PR & Merge

**When:** All tasks in the sub-slice are approved. Handoff finalized.

1. Verify all canonical verification commands pass on the branch.
2. `gh pr create` (or equivalent) with `handoff.md` content as the body.
3. Owner reviews on the platform (GitHub / GitLab / etc.).
4. Squash-merge to default branch (usually `main`).
5. Delete the feature / sub-slice branch.
6. Run `workflow-close-slice` (the close-script) — archives the bundle per `docs/ARCHIVE.md`, updates indices.
7. Next sub-slice branches from the updated default branch.

**Branch naming:** `feature/slice-<NN>-<letter>` for multi-sub-slice slices, `feature/slice-<NN>` for single-level. One branch per PR boundary.

**Commit convention:** `<type>(<slice-tag>): <description>` — types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

## Phase 8 — Closing checklist

**When:** ALL Level-3 tasks approved. PR ready to create OR just squash-merged.

**Hard checklist — every item mandatory, in order:**

1. **Finalize `handoff.md`** — § 23 Summary + § 24 PR Body sections added; all per-task append blocks verified complete.
2. **Project governance doc updates** — for any project-specific rule, pattern, architecture, or convention introduced in this sub-slice, update the relevant `docs/project/<DOMAIN>.md` (CONSTITUTION, PATTERNS, ARCHITECTURE, CSS, MOTION, TESTS, etc.). **Never hand-edit `docs/reference/*`** — that directory is 100% plugin-pulled per the partition contract; workflow-universal changes flow through `/workflow-update` instead.
3. **Vocabulary update** — any new project / brand / industry / domain term introduced gets added to `docs/project/VOCAB.md`. Workflow-universal vocabulary goes through `/workflow-update` to evolve `docs/reference/VOCAB.md` in the plugin.
4. **OS-quirk logging** — if this sub-slice solved a platform-specific issue (Windows / macOS / Linux command quirks, env var handling, shell escaping), append to `<cloud>/workflow-knowledge/os-quirks/<os>.md` with Problem / Root cause / Fix / Date / Slice. **Hard step, not a suggestion.**
5. **Learn doc** — if the sub-slice introduced a durable concept worth codifying outside the project, write to the project's learn knowledge base (e.g., `<cloud>/<project>/docs/learn/<domain>/<concept>.md`).
6. **Codify any new domain rule** in `docs/project/<DOMAIN>.md` — if this slice surfaced a re-derivable rule / pattern / convention that wasn't already in any project doc, codify it BEFORE closing. Triggers (per `docs/project/README.md`): same rule defined in 2+ sub-slice specs, same vocab term re-introduced, same OS-quirk re-encountered, same code idiom re-implemented across 3+ files. Create a new `docs/project/<DOMAIN>.md` if no existing doc fits — see `docs/project/README.md` § "When to create a new project doc — rubric".
7. **Regenerate project indices** — `tree.txt` and any other auto-generated structural index.
8. **Commit, push, create PR** — `gh pr create --body-file handoff.md` (or extracted PR Body section).
9. **Post-merge:** run `workflow-close-slice` — archives bundle, updates indices, deletes worktree per D18.
10. **Mirror live docs** (project-specific — if the project keeps a cloud mirror of `docs/`): refresh the mirror so off-device reading sees current state.

**The workflow self-enhances.** Any mistake caught during this sub-slice becomes a permanent checklist rule here. If you had to re-learn something, codify it in an OS-quirk, learn doc, vocab entry, or pattern entry **before** the slice closes. The goal: never re-learn the same lesson.

## Quality Gates

Three-tier gate model. Gates fire at task completion, sub-slice close, and pre-deploy.

### Before every task completion

- [ ] Test suite passes (per `plan.md § Canonical commands`)
- [ ] Type check passes (zero errors)
- [ ] Lint passes (zero errors)
- [ ] Pre-flight check done (UI / output-shape work)
- [ ] Error handling present at boundaries
- [ ] No hardcoded values that should be parameterized (data layer / config / env vars)
- [ ] Reduced-motion / accessibility hooks respected (UI work)

### Before every sub-slice close

- [ ] All Level-3 tasks approved by owner
- [ ] `handoff.md` finalized — § Summary + § PR Body sections added
- [ ] Per-task append blocks complete (no gaps in § Tasks completed)
- [ ] All governance doc updates done (per Phase 8 closing checklist step 2)
- [ ] Vocabulary entries added for new terms
- [ ] OS-quirks logged (if any)
- [ ] Learn docs written (if durable concepts surfaced)
- [ ] `tree.txt` (or equivalent structural index) regenerated
- [ ] Full test suite green on the branch

### Before deploy (project-eventual)

- [ ] Performance threshold met (project-specific — e.g., Lighthouse > 90 for web; cycle latency < N seconds for pipelines)
- [ ] Accessibility threshold met (project-specific — e.g., a11y > 90 for UI)
- [ ] Mobile / small-viewport tested (UI projects)
- [ ] No console errors (UI projects)
- [ ] Structured data / schema valid (SEO-relevant projects)
- [ ] Brand / domain compliance verified

Gates are owner-overridable but defaulted-on. Skipping a gate at task completion = the next task probably exposes the skipped issue.

## Parallel Work Rules

The workflow allows controlled parallelism. The default is sequential — parallel requires owner approval.

### Allowed (without per-instance approval)

- **Research only** — multiple subagents scanning different reference sites / reading different files / verifying different APIs in parallel.
- **Independent exploration** — read-only, no write to shared state.

### Allowed with owner approval (per instance)

- Implementation tasks with no inter-dependency that touch disjoint file sets.

### Not allowed

- Implementation tasks with dependencies between them.
- Anything that writes to the same files (race + merge-conflict risk).
- When parallelizing would scatter the AI's working set (defeats the cost saving).

### Agent / specialist selection

When a task fits a specialist agent's strength, delegate. Per-tool overlay binds the role to that tool's specific agent name; the role itself is universal.

| Situation                          | Specialist role                | Why                                       |
|------------------------------------|--------------------------------|-------------------------------------------|
| Complex feature decomposition       | planner                        | Break into phases                          |
| Code just written / modified         | code reviewer                  | Quality + pattern check                    |
| New feature or bug fix              | tdd guide                      | Tests first                                |
| Architectural decision              | architect                      | System-level design                        |
| Build fails                         | build-error resolver           | Minimal diffs, get green                   |
| Security-sensitive code             | security reviewer              | OWASP / threat model                       |
| Performance concern                 | performance optimizer          | Bottleneck analysis                        |
| End-to-end flow                     | E2E runner                     | Full-flow generation + validation          |
| Codebase-wide search / exploration  | broad-search agent             | Multi-file pattern scan                    |

## Tool selection protocol

At each phase transition, the AI invokes relevant tools / skills / agents. Proactive tool use = higher quality. Tool names are tool-specific; the per-tool overlay binds them.

### Research phase (Phase 1)

ALWAYS:
- Documentation-lookup tool (Context7 MCP, official docs, etc.) — verify API signatures before assuming.
- Project-specific research helpers (e.g., site-analysis MCP for web; data-profile MCP for pipelines).

CONSIDER:
- Deep-research skill / agent — broader web research needed.
- Design / inspiration tools — for visual / UI work.

### Brainstorm phase (Phase 2)

ALWAYS:
- Brainstorming skill — mandatory, never skip.
- Visual companion — for any question with visual content.

CONSIDER:
- Domain-specific brainstorming skills (UI design, data architecture, API design, etc.).

### Planning phase (Phase 4)

ALWAYS:
- Plan-writing skill (e.g., `superpowers:writing-plans`).
- Planner agent — complex feature decomposition.

CONSIDER:
- Architect agent — architectural decisions.
- Architecture / testing-strategy / tech-debt skills — system design evaluation.

### Implementation phase (Phase 5)

ALWAYS:
- Per-framework autofixer / formatter — every file edit (project-specific).
- Documentation tool — before using any library API (verify, don't guess).
- Plan-execution skill (e.g., `superpowers:executing-plans`).
- Visible-proof tool — preview / screenshot / sample-output for the work type.

CONSIDER:
- TDD skill — new features (RED → GREEN → REFACTOR).
- Domain-specific motion / animation / styling skills (UI work).

### Code review phase (after every task)

ALWAYS:
- Code reviewer agent — general quality.
- Language-specific reviewer agent — TS / Python / Go / etc.

CONSIDER:
- Security reviewer — auth, input handling, API calls, secrets.

### Verification phase (Phase 6, before every STOP)

ALWAYS:
- Verification-before-completion skill (e.g., `superpowers:verification-before-completion`).
- Visible-proof tool — screenshot / output sample for the owner.

CONSIDER:
- Performance audit tool (perf-sensitive work).
- Accessibility audit tool (a11y-sensitive work).

### PR & Merge phase (Phase 7)

ALWAYS:
- Finishing-a-development-branch skill (e.g., `superpowers:finishing-a-development-branch`).
- Commit / PR creation skill or tool (e.g., `commit-commands:commit-push-pr`).

### Closing phase (Phase 8)

ALWAYS:
- Doc-updater agent — governance doc updates.
- Documentation-quality skill.

CONSIDER:
- Continuous-learning skill — extract patterns from this slice.

### Proactive tool triggers (hard rules)

1. Editing a framework-specific file → check the per-framework autofixer first.
2. Using any library API → verify with documentation tool.
3. Touching motion / animation code → consult motion-tool first.
4. Adding / changing config tokens → use the project's token / config skill.
5. Building a shared component → use component-spec skill.
6. Writing tests → use the project's testing-strategy skill.
7. About to claim "done" → run verification-before-completion skill.
8. Creating a PR → run finishing-a-development-branch skill first.
9. Starting any plan → run brainstorming skill first.
10. Refactoring → use tech-debt skill to assess scope.
11. Hitting an OS-specific command error → check `<cloud>/workflow-knowledge/os-quirks/<os>.md` FIRST.

## Cross-tool adversarial review (slice close)

The close-script (`workflow-close-slice`) triggers a cross-tool adversarial review:
- Claude Code → Codex via `codex-plugin-cc` adversarial-review skill
- Codex → Claude Code via reverse handoff branch

Each tool reviews the other's slice independently. Findings get triaged:
- **BLOCKER / HIGH:** address before merge. May trigger one more `/workflow-update` PR + `/workflow-pull` cycle.
- **MEDIUM:** fix or defer explicitly (logged in `handoff.md § Deferred risks`).
- **LOW / INFO:** note in deferred risks, proceed.

**This is the structural enforcement of the tool-ownership invariant (D12).** No tool reviews itself — adversarial reviews come from the other tool, never inline-simulated.

## Commit convention

```
<type>(<slice-or-subslice>): <description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

Planning commits (`docs(<slice>):`) and implementation commits (`feat / refactor / fix(<slice>):`) stay separate regardless of whether they share a wall-clock session.

## Token budget (session)

| Context usage | Action                                                              |
|---------------|---------------------------------------------------------------------|
| 0–40%         | Comfortable. Continue.                                              |
| 40–65%        | Healthy. Avoid major new directions.                                |
| 65–80%        | Pre-break zone. Finish in-progress task, commit, STOP.              |
| 80%+          | Danger. Commit what's green. STOP immediately.                      |

Absolute thresholds per model live in the tool overlay (`tools/<tool>.md`).

## Proven rhythms (lessons from across slices)

### What works

- **One task, one approval.** Batching always leads to rework.
- **Design before code.** Brainstorm + spec = 2–3 iterations. Skip them = 4–5+.
- **Data layer / contract first.** Types + interfaces before implementation. Testable from day one.
- **Pre-flight catches the majority of visible bugs.** Read your own output for layout / shape problems before STOP.
- **Pattern catalog saves hours.** Each painful discovery codified once is hours saved across future slices.
- **Self-appending handoff > end-of-slice handoff.** Per-task append catches decisions while they're fresh.

### What doesn't work

- Jumping to code without a spec → scope creep and rework.
- Parallel implementation without owner approval → lower quality, harder feedback application.
- Guessing library / framework APIs → verify with documentation tool first.
- Hardcoding content "to iterate faster" → always creates cleanup work.
- Skipping the pre-flight check → obvious bugs hit the owner.
- Manual mirror-and-delete at slice close → loses the index update; accretion returns.

## The self-enhancing workflow (core principle)

Every mistake solved in one sub-slice becomes a closing-checklist rule so it cannot recur. Quality compounds slice-over-slice.

If during a sub-slice you:
- Re-solved an OS command issue → it belongs in `os-quirks/<os>.md`.
- Re-invented a pattern → it belongs in `docs/project/PATTERNS.md` (the OPTIONAL template — un-prefix if not yet active).
- Re-derived a term → it belongs in `docs/project/VOCAB.md` (project terms) or `docs/reference/VOCAB.md` (workflow terms — plugin-pulled).
- Re-learned a codebase principle → it belongs in `docs/project/CONSTITUTION.md` (the DEFAULT — fill it in).
- Re-encountered a domain rule (CSS, motion, security, migrations, integrations, etc.) → it belongs in `docs/project/<DOMAIN>.md` (use a DEFAULT, OPTIONAL, or EMERGENT slot per `docs/project/README.md`).
- Re-discovered a durable concept → it belongs in the learn knowledge base (`<cloud>/<project>/docs/learn/<domain>/<concept>.md`).

Before closing, ask: "what did I learn that I don't want to re-learn?" Codify it. The workflow gets smarter automatically.

**Project documentation discipline (D11).** The plugin scaffold ships `docs/project/` with DEFAULT skeletons (STACK / BINDINGS / ARCHITECTURE / TESTS / VOCAB / CONSTITUTION) + OPTIONAL templates (BRAND / CSS / MOTION / PATTERNS / SERVICES) + EMERGENT pattern (operator creates as needed). Each project starts with the DEFAULTs and grows OPTIONAL + EMERGENT docs as their domains develop. See `docs/project/README.md` for the full discipline.
