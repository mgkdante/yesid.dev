# CLAUDE.md — Claude Code entry point for yesid.dev-cms

> **Read [AGENTS.md](AGENTS.md) first.** The workflow contract is there — tool-agnostic, shared with Codex. This file is a thin pointer + Claude Code role bindings, mirroring the pattern in [yesid.dev/CLAUDE.md](https://github.com/mgkdante/yesid.dev/blob/main/CLAUDE.md).

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
| tool config                           | `.claude/settings.json` + `.mcp.json` (when added)       |

**Never Haiku.** Opus AND Sonnet are both valid — AGENTS.md § Stage → role routing picks which role; this table picks which Claude model implements the role. Bindings mirror [`yesid.dev/CLAUDE.md`](https://github.com/mgkdante/yesid.dev/blob/main/CLAUDE.md) exactly — no CMS-specific overrides at 18a.

## MCP servers (Claude Code)

The two yesid.dev CMS MCP endpoints are typically registered at user-scope (not committed to this repo):

```bash
# Local dev (against your running bun dev on localhost:3000)
claude mcp add --transport http yesid-cms-local http://localhost:3000/api/mcp \
  --header "Authorization: Bearer <LOCAL-MCP-KEY>"

# Production (https://cms.yesid.dev)
claude mcp add --transport http yesid-cms-prod https://cms.yesid.dev/api/mcp \
  --header "Authorization: Bearer <PROD-MCP-KEY>"
```

Keys are generated per-user from the admin UI (Users → API Keys). Store in a password manager. Never commit.

## Portability

This file can be deleted without breaking the workflow — Codex runs off `AGENTS.md` + `docs/reference/tools/codex.md` alone (once those per-tool overlays exist in this repo; currently they live in the sibling `yesid.dev` repo).
