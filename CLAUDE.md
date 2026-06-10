# CLAUDE.md — yesid.dev (Claude Code entry point)

> **Read [AGENTS.md](AGENTS.md) first.** Workflow contract lives there — tool-agnostic, shared with Codex.

## Project context

- **Project:** yesid.dev — freelance digital-infrastructure practice
- **Stack:** Bun · SvelteKit · Directus · Neon · Vercel · Railway · TypeScript
- **Workflow:** workflow-overlord 3.x (installed plugin; orchestrates Claude Code + Codex via Notion)

## Where context lives

Architecture / Business / Vocabulary / Slices / Sessions / Roadmap → Notion subtree per `AGENTS.local.md` frontmatter. Interactive Notion access uses the hosted MCP at `https://mcp.notion.com/mcp` (`notion-*` tools and Codex aliases) first; if that OAuth path fails, use direct REST. Hooks and automation always use direct REST. Repo stays lean — Notion is canonical for workflow content.

## Build commands

- `bun install` — install deps
- `bun run setup:hooks` — activate git pre-commit hook
- `bun run test` — run tests via turbo. **Exception:** apps/web tests must run as `bunx vitest run` from `apps/web` (bare `bun test` uses Bun's native runner, skipping the Vitest happy-dom config → false "window is not defined" failures)
- `bun run dev` — local dev server (root script; cds into apps/web)
- `bun run cms:sync:diff:op` — Directus schema diff (1Password-injected)

> Bun 1.3.x gotcha: `bun --cwd <dir> run <script>` mis-parses (prints `bun run`
> help, exits 0). Use `bun run --cwd <dir> <script>` or cd into the package.

## Workflow commands

- `/workflow-overlord` — orchestrator (always-on)
- `/workflow-overlord-roadmap-open <SUMMARY>` — create a Roadmap row + child pages
- `/workflow-overlord-slice-open <SUMMARY>` — start a slice
- `/workflow-overlord-slice-pick` — attach a slice to the current session
- `/workflow-overlord-slice-unpick` — detach a slice from the current session
- `/workflow-overlord-slice-implement` — work the active slice
- `/workflow-overlord-slice-close` — finalize the active slice
- `/workflow-overlord-status` — read-only

The 5 mechanical guarantees fire automatically via the installed `workflow-overlord` plugin. Claude loads the plugin hooks directly; Codex uses the same repo hook wrappers through `.codex/hooks/*.sh` plus config-layer dispatchers. User decisions go through the SKILLs.

## Portability

This file can be deleted without breaking the workflow — Codex runs off `AGENTS.md` alone. CLAUDE.md exists only for Claude Code's auto-load convention.
