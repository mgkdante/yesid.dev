# AI Memory Schema

Durable project memory read by Claude Code and Codex at session start. This
directory is the canonical "what the AI should remember between sessions"
store for this project. Both tools point here via `AGENTS.md`, load
`MEMORY.md` as a triage index, and fetch individual entries as relevance
warrants.

## Partition rule

Memory is split into four partitions by lifecycle and ownership. The first
three are checked into the repo; the fourth is local-only.

| Partition   | Purpose                                                  | Location           |
| ----------- | -------------------------------------------------------- | ------------------ |
| `project`   | Durable facts about THIS codebase (stack, conventions)   | Repo               |
| `feedback`  | Rules the user has given (do X, never Y, design picks)   | Repo               |
| `reference` | Pointers to external docs, libraries, known quirks       | Repo               |
| `user`      | Per-user personal preferences (cross-session, cross-repo) | Local-only (gitignored) |

## File naming

`<type>_<slug>.md` — e.g. `project_brand_colors.md`, `feedback_no_mocks.md`,
`reference_library_name.md`. Slugs are lowercase, underscore-separated,
short enough to read in a glance.

## Frontmatter

Each entry starts with YAML frontmatter:

```yaml
---
name: <human-readable title>
description: <one-line summary — what this memory contains>
type: project | feedback | reference | user
originSessionId: <optional — session id that produced this memory>
---
```

## Body structure

Freeform markdown below the frontmatter. Typical `feedback` and `project`
entries use two sections:

- **Why:** the rationale or incident that produced this rule/fact.
- **How to apply:** concrete guidance — what to do differently next time.

`reference` entries typically link to the external source, summarise
version-specific gotchas, and cite the date the pointer was last verified.

## Index — `MEMORY.md`

`MEMORY.md` in this directory maintains a one-line pointer per entry,
grouped by partition. Keep it under ~150 lines so both Claude Code and
Codex can cheaply triage which memories to fetch in full. When the index
drifts past that budget, consolidate: merge near-duplicates, prune stale
entries, promote recurring themes into a dedicated entry.

## How tools consume this

1. Both tools read `AGENTS.md` at session start.
2. `AGENTS.md` points at `docs/ai-memory/MEMORY.md`.
3. The tool loads `MEMORY.md` (cheap — one small file).
4. Based on the session's topic, the tool fetches individual `<type>_<slug>.md`
   entries in full as relevance warrants.

This layered read (index-then-entry) keeps session startup fast while still
giving agents access to the full detail when they need it.

## Consolidation cadence

Run a consolidation pass whenever `MEMORY.md` crosses ~150 lines OR once per
closed slice, whichever is first. A consolidation pass:

- Merges near-duplicate entries into a single canonical entry.
- Prunes entries that are no longer accurate (stack migrated, rule rescinded).
- Rewrites overlapping rules into tighter, unambiguous wording.
- Rolls per-slice status entries into one rolling index entry once the slice
  is shipped.

## Local override pattern (workflow v0.6.0 R4-1)

`AGENTS.md` and `CLAUDE.md` are tool-agnostic workflow contracts checked into the
repo. They MUST be fork-safe — anyone who clones/forks this repo gets a clean
template, not workspace-specific UUIDs.

The override pattern:

| File | Purpose | Tracked? |
| --- | --- | --- |
| `AGENTS.md` | Workflow contract with `<FILL IN>` placeholders | ✅ Committed |
| `AGENTS.local.md` | Real Notion UUIDs + per-machine overrides | ❌ Gitignored (`*.local.md`) |
| `CLAUDE.md` | Claude Code role bindings (model names, tool names) | ✅ Committed |
| `CLAUDE.local.md` | Optional per-machine Claude overrides (rare) | ❌ Gitignored |

**How tools resolve:** AI tools (Claude Code, Codex) at session start should
read both files and merge `*.local.md` over the base file for any overlapping
keys. If `*.local.md` is missing, prompt the operator to populate it OR fall
back to a per-tool fallback (env var, `op read` from a secrets manager, etc.).

**Origin:** workflow plugin slice-3 round-4 R4-1 (commit `a9a249b`,
2026-04-28). The `yesid.dev` repo originally committed real UUIDs in
`AGENTS.md` frontmatter; this was the same fork-safety hole the workflow
plugin's slice-3 fixed upstream.
