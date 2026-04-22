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
