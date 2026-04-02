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
8. **Progressive.** Full experience on desktop (3D + Lottie + scroll choreography). Graceful degradation on mobile (no 3D, simplified animations). Respects `prefers-reduced-motion`.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | Bun | Learning opportunity, fast, npm-compatible |
| Framework | SvelteKit 2 + Svelte 5 | Already invested (Rail), fast, good DX |
| Language | TypeScript | Type safety for data, catches errors early |
| Styling | Tailwind CSS + tokens.css | Brand config exists as tailwind.brand.js |
| Fonts | Inter + JetBrains Mono | Brand standard, Google Fonts |
| 3D | Threlte (@threlte/core + @threlte/extras) + Three.js | Svelte-native 3D, declarative, typed |
| Scroll animation | GSAP + ScrollTrigger | Industry standard, scroll-linked timelines |
| Illustrated motion | Lottie (lottie-web) | Lightweight vector animations for train + icons |
| Unit/Component Tests | Vitest + @testing-library/svelte | Fast, native SvelteKit integration |
| E2E Tests | Playwright | Browser-level confidence |
| CI | GitHub Actions | Runs tests + lint on every push/PR |
| CD | Vercel | Auto-deploy main, preview deploys on PRs |
| Data | TypeScript files (no CMS, no DB) | Simple, version controlled, type-checked |

## Site Architecture

```
Routes:
  /                  -> Home (train journey: hero → stations → CTA)
  /work              -> Project index (card grid, filterable by tag)
  /work/[slug]       -> Project detail (rendered from data)
  /about             -> Bio, focus areas, skills
  /contact           -> Links (email, GitHub, LinkedIn, Upwork)

Data files:
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
interface Project {
  slug: string
  title: string
  oneLiner: string
  description: string
  stack: string[]
  tags: string[]
  status: 'public' | 'private' | 'wip'
  featured: boolean
  repoUrl?: string
  liveUrl?: string
  sections: {
    title: string
    content: string
  }[]
}

interface Service {
  id: string
  title: string
  description: string
  station: number          // Position in the train journey (1-4)
  icon?: string            // Lottie animation filename
  relatedProjects: string[] // slugs of related projects to show at this station
}

interface SiteMeta {
  name: string
  tagline: string
  description: string
  links: {
    email: string
    github: string
    linkedin?: string
    upwork?: string
  }
}
```

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
- Steps: install (bun install), lint, type-check, unit tests (bun test), build, e2e tests
- PR cannot merge if any step fails

**Test file convention:**
- Unit tests: next to the file they test (e.g., `ProjectCard.test.ts` beside `ProjectCard.svelte`)
- E2E tests: in `tests/` directory at project root (e.g., `tests/home.spec.ts`)

## Self-Documentation

**tree.txt** at project root is updated at the end of every slice. It is the repo's self-portrait.

Generate with:
```bash
tree -I "node_modules|.git|.remember|bun.lockb|.svelte-kit|.vercel|dist|build|*.log|.DS_Store" --charset ascii > tree.txt
```

## Slices

| # | Name | Status | Depends On | Est. Sessions |
|---|------|--------|------------|---------------|
| 01 | Project scaffold + brand + CI pipeline | complete | none | 1 |
| 02 | Data layer (types, data files, site meta) | complete | 01 | 1 |
| 03 | Motion infrastructure (GSAP, Threlte, Lottie, Svelte actions) | planned | 01 | 1-2 |
| 04 | Component library + micro-interactions | planned | 02, 03 | 1-2 |
| 05 | Layout shell + scroll progress rail | planned | 03, 04 | 1 |
| 06 | Home page: train journey + hero 3D scene | planned | 02, 03, 04, 05 | 2-3 |
| 07 | Work pages (index + FLIP filter + detail) | planned | 02, 04, 05 | 1-2 |
| 08 | About + Contact pages | planned | 02, 04, 05 | 1 |
| 09 | E2E test suite + performance + brand QA | planned | 06, 07, 08 | 1-2 |
| 10 | Repo cleanup for public release | planned | 09 | 0.5 |
| 11 | Deploy to Vercel + DNS cutover | planned | 10 | 1 |

## Slice Summaries

### Slice 01 — Project Scaffold + Brand + CI Pipeline
**Status:** complete
Initialize SvelteKit 2 with Bun, TypeScript, Tailwind (extending brand config), Vercel adapter. Vitest + Playwright configured. GitHub Actions CI green. See `docs/handoffs/handoff-slice-01.md`.

### Slice 02 — Data Layer
**Status:** complete
TypeScript interfaces for Project, Service (with station number), SiteMeta. Data files with initial content (4 services, 2 seed projects). Localization-ready with LocalizedString type (en/fr/es). Helper functions tested. See `docs/handoffs/handoff-slice-02.md`.

