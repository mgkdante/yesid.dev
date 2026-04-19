# Codex overlay — [yesid.dev](http://yesid.dev)

> Tool-specific extensions for running the `AGENTS.md` workflow inside OpenAI Codex. If a rule is tool-agnostic, it lives in `AGENTS.md` — not here.

Codex auto-loads `AGENTS.md` at the repo root (tool-agnostic contract). This overlay binds the abstract roles to Codex mechanisms.

## Role bindings (resolves AGENTS.md abstract roles)

The table below is the **single knob** for "how Codex runs this workflow". Revisit whenever models or Codex capabilities change.

| AGENTS.md role              | Codex binding | Notes |
| --------------------------- | ------------- | ----- |
| deeper-reasoning model      | `gpt-5.4` (`reasoning=xhigh`) | Current repo default. Local Codex model metadata on this machine reports a 272k local window with a 95% effective budget (258k working budget). |
| deeper-reasoning model (XL) | No separately verified Codex-local XL binding yet | Use `gpt-5.4` as the largest currently verified Codex-local option. If a task truly needs more than the verified local budget, break the work up or switch tools instead of pretending parity exists. |
| faster/cheaper model        | `gpt-5.4-mini` (`reasoning=medium`) | Best fit for M/S execution, closing work, read-heavy subagents, and bounded research. |
| live progress tracker       | Native plan/task list via `update_plan` | Supports `pending` / `in_progress` / `completed` states directly. In the Codex app, the task sidebar also surfaces the agent's plan while a thread runs. |
| parallel-dispatch mechanism | Native subagents via `spawn_agent` / app multi-agent composer | Supports built-in `default` / `worker` / `explorer` agents, optional per-agent `model` + `reasoning_effort`, `fork_context` isolation, and custom agent files under `~/.codex/agents/` or `.codex/agents/`. |
| mid-session model switch    | CLI: `/model`; app-local current-thread equivalent not yet documented | In Codex CLI, `/model` switches the active model without restarting. In the desktop app, prefer a new thread or a subagent model override when you need a different model mid-stream. |
| context-budget check        | `/status` | Verified in the Codex app and CLI docs. Shows thread ID, context usage, and rate limits. CLI `/statusline` can also pin context stats in the footer. |
| tool config                 | `~/.codex/config.toml` + `.codex/` config layers + shared `~/.agents/` imports | Shared across the app, CLI, and IDE extension. Repo/user layers can add agents, hooks, rules, skills, MCP servers, plugins, and AGENTS overrides, while imported cross-agent skills can also live under `~/.agents/skills/`. |
| skill invocation            | Auto-inferred or explicit `$skill-name` | Codex loads skill metadata first, then full `SKILL.md` only when needed. Enabled skills also appear in the slash-command list. |

Swap a row when a newer model or mechanism wins.

## Session token budget — absolute numbers

Percentages live in `AGENTS.md` (40 / 65 / 80 % thresholds apply universally). For this workflow, use the **live local Codex model catalog** rather than the API model card, because the local app currently reports a smaller operational window on this machine.

| Model | Local window | Effective working budget | 40% | 65% | 80% |
| ----- | ------------ | ------------------------ | --- | --- | --- |
| `gpt-5.4` | 272k | 258k (95%) | 103k | 168k | 206k |

**Important note.** The API docs currently list GPT-5.4 with a larger raw context window, but `~/.codex/models_cache.json` on this Windows install currently reports `context_window = 272000` and `effective_context_window_percent = 95`. Use the local figure for session-break discipline until the local catalog changes.

## MCPs in Codex

**Codex supports MCPs natively.** The app, CLI, and IDE extension share MCP settings through `~/.codex/config.toml`, and the Codex app also exposes MCP controls in Settings → Integrations & MCP.

Verified configuration paths:

- App: Settings → Integrations & MCP
- CLI: `codex mcp add <name> --url <server>` and `codex mcp list`
- File: `[mcp_servers.*]` tables in `~/.codex/config.toml`

Current local config on this machine:

- Enabled: `svelte`, `neon`, `cloudflare-api`, `playwright`, `vercel`, `powerbi`
- Present but not explicitly enabled: `figma`
- Disabled: `yesid-money`

## Skills in Codex

**Codex supports skills natively.** Skills are available in the app, CLI, and IDE extension.

The `AGENTS.md` workflow **never depends on a specific skill existing** — skills are optional enhancements. If you're adopting a skill you've been using in Claude Code, look for one of:

- An exact port in Codex's skill catalog.
- An equivalent by a different name (same behavior, different branding).
- Replicate the behavior inline — skills are reusable prompt patterns; if the pattern is short, just follow it manually.

Verified skill details:

- Skills still use the same frontmatter shape we expected: `name` + `description` in `SKILL.md`
- Codex loads metadata first, then opens the full skill body only when it decides to use the skill
- Explicit invocation is supported with `$skill-name`
- Skills are the **authoring format**; plugins are the **installable distribution unit**
- Built-in/product skills live under `~/.codex/skills/`, while this machine also has a shared imported skill layer under `~/.agents/skills/`
- The Codex app can import external agent skills from Claude; the current Windows UI explicitly offers copying `~/.claude/skills` into `~/.agents/skills`

