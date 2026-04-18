# Slice 21 — Repo Cleanup for Public Release

**Level 1 direction doc.**

**Status:** planned
**Depends on:** 16, 18
**Est. Sessions:** 1

## Goal

Strip pipeline/workflow artifacts. Public repo = clean portfolio site.

## Manual checkpoint (before Claude Code deletes anything)

Yesid copies these to `<cloud>/yesid-pipeline-archive/`:

- `docs/` (entire directory)
- `CLAUDE.md`
- `yesid-pipeline-workflow/` (if present)
- `scripts/` (if pipeline-specific)
- `brand/` narrative docs (keep logos for credits if wanted)

Yesid confirms backup is done. Only then does Claude Code proceed.

## Remove

- `CLAUDE.md` (workflow governance — private)
- `docs/` (per-project plan + references — private)
- `brand/` narrative files + any pipeline internals
- Any leftover `.gitkeep` files

## Keep

- `src/` (the actual site code)
- `tests/` (test suite)
- `static/` (public assets)
- `brand/` logos (if credited publicly)
- `.github/workflows/` (CI)
- Configs (`package.json`, `tsconfig.json`, `vite.config.ts`, etc.)
- `tree.txt`
- New `README.md` — clean public-facing

## Write

Clean public `README.md` with: site description, tech stack, deployment info, credits.

## Verification

- Existing tests pass
- Build succeeds
- No references to removed files (grep the codebase)
- README renders correctly on GitHub

## Why the backup step matters

Repo goes public irreversibly when branch merges. Backup ensures pipeline IP stays private while the artifact ships.
