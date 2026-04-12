# Slice A — SVG Metro Network Hero Animation

**Date:** 2026-04-04
**Status:** Design approved
**Depends on:** None
**Blocks:** Slice C (zoom transition)

## Context

The hero section has gone through two rejected approaches (3D Threlte wagon, scroll-linked video). This slice introduces a new direction: a scroll-driven SVG metro network animation that draws outward from a single origin dot, then zooms into that dot until the screen fills orange — handing off to Slice C where the orange becomes the "." in "Data Infra." and zooms out to reveal the page.

## What This Slice Builds

A full-screen, scroll-triggered SVG animation:
1. A single glowing orange dot appears at the center of the viewport
2. Metro-style lines draw outward from the dot (straight lines, 45° angles)
3. Station nodes pop in along the lines as they're drawn
4. The network holds briefly in its complete state
5. The camera zooms into the origin dot — the dot scales up while lines/nodes fade
6. The screen fills completely with orange (`#E07800`)
7. **End of Slice A** — Slice C takes over from the fully orange screen

No text content appears in this slice. Text reveal happens in Slice C.

## Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Network topology | Metro map (straight lines, 45° angles, station dots) | Extends the existing metro journey metaphor |
| Layout | Full takeover → zoom | Most cinematic first impression |
| Animation trigger | Scroll-triggered | Ensures visitor doesn't miss the beginning |
| Colors | All `#E07800` + `#FFB627` accents | Brand-unified, orange is the star |
| Complexity | Medium (15-20 nodes, 6-8 line segments) | Rich enough to feel like a network, fast enough to not bore |
| Build approach | Data-driven SVG | Typed arrays → Svelte renders → GSAP animates. Easiest to iterate, Slice C can reference the data |
| GSAP plugins | DrawSVGPlugin + CustomEase (+ existing ScrollTrigger, MotionPathPlugin) | DrawSVGPlugin for line stroke animation, CustomEase for organic timing |

## Architecture

### Data Layer

**File:** `src/lib/data/metro-network.ts`

```typescript
export interface NetworkNode {
  id: string;
  x: number;           // 0-100 percentage of SVG viewBox
  y: number;           // 0-100 percentage of SVG viewBox
  type: 'hub' | 'station' | 'terminus';
  line?: string;       // which line this node belongs to
}

export interface NetworkConnection {
  from: string;        // node id
  to: string;          // node id
  line: string;        // line identifier for color/grouping
  order: number;       // draw order (lower = earlier)
}

export const ORIGIN_NODE_ID = 'origin';  // Slice C handoff reference

export const nodes: NetworkNode[] = [
  { id: 'origin', x: 50, y: 50, type: 'hub' },
  // ... 15-20 nodes positioned to form a metro-style network
];

export const connections: NetworkConnection[] = [
  { from: 'origin', to: 'node-1', line: 'main', order: 1 },
  // ... 6-8 connections, ordered for staggered drawing
];
```

Nodes use percentage-based coordinates (0-100) so the SVG scales to any viewport. The `order` field on connections controls the stagger sequence — lines closer to the origin draw first.

### SVG Component

**File:** `src/lib/motion/svg/MetroNetwork.svelte`

Renders SVG from the data arrays:
- `{#each connections}` → `<path>` elements (not `<line>` — DrawSVGPlugin requires stroke-based paths) with class `network-line` and `data-order` attribute
- `{#each nodes}` → `<circle>` elements with class `network-node`
- Origin node gets an additional glow filter (`<filter>` with `feGaussianBlur`)
- SVG uses `viewBox="0 0 100 100"` with `preserveAspectRatio="xMidYMid meet"`
- All elements start invisible (opacity: 0, scale: 0) — GSAP handles entrance

**Props:** None. Reads data directly from `metro-network.ts`.
**Exports:** Refs to the SVG container and origin node element (for GSAP targeting).

### Hero Component (Rewritten)

**File:** `src/lib/components/HeroBanner.svelte`

Replaces the current split-layout hero. New structure:

```svelte
<section class="relative min-h-[300vh]">  <!-- tall to give scroll room -->
  <!-- Pinned container: stays fixed while scroll drives animation -->
  <div bind:this={pinContainer} class="h-screen w-screen flex items-center justify-center">
    <MetroNetwork bind:svgEl bind:originEl />
  </div>
</section>
```

- Uses `ScrollTrigger.create()` with `pin: true` to pin the hero while the animation plays
- The `300vh` height gives the scroll-driven animation enough scroll distance to feel smooth
- `scrollProgress` prop removed — this component manages its own ScrollTrigger internally
- On mount: builds GSAP timeline, attaches to ScrollTrigger with `scrub: 1`

**Removed imports:** `HeroVideoCard`, `ScrollPrompt`, hero text content (text moves to Slice C).

### GSAP Setup (Updated)

**File:** `src/lib/motion/utils/gsap.ts`

Add to existing plugin registration:

```typescript
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';

// In registerGsapPlugins():
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, DrawSVGPlugin, CustomEase);
```

Re-export `DrawSVGPlugin` and `CustomEase` for convenience.

## Animation Timeline

All phases are scroll-driven via `ScrollTrigger` with `scrub: 1`. The percentages map to scroll progress within the pinned section.

