# CLAUDE.md — Claude Code entry point for yesid.dev-cms

> **Scorched.** Payload 3.x removed in [slice-18 Task 1](https://github.com/mgkdante/yesid.dev/tree/main/docs/slices/slice-18). Directus install lands in Task 3. Until then there is no backend running here.
>
> **Read [AGENTS.md](AGENTS.md) first.** The workflow contract is there — tool-agnostic, shared with Codex. This file is a thin pointer + Claude Code role bindings, mirroring [yesid.dev/CLAUDE.md](https://github.com/mgkdante/yesid.dev/blob/main/CLAUDE.md).

## Claude Code role bindings (resolves AGENTS.md abstract roles)

| AGENTS.md role                        | Claude Code binding                                      |
| ------------------------------------- | -------------------------------------------------------- |
| deeper-reasoning model                | **Opus 4.7** (200k)                                      |
| deeper-reasoning model (XL)           | **Opus 4.7 `[1m]`** (1M context)                         |
| faster/cheaper model                  | **Sonnet 4.6**                                           |
| live progress tracker                 | `TodoWrite` tool                                         |
| parallel-dispatch mechanism           | `Agent` tool with `model: 'sonnet'` or `model: 'opus'`   |
| mid-session model switch              | `/model <name>` slash command                            |
| context-budget check                  | `/cost` or `/context-budget` slash commands              |

**Never Haiku.** Bindings mirror [yesid.dev/CLAUDE.md](https://github.com/mgkdante/yesid.dev/blob/main/CLAUDE.md) — no CMS-specific overrides.

## MCP servers

None — the `/api/mcp` endpoint was a Payload plugin surface and was scorched in Task 1. Directus has its own MCP story (or none) which Task 2 research will resolve.

## Portability

This file can be deleted without breaking the workflow — Codex runs off `AGENTS.md` alone.
