# Per-tool overlays

`AGENTS.md` (repo root) describes the workflow in tool-agnostic terms — roles, stages, session types, slice hierarchy. This directory contains **per-tool overlays** that bind those abstract roles to concrete mechanisms (model names, slash commands, tracker names, config locations).

## Why separate overlays

- **Tool-symmetry**: the workflow runs under Claude Code alone, Codex alone, or both. Each reads only its own overlay; the other's is simply unread.
- **One-line model swaps**: when a new model outclasses the current one for a role, edit that overlay's row — no touching `AGENTS.md`, no touching slice docs.
- **Portability**: clone this repo on any machine with either tool (or both) and the workflow runs end-to-end.

## Files in this directory

| File                                   | Role                                               |
|----------------------------------------|----------------------------------------------------|
| [`claude-code.md`](claude-code.md)     | Claude Code overlay — model + tool + command bindings |
| [`codex.md`](codex.md)                 | Codex overlay — same shape, Codex-specific bindings |

## How roles resolve

`AGENTS.md` names roles like "deeper-reasoning model", "faster/cheaper model", "live progress tracker". Each overlay has a table mapping those roles to:

- A concrete model ID (subject to change as models evolve)
- A concrete tool mechanism (e.g., `TodoWrite` for Claude's tracker, Codex's equivalent for Codex)
- A concrete slash command / CLI flag / config knob

When the workflow says "use the deeper-reasoning model for L-slice planning", the overlay for whichever tool is running resolves that to the actual model name.

## Adding a new tool

Copy `claude-code.md` as `<tool>.md`, fill in the bindings table, add the tool name to `AGENTS.md` § Portability guarantee. No other file changes.
