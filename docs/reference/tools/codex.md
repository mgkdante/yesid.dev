# Codex overlay — [yesid.dev](http://yesid.dev)

> Tool-specific extensions for running the `AGENTS.md` workflow inside OpenAI Codex. If a rule is tool-agnostic, it lives in `AGENTS.md` — not here.

Codex auto-loads `AGENTS.md` at the repo root (tool-agnostic contract). This overlay binds the abstract roles to Codex mechanisms.

## Role bindings (resolves AGENTS.md abstract roles)

**Status: needs population.** The table below is the **single knob** for "how Codex runs this workflow". When adopting Codex for this project, fill each TBD with the current best binding. Revisit whenever models or Codex capabilities change.

| AGENTS.md role                        | Codex binding                                            |
| ------------------------------------- | -------------------------------------------------------- |
| deeper-reasoning model                | **TBD** — e.g., GPT-5 (full) / o-series reasoning model  |
| deeper-reasoning model (XL)           | **TBD** — the largest-context GPT-5 variant              |
| faster/cheaper model                  | **TBD** — e.g., GPT-5-mini or equivalent                 |
| live progress tracker                 | **TBD** — Codex native task list OR inline markdown checklist in `log.md` |
| parallel-dispatch mechanism           | **TBD** — Codex subagent/worker pattern OR separate Codex sessions |
| mid-session model switch              | **TBD** — Codex command or config option                 |
| context-budget check                  | **TBD** — Codex command                                  |
| tool config                           | **TBD** — likely `.codex/` directory or similar          |
| skill invocation                      | **TBD** — Codex supports skills natively; name the invocation mechanism |

Swap a row when a newer model or mechanism wins.

## Session token budget — absolute numbers

Percentages live in `AGENTS.md` (40 / 65 / 80 % thresholds apply universally). Codex-specific absolute numbers per model — fill when verified:

| Model         | Window    | 40%  | 65%  | 80%  |
| ------------- | --------- | ---- | ---- | ---- |
| *(TBD)*       | *(TBD)*   |      |      |      |

## MCPs in Codex

**Codex supports MCPs natively.** `.mcp.json` at the repo root (tool-agnostic format) defines project-level MCP servers and is readable by Codex directly. The enablement mechanism (which servers are active in a given session) is Codex-specific — fill in when verified.

**Porting MCPs from Claude Code to Codex.** The list of MCPs this project is designed around lives in `.claude/settings.json` under `_expected_mcps_for_this_project`. For each, Codex typically has:

- A **direct equivalent** — standard MCPs (context7, chrome-devtools, playwright) are tool-agnostic and work in both tools.
- A **vendor plugin** with a Codex distribution — some platform MCPs ship for multiple tools.
- A **replacement** from Codex's own ecosystem — if the original was a Claude-Code-plugin-specific wrapper.

Candidates for this project (verify each in Codex):

- `svelte` — check Codex plugin catalog
- `context7` — standard MCP; should work
- `chrome-devtools` — standard MCP; should work
- `gsap-master` — verify distribution
- `vercel` — Vercel has multi-tool MCP support
- `github` — `gh` CLI is fully tool-agnostic; MCP optional
- `playwright` — standard MCP; should work

## Skills in Codex

**Codex supports skills natively** (its own skill ecosystem). Some skills are cross-tool; some are tool-specific.

The `AGENTS.md` workflow **never depends on a specific skill existing** — skills are optional enhancements. If you're adopting a skill you've been using in Claude Code, look for one of:

- An exact port in Codex's skill catalog.
- An equivalent by a different name (same behavior, different branding).
- Replicate the behavior inline — skills are reusable prompt patterns; if the pattern is short, just follow it manually.

## Research corpus

- `<cloud>/workflow-knowledge/` — cross-tool knowledge (renamed from `<cloud>/claude-knowledge/`)
- `<cloud>/workflow-knowledge/os-quirks/<os>.md` — platform command registry, tool-agnostic
- `<cloud>/workflow-knowledge/token-efficacy/` — research originally framed around Claude's cache semantics; many principles (cache prefix discipline, subagent delegation, MCP scoping) translate to any tool with prompt caching

## Slash commands (to verify)

| Command                | Purpose                                              | Verified? |
| ---------------------- | ---------------------------------------------------- | --------- |
| *(TBD)*                | Switch model                                         | ☐         |
| *(TBD)*                | Show context usage                                   | ☐         |
| *(TBD)*                | Show session cost                                    | ☐         |

## When editing this file

If a rule is **tool-agnostic** (applies to Claude Code too), move it to `AGENTS.md`. This overlay should only hold Codex-specific mechanisms.

---

**TODO checklist for filling this stub** (populate as Codex is adopted):

- [ ] Name Codex's default and deeper-reasoning models + context window sizes
- [ ] Identify Codex's equivalent of `TodoWrite` (or confirm fallback = inline markdown checklist in `log.md`)
- [ ] Identify Codex's parallel dispatch mechanism
- [ ] Identify Codex's slash-command set for model/context/cost
- [ ] Identify Codex's config file location + MCP enablement mechanism
- [ ] Verify each MCP in the project's expected list has a Codex path
- [ ] Add Codex-specific absolute context-budget thresholds
- [ ] Map which Claude-side skills have Codex equivalents