### Slice 03 — Motion Infrastructure
Install and configure GSAP + ScrollTrigger, Threlte + Three.js, lottie-web. Create the `src/lib/motion/` directory structure per MOTION.md section 13. Build reusable Svelte actions: `use:boop`, `use:reveal`, `use:magnetic`, `use:ripple`. Create motion stores: scroll position, `prefersReducedMotion`. Build utility: stagger timing calculator with randomization. Build `LottiePlayer.svelte` component (generic wrapper for lottie-web). Ensure all motion respects `prefers-reduced-motion`. Test actions in isolation.

**All actions and components follow the standardized patterns defined in MOTION.md sections 13-14.**

**Tests:** Actions apply/remove transforms. Reduced motion store reads OS preference. Stagger calculator produces correct timing arrays. LottiePlayer renders without errors.
**You'll learn:** Svelte actions (`use:` directive), GSAP basics, spring physics (svelte/motion), accessibility with prefers-reduced-motion.

### Slice 04 — Component Library + Micro-Interactions
Build components that ship with their animation behavior from day one: ProjectCard (with boop hover + reveal entrance), ProjectGrid (with FLIP-animated filtering), ServiceStation (station content block), TagList (stagger entrance), SectionHeader, Hero shell (without 3D yet, just layout). Each component uses the actions from slice 03.

**Tests:** Component render tests for each. Hover interaction tests. Edge cases (empty data, missing optional fields).
**You'll learn:** Svelte 5 components with runes, component composition, FLIP animation with Svelte's `animate:flip`.

### Slice 05 — Layout Shell + Scroll Progress Rail
Root layout: Nav (wordmark left, links right) + Footer + ScrollRail component. Responsive hamburger menu. ScrollRail shows on all pages: simple progress bar on inner pages, station markers on home page. Page transition animation between routes.

**Tests:** Nav renders all links. ScrollRail tracks scroll percentage. Wordmark structure correct. Footer renders. Page transitions don't break navigation.
**You'll learn:** SvelteKit layouts, responsive nav, scroll-linked UI, page transitions.

### Slice 06 — Home Page: Train Journey + Hero 3D Scene
The centerpiece. Build the scroll-driven train journey:
- Threlte 3D scene: minimal dark space with glowing data paths, station nodes, subtle grid, bloom post-processing. Camera parallax on mouse. Scene responds to scroll position (MOTION.md section 6).
- SVG train: designed in Figma, animated with GSAP MotionPathPlugin along a scroll-linked curve. Wheel rotation, window glow, accent pulse (MOTION.md section 8).
- Lottie station icons: marketplace-sourced, play when scroll reaches each station (MOTION.md section 7).
- Station sections: 4 services rendered as `ServiceStation` components, revealed by scroll.
- Hero: 3D background + wordmark + tagline overlay + scroll prompt.
- CTA section at the bottom (destination station).
- Mobile fallback: no 3D, CSS gradient + simplified SVG paths instead.

**Pre-slice work (done in Claude.ai before starting):**
- Design SVG train in Figma with named groups for GSAP animation
- Source 4 Lottie station icons from LottieFiles marketplace
- Finalize hero copy and CTA text
- Sketch approximate data path curves for Threlte scene

**Tests:** Hero renders. 3D canvas initializes (or fallback renders on mobile). All 4 stations render with correct service data. Scroll progress updates. CTA section renders. Lottie icons load.
**You'll learn:** Threlte scene composition, Three.js geometry + materials + lighting, GSAP ScrollTrigger timelines, GSAP MotionPathPlugin, Lottie integration, scroll-linked animation, responsive 3D fallback.

### Slice 07 — Work Pages (Index + FLIP Filter + Detail)
/work index: ProjectGrid with animated tag filtering (FLIP). /work/[slug]: detail page with scroll-reveal sections and stagger-animated tech tags. 404 for invalid slugs.

**Tests:** Index shows all public projects. Tag filter animates correctly. Detail renders from slug. Tech tags stagger. 404 on bad slug.
**You'll learn:** Dynamic routes ([slug]), FLIP animation, data-driven filtering, scroll-reveal composition.

### Slice 08 — About + Contact Pages
About: bio section (fade entrance), focus areas, skills (stagger tags). Contact: links from SiteMeta with stagger entrance and boop hover on icons.

**Tests:** Pages render. Links valid. Content matches data. Hover interactions work.
**You'll learn:** Static pages with motion, keeping animation restrained when content is primary.

### Slice 09 — E2E Test Suite + Performance + Brand QA Pass
Playwright E2E tests: full nav flow, train journey scroll, project detail, all pages at 3 breakpoints. Performance testing: verify frame rate during scroll on home page. Brand verification: colors, fonts, motion consistency. Fix visual/responsive/performance issues. Optional: add easter eggs from MOTION.md section 9.

**Tests:** Full navigation flow. Train journey completes without jank. Responsive at 375px, 768px, 1280px. No mobile overflow. Frame rate above 45fps on scroll. Reduced motion mode works.
**You'll learn:** E2E testing, performance profiling, responsive QA, accessibility verification.

### Slice 10 — Repo Cleanup for Public Release
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

