# CLAUDE.md — [yesid.dev](http://yesid.dev)

## Project

Freelance Digital Infrastructure. Owner: Yesid O. Domain: yesid.dev. Brand: dark theme, `#E07800` orange, `#FFB627` yellow, Inter + JetBrains Mono. Full brand: `/brand/BRAND.md`.

## Core principles (governance)

1. **The workflow is the product.** It's personal IP, portable across all projects that touch Yesid's 6 services. Trade-secret — not for public polish.
2. **The workflow self-enhances.** Every mistake solved in one slice becomes a closing-checklist rule so it cannot recur. Quality compounds slice-over-slice.
3. **Three-tier context.** Tier 1 (always-on, in repo) / Tier 2 (fetch-on-command, cloud mirror + git) / Tier 3 (cloud indexes — `COMPLETED-SLICES.md`). AI reads Tier 2 deliberately, not automatically. Full model: `docs/ARCHIVE.md`.
4. **Shared lexicon.** Brand vocab + industry vocab + Claude Code vocab + workflow vocab live in `docs/reference/VOCAB.md` (Tier 1). Consult before inventing a new term.

## Runtime

**Bun only. Never npm/npx/node.**

- `bun install`, `bun run dev`, `bun run test`, `bun run check`, `bunx`
- Lockfile: `bun.lockb`
- Current OS: Windows 11. Workflow designed to be OS-agnostic via env var + quirks registry (see Cross-platform setup).

## Cross-platform setup

- **Env var `YESITO_CLOUD_ROOT`** → local cloud directory.
  - Windows: `C:\Users\<user>\Yesito\cloud`
  - macOS / Linux: `~/Yesito/cloud`
- Scripts read this env var, fall back to `path.join(os.homedir(), 'Yesito', 'cloud')`.
- **OS-specific command quirks:** `<cloud>/claude-knowledge/os-quirks/<os>.md`. Check here first when troubleshooting a platform-specific command. Append new discoveries before closing any slice (hard rule).

## Slice hierarchy (MANDATORY)

Three levels. Strict meaning. PR boundary at Level 2.


| Level | Name                                   | Example                               | Folder form                       |
| ----- | -------------------------------------- | ------------------------------------- | --------------------------------- |
| 1     | **Slice**                              | Slice 17 (Standardization)            | `docs/slices/slice-17/`           |
| 2     | **Sub-slice** — PR boundary            | 17j (Workflow Efficiency)             | `docs/slices/slice-17/slice-17j/` |
| 3     | **Task** — section in plan/log/handoff | 17j-3, 17j-3a                         | section, not a folder             |
| (4)   | **Session**                            | `### Session 2026-04-17 — Task 17j-3` | heading in log.md                 |


### Per-sub-slice file bundle (4 files)

```
docs/slices/slice-NN/slice-NN<letter>/
  spec.md        → design + rationale. Written at sub-slice start.
  plan.md        → task-by-task implementation. Sections = Level 3 tasks.
  log.md         → running work record. Session-by-session.
  handoff.md     → self-appending closing report. Written per-task. PR body derived from it.
  CHECKPOINT.md  → ephemeral resume context (optional; deleted at PR close).
```

### Self-appending handoff

Handoff starts at sub-slice start with a stub, gains a section each time a Level 3 task lands, gets finalized at PR. PR body is extracted from it. Resets to 0 for the next sub-slice.

### Close protocol (Level 2 PR)

`bun run slice:close <slice-N> <slice-N-letter>` moves the bundle folder from repo to `<cloud>/yesid.dev/docs/archive/slices/slice-NN/slice-NN<letter>/` (no flatten — preserves granular retrieval), appends one-liner to `COMPLETED-SLICES.md`, regenerates `tree.txt`. Run only after all tasks approved.

### Non-slice sessions

One-off work outside a slice (bugfixes, config, exploration) lives at `docs/sessions/<YYYY-MM-DD>-<name>.md`. Template: `docs/sessions/_TEMPLATE.md`. Still commits; optional PR if it touches shared state.

## Session types

Declare one at the start of every session.


