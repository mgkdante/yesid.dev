# Codex overlay

Per-tool bindings for OpenAI Codex (desktop app + cloud). Resolves the abstract roles in `AGENTS.md` to concrete Codex mechanisms.

## Role bindings

| `AGENTS.md` role                | Codex binding                                                        |
|---------------------------------|----------------------------------------------------------------------|
| deeper-reasoning model          | <!-- FILL IN: e.g., gpt-5-codex-pro (high reasoning effort) -->      |
| deeper-reasoning model (XL)     | <!-- FILL IN: e.g., gpt-5-codex-pro with extended context -->        |
| faster/cheaper model            | <!-- FILL IN: e.g., gpt-5.3-codex-spark -->                          |
| live progress tracker           | <!-- FILL IN: Codex tracker plus STOP-message markdown table -->     |
| parallel-dispatch mechanism     | <!-- FILL IN: Codex parallel agents / rescue tasks -->               |
| mid-session model switch        | <!-- FILL IN: Codex model picker / CLI flag -->                      |
| context-budget check            | <!-- FILL IN: Codex context usage indicator -->                      |
| worktree create + switch        | Codex desktop: pick "Worktree" in thread-creation picker             |
| worktree cleanup                | Codex desktop: managed by "Worktrees" retention setting              |
| skill invocation                | `$<skill-name>` (e.g., `$workflow-overlord-add`) or slash in UI      |
| MCP config                      | Codex's plugin + MCP install via `codex plugin add`                  |

## Codex surfaces

Codex has three distinct surfaces. Workflow conventions per surface:

| Surface         | Worktree handling                                         | Notes                                                  |
|-----------------|-----------------------------------------------------------|--------------------------------------------------------|
| Desktop app     | First-class: pick "Worktree" when creating a thread      | Auto-prune per Worktrees setting — raise count if concurrent long-running slices |
| Cloud           | Sandbox isolation — no persistent worktree needed         | Each session = fresh sandbox + fresh clone             |
| CLI (terminal)  | Raw `git worktree add` (native flag `--worktree` pending) | See [openai/codex#12862](https://github.com/openai/codex/issues/12862) |

## Token budget — absolute thresholds

| Context usage | Token threshold (example — update for current model) |
|---------------|------------------------------------------------------|
| 40%           | <!-- FILL IN -->                                     |
| 65%           | <!-- FILL IN -->                                     |
| 80%           | <!-- FILL IN -->                                     |

## Plugin install (for the workflow plugin)

```
codex plugin marketplace add mgkdante/workflow-overlord
codex plugin add workflow-overlord
```

Then invoke `$workflow-overlord` to see the orchestrator's next-step recommendation.

## Cross-tool integration

The `workflow-overlord` plugin's `workflow-overlord-handoff` and `workflow-overlord-close-slice` skills coordinate Claude <-> Codex review via:

- **codex-plugin-cc** ([openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc)) installed alongside in Claude Code — exposes `/codex:review`, `/codex:adversarial-review`, `/codex:rescue` inside Claude. When Claude spawns Codex as a subprocess through this plugin, the worktree is inherited from the parent shell.
- **Reverse handoff branches** for Codex -> Claude direction (`handoff/<slice>-claude-review-request`).

Per D12 tool-ownership: whichever tool is assigned a task owns its response — never self-simulated.
