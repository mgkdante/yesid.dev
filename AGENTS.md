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
    transcript_chunks:
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
2. **Sessions row gets transcript + summary at session end** — Stop/SessionEnd hook performs the final chunk sync, writes the full transcript artifact, and updates summary/Ended state
3. **No surgical Notion edits (Rule 2)** — PreToolUse hook
4. **Refuse placeholder Notion config (Rule 6)** — PreToolUse hook
5. **Cross-tool parity** — shared workflow-overlord hook behavior lives in the plugin; Claude loads it through the plugin manifest, and Codex reuses the same repo hook wrappers through `.codex/hooks/*.sh` plus config-layer dispatchers until plugin-scoped lifecycle hook loading reaches parity

Everything else is instruction + AI nudge — user decides.

## Notion subtree shape

```
<root_page_id>   ("yesid.dev")
├── 🏢 Business → Brand, Services
├── 🏗️ Architecture → Project (Stack/Architecture/Tests/Vocabulary), Dev vs Prod
└── 📜 Canonical → Slices DB, Sessions DB, Transcript Chunks DB, Roadmap DB
```

Global Vocabulary lives at a workspace-shared page referenced by `vocabulary_page_id` — same UUID across every project.

## Notion integration architecture

Two distinct paths — pick by **caller**, not by tool name.

### `notion_conversation` (interactive / agentic)
- **Binding:** hosted Notion MCP at `https://mcp.notion.com/mcp`
- **Auth:** OAuth via the active AI tool
- **Used by:** SKILLs and interactive agent work
- **Tools:** hosted `notion-*` tools and Codex app aliases
- **Policy:** try this path first for interactive work; if OAuth MCP is unavailable or failing, fall back to direct REST. No alternate MCP fallback exists.

### `notion_automation` (headless / hooks / CI)
- **Binding:** direct Notion REST API (`https://api.notion.com/v1/...`) via `@notionhq/client` SDK or raw `fetch`
- **Auth:** `NOTION_TOKEN` / `NOTION_INTEGRATION_TOKEN`
- **Used by:** workflow-overlord plugin hooks, transcript sync, deterministic state writes, retries
- **Helpers:** `plugin/scripts/notion-rest.ts` in the workflow-overlord plugin (`--mode api` = generic REST fallback, default SQL mode = Bun SQLite mirror), `session-start.ts`, `session-end.ts`, `transcript-sync-worker.ts`

## Retrieval priority

1. `notion-query-data-sources` via hosted Notion MCP — structured DB queries (primary)
2. `notion-fetch` — full page body when query results are not enough
3. `notion-search` — title-match only (NOT semantic); scope by data source when possible
4. `notion-rest.ts --mode api` or `@notionhq/client` (provided by workflow-overlord plugin) — direct REST fallback when the OAuth MCP path is unavailable or failing
5. `notion-rest.ts` default SQL mode (provided by workflow-overlord plugin) — local SQL aggregation over REST-fetched rows when useful

Transcript retrieval is hybrid:
- `Sessions.Transcript` keeps the full-fidelity artifact
- `Transcript Chunks` keeps append-only Notion-native chunk pages for selective retrieval

## Slice Identity Law

Every slice has one canonical numeric identity, and every execution name is derived from it.
- Slice title: `slice-<path>` where `<path>` is one or more positive integers joined by dots (`slice-18`, `slice-18.1`, `slice-18.1.2`)
- Branch: `slice/<path>-<slug>`
- Worktree dir: `slice-<path>-<slug>`

The same `<path>` must survive across title, branch, and worktree. Active-slice lookups key off `Branch`, filter `Status != closed`, and prefer the newest matching row.

## Session Lifecycle Law

Session state is hook-owned, not manually maintained.
1. SessionStart reads the current branch, finds the newest non-closed slice for that branch, and creates the Sessions row.
2. During the session, transcript sync appends Notion-native `Transcript Chunks` pages related to the Sessions row and Slice when a slice relation exists.
3. Stop / SessionEnd runs the final chunk sync, uploads the full transcript artifact to `Sessions.Transcript`, writes `Summary`, and sets `Ended`.

If SessionStart never created the Sessions row, SessionEnd soft-skips instead of inventing state.

## AI nudge contract

The AI MUST nudge the user about available tools at every optional juncture. Same format every time:

> *Reminder: tools available — `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`, `superpowers:requesting-code-review`. Invoke any (or none) — your call.*

Never recommend, never personalize, never auto-invoke. User decides.

## Slice Structure Law

Every slice page body has exactly two canonical H2 sections, evolving across the lifecycle:
- **`## Plan`** — starts as a one-paragraph spec at slice-open; evolves into a task checklist as the slice progresses. *Plan is the expectations.*
- **`## Handoff`** — appended at slice-close. Files touched, what was actually done, deviations from Plan, test results, deferred issues. *Handoff is the reality.*

No extra top-level workflow sections are canonical.

## Zero-drift invariant

Every piece of state has exactly ONE canonical location. Hooks/skills/MCP servers ship in the `workflow-overlord` plugin — not duplicated into consumer repos. AGENTS.md operational only — long-form context in Notion.

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
