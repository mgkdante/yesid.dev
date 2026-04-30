# yesid. Pipeline

**Digital infrastructure that moves.**

## What This Is

The repo for yesid., a freelance SQL and digital infrastructure brand. Portfolio, tooling, and workflow systems.

## How It Works

All workflow state lives in **Notion** and is operated through the `workflow-overlord` plugin from Claude Code or Codex.

AI tools follow `AGENTS.md` plus their thin overlays. Slice work has Notion child pages for spec, plan, handoff, and research; session continuity lives in the Sessions DB.

## Structure

```
├── CLAUDE.md                      # Rules for Claude Code
├── docs/
│   ├── ai-memory/                 # Durable AI memory support
│   ├── reference/
│   │   ├── WORKFLOW.md            # Development pipeline
│   │   └── tools/                 # Claude/Codex overlays
│   ├── research/                  # Optional routable research source files
│   └── slices/<slice>/research.md # Optional routable slice-local research source
├── apps/                          # apps/web and apps/cms
├── packages/                      # shared packages
└── static/                        # public assets where applicable
```

## For a New Dev or AI

1. Read `CLAUDE.md`
2. Read `AGENTS.md`
3. Read `docs/reference/WORKFLOW.md`
4. Find active slice state in Notion `Projects/yesid.dev/`
5. Check the latest Sessions DB row before editing

## Brand

Primary `#E07800` · Accent `#FFB627` · Inter + JetBrains Mono · Dark theme default.
Narrative, foundations, and case-study material live in Notion.
