# yesid. Pipeline

**Digital infrastructure that moves.**

## What This Is

The repo for yesid., a freelance SQL and digital infrastructure brand. Portfolio, tooling, and workflow systems.

## How It Works

All work happens in **Claude Code** — planning, specs, building, logging, reviews, handoffs.

Claude Code follows `CLAUDE.md`. Every piece of work has a slice spec, a dev log, and a handoff report.

## Structure

```
├── CLAUDE.md                      # Rules for Claude Code
├── brand/                         # Narrative + assets (logos, foundations, decisions, case study)
├── docs/
│   ├── roadmap/
│   │   ├── PLAN.md                # Master plan (all slices)
│   │   ├── standardization.md     # Slice 17 standardization roadmap
│   │   └── FUTURE_PHASES.md       # Parked future phases
│   ├── reference/
│   │   ├── ARCHITECTURE.md        # System architecture
│   │   ├── CONSTITUTION.md        # Governance (layout, type, motion, a11y rules)
│   │   ├── CSS.md                 # Token inventory + CSS architecture
│   │   ├── MOTION.md              # Motion reference (actions, scrubs, ticker)
│   │   ├── WORKFLOW.md            # Development pipeline
│   │   ├── PATTERNS.md            # Reusable solutions index
│   │   └── TESTS.md               # Test registry
│   ├── slices/                    # Build specs (+ checkpoint for active slice)
│   ├── specs/                     # Design specs
│   ├── plans/                     # Implementation plans
│   ├── devlog/                    # Work logs
│   ├── handoffs/                  # Completion reports
│   └── learn/                     # Learning knowledge base
├── src/                           # SvelteKit app code (tests co-located, never top-level `tests/`)
└── static/                        # Public assets (images, lottie, favicon)
```

## For a New Dev or AI

1. Read `CLAUDE.md`
2. Read `docs/roadmap/PLAN.md`
3. Read `docs/reference/ARCHITECTURE.md` + `CONSTITUTION.md`
4. Find the active slice in `docs/slices/` (plus the checkpoint file)
5. Check recent logs in `docs/devlog/`

## Brand

Primary `#E07800` · Accent `#FFB627` · Inter + JetBrains Mono · Dark theme default.
Narrative + foundations + case study: `brand/` (see `brand/README.md`).
