# yesid. Pipeline

**Digital infrastructure that moves.**

The repo for [yesid.dev](https://yesid.dev) — Yesid O.'s freelance SQL and digital-infrastructure brand. Portfolio + tooling + workflow systems.

## How it works

All workflow state lives in **Notion**, operated through the [workflow-overlord](https://github.com/mgkdante/workflow-overlord) plugin from Claude Code or Codex. AI tools read the Notion subtree (per `AGENTS.local.md`) for context. Code lives in the repo.

## Structure

```
├── apps/web/                    # SvelteKit site (public)
├── apps/cms/                    # Directus CMS
├── packages/                    # shared packages (tokens, etc.)
├── overlord-bridge/             # workflow-overlord MCP server
├── scripts/                     # session hooks (bun)
├── skills/                      # workflow-overlord SKILLs
├── .claude/, .codex/            # tool configs + hook symlinks
├── AGENTS.md                    # workflow contract (tool-agnostic)
├── CLAUDE.md                    # Claude Code entry pointer
└── docs/reference/              # operational refs (cms-environments etc.)
```

## For a new dev or AI

1. Read `AGENTS.md`
2. Find active slice state in Notion `Projects/yesid.dev/`
3. Check the latest Sessions DB row before editing

## Brand

Primary `#E07800` · Accent `#FFB627` · Inter + JetBrains Mono · Dark-first. Full brand book lives in Notion → 🏢 Business → Brand.
