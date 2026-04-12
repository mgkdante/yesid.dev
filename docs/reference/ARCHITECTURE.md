# Architecture

**Last updated:** 2026-04-12 (Slice 17a-2b)

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
│   │   ├── services.ts  # Service seed data (6 services, with station/id/relatedProjects + detail fields)
│   │   ├── blog.ts      # Blog posts from markdown files (import.meta.glob) + getLatestPosts, getPostBySlug
│   │   ├── metro.ts     # ← Slice 06d: data-driven metro line (auto-computes stops from services)
│   │   ├── content.ts   # ← Slice 06d: centralized UI strings as LocalizedString (hero, about, CTA)
│   │   ├── meta.ts      # SiteMeta (name, tagline, description, links)
│   │   ├── tech-stack.ts # ← Slice 10: markdown parser for stack items + scenarios, graph helpers
│   │   ├── nav.ts       # ← Slice 11: nav links, menu items, 404 error page copy (all LocalizedString)
│   │   └── index.ts     # Barrel re-export — import from '$lib/data'
│   ├── components/      # ← Added in Slice 03, enhanced in Slices 04-06, extended in 06d
│   │   ├── Nav.svelte           # ← Slice 11: floating pill nav — wordmark, adaptive links, menu toggle, SplitText anim
│   │   ├── MenuOverlay.svelte  # ← Slice 11: fullscreen metro dashboard menu overlay (CSS transitions, stagger)
│   │   ├── ConstructionScene.svelte # ← Slice 11: inline SVG construction illustration for 404
│   │   ├── Footer.svelte        # minimal footer: brand name, year, social links, 3D model attribution
│   │   ├── TagList.svelte       # string[] → stagger-revealed pill badges
│   │   ├── SectionHeader.svelte # h2 heading + optional subtitle
│   │   ├── ServiceCard.svelte   # ← Slice 09: per-viewport service content block (SVG morph box, stack pills, CTA)
│   │   ├── ServiceStation.svelte # station-sign card: number, indicator light, 400x400 scroll-linked Lottie, tilt
│   │   ├── ScrollPrompt.svelte  # animated scroll-down chevron for hero
│   │   ├── ProjectCard.svelte   # clickable project card with boop hover
│   │   ├── ProjectGrid.svelte   # responsive grid of ProjectCards
│   │   ├── Hero.svelte          # hero block (heading, subheading, CTA buttons)
│   │   ├── HeroBanner.svelte    # ← Slice 06d: split hero with art bg + bold type + typewriter scroll prompt
│   │   ├── SkillsJourney.svelte # ← Slice B/B+: horizontal scroll CTA (5 panels, per-word GSAP anims, MorphSVGPlugin icon morphs, snap)
│   │   ├── FeaturedWork.svelte  # ← Slice 06d: featured projects grid (stop 05)
│   │   ├── AboutBento.svelte    # ← Slice 06d: mini bento grid about teaser (stop 06)
│   │   ├── BlogCard.svelte      # ← Slice 06d: individual blog post card
│   │   ├── BlogFeed.svelte      # ← Slice 06d: latest blog posts section (stop 07)
│   │   ├── BlogListingPage.svelte  # ← Slice 07: shared listing page (search, filters, tag sidebar)
│   │   ├── BlogRow.svelte          # ← Slice 07: post row for listings (SVG, title, excerpt, tags)
│   │   ├── BlogFilterSidebar.svelte # ← Slice 07: desktop tag filter sidebar
│   │   ├── BlogFilterMobile.svelte  # ← Slice 07: mobile filter controls
│   │   ├── BlogDetailHeader.svelte  # ← Slice 07: post detail header (title, date, SVG)
│   │   ├── BlogContent.svelte      # ← Slice 07: rendered markdown with typography styles
│   │   ├── BlogSvgIcon.svelte      # ← Slice 07: SVG renderer with GSAP entrance + MorphSVG hover
│   │   ├── StationDivider.svelte # ← Slice 06d: yellow/black hazard stripe between stops
│   │   ├── StationTabs.svelte      # ← Slice 09: reusable station tab nav (scroll mode + navigate mode)
│   │   ├── ServiceListingPage.svelte # ← Slice 09: full-viewport kinetic scroll layout for /services
│   │   ├── ServiceDetailPage.svelte  # ← Slice 09: consultative deep dive for /services/[id]
│   │   ├── ServiceNav.svelte        # ← Slice 09: prev/next service navigation
│   │   ├── ProofStrip.svelte        # ← Slice 09: bottom strip showing related projects
│   │   ├── ProjectMiniCard.svelte   # ← Slice 09: reusable project card for outside /work
│   │   ├── WorkSvgIcon.svelte       # ← Slice 08: SVG icon renderer with morph on hover
│   │   ├── WorkFilterMobile.svelte  # ← Slice 08: mobile filter controls for /work
│   │   ├── WorkFilterSidebar.svelte # ← Slice 08: desktop filter sidebar for /work
│   │   ├── WorkDetailSidebar.svelte # ← Slice 08: project detail sidebar
│   │   ├── WorkServiceBadge.svelte  # ← Slice 08: service badge with SVG for work cards
│   │   ├── WorkListingPage.svelte   # ← Slice 08: FLIP grid listing for /work
│   │   ├── WorkCard.svelte          # ← Slice 08: project card with gradient thumb + SVG morph
│   │   ├── WorkDetailPage.svelte    # ← Slice 08: project detail with collapsible sections + ToC
│   │   ├── DataFlowDiagram.svelte   # ← Slice 08: tech stack flow visualization
│   │   ├── TableOfContents.svelte   # ← Slice 08: README table of contents
│   │   ├── StackDiagram.svelte      # ← Slice 10: CSS Grid diagram with tier rows + mobile accordion
│   │   ├── StackNode.svelte         # ← Slice 10: tech node button (hover/selected/dimmed/bridge)
│   │   ├── StackConnections.svelte  # ← Slice 10: SVG overlay with DrawSVG + MotionPath dots
│   │   ├── StackPanel.svelte        # ← Slice 10: desktop detail sidebar (markdown content, relations, CTA)
│   │   ├── StackBottomSheet.svelte  # ← Slice 10: mobile detail bottom sheet with swipe dismiss
│   │   ├── StackFilters.svelte      # ← Slice 10: domain filter pill bar (multi-select)
│   │   ├── StackConfigurator.svelte # ← Slice 10: Build Your Stack domain selector
│   │   ├── StackScenarioCard.svelte # ← Slice 10: scenario summary card with recommended stack
│   │   ├── TerminalCursor.svelte    # ← Slice 10: reusable blinking cursor component (standardized to 8x14px block in 17a-2b)
│   │   ├── InfraFrame.svelte        # ← Slice 10: infrastructure monitor frame wrapper
│   │   └── brand/                   # ← Slice 17a-2: brand design system primitives
│   │       ├── index.ts             # Barrel export — import { StatusDot, BrandButton } from '$lib/components/brand'
│   │       ├── StatusDot.svelte     # Pulsing status indicator (color, pulse, size)
│   │       ├── SectionLabel.svelte  # Mono uppercase section labels (text, variant, align)
│   │       ├── StopLabel.svelte     # "STOP XX" bento card labels (stop, label)
│   │       ├── Tag.svelte           # Tag/badge pill (text, size, active, accentColor)
│   │       ├── NumberBadge.svelte   # Numbered circle badge (value, color, sonar)
│   │       ├── ChevronToggle.svelte # Animated expand/collapse chevron (open, size)
│   │       ├── HazardStripe.svelte  # Orange diagonal stripe divider (size, angle, label)
│   │       ├── GlowOverlay.svelte   # Cursor-following glow overlay (intensity)
│   │       ├── MetricDisplay.svelte # Value + label metric (value, label, sublabel, labelBelow)
│   │       ├── BrandButton.svelte   # Standardized CTA button (variant, size, href)
│   │       ├── CardBase.svelte      # Card wrapper (hover, glow, interactive, padding)
│   │       ├── CornerMarks.svelte   # Blueprint corner tick marks (size, opacity)
│   │       ├── TerminalChrome.svelte # Terminal window frame (title, tag, status, footer, noPadding)
│   │       ├── StickyPanel.svelte   # Sticky sidebar wrapper (top)
│   │       ├── GradientSeparator.svelte # Animated gradient line (label, maxWidth)
│   │       └── __tests__/           # Co-located tests for all primitives
│   └── motion/          # ← Added in Slice 04
│       ├── actions/
│       │   ├── boop.ts          # use:boop — hover transform burst
│       │   ├── reveal.ts        # use:reveal — scroll-triggered GSAP entrance
│       │   ├── magnetic.ts      # use:magnetic — cursor pull on desktop
│       │   ├── ripple.ts        # use:ripple — orange click ripple
│       │   ├── tilt.ts          # use:tilt — 3D card tilt following cursor (slice 06b)
│       │   ├── cursorGlow.ts    # use:cursorGlow — mouse-tracking brand glow overlay (slice 17a-2b)
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
│       │   ├── gsap.ts          # registerGsapPlugins(), re-exports gsap/ScrollTrigger/SplitText/MorphSVGPlugin
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
    ├── +error.svelte    # ← Slice 11: branded 404 page — construction scene, hazard tapes, route suggestions
    ├── +layout.svelte   # Root layout: Nav + ScrollRail + page content + Footer + page transitions
    ├── +page.ts         # SSR disabled (Three.js/GSAP need browser APIs)
    ├── +page.svelte     # Home: hero + SkillsJourney horizontal scroll + services + projects + about + blog + CTA
    ├── blog/            # ← Slice 07: blog system
    │   ├── +page.svelte     # Professional blog listing
    │   ├── +page.ts         # Loads professional posts, tags, SVGs
    │   ├── personal/
    │   │   ├── +page.svelte # Personal Corner listing (yellow accent)
    │   │   └── +page.ts     # Loads personal posts, tags, SVGs
    │   └── [slug]/
    │       ├── +page.svelte # Post detail page (centered max-w-2xl)
    │       └── +page.ts     # Loads post data, SVG, rendered HTML
    ├── services/        # ← Slice 09: services system
    │   ├── +page.svelte     # Services listing (full-viewport scroll)
    │   ├── +page.ts         # Loads all visible services, SVGs, project maps
    │   └── [id]/
    │       ├── +page.svelte # Service detail page
    │       └── +page.ts     # Loads service by ID, adjacent services, related projects
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