| Type               | What happens                                                | Artifacts                                      | Slice sizes |
| ------------------ | ----------------------------------------------------------- | ---------------------------------------------- | ----------- |
| **Planning**       | Research, brainstorm, design spec, slice spec, plan         | `slice-NN/slice-NN<letter>/spec.md`, `plan.md` | **L only**  |
| **Implementation** | One or more Level 3 tasks per Iteration Protocol            | Code, tests, append to `log.md`, `handoff.md`  | L / M       |
| **Closing**        | Finalize handoff, update governance docs, run `slice:close` | `handoff.md` final sections, PR                | L / M       |
| **Non-slice**      | Bugfix / config / exploration / hotfix                      | `docs/sessions/<YYYY-MM-DD>-<name>.md`, commit | **S**       |


**Hard rules — what's strict vs soft:**

- **Commit discipline is strict.** Planning commits (`docs(slice-NN):` for spec/plan) and implementation commits (`feat/refactor/fix(slice-NN):`) stay separate regardless of whether they share a wall-clock session. Never co-mingle types in one commit.
- **For L-slices:** Planning produces zero code; Implementation doesn't write specs (but can amend them); Closing doesn't add features.
- **M-slices plan inline** (TodoWrite + 1-paragraph "Plan" at top of `log.md`) — no separate planning session, no `spec.md`, no `plan.md`.
- **S-slices have no planning step.**

**Session separation is soft.** Two session types may share one wall-clock conversation provided commit discipline holds AND none of these "break triggers" fire:

