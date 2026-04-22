# Claude Code overlay

Per-tool bindings for Claude Code. Resolves the abstract roles in `AGENTS.md` to concrete Claude Code mechanisms. Swap a model or mechanism = edit one row here; `AGENTS.md` and all slice docs stay untouched.

## Role bindings

| `AGENTS.md` role                | Claude Code binding                                          |
|---------------------------------|--------------------------------------------------------------|
| deeper-reasoning model          | <!-- FILL IN: e.g., Opus 4.7 (200k context) -->              |
| deeper-reasoning model (XL)     | <!-- FILL IN: e.g., Opus 4.7 [1m] (1M context) -->           |
| faster/cheaper model            | <!-- FILL IN: e.g., Sonnet 4.6 -->                           |
| live progress tracker           | `TodoWrite` tool                                             |
| parallel-dispatch mechanism     | `Agent` tool with `subagent_type: <agent-name>`              |
| mid-session model switch        | `/model <name>` slash command                                |
| context-budget check            | `/cost` or `/context-budget` slash command                   |
| worktree create + switch        | `EnterWorktree(name: "<slice>")` tool                        |
| worktree cleanup                | `ExitWorktree(action: "remove")` tool                        |
| skill invocation                | `/skill <name>` slash command                                |
| MCP config                      | `.mcp.json` at repo root + `.claude/settings.json`           |

**Never** use a smaller / cheaper model than what's listed unless the task is explicitly clerical. Model-routing decisions are recorded in slice `spec.md` where applicable.

## Token budget — absolute thresholds

| Context usage | Token threshold (example — update for current model) |
|---------------|------------------------------------------------------|
| 40%           | <!-- FILL IN -->                                     |
| 65%           | <!-- FILL IN -->                                     |
| 80%           | <!-- FILL IN -->                                     |

Check current usage with `/cost` or `/context-budget`.

## Tool config locations

- Project: `.claude/settings.json`
- Subagents: `.claude/agents/<agent>.md`
- Skills: `.claude/skills/<skill>.md` or via installed plugins
- Hooks: `.claude/settings.json` → `hooks`
- MCP servers: `.mcp.json` at repo root (tool-agnostic format)
- Worktrees: managed under `.claude/worktrees/` by `EnterWorktree`

## Plugin install (for the workflow plugin)

```
/plugin marketplace add mgkdante/workflow
/plugin install workflow@mgkdante/workflow
```

Then invoke `/workflow` to see the orchestrator's next-step recommendation.

## Notes

- Claude Code's `EnterWorktree` is the preferred way to open a slice worktree — it creates the worktree AND switches the session atomically. Raw `git worktree add` leaves the session pointing at the main checkout even when Bash cwd moves.
- `/workflow-close-slice` uses `ExitWorktree(action: "remove")` for Claude-native worktree cleanup.
