# yesid.dev — Stack

Tech stack for yesid.dev. Canonical commands derived from this stack live in [`BINDINGS.md`](BINDINGS.md).

> **Bind:** `package_manager = bun` → `verification_commands = bun run test + bun run check`.

## Runtime

| Field            | Value                                                                                 |
|------------------|---------------------------------------------------------------------------------------|
| Primary language | TypeScript                                                                            |
| Language version | TypeScript 5.9                                                                        |
| Runtime          | Bun (dev + scripts). Svelte Vite prod bundle runs on Vercel's Node runtime.           |
| Package manager  | Bun only. Never `npm` / `npx` / `node` directly (enforced in [AGENTS.md](../../AGENTS.md) § Never). |
| Lockfile         | `bun.lockb`                                                                           |

## Framework

| Field                       | Value                                                                                      |
|-----------------------------|--------------------------------------------------------------------------------------------|
| Primary framework           | SvelteKit 2 + Svelte 5                                                                     |
| Framework version           | SvelteKit 2.x, Svelte 5.x (runes API — `$state`, `$derived`, `$effect`, `$props`)          |
| UI library                  | Bits UI (headless primitives) paired with brand-primitive components (StatusDot, TerminalChrome, SectionWrapper, SvgIcon, SectionHeader) |
| Styling                     | Tailwind v4 (`@theme` block in `src/app.css`) + semantic tokens in `src/lib/styles/tokens.css` + scoped `<style>` blocks per component |
| Motion                      | GSAP (all plugins free post-2024) + Lenis (smooth scroll) + IO-gated shared ticker         |

Full architecture: [`ARCHITECTURE.md`](ARCHITECTURE.md). CSS rules: [`CSS.md`](CSS.md). Motion language: [`MOTION.md`](MOTION.md).

## Tooling

| Purpose                        | Tool                                                                            |
|--------------------------------|---------------------------------------------------------------------------------|
| Linter + formatter             | Prettier + `prettier-plugin-svelte` (formatting); ESLint config minimal         |
| Type checker                   | `svelte-check` (via `bun run check` — wraps `tsc --noEmit` + Svelte type checker) |
| Test runner                    | Vitest (Vite-native; Jest-compatible API)                                       |
| E2E test runner                | Playwright (Slice 16 and future — currently minimal fixtures)                   |
| Build tool                     | Vite (SvelteKit bundler)                                                        |
| Process manager (long-running) | n/a — SvelteKit dev is a single `bun run dev` process                           |

## Deployment

| Field                  | Value                                                                  |
|------------------------|------------------------------------------------------------------------|
| Hosting platform       | Vercel (production + per-PR preview)                                   |
| Deployment trigger     | `git push` to `main` → Vercel auto-deploys production                  |
| Environment matrix     | `production` (yesid.dev), `preview` (per-PR), `development` (local)    |

## Storage (site + CMS)

| Field                | Value                                                                                             |
|----------------------|---------------------------------------------------------------------------------------------------|
| Primary content      | Typed TypeScript content in `$lib/content/*.ts` (current — Slice 17b hexagonal content pattern)   |
| CMS (in progress)    | Payload CMS in **separate repo** `yesid.dev-cms` (Slice 18 migration pipeline, 18a–18f)           |
| CMS database         | Neon Postgres (serverless Postgres) — used by Payload, not by yesid.dev front-end directly        |
| ORM / query builder  | Drizzle (via Payload's adapter) — not consumed directly from yesid.dev                            |
| Object storage       | Vercel Blob (future — Slice 18e for media hosting)                                                |
| Cache                | Vercel Runtime Cache API (edge + regional); browser HTTP cache for static assets                  |

Two-repo topology: yesid.dev (this repo) is the front-end; `yesid.dev-cms` hosts Payload + Neon. Adapter pattern (Slice 17b) means swapping in the CMS backend is a one-line change in `src/lib/adapters/index.ts`.

## Integrations

| Service          | Purpose                             | Auth pattern                                                           |
|------------------|-------------------------------------|------------------------------------------------------------------------|
| Resend           | Transactional email (contact form)  | API key in env: `RESEND_API_KEY` (injected via 1Password `op run`)     |
| Vercel           | Hosting + preview URLs              | Vercel CLI token + GitHub integration                                  |
| Neon             | Postgres for `yesid.dev-cms`        | Connection string env (used in CMS repo only; yesid.dev front-end never touches Neon directly) |
| 1Password        | Secret management (dev + CI)        | `op run --env-file=.env -- <cmd>` pattern; vault `yesid-dev`            |
| GitHub           | Source hosting + Actions CI         | OAuth + `gh` CLI                                                       |

Full list with status values: [`BINDINGS.md`](BINDINGS.md) § Secrets manager + § Cloud env binding.

## CI/CD

| Field                            | Value                                                                                            |
|----------------------------------|--------------------------------------------------------------------------------------------------|
| CI platform                      | GitHub Actions                                                                                   |
| CI pipeline triggers             | `push` (main + feature branches) + `pull_request`                                                |
| Pipeline steps                   | `bun install --frozen-lockfile → bun run check → bun run test → bun run build`                    |
| Required CI checks before merge  | `check` (type check) + `test` (unit) must pass. E2E runs in PR context but doesn't block.        |

Vercel runs its own build + preview deploy on every PR (independent of GitHub Actions). PRs show both.

## Notes / decisions

- **Bun over Node:** chosen for faster install (2-5x), native `.env` parsing, built-in TS execution for scripts (`bun scripts/slice-close.ts` directly, no ts-node), and better DX for Svelte's toolchain. Tradeoff: Vercel production bundle still uses Node runtime — Bun specific to dev/scripts only.
- **Svelte 5 runes over Svelte 4 stores:** new code uses `$state`/`$derived`/`$effect`; legacy stores retained where migration hasn't landed. `$effect` used sparingly — most reactivity handled by `$state` + `$derived`.
- **Tailwind v4 `@theme` over CSS-in-JS:** static brand tokens live in `@theme` block; theme-switching values live in CSS custom properties (`tokens.css`). No runtime style generation.
- **GSAP all-plugins-free:** post-2024 license change means DrawSVG / MorphSVG / SplitText are free. Used throughout motion layer without subscription cost.
- **Hexagonal content architecture (Slice 17b):** adapter + repository seam means front-end code imports `$lib/repositories/*` loaders, not `$lib/adapters/*` directly. Swapping in Payload CMS (Slice 18) = one-line change in `src/lib/adapters/index.ts`.
- **Never `vh`:** mobile browsers hide/show chrome, `vh` jumps. Use `dvh`/`svh`/`lvh` instead. Enforced in [`CONSTITUTION.md`](CONSTITUTION.md) §9.
