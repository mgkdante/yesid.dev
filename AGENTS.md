# AGENTS.md — yesid.dev-cms

> **Scorched.** Payload 3.x removed in [slice-18 Task 1](https://github.com/mgkdante/yesid.dev/tree/main/docs/slices/slice-18). This repo is an empty shell until Directus lands in Task 3.

Inherits the workflow contract from **[mgkdante/yesid.dev](https://github.com/mgkdante/yesid.dev)** — see that repo's [AGENTS.md](https://github.com/mgkdante/yesid.dev/blob/main/AGENTS.md) for the authoritative process.

Core rules carried over:

- 3-level hierarchy: **Slice → Sub-slice (PR boundary) → Task**.
- For slice-18 the bundle is flat (no sub-slices) at [`yesid.dev/docs/slices/slice-18/`](https://github.com/mgkdante/yesid.dev/tree/main/docs/slices/slice-18).
- Self-appending handoff. Handoff IS the PR body.
- Mandatory tool attribution on every session + per-task section (`**Tool:** / **Planned by:** / **Implemented by:**`).
- Cross-tool portability: Claude Code + Codex both auto-load `AGENTS.md`.

## Repo-specific adjustments (post-scorch)

### Runtime

**bun** (Node 22). Lockfile: `bun.lock` (committed). Directus install in Task 3 may or may not keep this — TBD per research D1/D2/D3.

> Windows + bun note: if `bun install` hits `unrs-resolver` postinstall EPERM, retry with `bun install --ignore-scripts`.

### Commit prefixes

- Scorch: `chore: remove Payload (slice-18 restart)` (this PR).
- Directus install work (Task 3+): `feat(slice-18): …` / `chore(slice-18): …`.
- Greppable across both repos: `git log --oneline | grep slice-18` matches both.

### Slice bundle location

Bundle docs for slice-18 live in the **`yesid.dev`** repo at [`docs/slices/slice-18/{plan,spec,research,handoff}.md`](https://github.com/mgkdante/yesid.dev/tree/main/docs/slices/slice-18). Keeping everything in one place avoids cross-repo doc drift.

### Scope guards

- No Payload revival. Pivot is locked (see yesid.dev slice-18 plan D1 + the pivot research slice).
- No archive branch, no `cms-legacy.yesid.dev` DNS record. Hard cutover (plan D2).
- Directus install in Task 3 follows the "prefer built-ins" rule from `yesid.dev` memory `feedback_prefer_platform_builtins.md`.
