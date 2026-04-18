# yesid. Pipeline — Master Plan

**Owner:** Yesid O.
**Started:** April 2026
**Current phase:** A — Portfolio Site
**Future phases:** See docs/roadmap/FUTURE_PHASES.md (parked, not active)

## Goal

Ship yesid.dev as a memorable, motion-driven portfolio site with a scroll-based train journey, interactive 3D elements, and polished micro-interactions. The site is a platform, not a snapshot. Projects, services, and positioning are data that flows into reusable, animated components.

## Design Principles

1. **Data-driven.** Projects, services, skills, and links live in typed data files. The site renders whatever the data contains. Adding a project = adding one object to a file.
2. **Motion-first.** Every component ships with its animation behavior from day one. Motion is not decoration; it follows the "data in transit" metaphor defined in `docs/reference/MOTION.md`.
3. **Componentized.** Every repeating UI pattern is a reusable component. Pages compose components. Components don't know about specific projects.
4. **Tested.** Every component and data layer ships with tests. Tests run on every push. If tests don't pass, code doesn't merge.
5. **Brand-consistent.** All colors, fonts, spacing come from tokens. Brand guide is source of truth for visuals, MOTION.md is source of truth for movement.
6. **Growable.** Architecture supports new sections (blog, case studies, services) without restructuring.
7. **Dark-first.** Dark theme ships in v1. Light theme is a future toggle.
8. **Progressive.** Full experience on desktop (3D + Lottie + scroll choreography).
9. **i18n-ready.** Data layer supports English, French, and Spanish from day one. English ships first. Translations added without refactoring.

## Tech Stack


| Layer                | Choice                                               | Why                                             |
| -------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| Runtime              | Bun                                                  | Learning opportunity, fast, npm-compatible      |
| Framework            | SvelteKit 2 + Svelte 5                               | Already invested (Rail), fast, good DX          |
| Language             | TypeScript                                           | Type safety for data, catches errors early      |
| Styling              | Tailwind CSS + tokens.css                            | Brand config exists as tailwind.brand.js        |
| Fonts                | Inter + JetBrains Mono                               | Brand standard, Google Fonts                    |
| 3D                   | Threlte (@threlte/core + @threlte/extras) + Three.js | Svelte-native 3D, declarative, typed            |
| Scroll animation     | GSAP + ScrollTrigger                                 | Industry standard, scroll-linked timelines      |
| Illustrated motion   | Lottie (lottie-web)                                  | Lightweight vector animations for train + icons |
| Unit/Component Tests | Vitest + @testing-library/svelte                     | Fast, native SvelteKit integration              |
| E2E Tests            | Playwright                                           | Browser-level confidence                        |
| CI                   | GitHub Actions                                       | Runs tests + lint on every push/PR              |
| CD                   | Vercel                                               | Auto-deploy main, preview deploys on PRs        |
| Data                 | TypeScript files (no CMS, no DB)                     | Simple, version controlled, type-checked        |


## Site Architecture

```
Routes:
  /                  -> Home (train journey: hero → stations → CTA)
  /work              -> Project index (card grid, filterable by tag)
  /work/[slug]       -> Project detail (rendered from data)
  /services          -> Services index (all capabilities, linked to projects)
  /services/[id]     -> Service detail (deep dive, related projects, stack)
  /about             -> Bio, focus areas, skills
  /contact           -> Links (email, GitHub, LinkedIn, Upwork)

Data files:
  src/lib/data/types.ts       -> LocalizedString, Project, Service, SiteMeta interfaces
  src/lib/data/projects.ts    -> Project[] array
  src/lib/data/services.ts    -> Service[] array (station content)
  src/lib/data/meta.ts        -> Site-wide metadata (name, tagline, links)

Motion system (historical PLAN snapshot — post-17e reality differs: see docs/reference/ARCHITECTURE.md):
  src/lib/motion/actions/     -> Svelte actions
  src/lib/motion/stores/      -> Scroll position, reduced-motion preference
  src/lib/motion/components/  -> LottiePlayer (post-17e)
  src/lib/motion/svg/         -> SVG train component
  src/lib/motion/utils/       -> GSAP helpers (lazy plugin loaders, shared ticker, scrub factories)

Components:
  ProjectCard         -> Renders a project summary (with boop hover + reveal entrance)
  ProjectGrid         -> Renders a filterable grid with FLIP animation
  ServiceStation      -> Renders a service as a "station" in the journey
  TagList             -> Renders tech stack tags (with stagger entrance)
  SectionHeader       -> Consistent section headings
  Nav                 -> Responsive nav with wordmark
  Footer              -> Minimal footer
  Hero                -> 3D scene + SVG train + tagline overlay
```

## Data Interfaces

```typescript
type Locale = 'en' | 'fr' | 'es'

type LocalizedString = {
  en: string
  fr?: string
  es?: string
}

interface Project {
  slug: string                    // NOT localized, URL-safe
  title: LocalizedString
  oneLiner: LocalizedString
  description: LocalizedString
  stack: string[]                 // NOT localized, tech names are universal
  tags: string[]                  // NOT localized
  status: 'public' | 'private' | 'wip'
  featured: boolean
  repoUrl?: string
  liveUrl?: string
  sections: {
    title: LocalizedString
    content: LocalizedString
  }[]
}

interface Service {
  id: string                      // unique identifier
  title: LocalizedString
  description: LocalizedString
  station: number                 // Sequential position in the train journey (1, 2, 3, ... N). NOT capped. Grows with the array.
  icon?: string                   // Lottie animation filename
  relatedProjects: string[]       // slugs of related projects to show at this station
}

interface SiteMeta {
  name: string                    // NOT localized, brand name is always "yesid."
  tagline: LocalizedString
  description: LocalizedString    // for SEO meta
  links: {
    email: string
    github: string
    linkedin?: string
    upwork?: string
  }
}
```

**Note:** The Service interface in the repo (slice 02) currently has only `title`, `description`, `icon`. The `id`, `station`, and `relatedProjects` fields will be added in slice 04. The `station` field is sequential (1, 2, 3, ...) with no hardcoded upper bound. The number of stations is always `services.length`.

## Testing Standards

Every slice ships code AND tests. No exceptions.

**Unit tests (Vitest):**

