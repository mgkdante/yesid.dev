# yesid. Pipeline — Master Plan

**Owner:** Yesid O.
**Started:** April 2026
**Current phase:** A — Portfolio Site
**Future phases:** See docs/FUTURE_PHASES.md (parked, not active)

## Goal

Ship yesid.dev as a memorable, motion-driven portfolio site with a scroll-based train journey, interactive 3D elements, and polished micro-interactions. The site is a platform, not a snapshot. Projects, services, and positioning are data that flows into reusable, animated components.

## Design Principles

1. **Data-driven.** Projects, services, skills, and links live in typed data files. The site renders whatever the data contains. Adding a project = adding one object to a file.
2. **Motion-first.** Every component ships with its animation behavior from day one. Motion is not decoration; it follows the "data in transit" metaphor defined in `docs/MOTION.md`.
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
  /about             -> Bio, focus areas, skills
  /contact           -> Links (email, GitHub, LinkedIn, Upwork)

Data files:
  src/lib/data/types.ts       -> LocalizedString, Project, Service, SiteMeta interfaces
  src/lib/data/projects.ts    -> Project[] array
  src/lib/data/services.ts    -> Service[] array (station content)
  src/lib/data/meta.ts        -> Site-wide metadata (name, tagline, links)

Motion system:
  src/lib/motion/actions/     -> Svelte actions (boop, reveal, magnetic, ripple)
  src/lib/motion/stores/      -> Scroll position, reduced-motion preference
  src/lib/motion/components/  -> ScrollRail, StationReveal, LottiePlayer
  src/lib/motion/three/       -> Threlte scene components (HeroScene, DataPaths, etc.)
  src/lib/motion/svg/         -> SVG train component
  src/lib/motion/utils/       -> GSAP helpers, stagger calculator

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


| #   | Name                                                   | Status   | Depends On | Est. Sessions |
| --- | ------------------------------------------------------ | -------- | ---------- | ------------- |
| 01  | Project scaffold + brand + CI pipeline                 | complete | none       | 1             |
| 02  | Data layer (types, data files, site meta)              | complete | 01         | 1             |
| 03  | Component library (basic, no motion)                   | complete | 01         | 1-2           |
| 04  | Motion infrastructure + component enhancement          | complete | 02, 03     | 2-3           |
| 05  | Layout shell + scroll progress rail                    | complete | 03, 04     | 1             |
| 06  | Home page: train journey + hero 3D scene               | complete | 02, 04, 05 | 2-3           |
| 06d | Home page redesign: Metro System Evolved               | complete | 06         | 3-4           |
| A   | SVG metro hero (experimental)                          | complete | 06d        | 1             |
| C   | Zoom transition between hero + journey                 | complete | A          | 1             |
| B   | Animated wordmark + horizontal scroll CTA              | complete | A, C       | 2             |
| B+  | Icon morphs + scroll UX for SkillsJourney              | complete | B          | 1-2           |
| 07  | Blog system (markdown content + /blog routes)          | **next** | 06d        | 1-2           |
| 08  | Work pages (index + FLIP filter + detail)              | planned  | 02, 03, 07 | 1-2           |
| 09  | About + Contact pages (bento grid /about)              | planned  | 02, 03, 07 | 1             |
| 10  | SEO + metadata                                         | planned  | 07, 08, 09 | 1             |
| 11  | E2E test suite + performance + brand QA                | planned  | 07, 08, 09 | 1-2           |
| 12  | Standardization (scalable, componentized, data-driven) | planned  | B+, 06d    | 1-2           |
| 13  | Cloud content layer (edit + publish without code)      | planned  | 12         | 1-2           |
| 14  | Mobile UI/UX optimization                              | planned  | 12, B+     | 1-2           |
| 15  | Scroll smoothness + animation polish                   | planned  | B+, 14     | 1             |
| 16  | Repo cleanup for public release                        | planned  | 10, 11     | 0.5           |
| 17  | Deploy to Vercel + DNS cutover                         | planned  | 16         | 1             |


## Slice Summaries