### Phase 1: Origin Dot (0–8%)
- Origin node scales from 0 → 1 with `ease: "back.out(1.7)"`
- Glow filter opacity fades in (0 → 1)
- Outer pulse ring scales up and fades (decorative)

### Phase 2: Lines Draw (8–35%)
- Each `<path>` element animates via `DrawSVGPlugin` from `"0%"` → `"100%"`
- Lines are staggered by their `order` field — lower order draws first
- Ease: `CustomEase.create("networkDraw", "M0,0 C0.2,0.6 0.4,1 1,1")` (fast start, smooth finish)
- Lines closest to origin draw first, outer branches draw last

### Phase 3: Station Nodes (35–55%)
- Station nodes scale from 0 → 1 with `ease: "back.out(1.4)"`
- Staggered: nodes on earlier lines appear first
- Subtle opacity animation: 0 → 0.7 for regular stations, 0 → 1 for hubs
- Uses `stagger()` utility from `src/lib/motion/utils/stagger.ts` for organic timing

### Phase 4: Network Complete (55–65%)
- Hub nodes pulse (scale 1 → 1.15 → 1, repeating)
- Glow filters on hub nodes intensify
- Brief hold — the network is alive and breathing
- Origin node glow intensifies most

### Phase 5: Zoom Into Origin (65–95%)
- Origin dot scales up massively: `scale: 1 → 80` (enough to fill viewport)
- All lines fade out: `opacity: 1 → 0` over the first half of this phase
- All non-origin nodes fade out: `opacity → 0`
- Origin node's glow filter blur radius increases
- The SVG container stays centered — the scale transform does all the work
- Ease: `"power2.in"` (slow start, accelerating)

### Phase 6: Handoff (95–100%)
- Screen is fully `#E07800`
- The origin dot covers the entire viewport
- **This is where Slice C picks up** — the orange becomes the "." dot, then zooms out

## Integration with +page.svelte

The current `+page.svelte` passes `scrollProgress` to `<HeroBanner>`. With the new design, HeroBanner manages its own ScrollTrigger (pin-based), so:

- Remove `scrollProgress` prop from `<HeroBanner>`
- HeroBanner's pinned section occupies scroll height before the service stations
- The rest of the page (services, featured work, etc.) scrolls naturally after the pin releases
- The right-rail `<TrainJourney>` and station nodes remain unchanged

## Reduced Motion

When `prefers-reduced-motion` is active:
- Skip all animation — no drawing, no zoom
- Show the fully-drawn network as a static decorative background at 15% opacity
- Immediately render whatever Slice C would show (the hero text content)
- No scroll pinning — the section is a normal viewport-height block

Implementation: check `isPrefersReducedMotion()` in `onMount` and conditionally skip the GSAP timeline creation.

## Cleanup

### Remove
- `src/lib/components/HeroVideoCard.svelte` — no longer used
- `static/video/hero-train.mp4` — scroll-linked video removed
- `static/video/hero-train.webm` — scroll-linked video removed
- `static/video/hero-train-poster.webp` — video poster removed
- `<link rel="preload" ... hero-station-art.webp>` in `+page.svelte`

### Keep (for now)
- `static/images/hero-station-art.webp` — may be used elsewhere or in Slice C
- `src/lib/motion/three/WagonScene.svelte` — not imported in HeroBanner, cleanup is a separate task
- `src/lib/components/ScrollPrompt.svelte` — may be reused in Slice C

## New Files

| File | Purpose |
|------|---------|
| `src/lib/data/metro-network.ts` | Node + connection data, origin constant |
| `src/lib/motion/svg/MetroNetwork.svelte` | SVG component rendering network from data |

## Modified Files

| File | Change |
|------|--------|
| `src/lib/components/HeroBanner.svelte` | Complete rewrite: takeover + pin + GSAP timeline |
| `src/lib/motion/utils/gsap.ts` | Add DrawSVGPlugin + CustomEase registration |
| `src/routes/+page.svelte` | Remove scrollProgress prop from HeroBanner, remove video preload |

## Testing

### Unit Tests
- `metro-network.test.ts` — validate data integrity: all connection `from`/`to` IDs exist in nodes, origin node exists, no duplicate IDs, order values are sequential
- `MetroNetwork.test.ts` — component renders correct number of `<line>` and `<circle>` elements from data

### Visual Verification
- `bun run dev` → scroll through hero section
- Verify: dot appears → lines draw → nodes pop → zoom fills orange
- Test with `prefers-reduced-motion: reduce` in browser devtools
- Test on mobile viewport (network should scale via viewBox)

## Acceptance Criteria

- [ ] Single orange dot appears at center on scroll start
- [ ] 6-8 lines draw outward from dot using DrawSVGPlugin (staggered)
- [ ] 15-20 station nodes pop in along lines
- [ ] Network holds briefly with pulsing hub nodes
- [ ] Zoom into origin dot fills screen with `#E07800`
- [ ] Scroll pinning works (section stays fixed while animation plays)
- [ ] Reduced motion: static network shown, no animation
- [ ] HeroVideoCard and video files removed
- [ ] `bun run test` and `bun run check` pass
- [ ] Data layer exports `ORIGIN_NODE_ID` for Slice C handoff
