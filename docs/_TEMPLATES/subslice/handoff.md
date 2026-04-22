# <slice-name>/<subslice-name> — Handoff

> **Sub-slices are the PR boundary.** This handoff IS the PR body. Self-appending: per-task sections accumulate as work lands (per Iteration Protocol step 4) — never written in one push at slice close. `/workflow-close-slice` finalizes by adding § Summary + § PR Body + § Peer review notes.

> **Reviewer note:** another engineer should be able to continue this sub-slice cold from this file alone. Be precise, factual, exhaustive on file paths and commands. Do not summarize vaguely. Do not hide failed commands.

<!-- FILL IN: replace `<slice-name>` and `<subslice-name>` in the title (e.g., `slice-auth/slice-auth-a`). -->

## 1) Status

| Field | Value |
|-------|-------|
| Status | <!-- 🟢 in progress \| 🟡 closing \| ✅ shipped \| 🔴 blocked --> |
| PR | <!-- pending \| #nn (link once opened) --> |
| Spec | [./spec.md](spec.md) |
| Plan | [./plan.md](plan.md) |
| Parent slice plan | [../plan.md](../plan.md) |
| Branch | <!-- FILL IN: feature/slice-<name>-<letter> --> |
| Tasks completed | <!-- FILL IN: N / M (e.g., 3/7) --> |

## 2) Scope (from spec)

<!-- FILL IN: copy the Goal + Acceptance criteria from spec.md so reviewers see what they are evaluating without leaving this file. Keep tight; link back to spec.md for full design rationale. -->

## 3) Tasks completed

> Each Level 3 task appends a `### Task <slice-tag>-N` section here as it lands. Sections accumulate; never rewrite past entries. Use D-numbering for decisions so spec amendments can reference them.

---

### Task <slice-tag>-1 — <task title> ✅

- **Planned by:** <!-- FILL IN: tool name (model, reasoning=effort) -->
- **Implemented by:** <!-- FILL IN: tool name (model, reasoning=effort) -->
- **Session:** <!-- FILL IN: YYYY-MM-DD HH:MM -->
- **Commit(s):** <!-- FILL IN: short SHA + one-line subject. List multiple if review-fix follow-up commit landed. -->

**Files:**

- Created: <!-- FILL IN: `path/to/file` — purpose -->
- Modified: <!-- FILL IN: `path/to/file` — what changed -->
- Deleted: <!-- FILL IN: `path/to/file` — why -->

**What landed:**

<!-- FILL IN: one paragraph reviewer-facing summary. What changed in user/reviewer terms, not how the code looks. -->

**Decisions:**

- D-<NN>: <!-- FILL IN: decision + one-line rationale. If parent-slice implications, flag for spec promotion. -->

**Reviews:**

- Spec adherence: ✅ / ⚠️ / ❌ — <!-- FILL IN: notes -->
- Code quality (auto + human): <!-- FILL IN: e.g., "✅ after 2 MINOR fixes (link/wording)" or "✅" -->
- Cross-tool adversarial review: <!-- FILL IN: severity + finding + addressed inline / deferred per plan D-N. Empty if review not yet run for this task. -->

**Follow-ups flagged:**

- <!-- FILL IN: anything deferred or surfaced. Mirror critical items into § 5 Follow-ups flagged below. -->

**Tests / verification:**

- <!-- FILL IN: which canonical command(s) ran + green state (e.g., `pytest: 97 passed` / `ruff check: clean` / `bun run check: 0 errors` / `bun run test: <N> passed`). Be specific — never say "tests pass" alone. -->

---

### Task <slice-tag>-2 — <task title> ✅

<!-- Same structure as Task 1. Append a fresh block per task, never edit prior blocks. -->

---

## 4) Open items for downstream tasks

> Items surfaced during a completed task that downstream tasks must pick up. Different from § 5 Follow-ups (which are sub-slice-local and may defer to future slices); these are sub-slice-internal carry-forwards (e.g., "Task 3 will need to handle the X edge case Task 2 surfaced").

- <!-- FILL IN: <task-tag> needs to <action> because <reason from prior task> -->
- <!-- FILL IN -->

## 5) Follow-ups flagged (accumulating)

> Decisions deferred, items surfaced, or work consciously moved out of this sub-slice. Each entry: what + why deferred + who/when picks it up. Curated rollup of per-task **Follow-ups flagged** lines above.

1. <!-- FILL IN: <item> — <reason deferred> — <next sub-slice / owner / "logged in parent slice plan"> -->
2. <!-- FILL IN -->

## 6) Iterations (per Iteration Protocol step 7)

> Per-task feedback loops. One row per fix-retest-STOP cycle. Empty is valid if every task landed first-pass.

