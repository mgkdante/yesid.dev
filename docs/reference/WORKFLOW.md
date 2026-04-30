# Workflow Reference

This project uses the `workflow-overlord` plugin in its Notion-canonical shape. Treat this file as the local operating summary only. Canonical slice state lives in Notion under `Projects/yesid.dev/`.

## Current Contract

Workflow artifacts are not local bundle files. For every slice row in Notion, the child artifact pages are:

| Artifact | Canonical destination |
|---|---|
| Spec | `<slice-id>-spec` child page |
| Plan | `<slice-id>-plan` child page |
| Handoff | `<slice-id>-handoff` child page |
| Research | `<slice-id>-research` child page |
| Session log | Sessions DB row, related to the touched slice when applicable |

The local repo may keep only:

- `docs/ai-memory/` for durable AI memory support.
- `docs/reference/` for this project's local tool/reference notes.
- `docs/research/<slice-id>-*.md` as routable research source files.
- `docs/slices/<slice-id>/research.md` as a routable slice-local research source file.

Any other workflow artifact under `docs/` is drift. Move it to Notion with `/workflow-overlord-capture` or `/workflow-overlord-capture-research`.

## Pipeline

Every large slice still follows the same discipline:

```text
Idea
  -> Research
  -> Brainstorm
  -> Spec
  -> Plan
  -> Implementation
  -> Verification
  -> PR and merge
  -> Closing
```

The difference from the old local-bundle workflow is destination, not discipline. Spec, plan, handoff, research, and session continuity are Notion-first.

## Context Model

Read the cheapest current source first:

| Tier | Source | Use |
|---|---|---|
| 1 | `AGENTS.md`, `CLAUDE.md`, `docs/reference/**`, `docs/ai-memory/**` | Always-on local rules and memory |
| 2 | Notion Slice row, child Spec/Plan/Handoff/Research pages, latest Session row | Active workflow state |
| 3 | Older Conversations rows, git history, archived external docs | Audit and recovery only |

Do not scan old transcripts or long historical docs to answer state questions that live in Slice or Session properties.

## Slice Shape

| Level | Example | Canonical shape | PR boundary |
|---|---|---|---|
| L1 slice | `slice-18` | Slices DB row with child artifacts | Only for single-level slices |
| L2 sub-slice | `slice-18i` | Slices DB row related to parent slice, with child artifacts | Yes |
| L3 task | `slice-18i.ii` | Tracker entry unless explicitly elaborated | No |

Tasks do not get default files. They live in the live tracker and in the Session/Handoff narrative.

## Research Routing

Research is a first-class slice artifact. Local research files are allowed only as source/provenance until they are captured:

```text
docs/research/<slice-id>-*.md
docs/slices/<slice-id>/research.md
```

Route them with:

```bash
/workflow-overlord-capture-research "docs/research/<slice-id>-*.md"
/workflow-overlord-capture-research "docs/slices/<slice-id>/research.md"
```

The destination is the slice's `<slice-id>-research` child page in Notion. Do not manually recover research into loose prose when the routing command can do it.

## Session Start

1. Declare session type: Planning, Implementation, Closing, or Non-slice.
2. Verify branch/worktree state.
3. Read the Slice row properties.
4. Read the latest relevant Session row.
5. Read Plan and Handoff; read Spec when acceptance is unclear; read Research only when it affects the task.
6. Populate the live tracker from the Plan page.
7. State the goal, verification commands, and context budget row.

## Session End

1. Update the live tracker.
2. Append/update the Sessions DB row summary and next step.
3. Append per-task or closeout notes to the Handoff page.
4. Route any matching research files.
5. Run verification.
6. Commit and push on the slice branch.
7. State the next resume point.

There is no `devlog.md` resume point anymore. The Sessions DB row is the resume index.

## Session Types

| Type | Work | Canonical artifacts |
|---|---|---|
| Planning | Research, brainstorm, spec, plan | Spec/Plan/Research child pages plus Session row |
| Implementation | One or more tracker tasks | Code, tests, Session row, Handoff entries |
| Closing | Final handoff, review, PR, merge | Handoff page, PR body, closed Slice row |
| Non-slice | Bugfix/config/exploration | Session row; child pages only if the work justifies them |

## Iteration Protocol

Implement one tracker task at a time:

1. Read the task and affected files.
2. Implement the narrowest change.
3. Run verification.
4. Pre-flight UI/output shape when applicable.
5. STOP with what changed, what to verify, decisions, and budget row.
6. Update tracker and handoff/session notes.
7. Wait for owner approval before the next task.

No batching. No vague "should work." The owner verifies.

## Commands

Use the rebranded workflow-overlord commands:

```bash
/workflow-overlord
/workflow-overlord-slice-open
/workflow-overlord-slice-implement
/workflow-overlord-capture
/workflow-overlord-capture-research
/workflow-overlord-handoff
/workflow-overlord-close-slice
/workflow-overlord-pull
```

Old `workflow-*` command names and local `docs/slices/.../{spec,plan,handoff,devlog}.md` bundle guidance are historical only. Do not create new local slice bundles.
