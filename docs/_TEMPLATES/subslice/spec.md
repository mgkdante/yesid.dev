# <slice-name>/<subslice-name> — Spec

> Sub-slice-level specification. Sub-slices are the **PR boundary** — each becomes its own pull request. For the parent slice spec, see `../spec.md`.

> **Spec is mostly immutable after approval.** Post-approval changes get logged in § Amendments at the bottom — never rewrite history.

<!-- FILL IN: replace `<slice-name>` and `<subslice-name>` in the title (e.g., `slice-auth/slice-auth-a`). -->

## Metadata

| Field             | Value                                                                                |
|-------------------|--------------------------------------------------------------------------------------|
| Status            | <!-- draft \| approved \| active \| closing \| shipped --> |
| Priority          | <!-- 1 \| 2 \| 3 (1 = highest) --> |
| Estimated effort  | <!-- N sessions (typically 1–2 for sub-slice) --> |
| Parent slice      | <!-- link to ../spec.md or "this slice is single-level" --> |
| Depends on        | <!-- earlier sub-slices / other slices required, or "none" --> |
| Unblocks          | <!-- later sub-slices / other slices this enables, or "none" --> |
| Size              | <!-- M (typical). L unusual at sub-slice level — if L, consider promoting to its own slice. --> |
| Sessions          | <!-- expected session count -->                                                       |
| Branch            | <!-- git branch name for this sub-slice's PR -->                                      |
| Worktree          | <!-- `.worktrees/<slice>-<letter>/` per D18 -->                                       |

## Goal

<!-- FILL IN: one paragraph stating what this sub-slice accomplishes. Phrase as outcome, not activity. Since sub-slices are PR-sized, the goal is narrower than the parent slice's goal — this sub-slice advances ONE coherent piece of the parent. -->

## Why this sub-slice

<!-- FILL IN: why this piece of the parent slice was carved out separately. Common reasons: "reviewable in isolation", "unblocks later sub-slices", "has independent verification", "smallest unit that ships value". 2–3 sentences. -->

## Pillars (multi-pillar sub-slices only)

<!-- FILL IN if the sub-slice delivers two or more distinct outcomes that share scope. Optional — most sub-slices have one pillar = the Goal above. Use when scope is genuinely multi-pillar (e.g., "performance + retention" or "schema + tooling").

### Pillar 1 — <name>

<one-paragraph outcome statement>

### Pillar 2 — <name>

<one-paragraph outcome statement>
-->

## Core principle

<!-- FILL IN: one principle that anchors this sub-slice. A short statement of *why this pattern matters* — e.g., "the workflow is part of the product", "data layer first, components second", "every test failure becomes a closing-checklist rule". The principle informs every design decision below. Skip this section if the sub-slice is mechanical / has no anchor principle. -->

## Durable outputs

<!-- FILL IN: enumerated artifacts this sub-slice ships, beyond the immediate code change. Includes:
- code modules / files (briefly named — full list in § File-touch summary)
- governance updates (rule entries, vocabulary additions, OS-quirk log)
- portable patterns (skill, learn doc, snapshot, template)
- migrations / schemas / seed data
- documentation deltas

Name the durable output, not the activity that produced it.

Example shape:
1. <Concept name> codified in `<path>`.
2. <Pattern name> — `<scaffold or template path>` for re-use.
3. <Tool / script> — `<path>` that automates <action>.
-->

## Reference sites / prior art

<!-- FILL IN: competitive scans, inspirational patterns, prior slices this builds on, external research. Keep tight — link out, don't inline.

Example shape:
- **Prior slice X** (`<cloud>/<project>/docs/archive/slices/slice-X/`) — established <pattern>; this sub-slice extends to <new>.
- **External reference Y** (URL) — <one-line takeaway>.
- **Research note Z** (`<cloud>/workflow-knowledge/<topic>/`) — <one-line takeaway>.
-->

## Context

<!-- FILL IN: state of the world this sub-slice operates in. Captures problem framing + relevant prior decisions + constraints that shaped the approach. This is where you explain WHY the design decisions below make sense.

Sub-sections to consider (only include relevant ones):

### Problem
<what's broken / missing / sub-optimal that this sub-slice addresses>

### Prior decisions still load-bearing
<from spec.md amendments / parent slice decisions / closed sub-slices>

### Constraints
<technical / political / time / cost constraints worth naming>

### What's intentionally NOT being addressed here
<short — full version in § Scope > Out of scope below>
-->

## Architecture

<!-- FILL IN: high-level approach. What gets added / changed / removed and how it connects to existing seams. Bulleted, concrete, paths-named.