| # | Task | Owner reported | Fix applied | Files |
|---|------|----------------|-------------|-------|
| 1 | <!-- FILL IN: <slice-tag>-N --> | <!-- FILL IN: feedback --> | <!-- FILL IN: fix --> | <!-- FILL IN: files --> |
| Final | — | Approved | — | — |

## 7) Amendments during execution

> Append-only record of plan / spec changes that happened mid-execution (vs at planning time). Date + what changed + why.

| # | Date | Change | Rationale |
|---|------|--------|-----------|
| 1 | <!-- YYYY-MM-DD --> | <!-- FILL IN: e.g., "Task <N> shipped as 2 commits (primary + review-fix)" --> | <!-- FILL IN: why deviation from plan was necessary --> |

## 8) Files created (cumulative across all tasks)

> Roll-up of all `Files: Created` entries from § 3. Reviewers scanning the PR can confirm scope at a glance.

- <!-- FILL IN: `path/to/file` — task <slice-tag>-N — purpose -->

## 9) Files modified (cumulative across all tasks)

> Roll-up of all `Files: Modified` entries from § 3.

- <!-- FILL IN: `path/to/file` — task <slice-tag>-N — what changed -->

## 10) Files deleted (cumulative across all tasks)

> Roll-up of all `Files: Deleted` entries from § 3. Reviewers especially check this section.

- <!-- FILL IN: `path/to/file` — task <slice-tag>-N — why -->

## 11) Repository / file-tree changes

> If the slice materially changed the repo structure (new top-level dirs, moved subtrees, deleted modules), include the updated tree fragment here. Skip section if structure unchanged.

```text
<!-- FILL IN if applicable: relevant subtree showing new shape. Omit unchanged areas. -->
```

## 12) Schema / data changes

> Migrations, schema deltas, seed data, retention/index changes. Skip when N/A (UI-only / docs-only / config-only sub-slices).

- Migrations added: <!-- FILL IN: filename + revision id + tables affected, or "none" -->
- Tables / collections / globals: <!-- FILL IN: created / modified / deleted, or "none" -->
- Indexes: <!-- FILL IN: added / removed, or "none" -->
- Constraints: <!-- FILL IN, or "none" -->
- Seed data: <!-- FILL IN: row counts inserted / upserted / deleted, or "none" -->

> **If new migration files were created in this sub-slice, paste the full contents below. Reviewers should not have to leave this file to evaluate schema risk.**

```sql
-- FILL IN: full migration contents, or "no migration files created in this sub-slice"
```

## 13) Entrypoints / commands status

> List every command, script, CLI entry, or workflow-dispatch entrypoint touched in this sub-slice. Skip when N/A (pure docs sub-slice).

| Command / entrypoint | What it does | Status |
|----------------------|--------------|--------|
| <!-- FILL IN: e.g., `bun run dev` --> | <!-- FILL IN --> | <!-- working / stub / partial --> |

## 14) Architectural seam status

> Generic equivalent of "provider abstraction" / "adapter status" / "module boundary" / "integration seam". Describes the abstraction layer this sub-slice touched. Skip when N/A.

- Seam touched: <!-- FILL IN: e.g., "data adapter / port interface" / "auth middleware" / "feed parser" -->
- Abstractions added / changed: <!-- FILL IN: classes / interfaces / config files / modules -->
- Concrete wiring still present (project-specific): <!-- FILL IN: which concrete impl still depends on the seam, or "none" -->

## 15) Environment / config

> Every environment variable currently required or supported by changes in this sub-slice. For each: name / required-optional / default / purpose. Do not print real secret values.

| Variable | Required? | Default | Purpose |
|----------|-----------|---------|---------|
| <!-- FILL IN: `EXAMPLE_VAR` --> | <!-- required \| optional --> | <!-- value or "none" --> | <!-- FILL IN --> |

## 16) Commands executed (in order, including failed)

> Verbatim shell history during sub-slice execution. Reviewers / future engineers can replay or audit. Include failed commands — do not hide them.

```bash
# FILL IN: command 1 — what it did / what it produced
# FILL IN: command 2
# ...
# FILL IN: failed command — exit code / error
# FILL IN: fix command — recovery
```

## 17) Validation results

> Per-command: pass / fail + important output + what it means. Required even for "obvious" commands so reviewers can verify.

- `<!-- command -->`
  - Result: ✅ pass / ❌ fail
  - Output: <!-- FILL IN: salient lines (e.g., "63 passed in 2.29s") -->
  - Meaning: <!-- FILL IN: what this proves / fails to prove -->

> **If a planned validation was not run, say so explicitly with reason. Do not omit.**