- Data layer: validate interfaces, check required fields, test helper functions
- Components: render with props, check output, test edge cases (empty data, missing optional fields)
- Motion actions: test that they apply/remove classes/transforms correctly
- Utilities: test any helper functions

**E2E tests (Playwright):**

- Each page renders without errors
- Navigation works (all links, mobile menu)
- Project detail pages load from data
- Responsive: test at mobile (375px), tablet (768px), desktop (1280px)
- Performance: frame rate above threshold during scroll

**CI pipeline (GitHub Actions):**

- Triggered on: push to main, pull requests
- Steps: install (bun install), lint, type-check, unit tests (bun run test), build, e2e tests
- PR cannot merge if any step fails

**Test file convention:**

- Unit tests: next to the file they test (e.g., `ProjectCard.test.ts` beside `ProjectCard.svelte`)
- E2E tests: in `tests/` directory at project root (e.g., `tests/home.spec.ts`)

**Yesid tests manually:**

- Yesid will review the site manually after every slice and will give the OK.

## Self-Documentation

**tree.txt** at project root is updated at the end of every slice. It is the repo's self-portrait.

Generate with:

```bash
##On Windows, use this command to generate tree.txt instead of `tree -I`:

cmd /c "tree /F /A | findstr /V /C:"node_modules" /C:".git" /C:".remember" /C:"bun.lockb" /C:".svelte-kit" /C:".vercel" /C:".DS_Store" > tree.txt"

##Or use PowerShell:

Get-ChildItem -Recurse -Name | Where-Object { $_ -notmatch 'node_modules|\.git|\.remember|bun\.lockb|\.svelte-kit|\.vercel|\.DS_Store' } | Out-File tree.txt -Encoding utf8
```

## Slices


| #   | Name                                                | Status                                                           | Depends On   | Est. Sessions |
| --- | --------------------------------------------------- | ---------------------------------------------------------------- | ------------ | ------------- |
| 01  | Project scaffold + brand + CI pipeline              | complete                                                         | none         | 1             |
| 02  | Data layer (types, data files, site meta)           | complete                                                         | 01           | 1             |
| 03  | Component library (basic, no motion)                | complete                                                         | 01           | 1-2           |
| 04  | Motion infrastructure + component enhancement       | complete                                                         | 02, 03       | 2-3           |
| 05  | Layout shell + scroll progress rail                 | complete                                                         | 03, 04       | 1             |
| 06  | Home page: train journey + hero 3D scene            | complete                                                         | 02, 04, 05   | 2-3           |
| 06d | Home page redesign: Metro System Evolved            | complete                                                         | 06           | 3-4           |
| A   | SVG metro hero (experimental)                       | complete                                                         | 06d          | 1             |
| C   | Zoom transition between hero + journey              | complete                                                         | A            | 1             |
| B   | Animated wordmark + horizontal scroll CTA           | complete                                                         | A, C         | 2             |
| B+  | Icon morphs + scroll UX for SkillsJourney           | complete                                                         | B            | 1-2           |
| 07  | Blog system (markdown content + /blog routes)       | complete                                                         | 06d          | 1-2           |
| 08  | Work pages (index + FLIP filter + detail)           | complete                                                         | 02, 03, 07   | 1-2           |
| 09  | Services pages (/services + /services/[id])         | ready                                                            | 02, 08       | 2-3           |
| 09b | About + Contact pages (bento grid /about)           | complete                                                         | 02, 03, 09   | 3-4           |
| 10  | Tech Stack page: "The Control Room" (/tech-stack)   | spec approved                                                    | 09b          | 6-8           |
| 11  | Navbar research + redesign + 404 page               | planned                                                          | 10           | 1-2           |
| 12  | Footer research + redesign                          | planned                                                          | 11           | 1             |
| 13  | Home page rework (post-hero, archive SkillsJourney) | planned                                                          | 10, 11, 12   | 2-3           |
| 14  | Stack Builder Logic Engine (graph-based recs)       | deferred — first CD/CI feature post-deploy. See FUTURE_PHASES.md | 10, 13       | 3-4           |
| 17  | Standardization: Design System + Ports & Adapters   | planned — split execution (see Execution Sequence below)         | 13           | 13-14         |
| 15  | SEO + metadata                                      | planned — built on 17b service layer                             | 13, 17a, 17b | 1-2           |
| 16  | E2E test suite + performance + brand QA             | planned — tests final standardized + SEO state                   | 15, 17       | 3             |
| 18  | Cloud content layer — Payload (own repo) + Neon     | planned — plugs into 17b service layer seam                      | 16, 17       | 5-7           |
| 19  | Mobile UI/UX optimization                           | planned                                                          | 17, B+       | 2             |
| 19b | Accessibility (A11Y) optimization                   | planned                                                          | 19           | 2             |
| 20  | Scroll smoothness + animation polish                | planned                                                          | B+, 19b      | 1             |
| 21  | Repo cleanup for public release                     | planned                                                          | 16, 18       | 1             |
| 22  | Deploy to Vercel + DNS cutover                      | planned                                                          | 21           | 1             |


### Execution Sequence (Post-Home Page)

Slice 17 executes in two phases, with SEO sandwiched between them. This avoids building SEO on data patterns that 17 will refactor, and ensures E2E tests cover the final architecture.

```
13 (home page)
  → 17a (CSS audit + consolidation)
  → 17d (component API standardization)
  → 17e (motion consolidation)
  → 17b (service layer extraction)
    → 15 (SEO + metadata — built on service layer, not raw data files)
  → 17c (Zod schemas — validates SEO structured data too)
  → 17f (test architecture + docs)
    → 16 (E2E + QA — tests the FINAL state including SEO)
      → 18 (Payload CMS — plugs into 17b service seam, SEO metadata as first test collection)
        → 19 (mobile optimization)
          → 19b (accessibility / A11Y)
            → 20 (scroll polish)
  → 17g (learning docs refactor)
              → 21 (repo cleanup)
            → 22 (deploy)
```

**Why this order:**

1. **17a+17b first** — service layer gives SEO clean data access (`getAllProjects()`, not raw imports)
2. **15 after 17b** — `<SeoHead>` built once on the right foundation, no refactor needed
3. **17c-17g after 15** — Zod validates SEO structured data; remaining standardization completes
4. **16 last before deploy** — E2E tests cover the fully standardized + SEO-equipped site
5. **18 after 16** — Payload plugs into 17b's service seam; SEO metadata becomes first test collection