### Slice 01 — Project Scaffold + Brand + CI Pipeline

**Status:** complete
Initialize SvelteKit 2 with Bun, TypeScript, Tailwind (extending brand config), Vercel adapter. Vitest + Playwright configured. GitHub Actions CI green. See `docs/handoffs/handoff-slice-01.md`.

### Slice 02 — Data Layer

**Status:** complete
TypeScript interfaces for Project, Service, SiteMeta. Data files with initial content (4 services, 2 seed projects). Localization-ready with LocalizedString type (en/fr/es). Helper functions tested. See `docs/handoffs/handoff-slice-02.md`.

### Slice 03 — Component Library (Basic)

**Status:** complete
6 reusable UI components: ProjectCard, ProjectGrid, ServiceCard, TagList, SectionHeader, Hero. All locale-agnostic (receive resolved strings). No motion yet. 75 tests passing. See `docs/handoffs/handoff-slice-03.md`.

### Slice 04 — Motion Infrastructure + Component Enhancement

Two parts in one slice:

**Part A: Motion infrastructure.** Install and configure GSAP + ScrollTrigger, Threlte + Three.js, lottie-web. Create the `src/lib/motion/` directory structure per MOTION.md section 12. Build reusable Svelte actions: `use:boop`, `use:reveal`, `use:magnetic`, `use:ripple`. Create motion stores: scroll position, `prefersReducedMotion`. Build utility: stagger timing calculator with randomization. Build `LottiePlayer.svelte` component. Ensure all motion respects `prefers-reduced-motion`.

**Part B: Enhance existing components + update Service interface.** Add motion behaviors to slice 03 components: boop hover on ProjectCard, stagger on TagList. Update Service interface to add `id`, `station` (sequential, no hardcoded upper bound), `relatedProjects` fields. Update service data and tests. ServiceStation component is NOT built here (deferred to slice 05/06).

**Critical rule: The station system is fully data-driven.** Adding a service = adding one object to services.ts + one Lottie JSON. Zero component/layout changes. No hardcoded station counts anywhere.

**All actions and components follow the standardized patterns defined in MOTION.md sections 12-13.**

**Tests:** Actions apply/remove transforms. Reduced motion store reads OS preference. Stagger calculator produces correct timing arrays. LottiePlayer renders without errors. Enhanced components still pass existing tests. Station data validates sequential ordering and unique IDs without hardcoded upper bounds.
**You'll learn:** Svelte actions (`use:` directive), GSAP basics, spring physics (svelte/motion), accessibility with prefers-reduced-motion, data-driven architecture.

### Slice 05 — Layout Shell + Scroll Progress Rail

Root layout: Nav (wordmark left, links right) + Footer + ScrollRail component. Responsive hamburger menu. ScrollRail shows on all pages: simple progress bar on inner pages, station markers on home page. Page transition animation between routes.

**Tests:** Nav renders all links. ScrollRail tracks scroll percentage. Wordmark structure correct. Footer renders. Page transitions don't break navigation.
**You'll learn:** SvelteKit layouts, responsive nav, scroll-linked UI, page transitions.

### Slice 06 — Home Page: Train Journey + Hero 3D Scene

The centerpiece. Build the scroll-driven train journey:

- Threlte 3D scene: minimal dark space with glowing data paths, station nodes, subtle grid, bloom post-processing. Camera parallax on mouse. Scene responds to scroll position (MOTION.md section 6).
- SVG train: animated with GSAP MotionPathPlugin along a scroll-linked curve. Wheel rotation, window glow, accent pulse (MOTION.md section 8).
- Lottie station icons: marketplace-sourced, play when scroll reaches each station (MOTION.md section 7).
- Station sections: 4 services rendered as `ServiceStation` components, revealed by scroll.
- Hero: 3D background + wordmark + tagline overlay + scroll prompt.
- CTA section at the bottom (destination station).
- Mobile fallback: no 3D, CSS gradient + simplified SVG paths instead.
- Run localhost

**Pre-slice work (done in Claude.ai before starting):**

