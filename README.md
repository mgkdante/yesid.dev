# yesid. Pipeline

**Digital infrastructure that moves.**

The repo for [yesid.dev](https://yesid.dev) — Yesid O.'s freelance digital-solutions practice for web, automation, analytics, databases, and SQL. Portfolio + tooling + workflow systems.

## How it works

All workflow state lives in **Notion**, operated through the [workflow-overlord](https://github.com/mgkdante/workflow-overlord) plugin from Claude Code or Codex.

- Interactive Notion work uses the hosted OAuth MCP at `https://mcp.notion.com/mcp`.
- If that OAuth path is unavailable or failing, direct Notion REST is the fallback.
- Hooks, session sync, and deterministic writes always use direct REST through the plugin.
- Session retention uses append-only `Transcript Chunks` plus a readable summary and chunk index on the Sessions row.

## Structure

```
├── apps/web/                       # SvelteKit site (public)
│   └── vendor/design/              # pinned yesid.dev-design release (customer boundary)
├── apps/cms/                       # Directus config + schema dumps + ops scripts
├── packages/shared/                # product-owned shared schemas and utilities
├── scripts/                        # repo-owned asset and operational utilities
├── .claude/, .codex/, .mcp.json    # consumer-side tool config only
├── AGENTS.md                       # workflow contract (tool-agnostic)
├── CLAUDE.md                       # Claude Code entry pointer
└── DESIGN.md                       # generated from vendored tokens — do not hand-edit
```

workflow-overlord hooks, skills, and automation live only in the installed plugin. The repo does not mirror plugin runtime code.

Operational references live in Notion (Architecture → Dev vs Prod, Business → Brand) — there is no `docs/` tree in this repo.

## Design-system customer boundary

`yesid.dev-design` is an independently released dependency. This repo vendors one pinned schema-2 release under `apps/web/vendor/design` and owns only the product adapter, product policy, and product tests around it. Upstream package tests stay upstream.

From `apps/web`, verify or update the customer payload:

```bash
bun vendor/design/tools/adopt.ts --check --dest vendor/design
bun vendor/design/tools/adopt.ts --tag vX.Y.Z --packages tokens,motion,gates,ui --dest vendor/design
```

After a release changes the vendored tokens, return to the repo root and run `bun run tokens:build`. CI also runs `bun run ci:tokens` and the product-owned `packages/shared` tests.

## For a new dev or AI

1. Read `AGENTS.md`
2. Find active slice state in Notion `Projects/yesid.dev/`
3. Check the latest Sessions DB row before editing

## Brand

Primary `#E07800` · Accent `#FFB627` · Inter + JetBrains Mono · Dark-first. Full brand book lives in Notion → 🏢 Business → Brand.
