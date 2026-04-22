# <project-name> — Architecture

> **Project-level architecture index.** High-level overview + pointers to detailed reference docs under `docs/reference/`. NOT a deep-dive — deep dives live in the reference docs this page links to.

<!-- FILL IN: project name in the title above. -->

## System overview

<!-- FILL IN: one paragraph describing the system's shape. What are the major pieces? What flows between them? Where does input enter and where does output leave? Aim for a description a new contributor can absorb in under a minute — avoid vocabulary that requires its own definition inline. -->

## Key components

<!-- FILL IN: table of the system's major components. A "component" is a unit of responsibility (a service, a module, a pipeline stage, a workspace, a document collection, etc.) — whatever is the natural unit in your domain. One row per component. Link each to its code or doc location. Keep purposes one line. -->

| Name              | Purpose                                               | Location                       |
| ----------------- | ----------------------------------------------------- | ------------------------------ |
| <!-- FILL IN --> | <!-- FILL IN: one-line responsibility -->             | <!-- FILL IN: path or URL --> |
| <!-- FILL IN --> | <!-- FILL IN -->                                      | <!-- FILL IN -->              |
| <!-- FILL IN --> | <!-- FILL IN -->                                      | <!-- FILL IN -->              |

## External dependencies

<!-- FILL IN: every external service, API, or data source the project depends on at runtime. Secret-name column must match the identifier used in `.env.example` / password-manager store. Notes column holds "free-tier OK", "rate-limited at X", "auth via OAuth2", etc. -->

| Service           | Purpose                                                | Secret name in password manager | Notes                         |
| ----------------- | ------------------------------------------------------ | ------------------------------- | ----------------------------- |
| <!-- FILL IN --> | <!-- FILL IN: what this project uses the service for --> | <!-- FILL IN -->               | <!-- FILL IN -->             |
| <!-- FILL IN --> | <!-- FILL IN -->                                       | <!-- FILL IN -->               | <!-- FILL IN -->             |

## Architectural decisions

Non-trivial architectural decisions are captured at slice scope in each slice's spec file: `docs/slices/<slice>/spec.md`, under the "Design decisions (D1...)" section. This file does **not** duplicate them — fetch the relevant slice spec when the decision's context matters.

For a rolling index of which slice introduced which decision, see `docs/ai-memory/MEMORY.md` (the `project_` memory entries often index the biggest decisions across slices).

## Reference docs

Detailed reference material lives under `docs/reference/`. Add a row to this table whenever you author a new reference doc — that way this page stays the authoritative index.

| Reference doc                                | One-line purpose                                          |
| -------------------------------------------- | --------------------------------------------------------- |
| <!-- FILL IN: path under docs/reference/ --> | <!-- FILL IN: what this reference covers -->              |
| <!-- FILL IN -->                             | <!-- FILL IN -->                                          |

<!-- Common reference docs projects accumulate (add as you author them):
- secrets-inventory.md — every secret this project reads and where it comes from
- glossary.md — shared vocabulary (project terms, workflow terms, tool terms)
- tools/<tool>.md — per-AI-tool overlay (e.g., claude-code.md, codex.md)
- <domain>-patterns.md — recurring patterns in this project's domain
-->

## How to edit this file

- **Adding a new component** → add a row to "Key components" + link to its code or detailed reference doc.
- **Adding a new external dependency** → add a row to "External dependencies" + add the secret entry to `.env.example` + file a secret in the password manager.
- **Deep-dive architectural content** → author a new doc under `docs/reference/` and add a row to "Reference docs". Do NOT inline the deep-dive here.
- **Architectural decisions** → capture in the relevant slice's `spec.md`. Don't recapitulate here.

## Related docs

- [docs/plan.md](plan.md) — project-level master plan (strategic themes, slice sequencing).
- [docs/ai-memory/MEMORY.md](ai-memory/MEMORY.md) — rolling index of project memory; often the fastest way to find the slice that introduced a given component or decision.
- `../AGENTS.md` — tool-agnostic workflow contract (read at session start by both AI tools). Contains the governance invariants previously split into a separate CONSTITUTION.md.
- `../CLAUDE.md` — thin Claude Code overlay (role bindings). Safe to delete if not using Claude Code.
