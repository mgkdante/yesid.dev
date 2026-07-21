---
# This file's frontmatter ships with `<FILL IN>` placeholders by design.
# Real Notion UUIDs live in a gitignored `AGENTS.override.md` or `AGENTS.local.md` file.
# Resolution: AGENTS.override.md > AGENTS.local.md > AGENTS.md > refuse.

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

workflow-overlord 4.x (installed plugin) orchestrates Claude Code + Codex sessions via Notion shared state. Approved slices hold outcomes, constraints, and evidence while the native agent runtime executes. User drives; AI reminds.

## Core principles — the 5 mechanical guarantees (100% enforced)

1. **Sessions row exists at session start** — SessionStart hook
2. **Sessions row gets final transcript chunks + summary refresh on Stop** - the plugin finalizer flushes readable evidence and refreshes the Sessions index. **`Ended` is not written on Stop** because sessions are resumable.
3. **No surgical Notion edits (Rule 2)** — PreToolUse hook
4. **Refuse placeholder Notion config (Rule 6)** — PreToolUse hook
5. **Cross-tool parity** - Claude Code and Codex execute the same shell-neutral runtime from the installed plugin's `hooks/hooks.json` and `hooks/run-hook.ts`. The consumer repo contains no workflow-overlord hook, skill, or MCP-server mirrors.

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
- **Binding:** direct Notion REST API (`https://api.notion.com/v1/...`) via the plugin's bundled client or raw `fetch`
- **Auth:** `NOTION_TOKEN` / `NOTION_INTEGRATION_TOKEN`
- **Used by:** workflow-overlord plugin hooks, transcript sync, deterministic state writes, retries
- **Helpers:** installed-plugin `scripts/notion-rest.ts` (`--mode api` = generic REST fallback, default SQL mode = Bun SQLite mirror), `session-start.ts`, `session-finalizer.ts`, and `session-worker.ts`

## Retrieval priority

1. `notion-query-data-sources` via hosted Notion MCP — structured DB queries (primary)
2. `notion-fetch` — full page body when query results are not enough
3. `notion-search` — title-match only (NOT semantic); scope by data source when possible
4. `notion-rest.ts --mode api` or the plugin's bundled `vendor/notion-client.js` - direct REST fallback when the OAuth MCP path is unavailable or failing
5. `notion-rest.ts` default SQL mode (provided by workflow-overlord plugin) — local SQL aggregation over REST-fetched rows when useful

Transcript retrieval uses two related surfaces:
- the Sessions row keeps the summary and readable chunk index
- `Transcript Chunks` keeps append-only Notion-native chunk pages for selective retrieval

## Slice Identity Law

Every slice has one canonical numeric identity, and every execution name is derived from it.
- Slice title: `slice-<path>` where `<path>` is one or more positive integers joined by dots (`slice-18`, `slice-18.1`, `slice-18.1.2`)
- Branch: `slice/<path>-<slug>`
- Worktree dir: `slice-<path>-<slug>`

The same `<path>` must survive across title, branch, and worktree when git isolation is used. Session-to-slice attachment is never inferred from git state; the operator manages it explicitly with slice-pick and slice-unpick.

## Session Lifecycle Law

Session state is hook-owned, not manually maintained.
1. SessionStart creates one Sessions row for the current session ID with no inferred slice attachment.
2. A session can relate to zero, one, or many slices. The operator manages that relation explicitly.
3. During the session, the installed plugin records readable transcript chunks and session evidence.
4. Stop runs the final evidence flush and refreshes the Sessions summary. It does **not** set `Ended`; Notion's `Last edited time` carries the last-touched signal.

Lifecycle failures soft-fail so observability cannot block the native agent runtime.

## AI nudge contract

The AI MUST nudge the user about available tools at every optional juncture. Same format every time:

> *Reminder: tools available — `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`, `superpowers:requesting-code-review`. Invoke any (or none) — your call.*

Never recommend or personalize the reminder. It is informational, never pauses execution, and never overrides a required skill sequence in the active workflow command.

## Slice Structure Law

Every slice has child pages titled exactly `Plan` and `Handoff`; `Research` is optional. The slice row body stays short and delegates to those children. Legacy rows with inline `## Plan` / `## Handoff` sections remain readable but are not the shape for new slices.

The Plan is the canonical approved scope and evidence surface. It records Mission, Scope and non-goals, Authority and constraints, Acceptance criteria, and Verification evidence. The Handoff records delivered files, deviations, test results, and deferrals at close.

## Slice Implementation Law

`/workflow-overlord-slice-implement` is authority to finish the approved Plan scope. The native runtime owns decomposition, parallelism, worktrees, retries, and dependency order. It completes or reuses one front-loaded design-plan-build sequence for the scope, uses TDD for code changes, and pauses only at an explicit authority, credential, destructive-action, material-choice, or contradictory-requirements boundary.

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
- **Monorepo:** Turborepo, `apps/web` (SvelteKit) + `apps/cms` (Directus). The only product-owned package under `packages/` is `packages/shared`.
- **Design-system customer boundary:** `yesid.dev-design` ships independently. This repo consumes one immutable release under `apps/web/vendor/design`; it does not own or run the upstream package suites. From `apps/web`, verify the pinned schema-2 release with `bun vendor/design/tools/adopt.ts --check --dest vendor/design`.
- **Design tokens:** Vendored `apps/web/vendor/design/tokens/` is the design source. `apps/web/tools/build-tokens.ts` is the product-owned adapter; run `bun run tokens:build` from the repo root after either source changes.
- **CMS:** dual-environment Directus on Railway (dev + prod). See Notion → 🏗️ Architecture → Dev vs Prod for the procedure.
- **Pre-commit:** `.githooks/pre-commit` requires the vendor manifest with vendored payload changes, and blocks generated `DESIGN.md` or `app.css` token-region changes unless the vendored token source or product adapter is staged.