- Design SVG train in Figma with named groups for GSAP animation
- Source 4 Lottie station icons from LottieFiles marketplace
- Finalize hero copy and CTA text
- Sketch approximate data path curves for Threlte scene

**Tests:** Hero renders. 3D canvas initializes (or fallback renders on mobile). All 4 stations render with correct service data. Scroll progress updates. CTA section renders. Lottie icons load.
**You'll learn:** Threlte scene composition, Three.js geometry + materials + lighting, GSAP ScrollTrigger timelines, GSAP MotionPathPlugin, Lottie integration, scroll-linked animation, responsive 3D fallback.

### Slice 06d — Home Page Redesign: Metro System Evolved

**Status:** complete (5 iterations)
Full 8-stop metro journey: hero, 4 services, featured work, about bento, blog, terminal CTA. Data-driven metro line (`metro.ts`): stop numbers auto-compute from services. Centralized i18n content (`content.ts`). Bird's-eye 2-wagon train SVG. Fullscreen metro-themed hamburger menu with glow. Rail scoped to main body. Hidden browser scrollbar. 3D wagon renders via Threlte/Draco (to be replaced with video in 06f).

Handoff: `docs/handoffs/handoff-slice-06d.md`

### Slice A — SVG Metro Hero (Experimental)

**Status:** complete
SVG-based metro hero replacing 3D Threlte scene. Lighter, faster, more stylized. Berri-UQAM station art as background. See `docs/handoffs/handoff-slice-a-svg-hero.md`.

### Slice C — Zoom Transition

**Status:** complete
Smooth zoom transition between hero banner and SkillsJourney section. See `docs/handoffs/handoff-slice-c-zoom-transition.md`.

### Slice B — Animated Wordmark + Horizontal Scroll CTA

**Status:** complete (approved 2026-04-05)
Nav wordmark hover animations (4 cycling SplitText effects). SkillsJourney: 5-panel horizontal scroll section with 7 unique cinematic per-keyword text animations (foundation assembly, data scramble, logic convergence, pixels fragmentation, understand comprehension, unforgettable persistence, stop brake). CTA with pulsing glow button. All effects scrubbed to scroll via `containerAnimation`, per-word triggers. See `docs/handoffs/handoff-slice-b.md`.

### Slice B+ — Icon Morphs + Scroll UX

**Status:** complete (approved 2026-04-05)
Skill icons morph from circles to their final forms via MorphSVGPlugin on scroll. Panel 1 animates on vertical scroll (not horizontal). ScrollTrigger snap locks to each panel. Mobile scroll 1.8× slower. "motion" rotates from word center. See `docs/handoffs/handoff-slice-b-plus.md`.

### Slice 07 — Blog System (yesid.dev/blog)

**Status:** planned
Build `/blog` listing page and `/blog/[slug]` detail pages. Blog data already reads from markdown files. This slice adds the route pages, mdsvex rendering for full content, and cross-posting to LinkedIn.

### Slice 08 — Work Pages (Index + FLIP Filter + Detail)

/work index: ProjectGrid with animated tag filtering (FLIP). /work/[slug]: detail page with scroll-reveal sections and stagger-animated tech tags. 404 for invalid slugs.

**Tests:** Index shows all public projects. Tag filter animates correctly. Detail renders from slug. Tech tags stagger. 404 on bad slug.
**You'll learn:** Dynamic routes ([slug]), FLIP animation, data-driven filtering, scroll-reveal composition.

### Slice 09 — About + Contact Pages

About: bio section (fade entrance), focus areas, skills (stagger tags). Contact: links from SiteMeta with stagger entrance and boop hover on icons.

**Tests:** Pages render. Links valid. Content matches data. Hover interactions work.
**You'll learn:** Static pages with motion, keeping animation restrained when content is primary.

### Slice 10 — SEO + Metadata

Add page-level meta tags (title, description, Open Graph, Twitter cards). Generate sitemap.xml. Add structured data (JSON-LD) for person/organization. Set canonical URLs. Locale-aware meta (serve correct language description per locale). Ensure every page has proper meta from data files.

