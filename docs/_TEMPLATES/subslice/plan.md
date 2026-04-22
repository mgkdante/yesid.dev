# <slice-name>/<subslice-name> — Plan

> Sub-slice-level execution plan. Bottom level of the three-level planning hierarchy. Sub-slices do NOT have sub-sub-slices — tasks below are implemented directly.

**Sub-slice spec:** [spec.md](spec.md)
**Parent slice spec:** [../spec.md](../spec.md)
**Parent slice plan:** [../plan.md](../plan.md)

<!-- FILL IN: replace `<slice-name>` and `<subslice-name>` in the title. -->

## Canonical commands

<!-- FILL IN: typically inherited from the parent slice plan. If this sub-slice introduces new commands (e.g., a new test script for a newly-added area), add them here. Otherwise, state "Inherited from parent slice plan — see [../plan.md § Canonical commands](../plan.md)." -->

| Purpose     | Command                                              |
| ----------- | ---------------------------------------------------- |
| Install     | <!-- FILL IN or "inherited" -->                      |
| Build       | <!-- FILL IN or "inherited" -->                      |
| Test        | <!-- FILL IN or "inherited" -->                      |
| Lint        | <!-- FILL IN or "inherited" -->                      |
| Typecheck   | <!-- FILL IN or "inherited" -->                      |
| Run locally | <!-- FILL IN or "inherited" -->                      |

## Session layout

<!-- FILL IN: how this sub-slice breaks into sessions. Most sub-slices run in 1-2 sessions. Example shape:

- **Session 1 — <goal>** — implement tasks <N>–<M>.
- **Session 2 — Close** — run `/workflow-close-slice` on this sub-slice. Finalize handoff.
-->

## Tasks

Sub-slice tasks are implemented directly (no further nesting). Each task follows the Iteration Protocol: implement, verify, STOP, await approval, then next.

### Task 1 — <task title>

- **Goal:** <!-- FILL IN: one-sentence outcome -->
- **Steps:** <!-- FILL IN: ordered steps. Keep short — session-by-session detail goes in the slice-level `../devlog.md`; real-time task status goes in TodoWrite / Codex tracker. -->
- **Verification:** <!-- FILL IN: which canonical command(s) to run, and what a green result looks like -->

### Task 2 — <task title>

- **Goal:** <!-- FILL IN -->
- **Steps:** <!-- FILL IN -->
- **Verification:** <!-- FILL IN -->

### Task 3 — <task title>

- **Goal:** <!-- FILL IN -->
- **Steps:** <!-- FILL IN -->
- **Verification:** <!-- FILL IN -->

<!-- Add/remove task sections as needed. Typical sub-slice: 2-5 tasks. If you reach 8+, the sub-slice is probably too large — split it. -->
