# AGENTS.md — yesid.dev-cms

This repo inherits the workflow contract from **[mgkdante/yesid.dev](https://github.com/mgkdante/yesid.dev)** — see that repo's [AGENTS.md](https://github.com/mgkdante/yesid.dev/blob/main/AGENTS.md) for the authoritative process.

Core rules carried over:

- 3-level hierarchy: **Slice → Sub-slice (PR boundary) → Task**.
- 4-file bundle per sub-slice: `spec.md`, `plan.md`, `log.md`, `handoff.md`. During Slice 18 these live in the `yesid.dev` repo at `docs/slices/slice-18/slice-18<letter>/` (not here) — rationale below.
- Self-appending handoff. Handoff IS the PR body.
- Mandatory tool attribution on every session + per-task section (`**Tool:** / **Planned by:** / **Implemented by:**`).
- Cross-tool portability: Claude Code + Codex both auto-load `AGENTS.md`; per-tool overlays at `docs/reference/tools/{claude-code,codex}.md` where needed.

## Repo-specific adjustments

### Runtime

**bun** (not pnpm), **Node 22**. `bun install`, `bun add <pkg>`, `bun dev`, `bun run build`, `bunx payload migrate`, `bunx payload generate:types`, `bunx tsc --noEmit`. Lockfile: `bun.lock` (committed).

> If bun hits `unrs-resolver` postinstall EPERM on Windows: `bun install --ignore-scripts`. Known Windows + bun + transitive-dep file-lock race.

### Commit prefixes

- Slice 18 work: `feat(cms-slice-18<letter>): …`, `chore(cms-slice-18<letter>): …`, `docs(cms-slice-18<letter>): …`.
- Greppable across both repos: `git log --oneline | grep cms-slice-18` in this repo finds all Slice 18 CMS-side commits; same pattern `slice-18` in `yesid.dev` finds the docs side.

### Slice bundle location (Slice 18 only)

Bundle docs (`spec.md`, `plan.md`, `log.md`, `handoff.md`) for Slice 18 sub-slices (18a onwards) live in the **`yesid.dev`** repo under `docs/slices/slice-18/slice-18<letter>/`, NOT in this repo. Rationale: `yesid.dev` is the primary consumer during the content migration; keeping all Slice 18 bundles in one place avoids cross-repo doc drift. When `yesid.dev-cms` spins out as a public framework-agnostic template (Phase C2+ — likely post-18f), it will gain its own `docs/slices/` directory.

### Two-PR close protocol (Slice 18)

For sub-slices that touch both repos (all of 18a–18f):

1. **PR A — `yesid.dev-cms`** (substantive code) → opens first, merges first. Body: copy of the sub-slice's `handoff.md` from `yesid.dev`.
2. **PR B — `yesid.dev`** (docs-only, references PR A's URL) → opens second, merges second. Body: same `handoff.md`.
3. `bun run slice:close 18<letter> --name "…" --pr <B>` runs in `yesid.dev` after PR B merges; archives the bundle to `<cloud>/yesid.dev/docs/archive/slices/slice-18/slice-18<letter>/`.

Greenfield sub-slice 18a shipped via direct pushes to `main` in this repo (no PR review value yet). 18b onwards: PR-per-sub-slice.

## Scope guards

- Runtime stays **bun** for this repo. If a Payload-specific bun incompatibility surfaces, fall back to pnpm with an explicit spec amendment — never silently switch mid-slice.
- MCP API keys are **per-user secrets**. Never commit. Generate via admin UI, store in password manager, reference via env-var expansion in per-user MCP client configs.
- Migrations are **source of truth** — `push: false` is set deliberately. Always `bunx payload migrate:create` after collection/global edits; never rely on auto-push.