## Additional Codex-native capabilities

| Capability | Codex counterpart | Notes |
| ---------- | ----------------- | ----- |
| plugins | Native plugin system | Browse/install from the Codex app Plugins directory or from CLI `/plugins`. Invoke naturally after install or explicitly with `@plugin-name` / bundled skill names. Disable with `[plugins."name@marketplace"].enabled = false` in `config.toml`. The app also exposes an "Import external agent config" flow that can import enabled Claude plugins from `~/.claude/settings.json`. No Codex-native plugin bundle path is verified locally yet because this machine currently has no installed plugin packages on disk. |
| agents | Native file-based custom agents | Codex ships with built-in `default`, `worker`, and `explorer` agents. Custom agents live in `~/.codex/agents/*.toml` or `.codex/agents/*.toml` and can override model, reasoning effort, sandbox, MCP, and skills settings. |
| memories | Native cross-thread memory system | Off by default. Enable in app settings or with `[features] memories = true`. Memory files live under `~/.codex/memories/`, and `/memories` controls use/generation per thread. |
| hooks | Native lifecycle hooks | Hook files live in `~/.codex/hooks.json` or `<repo>/.codex/hooks.json` and require `[features].codex_hooks = true`. `SessionStart`, `PreToolUse`, `PostToolUse`, `Stop`, and `UserPromptSubmit` exist, but `PreToolUse` / `PostToolUse` are still Bash-centric and explicitly work-in-progress. |
| rules | Native `.rules` files, not markdown rule packs | Rules live under `rules/` config layers such as `~/.codex/rules/default.rules`. They use Starlark `prefix_rule()` entries with `allow` / `prompt` / `forbidden`, optional rationale, and inline examples. No Claude-style markdown rule library is currently verified in Codex. |
| external config import | Native migration bridge from other agent tools | The Codex app settings UI can import external agent config from Claude. On this machine, the UI offers copying Claude skills into `~/.agents/skills` and importing enabled Claude plugins from `~/.claude/settings.json`. |
| web capabilities | Native first-party web search + browser preview | Codex app local workflows use cached web search by default; full-access sandboxes can switch to live results. The in-app browser handles preview/comment loops for local servers and public pages that do not require sign-in. |
| fast mode / speed tier | Native fast tier | Fast mode is currently documented for GPT-5.4. CLI supports `/fast on`, `/fast off`, and `/fast status`; persistent config uses `service_tier = "fast"` plus `[features].fast_mode = true`. The Codex app supports Fast mode when signed in with ChatGPT. |

## Config extensions verified after the planning baseline

The planning session's minimal baseline (`model`, `model_reasoning_effort`, `[windows]`, `[mcp_servers.*]`, `[projects.*]`, `[apps.*]`) is still present in the live local config, but the current Codex config schema now also documents:

- `[features]` flags for `memories`, `multi_agent`, `codex_hooks`, `fast_mode`, and `apps`
- `[agents]` limits such as `max_threads` and `max_depth`
- `[plugins."name@marketplace"]` entries
- `service_tier = "fast"`
- `model_context_window`, `model_auto_compact_token_limit`, and other model metadata overrides
- `tools.web_search` settings and plugin/connector `tool_suggest` allowlists

## Research corpus

- `<cloud>/workflow-knowledge/` — cross-tool knowledge (renamed from `<cloud>/claude-knowledge/`)
- `<cloud>/workflow-knowledge/os-quirks/<os>.md` — platform command registry, tool-agnostic
- `<cloud>/workflow-knowledge/token-efficacy/` — research originally framed around Claude's cache semantics; many principles (cache prefix discipline, subagent delegation, MCP scoping) translate to any tool with prompt caching

## Verified commands and explicit invocation paths

| Command / syntax | Surface | Purpose | Verified |
| ---------------- | ------- | ------- | -------- |
| `/status` | app + CLI | Show thread ID, context usage, and rate limits | yes |
| `/plan-mode` | app | Toggle multi-step planning mode | yes |
| `/review` | app | Start review mode against local changes or a base branch | yes |
| `/mcp` | app | Open MCP status / connected servers | yes |
| `$skill-name` | app + CLI | Explicitly invoke a skill | yes |
| `/memories` | app + TUI | Control whether the current thread uses or generates memories | yes |
| `/model` | CLI | Switch the active model without restarting | yes |
| `/fast` | CLI | Toggle or inspect Fast mode | yes |
| `/plugins` | CLI | Open the plugin directory | yes |
| `@plugin-name` | app + CLI | Explicitly invoke an installed plugin or one of its bundled skills | yes |

## When editing this file

If a rule is **tool-agnostic** (applies to Claude Code too), move it to `AGENTS.md`. This overlay should only hold Codex-specific mechanisms.

---

**Remaining open questions**

- The on-disk plugin bundle/cache location is not documented in the public docs and cannot be verified locally until at least one plugin is installed on this machine.
- The Codex app command reference currently documents `/status`, `/mcp`, `/plan-mode`, and `/review`, but not an app-native `/model`; treat app-local model switching as not yet verified.
- If the local `models_cache.json` context window changes, update the budget table here and in any active slice checkpoint using the old 258k working-budget assumption.
