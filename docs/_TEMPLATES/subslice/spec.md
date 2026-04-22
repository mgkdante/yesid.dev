# <slice-name>/<subslice-name> — Spec

> Sub-slice-level specification. Sub-slices are the **PR boundary** in this workflow — each sub-slice becomes its own pull request. For the parent slice spec, see `../spec.md`.

<!-- FILL IN: replace `<slice-name>` and `<subslice-name>` in the title (e.g., `slice-auth/slice-auth-a`). -->

## Metadata

| Field        | Value                                                            |
| ------------ | ---------------------------------------------------------------- |
| Parent slice | <!-- FILL IN: link to `../spec.md` (the parent slice spec) -->   |
| Status       | <!-- FILL IN: draft / active / closed -->                        |
| Depends on   | <!-- FILL IN: earlier sub-slices (or other slices) this one requires, or "none" --> |
| Unblocks     | <!-- FILL IN: later sub-slices (or other slices) this one enables, or "none" --> |
| Size         | <!-- FILL IN: M (typical). L is unusual at sub-slice level — if it fits L, consider whether it should be its own slice. --> |
| Sessions     | <!-- FILL IN: expected session count (typically 1-2) -->         |
| Branch       | <!-- FILL IN: git branch name for this sub-slice's PR -->        |

## Goal

<!-- FILL IN: one paragraph stating what this sub-slice accomplishes. Phrase as an outcome. Since sub-slices are PR-sized, the goal should be narrower than the parent slice's goal — this sub-slice advances ONE coherent piece of the parent. -->

## Why this sub-slice

<!-- FILL IN: why this piece of the parent slice was carved out separately. Common reasons: "reviewable in isolation", "unblocks later sub-slices", "has independent verification". 2-3 sentences. -->

## Non-goals

<!-- FILL IN: things this sub-slice explicitly does NOT do. At sub-slice level, a useful non-goal is often "defers X to sub-slice <letter>" — making the split between sub-slices explicit.

Example shape:
- <!-- FILL IN: "Does not implement <feature Y> — that lands in sub-slice <letter>." -->
- <!-- FILL IN: "Does not change <subsystem Z>." -->
-->

## Design decisions

Sub-slice-scoped decisions. Parent-slice-scoped decisions stay in `../spec.md` — don't duplicate them here. Reference parent decisions as `parent D<N>` when needed.

### D1 — <decision title>

<!-- FILL IN: decision paragraph. Alternatives considered, why this one won, any real tradeoff. If this decision has parent-slice implications (e.g., changes how later sub-slices work), flag it and consider promoting to the parent spec. -->

### D2 — <decision title>

<!-- FILL IN: another decision. -->

## File-touch summary

<!-- FILL IN: which parts of the codebase this sub-slice touches. More specific than the parent spec — sub-slices are PR-sized and reviewers need precise scope.

Example shape:
- <!-- FILL IN: "<path>/<file-or-dir> — <what changes>" -->
- <!-- FILL IN: "<path>/<file-or-dir> — <what changes>" -->
-->

## Acceptance criteria

<!-- FILL IN: checklist of verifiable outcomes for THIS sub-slice's PR. When every box is checked, the sub-slice is ready to merge.

- [ ] <!-- FILL IN: concrete criterion -->
- [ ] <!-- FILL IN: verification command passes -->
- [ ] <!-- FILL IN: handoff.md (which is the PR body) is drafted and peer-reviewed -->
- [ ] <!-- FILL IN: follow-ups, if any, are logged in parent slice's plan -->
-->

## Open questions

<!-- FILL IN: unresolved questions. Must be resolved (moved to D-entries) before sub-slice close.

Example shape:
- <!-- FILL IN: "Q1 — <question>? Resolution expected by task N." -->
-->

## Risks

<!-- FILL IN: risks specific to this sub-slice. Parent-slice-wide risks stay in the parent spec.

Example shape:
- <!-- FILL IN: "Risk: <condition> — Impact: <what goes wrong> — Mitigation: <what we'll do>." -->
-->

## Amendments log

Append-only record of spec changes after this sub-slice begins. Date + what changed + why.

<!-- FILL IN: amendments as they land. Example shape:

### <YYYY-MM-DD> — <short title>

- **What changed:** <!-- FILL IN -->
- **Why:** <!-- FILL IN -->
- **Affected sections:** <!-- FILL IN -->
-->
