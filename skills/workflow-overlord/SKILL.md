---
name: workflow-overlord
description: Always-on orchestrator for workflow-overlord 2.0. Surfaces the active slice + mandatory toolbox reminder. Routes to /workflow-overlord-slice-{open,implement,close,status}.
---

# workflow-overlord (orchestrator)

You are in a project that uses **workflow-overlord 2.0**. The slice system exists because **chunked work prevents AI hallucination** — small tasks = quality code.

## At session start (always)

1. Call `mcp__overlord-bridge__get_active_slice`.
2. If a slice is returned: tell the user "you're working on slice `<title>` — status `<status>` on branch `<branch>`." Surface its Plan section briefly.
3. If no slice: tell the user "no active slice on this branch — run `/workflow-overlord-slice-open <SUMMARY>` to start one."

## Sub-commands

| Command | Use |
|---|---|
| `/workflow-overlord-slice-open <SUMMARY>` | Open a new slice (creates Notion page + worktree) |
| `/workflow-overlord-slice-implement` | Work the active slice's Plan tasks |
| `/workflow-overlord-slice-close` | Finalize: write Handoff, cascade Roadmap, open PR |
| `/workflow-overlord-status` | Read-only "where am I, what's next" |

Typing `/workflow-overlord` alone surfaces this menu.

## AI nudge contract (MANDATORY)

You MUST surface the toolbox at every optional juncture. **Same format every time. Never recommend; never personalize; never skip.**

> *Reminder: tools available — `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`, `superpowers:requesting-code-review`. Invoke any (or none) — your call.*

You MUST nudge:
- At slice-open before writing the initial Plan
- Between each task in slice-implement
- Before writing the Handoff at slice-close
- After verification

You MUST NOT recommend which fits, auto-invoke any skill, or skip the nudge because the user "is in flow."

## Where context lives

| | Location |
|---|---|
| Tool-managed Notion | Roadmap, Slices DB, Sessions DB (see `AGENTS.local.md` `notion:` block) |
| User-managed context | `Architecture` + `Business` parent pages — tool reads via Notion MCP `API-query-data-source` against index DBs |
| Global vocabulary | `vocabulary_page_id` (shared across all projects) |
| Session transcript | uploaded as Notion file attachment on Sessions row at session end |

## Retrieval priority (when looking up context)

1. `API-query-data-source` via Notion MCP — DB queries, structured, fast
2. `API-search` — title-match only (not semantic)
3. `notion-sql.ts` — SQL aggregations / MCP fallback
4. `API-retrieve-a-page` / `API-fetch` — full body, last resort

Notion AI semantic search / Q&A are UI-only (verified 2026-05-13 — no MCP / REST endpoint). Don't try to invoke them from here.

## Zero-drift invariant

Every piece of state lives in exactly ONE canonical location. `.codex/hooks/*.sh` are symlinks to `.claude/hooks/`. Single `skills/` dir, no mirror. AGENTS.md operational only — long-form context lives in Notion.
