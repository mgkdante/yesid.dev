# CLAUDE.md — Claude Code entry point for [yesid.dev](http://yesid.dev)

> **Read [AGENTS.md](AGENTS.md) first.** The workflow contract is there — tool-agnostic, shared with Codex. This file is a thin pointer + Claude Code role bindings.

## Claude Code role bindings (resolves AGENTS.md abstract roles)

See `docs/reference/tools/claude-code.md` for full detail. Swapping a binding (e.g., newer model wins) = edit one row.

| AGENTS.md role                        | Claude Code binding                                      |
| ------------------------------------- | -------------------------------------------------------- |
| deeper-reasoning model                | **Opus 4.7** (200k)                                      |
| deeper-reasoning model (XL)           | **Opus 4.7 `[1m]`** (1M context)                         |
| faster/cheaper model                  | **Sonnet 4.6**                                           |
| live progress tracker                 | `TodoWrite` tool                                         |
| parallel-dispatch mechanism           | `Agent` tool with `model: 'sonnet'` or `model: 'opus'`   |
| mid-session model switch              | `/model <name>` slash command                            |
| context-budget check                  | `/cost` or `/context-budget` slash commands              |
| tool config                           | `.claude/settings.json` + `.mcp.json` at repo root       |

**Never Haiku.** Opus AND Sonnet are both valid — AGENTS.md § Stage → role routing picks which role; this table picks which Claude model implements the role.

## How to edit this file

Tool-agnostic rules → `AGENTS.md`. Claude-specific detail → `docs/reference/tools/claude-code.md`. This file stays thin (just the bindings table + pointers).

## Portability note

This file can be deleted without breaking the workflow — Codex runs off `AGENTS.md` + `docs/reference/tools/codex.md` alone. It exists only for Claude Code's native auto-load convention.
