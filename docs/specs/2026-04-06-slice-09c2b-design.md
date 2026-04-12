# Slice 09c-2b — Polish Enhancements Design

**Date:** 2026-04-06
**Status:** approved
**Depends on:** 09c-2a (complete)

## Scope

6 features adding micro-interactions and metro/transit brand depth to listing and detail pages. All motion respects `prefers-reduced-motion`. No layout changes — enhancement only.

---

## ME-1: Cursor-Following Glow (`use:cursorGlow`)

### What
Svelte action that tracks `pointermove` and updates `--glow-x`, `--glow-y` CSS custom properties on the element. The existing static radial-gradient glow on BlogRow and WorkCard follows the cursor.

### File
- **New:** `src/lib/motion/actions/cursorGlow.ts`

### Interface
```ts
export interface CursorGlowParams {
  /** Glow radius in px. Default: 200 */
  radius?: number;
  /** Glow opacity 0-1. Default: 0.12 */
  intensity?: number;
}

export function cursorGlow(node: HTMLElement, params?: CursorGlowParams): ActionReturn;
```

### Behavior
- On `pointermove`: compute cursor position relative to element, set `--glow-x` and `--glow-y` as pixel values.
- On `pointerleave`: reset to center (smooth transition via CSS).
- Disabled on touch devices and reduced-motion (same guard as `tilt.ts`).
- The component's existing `radial-gradient` references these CSS vars: `radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), ...)`.

### Targets
- `BlogRow.svelte` — replace static `radial-gradient(ellipse at 0% 50%, ...)` with cursor-following version
- `WorkCard.svelte` — replace static glow overlay with cursor-following version

### Pattern
Same structure as `tilt.ts`: event listeners, cleanup in `destroy()`, `update()` for param changes.

---

## ME-3: Animated Gradient Border on WorkCard Hover

### What
Pure CSS rotating conic-gradient border on WorkCard. Animation paused by default, plays on hover.

### File
- **Modified:** `src/lib/components/WorkCard.svelte` (CSS only)

### Implementation
```css
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.work-card article {
  /* Gradient border via background + mask trick */
  background: conic-gradient(from var(--angle), #E07800, #FFB627, transparent 40%, #E07800) border-box;
  border: 2px solid transparent;
  animation: rotate-border 3s linear infinite;
  animation-play-state: paused;
}

.work-card:hover article {
  animation-play-state: running;
}

@keyframes rotate-border {
  to { --angle: 360deg; }
}
```

### Notes
- Replaces the current static `border-color` transition in `.work-card:hover article`.
- When not hovered, border shows the gradient at its initial angle (static, subtle).
- The `@property` registration is required for the custom property to be animatable.

---

## ME-4: ScrollTrigger.batch() for Listing Entrances

### What
Replace individual `use:reveal` directives on listing pages with a parent-level `ScrollTrigger.batch()`. All page elements (headers, filters, cards) enter as cascading waves based on what's actually visible together.

### Files Modified
- `BlogListingPage.svelte` — remove `use:reveal` from header, search, and BlogRow; add batch setup
- `WorkListingPage.svelte` — remove `use:reveal` from header and WorkCard wrapper; add batch setup
- `BlogRow.svelte` — remove `use:reveal` and `use:boop`; add `.batch-item` class
- `WorkCard.svelte` — remove `use:reveal`; add `.batch-item` class

### Behavior
```ts
// In onMount of listing page:
registerGsapPlugins();

ScrollTrigger.batch('.batch-item', {
  start: 'top 85%',
  onEnter: (batch) => {
    gsap.fromTo(batch,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.4)' }
    );
  },
  once: true
});
```

### Notes
- The `reveal` action itself is NOT removed from the codebase — it's still used in non-listing contexts (home page, detail pages, etc.).
- Items start with `opacity: 0` via CSS on the listing page (not inline styles) so they're hidden before batch triggers.
- `prefers-reduced-motion`: skip batch setup entirely, items render at full opacity.
- FLIP animation in WorkListingPage must coordinate: after a filter change, kill batch tweens on affected elements and reset them visible before FLIP runs (same pattern as existing code).

---

## MT-1: Metro Line Drawing (DrawSVGPlugin)

### What
Replace the CSS `div` metro line segments in BlogRow and WorkListingPage with SVG `<line>` elements animated by DrawSVGPlugin. Each row has its own short SVG segment. `ScrollTrigger.batch()` orchestrates sequential draw-in — the line "grows" downward connecting stations as rows enter.

### Files Modified
- `BlogRow.svelte` — replace `<div class="w-0.5 flex-1" ...>` with inline SVG `<line>`
- `WorkListingPage.svelte` — replace `<div class="w-0.5 flex-1" ...>` with inline SVG `<line>`

### SVG Structure (per row)
```html
<!-- Replaces the CSS div metro connector -->
<svg class="metro-line-segment flex-1" width="2" viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true">
  <line x1="1" y1="0" x2="1" y2="100"
    stroke="#E07800" stroke-width="2"
    style="draw-svg: 0%;" />
</svg>
```

