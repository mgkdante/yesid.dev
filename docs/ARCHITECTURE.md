# Architecture

**Last updated:** 2026-04-03

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
│   ├── assets/          # Build-time assets (favicon, etc.)
│   │   └── lottie/      # (MOVED to static/lottie/ in Slice 06 — URL-served for LottiePlayer)
│   ├── styles/
│   │   └── tokens.css   # CSS custom properties for theme switching (--bg-primary, etc.)
│   ├── data/            # ← Added in Slice 02, extended in Slices 04, 06d
│   │   ├── types.ts     # Locale, LocalizedString, Project, Service, SiteMeta, BlogPost
│   │   ├── locale.ts    # resolveLocale(), DEFAULT_LOCALE, SUPPORTED_LOCALES
│   │   ├── projects.ts  # Project seed data + getProjectBySlug, getFeaturedProjects, etc.
│   │   ├── services.ts  # Service seed data (4 services, with station/id/relatedProjects)
│   │   ├── blog.ts      # Blog posts from markdown files (import.meta.glob) + getLatestPosts, getPostBySlug
│   │   ├── metro.ts     # ← Slice 06d: data-driven metro line (auto-computes stops from services)
│   │   ├── content.ts   # ← Slice 06d: centralized UI strings as LocalizedString (hero, about, CTA)
│   │   ├── meta.ts      # SiteMeta (name, tagline, description, links)
│   │   └── index.ts     # Barrel re-export — import from '$lib/data'
│   ├── components/      # ← Added in Slice 03, enhanced in Slices 04-06, extended in 06d
│   │   ├── Nav.svelte           # fixed nav bar: wordmark, links, responsive hamburger menu
│   │   ├── Footer.svelte        # minimal footer: brand name, year, social links, 3D model attribution
│   │   ├── TagList.svelte       # string[] → stagger-revealed pill badges
│   │   ├── SectionHeader.svelte # h2 heading + optional subtitle
│   │   ├── ServiceCard.svelte   # service tile (title, description, icon placeholder)
│   │   ├── ServiceStation.svelte # station-sign card: number, indicator light, 400x400 scroll-linked Lottie, tilt
│   │   ├── ScrollPrompt.svelte  # animated scroll-down chevron for hero
│   │   ├── ProjectCard.svelte   # clickable project card with boop hover
│   │   ├── ProjectGrid.svelte   # responsive grid of ProjectCards
│   │   ├── Hero.svelte          # hero block (heading, subheading, CTA buttons)
│   │   ├── HeroBanner.svelte    # ← Slice 06d: split hero with 3D wagon + art bg + bold type
│   │   ├── FeaturedWork.svelte  # ← Slice 06d: featured projects grid (stop 05)
│   │   ├── AboutBento.svelte    # ← Slice 06d: mini bento grid about teaser (stop 06)
│   │   ├── BlogCard.svelte      # ← Slice 06d: individual blog post card
│   │   ├── BlogFeed.svelte      # ← Slice 06d: latest blog posts section (stop 07)
│   │   └── StationDivider.svelte # ← Slice 06d: yellow/black hazard stripe between stops
│   └── motion/          # ← Added in Slice 04
│       ├── actions/
│       │   ├── boop.ts          # use:boop — hover transform burst
│       │   ├── reveal.ts        # use:reveal — scroll-triggered GSAP entrance
│       │   ├── magnetic.ts      # use:magnetic — cursor pull on desktop
│       │   ├── ripple.ts        # use:ripple — orange click ripple
│       │   ├── tilt.ts          # use:tilt — 3D card tilt following cursor (slice 06b)
│       │   └── index.ts         # barrel export
│       ├── stores/
│       │   ├── reducedMotion.ts # prefersReducedMotion store + isPrefersReducedMotion()
│       │   ├── scroll.ts        # scrollProgress store (0–1)
│       │   └── index.ts         # barrel export
│       ├── components/
│       │   ├── ScrollRail.svelte    # scroll progress rail (station dots on home, progress bar elsewhere)
│       │   └── LottiePlayer.svelte  # lottie-web wrapper (autoplay + scrub mode for scroll-linked frames)
│       ├── three/               # ← Threlte 3D scene components
│       │   ├── scene-config.ts      # getSceneConfig(stationCount) → camera, paths, positions
│       │   ├── HeroScene.svelte     # Original Threlte Canvas (DataPaths + StationNodes + PostProcessing)
│       │   ├── WagonScene.svelte    # ← Slice 06d: Montreal metro wagon Canvas wrapper
│       │   ├── WagonInner.svelte    # ← Slice 06d: wagon model loader + lighting + animation
│       │   ├── DataPaths.svelte     # TubeGeometry paths, emissive lerp with scroll
│       │   ├── StationNodes.svelte  # IcosahedronGeometry per station, glow on activeStation
│       │   └── PostProcessing.svelte # EffectComposer + bloom post-processing
│       ├── utils/
│       │   ├── gsap.ts          # registerGsapPlugins(), re-exports gsap/ScrollTrigger
│       │   ├── stagger.ts       # stagger(index, baseDelay) timing calculator
│       │   └── index.ts         # barrel export
│       └── index.ts             # top-level barrel — import from '$lib/motion'
│       ├── svg/
│       │   ├── Train.svelte         # geometric side-view train SVG (kept for /preview/train)
│       │   ├── TrainTop.svelte      # ← Slice 06d: bird's-eye 2-wagon train SVG (used on home rail)
│       │   ├── train-targets.ts     # GSAP selector strings for Train animated groups
│       │   ├── train-path.ts        # getTrainMotionPath() — VERTICAL SVG path string for MotionPathPlugin
│       │   └── TrainJourney.svelte  # train + scroll-linked positioning (uses TrainTop on home)
├── content/             # ← Added in Slice 06d
│   └── blog/            # Markdown blog posts with YAML frontmatter
│       ├── why-i-left-orm-for-raw-sql.md
│       ├── building-a-transit-pipeline.md
│       └── anime-data-viz-challenge.md
└── routes/
    ├── +layout.svelte   # Root layout: Nav + ScrollRail + page content + Footer + page transitions
    ├── +page.ts         # SSR disabled (Three.js/GSAP need browser APIs)
    ├── +page.svelte     # Home page: 8-stop metro journey (hero, services, projects, about, blog, CTA)
    └── preview/
        ├── +page.ts     # SSR disabled
        └── +page.svelte # Dev-only 3D scene preview with slider controls
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
| `gsap` | ^3.14.2 | Scroll-triggered animation engine (ScrollTrigger, MotionPathPlugin) |
| `lottie-web` | ^5.13.0 | Lottie JSON animation player for station icons |
| `@threlte/core` | ^8.5.5 | Svelte Three.js bindings (installed, scene built in Slice 06) |
| `@threlte/extras` | ^9.14.2 | Threlte helpers (Float, useGltf, etc.) |
| `three` | ^0.183.2 | 3D engine (peer dep of Threlte) |
| `vitest` | ^4.1.0 | Unit test runner |
| `@testing-library/svelte` | ^5.3.1 | Svelte component testing utilities |
| `@playwright/test` | ^1.58.2 | E2E browser testing |
| `jsdom` | ^29.0.1 | DOM environment for unit tests |
| `@types/three` | ^0.183.1 | TypeScript types for Three.js |
