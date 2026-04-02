# Handoff: Slice 01 — Project Scaffold

## Summary
Bootstrapped the SvelteKit 2 + Svelte 5 project with Bun, Tailwind CSS v4, Vitest, Playwright, and GitHub Actions CI. The repo went from brand assets + empty directories to a working project: `bun run dev` starts a branded dark-theme page, `bun run test` passes 3 smoke tests, and `bun run build` produces a Vercel-ready bundle.

## What Was Built

| File | Purpose |
|------|---------|
| `src/app.html` | Shell HTML with dark theme class, Google Fonts, favicon link |
| `src/app.css` | Global styles: imports tokens.css, Tailwind v4, `@theme` brand tokens |
| `src/lib/styles/tokens.css` | CSS custom properties (--bg-primary, --text-primary, etc.) copied from brand/ |
| `src/lib/assets/favicon.svg` | Brand favicon used by +layout.svelte's `<svelte:head>` |
| `src/routes/+layout.svelte` | Root layout: imports app.css, injects favicon |
| `src/routes/+page.svelte` | Home page placeholder: wordmark + tagline, dark background |
| `src/routes/home.test.ts` | 3 smoke tests: app-root renders, h1 renders, tagline renders |
| `src/tests/setup.ts` | Vitest setup: imports jest-dom matchers |
| `static/favicon.svg` | Favicon served from /favicon.svg in production |
| `vite.config.ts` | Vite/Vitest config with svelteTesting() plugin for jsdom |
| `svelte.config.js` | SvelteKit config with Vercel adapter, pinned to nodejs22.x |
| `playwright.config.ts` | E2E test config pointing to tests/ dir |
| `.github/workflows/ci.yml` | CI: install → sync → type-check → unit tests → build |
| `tree.txt` | Project file map |

## How It Works

SvelteKit's file system router maps `src/routes/+page.svelte` to `/`. The `+layout.svelte` wraps all pages — it loads `app.css` (which chains: brand tokens → Tailwind → `@theme` brand config → base dark styles). The `app.html` shell sets `class="dark" data-theme="dark"` on `<html>` so that CSS custom properties from `tokens.css` (which uses `[data-theme="dark"]`) apply immediately, avoiding a flash of unstyled content.

For tests, Vitest uses jsdom but Svelte 5 has a client/server split: by default, Node.js resolves `svelte` to `index-server.js` (SSR bundle), which throws when you try to `mount()` components. The `svelteTesting()` plugin from `@testing-library/svelte/vite` fixes this by injecting `browser` into `resolve.conditions` before `node`, making Svelte resolve to `index-client.js`.

## Decisions Made

| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| Tailwind v4 `@theme` CSS instead of `tailwind.config.js` | `sv create` installs TW v4 (CSS-first). The spec said "adapt accordingly" if v4 is installed. | Keep brand tokens in JS and find a v4 compat layer |
| `svelteTesting()` plugin for Vitest | Official fix for Svelte 5 + jsdom — prevents `mount() not available on server` error | Manual `resolve.alias` or `deps.conditions` (both unreliable in Vitest 4.1) |
| Flat Vitest config (jsdom for all) | Simpler for a frontend-only project; avoids `.svelte.test.ts` naming convention | Workspace/projects config (scaffold default, adds complexity) |
| `home.test.ts` not `+page.test.ts` | SvelteKit 2 reserves `+` prefix — `+page.test.ts` in `src/routes/` causes a build error | Co-locating test with route using a different name |
| `adapter: adapter({ runtime: 'nodejs22.x' })` | Bun's Node.js ABI version (25.x) is rejected by the adapter's auto-detection | Use a different Node.js version (not feasible on this machine) |
| `getByRole('heading', { level: 1 })` in smoke test | h1 contains "yesid" + `<span>` "." — `getByText('yesid')` fails on partial text nodes | `getByText(/yesid/i)` (regex) also works but role is more semantic |

## What Yesid Should Know

**Tailwind v4 `@theme` — the new way to extend Tailwind:**
Instead of `tailwind.config.js`, you write `@theme { --color-brand-primary: #E07800; }` in CSS. Tailwind automatically generates utility classes like `text-brand-primary`, `bg-brand-primary`. The original `brand/tailwind.brand.js` is kept as the source of truth — the `@theme` block in `src/app.css` is its v4 translation.
- Docs: https://tailwindcss.com/docs/v4-upgrade

**CSS custom properties vs Tailwind utilities:**
The project uses both:
- `var(--bg-primary)` — from `tokens.css`, changes with theme (dark/light)
- `text-brand-primary` — from Tailwind `@theme`, always `#E07800` regardless of theme

Use `var()` for surfaces and text colors that switch between themes. Use Tailwind utilities for brand colors that stay constant (like the orange dot in "yesid.").

**Svelte 5 runes mode:**
All components in this project use Svelte 5 runes by default (configured in `svelte.config.js`). This means no `export let prop` — use `let { prop } = $props()`. No `<slot />` — use `{@render children()}`. The `+layout.svelte` already shows this pattern.
- Docs: https://svelte.dev/docs/svelte/v5-migration-guide

**`bun run test` vs `bun test`:**
`bun test` is Bun's own test runner (like Jest). `bun run test` runs the `test` npm script, which calls `vitest run`. Use `bun run test` to run Vitest. The CLAUDE.md says "Use `bun test` for Vitest" which is slightly imprecise — the correct command is `bun run test`.

## What Comes Next
Slice 02 (components) or Slice 03 (data) should follow. The home page is a placeholder — no real content yet. The scaffold gives every future slice a working SvelteKit project to build on.

## How to Verify

1. `bun run dev` → open `http://localhost:5173`
   - Dark background (#141414)
   - "yesid." with orange period (#E07800)
   - "Data infrastructure that moves." in secondary text color
   - Inter font loaded (browser DevTools → Computed → font-family: Inter)
   - Brand favicon in browser tab
2. `bun run test` → 3 tests pass
3. `bun run build` → no errors, `.svelte-kit/output/` exists
4. `.github/workflows/ci.yml` exists
5. `brand/tailwind_brand.js` no longer exists
6. `tree.txt` reflects the new structure