**SEO schema (Slice 12):** `buildPersonSchema(siteMeta)` in `src/lib/data/schema.ts` produces a JSON-LD Person schema injected into `<svelte:head>` via `+layout.svelte`. All schema fields (name, jobTitle, address, sameAs, knowsAbout) pull from `siteMeta.owner`.

**Shared motion actions:** `wordmarkHover` in `src/lib/motion/actions/wordmarkHover.ts` encapsulates the GSAP SplitText animation pool (bounce, wiggle, wave, spin + dot pulse) used by both `Nav.svelte` and `Footer.svelte`.

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
| `marked` | ^* | Markdown-to-HTML rendering for blog posts (used instead of mdsvex for content) |
| `mdsvex` | ^* | Svelte markdown preprocessor (enables `.md` as SvelteKit page extension) |

## Blog System (Slice 07)

Two content lanes served from markdown files at build time:

```
src/content/blog/
├── professional/                # Orange accent (#E07800) — data, SQL, infra
│   ├── why-i-left-orm-for-raw-sql/index.md
│   ├── building-a-transit-pipeline/index.md
│   ├── anime-data-viz-challenge/index.md
│   ├── lorem-data-warehousing/index.md
│   └── lorem-etl-patterns/index.md
├── personal/                    # Yellow accent (#FFB627) — trains, space, etc.
│   ├── lorem-transit-future/index.md
│   └── lorem-space-exploration/index.md
└── _template.md                 # Copy-paste starting point for new posts

src/routes/blog/
├── +page.svelte / +page.ts      # Professional listing
├── personal/
│   └── +page.svelte / +page.ts  # Personal Corner listing
└── [slug]/
    └── +page.svelte / +page.ts  # Post detail
```

