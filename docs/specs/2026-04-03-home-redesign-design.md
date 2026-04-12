# Design Spec: yesid. Home Page Redesign — Metro System Evolved

**Date:** 2026-04-03
**Status:** Draft
**Slice:** 06 (iteration — replaces current home page)

## Summary

Redesign the yesid.dev home page from a sparse 4-card layout into a full, bold, metro-themed portfolio experience. The page becomes an 8-stop journey along an orange metro rail. A 3D Montreal metro wagon rendered over AI-generated station artwork anchors the hero. New sections (projects, about bento, blog, CTA) fill the page with both professional credibility and personal brand.

**Inspirations:**
- [planetono.space](https://www.planetono.space/) — bold, playful, 3D, scroll-driven
- [gianmarcocavallo.com](https://gianmarcocavallo.com/) — bento grid, widget variety, dark + accent
- [sector32.net](https://www.sector32.net/) — futuristic terminal UI, text effects
- [alyssafaustino.com](https://alyssafaustino.com/) — artwork as background

## Page Structure (8 Stops)

### STOP 00 — Departure (Hero)

**Layout:** Split — bold typography left, 3D visual right.

**Layer 1 — Background art:**
- AI-generated artwork of a Montreal metro station
- Stylized with warm tones, dramatic lighting, orange accent glow
- Full viewport coverage via CSS `background-image` + `background-size: cover`
- Subtle vignette overlay to darken edges and ensure text contrast

**Layer 2 — 3D wagon:**
- Montreal metro wagon model from Sketchfab (by mamont nikita, CC-BY 4.0)
- Station stripped, wagon only — reduces polygon count significantly
- Recolored from blue to brand orange `#E07800`
- Rendered via Threlte (Three.js for Svelte, already in project at `src/lib/motion/three/`)
- Canvas uses `transparent: true` so art background shows through
- Subtle idle animation: gentle float/bob or slow rotation
- Scroll-linked: wagon may move/rotate as user begins scrolling

**Layer 3 — Content:**
- Top-left: "AVAILABLE FOR HIRE" pill badge (orange bg, dark text, pulsing glow)
- Left side:
  - Station label: `STOP 00 — DEPARTURE` (JetBrains Mono, orange, 10px, tracking 3px)
  - Headline: `DATA INFRA. BUILT RIGHT.` (Inter, 56-72px, 900 weight, -2px tracking)
  - Subtitle: "Freelance SQL development & data infrastructure. Montreal." (14px, #999)
  - CTA buttons: "View work →" (orange solid) + "Get in touch" (ghost border)
- Bottom-left: decorative SQL snippet in monospace (#333, non-interactive)
  ```sql
  SELECT expertise FROM yesid WHERE quality = 'excellent';
  ```
- Bottom-center: scroll prompt "↓ SCROLL TO BEGIN JOURNEY"

**Responsive:**
- Mobile: stack vertically — typography top, 3D wagon below (smaller), CTAs full-width
- Tablet+: split layout as described

### STOPS 01–04 — Services

**What changes from current:**
- Station cards remain data-driven (from `src/lib/data/services.ts`)
- Bolder card borders when active (thicker glow, maybe 2px)
- Lottie animations continue to scroll-scrub
- Station indicator lights stay
- Each card reveals with the existing `reveal` action
- Station sign header bar kept (number + title + indicator light)

**What stays the same:**
- `ServiceStation.svelte` component structure
- GSAP ScrollTrigger per-station for Lottie progress
- `tilt` action on cards
- Progressive rail fill
- Related project cards inside each station

### STOP 05 — Featured Work

**New section.** Shows 2-3 featured projects in a responsive grid.

**Card design:**
- Image/screenshot area at top (placeholder until real screenshots exist)
- Title, one-liner, tech stack tags below
- Uses existing `ProjectCard.svelte` component (or enhanced version)
- `tilt` action on hover
- `reveal` action on scroll entry
- Links to `/work/[slug]` (page doesn't exist yet — link is forward-compatible)

**Data source:** Filters `projects` array for `featured: true` and `status: 'public'`.

**Layout:** 2-column grid on desktop, single column on mobile.

**Station header:** `STOP 05 — FEATURED WORK` in monospace, accent color `#FFB627` for variety.

### STOP 06 — Who's Driving (About Bento)

**New section.** Mini bento grid teasing the About page.

**Grid layout (desktop):** 3 columns, 2 rows
- **Photo + intro** (spans 2 rows, col 1): avatar/photo, "Yesid O.", "Freelance Data Engineer", short bio, "→ More about me" link to /about
- **Tech stack** (col 2, row 1): badges for PostgreSQL, SQL Server, Python, Power BI, Retool, SvelteKit
- **Location** (col 3, row 1): "Montreal, QC, Canada"
- **Interests** (cols 2-3, row 2): "Anime · Data viz · Open source · Montreal food scene"

**Mobile:** single column, stacked.

**Each widget:**
- Dark card surface (`#1a1a1a`), border (`#2a2a2a`), rounded corners
- Reveals with staggered animation (existing `reveal` + `stagger` utility)
- Consistent with station card visual language

**Station header:** `STOP 06 — WHO'S DRIVING` in monospace, orange.

### STOP 07 — Dispatches (Blog Feed)

**New section.** Shows 3 latest blog posts.

**Card design:**
- Date (monospace, muted)
- Title (14px, bold, white)
- Excerpt/teaser (12px, #999)
- Metro-numbered badge in corner (like station numbers)
- Links to `/blog/[slug]` (forward-compatible)

**Layout:** 3-column grid on desktop, horizontal scroll or stack on mobile.

**Data source:** New `BlogPost` type in data layer. Initially placeholder content (lorem ipsum) with realistic titles.

**Station header:** `STOP 07 — DISPATCHES` in monospace, muted (#999).

### TERMINAL — Final Destination (CTA)

**Enhanced version of current CTA section.**

- Largest station node (22px, brightest glow, double shadow)
- Station label: `TERMINAL — FINAL DESTINATION`
- Headline: "Let's build something that moves." (28-32px, bold)
- Subtitle: "Have a data problem? Let's talk. Available for freelance projects and consulting."
- CTA buttons: "Get in touch" (orange solid) + "View on GitHub" (ghost)
- Social links row: LinkedIn, GitHub, Upwork, Email
- Card has orange border + strongest glow of any section
- `magnetic` action on CTA buttons (already exists)

## Rail System (Evolved)

**What changes:**
- Track: thicker (3px → 4px), more visible
- Station nodes: larger, glow brighter, possibly burst with subtle particle effect when reached
- Train: leaves a fading orange trail as it moves
- Progressive fill continues to work as-is
- Crossties remain but get brighter when passed

**New stations added:** The rail now has nodes for stops 05, 06, 07, and Terminal in addition to 00-04.

**Component:** `ScrollRail.svelte` and `TrainJourney.svelte` — extended, not rewritten.

## Data Layer Changes

### New type: `BlogPost`

```typescript
// In src/lib/data/types.ts
export interface BlogPost {
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  date: string; // ISO date string
  tags: string[];
  // URL to the full post — could be internal (/blog/slug) or external (LinkedIn)
  url: string;
  // Whether the post is hosted on this site or is an external link
  external: boolean;
}
```

### New data file: `src/lib/data/blog.ts`

Placeholder content with 3 posts (lorem ipsum, realistic titles like "Why I Left ORM for Raw SQL", "Building a Transit Pipeline", "Anime Data Viz Challenge").

### Export from `src/lib/data/index.ts`

Add `blogPosts` to the barrel export alongside `services`, `projects`, `siteMeta`.

## 3D Hero — Technical Details

### Model Source
- **Model:** "Montreal Metro" by mamont nikita (@mamontnikita62)
- **URL:** https://sketchfab.com/3d-models/montreal-metro-8ae4244d137940dbbd6d5cefda2d8c21
- **License:** CC Attribution 4.0 — must credit creator
- **Attribution:** Add to site footer or a credits page

### Optimization Pipeline (Manual Step — Yesid or Claude)
1. Download glTF/GLB from Sketchfab
2. Open in Blender — delete station geometry, keep wagon only
3. Decimate from ~2.2M to 50-100K triangles
4. Replace blue material with brand orange `#E07800`
5. Export as compressed GLB (Draco compression)
6. Place in `static/models/metro-wagon.glb`

Note: Steps 2-5 require Blender (free, open source). If Yesid is not familiar with Blender, this can be done together or an alternative is to use gltf-transform CLI for simpler optimizations.

### Rendering
- Use existing Threlte setup (`src/lib/motion/three/`)
- Scene: single wagon, orange accent directional light, subtle ambient
- Camera: angled 3/4 view, slightly above
- Background: transparent (CSS art shows through)
- Animation: gentle bob/float idle, possible scroll-linked rotation
- Performance: lazy-load on client only (`onMount` + dynamic import pattern, already used in `/preview`)

### Background Art (Manual Step — Yesid)
- AI-generated image of a Montreal metro station (generate using Midjourney, DALL-E, or similar)
- Prompt direction: "Montreal metro station interior, dramatic warm lighting, orange neon accents, cinematic, stylized, dark atmosphere"
- Iterate on the prompt until the image matches the brand vibe
- Format: WebP, optimized for web (~200-400KB)
- Placed in `static/images/hero-station-art.webp`
- Applied via CSS `background-image` on the hero section
- Darkened overlay gradient ensures text readability

## Existing Components to Reuse

| Component | Location | Reuse |
|-----------|----------|-------|
| `ServiceStation.svelte` | `src/lib/components/` | Keep as-is, minor style tweaks |
| `ProjectCard.svelte` | `src/lib/components/` | Reuse in Featured Work section |
| `ScrollRail.svelte` | `src/lib/motion/components/` | Extend with new station nodes |
| `TrainJourney.svelte` | `src/lib/motion/svg/` | Enhance trail effect |
| `LottiePlayer.svelte` | `src/lib/motion/components/` | Keep as-is |
| `ScrollPrompt.svelte` | `src/lib/components/` | Keep in hero |
| `SectionHeader.svelte` | `src/lib/components/` | Reuse for new sections |
| `Nav.svelte` | `src/lib/components/` | No changes |
| `Footer.svelte` | `src/lib/components/` | Add 3D model attribution |

## Motion Actions to Reuse

| Action | File | Usage |
|--------|------|-------|
| `tilt` | `src/lib/motion/actions/tilt.ts` | Project cards, about widgets |
| `boop` | `src/lib/motion/actions/boop.ts` | Interactive elements |
| `reveal` | `src/lib/motion/actions/reveal.ts` | All new sections on scroll |
| `magnetic` | `src/lib/motion/actions/magnetic.ts` | CTA buttons |
| `ripple` | `src/lib/motion/actions/ripple.ts` | Click feedback |

## New Components Needed

| Component | Purpose |
|-----------|---------|
| `HeroBanner.svelte` | New hero with 3D wagon + art bg + split layout |
| `FeaturedWork.svelte` | Featured projects grid section |
| `AboutBento.svelte` | Bento grid about teaser |
| `BlogFeed.svelte` | Latest blog posts section |
| `BlogCard.svelte` | Individual blog post card |
| `StationLabel.svelte` | Reusable "STOP NN — NAME" header (optional — could be inline) |

## Responsive Strategy

- **Mobile (< 768px):** Single column throughout. Hero stacks vertically. Blog cards stack or horizontal scroll. Bento grid becomes single column.
- **Tablet (768-1024px):** 2-column grids. Hero split may compress.
- **Desktop (1024+):** Full split hero, 2-3 column grids, rail fully visible.

Rail and train work at all sizes (already responsive from slice 06b).

## Performance Considerations

- 3D wagon: lazy-loaded, client-only (no SSR). Show loading placeholder until ready.
- Hero art: preloaded via `<link rel="preload">` for fast LCP.
- Blog/project data: static, no API calls needed.
- New sections use existing GSAP ScrollTrigger — one trigger per section.
- Intersection Observer (via `reveal` action) handles most entrance animations.

## Accessibility

- All sections have semantic HTML (`<section>`, headings hierarchy)
- `prefers-reduced-motion`: disable 3D animation, train movement, scroll effects (existing system)
- 3D canvas is `aria-hidden="true"` (decorative)
- Alt text for hero background art
- Focus-visible styles on all interactive elements (existing)

## Out of Scope

- `/about` page (full bento personality page — future slice)
- `/blog` listing page (future slice)
- `/blog/[slug]` individual post pages (future slice)
- `/work/[slug]` project detail pages (future slice)
- Actual blog content (placeholder only for now)
- Sound/audio (planetono has it, we don't need it yet)