### Slice 11 — Deploy to Vercel + DNS Cutover
Connect repo to Vercel. Configure build (Bun). Auto-deploy main, preview on PRs. Test preview. Update yesid.dev DNS. Verify live + CI/CD end to end.

**Tests:** Build succeeds. Preview works. Production works. 3D scene loads. CI blocks bad merges.

## Pre-Slice Work (done here in Claude.ai, not Cursor)

- **Before Slice 02:** ~~Finalize project descriptions, service definitions, site meta~~ (done)
- **Before Slice 06:** Design SVG train in Figma. Source 4 Lottie station icons from LottieFiles marketplace. Write hero copy and CTA text. Sketch data path curves for Threlte scene.
- **Before Slice 08:** Write About page bio
- **Before Slice 10:** Verify backup path exists on local machine

## Lottie Asset Pipeline

### v1: Marketplace sourcing

For v1, Lottie animations are sourced from lottiefiles.com. Selection criteria:

- **Style:** Geometric, clean lines, minimal. No cartoon.
- **Color:** Must work on dark backgrounds. Recolor to brand palette.
- **Size:** Under 50KB per JSON.
- **License:** Free for commercial use.

**Required assets (before slice 06):**

| Asset | Source | Search terms |
|-------|--------|-------------|
| Station 1 icon (SQL) | LottieFiles marketplace | "database", "sql", "code" |
| Station 2 icon (Pipelines) | LottieFiles marketplace | "pipeline", "data flow", "workflow" |
| Station 3 icon (Analytics) | LottieFiles marketplace | "analytics", "chart", "dashboard" |
| Station 4 icon (Performance) | LottieFiles marketplace | "performance", "speed", "optimization" |
| Train idle glow (optional) | LottieFiles marketplace | "data", "pulse", "glow" |

Place all Lottie JSON files in `src/lib/assets/lottie/`.

### v2+: Custom Lotties

When ready to create custom animations, swap marketplace JSON files for custom ones. The `LottiePlayer.svelte` component accepts any Lottie JSON. No code changes needed.

**Design flow for custom Lotties:**
1. Design in Figma (shapes, colors, keyframe planning)
2. Export to After Effects (or animate directly if simple)
3. Export with Bodymovin plugin as JSON
4. Replace file in `src/lib/assets/lottie/`

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-01 | Slice-based workflow adopted | Prevents scope creep, forces sequential focus |
| 2026-04-01 | SvelteKit 2 chosen | Prior investment (Rail), good DX, Vercel-native |
| 2026-04-01 | Dark theme only in v1 | Brand default, reduces scope |
| 2026-04-01 | Data-driven architecture | Site grows with career, no hardcoded content |
| 2026-04-01 | No CMS in v1 | TS files are simpler, version controlled, type-safe |
| 2026-04-01 | Future phases parked | Ship site before anything else |
| 2026-04-02 | Site is a platform, not a snapshot | Components and data are generic |
| 2026-04-02 | TDD integrated into every slice | Tests ship with code, CI enforces quality |
| 2026-04-02 | GitHub Actions + Vercel CD | Automated pipeline from push to production |
| 2026-04-02 | Repo cleanup before public | Pipeline artifacts archived locally, repo stays clean |
| 2026-04-02 | Archive path | C:\Users\otalo\Yesito\cloud\yesid-pipeline-archive\ |
| 2026-04-02 | Bun as runtime | Learning opportunity, fast, drop-in npm replacement |
| 2026-04-02 | tree.txt updated every slice | Repo self-documents its structure |
| 2026-04-02 | Motion-first approach adopted | Every component ships with animation from day one |
| 2026-04-02 | Train journey metaphor for home page | Single continuous narrative tied to brand + career |
| 2026-04-02 | Threlte for 3D (minimal dark + glowing paths) | Svelte-native, declarative, typed |
| 2026-04-02 | GSAP for scroll choreography | Industry standard, ScrollTrigger for scroll-linked |
| 2026-04-02 | Lottie for train + station icons | Lightweight, polished illustration, designed in Figma |
| 2026-04-02 | Hybrid 3D env + Lottie train | Best of both: interactive depth + illustration quality |
| 2026-04-02 | No 3D on mobile | Performance over spectacle on constrained devices |
| 2026-04-02 | Extended timeline (4-5 weeks) | Ship something memorable over something fast |
| 2026-04-02 | MOTION.md created | Source of truth for motion language, parallel to brand guide |
| 2026-04-02 | SVG train + GSAP MotionPathPlugin | Train movement is scroll-linked (needs GSAP), not pre-baked |
| 2026-04-02 | Marketplace Lotties for v1 | Custom Lotties require After Effects skill; marketplace fills the gap |
| 2026-04-02 | Additive animation architecture | New animations = new files, not refactoring existing code |
| 2026-04-02 | Three animation layers defined | Threlte (atmosphere) + GSAP (choreography) + Lottie (illustration) |
| 2026-04-02 | Standardized action/component patterns | Every motion component checks reduced-motion, cleans up on destroy |

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
