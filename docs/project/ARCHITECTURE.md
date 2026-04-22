# Architecture

Project-specific architecture: file structure, modules, data flow, integration boundaries.

> **Fill priority:** Medium. Start at first slice; flesh out as the codebase forms. The Iteration Protocol doesn't depend on this file (unlike `BINDINGS.md`), so partial fills are fine.

## Stack reference

See `STACK.md` for the tech stack table. This file describes how the stack is **organized** in this codebase.

## Top-level structure

```text
<!-- FILL IN: relevant top-level dirs + one-line purpose each.

Example for a TS/JS web project:

repo-root/
├── src/             — application code
│   ├── lib/         — shared utilities + components
│   ├── routes/      — pages / API endpoints
│   ├── server/      — server-side logic (if applicable)
│   └── styles/      — global styles
├── tests/           — test specs (or co-located if convention is to)
├── public/          — static assets
├── scripts/         — build + ops scripts
├── docs/            — workflow docs (this directory)
└── ... (deps + config files)

Example for a Python data pipeline:

repo-root/
├── src/
│   └── <pkg_name>/
│       ├── ingest/  — extraction modules
│       ├── transform/ — Silver-layer logic
│       ├── marts/   — Gold-layer logic
│       ├── cli.py   — entrypoints
│       └── settings.py — config + env handling
├── tests/
├── migrations/
├── config/
└── docs/
-->
```

## Modules / domains

> Add an entry per major module. Keep tight — link out for deep dives, don't inline.

### <!-- FILL IN: module name -->

- **Purpose:** <!-- FILL IN -->
- **Path:** <!-- FILL IN: path -->
- **Key files / entry points:** <!-- FILL IN -->
- **Depends on:** <!-- FILL IN: other modules -->
- **Consumed by:** <!-- FILL IN: other modules / external -->

### <!-- FILL IN: another module -->

<!-- Repeat structure -->

## Data flow

<!-- FILL IN: how data moves through the system. ASCII diagrams welcome.

Example for web app:

  Request → Route handler → Service layer → Data layer (DB / API) → Response
                                ↘ Cache (read-through)

Example for data pipeline:

  Source API → Bronze (raw) → Silver (normalized) → Gold (marts) → Dashboard

Example for CLI tool:

  argv → Command parser → Command implementation → Output formatter → stdout/stderr
-->

## Integration boundaries (the seams)

> Where the codebase meets the outside world. Each seam is a swap candidate (e.g., DB driver, auth provider, payment gateway). Documenting seams here helps future migrations be local edits, not codebase-wide refactors.

| Seam | What it abstracts | Concrete implementation today | Swap candidates |
|------|---------------------|-------------------------------|-----------------|
| <!-- FILL IN: e.g., "Data adapter" --> | <!-- e.g., "content source" --> | <!-- e.g., "static TS files via staticAdapter" --> | <!-- e.g., "Payload CMS, Sanity" --> |
| <!-- FILL IN --> | <!-- --> | <!-- --> | <!-- --> |

## Key abstractions

> Domain types / interfaces / contracts that other modules depend on. Different from § Modules (which is about **where** code lives) — this is about **what shape** key data + behavior takes.

### <!-- FILL IN: abstraction name -->

- **Where defined:** <!-- FILL IN: file path -->
- **Shape:** <!-- FILL IN: type signature / interface / class -->
- **Used by:** <!-- FILL IN -->
- **Why it exists:** <!-- FILL IN: what it solves -->

## Build + bundle

| Field | Value |
|-------|-------|
| Build entry | <!-- FILL IN: e.g., `src/index.ts` / `src/main.py` --> |
| Build output | <!-- FILL IN: e.g., `dist/` / `target/release/` --> |
| Bundle size budget (if applicable) | <!-- FILL IN: e.g., "<200KB initial" / "n/a" --> |
| Output format | <!-- FILL IN: e.g., "ESM + CJS" / "single binary" / "Docker image" --> |

## Notes / decisions

<!-- FILL IN: architectural decisions worth documenting (e.g., "chose hexagonal over MVC for X / Y / Z" or "no global state — context-passed everywhere"). Include rationale + tradeoffs. -->
