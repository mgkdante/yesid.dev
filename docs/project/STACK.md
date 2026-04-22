# Stack

Project-specific tech stack. Fill in as your project takes shape.

> **Bind:** the canonical commands in `BINDINGS.md` are derived from this stack (e.g., if `package_manager = bun`, then `verification_commands = bun run test + bun run check`).

## Runtime

| Field | Value |
|-------|-------|
| Primary language | <!-- FILL IN: TypeScript / Python / Rust / Go / Ruby / etc. --> |
| Language version | <!-- FILL IN: 3.12 / 1.78 / 22.x LTS / etc. --> |
| Runtime | <!-- FILL IN: Bun / Node / Deno / Python / Cargo / etc. --> |
| Package manager | <!-- FILL IN: bun / npm / pnpm / yarn / pip / uv / cargo / etc. --> |
| Lockfile | <!-- FILL IN: bun.lockb / package-lock.json / pnpm-lock.yaml / Cargo.lock / etc. --> |

## Framework

| Field | Value |
|-------|-------|
| Primary framework | <!-- FILL IN: SvelteKit 2 / Next.js 15 / FastAPI / Django 5 / Rails 7 / Axum / Gin / "none / library only" / etc. --> |
| Framework version | <!-- FILL IN --> |
| UI library (if applicable) | <!-- FILL IN: Bits UI / shadcn / Material UI / Chakra / "none" --> |
| Styling | <!-- FILL IN: Tailwind v4 / styled-components / CSS modules / "scoped-only" / "n/a — backend" --> |

## Tooling

| Purpose | Tool |
|---------|------|
| Linter | <!-- FILL IN: ruff / eslint / clippy / golangci-lint / rubocop / "n/a" --> |
| Formatter | <!-- FILL IN: prettier / black / rustfmt / gofmt / "n/a" --> |
| Type checker | <!-- FILL IN: tsc / mypy / pyright / "compile-time (Rust/Go)" / "n/a" --> |
| Test runner | <!-- FILL IN: Vitest / Jest / pytest / cargo test / go test / RSpec / "n/a" --> |
| E2E test runner | <!-- FILL IN: Playwright / Cypress / Puppeteer / "n/a" --> |
| Build tool | <!-- FILL IN: Vite / Webpack / Turborepo / cargo / go build / "n/a" --> |
| Process manager (long-running) | <!-- FILL IN: PM2 / systemd / docker compose / "n/a" --> |

## Deployment

| Field | Value |
|-------|-------|
| Hosting platform | <!-- FILL IN: Vercel / Railway / Fly.io / AWS / GCP / Azure / self-hosted / "n/a — library" --> |
| Deployment trigger | <!-- FILL IN: git push / GitHub Actions / manual / etc. --> |
| Environment matrix | <!-- FILL IN: dev / staging / prod / preview-per-PR / etc. --> |

## Storage

> Skip if not applicable.

| Field | Value |
|-------|-------|
| Primary database | <!-- FILL IN: Postgres / MySQL / SQLite / MongoDB / "n/a" --> |
| Database hosting | <!-- FILL IN: Neon / Supabase / RDS / Planetscale / self-hosted / "n/a" --> |
| ORM / query builder | <!-- FILL IN: Drizzle / Prisma / SQLAlchemy / sqlx / Diesel / "raw" / "n/a" --> |
| Object storage | <!-- FILL IN: S3 / R2 / Vercel Blob / GCS / "n/a" --> |
| Cache | <!-- FILL IN: Redis / Upstash / "in-memory" / "n/a" --> |

## Integrations

> Add rows for each external service, API, or third-party dependency that's load-bearing for the project.

| Service | Purpose | Auth pattern |
|---------|---------|--------------|
| <!-- FILL IN: e.g., Resend --> | <!-- transactional email --> | <!-- API key in env: RESEND_API_KEY --> |
| <!-- FILL IN --> | <!-- --> | <!-- --> |

## CI/CD

| Field | Value |
|-------|-------|
| CI platform | <!-- FILL IN: GitHub Actions / GitLab CI / CircleCI / "n/a" --> |
| CI pipeline triggers | <!-- FILL IN: push / pull-request / scheduled / etc. --> |
| Pipeline steps | <!-- FILL IN: install → typecheck → lint → test → build → deploy --> |
| Required CI checks before merge | <!-- FILL IN: list the checks that must pass --> |

## Notes / decisions

<!-- FILL IN: any stack decisions worth documenting (e.g., "chose Bun over Node for X / Y / Z" or "no ORM — raw SQL via psql for performance"). Include rationale + tradeoffs. -->