## 18) Errors encountered

> Every error, failed command, broken import, migration issue, or unresolved problem hit during execution. Empty is valid if nothing went wrong (rare — say so explicitly).

- **Error:** <!-- FILL IN: exact error text -->
  - **Cause:** <!-- FILL IN -->
  - **Fix applied:** <!-- FILL IN -->
  - **Resolved:** ✅ yes / ⚠️ partial / ❌ no — <!-- explain if not yes -->

## 19) Assumptions made

> Categorized assumptions made during execution that future readers need to know. Name the category, then state the assumption (schema / naming / IDs / URLs / storage / environment / versions / structure / cadence).

- **Schema / data shape:** <!-- FILL IN -->
- **Naming / conventions:** <!-- FILL IN -->
- **Provider / integration IDs:** <!-- FILL IN -->
- **URLs / endpoints:** <!-- FILL IN -->
- **Storage / retention:** <!-- FILL IN -->
- **Local / dev environment:** <!-- FILL IN -->
- **Package / dependency versions:** <!-- FILL IN -->
- **Folder structure:** <!-- FILL IN -->
- **Operational behavior / cadence:** <!-- FILL IN -->

## 20) Peer review notes

> The other AI tool's adversarial review of this sub-slice, captured at `/workflow-close-slice`. Format per finding: severity (BLOCKER / HIGH / MEDIUM / LOW / INFO) + reviewer tool + date + finding + how addressed (fixed inline / deferred + reason / accepted as-is + rationale). Empty until the review runs.

<!-- FILL IN at slice close. Triggered automatically by /workflow-close-slice. -->

## 21) Known gaps / deferred work

> What this sub-slice intentionally did NOT do, and where the gap is picked up. Distinct from § 5 Follow-ups (those are surfaced-during-execution items); this is original-scope deferrals.

- <!-- FILL IN: <gap> — <reason> — <next sub-slice / next slice / "deferred indefinitely"> -->

## 22) Deferred risks

> Risks consciously deferred from this sub-slice (vs already-mitigated in § 18). Each entry: what could go wrong + why we accept it for now + when/how revisited. Empty is valid.

- <!-- FILL IN: risk — acceptance reason — revisit trigger -->

## 23) Summary

*(Added at `/workflow-close-slice`.)*

<!-- FILL IN at PR time: one paragraph on what this sub-slice achieved end-to-end. Reviewer reads this first. Tie back to the parent slice's goal. Be concrete (numbers, file counts, table names) — not vague ("set up the project"). -->

## 24) PR Body

*(Added at `/workflow-close-slice`. Extracted from sections above for `gh pr create --body-file handoff.md` or web-form paste.)*

```markdown
## Summary

<paragraph from § 23>

## Changes

- <bullet from § 8/9/10/11>

## Verification

<from § 17>

## Follow-ups

<list from § 5, or "none">
```

## 25) Next recommended prompt

> Literal text of the next prompt (this slice's next sub-slice, OR the next slice's first task) that builds on what was actually shipped. Transit pattern — makes cross-tool / cross-session handoff zero-friction.

```text
<!-- FILL IN at slice close: full self-contained prompt for the next session. Include "Important context", "Read these files first", "Implement only this scope", "Hard constraints", numbered "Objectives", and "Validation to run" sections per the project's prompt convention. -->
```

## 26) Cross-tool handoff context

> Concise but detailed context block another tool / engineer can paste cold. Optimized for handoff — they should not need to reopen all files manually.

```text
<!-- FILL IN at slice close:
Current project state:
- <what works>
- <what does not exist yet>

What this sub-slice changed:
- <bullet>

Key file paths:
- <path>

Required env / runtime config:
- <var>

Required next step:
- <bullet>
-->
```

## 27) Final Status

> One of:
> - ✅ **COMPLETE** — all acceptance criteria met, all verification commands green, owner approved, peer review clean (or findings addressed).
> - 🟡 **COMPLETE WITH GAPS** — functional + owner-approved, but some acceptance items consciously deferred (listed in § 21 + § 22).
> - 🟠 **PARTIAL** — some tasks incomplete (explain which + why).
> - 🔴 **BLOCKED** — cannot proceed (explain blocker + what's needed to unblock).

<!-- FILL IN at slice close. -->

**Explanation:** <!-- FILL IN: one paragraph why this status. Be honest. Do not claim COMPLETE if peer review surfaced unaddressed BLOCKER/HIGH findings. -->

---

*Rules: be precise, honest, do not hide failed commands, do not summarize vaguely, do not omit files changed. The handoff IS the PR — reviewers and future engineers depend on it being accurate and exhaustive.*
