# yesid.dev — Bindings

**Workflow abstract → project concrete.** This file resolves `docs/reference/WORKFLOW.md`'s tool-agnostic terms (verification commands, close-script, cloud env, secrets injection) to yesid.dev's specific bindings. Bind once here; the workflow refers to abstract terms throughout.

> **Critical:** the Iteration Protocol ([docs/reference/WORKFLOW.md](../reference/WORKFLOW.md) § Phase 5) refers to "verification commands" — that maps to § Verification commands below. Without a binding, the Iteration Protocol can't run.

## Verification commands

| Workflow term   | Project command                       | When it runs                                          |
|-----------------|---------------------------------------|-------------------------------------------------------|
| Test            | `bun run test`                        | Iteration Protocol step 2 (every task), pre-PR, CI    |
| Type check      | `bun run check` (svelte-check + tsc)  | Iteration Protocol step 2, pre-PR, CI                 |
| Lint            | bundled into `bun run check`          | Iteration Protocol step 2                             |
| Format check    | `bunx prettier --check .`             | Pre-PR (optional — auto-fix via `bun run format`)     |
| Build           | `bun run build`                       | Pre-PR, Vercel auto-runs on push                      |
| Run dev         | `bun run dev` → `http://localhost:5173/` | Local development                                  |
| Run with secrets| `op run --env-file=.env -- bun dev`   | Local dev when contact form / CMS env vars needed     |
| E2E test        | `bun run test:e2e` (Playwright)       | Pre-PR when E2E-affecting slice; not gating           |

Browser check URL (Iteration Protocol step 3): `http://localhost:5173/`.

## Workflow-specific bindings

Per-skill overrides for the workflow plugin.

| Workflow skill             | Project binding                                                                           |
|----------------------------|-------------------------------------------------------------------------------------------|
| `/workflow-close-slice`    | `bun run slice:close <N> <letter>` — yesid close-script runs in addition to plugin's default close (handles cloud mirror + `COMPLETED-SLICES.md` append + `tree.txt` regen). Invoked from plugin's Phase 8. |
| `/workflow-mirror`         | `bun run docs:mirror` — yesid-specific script mirrors live slice + handoff content to cloud (`$YESITO_CLOUD_ROOT/yesid.dev/docs/archive/`). |
| `/workflow-pull`           | Default plugin behavior. No project override.                                             |
| `/workflow-update`         | Default plugin behavior. No project override.                                             |
| `/workflow-slice-open`     | Default plugin behavior; yesid branch naming pattern below resolves `<slice-tag>`.        |

## Branch + PR convention

| Field                    | Value                                                          |
|--------------------------|----------------------------------------------------------------|
| Branch shape             | `feature/slice-<NN><letter>` (e.g., `feature/slice-17j-token-efficacy`) |
| Single-level slice       | `slice-<name>` (e.g., `slice-cloud-ii`)                        |
| PR target                | `main` (always; never direct commit to `main`)                 |
| Merge strategy           | Squash-merge (1 commit per sub-slice / single-level slice)     |
| Post-merge close         | `git checkout main && git pull && bun run slice:close <...>`    |

## Cloud env binding

yesid.dev uses a personal cloud directory for archived slices + learn knowledge base + OS-quirks + workflow IP.

| Variable               | Value                                                                                    |
|------------------------|------------------------------------------------------------------------------------------|
| Env var name           | `YESITO_CLOUD_ROOT`                                                                      |
| Windows default        | `C:\Users\<user>\Yesito\cloud`                                                           |
| macOS default          | `~/Yesito/cloud`                                                                         |
| Linux default          | `~/Yesito/cloud`                                                                         |
| Fallback if env unset  | `path.join(os.homedir(), 'Yesito', 'cloud')` in Bun scripts                              |
| Set via                | Windows: System Environment Variables. macOS/Linux: `~/.bashrc` / `~/.zshrc` / `~/.profile`. |

Cloud directory layout under `$YESITO_CLOUD_ROOT`:

```
<YESITO_CLOUD_ROOT>/
├── yesid.dev/
│   └── docs/archive/slices/slice-NN/...     # archived sub-slice bundles
├── workflow-knowledge/                       # portable workflow IP (pre-workflow-repo)
│   ├── os-quirks/<os>.md                    # platform-specific command registry
│   ├── stack/registry.jsonc                 # cross-tool artifact registry
│   └── token-efficacy/*.md                  # cache economics research
└── claude-config/
    └── user/<YYYY-MM-DD[-tag]>/             # snapshot archive
```

Future env var: `YESITO_WORKFLOW_ROOT` → `~/Yesito/Projects/workflow` (pre-workflow-repo, resolves to `$YESITO_CLOUD_ROOT/workflow-knowledge/`).

## Secrets manager

| Field                | Value                                                                                           |
|----------------------|-------------------------------------------------------------------------------------------------|
| Tool                 | 1Password (production), `.env` fallback (dev-only; never committed)                             |
| Vault / namespace    | 1Password vault: `yesid-dev`                                                                    |
| Injection command    | `op run --env-file=.env -- <cmd>` (e.g., `op run --env-file=.env -- bun dev`)                   |
| CI secrets           | GitHub Actions repository secrets (mirror of 1Password items manually updated on rotation)      |
| Secret inventory     | Canonical source is 1Password vault `yesid-dev`. `.env.example` at repo root enumerates required variable names (no values).  |

## Worktree paths (D18)

Every slice ≥ M-size uses a dedicated worktree.

| Field                 | Value                                                                             |
|-----------------------|-----------------------------------------------------------------------------------|
| Worktree base         | `.claude/worktrees/` (gitignored — enforced in `.gitignore`)                      |
| Worktree name pattern | `<slice-name>` (e.g., `.claude/worktrees/slice-cloud-ii/`)                        |
| Persistence           | Worktree stays for the duration of the slice (opens at slice-open; removes at slice-close). Session-exit always picks "keep". |
| Resume via            | `EnterWorktree(path: ".claude/worktrees/<slice-name>")` each session             |
| Remove via            | `ExitWorktree(action: "remove")` after PR merges + `bun run slice:close`           |

## CI binding

| CI check      | Command in CI                                                            |
|---------------|--------------------------------------------------------------------------|
| install       | `bun install --frozen-lockfile`                                          |
| check         | `bun run check` (svelte-check + tsc)                                     |
| test          | `bun run test` (Vitest — 782+ tests as of Slice 17j)                     |
| build         | `bun run build` (Vite → SvelteKit adapter-vercel)                        |
| E2E (soft)    | `bun run test:e2e` (Playwright — currently minimal, non-gating)          |

Vercel runs its own `bun install && bun run build` + preview deploy in parallel with GitHub Actions.

## Notes

- **Verification order matters:** always run `bun run check` before `bun run test`. The Svelte type-check surfaces types-derived errors that would otherwise cause runtime test failures with confusing stack traces.
- **Secret rotation:** when rotating a 1Password item, update GitHub Actions repo secret within the same session. Mismatched secrets between local `op run` and CI cause intermittent failures.
- **Worktree cleanup:** never `rm -rf` a worktree directory manually. Always use `git worktree remove` (or `ExitWorktree(action: "remove")`) — manual deletion leaves stale `.git/worktrees/<name>` metadata.
- **Cross-platform paths:** scripts referring to cloud paths must use `$YESITO_CLOUD_ROOT` or `path.join(os.homedir(), 'Yesito', 'cloud')` — never hardcode `/Users/` or `C:\Users\`.