### Data flow

1. `import.meta.glob('../../content/blog/**/*.md', { as: 'raw', eager: true })` loads all markdown at build time
2. `parseFrontmatter()` extracts YAML metadata (title, date, tags, lang, category, animation, svg)
3. `BlogPost[]` objects are created with resolved slugs, SVG paths, and fallback values
4. Route `+page.ts` loaders filter by category and resolve SVG contents
5. `marked` renders markdown body to HTML on the detail page
6. `BlogListingPage` renders listings with search/filter; `BlogDetailHeader` + `BlogContent` render detail

### Key types

```ts
type BlogCategory = 'professional' | 'personal';
type BlogAnimation = 'draw' | 'morph' | 'draw-fill' | 'stagger';

interface BlogPost {
  slug: string;
  title: LocalizedString;
  date: string;          // YYYY-MM-DD
  excerpt: LocalizedString;
  lang: Locale;
  category: BlogCategory;
  tags: string[];
  animation: BlogAnimation;
  svg: string;           // resolved path to SVG illustration
}
```

### SVG illustrations

- Each post can specify `svg: name` in frontmatter for a custom illustration
- Without one, `resolveSvgFallbackName(slug)` picks a deterministic fallback from slug hash
- `BlogSvgIcon` component renders SVG + applies GSAP entrance animation (draw/morph/draw-fill/stagger)
- Hover: MorphSVGPlugin morphs all paths to a random geometric shape; mouseleave morphs back
- Mobile: tap toggles the morph effect

### Filtering (client-side)

- Search: matches title + excerpt (case-insensitive)
- Tags: chip-based sidebar filter (multi-select)
- Date range: native HTML date inputs
- Language: dropdown filter on post `lang` field

## Static Assets

```
static/
├── images/              # Hero background art
├── models/              # 3D assets (metro-wagon.glb)
├── lottie/              # Station Lottie animations
└── svg/                 # ← Slice B+: shape morph reference SVGs (foundation, data, logic, etc.)
```
