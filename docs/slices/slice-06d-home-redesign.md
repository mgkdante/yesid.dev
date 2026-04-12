# Slice 06d — Home Page Redesign: Metro System Evolved

**Status:** ready
**Priority:** 1
**Estimated effort:** 3-4 sessions
**Depends on:** 06 (complete), 06b (complete), 06c (complete)

## Objective

Redesign the home page from a sparse 4-section layout into a full, bold, 8-stop metro journey — adding a 3D Montreal metro wagon hero, featured projects showcase, about bento grid, blog feed, and enhanced rail/CTA.

## Context

The current home page feels empty: just a hero, 4 service cards, and a CTA. Yesid wants a portfolio site that blends personal brand with professional credibility, inspired by planetono.space (bold/playful), gianmarcocavallo.com (bento grid), sector32.net (futuristic), and alyssafaustino.com (artwork backgrounds). The metro/station theme stays and gets evolved — bolder rail, glowing trail, more stations. A real Montreal metro wagon (Sketchfab, CC-BY 4.0) anchors the hero over AI-generated station artwork.

Full design spec: `docs/specs/2026-04-03-home-redesign-design.md`

## Acceptance Criteria

- [ ] Hero section: split layout — bold "DATA INFRA. BUILT RIGHT." type left, 3D metro wagon right
- [ ] Hero background: AI-generated Montreal metro station art (or solid fallback if not ready)
- [ ] Hero badge: "AVAILABLE FOR HIRE" pill with pulsing glow
- [ ] Hero decoration: SQL snippet in monospace, scroll prompt
- [ ] 3D wagon: Montreal metro model rendered via Threlte, orange `#E07800`, transparent canvas
- [ ] 3D wagon: idle bob animation, scroll-linked rotation, reduced-motion static fallback
- [ ] Services (stops 01-04): existing station cards, bolder active glow
- [ ] Featured Work (stop 05): 2-3 project cards in grid, filtered from `projects` data (`featured: true`)
- [ ] About Bento (stop 06): mini bento grid — photo/intro, tech stack, location, interests
- [ ] Blog Feed (stop 07): 3 latest blog post cards, placeholder content
- [ ] CTA (terminal): enhanced — station label, social links, strongest glow
- [ ] Rail system: 8 station nodes (up from 4), thicker track, brighter glows
- [ ] Train: leaves a fading orange trail
- [ ] Data layer: `BlogPost` type, `blog.ts` with 3 placeholder posts, exported from index
- [ ] All sections use `reveal` action for scroll entry
- [ ] Responsive: all sections stack on mobile, split/grid on desktop
- [ ] `prefers-reduced-motion`: all animations disabled, content visible
- [ ] 3D model attribution in footer (mamont nikita, CC BY 4.0)
- [ ] All tests pass (`bun run test`)
- [ ] Type check passes (`bun run check`)
- [ ] `tree.txt` updated
- [ ] Dev log written
- [ ] Handoff report written (after Yesid approval)

## Technical Spec

### Phase 0: Manual Prerequisites (Yesid)

**3D Model:**
1. Download GLB from https://sketchfab.com/3d-models/montreal-metro-8ae4244d137940dbbd6d5cefda2d8c21
2. Open in Blender — delete station geometry, keep wagon only
3. Decimate from ~2.2M to 50-100K triangles
4. Replace blue material with `#E07800`
5. Export as Draco-compressed GLB → `static/models/metro-wagon.glb`

**Hero Background Art:**
1. Generate via Midjourney/DALL-E: "Montreal metro station interior, dramatic warm lighting, orange neon accents, cinematic, stylized, dark atmosphere"
2. Export as WebP, optimize to 200-400KB → `static/images/hero-station-art.webp`

If assets are not ready, implementation proceeds with solid dark fallback background and a placeholder cube for the 3D scene.

### Phase 1: Data Layer

**`src/lib/data/types.ts`** — Add:
```typescript
export interface BlogPost {
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  date: string; // ISO date
  tags: string[];
  url: string;
  external: boolean;
}
```

**`src/lib/data/blog.ts`** — Create:
- 3 placeholder posts: "Why I Left ORM for Raw SQL", "Building a Transit Pipeline", "Anime Data Viz Challenge"
- `getLatestPosts(count: number)` helper sorted by date desc
- Follow conventions from `services.ts` (readonly array, English-only)

**`src/lib/data/index.ts`** — Add `blogPosts`, `getLatestPosts`, `BlogPost` exports.

**`src/lib/data/data-integrity.test.ts`** — Add blog data tests (unique slugs, valid dates, non-empty strings).

### Phase 2: New Components

**`src/lib/components/HeroBanner.svelte`**
- Layer 1: CSS background-image (hero art) + vignette overlay
- Layer 2: Threlte canvas (`transparent: true`) with WagonScene — dynamic import, client-only
- Layer 3: Split layout — badge, headline, subtitle, CTAs, SQL decoration, ScrollPrompt
- Props: `scrollProgress: number`
- Mobile: stack vertically

