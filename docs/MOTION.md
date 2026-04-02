# yesid. Motion Design Spec

**Version:** 1.0 | April 2026
**Status:** Approved
**Companion to:** `brand/yesid_brand_guide.pdf`

This document defines the motion language, interaction patterns, 3D art direction, and animation toolkit for yesid.dev. It is the source of truth for how things move. The brand guide defines how things look. This defines how things feel.

---

## 1. Core Metaphor: Data in Transit

The tagline is "Data infrastructure that moves." The motion system makes that literal.

Everything on the site follows the metaphor of **data flowing through infrastructure**:
- The visitor's scroll is the "query" that moves data through the system
- Content appears as "results" arriving at their destination
- The home page is a **train journey between stations**, each station a service
- The track is the scroll progress indicator

Three visual sources feed the metaphor:

| Source | Motion quality | Where it shows up |
|--------|--------------|-------------------|
| Trains / rail | Smooth, directional, rhythmic along defined paths | Home page journey, scroll progress rail |
| Data pipelines | Records flowing, transforming, materializing | Section reveals, element entrances |
| Infrastructure | Grid, tracks, routes, connections | Background environment, subtle depth |

**The metaphor is:** yesid. is the infrastructure. The visitor's attention is the data moving through it.

---

## 2. Motion Principles (Non-Negotiable)

These rules apply to every animation on the site. No exceptions.

### Directional, not random
Movement follows paths: left-to-right (reading direction, train direction), top-to-bottom (data flowing down a pipeline). No random floating particles. No particles.js. If something moves, it moves with purpose along a defined vector.

### Earned, not free
Elements appear when the visitor reaches them (scroll-triggered), not all at once on page load. The scroll is the "query" that returns results. This also helps performance by deferring work.

### Spring physics, not linear easing
Everything uses spring or elastic easing, never `ease-in-out`. Springs feel alive and physical. Svelte has this built in (`svelte/motion` spring stores). GSAP's `elastic` and `back` easings also work.

### Layered timing, not synchronized
When multiple elements animate, they stagger. Each element gets slightly randomized duration (±10-20% of base duration). Stagger + slight randomness = organic. Synchronized = robotic.

### Purposeful, not performative
Every animation answers: "what does this help the user understand?" If the answer is "nothing, it just looks cool," simplify it. The site should feel like a well-engineered system, not a tech demo. Animation is salt, not the main dish.

---

## 3. Animation Toolkit

### The Three Layers (Each Has a Job)

The site uses three animation technologies. Each handles a specific layer. They don't compete; they stack.

| Layer | Tool | Job | When it runs |
|-------|------|-----|-------------|
| Atmosphere | Threlte (Three.js) | 3D depth, glow, particles, background environment | Always running on hero; responds to scroll + mouse |
| Choreography | GSAP + ScrollTrigger | Scroll-linked movement, section reveals, timeline sequencing, SVG path animation | Triggered by scroll position |
| Illustration | Lottie (lottie-web) | Pre-designed icon animations, idle loops, decorative micro-moments | Triggered by scroll or component mount |
| Interaction | Svelte transitions + actions | Hover boops, magnetic cursor, ripple clicks, enter/exit transitions | Triggered by user interaction |

### Why this specific combination

**Threlte** creates the "this isn't a template" feeling. The 3D scene gives depth and atmosphere that 2D cannot replicate. It's the emotional hook.

**GSAP** is the orchestrator. It ties everything to scroll position, sequences timelines, and handles the train's movement along SVG paths. Every Awwwards-winning scroll experience uses GSAP.

**Lottie** handles detail-heavy illustration animation. A database icon with 15 moving parts is impractical to code in GSAP but trivial in Lottie. For v1, source from the LottieFiles marketplace. The architecture supports custom Lotties later.

**Svelte actions** make things feel alive between the big moments. The little hover bounces, the cursor magnetism, the click feedback. These are the "I want to keep touching things" layer.

### Libraries and bundle cost

| Package | Purpose | Size (gzipped) |
|---------|---------|----------------|
| `gsap` | Animation engine + ScrollTrigger | ~30 KB |
| `@threlte/core` | Svelte Three.js bindings | ~50 KB (tree-shaken with three) |
| `@threlte/extras` | Helpers: Float, useGltf, effects | Included above |
| `three` | 3D engine (peer dep of Threlte) | Included above |
| `lottie-web` | Lottie animation player | ~15 KB |
| `svelte/motion` | Spring stores, tweened stores | 0 KB (built into Svelte) |