**Tests:** Each page has title and description meta. OG tags present. Sitemap is valid.
**You'll learn:** SEO fundamentals, Open Graph protocol, structured data, sitemaps.

### Slice 11 — E2E Test Suite + Performance + Brand QA Pass

Playwright E2E tests: full nav flow, train journey scroll, project detail, all pages at 3 breakpoints. Performance testing: verify frame rate during scroll on home page. Brand verification: colors, fonts, motion consistency. Fix visual/responsive/performance issues. Optional: add easter eggs from MOTION.md section 9.

**Tests:** Full navigation flow. Train journey completes without jank. Responsive at 375px, 768px, 1280px. No mobile overflow. Frame rate above 45fps on scroll. Reduced motion mode works.
**You'll learn:** E2E testing, performance profiling, responsive QA, accessibility verification.

### Slice 12 — Standardization (Scalable, Componentized, Data-Driven)
**Status:** planned
Audit the entire codebase for consistency and scalability. Ensure all repeating patterns are extracted into reusable components. Verify all content is data-driven (no hardcoded text in templates). Standardize component APIs (props, slots, events). Extract shared animation patterns into reusable utilities. Ensure adding a new service/project/blog post is a single data-file edit.

**Scope:** Component API consistency, data-driven content audit, shared animation utilities, prop interface standardization, documentation of component patterns.

### Slice 13 — Cloud Content Layer (Edit + Publish Without Code)
**Status:** planned
Connect the data-driven content (projects, services, blog posts, site meta) to a cloud-editable source so Yesid can add/edit content without opening the codebase. When content is published or updated in the cloud, the site rebuilds and deploys automatically.

**Options to evaluate:**
- **Headless CMS** (Sanity, Contentful, Storyblok) — structured content, visual editor, webhooks to trigger Vercel rebuild
- **Notion as CMS** — Yesid already uses Notion; API pulls content at build time; familiar editing UX
- **Markdown in cloud storage** (Google Drive, Dropbox, GitHub content repo) — keep markdown workflow, sync to repo via webhook/action
- **Keystatic** — git-based CMS with visual editor, content stays in repo as markdown/JSON

**Key requirements:**
- Content types: projects, services, blog posts, site metadata
- Editing: visual/familiar interface (not code editors)
- Publishing: edit → save → site auto-rebuilds on Vercel
- Schema: matches existing TypeScript interfaces (Project, Service, BlogPost, SiteMeta)
- Fallback: if CMS is down, site still builds from last-known content

**Scope:** CMS selection, content schema migration, build-time data fetching, webhook-triggered rebuilds, editorial workflow documentation for Yesid.

**Why after Slice 12:** Standardization ensures all content is already cleanly data-driven and every content type has a consistent interface. The cloud layer plugs into those interfaces — it doesn't create them.

### Slice 14 — Mobile UI/UX Optimization
**Status:** planned
Full mobile audit: touch targets, scroll behavior, animation performance on low-end devices, viewport issues, text readability, tap feedback. SkillsJourney scroll tuning (velocity detection, adaptive multipliers). Responsive breakpoint audit for all components. Test at 375px, 390px, 414px, 768px.

**Scope:** Touch interaction polish, scroll performance, responsive fixes, mobile-specific animation tuning, viewport debugging.

### Slice 15 — Scroll Smoothness + Animation Polish
**Status:** planned
Fine-tune all scroll-linked animations across the site. Consider ScrollSmoother plugin. Optimize GSAP tween count. Fix any jank on 60fps targets. Polish snap behavior, scrub timing, and transition curves. Performance profiling with Chrome DevTools.

**Scope:** Animation timing polish, scroll performance optimization, GSAP tween audit, frame rate verification.

### Slice 16 — Repo Cleanup for Public Release

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

### Slice 17 — Deploy to Vercel + DNS Cutover

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


