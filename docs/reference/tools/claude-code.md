# Claude Code overlay — [yesid.dev](http://yesid.dev)

> Tool-specific extensions for running the `AGENTS.md` workflow inside Claude Code. If a rule is tool-agnostic, it lives in `AGENTS.md` — not here.

## Role bindings (resolves AGENTS.md abstract roles)

This is the **single knob** for "how Claude Code runs this workflow". Swap a row when a better model or mechanism appears; nothing else needs to change.

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
| skill invocation                      | `Skill` tool (invokes a registered skill by name)        |

**Never Haiku.** Opus AND Sonnet are both valid — which one is selected depends on `AGENTS.md § Stage → role routing`.

## Live progress tracker → `TodoWrite`

The `TodoWrite` tool is Claude Code's live task-list tracker. It satisfies the "live progress tracker" mandate in `AGENTS.md § Session progress tracking`.

Every Implementation or Closing session with 2+ tasks must:

1. **Seed `TodoWrite` at session start** from the active sub-slice's `plan.md` — one entry per Level 3 task.
2. **Hold exactly one task `in_progress`** at a time.
3. **Mark completed immediately** when the task is committed (SHA exists) — never batch.
4. **Add tasks mid-session** when scope amendments or follow-ups emerge.
5. **End-of-session state is the resume point** — `CHECKPOINT.md` snapshots it durably.

The markdown STOP table in messages is the scrollback-readable mirror. Both persist the same story.

## Model routing (Claude-specific)

**Opus AND Sonnet are both valid. Never Haiku.**

### Parent model by slice size

| Slice stage                           | Parent model                            | Why                                                                                                     |
| ------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **L-slice Planning**                  | **Opus 4.7 `[1m]`**                     | Deep reasoning + room to hold whole-codebase context across Q&A                                         |
| **L-slice Implementation**            | **Opus 4.7** (200k)                     | Reasoning stays high; working set fits in 200k via `spec.md` / `plan.md`. Jump to `[1m]` only on overflow |
| **M-slice sessions**                  | **Sonnet 4.6** default                  | Most tasks are "execute a clear plan"; upgrade to Opus the moment a real design choice surfaces mid-session |
| **S-slice sessions**                  | **Sonnet 4.6**                          | Fix-it-and-move-on; no Opus tax                                                                         |
| **Closing sessions**                  | **Sonnet 4.6**                          | Finalizing handoff/PR body, low reasoning load                                                          |

### Subagent dispatch

**Sonnet 4.6 is the default** for research, exploration, file-reading, code-review sweeps, and any subagent task that produces a bounded summary. Opus only when the subagent itself needs deep reasoning (architecture analysis, novel debugging, complex refactor planning).

Pattern: `Agent` tool with `model: 'sonnet'` or `model: 'opus'` (or omit for inheritance).

**Why split:** Sonnet returns faster and costs ~3× less while delivering 90% of Opus quality on search/summarize/review and clear-plan-execution work. Opus earns its tax on real design + decision work. The `[1m]` variant earns its additional tax only when the working set genuinely won't fit in 200k.

**Decision rule when uncertain:** default Sonnet. Upgrade to Opus the moment you notice you're making a tradeoff that matters or holding >3 independent concerns in mind. Upgrade to `[1m]` only when 200k won't fit the working set.

**Reference:** cloud `workflow-knowledge/token-efficacy/04-subagent-delegation.md`.

## Session token budget — absolute numbers

Percentages live in `AGENTS.md`. Claude-specific absolute thresholds:

| Model         | Window    | 40%  | 65%  | 80%  |
| ------------- | --------- | ---- | ---- | ---- |
| Opus 4.7 `[1m]` | 1,000,000 | 400k | 650k | 800k |
| Opus 4.7      | 200,000   | 80k  | 130k | 160k |
| Sonnet 4.6    | 200,000   | 80k  | 130k | 160k |

Check with `/cost` or `/context-budget`.

At every STOP, surface a budget row:

```
Model: Opus 4.7 [1m] | Context: 142k / 1M (14%) — comfortable, continuing
```

or

```
Model: Sonnet 4.6 | Context: 145k / 200k (73%) — pre-break, finish the task then STOP for fresh session
```

**Model downgrade across sessions:** L-slice Planning → Implementation hop starts fresh — usually Opus 4.7 (200k), not `[1m]`. Re-read `spec.md` + `plan.md` + `CHECKPOINT.md`, skip everything else.

## Mid-session model switching

`/model <name>` switches the current session's model. Next turn re-processes context uncached (cache invalidation tax).

| Scenario                                                    | Preferred pattern                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Need a different model for a bounded, independent task      | **Subagent dispatch** (`Agent` with `model: sonnet` or `model: opus`) — parent cache stays warm, subagent isolated |
| Session turned out more complex than declared size          | `/model opus` for the design turns, `/model sonnet` back for execution — two switches, but each buys real value    |
| Session nearly full OR Planning → Implementation transition | **Fresh session.** Don't switch; restart with `spec.md` / `plan.md` / `CHECKPOINT.md` re-read                      |
| Just to "try Opus on this one question"                     | Don't. Subagent dispatch or next-session. Cache cost isn't worth it                                                |

**Rule of thumb:** one `/model` swap is fine. Two in a row = you should have started a fresh session.

## Claude Code config files

### `.claude/settings.json`

Project-scoped Claude Code settings. Committed to repo so it travels.

- `enabledMcpjsonServers` — list of MCP servers the project uses. **Must live in `.claude/settings.json`, NOT `.claude/settings.local.json`** (see Anthropic issue #24657).
- `permissions.allow` — pre-approved Bash / WebFetch / WebSearch patterns.
- `_expected_mcps_for_this_project` — human-readable list of the MCPs this project is designed around.

### `.mcp.json`

Tool-agnostic MCP server definitions format (readable by Claude Code; Codex also supports MCP via its own mechanism). Empty in most projects; add definitions if the project needs custom MCP servers beyond what plugins provide.

### Research corpus

- `<cloud>/workflow-knowledge/token-efficacy/` — cache economics, subagent delegation, MCP scoping, model routing research
- `<cloud>/workflow-knowledge/os-quirks/<os>.md` — cross-project platform command registry

## Slash commands (quick reference)

| Command             | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `/model <name>`     | Switch the session's model (costs cache invalidation) |
| `/cost`             | Show current session cost + context usage            |
| `/context-budget`   | Show context window usage vs model thresholds        |
| `/fast`             | Toggle fast mode on Opus 4.6 (faster output)         |

## When editing this file

If a rule is **tool-agnostic** (applies to Codex too), move it to `AGENTS.md`. This overlay should only hold Claude-Code-specific mechanisms.