### What we are NOT using

- **Framer Motion:** React-only
- **particles.js:** Generic, overused, no semantic purpose
- **AOS / animate.css:** Too generic, no brand alignment
- **Custom After Effects Lotties (v1):** Learning curve too high for v1; marketplace fills the gap

### Installation

```bash
bun add gsap @threlte/core @threlte/extras three lottie-web
bun add -d @types/three
```

---

## 4. Interaction Patterns

### Hover: "Boop" style

Instead of static hover states (scale up on hover, scale down on leave), use a **boop**: briefly apply a transformation that resets itself after a short interval (~300ms), regardless of whether the user is still hovering. This creates a short burst of motion that feels alive.

- **Implementation:** A Svelte action (`use:boop`) that applies a CSS transform on mouseenter and removes it after a timeout
- **Default transform:** `scale(1.05)` with spring easing
- **Variants:** rotation boop for icons, translateY boop for cards
- **Apply to:** Project cards, nav links, CTAs, the orange dot in "yesid.", contact links

### Scroll: Staged reveals

As the user scrolls, content enters from defined directions consistent with the data-flow metaphor:

- **Services/cards:** Slide in from left (data entering the pipeline)
- **Projects:** Materialize in place (opacity 0→1 + scale 0.95→1)
- **Text blocks:** Fade up (translateY 20px→0 + opacity 0→1)
- **Numbers/stats:** Count up from 0 when entering viewport

Each section has staggered entrance timing. Base stagger: 80-120ms between elements.

- **Implementation:** GSAP ScrollTrigger with `batch()` for groups of elements, or a Svelte action (`use:reveal`) that wraps ScrollTrigger
- **Trigger point:** Element enters at 80% of viewport height
- **Duration:** 600-800ms per element

### Scroll: Progress rail