1. **Reasoning-heavy transition** — next phase requires real design choices (L-Planning → L-Implementation of a complex task, novel debugging, mid-implementation spec amendment involving tradeoffs)
2. **Context ≥65% of active window** — same threshold as the Session token budget pre-break zone
3. **Material model downshift** — e.g., L-Planning on [1m] → L-Implementation on 200k with continuation spanning >2 tasks (one cache invalidation isn't worth the amortization over a short continuation)
4. **Human fatigue** — reviewer sharpness matters for the commits that follow

When any trigger fires: stop, commit, start a fresh session. Otherwise, continuation is fine.

At session start: scan for uncommitted changes or commits made outside Claude Code. Document anything found in `log.md` (or the session file for non-slice).

## Slice sizing (L / M / S)

Planning ceremony scales with complexity. Declare the size at session start; upgrade mid-session if scope turns out larger.


| Size           | Trigger                                                                                                               | Planning artifact                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **L** (large)  | Multi-session OR ≥10 design decisions with real tradeoffs OR cross-cutting (≥20 files across ≥2 architectural layers) | Full: separate Planning session produces `spec.md` + `plan.md`. Implementation in a fresh session.   |
| **M** (medium) | Single session, 2–6 tasks, isolated scope, few real design choices                                                    | Lightweight: inline TodoWrite + 1-paragraph "Plan" at top of `log.md`. No separate planning session. |
| **S** (small)  | One-shot: bugfix, config tweak, doc update, exploration                                                               | None. Just do the work. Session file records what happened.                                          |


**Examples:**

- L: 17b (hexagonal refactor, 15 decisions, 10 tasks), 17a-5 (spacing constitution), 17d (component API + shells)
- M: most sub-slices — a focused extraction pass, a single-domain CSS consolidation
- S: fixing a broken import, adding a brand utility, tweaking a commit script

**Upgrade rule:** If mid-session an M-slice reveals ≥5 unexpected design decisions or touches ≥2 architectural layers, STOP. Commit any safe partial work. Re-declare as L, start a fresh Planning session.

**Downgrade is rare but allowed:** if an L-slice's Planning session reveals the real scope is one-commit-small, skip the plan and execute inline. Document why in `log.md`.

### Plan authoring discipline (L-slice `plan.md`)

Plans specify **decisions and sequencing**, not boilerplate code. Claude at execution time has full context of the current codebase, reads the affected files, and writes code that matches local patterns. Over-specified plans lock in assumptions that may not match reality AND waste tokens twice (authoring + re-processing).

**An L-slice `plan.md` SHOULD include:**

- Task list with dependencies, estimates, acceptance criteria
- For each task: files affected (paths), commands to run, commit message shape, STOP criteria
- **One canonical example** of any non-obvious code pattern (adapter delegation shape, test structure, etc.)
- Non-obvious code worth pre-writing: novel algorithms, tricky async/concurrency, specific edge-case tests, pattern-establishing contracts (interface types others will match)

**An L-slice `plan.md` should NOT pre-specify:**

- Boilerplate delegation code (e.g., every repository function that just calls the adapter — one example suffices, rest is pattern-following)
- Mechanical find/replace work (say which imports move, not every individual line)
- Full test bodies for obvious assertions (say what's being tested; Claude writes at execution with full context)
- Complete implementations that follow a pattern already shown once in the plan

**Rule of thumb:** if you're pre-writing code that Claude could produce in 30 seconds by reading the target file, don't. Describe the transformation, give one canonical example, trust execution-time judgment for the rest.

**The line:** *pattern-establishing = spec in plan; pattern-following = execute with judgment.*

## Session progress tracking (mandatory for multi-task sessions)

Every Implementation or Closing session with 2+ tasks uses `TodoWrite` for live visual progress tracking. Rules:

1. **Session start:** populate `TodoWrite` from the active sub-slice's `plan.md` — one entry per Level 3 task (plus any amendments mid-slice). Statuses seeded from `plan.md` checkboxes.
2. **Exactly one task `in_progress`** at any moment. Never zero, never two.
3. **Mark completed immediately** the task is committed to the branch (commit SHA exists). Don't batch.
4. **Add tasks mid-session** as scope amendments or follow-ups emerge. Never hide additions.
5. **At every STOP** (per-task): also print a compact markdown progress table in the conversation — same content, scrollback-readable. Format:
  ```
   | # | Task | Status | Commit |
   |---|------|--------|--------|
  ```
6. **Session end:** the final `TodoWrite` state is the resume point for the next session. `CHECKPOINT.md` snapshots the same state in durable form.

Why both TodoWrite and the markdown table: `TodoWrite` is live UI (ephemeral to the session surface). The table in STOP messages is scrollback-readable across session history. They tell the same story in two persistence layers.

## Hard rules (governance)

- **Never advance without approval.** Dependent tasks run sequentially, one STOP + Yesid approval between each. Task → sub-slice → slice.
- **Sub-slices may need multiple sessions.** Always estimate upfront. Never assume one session.
- **Parallel agents require approval.** Independent research/exploration only. Never self-decide to parallelize implementation.
- **PR at Level 2 (sub-slice), not Level 3 (task).** All of a sub-slice's tasks accumulate to one PR.
- **Models:** **Opus AND Sonnet are both valid.** Never Haiku.
  - **Parent model by slice size:**
    - **L-slice Planning sessions:** Opus 4.7 [1m] — deep reasoning AND room to hold whole-codebase context across the Q&A
    - **L-slice Implementation sessions:** Opus 4.7 (standard 200k) — reasoning stays high but working set fits in 200k via the `spec.md` / `plan.md` artifacts; jump to [1m] only if the working set genuinely overflows
    - **M-slice sessions:** Sonnet 4.6 default — most tasks are "execute a clear plan"; upgrade to Opus 4.7 only when a real design choice surfaces mid-session
    - **S-slice sessions:** Sonnet 4.6 — fix-it-and-move-on work, no Opus tax
    - **Closing sessions:** Sonnet 4.6 — finalizing handoff/PR body, low reasoning load
  - **Subagents:** Sonnet 4.6 is the default for research, exploration, file-reading, code-review sweeps, and any task that produces a bounded summary. Opus only when the subagent needs deep reasoning (architecture analysis, novel debugging, complex refactor planning).
  - **Why split:** Sonnet returns faster and costs ~3× less while delivering 90% of Opus quality on search/summarize/review and clear-plan-execution work. Opus earns its tax on real design + decision work. The [1m] variant earns its additional tax only when the working set genuinely won't fit in 200k.
  - **Decision rule when uncertain:** default Sonnet. Upgrade to Opus the moment you notice you're making a tradeoff that matters or holding >3 independent concerns in mind. Upgrade to [1m] only when 200k genuinely won't fit the working set.
  - **Reference:** cloud `token-efficacy/04-subagent-delegation.md` for the routing research.
- **Handoff ships with PR.** A sub-slice that landed without a handoff didn't actually close.
- **Never bypass the close-script.** Manual mirror-and-delete loses the index update.

## Session token budget

Budget is percentage-based — thresholds apply regardless of which model/window you're using. Check `/cost` or `/context-budget` periodically.


| Context usage (% of active window) | Action                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| 0–40%                              | Comfortable. Continue.                                                              |
| 40–65%                             | Healthy. Continue but avoid major new directions.                                   |
| 65–80%                             | Pre-break zone. Finish in-progress task. Commit. STOP. Fresh session for next task. |
| 80%+                               | Danger. Commit what's green. STOP immediately. Don't start anything new.            |


**Absolute numbers by model:**


| Model         | Window    | 40%  | 65%  | 80%  |
| ------------- | --------- | ---- | ---- | ---- |
| Opus 4.7 [1m] | 1,000,000 | 400k | 650k | 800k |
| Opus 4.7      | 200,000   | 80k  | 130k | 160k |
| Sonnet 4.6    | 200,000   | 80k  | 130k | 160k |


At every STOP (per Iteration Protocol), the progress table includes a **budget row**:

```
Model: Opus 4.7 [1m] | Context: 142k / 1M (14%) — comfortable, continuing
```

or

```
Model: Sonnet 4.6 | Context: 145k / 200k (73%) — pre-break, finish the task then STOP for fresh session
```

Claude surfaces this; Yesid doesn't need to ask.

**Model downgrade across sessions:** L-slice Planning → Implementation hop starts fresh — usually Opus 4.7 (200k), not [1m]. Re-read `spec.md` + `plan.md` + `CHECKPOINT.md`, skip everything else. Planning Q&A doesn't get re-hydrated.

## Mid-session model switching

`/model <name>` switches the current session's model. Next turn re-processes context uncached (cache invalidation tax).


| Scenario                                                    | Preferred pattern                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Need a different model for a bounded, independent task      | **Subagent dispatch** (`Agent` with `model: sonnet` or `model: opus`) — parent cache stays warm, subagent isolated |
| Session turned out more complex than declared size          | `/model opus` for the design turns, `/model sonnet` back for execution — two switches, but each buys real value    |
| Session nearly full OR Planning → Implementation transition | **Fresh session.** Don't switch; restart with `spec.md` / `plan.md` / `CHECKPOINT.md` re-read                      |
| Just to "try Opus on this one question"                     | Don't. Subagent dispatch or next-session. Cache cost isn't worth it                                                |


**Rule of thumb:** one `/model` swap is fine. Two in a row = you should have started a fresh session.

## Iteration Protocol (per Level 3 task)

**You are done when Yesid says you are done.** Tests passing is necessary but not sufficient.

1. Implement ONE task from the plan.
2. Run `bun run test` + `bun run check`. Both must pass.
3. **Pre-flight visual check (UI tasks only):** state expected layout at 1440px + 375px; flag overflow/missing content; fix obvious issues before STOP.
4. **STOP.** Tell Yesid: what you built (one sentence), what to check at `http://localhost:5173/` (specific behaviors), any decisions made. Include the budget row: `Model: <name> | Context: <used> / <window> (<%>) — <state>`.
5. Append to `log.md` (running record) AND `handoff.md` (reviewer-facing summary).
6. Wait for Yesid's response. No more code until he replies.
7. Issues → fix, retest, STOP again.
8. Approval → next task. Repeat.

**Never** batch tasks. Never write final handoff summary before approval. Never "I think this should work." Never continue coding after a STOP.

## Git & PR Workflow

- **One branch per sub-slice:** `feature/slice-{NN}{letter}` (e.g. `feature/slice-17j-token-efficacy`).
- Branch from `main`, PR back to `main`. Never commit to `main` directly.
- **PR Protocol:** all tasks approved → `bun run test` + `bun run check` pass → create PR with handoff as body → Yesid reviews on GitHub → squash-merge → delete branch → `bun run slice:close` → next sub-slice branches from updated main.
- **Commit convention:** `<type>(slice-NN<letter>): <description>`. Types: feat, fix, refactor, docs, test, chore, perf, ci.

## Active slice

Read the checkpoint at the start of every session: `docs/slices/slice-NN/CHECKPOINT.md`. If the next sub-slice is **L-sized**, also read its `spec.md` + `plan.md`. If **M-sized**, read the current `log.md`. If **S-sized**, nothing extra to read.

Checkpoint holds: current sub-slice, task number, branch name, what's merged, what's pending, blockers.

## Slice Closing (only after all tasks approved at Level 2)

See `docs/reference/WORKFLOW.md` for the full closing checklist. Critical items:

1. Finalize `handoff.md` (add Summary + PR body sections).
2. Update `docs/reference/` governance docs as needed (CONSTITUTION, CSS, MOTION, TESTS, ARCHITECTURE, PATTERNS).
3. Update `docs/reference/VOCAB.md` with any new brand/industry/workflow terms introduced.
4. Append any OS-specific command fixes discovered to `<cloud>/claude-knowledge/os-quirks/<os>.md`.
5. Write any durable patterns / concepts worth codifying to `<cloud>/yesid.dev/docs/learn/<domain>/<concept>.md` (learn is in cloud; Yesid's Obsidian vault).
6. Regenerate `tree.txt`:
  ```powershell
   cmd /c "tree /F /A | findstr /V /C:\"node_modules\" /C:\".git\" /C:\".remember\" /C:\"bun.lockb\" /C:\".svelte-kit\" /C:\".vercel\" /C:\".DS_Store\" > tree.txt"
  ```
7. Commit + push + `gh pr create`.
8. After PR squash-merges: `bun run slice:close <N> <letter>` → mirrors bundle to cloud, deletes repo folder, updates `COMPLETED-SLICES.md`.

## Testing (Vitest + Bun)

Setup: `vitest.setup.ts` stubs jsdom gaps (GSAP, Threlte, lottie-web, postprocessing, canvas, matchMedia, IntersectionObserver). Don't re-mock per-file unless overriding.

After every test run, print a table:

```
| Test File | Test Name | Status | Failure Reason |
|-----------|-----------|--------|----------------|
| src/...   | it(...)   | PASS   |                |
| src/...   | it(...)   | FAIL   | Expected X, got Y (line NN) |
```

**Never say "some tests failed" without listing every failure by name.** If all pass, still list what ran.

Other test rules: maintain `docs/reference/TESTS.md`; co-locate test files next to code; `@testing-library/svelte` for components; visual/animation via Playwright E2E; update `TESTS.md` on every test add/change/delete.

## Code Standards

- TypeScript for all new files
- Comments explain WHY, not what
- Descriptive names, no abbreviations (except db, api, url)
- Always handle errors, never swallow silently
- Every slice ships code AND tests

## CSS Architecture (summary — law in CONSTITUTION.md)

Three layers, strict separation. Full reference: `docs/reference/CSS.md`. Governance: `docs/reference/CONSTITUTION.md`.


| Layer           | File                         | Purpose                                          |
| --------------- | ---------------------------- | ------------------------------------------------ |
| Semantic tokens | `src/lib/styles/tokens.css`  | Theme-switching CSS custom properties            |
| Brand utilities | `src/app.css` `@theme` block | Static brand values that never change with theme |
| Component scope | `<style>` in `.svelte`       | Layout/structure specific to one component       |


**Top rules:** zero hardcoded colors (use tokens); no `!important`; no inline `style=` except dynamic JS values; mobile-first responsive; prefer logical properties; no `vh` unit (use `dvh`/`svh`/`lvh`); no arbitrary Tailwind spacing.

## Brand (non-negotiable)

- Primary `#E07800` / Accent `#FFB627`. Fonts: Inter (headings/body), JetBrains Mono (code).
- Dark theme default. "yesid." always lowercase, dot always orange.
- Full guide: `/brand/BRAND.md` + `/brand/foundations/*.md`.

## Repo structure

**Standard layout (sibling directories at root — applies to every project Yesid owns):**

```
repo-root/
├── docs/           # workflow + governance (required)
├── brand/          # visual identity (optional — brand-owning projects only)
├── src/            # app code
├── scripts/        # slice-close, mirror-docs, mirror-brand
├── static/         # public assets
├── CLAUDE.md       # governance
├── .mcp.json       # project MCP allowlist
├── .claude/settings.json
└── package.json
```

`docs/` + `brand/` stay siblings at root — different audiences (workflow vs visual), scripts reference these paths directly. See `tree.txt` for the full tree. Docs live under:

- `docs/reference/` — Tier 1 governance (CONSTITUTION, CSS, WORKFLOW, MOTION, TESTS, ARCHITECTURE, PATTERNS, VOCAB, ARCHIVE)
- `docs/roadmap/` — PLAN.md + FUTURE_PHASES.md
- `docs/slices/` — active slice bundles + templates + checkpoints
- `docs/sessions/` — non-slice session records

Source lives under `src/` (components, motion, data, routes, content). Brand assets under `brand/`.

## Never

- Delete files without slice spec instruction
- Refactor outside current slice scope
- Install packages without a `log.md` entry
- Skip the close-script (manual mirror loses the index update)
- Use npm or npx
- Add CSS tokens, `@theme` values, or scoped styles without updating `CSS.md`
- Continue to next task without Yesid's approval
- Close a slice without appending OS-quirks discoveries and durable learnings to cloud
- Invent a brand or workflow term that already exists in `VOCAB.md`

