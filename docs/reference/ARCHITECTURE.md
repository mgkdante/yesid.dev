# Architecture

**Last updated:** 2026-04-20 (Slice 17c — Zod schema validation at adapter boundary)

## Stack

| Layer | Tech | Why |
|-------|------|-----|
| Framework | SvelteKit 2 + Svelte 5 | Compiles away the framework; lean output; runes model is explicit and predictable |
| Language | TypeScript 5.9 | Type safety across data layer and components; catches errors at build time |
| Styling | Tailwind CSS v4 | CSS-first config via `@theme`; no JS config file; co-exists with custom CSS variables |
| Runtime | Bun | Faster installs and script execution than Node.js |
| Deployment | Vercel (adapter-vercel) | Zero-config deploys; Node.js 22 runtime |
| UI library | shadcn-svelte + Bits UI | Accessible headless primitives; cn() + data-slot conventions |
| Unit tests | Vitest 4 | Native ESM; fast; happy-dom environment for Svelte component tests |
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
│   │   └── tokens.css   # CSS custom properties for theme switching (--background, --foreground, etc.)
│   ├── types.ts         # ← Slice 17b: shared types promoted to top-level (Project, Service, LocalizedString, etc.)
│   ├── content/         # ← Slice 17b: typed seed data + UI chrome (split from old data/)
│   │   ├── projects.ts  # Project seed + projectsListingContent + projectsDetailContent + projectsPageMeta (17b-7d/e/k)
│   │   ├── services.ts  # Service seed + servicesListingContent + servicesDetailContent + servicesPageMeta (17b-7f/k)
│   │   ├── blog.ts      # Blog posts from markdown (import.meta.glob) + blogListingContent + blogDetailContent (17b-7b/c)
│   │   ├── site-content.ts # hero, about, CTA, services grid, closer, related-projects strip, footer chrome
│   │   ├── nav.ts       # nav links, menu items, metro bookends, navDirections, sharedChromeContent, errorPageContent
│   │   ├── about-page.ts # AboutContent (identity, metrics, testimonials, stopLabels, meta)
│   │   ├── contact-page.ts # ContactContent (terminals, validation, success, meta)
│   │   ├── meta.ts      # SiteMeta (name, tagline, description, links)
│   │   ├── tech-stack.ts # markdown-parsed stack + scenarios + techStackPageContent + techStackVizContent
│   │   ├── hero-data.ts # STM_ROUTES seed + generateHeroData factory
│   │   ├── integrity.test.ts # ← Slice 17b: seed-data + LocalizedString guard + translation-debt snapshot (17b-8)
│   │   └── index.ts     # Barrel — re-exports every content module. Imported by adapters/static.ts.
│   ├── utils/           # ← Slice 17b: pure engines (previously mixed into data/)
│   │   ├── locale.ts    # resolveLocale(), DEFAULT_LOCALE, SUPPORTED_LOCALES
│   │   ├── markdown.ts  # shared Shiki + marked config (brand-themed syntax highlighting)
│   │   ├── weather.ts   # Montreal weather fetcher (wttr.in)
│   │   ├── service-svg.ts # per-service SVG loader
│   │   ├── json-ld.ts   # structured-data builder (Person schema)
│   │   ├── stack-roles.ts # tech stack item role classification
│   │   ├── cn.ts        # shadcn-svelte cn() helper (moved from $lib/utils.ts in 17b-1)
│   │   └── index.ts     # Barrel
│   ├── adapters/        # ← Slice 17b-2: hexagonal port layer
│   │   ├── types.ts     # ContentAdapter interface + six port interfaces
│   │   ├── static.ts    # staticAdapter — the ONLY module that imports $lib/content/*; every content-returning port now wraps through parsePort (17c)
│   │   ├── adapter.test.ts # 37 contract-level tests
│   │   └── index.ts     # one-line swap point for future CMS adapters
│   ├── schemas/         # ← Slice 17c: Zod contracts validated at adapter boundary
│   │   ├── parse.ts     # parsePort(label, schema, value) — tags thrown errors with `[adapter.<label>]`
│   │   ├── shared.ts    # LocalizedStringSchema, LocaleSchema, PageMetaSchema (cross-cutting primitives)
│   │   ├── project.ts / service.ts / blog.ts / meta.ts / tech-stack.ts / nav.ts / journey.ts / hero-data.ts / about-page.ts / contact-page.ts / tech-stack-page.ts  # domain schemas with bidirectional drift detectors
│   │   ├── seo.ts       # PageSeoSchema (15a) — routes via meta.forRoute
│   │   ├── jsonld.ts    # SchemaOrgNode discriminated union (15b) — JSON-LD graph
│   │   └── index.ts     # Barrel — single import surface; adapter imports schemas from here
│   ├── repositories/    # ← Slice 17b-3: async facade consumed by route loaders
│   │   ├── project.ts   # getPublicProjects, getProjectBySlug, getFeaturedProjects, etc.
│   │   ├── service.ts   # getVisibleServices + metro-line derivation
│   │   ├── blog.ts      # getAllPosts, getPostBySlug, etc.
│   │   ├── meta.ts      # getSiteMeta + getPageSeo (forRoute wrapper; Slice 15b dropped the Slice 12 getPersonSchema composer)
│   │   ├── tech-stack.ts
│   │   ├── content.ts   # getHeroData, getAboutPageContent, getMetroBookends, etc.
│   │   └── index.ts     # Barrel
│   ├── components/      # ← Added in Slice 03, enhanced through Slice 17d
│   │   │
│   │   │  ## Component Tiers (3 tiers — shells/ tier DELETED in 17d)
│   │   │  1. ui/     — shadcn-svelte headless primitives (Bits UI)
│   │   │  2. brand/  — hand-built brand atoms (design system)
│   │   │  3. domain  — page/feature components (home/, blog/, projects/, services/, etc.)
│   │   │
│   │   │  ## Layout System (CSS Grid Recipes — replaced SectionWrapper/EdgeRail/ListingLayout)
│   │   │  All pages use CSS Grid Recipes directly. No shell abstraction layer.
│   │   │  Recipe 1: Full-Bleed        — single column, 100vw
│   │   │  Recipe 2: Contained         — max-width centered
│   │   │  Recipe 3: Content+Sidebars  — TOC | content | glance panel
│   │   │  Recipe 4: Edge Title Grid   — rotated edge title | content
│   │   │  See CONSTITUTION.md Section 2 for grid templates.
│   │   │
│   │   │  ## Card Surface (unified in 17d)
│   │   │  All card-like elements use ui/card. Single source of truth for
│   │   │  background, border, radius, padding. Wrapper <div> pattern for
│   │   │  use: actions (actions can't go on components).
│   │   │
│   │   ├── Nav.svelte           # ← Slice 11: floating pill nav — wordmark, adaptive links, menu toggle, SplitText anim
│   │   ├── MenuOverlay.svelte  # ← Slice 11: fullscreen metro dashboard menu overlay (CSS transitions, stagger)
│   │   ├── ConstructionScene.svelte # ← Slice 11: inline SVG construction illustration for 404
│   │   ├── Footer.svelte        # minimal footer: brand name, year, social links, 3D model attribution
│   │   ├── TagList.svelte       # string[] → stagger-revealed pill badges
│   │   ├── ServiceCard.svelte   # ← Slice 09: per-viewport service content block (SVG morph box, stack pills, CTA)
│   │   ├── ServiceStation.svelte # station-sign card: number, indicator light, 400x400 scroll-linked Lottie, tilt
│   │   ├── ScrollPrompt.svelte  # animated scroll-down chevron for hero
│   │   ├── ProjectGrid.svelte   # responsive grid of ProjectCards
│   │   ├── HeroBanner.svelte    # ← Slice 06d: split hero with art bg + bold type + typewriter scroll prompt
│   │   ├── SkillsJourney.svelte # ← Slice B/B+: horizontal scroll CTA (5 panels, per-word GSAP anims, MorphSVGPlugin icon morphs, snap)
│   │   ├── FeaturedWork.svelte  # ← Slice 06d: featured projects grid (stop 05)
│   │   ├── BlogFeed.svelte      # ← Slice 06d: latest blog posts section (stop 07)
│   │   ├── BlogListingPage.svelte  # ← Slice 07/17d: listing page with CSS Grid Recipe layout
│   │   ├── BlogRow.svelte          # ← Slice 07/17d: post row using ui/card
│   │   ├── BlogFilterSidebar.svelte # ← Slice 07: desktop tag filter sidebar
│   │   ├── BlogFilterMobile.svelte  # ← Slice 07: mobile filter controls
│   │   ├── BlogDetailPage.svelte    # ← Slice 17d: blog detail orchestrator (4-zone body grid, TOC, edge labels, reading mode)
│   │   ├── BlogDetailHeader.svelte  # ← Slice 17d: full-bleed magazine cover header (rebuilt from scratch)
│   │   ├── BlogContent.svelte      # ← Slice 07: rendered markdown with typography styles
│   │   ├── BlogTocPill.svelte      # ← Slice 17d: floating mobile TOC pill
│   │   ├── BlogSvgIcon.svelte      # ← Slice 07: SVG renderer with GSAP entrance + MorphSVG hover
│   │   ├── StationDivider.svelte # ← Slice 06d: yellow/black hazard stripe between stops
│   │   ├── StationTabs.svelte      # ← Slice 09/17d: reusable station tab nav (scroll mode + navigate mode)
│   │   ├── ServiceListingPage.svelte # ← Slice 09/17d: full-viewport kinetic scroll layout for /services
│   │   ├── ServiceDetailPage.svelte  # ← Slice 17d: asymmetric split detail with impact metrics
│   │   ├── ServiceNav.svelte        # ← Slice 09: prev/next service navigation
│   │   ├── ProofStrip.svelte        # ← Slice 09: bottom strip showing related projects
│   │   ├── ProjectMiniCard.svelte   # ← Slice 09: reusable project card for outside /projects
│   │   ├── WorkSvgIcon.svelte       # ← Slice 08: SVG icon renderer with morph on hover
│   │   ├── WorkFilterMobile.svelte  # ← Slice 08: mobile filter controls for /projects
│   │   ├── WorkFilterSidebar.svelte # ← Slice 08: desktop filter sidebar for /projects
│   │   ├── WorkDetailSidebar.svelte # ← Slice 08: project detail sidebar
│   │   ├── WorkServiceBadge.svelte  # ← Slice 08: service badge with SVG for project cards
│   │   ├── WorkListingPage.svelte   # ← Slice 08: FLIP grid listing for /projects
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
│   │   ├── ui/                      # ← Slice 17a-6/17d: shadcn-svelte scaffolded components (56 total, 15 customized)
│   │   │   ├── button/              # Button (cta, ghost, outline, link variants)
│   │   │   ├── badge/               # Badge (tag, number variants)
│   │   │   ├── separator/           # Separator (hazard, gradient variants)
│   │   │   ├── card/                # Card (single unified surface — replaces .bento-card + CardBase)
│   │   │   ├── dialog/              # Dialog (Bits UI headless + brand styling)
│   │   │   ├── collapsible/         # Collapsible (accordion sections)
│   │   │   ├── tabs/                # Tabs (station tab navigation)
│   │   │   ├── toggle-group/        # Toggle group (filter groups)
│   │   │   └── ...                  # 48 more scaffolded components
│   │   └── brand/                   # ← Slice 17a-2/17d: hand-built brand primitives + blueprint SVGs (13 .svelte)
│   │       ├── index.ts             # Barrel export — import { StatusDot } from '$lib/components/brand'
│   │       ├── StatusDot.svelte     # Pulsing status indicator (color, pulse, size, ring — 17a-4)
│   │       ├── SectionLabel.svelte  # Mono uppercase section labels (text, variant, align)
│   │       ├── SectionHeading.svelte # Display-size section heading (title, variant) — 17a-2a
│   │       ├── StopLabel.svelte     # "STOP XX" bento card labels (stop, label)
│   │       ├── MetroStation.svelte  # Numbered metro station marker with sonar pulse — 17d
│   │       ├── ChevronToggle.svelte # Animated expand/collapse chevron (open, size)
│   │       ├── GlowOverlay.svelte   # Cursor-following glow overlay (intensity)
│   │       ├── MetricDisplay.svelte # Value + label metric (value, label, sublabel, labelBelow)
│   │       ├── CornerMarks.svelte   # Blueprint corner tick marks (size, opacity)
│   │       ├── TerminalChrome.svelte # Terminal window frame (title, tag, status, footer, noPadding)
│   │       ├── StickyPanel.svelte   # Sticky sidebar wrapper (top)
│   │       ├── SvgIcon.svelte       # Shared SVG icon renderer (from inlined sources) — 17d
│   │       ├── BlueprintShell.svelte # ← Slice 17d: moved from deleted shells/, blueprint header container
│   │       ├── blueprints/          # ← Slice 17d: 12 inline Svelte SVGs (currentColor, zero hardcoded hex)
│   │       └── __tests__/           # Co-located tests for all primitives
│   │       # Migrated to shadcn ui/ in 17d: Tag + NumberBadge → ui/badge; HazardStripe + GradientSeparator → ui/separator;
│   │       # BrandButton → ui/button; CardBase → ui/card. Mapping in brand/index.ts header comment.
│   └── motion/          # ← Added in Slice 04; re-engineered in Slice 17e
│       ├── actions/             # Interaction signatures (5 of the 9)
│       │   ├── boop.ts          # use:boop — hover transform burst
│       │   ├── cursorGlow.ts    # use:cursorGlow — mouse-tracking brand glow overlay
│       │   ├── magnetic.ts      # use:magnetic — cursor pull on desktop
│       │   ├── morphHover.ts    # use:morphHover — SVG path morph on hover/tap (17e-5)
│       │   ├── wordmarkHover.ts # use:wordmarkHover — SplitText pool for "yesid." wordmark
│       │   ├── scrollChain.ts   # use:scrollChain — utility, chain scroll events across elements
│       │   └── index.ts
│       ├── scrubs/              # Scroll-linked factories (signatures 5–7) — added 17e-3 + 17e-4
│       │   ├── createCrescendoScrub.ts   # scale/opacity scrub as section passes
│       │   ├── createDrawScrub.ts        # DrawSVG stroke-scrub as section passes
│       │   ├── createHeroTimeline.ts     # 9-phase hero pin — the site's only pin
│       │   └── index.ts
│       ├── stores/
│       │   ├── reducedMotion.ts # prefersReducedMotion store + isPrefersReducedMotion()
│       │   ├── scroll.ts        # scrollProgress store (0–1)
│       │   └── index.ts
│       ├── components/
│       │   └── LottiePlayer.svelte  # lottie-web wrapper (autoplay + scrub mode for scroll-linked frames)
│       ├── svg/                 # Motion-owned SVG components
│       │   └── MetroNetwork.svelte  # Hero metro SVG, inlined via Vite `?raw` (17e-4)
│       ├── utils/               # Infrastructure
│       │   ├── device.ts        # isTouchDevice() helper
│       │   ├── flip.ts          # captureFlipState + animateFlipTransition (FLIP filter-sort primitives)
│       │   ├── gsap.ts          # initScrollTriggerConfig + ensureSplitTextRegistered + 6 lazy loaders (17e-5 D269)
│       │   ├── heroTypewriter.ts # Typewriter ambient (signature 9) — shared-ticker based
│       │   ├── lenis.ts         # Lenis smooth-scroll bridge (normalizeScroll removed 17e-1)
│       │   ├── morphHelpers.ts  # convertSvgToMorphPaths wrapper around MorphSVGPlugin
│       │   ├── stagger.ts       # stagger(index, baseDelay) timing calculator
│       │   ├── ticker.ts        # Shared gsap.ticker fan-out (17e-1)
│       │   └── index.ts
│       ├── tokens.ts            # TS mirror of motion tokens in tokens.css (17e-1)
│       └── index.ts             # top-level barrel — import from '$lib/motion'
│
│   # Deleted in 17e (retained here for git-history grep): motion/components/ScrollRail.svelte,
│   # motion/svg/Train* tree (Train.svelte, TrainJourney.svelte, train-path.ts, train-targets.ts),
│   # motion/actions/reveal.ts, ripple.ts, tilt.ts, motion/utils/heroTimeline.ts,
│   # motion/utils/heroScrollLock.ts, motion/utils/listingAnimations.ts,
│   # motion/components/ReadingProgressBar.svelte (17e-5).
│   # Full motion reference: docs/reference/MOTION.md v2.0
├── content/             # ← Added in Slice 06d
│   └── blog/            # Markdown blog posts with YAML frontmatter
│       ├── why-i-left-orm-for-raw-sql.md
│       ├── building-a-transit-pipeline.md
│       └── anime-data-viz-challenge.md
└── routes/
    ├── +error.svelte    # ← Slice 11: branded 404 page — construction scene, hazard tapes, route suggestions
    ├── +layout.svelte   # Root layout: Nav + ScrollRail + page content + Footer + page transitions
    ├── +page.ts         # SSR disabled (GSAP/lottie-web need browser APIs)
    ├── +page.svelte     # Home: hero + SkillsJourney horizontal scroll + services + projects + about + blog + CTA
    ├── blog/            # ← Slice 07: blog system
    │   ├── +page.svelte     # Professional blog listing
    │   ├── +page.ts         # Loads professional posts, tags, SVGs
    │   ├── personal/
    │   │   ├── +page.svelte # Personal Corner listing (yellow accent)
    │   │   └── +page.ts     # Loads personal posts, tags, SVGs
    │   └── [slug]/
    │       ├── +page@.svelte # ← Slice 17d-4: full-bleed detail (bypasses root layout)
    │       └── +page.ts     # Loads post data, SVG, rendered HTML, postIndex
    ├── services/        # ← Slice 09: services system
    │   ├── +page.svelte     # Services listing (full-viewport scroll)
    │   ├── +page.ts         # Loads all visible services, SVGs, project maps
    │   └── [id]/
    │       ├── +page.svelte # Service detail page
    │       └── +page.ts     # Loads service by ID, adjacent services, related projects
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

**SEO JSON-LD (Slice 15b):** `src/lib/adapters/jsonld.ts` exports typed factories (`buildPersonNode`, `buildWebSiteNode`, `buildBlogPostingNode`, `buildServiceNode`, `buildCreativeWorkNode`, `buildBreadcrumbListNode`, `buildProfilePageNode`, `buildCollectionPageNode`) that map domain objects (from `$lib/content/*` + `siteMeta`) to `SchemaOrgNode`s validated by `src/lib/schemas/jsonld.ts`. Per-route `jsonLd` fields live in `routeSeoEntries` (`src/lib/content/meta.ts`); the layout-authoritative `<SeoHead>` component mounts `<JsonLd>` as a child, and `<JsonLd>` emits one `<script type="application/ld+json">` per page wrapping all nodes in `@graph` with `@id` cross-references anchored at `https://yesid.dev/#person` and `https://yesid.dev/#website`.

**Schema validation at the adapter boundary (Slice 17c):** Every `staticAdapter` port that returns content data parses through a Zod schema from `src/lib/schemas/` before handing off to the repository layer. `parsePort(label, schema, value)` tags thrown errors with the port they originated in (e.g. `[adapter.projects.all] ...`), so contract violations from any adapter (static today, Payload in Slice 18) are immediately attributable via the stack trace. The schema layer is the runtime contract: TypeScript catches build-time errors, Zod catches runtime errors from external data. Each schema mirrors its TS interface field-for-field with a bidirectional drift detector (`z.infer extends T ? T extends z.infer ? true : false`) so adding or removing a field on either side fails to compile. Site-chrome literals (`heroContent`, `manifestoContent`, etc.) stay unvalidated by design (spec D2) — they're typeof-literal types consumed via the ContentPort typing strategy, not CMS-managed content.

**Shared motion actions:** `wordmarkHover` in `src/lib/motion/actions/wordmarkHover.ts` encapsulates the GSAP SplitText animation pool (bounce, wiggle, wave, spin + dot pulse) used by both `Nav.svelte` and `Footer.svelte`.

### Two-repo topology (Slice 18 onwards)

Starting Slice 18, yesid.dev's content layer splits across **two repos** that deploy independently:

| Repo | Role | Runtime | Deploys to |
|------|------|---------|------------|
| `yesid.dev` | SvelteKit site — consumes content via Payload REST API | bun | yesid.dev |
| [`yesid.dev-cms`](https://github.com/mgkdante/yesid.dev-cms) | Payload 3 + Next.js admin + REST/GraphQL API + **MCP endpoint** + DB schema | bun (Node 22) | cms.yesid.dev |

**Infrastructure** (Slice 18a — shipped 2026-04-21):

- **Database:** Neon Postgres 17 (free tier, scale-to-zero, DB branching per PR). Project `yesid-dev-cms` in org `Yesid`, `production` branch for prod, `dev` branch for local.
- **Media storage:** Vercel Blob (plugin registered but empty `collections` — activates in 18b when Media collection flips).
- **Email:** Resend (no-reply@cms.yesid.dev sender; DNS verification deferred to 18b).
- **MCP surface:** `@payloadcms/plugin-mcp` at `https://cms.yesid.dev/api/mcp` — authenticated via per-user API keys from admin UI; exposes `site-meta` global in 18a, content collections get exposed as they land in 18b.

**Migration pipeline** (Slice 18a done; 18b-18f planned):

- 18a ships the infrastructure: repo scaffolded, Payload + Next.js + Postgres adapter wired, `push: false` migrations-only schema, `prodMigrations` for Vercel cold-start runtime migrate, `onInit` bootstrap hook (idempotent admin creation from env vars, rotated + vars removed after first login). Single `site-meta` heartbeat global proves the stack.
- 18b adds all content collections + globals + seed script imports from `yesid.dev` TS/MD.
- 18c adds the type-sync GitHub Action (`payload generate:types` → PR in `yesid.dev` updating `src/lib/cms-types.ts`) + the first service swap (`site-meta`) from static adapter to Payload REST behind a feature flag, using the 17c Zod schema boundary.
- 18d swaps the remaining globals; 18e swaps the dynamic collections; 18f wires publish-webhook revalidation + preview route + deletes the old TS/MD content files.

**Slice 18 bundle docs** live under `docs/slices/slice-18/slice-18<letter>/` in this repo. The CMS repo holds code only during the migration; it grows its own `docs/slices/` when it spins out as a public framework-agnostic template (Phase C2+).

### Content model (Slice 18b — shipped 2026-04-21)

`yesid.dev-cms` now holds the full content layer for `yesid.dev`. Schema + migration + seed landed in 18b; the frontend still reads static TS/MD in this repo until 18c+ swaps each service onto the Payload REST API.

**Collections (hub-first order in admin sidebar):** `tech-stack` → `services` → `projects` → `blog-posts` → `stack-scenarios`. Users + Media under System.

**Globals (site-walk order, Pages group):** `home-content`, `services-page`, `projects-page`, `blog-page`, `tech-stack-page`, `about-content`, `contact-content`, `nav-links`, `error-pages`, `site-meta`.

**Relationship topology (D-rel-1):** projects + services are source-of-truth for tech references; `tech-stack.relatedProjects` + `relatedServices` are Payload `join` fields auto-computed from the forward side. `services.relatedProjects` similarly join-computed from `projects.services`. No manual sync hooks; no two-place drift.

**Tech-stack is flat in 18b (D-rel-2).** No inter-tech graph — deferred to a future engine-builder slice. Tech-tech relatedness stays implicit (shared projects/services, query-time). `project.tags` + `blog.tags` stay free-string arrays per D-rel-3 — no `tags` collection.

**Custom primary keys:** `tech-stack.id`, `services.id`, `stack-scenarios.id` are user-authored text fields that Payload treats as document IDs. A `beforeChange` field hook forces `siblingData.id = originalDoc.id` on every update (silent-override) to block API-level renames while keeping the field present for `required: true` validation.

**Localization:** `localized: true` on every user-facing prose field per D4. Enum/URL/id/slug/filename/boolean fields stay canonical across locales. Locale config `en` (required) + `fr` + `es` (optional) with fallback.

**MCP surface:** every collection + global exposed via `@payloadcms/plugin-mcp` at `/api/mcp` with `find` + `update` tools. Exceptions: `users` (admin-only) + `media` (multipart uploads don't fit MCP JSON-RPC today).

**Media storage:** Vercel Blob-backed (`vercelBlobStorage.collections.media: true` flipped in 18b-9). `imageSizes` (thumbnail 200×200, card 600×400, hero 1200×800) generated server-side via `sharp`. Localized `alt` + `caption`, non-localized `credit`.

**Email:** Resend sender `no-reply@cms.yesid.dev` verified via DKIM + SPF DNS in 18b-9 (Cloudflare zone `yesid.dev`). Handles admin password-reset + future editor-invitation + programmatic sends.

**Seed:** `yesid.dev-cms/scripts/seed/` — idempotent one-shot import from this repo's `src/lib/content/*.ts` + `src/content/**/*.md`. Upsert by slug/id; re-run safe; preserves admin-UI edits outside seed-sourced fields. Seed uses `locale: 'all'` on every create/update so object-shaped localized-field values are treated as per-locale maps (fix landed in 18b-9 after discovery that default locale context double-encodes to JSON strings).

**Migration count on prod Neon branch:** 2 (`20260421_035719` baseline + `20260421_204630` consolidated 18b). Future schema changes accumulate as new migrations; Vercel's `prodMigrations` cold-start applies them in order.

**Carry-forward for 18c:** type-sync GitHub Action (mirrors `payload-types.ts` → `yesid.dev/src/lib/cms-types.ts`), Zod schemas at the adapter boundary (handle `string | { en, fr?, es? }` shape for localized fields), first service swap (`site-meta`) behind feature flag.

## CSS Architecture

Two systems coexist and serve different purposes:

| System | Example | Purpose |
|--------|---------|---------|
| CSS custom properties (`tokens.css`) | `var(--background)`, `var(--foreground)` | Theme-switching colors; background/foreground pairs |
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
| `bits-ui` | ^2.16.3 | Headless accessible UI primitives (Dialog, Tabs, Collapsible, etc.) |
| `vaul-svelte` | ^1.0.0-next.7 | Drawer/bottom sheet primitive (used by StackBottomSheet) |
| `paneforge` | ^* | Resizable split panels (used by ContactPage) |
| `vitest` | ^4.1.0 | Unit test runner |
| `@testing-library/svelte` | ^5.3.1 | Svelte component testing utilities |
| `@playwright/test` | ^1.58.2 | E2E browser testing |
| `happy-dom` | ^20.8.9 | DOM environment for unit tests (2-4x faster than jsdom) |
| `marked` | ^* | Markdown-to-HTML rendering for blog posts (used instead of mdsvex for content) |
| `shiki` | ^* | Syntax highlighting for code blocks (brand theme: orange/yellow/warm) |
| `@fontsource-variable/inter` | ^* | Self-hosted Inter variable font (replaces Google Fonts CDN) |
| `@fontsource-variable/jetbrains-mono` | ^* | Self-hosted JetBrains Mono variable font |
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
6. `BlogDetailPage` orchestrates the detail view: full-bleed header + 4-zone body grid + sticky TOC
7. `highlight.ts` provides shared Shiki + marked config for brand-colored syntax highlighting (blog + project README)

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