A thin line (2px) runs along the right edge of the page, filling with orange (#E07800) as the user scrolls. This is the "track" the train travels on.

- On the home page: The rail has station markers (small dots/nodes) at each service section. When the scroll passes a station, the node lights up orange.
- On other pages: Simple progress indicator, no stations.
- **Implementation:** A fixed-position SVG or CSS element that uses scroll percentage to set `scaleY` or `stroke-dashoffset`

### Cursor: Magnetic pull (desktop only)

Interactive elements have a subtle magnetic pull when the cursor is within ~50px. The element shifts 2-3px toward the cursor position.

- **Apply to:** CTA buttons, project cards, nav links
- **Implementation:** A Svelte action (`use:magnetic`) that tracks mouse position relative to element center and applies a small transform
- **Disable on:** Touch devices, reduced-motion preference

### Click/tap: Orange ripple

When clicking CTAs or interactive elements, a quick ripple in brand orange emanates from the click point and fades.

- **Duration:** 400ms
- **Color:** `#E07800` at 30% opacity, fading to 0
- **Implementation:** A Svelte action (`use:ripple`) that creates an absolutely-positioned expanding circle on click

---

## 5. The Home Page Journey

The home page is a single continuous narrative: a train journey between stations.

### Technical architecture

The page is one tall scrollable column. A GSAP ScrollTrigger timeline pins the 3D background environment while the HTML content scrolls over it. The SVG train moves along a defined path in sync with scroll position via GSAP's `MotionPathPlugin`.

```
Layer stack (back to front):
─────────────────────────────
1. Threlte Canvas (fixed position, full viewport)
   - Minimal dark space (#141414)
   - Glowing data paths (animated lines, orange/amber)
   - Subtle grid/infrastructure elements
   - Responds to scroll position + mouse parallax

2. SVG train layer (fixed position, moves with scroll)
   - Geometric/stylized train SVG designed in Figma
   - GSAP MotionPathPlugin moves it along a curve
   - Position tied to scroll progress (0% = Station 0, 100% = Station 5)
   - Optional: Lottie idle animation overlaid on train at rest

3. HTML content layer (scrollable, on top)
   - Station content sections
   - Semi-transparent backgrounds on content cards
   - 3D environment shows through gaps between sections
   - Lottie station icons animate when scroll reaches them
─────────────────────────────
```

### Station sequence

**Station 0: Departure (Hero)**
- 3D environment visible: glowing data paths pulse gently
- Train sits at platform (SVG, with optional Lottie idle glow)
- "yesid." wordmark large, centered
- "Data infrastructure that moves." tagline
- Scroll prompt at bottom (animated chevron, SVG + CSS)

**Station 1: SQL Development & Optimization**
- Train begins moving (GSAP scroll-linked)
- First station node lights up on the progress rail
- Content slides in: service title, description, relevant project cards
- Lottie station icon animates (database/query icon from marketplace)
- 3D background: a data path brightens as the train "passes over" it

**Station 2: Data Pipeline Architecture**
- Train continues to next station
- Same pattern: station lights up, content reveals, path brightens
- Lottie station icon: pipeline/flow icon

**Station 3: Analytics & Reporting Systems**
- Same pattern
- Lottie station icon: chart/dashboard icon

**Station 4: Database Performance Tuning**
- Same pattern
- Lottie station icon: speedometer/optimization icon

**Station 5: Destination (CTA)**
- Train arrives at final station
- All data paths are now illuminated (the infrastructure is complete)
- "View work" and "Get in touch" CTAs with magnetic cursor effect
- The journey is complete

### Responsive behavior

- **Desktop (1024px+):** Full experience. 3D background, SVG train, Lottie icons, scroll-linked choreography.
- **Tablet (768-1023px):** 3D background simplified (fewer path segments, lower resolution). SVG train still moves. Scroll choreography intact.
- **Mobile (<768px):** No 3D background (replaced with CSS gradient + subtle animated SVG paths). Train appears as a small static illustration at each station. Lottie icons still play. Scroll reveals still work via GSAP.

---

## 6. 3D Art Direction (Threlte)

### Environment: Minimal dark space with glowing data paths

The 3D scene is NOT a detailed world. It's an abstract, dark environment with luminous infrastructure:

- **Background:** Solid #141414 (brand dark background)
- **Data paths:** Glowing lines/tubes that follow curved routes across the viewport. Color: #E07800 (primary orange) with bloom/glow post-processing. Some paths pulse. Some have small particles traveling along them (like data packets).
- **Nodes/junctions:** Where paths intersect, small geometric shapes (octahedrons or icosahedrons) glow. These correspond to station positions.
- **Depth:** The paths exist at multiple Z-depths, creating layers. Closer paths are brighter. Farther paths are dimmer. This creates a sense of looking into infrastructure.
- **Camera:** Fixed perspective camera. No orbit controls (this isn't a 3D viewer, it's a backdrop). Subtle parallax tied to mouse position on desktop (camera shifts ±2° based on cursor).
- **Post-processing:** Bloom/UnrealBloomPass on the orange elements to create the "glow" effect. Subtle only.

### What to model

No complex models. Everything is built from Three.js primitives and procedural geometry:

- Paths: `TubeGeometry` along `CatmullRomCurve3` splines
- Nodes: `IcosahedronGeometry` or `OctahedronGeometry` with emissive material
- Particles on paths: Small `SphereGeometry` instances animated along the path curves using `useFrame`
- Grid: `GridHelper` or custom line geometry, very faint

### Scroll-linked behavior

The 3D scene responds to scroll position (passed from GSAP ScrollTrigger):

- **0-20% scroll (Hero):** Paths pulse gently at idle. Particles move slowly.
- **20-80% scroll (Stations 1-4):** As scroll advances, paths brighten sequentially. The path "ahead" of the current station glows brighter. Particle speed increases slightly.
- **80-100% scroll (CTA):** All paths fully illuminated. Particles moving at full speed. The infrastructure is "complete."

### Performance rules

- Max polygon count: 50K total (this is very low, intentionally)
- Max draw calls: 20
- Use `InstancedMesh` for repeated elements (particles, grid lines)
- Bloom pass resolution: half the canvas resolution
- Canvas size: match viewport but cap at 1920x1080 on 4K displays
- Frame rate target: 60fps on 2020 MacBook Air
- If GPU is slow (detected via renderer.info): disable bloom, reduce particle count

### Additive architecture

The Threlte scene is composed of independent Svelte components. Adding new 3D elements to the scene means adding a new component file, not modifying existing ones:

```svelte
<!-- HeroScene.svelte -->
<Canvas>
  <Scene>
    <DataPaths {scrollProgress} />
    <PathParticles {scrollProgress} />
    <StationNodes {activeStation} />
    <SubtleGrid />
    <!-- Future: add new components here without touching existing ones -->
  </Scene>
</Canvas>
```

---

## 7. Lottie Strategy

### v1: Marketplace-sourced animations

For v1, Lottie animations are sourced from the LottieFiles marketplace (lottiefiles.com). The criteria for selecting marketplace Lotties:

- **Style match:** Geometric, clean lines, minimal. No cartoon or skeuomorphic styles.
- **Color:** Must support color customization, or use white/neutral colors that work on dark backgrounds. Recolor to brand palette (orange #E07800, amber #FFB627, white #F5F5F0).
- **Size:** Under 50KB per animation JSON.
- **Frame rate:** 30fps preferred.
- **License:** Free for commercial use.

### What to source from marketplace

| Asset | Search terms on LottieFiles | Trigger |
|-------|----------------------------|---------|
| Station 1 icon | "database", "sql", "code" | Scroll: plays when station 1 is reached |
| Station 2 icon | "pipeline", "data flow", "workflow" | Scroll: plays when station 2 is reached |
| Station 3 icon | "analytics", "chart", "dashboard" | Scroll: plays when station 3 is reached |
| Station 4 icon | "performance", "speed", "optimization" | Scroll: plays when station 4 is reached |
| Train idle (optional) | "data", "pulse", "glow" | Loop: plays while train is at a station |

### What is NOT Lottie (built in code instead)

| Asset | Built with | Why |
|-------|-----------|-----|
| Scroll prompt chevron | SVG + CSS animation | Too simple for Lottie overhead |
| Train movement | SVG + GSAP MotionPathPlugin | Needs to be scroll-linked (not timeline-based) |
| Section reveals | GSAP ScrollTrigger | Interactive, not pre-rendered |
| Hover boops | Svelte actions | Must respond to user input |
| Arrival celebration | SVG + GSAP | Short, triggered once, simpler in code |

### Future: Custom Lotties (v2+)

The `LottiePlayer.svelte` component accepts any Lottie JSON file. When ready to create custom animations (After Effects + Bodymovin, or Figma + LottieFiles plugin), swap the marketplace JSON files for custom ones. No code changes needed. The component API stays the same.

### Lottie design rules (for future custom work)

- **Style:** Geometric, clean lines, matches brand (Inter-weight strokes)
- **Colors:** Only brand palette colors. Orange (#E07800), amber (#FFB627), white (#F5F5F0), dark grays
- **Size:** Each animation JSON must be under 50KB
- **Frame rate:** 30fps
- **Duration:** Loops: 2-4 seconds. One-shots: under 1.5 seconds
- **Design tool:** After Effects → Bodymovin export, or Figma → LottieFiles plugin

---

## 8. SVG Train Design

### Design direction

The train is a geometric, stylized illustration. Not photorealistic. Not cute/cartoon. Think: blueprint meets brand.

- **Shape language:** Rounded rectangles (matches `border-radius: 8px` brand token), clean edges
- **Colors:** Body in dark surface (#1E1E1E or #2A2A2A), windows in orange glow (#E07800 at low opacity), accent lines in orange (#E07800), wheels/details in border gray (#3A3A3A)
- **Size:** Designed at ~200px wide, scales responsively
- **Orientation:** Faces right (direction of travel = direction of reading)
- **Style reference:** Geometric transit icons, not detailed locomotive illustrations

### SVG structure (for GSAP animation)

The train SVG must have named groups for animatable parts:

```svg
<svg id="train">
  <g id="train-body"><!-- main body rectangle --></g>
  <g id="train-windows"><!-- window rectangles with glow --></g>
  <g id="train-wheels"><!-- circles that can rotate --></g>
  <g id="train-accent"><!-- orange accent lines/details --></g>
  <g id="train-glow"><!-- filter/gradient for the data glow effect --></g>
</svg>
```

GSAP animates each group independently:
- `#train-wheels`: continuous rotation while moving
- `#train-glow`: pulse opacity tied to scroll speed
- `#train-windows`: subtle flicker (data flowing through)

### Motion path

The train follows an SVG path (`<path>`) that curves between station positions. GSAP's `MotionPathPlugin` handles this. The path is invisible but defines the train's trajectory across the viewport.

---

## 9. Easter Eggs & Delight

Small surprises that reward curiosity. These are optional, low-effort additions that make people talk about the site.

| Easter egg | Implementation | Effort |
|-----------|---------------|--------|
| The orange dot in "yesid." boops when hovered | `use:boop` action on the `<span>` | Trivial |
| Clicking the dot triggers a small burst of orange particles | GSAP or SVG animation on click | Low |
| Konami code activates "light mode" briefly | Svelte store + event listener | Low |
| Hovering over a station while train is there makes the train "honk" (visual flash) | CSS class toggle | Trivial |
| Console.log easter egg | `console.log` with ASCII art of the wordmark | Trivial |
| Scroll to the very bottom past the footer: "You've reached the end of the line." | Hidden text revealed on overscroll | Low |

These are NOT in any slice spec. They're added opportunistically when a slice is ahead of schedule or during QA polish in slice 09.

---

## 10. Other Pages

### Work (`/work`)

- **Grid entrance:** Project cards enter with stagger (80ms gap), fade-up + scale
- **Tag filter:** Clicking a tag triggers FLIP animation. Non-matching cards shrink (scale 0.95 + opacity 0.3) and move to end. Matching cards rearrange smoothly. Uses Svelte's `animate:flip`
- **Card hover:** Boop (scale pulse) + subtle lift (translateY -4px) + shadow expansion
- **No 3D on this page**

### Work detail (`/work/[slug]`)

- **Content:** Sections enter on scroll with simple fade-up reveals
- **Tech stack tags:** Enter with stagger, left-to-right (like data flowing through a pipeline)
- **Minimal animation.** Content is king. Let the work speak.
- **No 3D on this page**

### About (`/about`)

- **Bio:** Text enters with fade
- **Skills/tags:** Enter with stagger
- **Clean and readable. No tricks.**

### Contact (`/contact`)

- **Links:** Enter with stagger
- **Link hover:** Icon boop (rotation or scale pulse)
- **Simple page. Fast to load, fast to act on.**

---

## 11. Accessibility & Reduced Motion

### `prefers-reduced-motion: reduce`

When the user has reduced motion enabled in their OS:

- **Disable:** All scroll-triggered animations, boops, magnetic cursor, Lottie animations, 3D scene animation (show static frame), train movement
- **Keep:** Instant state changes (hover color change), focus indicators, page transitions (use instant cut), static content layout (all stations visible without animation)
- **Implementation:** A global Svelte store `$prefersReducedMotion` that every animation component checks. GSAP respects `gsap.matchMedia()` which can check this preference. Threlte scene renders one static frame.

### Keyboard navigation

- Focus indicators must be visible and use brand orange (#E07800)
- Tab order must make sense with the station layout
- Skip-to-content link bypasses the 3D hero

---

## 12. Performance Budget

| Metric | Target | Hard limit |
|--------|--------|------------|
| First Contentful Paint | < 1.5s | < 2.5s |
| Largest Contentful Paint | < 2.5s | < 4.0s |
| Total JS (gzipped) | < 120KB | < 180KB |
| 3D scene init time | < 500ms | < 1000ms |
| Frame rate (desktop) | 60fps | > 45fps |
| Frame rate (mobile) | 60fps (no 3D) | > 30fps |
| Lottie JSON total | < 200KB | < 400KB |

### Code-splitting strategy

- Three.js + Threlte: Dynamic import, only loaded on pages with 3D (home page)
- GSAP ScrollTrigger: Dynamic import, loaded after first paint
- Lottie: Dynamic import per animation, loaded when element approaches viewport
- All animation code lives in `src/lib/motion/` and is tree-shakeable

---

## 13. File Structure

```
src/lib/motion/
├── actions/
│   ├── boop.ts          # use:boop hover action
│   ├── reveal.ts        # use:reveal scroll-triggered entrance
│   ├── magnetic.ts      # use:magnetic cursor pull
│   └── ripple.ts        # use:ripple click effect
├── stores/
│   ├── scroll.ts        # Scroll position and progress store
│   └── reducedMotion.ts # prefers-reduced-motion store
├── components/
│   ├── ScrollRail.svelte      # Progress rail with station markers
│   ├── StationReveal.svelte   # Wrapper for station content sections
│   └── LottiePlayer.svelte    # Generic wrapper for lottie-web
├── three/
│   ├── HeroScene.svelte       # Threlte canvas + scene composition
│   ├── DataPaths.svelte       # Glowing tube paths
│   ├── PathParticles.svelte   # Particles traveling along paths
│   ├── StationNodes.svelte    # Glowing junction points
│   └── SubtleGrid.svelte      # Background grid
├── svg/
│   └── Train.svelte           # SVG train component with GSAP-animatable groups
└── utils/
    ├── gsap.ts          # GSAP + ScrollTrigger + MotionPathPlugin registration, cleanup helpers
    └── stagger.ts       # Stagger timing calculator with randomization
```

### Component standardization

Every motion component follows this pattern:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { prefersReducedMotion } from '$lib/motion/stores/reducedMotion';

  // Props with sensible defaults
  let { duration = 600, delay = 0 } = $props();

  // Reduced motion check
  let animation: GSAPTween | null = null;

  onMount(() => {
    if ($prefersReducedMotion) return; // Skip all animation
    // Setup animation
  });

  onDestroy(() => {
    animation?.kill(); // Always clean up
  });
</script>
```

Every Svelte action follows this pattern:

```typescript
export function actionName(node: HTMLElement, params: ActionParams) {
  if (prefersReducedMotion()) return { destroy() {} };

  // Setup
  function setup() { /* ... */ }
  function cleanup() { /* ... */ }

  setup();

  return {
    update(newParams: ActionParams) { cleanup(); setup(); },
    destroy() { cleanup(); }
  };
}
```

---

## 14. Svelte Action API (Target Interfaces)

These are the developer-facing APIs that slice specs will reference:

```svelte
<!-- Scroll reveal -->
<div use:reveal={{ direction: 'up', delay: 200 }}>
  Content fades up when scrolled into view
</div>

<!-- Boop hover -->
<button use:boop={{ scale: 1.05, rotation: 5, timing: 300 }}>
  Boops on hover
</button>

<!-- Magnetic cursor -->
<a use:magnetic={{ strength: 3, radius: 50 }}>
  Pulls toward cursor on desktop
</a>

<!-- Click ripple -->
<button use:ripple={{ color: '#E07800' }}>
  Orange ripple on click
</button>

<!-- Staggered group -->
{#each items as item, i}
  <div use:reveal={{ direction: 'left', delay: stagger(i, 80) }}>
    {item.name}
  </div>
{/each}

<!-- Lottie player -->
<LottiePlayer
  src="/lottie/station-sql.json"
  trigger="scroll"
  loop={false}
/>

<!-- Lottie player with loop -->
<LottiePlayer
  src="/lottie/train-idle.json"
  trigger="mount"
  loop={true}
  speed={0.8}
/>
```

---

## 15. Reference Sites

Study these for specific techniques:

| Site | What to study |
|------|--------------|
| joshwcomeau.com | Boop interactions, spring physics, whimsy philosophy, procedural animation |
| rauno.me | Minimal scroll animations, clean transitions, understated motion |
| brittanychiang.com | Developer portfolio structure, subtle hover states |
| lusion.co | 3D + scroll integration, performance on creative sites |
| Freight Rail Works (Visme reference) | Data + train visualization, the exact metaphor we're building |

---

## 16. Additive Architecture

The motion system is designed to grow without restructuring.

**Adding a new Lottie animation:**
1. Place JSON file in `src/lib/assets/lottie/`
2. Use `<LottiePlayer src="/lottie/new-animation.json" />` in any component
3. No other changes needed

**Adding a new Threlte scene element:**
1. Create new component in `src/lib/motion/three/`
2. Import and add to `HeroScene.svelte`
3. Existing components are unaffected

**Adding a new Svelte action:**
1. Create new file in `src/lib/motion/actions/`
2. Follow the standard action pattern (reduced motion check, cleanup)
3. Use `use:newAction` on any element

**Adding a new page with animation:**
1. Page imports actions and components from `$lib/motion/`
2. Uses the same `use:reveal`, `use:boop` patterns as every other page
3. Optionally imports Threlte scene for 3D background

**Replacing marketplace Lotties with custom ones:**
1. Export custom Lottie from After Effects or Figma
2. Replace the JSON file in `src/lib/assets/lottie/`
3. Same filename = zero code changes

---

## Version History

| Date | Change |
|------|--------|
| 2026-04-02 | v1.0 created. Core metaphor, toolkit, station journey, 3D direction, Lottie strategy, SVG train, easter eggs, additive architecture defined. |