| Date       | Decision                                         | Rationale                                                                                                                                   |
| ---------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-01 | Slice-based workflow adopted                     | Prevents scope creep, forces sequential focus                                                                                               |
| 2026-04-01 | SvelteKit 2 chosen                               | Prior investment (Rail), good DX, Vercel-native                                                                                             |
| 2026-04-01 | Dark theme only in v1                            | Brand default, reduces scope                                                                                                                |
| 2026-04-01 | Data-driven architecture                         | Site grows with career, no hardcoded content                                                                                                |
| 2026-04-01 | No CMS in v1                                     | TS files are simpler, version controlled, type-safe                                                                                         |
| 2026-04-01 | Future phases parked                             | Ship site before anything else                                                                                                              |
| 2026-04-02 | Site is a platform, not a snapshot               | Components and data are generic                                                                                                             |
| 2026-04-02 | TDD integrated into every slice                  | Tests ship with code, CI enforces quality                                                                                                   |
| 2026-04-02 | GitHub Actions + Vercel CD                       | Automated pipeline from push to production                                                                                                  |
| 2026-04-02 | Repo cleanup before public                       | Pipeline artifacts archived locally, repo stays clean                                                                                       |
| 2026-04-02 | Archive path                                     | C:\Users\otalo\Yesito\cloud\yesid-pipeline-archive\                                                                                         |
| 2026-04-02 | Bun as runtime                                   | Learning opportunity, fast, drop-in npm replacement                                                                                         |
| 2026-04-02 | tree.txt updated every slice                     | Repo self-documents its structure                                                                                                           |
| 2026-04-02 | i18n baked into data layer                       | Owner is Colombian in Quebec. EN/FR/ES supported from day one.                                                                              |
| 2026-04-02 | Motion-first approach adopted                    | Every component ships with animation from day one                                                                                           |
| 2026-04-02 | Train journey metaphor for home page             | Single continuous narrative tied to brand + career                                                                                          |
| 2026-04-02 | Threlte for 3D (minimal dark + glowing paths)    | Svelte-native, declarative, typed                                                                                                           |
| 2026-04-02 | GSAP for scroll choreography                     | Industry standard, ScrollTrigger for scroll-linked                                                                                          |
| 2026-04-02 | Lottie for train + station icons                 | Lightweight, polished illustration, designed in Figma                                                                                       |
| 2026-04-02 | Hybrid 3D env + Lottie train                     | Best of both: interactive depth + illustration quality                                                                                      |
| 2026-04-02 | No 3D on mobile                                  | Performance over spectacle on constrained devices                                                                                           |
| 2026-04-02 | Extended timeline (4-5 weeks)                    | Ship something memorable over something fast                                                                                                |
| 2026-04-02 | MOTION.md created                                | Source of truth for motion language, parallel to brand guide                                                                                |
| 2026-04-02 | SVG train + GSAP MotionPathPlugin                | Train movement is scroll-linked (needs GSAP), not pre-baked                                                                                 |
| 2026-04-02 | Marketplace Lotties for v1                       | Custom Lotties require After Effects skill; marketplace fills the gap                                                                       |
| 2026-04-02 | Additive animation architecture                  | New animations = new files, not refactoring existing code                                                                                   |
| 2026-04-02 | Three animation layers defined                   | Threlte (atmosphere) + GSAP (choreography) + Lottie (illustration)                                                                          |
| 2026-04-02 | Standardized action/component patterns           | Every motion component checks reduced-motion, cleans up on destroy                                                                          |
| 2026-04-02 | SEO as dedicated slice (09)                      | Meta tags, OG, sitemap layered after all pages exist                                                                                        |
| 2026-04-02 | Locale routing deferred                          | URL prefixes (/fr/, /es/) not in v1. Data is ready, routing added when translations exist.                                                  |
| 2026-04-02 | Service interface evolves in slice 04            | Add station, id, relatedProjects when motion infrastructure exists                                                                          |
| 2026-04-02 | Layered animation architecture                   | Four independent layers: Svelte actions (interaction) + GSAP (choreography) + Lottie (illustration) + Threlte (atmosphere). Each removable. |
| 2026-04-02 | SVG train + GSAP MotionPath for movement         | Scroll-linking needs real-time control. Lottie optional for idle polish only.                                                               |
| 2026-04-02 | Marketplace Lotties recolored to brand           | 4 station icons sourced, recolored (#E07800 family), fixed (bg removed, logos adjusted, text replaced). Done.                               |
| 2026-04-02 | Data-driven station system                       | No hardcoded station count. services.length determines everything. Adding a service = 1 object + 1 Lottie.                                  |
| 2026-04-02 | Easter eggs planned                              | Small surprises that reward curiosity (MOTION.md section 9). Implement as time allows.                                                      |
| 2026-04-02 | MOTION.md v1.1                                   | Updated with layered architecture, SVG train approach, marketplace Lottie strategy, easter eggs, data-driven stations.                      |
| 2026-04-03 | Metro System Evolved redesign                    | Home page expanded to 8 stops: hero, 4 services, featured work, about bento, blog, CTA                                                      |
| 2026-04-03 | 3D Montreal metro wagon in hero                  | Sketchfab model (CC BY 4.0, mamont nikita) over AI-generated station art                                                                    |
| 2026-04-03 | Blog from markdown files                         | `src/content/blog/*.md` with frontmatter, parsed at build time via `import.meta.glob`                                                       |
| 2026-04-03 | Station dividers with hazard stripes             | Yellow/black repeating gradient between metro stops                                                                                         |
| 2026-04-03 | Draggable train                                  | Train can be dragged along rail to scroll the page                                                                                          |
| 2026-04-03 | Rail at viewport edge                            | Rail moved from inside max-w-5xl to fixed right edge of viewport                                                                            |
| 2026-04-03 | gltf-transform for model optimization            | 88MB Sketchfab GLB → 4.3MB via dedup + Draco compression                                                                                    |
| 2026-04-03 | Data-driven metro line (metro.ts)                | Stop numbers auto-compute. Adding a service extends the entire rail.                                                                        |
| 2026-04-03 | Centralized i18n content (content.ts)            | All UI strings in one place for future French/Spanish translations                                                                          |
| 2026-04-03 | ~~Replace 3D fab with scroll-linked video~~      | SCRAPPED — 06f removed from plan                                                                                                            |
| 2026-04-04 | Experimental slices (A, B, C) for hero + journey | Rapid prototyping of SVG hero, zoom transition, and horizontal scroll CTA                                                                   |
| 2026-04-04 | GSAP all plugins free                            | SplitText, DrawSVGPlugin, MorphSVGPlugin, CustomEase — all available at no cost                                                             |
| 2026-04-05 | SkillsJourney horizontal scroll section          | 5-panel horizontal scroll with data-driven panels, replacing train journey on home page                                                     |
| 2026-04-05 | Per-word GSAP triggers (trigger: hw)             | Using individual word elements as ScrollTrigger targets instead of paragraph for accurate timing                                            |
| 2026-04-05 | containerAnimation + scrub for all effects       | Pure scrub with containerAnimation naturally reverses on scroll back; no toggleActions/yoyo                                                 |
| 2026-04-05 | No animation on non-keyword text                 | Static white text for uniform look + lighter performance; only keywords get effects                                                         |
| 2026-04-05 | Shape morphs deferred to Slice B+                | MorphSVGPlugin shapes separated from text animations for cleaner delivery                                                                   |


## Rules

1. One slice at a time. No scattering.
2. Spec before code. Always.
3. Review handoff before next slice. Always.
4. Code and tests ship together. No code without tests.
5. CI must be green before merging. No exceptions.
6. tree.txt updated at the end of every slice.
7. Motion follows MOTION.md principles. No random animation.
8. Content decisions happen here (Claude.ai). Code happens in Cursor.
9. Lottie assets sourced before slice 06 starts.
10. Every animation respects prefers-reduced-motion.
11. Station system is fully data-driven. Adding a service = adding one object to services.ts + one Lottie JSON. Zero component/layout changes. Home page, scroll rail, train path, and Threlte nodes all derive from services array length and data. No hardcoded station counts or per-station logic.
12. Each motion layer (Svelte/GSAP/Lottie/Threlte) is independently removable.

