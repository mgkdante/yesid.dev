# <slice-name> — Plan

> Slice-level plan (Level 1). Sits between the project plan ([../../plan.md](../../plan.md)) and per-sub-slice plans under `<letter>/plan.md`.

> **Devlog:** [devlog.md](devlog.md) — self-appending session record, shared across all sub-slices of this slice (D19).

<!-- FILL IN: replace `<slice-name>` with the real slice name in the title. -->

## Scope

<!-- FILL IN: one paragraph — what this slice accomplishes overall. Narrower than the project plan, broader than any single sub-slice. State the outcome, not the activity. -->

## Strategic themes

> Cross-cutting themes this slice advances. Themes group sub-slices by intent. Tag each sub-slice in § Sub-slices with its theme(s). Helps reviewers understand WHY the sub-slices were carved this way.

- **<Theme A>** (P0 / P1 / P2): <!-- one-line description --> — sub-slices: <letters>
- **<Theme B>** (P0 / P1 / P2): <!-- one-line description --> — sub-slices: <letters>
- **<Theme C>** (P0 / P1 / P2): <!-- one-line description --> — sub-slices: <letters>

<!-- Priority tags: P0 = blocking next slice, P1 = same-cycle, P2 = nice-to-have. Carry up to project plan if the theme is durable beyond this slice. -->

## Hard constraints

> Non-negotiable boundaries for this slice. Apply to every sub-slice within it. Violating any triggers STOP + ask owner.

- <!-- FILL IN: e.g., "Do not redesign the stack." -->
- <!-- FILL IN: e.g., "Do not introduce a new major dependency." -->
- <!-- FILL IN: e.g., "Keep <storage> as <backend>." -->
- <!-- FILL IN: e.g., "Do not broaden scope into <out-of-scope domain>." -->
- <!-- FILL IN: e.g., "Implementation must remain boring, minimal, and explicit." -->
- <!-- FILL IN: e.g., "Keep costs low / within free tier where possible." -->

## Canonical commands

> Ground truth for build / verify / run during this slice. Sub-slice plans inherit this table by reference (see `<letter>/plan.md`).

| Purpose       | Command                                              |
| ------------- | ---------------------------------------------------- |
| Install       | <!-- FILL IN: install / bootstrap -->                |
| Build         | <!-- FILL IN -->                                     |
| Test (unit)   | <!-- FILL IN -->                                     |
| Test (E2E)    | <!-- FILL IN, or "n/a" -->                           |
| Lint          | <!-- FILL IN -->                                     |
| Typecheck     | <!-- FILL IN, or "n/a" -->                           |
| Run locally   | <!-- FILL IN: dev server or equivalent -->           |
| Migrate (DB)  | <!-- FILL IN, or "n/a" -->                           |
| Run with secrets | <!-- FILL IN: e.g., `op run --env-file=.env -- <cmd>` --> |

## Sub-slices

> The slice decomposes into one or more sub-slices. **Each sub-slice is a separate PR boundary** with its own `plan.md`, `spec.md`, `handoff.md` under `docs/slices/<slice>/<letter>/`. Tasks within a sub-slice live in TodoWrite / Codex tracker (no task-level files — D19).

| Letter | Scope (one line) | Theme(s) | Status | PR | Sessions |
|--------|------------------|----------|--------|----|----------|
| a | <!-- FILL IN --> | <!-- A, B --> | <!-- planned \| active \| closed --> | <!-- URL once opened --> | <!-- est. --> |
| b | <!-- FILL IN --> | <!-- --> | <!-- --> | <!-- --> | <!-- --> |
| c | <!-- FILL IN --> | <!-- --> | <!-- --> | <!-- --> | <!-- --> |

<!-- Single letters (a, b, c, ...). If a slice grows past the alphabet, that's usually a re-scope signal — consider splitting into two slices. -->

## Session layout

> Rough outline of how the slice breaks into wall-clock sessions. Updated as reality diverges from plan (capture divergence in § Amendments).

- **Session 1 — Planning:** author this plan + each sub-slice's spec. Zero code.
- **Session 2 — Sub-slice <a> implementation.**
- **Session 3 — Sub-slice <a> close + sub-slice <b> kickoff.**
- ...

<!-- Adjust for the slice's real shape. Most slices: 3–6 sessions; large slices may span 8+. -->

## Success criteria (slice-level)

> What makes this slice "done" beyond its sub-slices' PRs individually merging. Usually: all planned sub-slices closed + an integration check + governance updates landed.

- [ ] <!-- FILL IN: all planned sub-slices closed and merged -->
- [ ] <!-- FILL IN: cross-sub-slice integration check passes (e.g., "full E2E suite green on main with all sub-slice PRs merged") -->
- [ ] <!-- FILL IN: governance docs updated per AGENTS.md § Slice Closing -->
- [ ] <!-- FILL IN: durable outputs (skills, learn docs, snapshots, OS-quirks) landed in cloud per spec § Durable outputs -->
- [ ] <!-- FILL IN: project-plan slice index updated -->

## Validation to run

> Acceptance gates for the slice as a whole (sub-slice-level gates live in each `<letter>/plan.md`). Run before declaring slice complete.

- <!-- FILL IN: e.g., full test suite green on main after final sub-slice merge -->
- <!-- FILL IN: e.g., lint clean across all sub-slices -->
- <!-- FILL IN: e.g., performance / cost benchmark within budget -->
- <!-- FILL IN: e.g., production deploy verified -->
- <!-- FILL IN: e.g., docs updated and consistent -->

## Risks (cross-cutting)

> Risks that span multiple sub-slices or apply to the slice as a whole. Per-sub-slice risks live in each spec's § Risks. Each risk: condition + impact + mitigation + owner / revisit trigger.

- **R1.** <!-- FILL IN: condition — Impact: <what goes wrong across sub-slices> — Mitigation: <what we'll do> — Revisit: <when> -->
- **R2.** <!-- FILL IN -->
- **R3.** <!-- FILL IN -->

## Decisions log (parent-level)

> Slice-wide design decisions that apply to all sub-slices. Sub-slice-scoped decisions live in each `<letter>/spec.md` § Design decisions and reference parent decisions as `parent D<N>`. Each decision: title, what was chosen, alternatives, why this won, real tradeoff.

### D1 — <decision title>

- **Chosen:** <!-- FILL IN -->
- **Alternatives considered:** <!-- FILL IN -->
- **Why this won:** <!-- FILL IN -->
- **Tradeoff:** <!-- FILL IN -->
- **Affects:** <!-- which sub-slices / themes -->

### D2 — <decision title>

<!-- Same structure. -->

## Amendments log

> Append-only record of plan changes after the slice opens. Date + what changed + why. Plan stays mostly stable; amendments accumulate here.

| # | Date | Change | Rationale |
|---|------|--------|-----------|
| 1 | <!-- YYYY-MM-DD --> | <!-- FILL IN --> | <!-- FILL IN --> |

## Notes

<!-- FILL IN: cross-cutting context, links to related slices, prior-art research, external references. -->
