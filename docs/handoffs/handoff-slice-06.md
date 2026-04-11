# Handoff: Slice 06 — Home Page: Train Journey + Hero 3D Scene

## Summary
Built the centerpiece home page — a scroll-driven train journey between service stations. Three visual layers stack: a Threlte 3D scene (fixed background), an SVG train animated via GSAP MotionPathPlugin (scroll-linked), and scrollable HTML content with station sections, Lottie icons, and a CTA. Desktop gets the full experience; mobile falls back to a CSS gradient with no 3D or train. All 207 tests pass.

## What Was Built
- `src/routes/+page.svelte`: Full home page with 3-layer architecture (3D + train + content)
- `src/routes/+page.ts`: SSR disabled (Three.js/GSAP need browser APIs)
- `src/lib/components/ServiceStation.svelte`: Station section (Lottie icon + title + description + related projects)
- `src/lib/components/ScrollPrompt.svelte`: Animated scroll-down chevron for the hero
- `src/lib/motion/svg/TrainJourney.svelte`: Train + GSAP MotionPathPlugin scroll-linked layer
- `src/lib/motion/svg/train-path.ts`: Motion path generator for the train trajectory

## Files Modified
- `src/routes/+layout.svelte`: Conditional container — home page is full-width, other pages get centered max-w-5xl
- `src/tests/setup.ts`: Added canvas mock (lottie-web CJS init), @threlte/core mock, postprocessing mock, GSAP timeline mock
- `src/lib/assets/lottie/*.json` → `static/lottie/`: Moved 4 Lottie files for URL-based serving
- `docs/reference/ARCHITECTURE.md`: Added all new files to structure diagram
- `tree.txt`: Regenerated

## How It Works

### Three-layer stack (back to front)

```
Layer 1: Threlte Canvas (position:fixed, z-0)
  - HeroScene.svelte: data paths brighten, station nodes glow as scroll progresses
  - Dynamically imported on desktop only (code-split, no Three.js on mobile)

Layer 2: SVG Train (position:fixed, z-10)
  - TrainJourney.svelte: GSAP timeline scrubbed by scrollProgress
  - Train.svelte travels along a computed cubic bezier path
  - Wheels rotate, nose glow intensifies with scroll

Layer 3: HTML Content (position:relative, z-20)
  - Hero: "yesid." + "The infrastructure is ready." + scroll prompt
  - 4 ServiceStation sections: semi-transparent cards over the 3D scene
  - CTA: "Let's build something that moves." + View work / Get in touch links
```

### Scroll wiring

GSAP ScrollTrigger watches the scroll wrapper div. Its `onUpdate` callback writes a `localProgress` (0-1) `$state` variable. This feeds into `HeroScene` and `TrainJourney` as props. The global `scrollProgress` store still updates independently (via `window.scrollY`) for the `ScrollRail` component.

### Mobile fallback

A `matchMedia('(min-width: 768px)')` check determines `isDesktop`. When false:
- No dynamic import of HeroScene (zero Three.js/Threlte download)
- No TrainJourney layer
- CSS gradient background instead of 3D
- Station sections and Lottie icons still work normally

### ServiceStation data flow

```
services array → {#each} → ServiceStation component
  → resolveLocale(service.title, 'en') → SectionHeader
  → resolveLocale(service.description, 'en') → paragraph
  → service.icon → LottiePlayer src="/lottie/{icon}"
  → service.relatedProjects → getProjectBySlug() → filter private → ProjectCard[]
```

## Decisions Made

| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| `ssr = false` for home page | Three.js/GSAP need browser APIs; preview route uses same pattern | Guard every import behind onMount — more complex for same result |
| Lottie files moved to `static/lottie/` | LottiePlayer uses `path:` (URL fetch); `src/lib/assets/` requires build-time import | Add `animationData` prop to LottiePlayer — larger change |
| Local `$state(0)` for scroll progress | Keeps GSAP-driven progress separate from the global store used by ScrollRail | Use global store for everything — coupling risk |
| HTML div for train (not embedded SVG) | GSAP MotionPathPlugin works on HTML elements via CSS transforms; avoids refactoring Train.svelte | Embed train SVG content inside TrainJourney's SVG — would break 8 existing Train tests |
| `isDesktop` via matchMedia | Reactive to orientation changes; skips Three.js download entirely on mobile | CSS display:none — still downloads Three.js |
| Semi-transparent station backgrounds | 3D scene shows through gaps between stations | Opaque — hides the 3D investment |
| Station sections `min-h-[80vh]` | Full screen per station makes the page too tall (6 full screens) | `min-h-screen` — excessive scroll length |
| Canvas mock in test setup | lottie-web CJS code accesses canvas on import before vi.mock intercepts | Ignore errors — exits with error code |

## What Yesid Should Know

### Three visual layers
The home page works like a deck of transparent slides stacked on top of each other. The 3D scene is at the back, always visible. The train is in the middle. The HTML content is on top, with transparent gaps so you can see the glow through. As you scroll, all three layers respond to the same progress value (0-1). It's like a query execution plan — one input (scroll position) flows through three independent processing stages.

### Dynamic imports
`import('$lib/motion/three/HeroScene.svelte')` is a JavaScript promise. It tells the browser: "download this module only when I ask for it." On mobile, we never ask, so the browser never downloads Three.js (~50KB). This is code splitting — the same concept as partitioning a table so queries only scan the partitions they need.

### GSAP MotionPathPlugin
The train doesn't move by setting `left` and `top` CSS properties frame-by-frame. Instead, GSAP takes an SVG path string (like `M -200,918 C 467,918 933,875 1060,875 S 1653,918 2120,918`) and computes where the train should be at any point along that path. The `timeline.progress(0.5)` call places the train exactly at the midpoint of the curve. Scroll position maps 1:1 to path progress.

### SSR = false
Server-side rendering means the server pre-renders HTML before sending it to the browser. Three.js needs WebGL (a browser API), so it crashes on the server. Setting `ssr = false` tells SvelteKit to skip server rendering for this page and let the browser render everything. The trade-off: slightly slower first paint, but no SSR crashes. SEO meta tags will be added in slice 09 to compensate.

## What Comes Next
**Slice 07 — Work Pages (Index + FLIP Filter + Detail):** builds `/work` (project grid with tag filtering) and `/work/[slug]` (project detail). Components from slices 03-04 (ProjectGrid, ProjectCard, TagList) compose with `use:reveal` and stagger animations. No 3D on these pages.

## How to Verify
1. `bun run test` — all 207 tests pass
2. `bun run check` — 0 errors, 4 warnings (pre-existing Threlte component warnings)
3. `bun run dev` → `http://localhost:5173/`
4. Desktop: 3D scene as background, train moves on scroll, stations reveal, Lottie icons animate, CTA at bottom
5. Resize to mobile (< 768px): gradient background, no 3D, no train, stations still work
6. Nav and Footer still appear on all pages
7. ScrollRail station dots still activate on scroll
8. Navigate to `/preview` — 3D scene preview still works
