# Slice 17 — Checkpoint

**Last updated:** 2026-04-19 | **17k SHIPPED (PR #25 merged as `e157e30`, slice closed via `slice:close 17k`). Next yesid.dev work: Slice 15, AFTER workflow repo Slice 1 lands in the separate `workflow` project at `C:\Users\otalo\Yesito\Projects\workflow`.**
**Branch:** `main` (feature branches close via `bun run slice:close`)
**Status:** between sub-slices — no active bundle in repo. Slice 17 remains active (15, 17c, 17f, 16, 17g still planned).

## Just shipped — 17k Cross-Tool Workflow Portability

**PR:** [#25](https://github.com/mgkdante/yesid.dev/pull/25) squash-merged 2026-04-19 as commit `e157e30`.
**Closed via:** `bun run slice:close 17k --name "Cross-Tool Workflow Portability" --pr 25`.
**Bundle archived at:** `<cloud>/yesid.dev/docs/archive/slices/slice-17/slice-17k/` (spec + plan + log + handoff).
**Tasks shipped:** 17k-1 (CLAUDE.md thin pointer), 17k-2 (generic-term pass), 17k-3 (tool-attribution convention), 17k-4 (registry schema), 17k-5 (populate registry), 17k-6 (mirror workflow-efficiency skill), 17k-7 (prune recommendations), 17k-9 (install.ts), 17k-10 (round-trip skill-version test).
**Review-driven post-ship fixes:** `claude_equivalent` MCP annotations (F4 reading layer), `workflow-efficiency` skill body rewrite tool-agnostic + bumped to `version: 1.1.0` (F1), 17k-10 scope narrowing to skill-only (F3), plugin-apply codepath stress-tested on `playground@claude-plugins-official` (F5), `install.ts` TOML dirty-write + diff direction noted as 17l follow-ups.
**Deferred:** 17k-8 (synthetic Codex cross-tool verification) — real verification happens when the `workflow` repo bootstraps the `transit` project (different field: Neon → Oracle VPS Postgres port).
**Outcome:** `AGENTS.md` at repo root is the tool-agnostic workflow contract (Claude Code + Codex both auto-load). Per-tool overlays at `docs/reference/tools/{claude-code,codex}.md`. Mandatory tool-attribution headers on every session + handoff section. Cloud-side JSONC stack registry + Bun installer at `<cloud>/workflow-knowledge/stack/`. Workflow-efficiency skill rewritten cross-tool. All in-scope acceptance criteria met or explicitly amended; F6–F16 review findings moved to workflow repo Slice 1.

## Next — workflow repo Slice 1 (NEW PROJECT, separate repo)

**Project path:** `C:\Users\otalo\Yesito\Projects\workflow`
**GitHub:** private repo, pending creation
**Slice 1 scope (to be specced):**
- Migrate the workflow stack out of `<cloud>/workflow-knowledge/` + `<cloud>/claude-config/` + `<cloud>/codex-config/` into the new repo (git replaces cloud sync for workflow IP).
- **Mandatory cross-tool connector registry.** Per Yesid's 2026-04-18 direction: define THE non-negotiable set of MCPs/connectors that must work across Claude Code + Codex for every yesid project (candidates: svelte, neon, cloudflare, vercel, playwright, github, figma, chrome-devtools, powerbi). Per-tool extras beyond the mandatory set are user-managed; the framework only guarantees the mandatory list. If cross-tool parity isn't achievable for a mandatory connector, the registry surfaces the gap explicitly as a list rather than pretending parity exists.
- **Clean-slate prune pass.** Execute the cleanup `<cloud>/workflow-knowledge/stack/prune-recommendations.md` recommends: remove `skill.fish` entirely, trim unused MCPs across Claude + Codex + `~/.agents/`, uninstall plugins for abandoned stacks, purge stale marketplace caches. Post-prune state becomes the reference snapshot. Goal: every tool has only `mandatory connectors + active per-project mode extras`, nothing else.
- Design + build the modular MCP plug/unplug system (project-type modes: `web-dev`, `sql-work`, `pipeline`, `transit`, per-project bundles) that layer on top of the mandatory set.
- Introduce `routing.jsonc` from the research doc (machine-readable "which tool for which work type" store with evidence tiers + review dates).
- Resolve review findings F6 (cloud in repo), F7 (TOML writer), F8 (codex.md MCP bug caveats), F9 (Opus 4.7 `[1m]` binding), F10 (`~/.agents/skills/` precedence), F12 (log chronology cosmetic), F16 (install.ts diff direction inverted).
- Define the `bunx workflow create --mode <mode> --name <project>` instantiation command.
- Define the self-enhancement loop: slice-close detects governance-file changes and stages PR upstream to `workflow` repo.

**Why this is a new repo, not 17l:** the workflow is its own product / framework / personal IP. Lives separately so it can be `git clone`-ed onto any project Yesid works on (yesid.dev, transit, better_habits, and the other 6 services). yesid.dev's Slice 17 closes cleanly at 17k; there will be no 17l.

**This CHECKPOINT is relevant again after workflow repo Slice 1 ships + yesid.dev work resumes at Slice 15.**

## After that — yesid.dev Slice 15 SEO + Metadata

**Status:** planned. Direction doc already drafted at [`../slice-15/README.md`](../slice-15/README.md).
**Depends on:** 17b ✓ (hexagonal data layer seams), workflow repo Slice 1 (for any portable skill / mode updates relevant to web-dev projects).
**Est. sessions:** 1–2 (likely L-slice planning — SEO cuts across layout, routes, data layer, build-time generation).
**Planning session start:** read Slice 17 README + [`../slice-15/README.md`](../slice-15/README.md) + PLAN.md slice 15 row, brainstorm, write spec + plan into a new bundle at `docs/slices/slice-15/slice-15a/` (per PLAN.md naming convention).

## Remaining Slice 17 work (per PLAN.md execution sequence)

| Sub-slice | Status | Note |
|-----------|--------|------|
| ~~17b Hexagonal Data Layer~~ | ✅ SHIPPED 2026-04-18 (#24) | — |
| ~~17j Workflow Efficiency~~ | ✅ SHIPPED 2026-04-18 (#23) | Token −54% + 3-level hierarchy + portable IP across 6 services |
| ~~17k Cross-Tool Portability~~ | ✅ SHIPPED 2026-04-19 (#25) | Tool-agnostic AGENTS.md + overlays + stack registry + installer + review-driven fixes |
| **15 SEO + Metadata** | **planned — after workflow repo Slice 1** | JSON-LD, sitemap, robots.txt, meta, OG, Twitter cards |
| 17c Zod Schemas | planned (after 15) | Data-layer validation |
| 17f Test Architecture | planned (after 17c) | — |
| 16 E2E + Perf + Brand QA | planned (after 17f) | Tests the final state |
| 17g Learning Docs Refactor | **scope re-eval needed** | `docs/learn/` moved to cloud in 17j; revisit what this slice actually does now |

After Slice 17 fully closes:
- Slice 18 Payload CMS (separate repo `yesid.dev-cms`)
- Slice 19 Mobile → 19b A11y → 20 Scroll polish → 21 Cleanup → 22 Deploy

## Shipped sub-slices (summary)

| Sub-slice | PR | Outcome |
|-----------|----|----|
| 17a-1 / 17a-2 / 17a-3 / 17a-5 / 17a-6 | #2–#8 | Token foundation, brand primitives (15 → 13 post-cleanup), color + token wiring, spacing + CONSTITUTION.md, Bits UI |
| 17a-4 | #20 | Dead code + dedup fresh audit (90% absorbed into 17a-2b / 17d / 17e; residue + doc refresh) |
| 17d-1 / 17d-2 / 17d-3 / 17d-4 | #15 | Atomic Design System — card unification, SvgIcon, file splits, edge-to-edge wiring |
| 17e-1 → 17e-6 | #12, #14, #17, #19 | Motion re-engineering — Snappy Doctrine, 9-signature vocabulary, scrub factories, shared ticker, lazy GSAP, MOTION.md v2.0 |
| 17h-3 / 17h-4 | #22 | Brand Bundle — narrative + logo assets + governance freshen |
| 17j | #23 | Workflow Efficiency — token −54% + 3-level hierarchy + portable IP across 6 services |
| 17b | #24 | Hexagonal Data Layer + LocalizedString Enforcement |
| 17k | #25 | Cross-Tool Portability — AGENTS.md + overlays + stack registry + installer + review-driven fixes |

## Tooling now available (use these going forward)

**yesid.dev workflow:**
- `bun run slice:close <letter> --name "..." --pr <n>` — close a sub-slice after PR merges
- `bun run docs:mirror` — refresh off-device live docs
- `bun run brand:mirror` — refresh off-device brand (optional)

**Cross-tool skill + stack (currently at `<cloud>/workflow-knowledge/`, migrates to `workflow` repo in its Slice 1):**
- `~/.claude/skills/workflow-efficiency/` + `~/.codex/skills/workflow-efficiency/` — activates on new project / sluggish session / audit / new machine. Now cross-tool at `version: 1.1.0`.
- `<cloud>/workflow-knowledge/stack/install.ts` — Bun-based registry applier (`--tool claude-code|codex|both`, `--dry-run|--apply`, `--only mcps|skills|plugins|agents`)
- `<cloud>/workflow-knowledge/stack/registry.jsonc` — machine-readable cross-tool stack source of truth with `claude_equivalent` MCP annotations
- `<cloud>/workflow-knowledge/stack/prune-recommendations.md` — live Claude-side cleanup memo
- `<cloud>/claude-config/snapshot.ts` + `restore.ts` — Claude config portability across machines
- `<cloud>/codex-config/` — symmetric for Codex
- `<cloud>/workflow-knowledge/{token-efficacy,os-quirks,mcp-templates,scripts}/` — cross-project knowledge

## Core principles (permanent, from 17j + 17k)

1. **Tool-agnostic contract.** `AGENTS.md` at repo root; per-tool overlays at `docs/reference/tools/`; abstract roles (deeper-reasoning model, faster/cheaper model, live progress tracker, etc.) bind to concrete mechanisms per tool.
2. **Three-tier context.** Tier 1 always-on (in repo) / Tier 2 fetch-on-command (cloud + git) / Tier 3 cloud indexes.
3. **3-level hierarchy.** Slice → Sub-slice (PR boundary) → Task → (implicit Session).
4. **4-file bundle per sub-slice.** spec + plan + log + handoff (folder stays folder at rest — no flatten at close).
5. **Self-appending handoff.** Grows per-task; IS the PR body.
6. **Non-slice sessions** at `docs/sessions/<date>-<name>.md`.
7. **Tool attribution mandatory.** `**Tool:** / **Planned by:** / **Implemented by:**` on every session + per-task section. Enables cross-tool handoff mid-stream.
8. **Faster/cheaper model for subagents** by default; deeper-reasoning model for parent session.
9. **Codex as token buffer** for execution work; Claude Code for design / review / frontend / MCP orchestration. Dual-tool strategy doc pending in the `workflow` repo.
10. **Self-enhancing workflow.** Every mistake solved in one slice becomes a permanent closing-checklist rule. After workflow repo Slice 1 lands, enhancements propagate upstream automatically at slice close.