## Slice Summaries

### Completed (shipped before 2026-04-17 — see git log + cloud mirror for full specs/plans/handoffs)

Phase A / pre-13 shipped the foundation: Slice 01 scaffolded SvelteKit 2 + Svelte 5 + Tailwind v4 + Vitest + Playwright on Bun with GitHub Actions CI. 02 built the typed data layer (projects, services, skills, blog, nav). 03 delivered the basic component library (buttons, cards, tags, containers). 04 shipped the motion infrastructure (GSAP + ScrollTrigger + Lenis + Lottie + reveal/tilt actions — most of these later retired or re-engineered in 17e). 05 added the scroll progress rail + site-wide layout shell. 06 / 06d built the home page (train-journey hero, 3D scene, evolved Metro System). Experimental slices A/B/C/B+ iterated the SVG metro hero, zoom transition, animated wordmark, and icon morphs.

Slice 07 shipped /blog (markdown pipeline, filters, search, SVG morph hover, reading-progress bar). 08 shipped /projects (FLIP grid, detail layout). 09 / 09b shipped /services (kinetic index, station tabs, consultative detail) + /about (bento dashboard) + /contact (dual-terminal + Web3Forms). 10 / 10d+ shipped /tech-stack ("The Control Room") + testing infrastructure optimization (happy-dom, 2 Vitest projects, threads pool, ~56s → ~29s). 11 shipped pill navbar + menu overlay + branded 404. 12 shipped 3-row footer + orange-dot favicon + JSON-LD schema.

Slice 13 shipped the home-page rework (two-column hero, manifesto, transit HUD, interactive canvas, metrics, proof reel, services grid, construction-site closer). 13b–13h polished each subsection. Slice 17 Phase 1 (design-system visual layer) completed 2026-04-18 across 17a-1 (token foundation), 17a-2a/b (brand primitives build + wire), 17a-3a/b (color lockdown + token wiring), 17a-4 (dead-code + dedup), 17a-5 (spacing tokens + CONSTITUTION.md + dvh/svh/safe-areas), 17a-6 (Bits UI integration), 17d (component API + card unification + contact redesign), 17e (motion re-engineering, 6 sub-slices), 17h (brand bundle — narrative + logo assets + governance freshen). PRs #2, #3, #4, #5, #6, #8, #12, #14, #15, #17, #19, #20, #22 merged to main.

Full per-slice specs, plans, devlogs, and handoffs live at `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\` and in `git log`. Cloud-side `COMPLETED-SLICES.md` is the one-line index.

### Active

**Slice 17j — Workflow Efficiency** (in progress, 2026-04-17). Two pillars: token efficiency (prune 7 accretion sources) + workflow structure (3-level hierarchy, 4-file sub-slice bundles, self-appending handoff, close-script, OS-agnostic env var, shared vocabulary). Codifies findings into a portable cloud knowledge base, a `workflow-efficiency` skill, and a global-config snapshot. Trade-secret personal IP portable across Yesid's 6 services. Spec: `docs/slices/slice-17/slice-17j/spec.md`. Plan: `docs/slices/slice-17/slice-17j/plan.md`.

### Remaining in Slice 17 (planned)

- **17b** Service Layer (~2 sessions) — extracts service seams. Depends on design-system phase. Enables Slice 15 (SEO) and Slice 18 (Payload CMS).
- **17c** Zod Schemas (~0.5 session) — validates data-layer + future SEO structured data. Depends on 17b.
- **17f** Test Architecture (~1–2 sessions) — test factories + co-location rules. Runs after 15.
- **17g** Learning Docs Refactor (~2 sessions) — sweep the `docs/learn/` cloud mirror to align with post-17 architecture. **Scope re-evaluation needed** given learn/ moved to cloud in 17j.

### Upcoming (planned, detailed below)

15, 16, 18, 19, 19b, 20, 21, 22 — see sections below for scope and sequencing.

### Slice 15 — SEO + Metadata: Maximum Discoverability

**Status:** planned **Est. Sessions:** 1-2 **Depends on:** 13, 17a, 17b

**Why this matters more than most devs think:** 90% of portfolio sites have zero structured data, broken OG tags, and no sitemap. Recruiters and clients Google "data engineer Montreal" or "SQL developer transit pipeline" and get LinkedIn results because nobody's portfolio is optimized. This slice makes yesid.dev the result that shows up WITH a rich card, author photo, and site links. It also makes every blog post, project, and service page individually discoverable, not just the home page.

**5 Layers of SEO:**

1. **Page-Level Meta Tags** — Every route gets: `<title>`, `<meta name="description">`, canonical URL, `robots` directive. Titles follow the pattern `Page Name | yesid.` (brand-consistent, under 60 chars). Descriptions are unique per page, 150-160 chars, written for humans not keyword stuffing. All pulled from data layer via a shared `<SeoHead>` component that every +layout.svelte or +page.svelte uses.
2. **Open Graph + Twitter Cards** — Every page gets: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale`. Twitter equivalents: `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`. OG images: generate a branded default (orange wordmark on dark bg, 1200x630). Blog posts and projects can override with custom OG images. Service pages use a shared branded template.
3. **Structured Data (JSON-LD)** — This is the differentiator. Most portfolios skip this entirely. Add:
  - **Person** schema on home/about: name, jobTitle ("Data Infrastructure Engineer"), url, sameAs (LinkedIn, GitHub), knowsAbout (SQL, Python, PostgreSQL, etc.), worksFor, address (Montreal, QC)
  - **WebSite** schema on home: name, url, description, author
  - **BlogPosting** schema on each blog post: headline, datePublished, author, description, image, articleSection
  - **Service** schema on each service page: name, description, provider (Person), areaServed
  - **BreadcrumbList** schema on all subpages: structured navigation path (Home > Work > STM Transit Pipeline)
  - **ProfilePage** schema on about page (new schema type Google supports for personal sites)
