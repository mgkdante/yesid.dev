# <slice-name> — Plan

> Slice-level plan (Level 1). Sits between the project plan ([../../plan.md](../../plan.md)) and per-sub-slice plans under [./](.)`<subslice>/plan.md`.

**Devlog:** [devlog.md](devlog.md)

<!-- FILL IN: replace `<slice-name>` with the real slice name in the title. -->

## Scope

<!-- FILL IN: one paragraph — what this slice accomplishes overall. Narrower than the project plan, broader than any single sub-slice. -->

## Canonical commands

Ground truth for build / verify / run during this slice. Sub-slice plans inherit this table by reference (see `../<subslice>/plan.md`).

| Purpose     | Command                                        |
| ----------- | ---------------------------------------------- |
| Install     | <!-- FILL IN: install / bootstrap -->          |
| Build       | <!-- FILL IN -->                               |
| Test        | <!-- FILL IN -->                               |
| Lint        | <!-- FILL IN -->                               |
| Typecheck   | <!-- FILL IN, or "n/a" -->                     |
| Run locally | <!-- FILL IN: dev server or equivalent -->     |

## Sub-slices

The slice decomposes into one or more sub-slices. **Each sub-slice is a separate PR boundary** with its own `plan.md`, `spec.md`, and `handoff.md` under `docs/slices/<slice>/<letter>/`. Tasks within a sub-slice live in TodoWrite / Codex tracker (no task-level files).

| Letter | Scope (one line)                                    | Status                                  | PR  |
| ------ | --------------------------------------------------- | --------------------------------------- | --- |
| a      | <!-- FILL IN: one-line scope -->                    | <!-- planned / active / closed -->      | <!-- PR URL once opened --> |
| b      | <!-- FILL IN -->                                    | <!-- -->                                | <!-- --> |
| c      | <!-- FILL IN -->                                    | <!-- -->                                | <!-- --> |

<!-- Single letters (a, b, c, ...). If a slice grows past the alphabet, that's usually a signal it should have been split into two slices — consider re-scoping. -->

## Session layout

Rough outline of how the slice breaks into sessions. Updated as reality diverges from plan.

<!-- FILL IN:
- Session 1 — Planning: author this plan + each sub-slice's spec. Zero code.
- Session 2 — Sub-slice a implementation.
- Session 3 — Sub-slice a close + sub-slice b kickoff.
- ...

Adjust for the slice's real shape. -->

## Success criteria (slice-level)

<!-- FILL IN: what makes this slice "done" beyond its sub-slices' PRs individually merging. Usually: all planned sub-slices closed + an integration check. -->

## Notes

<!-- FILL IN: cross-cutting notes, context, links to related slices. -->
