# Bindings

**Workflow abstract → project concrete.** This file resolves the workflow's tool-agnostic terms to your project's specific commands, paths, env vars, and conventions. Bind once here; the workflow refers to abstract terms throughout.

> **Critical**: the Iteration Protocol (`AGENTS.md § Iteration Protocol`) refers to "verification commands" — that maps to whatever you put in § Verification commands below. Without a binding, the Iteration Protocol can't run.

## Verification commands

Bind the workflow's abstract gates to concrete commands.

| Workflow term | Project command | When it runs |
|---------------|-----------------|--------------|
| Test | <!-- FILL IN: e.g., `bun run test` / `pytest` / `cargo test` / `go test ./...` --> | Iteration Protocol step 2 (every task), pre-deploy |
| Lint | <!-- FILL IN: e.g., `bun run lint` / `ruff check .` / `clippy` / `golangci-lint run` --> | Iteration Protocol step 2, pre-PR |
| Type check | <!-- FILL IN: e.g., `bun run check` / `tsc --noEmit` / `mypy .` / "n/a — compile-time" --> | Iteration Protocol step 2 |
| Format check | <!-- FILL IN: e.g., `prettier --check .` / `ruff format --check` / "n/a" --> | Iteration Protocol step 2 (optional), pre-PR |
| Build | <!-- FILL IN: e.g., `bun run build` / `cargo build --release` / `go build ./...` --> | Pre-PR, pre-deploy |
| Run dev | <!-- FILL IN: e.g., `bun run dev` / `python -m my_app` / `cargo run` --> | Local development |
| Run with secrets | <!-- FILL IN: e.g., `op run --env-file=.env -- bun dev` (1Password); `dotenv -- ...`; "n/a" if no secret manager --> | Local dev when env vars needed |
| E2E test | <!-- FILL IN: e.g., `bun run test:e2e` / `playwright test` / "n/a" --> | Pre-PR, pre-deploy |

## Workflow-specific bindings

Per-skill overrides for the workflow plugin itself.

| Workflow skill | Project binding |
|----------------|-----------------|
| `/workflow-close-slice` | <!-- FILL IN: any project-specific close-script (e.g., `bun run slice:close <N> <letter>`) — or "default plugin behavior" --> |
| `/workflow-mirror` | <!-- FILL IN: e.g., `bun run docs:mirror` if project has a custom mirror script — or "default plugin behavior" --> |

## Cloud env binding

If your project uses a personal cloud directory for archived slices + learn knowledge base + OS-quirks, bind it here.

| Variable | Value |
|----------|-------|
| Env var name | <!-- FILL IN: e.g., `MYORG_CLOUD_ROOT` / `YESITO_CLOUD_ROOT` / "n/a — no cloud mirror" --> |
| Windows default | <!-- FILL IN: e.g., `C:\Users\<user>\<vendor>\cloud` --> |
| macOS default | <!-- FILL IN: e.g., `~/<vendor>/cloud` --> |
| Linux default | <!-- FILL IN: e.g., `~/<vendor>/cloud` --> |
| Fallback if env unset | <!-- FILL IN: e.g., `path.join(os.homedir(), '<vendor>', 'cloud')` --> |
| Set via | <!-- FILL IN: e.g., shell profile (Unix) / System Environment Variables (Windows) --> |

## Secrets manager

| Field | Value |
|-------|-------|
| Tool | <!-- FILL IN: 1Password / AWS Secrets Manager / Vault / `.env` (dev only) / "n/a" --> |
| Vault / namespace | <!-- FILL IN: e.g., 1Password vault name; AWS region+account --> |
| Injection command | <!-- FILL IN: e.g., `op run --env-file=.env -- <cmd>` --> |

## Worktree paths (D18)

If using worktree-per-slice (default per AGENTS.md § Worktree-per-slice).

| Field | Value |
|-------|-------|
| Worktree base | `.worktrees/` (gitignored) |
| Worktree name pattern | `<slice-name>` or `slice-<slice-name>` (project preference) |
| Branch naming | `feature/slice-<NN>-<letter>` (multi-sub-slice) or `feature/slice-<NN>` (single-level) |

## CI binding (if applicable)

| CI check | Command run in CI |
|----------|-------------------|
| <!-- FILL IN: e.g., `test` --> | <!-- FILL IN: e.g., `bun install --frozen-lockfile && bun run test` --> |
| <!-- FILL IN: e.g., `typecheck` --> | <!-- FILL IN --> |
| <!-- FILL IN --> | <!-- FILL IN --> |

## Notes

<!-- FILL IN: any non-obvious bindings worth documenting (e.g., "verification commands run in parallel via npm-run-all" or "lint MUST run before typecheck because X"). -->