### Animation
- Orchestrated by the same `ScrollTrigger.batch()` from ME-4.
- When a batch enters, after the card fade-in, the metro line segments in that batch draw from `0%` to `100%` (DrawSVGPlugin).
- Timeline: cards fade in (0.6s) → line draws (0.4s, overlapping by 0.2s).
- `prefers-reduced-motion`: lines render fully drawn, no animation.

---

## MT-2: Station Badge Pulse Animation

### What
Continuous sonar ping/pulse effect radiating outward from each station badge. Pure CSS animation — no GSAP needed since it's perpetual.

### Files Modified
- `BlogRow.svelte` — add pulse pseudo-element or sibling div on station badge
- `WorkListingPage.svelte` — add pulse on station badge

### Implementation
```html
<!-- Wrapper around station badge -->
<div class="station-badge-wrapper">
  <div class="station-pulse"></div>
  <div class="station-badge">01</div>
</div>
```

```css
.station-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(224, 120, 0, 0.3);
  animation: station-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes station-ping {
  0% { transform: scale(1); opacity: 0.4; }
  75%, 100% { transform: scale(2.5); opacity: 0; }
}
```

### Notes
- Each badge gets a staggered `animation-delay` based on its index (e.g., `index * 0.4s`) so pulses ripple down the list.
- `prefers-reduced-motion`: no pulse, badge renders static.
- The pulse element is behind the badge (`z-index`) so it radiates outward without obscuring the number.

---

## MT-4: Animated Gradient Separator

### What
New `GradientSeparator.svelte` component — a horizontal SVG line with an orange-to-yellow gradient that advances along the line via DrawSVGPlugin on scroll enter. Global, used between major sections site-wide.

### File
- **New:** `src/lib/components/GradientSeparator.svelte`

### Interface
```ts
let {
  /** Optional label text below the separator */
  label = '',
  /** Max width constraint. Default: '5xl' (max-w-5xl) */
  maxWidth = '5xl'
}: {
  label?: string;
  maxWidth?: string;
} = $props();
```

### SVG Structure
```html
<div class="relative mx-auto w-full max-w-{maxWidth} px-6" aria-hidden="true">
  <svg width="100%" height="4" preserveAspectRatio="none">
    <defs>
      <linearGradient id="sep-grad-{uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#E07800" />
        <stop offset="100%" stop-color="#FFB627" />
      </linearGradient>
    </defs>
    <line x1="0" y1="2" x2="100%" y2="2"
      stroke="url(#sep-grad-{uid})" stroke-width="2" stroke-linecap="round" />
  </svg>
</div>
```

### Animation
- DrawSVGPlugin: `drawSVG: "0%"` → `drawSVG: "100%"` on scroll enter.
- Duration: 0.8s, ease: `power2.out`.
- `prefers-reduced-motion`: line renders fully visible, no draw animation.

### Placement Rules
- **Homepage:** between major stops (HeroBanner → ServiceStation → FeaturedWork → AboutBento → BlogFeed)
- **Listing pages:** between header section and card grid
- **Detail pages (blog, work, services):** ONE separator between the header/hero area and the body content only. Not between sections within the body.
- **Replaces StationDivider** where used, or supplements it. StationDivider remains available for the hazard-stripe pattern if needed elsewhere.

### Gradient ID Uniqueness
Each instance generates a unique gradient ID to avoid SVG `<defs>` collisions when multiple separators are on the same page. Use a simple counter or `crypto.randomUUID()`.

---

## Shared Concerns

### prefers-reduced-motion
All 6 features check `isPrefersReducedMotion()` (existing store):
- **cursorGlow**: returns no-op action
- **gradient border**: animation-play-state stays paused
- **batch**: items render at full opacity, no animation
- **metro line**: SVG renders fully drawn
- **badge pulse**: no pulse animation
- **gradient separator**: line renders fully visible

### Performance
- `ScrollTrigger.batch()` reduces ScrollTrigger instance count on listing pages (from N per card to 1 batch).
- `cursorGlow` uses the same event-listener pattern as `tilt.ts` — no GSAP, no RAF loop.
- Badge pulse is pure CSS — no JS overhead.
- Gradient border is pure CSS with `@property` — browser-native animation.

### Testing
- `cursorGlow.ts`: unit test following `tilt.ts` test pattern (if exists) or new test
- `GradientSeparator.svelte`: render test confirming SVG output
- Existing BlogRow/WorkCard tests must remain green
- Batch entrance: integration-level (difficult to unit test scroll behavior — verify visually)

---

## Files Summary

| Action | File |
|--------|------|
| **New** | `src/lib/motion/actions/cursorGlow.ts` |
| **New** | `src/lib/components/GradientSeparator.svelte` |
| **Modify** | `src/lib/components/BlogRow.svelte` |
| **Modify** | `src/lib/components/WorkCard.svelte` |
| **Modify** | `src/lib/components/BlogListingPage.svelte` |
| **Modify** | `src/lib/components/WorkListingPage.svelte` |
| **Modify** | `src/routes/+page.svelte` (add GradientSeparator between sections) |
| **Modify** | Detail pages (blog/work/services `[slug]/+page.svelte`) — add single GradientSeparator |
