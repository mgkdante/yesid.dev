# yesid. Pipeline

**Digital infrastructure that moves.**

The repo for [yesid.dev](https://yesid.dev) — Yesid O.'s freelance SQL and digital-infrastructure brand. Portfolio + tooling + workflow systems.

## How it works

All workflow state lives in **Notion**, operated through the [workflow-overlord](https://github.com/mgkdante/workflow-overlord) plugin from Claude Code or Codex.

- Interactive Notion work uses the hosted OAuth MCP at `https://mcp.notion.com/mcp`.
- If that OAuth path is unavailable or failing, direct Notion REST is the fallback.
- Hooks, session sync, and deterministic writes always use direct REST through the plugin.
- Session retention is hybrid: one full transcript artifact on the Sessions row plus append-only `Transcript Chunks` pages for selective retrieval.

## Structure

```
├── apps/web/                       # SvelteKit site (public)
├── apps/cms/                       # Directus config + schema dumps + ops scripts
├── packages/                       # shared packages (shared, tokens)
├── overlord-bridge/, scripts/, skills/  # workflow-overlord session tooling
├── .claude/, .codex/, .mcp.json    # consumer-side tool config only
├── AGENTS.md                       # workflow contract (tool-agnostic)
├── CLAUDE.md                       # Claude Code entry pointer
└── DESIGN.md                       # generated from packages/tokens — do not hand-edit
```

Operational references live in Notion (Architecture → Dev vs Prod, Business → Brand) — there is no `docs/` tree in this repo.

## For a new dev or AI

1. Read `AGENTS.md`
2. Find active slice state in Notion `Projects/yesid.dev/`
3. Check the latest Sessions DB row before editing

## Brand

Primary `#E07800` · Accent `#FFB627` · Inter + JetBrains Mono · Dark-first. Full brand book lives in Notion → 🏢 Business → Brand.