**`src/lib/motion/three/WagonScene.svelte`**
- `useGltf` from `@threlte/extras` to load `/models/metro-wagon.glb`
- PerspectiveCamera at 3/4 angle, orange DirectionalLight + AmbientLight
- Idle bob via `useTask`, scroll-linked rotation via `scrollProgress` prop
- `reducedMotion` → static pose

**`src/lib/components/FeaturedWork.svelte`**
- Grid of featured projects, reuses `ProjectCard.svelte`
- Station header: "STOP 05 — FEATURED WORK" (`#FFB627`)
- 2-col desktop, 1-col mobile. `reveal` + `tilt` actions.

**`src/lib/components/AboutBento.svelte`**
- Bento grid: photo+intro (span 2 rows), tech stack, location, interests
- 3-col desktop, 1-col mobile. Hardcoded content.
- `reveal` with stagger, `tilt` on widgets.

**`src/lib/components/BlogCard.svelte`**
- Props: slug, title, excerpt, date, tags, url, external
- Metro-numbered badge, monospace date. `boop` action.

**`src/lib/components/BlogFeed.svelte`**
- `getLatestPosts(3)`, 3-col grid desktop, stack mobile.
- Station header: "STOP 07 — DISPATCHES" (`#999`).

### Phase 3: Rail System Evolution

**`src/routes/+page.svelte`** (rail is inline, lines 92-127):
- Add `TOTAL_STOPS = 8` constant
- Update `activeIndex` and `isStationReached` to use `TOTAL_STOPS`
- Add station nodes for stops 05-07 and Terminal
- Track width: 2px → 3-4px
- Terminal node: 22px, brightest glow

**`src/lib/motion/svg/TrainJourney.svelte`**:
- Add fading orange trail from top to train position

### Phase 4: Integration

**`src/routes/+page.svelte`**:
- Replace inline hero with `<HeroBanner scrollProgress={localProgress} />`
- Keep services `{#each}` loop as-is
- Insert `<FeaturedWork />` after services
- Insert `<AboutBento />` after FeaturedWork
- Insert `<BlogFeed />` after AboutBento
- Enhance CTA: station label "TERMINAL — FINAL DESTINATION", social links, stronger glow
- Add `<link rel="preload" as="image" href="/images/hero-station-art.webp">` to `<svelte:head>`

### Phase 5: Tests & Polish

- Update `src/routes/home.test.ts` for new page structure
- Add `vi.mock('@threlte/extras')` to `src/tests/setup.ts`
- Add 3D model attribution to `Footer.svelte`
- Run `bun run test` + `bun run check`

## Out of Scope

- `/about` page (full bento personality page — future slice)
- `/blog` listing page (future slice)
- `/blog/[slug]` individual post pages (future slice)
- `/work/[slug]` project detail pages (future slice)
- Actual blog content (placeholder only)
- Sound/audio features
- WebGL shader effects (keep it performant)

## Learn

### Three.js GLB Model Loading with Threlte
**What it is:** Loading a 3D model (GLB format) into a Svelte app using Threlte's `useGltf` hook from `@threlte/extras`.
**Why it matters:** Same concept as loading data from a file — but the "data" is 3D geometry, materials, and animations instead of JSON.
**Try this:** Open `/preview` route, see how `HeroScene.svelte` is dynamically imported. The wagon follows the same pattern.
**Go deeper:** https://threlte.xyz/docs/reference/extras/use-gltf

### Bento Grid Layout
**What it is:** A CSS Grid layout where cards span different numbers of rows/columns, creating a dashboard-like arrangement.
**Why it matters:** Same concept as SQL `GROUP BY` + pivot — you're arranging heterogeneous data into a structured visual layout.
**Try this:** Inspect `AboutBento.svelte` with DevTools, toggle grid overlay to see the 3-column structure.
**Go deeper:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout

### Data-Driven Sections
**What it is:** The blog feed section reads from a typed data file, just like services and projects. Adding a post = adding an object.
**Why it matters:** Consistent pattern across the whole site. You already know this from `services.ts`.
**Try this:** Add a 4th blog post to `blog.ts` and watch it appear on the page automatically.
**Go deeper:** https://svelte.dev/docs/svelte/reactivity-fundamentals

## Verify

1. Run `bun run test` — all tests pass
2. Run `bun run check` — no type errors
3. Open `http://localhost:5173/` — scroll through all 8 stops
4. Verify: hero shows split layout with badge, headline, SQL decoration
5. Verify: 3D wagon renders over art background (or placeholder if assets not ready)
6. Verify: 4 service stations light up on scroll (existing behavior preserved)
7. Verify: featured projects section shows project cards
8. Verify: about bento shows 4 widgets in a grid
9. Verify: blog feed shows 3 placeholder cards
10. Verify: CTA has station label, social links, strong orange glow
11. Verify: rail has 8 station nodes with progressive fill
12. Verify: train has orange trail effect
13. Resize to mobile — all sections stack correctly
14. Enable reduced motion in browser — no animations, all content visible
15. Check footer — 3D model attribution present
