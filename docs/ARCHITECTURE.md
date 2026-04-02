# Architecture

**Last updated:** 2026-04-02

## Stack

| Layer | Tech | Why |
|-------|------|-----|
| Framework | SvelteKit 2 + Svelte 5 | Compiles away the framework; lean output; runes model is explicit and predictable |
| Language | TypeScript 5.9 | Type safety across data layer and components; catches errors at build time |
| Styling | Tailwind CSS v4 | CSS-first config via `@theme`; no JS config file; co-exists with custom CSS variables |
| Runtime | Bun | Faster installs and script execution than Node.js |
| Deployment | Vercel (adapter-vercel) | Zero-config deploys; Node.js 22 runtime |
| Unit tests | Vitest 4 | Native ESM; fast; jsdom environment for Svelte component tests |
| E2E tests | Playwright | Cross-browser; tests against the built preview server |
| CI | GitHub Actions | Install → type-check → unit tests → build on every push |

## Structure

```
src/
├── app.css              # Tailwind entry point + global resets
├── app.html             # HTML shell
├── app.d.ts             # SvelteKit ambient type declarations
├── lib/
│   ├── assets/          # Static assets imported by components (favicon, etc.)
│   ├── styles/
│   │   └── tokens.css   # CSS custom properties for theme switching (--bg-primary, etc.)
│   └── data/            # ← Added in Slice 02
│       ├── types.ts     # Locale, LocalizedString, Project, Service, SiteMeta interfaces
│       ├── locale.ts    # resolveLocale(), DEFAULT_LOCALE, SUPPORTED_LOCALES
│       ├── projects.ts  # Project seed data + getProjectBySlug, getFeaturedProjects, etc.
│       ├── services.ts  # Service seed data (4 services)
│       ├── meta.ts      # SiteMeta (name, tagline, description, links)
│       └── index.ts     # Barrel re-export — import from '$lib/data'
└── routes/
    └── +page.svelte     # Home page (placeholder, wired in Slice 05)
```

## Data Layer

All content is typed and i18n-ready from day one. The key primitive is `LocalizedString`:

```ts
// English is required; French and Spanish are optional
{ en: string; fr?: string; es?: string }
```

Components never read locale fields directly. They call `resolveLocale(field, locale)`:
- If the requested locale has content → return it
- Otherwise → return English (the guaranteed fallback)
- Empty strings are treated as missing (not yet translated)

**Import path for all data and helpers:**
```ts
import { getFeaturedProjects, resolveLocale, siteMeta } from '$lib/data';
```

## CSS Architecture

Two systems coexist and serve different purposes:

| System | Example | Purpose |
|--------|---------|---------|
| CSS custom properties (`tokens.css`) | `var(--bg-primary)` | Theme-switching colors; change with dark/light mode |
| Tailwind `@theme` utilities | `text-brand-primary` | Static brand colors; always `#E07800` regardless of theme |

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `svelte` | ^5.54.0 | UI framework |
| `@sveltejs/kit` | ^2.50.2 | Meta-framework (routing, SSR, SSG) |
| `@sveltejs/adapter-vercel` | ^6.3.1 | Vercel deployment adapter |
| `tailwindcss` | ^4.1.18 | Utility-first CSS |
| `@tailwindcss/vite` | ^4.1.18 | Tailwind v4 Vite integration |
| `typescript` | ^5.9.3 | Static typing |
| `vitest` | ^4.1.0 | Unit test runner |
| `@testing-library/svelte` | ^5.3.1 | Svelte component testing utilities |
| `@playwright/test` | ^1.58.2 | E2E browser testing |
| `jsdom` | ^29.0.1 | DOM environment for unit tests |