Example shape:
- **No application code changes.** Behavior is identical before/after. (When true.)
- **Repo-side changes** (X, Y, Z) commit on the sub-slice branch, ship in one PR.
- **Out-of-repo changes** (config, cloud artifacts) happen on the operator's machine + are recorded in handoff + captured in a snapshot.
- **Measurement is the spine.** Baseline before, re-measure after. Delta is the acceptance metric.
-->

## Scope

> Explicit In/Out — prevents drift mid-execution. Reference this section in code review when something feels off-scope.

### In scope

- <!-- FILL IN: bullet list of what this sub-slice DOES. Be specific. -->
- <!-- FILL IN -->
- <!-- FILL IN -->

### Out of scope

- <!-- FILL IN: what this sub-slice EXPLICITLY does NOT do. Common reason: "defers to sub-slice <letter>" — making the sub-slice split visible. -->
- <!-- FILL IN: e.g., "Does not implement <feature Y> — that lands in sub-slice <letter>." -->
- <!-- FILL IN: e.g., "Does not change <subsystem Z>." -->

## Design decisions

> Sub-slice-scoped decisions. Parent-slice-scoped decisions stay in `../spec.md` — don't duplicate. Reference parent decisions as `parent D<N>` when needed. Each decision: title, what was chosen, alternatives considered, why this won, real tradeoff (if any).

### D1 — <decision title>

<!-- FILL IN: decision paragraph.

- **Chosen:** <approach>
- **Alternatives considered:** <list>
- **Why this won:** <rationale>
- **Tradeoff:** <what we give up>
- **Affects:** <which tasks / files / future sub-slices>

If this decision has parent-slice implications (e.g., changes how later sub-slices work), flag it here AND consider promoting to the parent spec. -->

### D2 — <decision title>

<!-- Same structure. -->

### D3 — <decision title>

<!-- Same structure. -->

## File-touch summary

> More specific than the parent spec — sub-slices are PR-sized; reviewers need precise scope. The plan.md § File structure has the per-task breakdown; this is the spec-level overview.

- **Created:** <!-- FILL IN: `path/to/file` — purpose -->
- **Modified:** <!-- FILL IN: `path/to/file` — what changes -->
- **Deleted:** <!-- FILL IN: `path/to/file` — why -->
- **Out-of-repo:** <!-- FILL IN: e.g., `<cloud>/<project>/docs/learn/<concept>.md` — created -->

## Acceptance criteria

> Checklist of verifiable outcomes. When every box is checked, the sub-slice is ready for `/workflow-close-slice`. Use specific, runnable criteria — not aspirational.

- [ ] <!-- FILL IN: concrete criterion (e.g., "All N migrations apply on prod with zero errors") -->
- [ ] <!-- FILL IN: verification command passes (e.g., "`bun run test` — N tests, 0 failures") -->
- [ ] <!-- FILL IN: lint / typecheck clean -->
- [ ] <!-- FILL IN: integration / E2E check that proves the sub-slice goal end-to-end -->
- [ ] <!-- FILL IN: handoff.md (which IS the PR body) is drafted, all per-task sections appended -->
- [ ] <!-- FILL IN: governance docs updated per AGENTS.md § Slice Closing checklist (if applicable) -->
- [ ] <!-- FILL IN: peer review (cross-tool adversarial) clean OR all BLOCKER/HIGH findings addressed -->
- [ ] <!-- FILL IN: follow-ups, if any, logged in parent slice's plan -->

## Open questions

> Unresolved questions. Must be resolved (moved to D-entries above OR explicitly deferred) before sub-slice close.

- **Q1.** <!-- FILL IN: question? Resolution expected by task <N>. -->
- **Q2.** <!-- FILL IN -->

## Risks

> Risks specific to this sub-slice. Parent-slice-wide risks stay in the parent spec. Each risk: condition + impact + mitigation.

- **R1.** <!-- FILL IN: condition — Impact: <what goes wrong> — Mitigation: <what we'll do> -->
- **R2.** <!-- FILL IN -->

## Free-tier / cost / quota considerations

<!-- FILL IN if the sub-slice touches a paid service or quota-bound resource (DB, Blob, MCP, API rate limits). Track running totals here so close-time can compare against budget. Skip if N/A. -->

## Amendments log

> Append-only record of spec changes after approval. Date + what changed + why. Spec stays mostly immutable; amendments accumulate here.

| Date | Change | Why | Affected sections |
|------|--------|-----|-------------------|
| <!-- YYYY-MM-DD --> | <!-- FILL IN --> | <!-- FILL IN --> | <!-- e.g., "D2, Acceptance criteria" --> |
