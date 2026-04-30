---
# Fork-safe placeholders — real UUIDs live in AGENTS.local.md (gitignored).
# Per workflow v0.6.0 R4-1 fork-safety pattern (commit a9a249b).
notion:
  root_page_id: "<FILL IN>"
  workspace_url: "https://www.notion.so/"
  databases:
    slices:
      database_id: "<FILL IN>"
      data_source_id: "<FILL IN>"
    sessions:
      database_id: "<FILL IN>"
      data_source_id: "<FILL IN>"
    conversations:
      database_id: "<FILL IN>"
      data_source_id: "<FILL IN>"
---

<!--
Setup for fork-safe Notion linkage:

1. Create `AGENTS.local.md` (gitignored) at the repo root.
2. Copy the `notion:` block above into AGENTS.local.md's frontmatter.
3. Replace each `<FILL IN>` with the real UUID from your Notion workspace.
4. AI tools (Claude Code, Codex) merge AGENTS.local.md over AGENTS.md at session start.

Specs do not have a dedicated DB. Slice artifacts live as child pages under the
Slice row: `-spec`, `-plan`, `-handoff`, and `-research`.
-->


# AGENTS.md — yesid.dev

> Notion-canonical project. All workflow content lives in Notion at `Projects/yesid.dev/`. Plugin canonical docs live under `Projects/mgkdante/workflow-overlord/`. Flat shape - no Public-safe/Private split.

## Tool role bindings

See CLAUDE.md for Claude Code role bindings table.

## Where things live

- Workflow discipline -> Notion `Projects/mgkdante/workflow-overlord/WORKFLOW`
- Project bindings (this project's specifics) -> Notion `Projects/yesid.dev/Project/BINDINGS`
- Brand -> Notion `Projects/yesid.dev/Brand`
- Slices, slice child artifacts (`-spec`, `-plan`, `-handoff`, `-research`), Sessions, Conversations -> databases/pages (UUIDs in frontmatter above)
- Memory -> Notion `Projects/yesid.dev/Memory`; auto-pulled to local at session start (SessionStart hook)
- Conversations -> auto-pushed at session end (Stop hook)

## Runtime

**Bun only. Never npm/npx/node.** Lockfile: `bun.lockb`.

After `bun install`, run `bun run setup:hooks` once to activate the pre-commit hook (`.githooks/pre-commit`) that blocks edits to generated token files unless `packages/tokens/tokens.json` is also staged.

## Secrets and 1Password

All new API keys, tokens, passwords, service-account tokens, and client credentials go into 1Password before they are used in this repo.

- yesid.dev secrets live in the `yesid-dev` vault unless there is a stronger reason to split them.
- Client-project secrets live in a client-scoped vault, not in `yesid-dev`.
- Local real references live in `.env` at the repo root. `.env` is gitignored.
- The committed `.env.example` documents required variable names with placeholder `op://` references only.
- Prefer copied 1Password secret references using vault/item IDs when possible.
- Long-lived commands use `op run --env-file=.env -- <command>` so secrets resolve once for that process.
- Repeated local ops can use `op inject -i .env -o apps/web/.env.local` or `apps/cms/.env.local`, then Bun's `--env-file` scripts, to avoid repeated 1Password calls.
- Do not write loops that call `op item get`, `op read`, or `op inject` per request, per file, or per test. Resolve once at process start.
- If a service account is used, check usage with `bun run secrets:ratelimit` before blaming the tool or brute-forcing another run.

## Output destinations (Notion-canonical)

**The plugin is Notion-canonical (post-2026-04-27, plugin v0.4.0+ / D21).** When AI tools (Claude Code, Codex) generate workflow artifacts during a session - specs, plans, handoffs, research, brainstorm output, session logs - those artifacts MUST land in Notion, not remain loose in the repo. The repo's `docs/` directory holds project-local support material only: `docs/ai-memory/`, `docs/reference/`, and explicit research-routing source files at `docs/research/<slice-id>-*.md` or `docs/slices/<slice-id>/research.md`. Every other workflow documentation surface lives in Notion.

This rule overrides any third-party plugin's default file-output behavior (e.g., `superpowers:brainstorming`, `superpowers:writing-spec`, `superpowers:writing-plans` historically save to `docs/superpowers/specs/<date>-<name>.md` and `docs/superpowers/plans/<date>-<name>.md`). Under this workflow contract those defaults are superseded - see the table below for canonical destinations.

### Where each artifact goes

| Artifact | Slice-context destination | Free-form (non-slice) destination |
|---|---|---|
| **Brainstorm output** (chat-driven option exploration) | Ephemeral; resolves into the slice's `*-spec` page when planning completes. | Ephemeral; resolves into the Sessions DB row body. |
| **Spec** (design decisions, scope, acceptance criteria) | Slice row child page: `<slice-id>-spec`. | Sessions DB row body OR a `Spec` child page under the Sessions row, if the work justifies a real spec. |
| **Plan** (task breakdown, sequencing) | Slice row child page: `<slice-id>-plan`. | Sessions DB row body, or a `Plan` child page under the Sessions row. |
| **Handoff** (PR body draft, peer-review notes, deferred risks) | Slice row child page: `<slice-id>-handoff`. | N/A - non-slice work doesn't usually have a PR boundary. If it does, write to the Sessions row's body. |
| **Research** (slice-local source/provenance) | Slice row child page: `<slice-id>-research`, routed from `docs/research/<slice-id>-*.md` or `docs/slices/<slice-id>/research.md` via `/workflow-overlord-capture-research`. | N/A unless the Sessions row explicitly owns the research note. |
| **Mid-slice handoff** (`/workflow-overlord-handoff --action --for <topic>`) | A `<slice-id>-handoff-<topic>` child page under the Slice row. | N/A - handoffs require a slice. |
| **Session log** (cross-tool continuity narrative) | Sessions DB row (one per wall-clock session). The row's `Slices touched` relation links it to the active slice(s). | Sessions DB row with no `Slices touched` relation. |

### Override rule for third-party plugins

When a third-party plugin (`superpowers`, others) wants to write to a `docs/<plugin-name>/` path during this workflow's session, the AI tool MUST:

1. **Fetch** the artifact's intended content (per the plugin's normal flow).
2. **Write** the content to the Notion destination from the table above (prefer `/workflow-overlord-capture <spec|plan|handoff>` or `/workflow-overlord-capture-research`; otherwise use the Notion four-primitive wrapper), NOT to the suggested file path.
3. **Surface** the resolved Notion URL to the operator instead of the file path.

The repo's `docs/` should only contain `ai-memory/`, `reference/`, and research-routing sources post-Phase-1. If the AI tool detects any other workflow artifact under `docs/`, that's drift - flag it to the operator and move the content to Notion. Research files matching `docs/research/<slice-id>-*.md` or `docs/slices/<slice-id>/research.md` are allowed local source/provenance, but their canonical destination is still the slice's `*-research` page.

### Sessions DB row authoring (free-form)

For free-form sessions where there's no active slice, the AI tool creates the Sessions DB row at session start:
- `Name`: `<YYYY-MM-DD HH:MM> — <one-line topic>`
- `Date`: today
- `Project`: this project's name (from AGENTS.md frontmatter or operator)
- `Slices touched`: empty (or relation to a `chore` rollup slice if the project maintains one)
- `Brief summary`: filled at session end

Row body holds the session's narrative. If the session generates a real spec / plan / brainstorm artifact, those go in the body or as child pages under the Sessions row (per the table above).
