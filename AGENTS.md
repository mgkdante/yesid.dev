---
# This file's frontmatter ships with `<FILL IN>` placeholders by design.
# Real Notion UUIDs live in a gitignored `AGENTS.local.md` file.
# Resolution: AGENTS.local.md > AGENTS.md > refuse (PreToolUse Rule 6 hook enforces).

notion:
  root_page_id: "<FILL IN: yesid.dev top page UUID>"
  workspace_url: "<FILL IN: e.g. https://www.notion.so/>"
  databases:
    slices:
      database_id: "<FILL IN>"
    sessions:
      database_id: "<FILL IN>"
  pages:
    roadmap: "<FILL IN>"
    architecture: "<FILL IN>"
    architecture_index_db: "<FILL IN>"
    business: "<FILL IN>"
    business_index_db: "<FILL IN>"
  vocabulary_page_id: "<FILL IN: shared global vocabulary page UUID>"
---

# AGENTS.md — yesid.dev workflow contract (v2)

> **Tool-agnostic.** Read by both Claude Code and Codex CLI.

## Project

**yesid.dev** — Yesid O.'s freelance digital-infrastructure practice. Web app + CMS + portfolio. Built with SvelteKit + Directus + Neon, deployed on Vercel + Railway.

## Workflow

workflow-overlord 2.0 orchestrates Claude Code + Codex sessions via Notion shared state. Anti-hallucination through chunked work (slice → tasks). User drives; AI reminds.

## Core principles — the 5 mechanical guarantees (100% enforced)

1. **Sessions row exists at session start** — SessionStart hook
2. **Sessions row gets transcript + summary at session end** — Stop/SessionEnd hook
3. **No surgical Notion edits (Rule 2)** — PreToolUse hook
4. **Refuse placeholder Notion config (Rule 6)** — PreToolUse hook
5. **Cross-tool parity** — structural: one `skills/` dir, one `overlord-bridge` MCP, `.codex/hooks/*.sh` symlink to `.claude/hooks/`

Everything else is instruction + AI nudge — user decides.

## Notion subtree shape

```
<root_page_id>   ("yesid.dev")
├── 🏢 Business → Brand, Services
├── 🏗️ Architecture → Project (Stack/Architecture/Tests/Vocabulary), Dev vs Prod
└── 📜 Canonical → Slices DB, Sessions DB, Roadmap DB
```

Global Vocabulary lives at a workspace-shared page referenced by `vocabulary_page_id` — same UUID across every project.

## Retrieval priority

1. `API-query-data-source` via Notion MCP — structured DB queries (primary)
2. `API-search` — title-match only (NOT semantic)
3. `scripts/notion-sql.ts` — Bun SQLite over Notion REST (SQL fallback)
4. `API-retrieve-a-page` / `API-fetch` — full page body, last resort

## AI nudge contract

The AI MUST nudge the user about available tools at every optional juncture. Same format every time:

> *Reminder: tools available — `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`, `superpowers:requesting-code-review`. Invoke any (or none) — your call.*

Never recommend, never personalize, never auto-invoke. User decides.

## Slice page body shape

Two sections only, evolving across the lifecycle:
- **`## Plan`** — starts as a one-paragraph spec at slice-open; evolves into a task checklist as the slice progresses. *Plan is the expectations.*
- **`## Handoff`** — appended at slice-close. Files touched, what was actually done, deviations from Plan, test results, deferred issues. *Handoff is the reality.*

## Zero-drift invariant

Every piece of state has exactly ONE canonical location. Symlinks where physical separation is unavoidable. Single `skills/` dir. AGENTS.md operational only — long-form context in Notion.

## Cascade policy

Roadmap cascade fires at exactly two moments — both deterministic, user-invoked:
- `/workflow-overlord-slice-open` → mark Roadmap "in-progress"
- `/workflow-overlord-slice-close` → mark Roadmap closed + advance to next

Never mid-slice. Never on commits or hook fires.

## Stack-specific notes

- **Runtime:** Bun only. Lockfile: `bun.lock`. `bun install` then `bun run setup:hooks`.
- **Secrets:** 1Password (`op://yesid-dev/<item>/<field>`). Never plaintext in repo.
- **Monorepo:** Turborepo, `apps/web` (SvelteKit) + `apps/cms` (Directus). Shared packages under `packages/`.
- **CMS:** dual-environment Directus on Railway (dev + prod). See Notion → 🏗️ Architecture → Dev vs Prod for the procedure.
- **Pre-commit:** `.githooks/pre-commit` blocks edits to generated tokens unless `packages/tokens/tokens.json` is staged.
