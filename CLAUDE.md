# CLAUDE.md — yesid.dev

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

| Level | Name | Example | Folder form |
|-------|------|---------|-------------|
| 1 | **Slice** | Slice 17 (Standardization) | `docs/slices/slice-17/` |
| 2 | **Sub-slice** — PR boundary | 17j (Workflow Efficiency) | `docs/slices/slice-17/slice-17j/` |
| 3 | **Task** — section in plan/log/handoff | 17j-3, 17j-3a | section, not a folder |
| (4) | **Session** | `### Session 2026-04-17 — Task 17j-3` | heading in log.md |

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

| Type | What happens | Artifacts |
|------|--------------|-----------|
| **Planning** | Research, brainstorm, design spec, slice spec, plan | `slice-NN/slice-NN<letter>/spec.md`, `plan.md` |
| **Implementation** | One or more Level 3 tasks per Iteration Protocol | Code, tests, append to `log.md`, `handoff.md` |
| **Closing** | Finalize handoff, update governance docs, run `slice:close` | `handoff.md` final sections, PR |
| **Non-slice** | Bugfix / config / exploration / hotfix | `docs/sessions/<YYYY-MM-DD>-<name>.md`, commit |

**Hard rule:** A session cannot be two types. Planning produces zero code. Implementation doesn't write specs but can amend them. Closing doesn't add features.

At session start: scan for uncommitted changes or commits made outside Claude Code. Document anything found in `log.md` (or the session file for non-slice).

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
  - **Parent (main session):** Opus 4.7 for the design + decision work where deep reasoning pays.
  - **Subagents:** Sonnet 4.6 is the default for research, exploration, file-reading, code-review sweeps, and any task that produces a bounded summary. Opus only when the subagent needs deep reasoning (architecture analysis, novel debugging, complex refactor planning).
  - **Why split:** Sonnet returns faster and costs less while delivering 90% of Opus quality on search/summarize/review work. The research (cloud `token-efficacy/04-subagent-delegation.md`) confirms this as the 2026 routing pattern. Reserve Opus for the session that has to hold the whole problem in context.
- **Handoff ships with PR.** A sub-slice that landed without a handoff didn't actually close.
- **Never bypass the close-script.** Manual mirror-and-delete loses the index update.

## Iteration Protocol (per Level 3 task)

**You are done when Yesid says you are done.** Tests passing is necessary but not sufficient.

1. Implement ONE task from the plan.
2. Run `bun run test` + `bun run check`. Both must pass.
3. **Pre-flight visual check (UI tasks only):** state expected layout at 1440px + 375px; flag overflow/missing content; fix obvious issues before STOP.
4. **STOP.** Tell Yesid: what you built (one sentence), what to check at `http://localhost:5173/` (specific behaviors), any decisions made.
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

Read the checkpoint at the start of every session: `docs/slices/slice-NN-checkpoint.md` (will move to `docs/slices/slice-NN/CHECKPOINT.md` after Task 3b runs).

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

| Layer | File | Purpose |
|-------|------|---------|
| Semantic tokens | `src/lib/styles/tokens.css` | Theme-switching CSS custom properties |
| Brand utilities | `src/app.css` `@theme` block | Static brand values that never change with theme |
| Component scope | `<style>` in `.svelte` | Layout/structure specific to one component |

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
