# CLAUDE.md — yesid.dev (Claude Code entry point)

> **Read [AGENTS.md](AGENTS.md) first.** Workflow contract lives there — tool-agnostic, shared with Codex.

## Project context

- **Project:** yesid.dev — freelance digital-infrastructure practice
- **Stack:** Bun · SvelteKit · Directus · Neon · Vercel · Railway · TypeScript
- **Workflow:** workflow-overlord 2.0 plugin (orchestrates Claude Code + Codex via Notion)

## Where context lives

Architecture / Business / Vocabulary / Slices / Sessions / Roadmap → Notion subtree per `AGENTS.local.md` frontmatter. Interactive Notion access uses the hosted MCP at `https://mcp.notion.com/mcp` (`notion-*` tools and Codex aliases) first; if that OAuth path fails, use direct REST. Hooks and automation always use direct REST. Repo stays lean — Notion is canonical for workflow content.

## Build commands

- `bun install` — install deps
- `bun run setup:hooks` — activate git pre-commit hook
- `bun test` — run tests
- `bun --cwd apps/web dev` — local dev server
- `op run --env-file=apps/cms/.env -- bun --cwd apps/cms run sync:diff` — Directus schema diff

## Workflow commands

- `/workflow-overlord` — orchestrator (always-on)
- `/workflow-overlord-slice-open <SUMMARY>` — start a slice
- `/workflow-overlord-slice-implement` — work the active slice
- `/workflow-overlord-slice-close` — finalize the active slice
- `/workflow-overlord-status` — read-only

The 5 mechanical guarantees fire automatically via the installed `workflow-overlord` plugin. Claude loads the plugin hooks directly; Codex uses the same repo hook wrappers through `.codex/hooks/*.sh` plus config-layer dispatchers. User decisions go through the SKILLs.

## Portability

This file can be deleted without breaking the workflow — Codex runs off `AGENTS.md` alone. CLAUDE.md exists only for Claude Code's auto-load convention.