4. **Technical SEO** —
  - `sitemap.xml` auto-generated at build time from all public routes (home, blog/*, work/*, services/*, about, contact). Use `@sveltejs/kit` prerender entries or a custom build script.
  - `robots.txt` with sitemap reference, allow all public routes, block /preview and /admin (Payload, added in Slice 18)
  - Canonical URLs on every page (prevents duplicate content from trailing slashes or query params)
  - `<link rel="alternate" hreflang="en">` tags ready for i18n (structure only, fr/es pages come later)
  - Performance meta: proper `<meta name="viewport">`, `theme-color` (#141414), `color-scheme: dark`
5. **Social Preview Testing** — Verify every page type renders correctly when shared on LinkedIn, Twitter/X, Slack, Discord, iMessage. This is how recruiters first see the site. A broken preview = invisible. Test with: opengraph.xyz, Twitter Card Validator, LinkedIn Post Inspector.

**Shared Component:**

```
<SeoHead
  title="STM Transit Pipeline | yesid."
  description="Near-real-time GTFS analytics..."
  ogImage="/og/stm-transit-pipeline.png"
  type="article"
  canonical="https://yesid.dev/work/stm-transit-pipeline"
  jsonLd={blogPostingSchema}
/>
```

Every page passes its specific data. The component renders all `<svelte:head>` tags. One place to maintain, every page covered.

**OG Image Strategy:**

- Default branded image: wordmark + tagline on dark bg (1200x630) for pages without custom images
- Blog posts: auto-generate OG images at build time using satori or a canvas script (title + date + brand colors on dark card)
- Projects: screenshot or custom graphic per project (manual, added as content)
- If auto-generation is too complex for this slice, ship with the default branded image for all pages and add per-page images in a polish pass

**Locale-Aware Meta:**

- `og:locale` set to `en_CA` (your base)
- `og:locale:alternate` ready for `fr_CA` and `es` when translations ship
- `hreflang` link tags point to self for now, ready to point to locale variants later
- Description meta uses `resolveLocale()` so it serves French descriptions when fr pages exist

**Acceptance Criteria:**

- Every public route has unique `<title>` and `<meta name="description">`
- Every public route has complete OG tags (title, description, image, url, type)
- Every public route has Twitter Card tags
- JSON-LD Person schema on home and about pages
- JSON-LD BlogPosting schema on every blog post
- JSON-LD Service schema on every service page
- JSON-LD BreadcrumbList on all subpages
- `sitemap.xml` generated at build time, contains all public routes
- `robots.txt` references sitemap, blocks /preview
- Canonical URLs set on every page
- OG image renders correctly when shared (test with opengraph.xyz)
- `bun run build` succeeds with all meta in place
- `bun run test` passes
- Lighthouse SEO score: 100 on all page types

**Out of Scope:**

- Per-page custom OG image generation (use default branded image, upgrade later)
- Google Search Console setup (do after deploy in Slice 22)
- Analytics (separate concern)
- i18n page variants (structure only, actual translations are future)

**You'll learn:** Open Graph protocol, JSON-LD structured data, Schema.org vocabulary, technical SEO (sitemaps, canonical URLs, robots.txt), social preview optimization, `<svelte:head>` patterns in SvelteKit.

### Slice 16 — E2E Test Suite + Performance + Brand QA Pass

Playwright E2E tests: full nav flow, train journey scroll, project detail, all pages at 3 breakpoints. Performance testing: verify frame rate during scroll on home page. Brand verification: colors, fonts, motion consistency. Fix visual/responsive/performance issues. Optional: add easter eggs from MOTION.md section 9.  
**You'll learn:** E2E testing, performance profiling, responsive QA, accessibility verification.

**KEEP IN MIND**: Sentry, Posthog and Vercel analytics

### Slice 17 — Standardization: Ports & Adapters Lite

**Full plan:** `[docs/slices/slice-17/README.md](../slices/slice-17/README.md)`
**Status:** IN PROGRESS — Phase 1 Foundation **Est. Sessions:** 13-14 (across 7 sub-slices) **Depends on:** 13

Design system + structural refactor. Brand primitives (terminal chrome, hazard stripes, card base) become shared components. Semantic type scale replaces 275 ad-hoc font-size declarations. All hardcoded hex colors migrate to tokens. Light theme becomes one toggle away. Service layer creates the CMS seam that Slice 18 (Payload) plugs into.

**Progress:** 17a-1 (Token Foundation) ✓ → 17a-2a (Build Primitives) ✓ → 17a-2b (Wire Primitives) ✓ → **17a-3 (Color & Token Lockdown)** ← NEXT

**Sub-slices:** 17a (design system + CSS) → 17b (service layer) → *15 (SEO)* → 17c (Zod schemas) → 17d (component APIs + shared shells) → 17e (motion factories) → 17f (test architecture + docs) → 17g (learning docs refactor)

**Scope:** Design system (brand primitives, type scale, token lockdown, light theme prep), CSS consolidation, service layer, Zod schemas, shared UI shells, motion factories, test factories, documentation.

**What's done:** 15 brand primitives built + wired into 40+ files, 12 utility classes, semantic type scale, tokens.css foundation, CSS.md created. Deep audit identified ~220 remaining hardcoded colors, 22 unused tokens, 4 dead components.

**Tailwind decision:** Keep Tailwind v4 — the problem is bypassing the system with arbitrary values, not the framework. Strict token discipline enforced via `@theme`.

---

### Slice 18 — Cloud Content Layer: Payload (own repo) + Neon

**Status:** planned **Depends on:** 16, 17 **Est. Sessions:** 5-7
**Design spec:** `docs/specs/2026-04-16-cms-payload-design.md` (authoritative — read first)
**Supersedes:** previous Keystatic plan for this slice (see Decisions Log 2026-04-16)

**Decision: Payload 3** — MIT-licensed, Node-native, TypeScript-schema CMS with a real admin UI. Backed by **Neon Postgres** (free tier, scale-to-zero, DB branching). Media on **Vercel Blob**.

**Two repos, not a monorepo:**

- `yesid.dev` — the SvelteKit site. Stays structurally as-is (public showcase, open-source artifact).
- `yesid.dev-cms` — new repo, Payload 3 + Next.js admin + API + Postgres schema. **Framework-agnostic Payload starter** — plugs into SvelteKit, Next.js, Astro, Nuxt, or any REST client. Ships as its own reusable product with per-framework integration recipes (SvelteKit first).

Both repos deploy to Vercel independently. `yesid.dev-cms` lives at `cms.yesid.dev`. yesid.dev is the reference build; `yesid.dev-cms` is the reusable CMS product.

**Positioning:** "WordPress flexibility without WordPress, but modern. Bring your own framework."

**Why Payload over Keystatic** (short form — full rationale in design spec):

1. Non-tech clients can use it — email/password auth, no GitHub account required, real admin UI with roles and drafts.
2. Dynamic queries, real relationships, proper joins — not just string refs between files.
3. Clear path to future features: client logins, form submissions storage, open-source project docs, e-commerce.
4. Template fit — clone one repo, get site + CMS + shared types. Keystatic could not carry that pitch.

Keystatic stays in the toolkit as a possible **"Static" budget tier** for pure-content clients with one editor. It is not the primary offering. **Do not build the Static tier template in Slice 18** — only if real client demand appears later.

**Architecture (see design spec for full diagram):**

```
Repo: yesid.dev                    Repo: yesid.dev-cms
(SvelteKit — public showcase)      (Payload 3 + Next.js — CMS starter)
         │                                    │
         │ Vercel                             │ Vercel
         ▼                                    ▼
    yesid.dev                         cms.yesid.dev
         │       REST (+ GraphQL)             │
         │ ◄───────────────────────────────►  │
         │       webhook on publish           │
         └─────────────┐           ┌──────────┘
                       ▼           ▼
                  Neon Postgres (content DB, branches per PR)
                  Vercel Blob    (media)

Type sync: payload generate:types → GitHub Action → PR in yesid.dev updating
           src/lib/cms-types.ts (no monorepo tax, types stay in sync).
```

**Content model — Payload collections / globals:**

| Type | Maps from | Notes |
|------|-----------|-------|
| `projects` (collection) | `src/lib/data/projects.ts` | slug, title (loc), sections (blocks), services + stack (relationships) |
| `services` (collection) | `src/lib/data/services.ts` | id, title (loc), relatedProjects (relationship), detailSections (blocks) |
| `blog-posts` (collection) | `src/content/blog/*.md` | body as Lexical rich text; rendered to HTML in SvelteKit |
| `tech-stack` (collection) | `src/content/stack/*.md` | shared vocabulary — referenced by projects + services + scenarios |
| `stack-scenarios` (collection) | `src/lib/data/stack-scenarios.ts` | for Build Your Stack configurator |
| `site-meta` (global) | `src/lib/data/meta.ts` | single editable doc |
| `home-content` (global) | `src/lib/data/content.ts` (home sections) | single editable doc |
| `about-content` (global) | `src/lib/data/about-page.ts` | single editable doc |
| `contact-content` (global) | `src/lib/data/contact-page.ts` | single editable doc |
| `nav-links` (global) | `src/lib/data/nav.ts` | single editable doc |
| `error-pages` (global) | `src/lib/data/error-pages.ts` | single editable doc |

Localization uses Payload's built-in `localized: true` flag on text fields (maps cleanly to the existing `LocalizedString` pattern — en required, fr/es optional).

**Migration order** (inside this slice, not a prerequisite):

1. Create `yesid.dev-cms` repo. Scaffold Payload 3 + Next.js with Neon Postgres + Vercel Blob adapters, email auth.
2. Define all collections + globals with Payload localization enabled (maps 1:1 to existing LocalizedString).
3. Deploy CMS to Vercel at `cms.yesid.dev` subdomain.
4. Seed script in `yesid.dev-cms` imports existing TS/MD data from `yesid.dev` via Local API. Idempotent, kept in repo as the "import from other sources" recipe for clients.
5. Set up type-sync GitHub Action: CMS schema change → `payload generate:types` → opens PR in `yesid.dev` updating `src/lib/cms-types.ts`.
6. Service layer swap (from Slice 17b in `yesid.dev`) — flip implementations one service at a time, one commit each, tests green between every swap. Each service calls Payload REST API; Zod schemas (Slice 17c) validate response shape. Order: site-meta → nav-links → home-content → about-content → contact-content → blog-posts → projects → services → tech-stack → stack-scenarios.
7. Wire Payload publish hook → POST to `yesid.dev/api/revalidate` with shared secret. Wire `/preview/[collection]/[slug]?token=...` in `yesid.dev` for draft content.
8. Delete old TS data files in `yesid.dev` only after every route loads from the CMS and tests pass.

**Rollback at every step:** services hold both implementations behind a feature flag during the swap; full rollback is one revert. Because the repos are independent, a bad CMS deploy doesn't take the frontend down — `yesid.dev` keeps serving its ISR cache.

**Cost model (yesid.dev, day one):** $0/month. Neon free tier (191.9 compute-hrs/mo, 0.5 GB) is more than enough; Vercel Blob free tier (1 GB, 10 GB bandwidth) fits a portfolio. Do not attach a payment method to Neon until consciously upgrading — free plan is hard-capped, not soft-capped.

**Guardrails against surprise bills:**

- Use Neon's HTTP/serverless driver from SvelteKit (short-lived connections, compute scales to zero).
- No per-minute cron pings; hourly+ or Vercel Cron with edge caching.
- Clean up DB branches when PRs merge.

**Rendering strategy:**

- Default: **ISR** — Vercel caches pages at the edge; Payload webhook triggers revalidation on publish.
- Exception: `/preview/[collection]/[slug]?token=...` bypasses cache for draft content (logged-in editors only).
- Fallback: build-time static for routes that almost never change.

**Acceptance criteria:**

- `yesid.dev-cms` repo scaffolded with Payload 3 + Next.js, deployed to Vercel at `cms.yesid.dev`.
- All collections + globals defined with Payload localization enabled.
- Seed script imports all existing content without data loss.
- Type-sync GitHub Action wired: CMS schema change → PR in `yesid.dev` updating `src/lib/cms-types.ts`.
- Every service in `src/lib/services/*.service.ts` reads from Payload REST API (Zod-validated), not TS files.
- Slice 16 E2E suite green — every existing route renders identically to pre-migration.
- Payload publish hook → `yesid.dev/api/revalidate` end-to-end.
- Preview route serves draft content for logged-in editors.
- Both Vercel deployments green; Neon DB branch auto-created per CMS PR.
- Full free-tier budget — no overage.
- `docs/reference/ARCHITECTURE.md` updated with two-repo topology; `docs/reference/PATTERNS.md` updated with Payload REST + Zod service pattern.
- `yesid.dev-cms` README includes a "Using with SvelteKit" integration recipe.
- Old TS data files deleted from `yesid.dev`; no lingering references.

**Out of scope:**

- Admin theming / custom field components (polish sub-slice later).
- Keystatic "Static tier" template (build only if client demand appears).
- Multi-tenant Payload (one instance per client is the day-one rule).
- Moving Payload to Railway/Hetzner (reversible later; Vercel is fine for v1).
- Fulltext search upgrade — blog search stays client-side.

**You'll learn:** Payload 3 collections/globals/blocks, framework-agnostic CMS architecture (REST API + Zod at the frontend boundary), cross-repo type-sync via GitHub Actions, Neon Postgres + DB branching, Vercel Blob for media, ISR revalidation via webhooks, preview/draft flows, service-layer seam migration under test coverage.

### Slice 19 — Mobile UI/UX Optimization

**Status:** planned
Full mobile audit: touch targets, scroll behavior, animation performance on low-end devices, viewport issues, text readability, tap feedback. SkillsJourney scroll tuning (velocity detection, adaptive multipliers). Responsive breakpoint audit for all components. Test at 375px, 390px, 414px, 768px.

**Scope:** Touch interaction polish, scroll performance, responsive fixes, mobile-specific animation tuning, viewport debugging.

### Slice 19b — Accessibility (A11Y) Optimization

**Status:** planned
Full accessibility audit and remediation: WCAG 2.1 AA compliance, semantic HTML structure, ARIA landmarks and labels, keyboard navigation across all interactive components, focus management (visible focus rings, logical tab order, focus trapping in modals/overlays), screen reader testing, color contrast verification (4.5:1 text, 3:1 UI), skip-to-content link, reduced-motion enforcement audit, alt text for all images and SVGs, form accessibility (labels, error announcements, live regions). Lighthouse accessibility score target: 95+.

**Scope:** Semantic HTML audit, ARIA implementation, keyboard navigation, focus management, screen reader compatibility, color contrast fixes, prefers-reduced-motion audit, form accessibility, skip links, Lighthouse a11y scoring.

**Why after Slice 19:** Mobile optimization (Slice 19) changes touch targets, layout, and interaction patterns. Running the a11y audit after mobile ensures we test the final responsive state, not an intermediate one. Keyboard and screen reader testing also benefits from stable component APIs post-mobile polish.

### Slice 20 — Scroll Smoothness + Animation Polish

**Status:** planned
Fine-tune all scroll-linked animations across the site. Consider ScrollSmoother plugin. Optimize GSAP tween count. Fix any jank on 60fps targets. Polish snap behavior, scrub timing, and transition curves. Performance profiling with Chrome DevTools.

**Scope:** Animation timing polish, scroll performance optimization, GSAP tween audit, frame rate verification.

### Slice 21 — Repo Cleanup for Public Release

Strip pipeline/workflow artifacts. Public repo = clean portfolio site.

**MANUAL CHECKPOINT (before Claude Code deletes anything):**
Yesid copies these to `C:\Users\otalo\Yesito\cloud\yesid-pipeline-archive\`:

- `docs/` (entire directory)
- `CLAUDE.md`
- `yesid-pipeline-workflow/` (if present)

Yesid confirms backup is done. Only then does Claude Code proceed.

**Remove:** CLAUDE.md, docs/, brand/yesid_brand_guide.pdf, leftover .gitkeep files
**Keep:** src/, tests/, static/, brand/ (minus PDF), .github/workflows/, configs, tree.txt
**Write:** Clean public README.md

**Tests:** Existing tests pass. Build succeeds. No references to removed files.

### Slice 22 — Deploy to Vercel + DNS Cutover

Connect repo to Vercel. Configure build (Bun). Auto-deploy main, preview on PRs. Test preview. Update yesid.dev DNS. Verify live + CI/CD end to end.

**Tests:** Build succeeds. Preview works. Production works. 3D scene loads. CI blocks bad merges.

## Pre-Slice Work

- **Before Slice 02:** ~~Finalize project descriptions, service definitions, site meta~~ (done)
- **Before Slice 06:**
  - ~~Source 4 Lottie station icons from LottieFiles marketplace~~ (done, recolored to brand palette)
  - ~~Write hero copy and CTA text~~ (done: "The infrastructure is ready." / "Let's build something that moves.")
  - ~~Write service descriptions for each station~~ (done)
  - Remodel a new train from top POV
- **Before Slice 08:** Write About page bio
- **Before Slice 11:** Verify backup path exists on local machine

## Lottie Asset Pipeline

### v1: Marketplace sourcing (COMPLETE)

4 Lottie animations sourced from LottieFiles marketplace, recolored to brand palette, and ready for use:


| File                       | Station            | Source                      | Status                                                                  |
| -------------------------- | ------------------ | --------------------------- | ----------------------------------------------------------------------- |
| `station-sql.json`         | 1: SQL Development | LottieFiles (database icon) | Recolored, bg removed                                                   |
| `station-pipeline.json`    | 2: Data Pipeline   | LottieFiles (data flow)     | Recolored, logos kept, destination replaced with orange dot             |
| `station-analytics.json`   | 3: Analytics       | LottieFiles (data analysis) | Recolored                                                               |
| `station-performance.json` | 4: Performance     | LottieFiles (speed test)    | Recolored, text changed to yesid.dev/Montreal QC, green gradients fixed |


All files use exclusively brand palette colors: #E07800, #FFB627, #C96A00, #E5A220, #F5F5F0, #999999, #666666, #141414, #1E1E1E.

Place all Lottie JSON files in `src/lib/assets/lottie/`.

### Adding new station Lotties (future)

Adding a new service station requires one new Lottie file:

1. Source from LottieFiles marketplace (or design custom)
2. Recolor to brand palette
3. Place in `src/lib/assets/lottie/station-{name}.json`
4. Reference filename in the Service object's `icon` field
5. No component or layout changes needed

### v2+: Custom Lotties

When ready to create custom animations, swap marketplace JSON files for custom ones. The `LottiePlayer.svelte` component accepts any Lottie JSON. No code changes needed.

**Design flow for custom Lotties:**

1. Design in Figma (shapes, colors, keyframe planning)
2. Export to After Effects (or animate directly if simple)
3. Export with Bodymovin plugin as JSON
4. Replace file in `src/lib/assets/lottie/`

## Decisions Log


| Date       | Decision                                           | Rationale                                                                                                                                                                                                    |
| ---------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-04-01 | Slice-based workflow adopted                       | Prevents scope creep, forces sequential focus                                                                                                                                                                |
| 2026-04-01 | SvelteKit 2 chosen                                 | Prior investment (Rail), good DX, Vercel-native                                                                                                                                                              |
| 2026-04-01 | Dark theme only in v1                              | Brand default, reduces scope                                                                                                                                                                                 |
| 2026-04-01 | Data-driven architecture                           | Site grows with career, no hardcoded content                                                                                                                                                                 |
| 2026-04-01 | No CMS in v1                                       | TS files are simpler, version controlled, type-safe                                                                                                                                                          |
| 2026-04-01 | Future phases parked                               | Ship site before anything else                                                                                                                                                                               |
| 2026-04-02 | Site is a platform, not a snapshot                 | Components and data are generic                                                                                                                                                                              |
| 2026-04-02 | TDD integrated into every slice                    | Tests ship with code, CI enforces quality                                                                                                                                                                    |
| 2026-04-02 | GitHub Actions + Vercel CD                         | Automated pipeline from push to production                                                                                                                                                                   |
| 2026-04-02 | Repo cleanup before public                         | Pipeline artifacts archived locally, repo stays clean                                                                                                                                                        |
| 2026-04-02 | Archive path                                       | C:\Users\otalo\Yesito\cloud\yesid-pipeline-archive\                                                                                                                                                          |
| 2026-04-02 | Bun as runtime                                     | Learning opportunity, fast, drop-in npm replacement                                                                                                                                                          |
| 2026-04-02 | tree.txt updated every slice                       | Repo self-documents its structure                                                                                                                                                                            |
| 2026-04-02 | i18n baked into data layer                         | Owner is Colombian in Quebec. EN/FR/ES supported from day one.                                                                                                                                               |
| 2026-04-02 | Motion-first approach adopted                      | Every component ships with animation from day one                                                                                                                                                            |
| 2026-04-02 | Train journey metaphor for home page               | Single continuous narrative tied to brand + career                                                                                                                                                           |
| 2026-04-02 | Threlte for 3D (minimal dark + glowing paths)      | Svelte-native, declarative, typed                                                                                                                                                                            |
| 2026-04-02 | GSAP for scroll choreography                       | Industry standard, ScrollTrigger for scroll-linked                                                                                                                                                           |
| 2026-04-02 | Lottie for train + station icons                   | Lightweight, polished illustration, designed in Figma                                                                                                                                                        |
| 2026-04-02 | Hybrid 3D env + Lottie train                       | Best of both: interactive depth + illustration quality                                                                                                                                                       |
| 2026-04-02 | No 3D on mobile                                    | Performance over spectacle on constrained devices                                                                                                                                                            |
| 2026-04-02 | Extended timeline (4-5 weeks)                      | Ship something memorable over something fast                                                                                                                                                                 |
| 2026-04-02 | MOTION.md created                                  | Source of truth for motion language, parallel to brand guide                                                                                                                                                 |
| 2026-04-02 | SVG train + GSAP MotionPathPlugin                  | Train movement is scroll-linked (needs GSAP), not pre-baked                                                                                                                                                  |
| 2026-04-02 | Marketplace Lotties for v1                         | Custom Lotties require After Effects skill; marketplace fills the gap                                                                                                                                        |
| 2026-04-02 | Additive animation architecture                    | New animations = new files, not refactoring existing code                                                                                                                                                    |
| 2026-04-02 | Three animation layers defined                     | Threlte (atmosphere) + GSAP (choreography) + Lottie (illustration)                                                                                                                                           |
| 2026-04-02 | Standardized action/component patterns             | Every motion component checks reduced-motion, cleans up on destroy                                                                                                                                           |
| 2026-04-02 | SEO as dedicated slice (09)                        | Meta tags, OG, sitemap layered after all pages exist                                                                                                                                                         |
| 2026-04-02 | Locale routing deferred                            | URL prefixes (/fr/, /es/) not in v1. Data is ready, routing added when translations exist.                                                                                                                   |
| 2026-04-02 | Service interface evolves in slice 04              | Add station, id, relatedProjects when motion infrastructure exists                                                                                                                                           |
| 2026-04-02 | Layered animation architecture                     | Four independent layers: Svelte actions (interaction) + GSAP (choreography) + Lottie (illustration) + Threlte (atmosphere). Each removable.                                                                  |
| 2026-04-02 | SVG train + GSAP MotionPath for movement           | Scroll-linking needs real-time control. Lottie optional for idle polish only.                                                                                                                                |
| 2026-04-02 | Marketplace Lotties recolored to brand             | 4 station icons sourced, recolored (#E07800 family), fixed (bg removed, logos adjusted, text replaced). Done.                                                                                                |
| 2026-04-02 | Data-driven station system                         | No hardcoded station count. services.length determines everything. Adding a service = 1 object + 1 Lottie.                                                                                                   |
| 2026-04-02 | Easter eggs planned                                | Small surprises that reward curiosity (MOTION.md section 9). Implement as time allows.                                                                                                                       |
| 2026-04-02 | MOTION.md v1.1                                     | Updated with layered architecture, SVG train approach, marketplace Lottie strategy, easter eggs, data-driven stations.                                                                                       |
| 2026-04-03 | Metro System Evolved redesign                      | Home page expanded to 8 stops: hero, 4 services, featured work, about bento, blog, CTA                                                                                                                       |
| 2026-04-03 | 3D Montreal metro wagon in hero                    | Sketchfab model (CC BY 4.0, mamont nikita) over AI-generated station art                                                                                                                                     |
| 2026-04-03 | Blog from markdown files                           | `src/content/blog/*.md` with frontmatter, parsed at build time via `import.meta.glob`                                                                                                                        |
| 2026-04-03 | Station dividers with hazard stripes               | Yellow/black repeating gradient between metro stops                                                                                                                                                          |
| 2026-04-03 | Draggable train                                    | Train can be dragged along rail to scroll the page                                                                                                                                                           |
| 2026-04-03 | Rail at viewport edge                              | Rail moved from inside max-w-5xl to fixed right edge of viewport                                                                                                                                             |
| 2026-04-03 | gltf-transform for model optimization              | 88MB Sketchfab GLB → 4.3MB via dedup + Draco compression                                                                                                                                                     |
| 2026-04-03 | Data-driven metro line (metro.ts)                  | Stop numbers auto-compute. Adding a service extends the entire rail.                                                                                                                                         |
| 2026-04-03 | Centralized i18n content (content.ts)              | All UI strings in one place for future French/Spanish translations                                                                                                                                           |
| 2026-04-03 | ~~Replace 3D fab with scroll-linked video~~        | SCRAPPED — 06f removed from plan                                                                                                                                                                             |
| 2026-04-04 | Experimental slices (A, B, C) for hero + journey   | Rapid prototyping of SVG hero, zoom transition, and horizontal scroll CTA                                                                                                                                    |
| 2026-04-04 | GSAP all plugins free                              | SplitText, DrawSVGPlugin, MorphSVGPlugin, CustomEase — all available at no cost                                                                                                                              |
| 2026-04-05 | SkillsJourney horizontal scroll section            | 5-panel horizontal scroll with data-driven panels, replacing train journey on home page                                                                                                                      |
| 2026-04-05 | Per-word GSAP triggers (trigger: hw)               | Using individual word elements as ScrollTrigger targets instead of paragraph for accurate timing                                                                                                             |
| 2026-04-05 | containerAnimation + scrub for all effects         | Pure scrub with containerAnimation naturally reverses on scroll back; no toggleActions/yoyo                                                                                                                  |
| 2026-04-05 | No animation on non-keyword text                   | Static white text for uniform look + lighter performance; only keywords get effects                                                                                                                          |
| 2026-04-05 | Shape morphs deferred to Slice B+                  | MorphSVGPlugin shapes separated from text animations for cleaner delivery                                                                                                                                    |
| 2026-04-05 | `marked` over mdsvex for blog content rendering    | mdsvex had parse errors with `<` characters in inline code/content; `marked` is simpler and more reliable                                                                                                    |
| 2026-04-05 | Per-post folders (`category/slug/index.md`)        | Allows co-located assets (images, diagrams) per post in the future                                                                                                                                           |
| 2026-04-05 | Deterministic SVG fallback from slug hash          | Every post gets the same illustration even without explicit SVG assignment — consistent across builds                                                                                                        |
| 2026-04-05 | MorphSVGPlugin hover morph on blog SVGs            | Already loaded from Slice B+ — reuses plugin for delightful micro-interaction on hover/tap                                                                                                                   |
| 2026-04-05 | Client-side blog filtering (search/tags/date/lang) | 7 posts total — no benefit to server-side filtering; keeps UX snappy                                                                                                                                         |
| 2026-04-05 | Two blog content lanes (professional + personal)   | Separates brand-facing technical content from personal interests; different accent colors (#E07800 vs #FFB627)                                                                                               |
| 2026-04-07 | Brand = Digital Infrastructure (not just data/SQL) | Current focus is data engineering + SQL, but the brand umbrella covers databases, dashboards, pipelines, internal tools, web systems. All copy reflects broader positioning.                                 |
| 2026-04-07 | Slice 10 = Home page rework after About/Contact    | Building all route pages gave clarity on site identity. Home (post-hero) was built before subsites. Rework with full context. Archive SkillsJourney (keep code, disable render, bring back optimized later). |
| 2026-04-10 | Slice 14 deferred to CD/CI                         | First feature released under a proper CD/CI pipeline after deploy, like a real engineer                                                                                                                      |
| 2026-04-10 | Standardize (17) before SEO (15) + QA (16)         | SEO built on service layer = no rework. E2E tests cover final architecture. Split execution: 17a+17b → 15 → 17c-17g → 16 → 18. Keystatic gets SEO metadata as first test collection.                         |
| 2026-04-07 | No standalone tech stack page                      | About page widget + service detail pages + blog posts cover tools better than a resume-style page. Anti-pattern per conversion research.                                                                     |
| 2026-04-07 | Live weather widget (OpenWeatherMap free tier)     | API key in .env, server-side fetch in +page.server.ts, graceful fallback. Unique personality touch on About page.                                                                                            |
| 2026-04-16 | Slice 18 CMS: pivot from Keystatic to Payload      | Supersedes 2026-04-10 Keystatic decision. Non-tech clients need email/password + real admin (Keystatic requires GitHub auth). Template goal ("WordPress flexibility, modern") fits Payload; dynamic queries, roles, client-login path. Keystatic kept as possible "Static tier" for pure-content clients. Full design spec: `docs/specs/2026-04-16-cms-payload-design.md`.                                                                             |
| 2026-04-16 | Slice 18 ships as two repos, not a monorepo        | `yesid.dev` (SvelteKit) stays clean for showcase and open-sourcing. `yesid.dev-cms` (Payload 3 + Next.js) becomes a framework-agnostic CMS starter — per-framework integration recipes (SvelteKit first, Next.js/Astro/Nuxt on demand). Bigger addressable market than a SvelteKit-locked monorepo template. Type sync via GitHub Action, not shared package. Revises earlier same-day monorepo decision.                                                 |
| 2026-04-16 | Neon Postgres + Vercel Blob for CMS storage        | Neon: serverless, scale-to-zero, DB branching per PR, zero vendor lock-in (plain Postgres). Vercel Blob: zero-config media storage. Supabase rejected — its Auth/Storage/RLS duplicate Payload's built-ins. |


## Rules

1. One slice at a time. No scattering.
2. Spec before code. Always.
3. Review handoff before next slice. Always.
4. Code and tests ship together. No code without tests.
5. CI must be green before merging. No exceptions.
6. tree.txt updated at the end of every slice.
7. Motion follows MOTION.md principles. No random animation.
8. Content decisions and code both happen in Claude Code.
9. Lottie assets sourced before slice 06 starts.
10. Every animation respects prefers-reduced-motion.
11. Station system is fully data-driven. Adding a service = adding one object to services.ts + one Lottie JSON. Zero component/layout changes. Home page, scroll rail, train path, and Threlte nodes all derive from services array length and data. No hardcoded station counts or per-station logic.
12. Each motion layer (Svelte/GSAP/Lottie/Threlte) is independently removable.

