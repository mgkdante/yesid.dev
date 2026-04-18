# Tool overlays — yesid.dev workflow

This directory holds **per-tool bindings** that resolve the abstract roles defined in `../../../AGENTS.md`. Each overlay answers the question: *"When AGENTS.md says 'deeper-reasoning model', what does that mean for THIS tool?"*

## Files

- **`claude-code.md`** — Claude Code bindings (Opus / Sonnet / TodoWrite / Agent / slash commands)
- **`codex.md`** — OpenAI Codex bindings (stub; populate when adopting Codex for this project)

## How overlays work

`AGENTS.md` describes the workflow in abstract terms:

- **Stages** — L-slice Planning / L-slice Implementation / M-slice / S-slice / Closing / Subagent dispatch
- **Roles** — deeper-reasoning model / deeper-reasoning model (XL) / faster-cheaper model / live progress tracker / parallel-dispatch mechanism / mid-session model switch / context-budget check

Each overlay provides the **concrete mapping** for one tool:

```
AGENTS.md stage  →  AGENTS.md role  →  overlay binding  →  actual tool mechanism
```

### Worked example

- **Stage:** L-slice Planning
- **Role:** deeper-reasoning model (XL)
- **Claude Code binding (`claude-code.md`):** `Opus 4.7 [1m]`
- **Codex binding (`codex.md`):** *TBD — fill in when adopting Codex*

## Adding a new tool

1. Copy `claude-code.md` as `<tool>.md`.
2. Replace the Role bindings table with that tool's mechanisms.
3. Add the tool's config file location, slash commands (or equivalent), skill invocation style, MCP enablement.
4. Add the tool's entry to `AGENTS.md § Portability guarantee`.
5. If the tool auto-loads a specific root file (like `CLAUDE.md` for Claude Code), add that file as a thin pointer to `AGENTS.md`.

## Swap strategy

When a model outclasses the current binding for a role, edit **one row** in the relevant overlay. Sessions, rules, checklists, and scripts in `AGENTS.md` never change — that's the point of the abstraction.
