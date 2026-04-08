---
title: "CSS Scroll Snap"
domain: styling
difficulty: 2
difficulty_label: intermediate
reading_time: 8
tags:
  - learn
  - styling
  - intermediate
prerequisites:
  - "[[css-grid-layout]]"
date: 2026-04-08
---

# CSS Scroll Snap


## The Analogy

CSS scroll snap works like SQL's `ROUND()` function. `ROUND(47.3, 0)` snaps the value to `47` -- the nearest whole number. Scroll snap does the same for scrolling: instead of stopping at arbitrary pixel positions, the scroll position snaps to predefined alignment points. Just as `ROUND()` eliminates messy decimal values, scroll snap eliminates messy scroll positions where sections are half-visible.

## What It Is

CSS Scroll Snap is a browser-native feature that controls where a scroll container stops after the user finishes scrolling. Instead of stopping at any pixel, the scroll position "snaps" to specific child elements. Two CSS properties control it:

1. **`scroll-snap-type`** (on the container): Declares the axis and strictness of snapping.
   - `scroll-snap-type: y mandatory` -- vertical snapping, always snaps (never stops between points)
   - `scroll-snap-type: x proximity` -- horizontal snapping, only snaps if close to a snap point

2. **`scroll-snap-align`** (on the children): Declares where each child should align when snapped.
   - `scroll-snap-align: start` -- the child's top edge aligns with the container's top
   - `scroll-snap-align: center` -- the child's center aligns with the container's center

The "mandatory" vs "proximity" distinction is important:
- **mandatory:** The scroll always snaps to a point. The user cannot stop between sections. This is what the services page uses -- each service fills the full viewport.
- **proximity:** The scroll only snaps if the user stops close to a snap point. If they stop far away, the scroll stays where it is. This feels less aggressive.

Scroll snap is pure CSS -- no JavaScript needed for the snapping behavior itself. JavaScript may be added alongside it for things like tracking which section is active (as the services page does), but the actual snapping is handled by the browser.

## Why It Matters

Scroll snap creates section-by-section reading experiences that feel like swiping through slides on a phone. It is used by Apple's product pages, portfolio sites, and any fullscreen section layout. In interviews, you will be asked how to create a "swipeable section" layout. The answer is `scroll-snap-type: y mandatory` -- not a JavaScript library, not a carousel plugin. Understanding scroll snap means you can build these experiences with zero JavaScript and native browser performance.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/ServiceListingPage.svelte` | `.scroll-area { scroll-snap-type: y mandatory; }` (scoped styles) | The scroll container snaps vertically between service sections |
| `src/lib/components/ServiceListingPage.svelte` | `.scroll-area :global(.service-viewport) { scroll-snap-align: start; }` | Each ServiceCard aligns its top edge to the container's top when snapped |
| `src/lib/components/ServiceListingPage.svelte` | `.listing-footer { scroll-snap-align: none; }` | The footer at the end of the scroll area opts OUT of snapping |
| `src/lib/components/ServiceCard.svelte` | `.service-viewport { height: 100vh; }` | Each service occupies the full viewport height so snapping creates a "one section per screen" experience |
| `src/lib/components/ServiceListingPage.svelte` | The `handleScroll` function (lines 50-65) | JavaScript that tracks scroll position to sync the active tab -- snapping handles the visual, JS handles the state |

## The Mental Model

```
Without scroll snap:                    With scroll snap:
────────────────────                    ─────────────────

User scrolls freely.                   User scrolls, then releases.
Stops at any pixel.                    Browser snaps to nearest section.

 ┌──────────────────┐                   ┌──────────────────┐
 │   Service 1      │                   │   Service 1      │ ← snap point
 │                  │                   │                  │
 │   Servi──────────│ ← stuck here     │                  │
 │   ce 2  (partial │                   ├──────────────────┤
 │   view)          │                   │   Service 2      │ ← snap point
 │                  │                   │                  │
 └──────────────────┘                   └──────────────────┘

SQL analogy:
  Without ROUND: SELECT 47.3      → 47.3  (messy partial position)
  With ROUND:    SELECT ROUND(47.3, 0) → 47  (clean snapped position)


The three-part setup:
═════════════════════

1. Container declares snapping:
   .scroll-area {
     overflow-y: auto;              ← must be scrollable
     scroll-snap-type: y mandatory; ← vertical, always snap
   }

2. Children declare alignment:
   .service-viewport {
     scroll-snap-align: start;      ← top edge snaps to container top
     height: 100vh;                 ← fills the viewport
   }

3. Opt-out for non-snapping children:
   .listing-footer {
     scroll-snap-align: none;       ← footer scrolls freely
   }
```

## Worked Example

```svelte
<!-- From: src/lib/components/ServiceListingPage.svelte -->
<!-- The full-viewport kinetic scroll layout for /services. -->

<!-- Step 1: The scroll container with snap enabled -->
<div class="scroll-area" bind:this={scrollContainer}>

  <!-- Step 2: Each service section snaps to the top -->
  {#each sorted as service, i}
    <ServiceCard
      {service}
      svgContent={serviceSvgContents[service.id] ?? ''}
      index={i}
      total={sorted.length}
    />
  {/each}

  <!-- Step 3: Footer does NOT snap — it flows freely after the last service -->
  <div class="listing-footer">
    <Footer />
  </div>
</div>
```

```css
/* From: src/lib/components/ServiceListingPage.svelte <style> block */

/* Step 1: Container setup */
.scroll-area {
  flex: 1;
  overflow-y: auto;                    /* Must be scrollable */
  scroll-snap-type: y mandatory;       /* Vertical snapping, always snaps */
  position: relative;
  scrollbar-width: none;               /* Hide scrollbar — tabs show position */
}

/* Step 2: Each service viewport snaps its top edge to the container's top */
/* Uses :global() because .service-viewport is defined in ServiceCard.svelte */
.scroll-area :global(.service-viewport) {
  scroll-snap-align: start;
}

/* Step 3: Footer opts out of snapping */
.listing-footer {
  scroll-snap-align: none;
}
```

```css
/* From: src/lib/components/ServiceCard.svelte <style> block */

/* Each service section fills the entire viewport height */
.service-viewport {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100vh;                       /* Full viewport = one section per screen */
  padding: 0 3rem;
}
```

The flow: The `.scroll-area` is a scrollable container that fills the space below the tab bar and above the proof strip. Inside it, each `.service-viewport` is exactly 100vh tall. When the user scrolls and releases, `scroll-snap-type: y mandatory` forces the container to snap so that one `.service-viewport`'s top edge aligns with the container's top edge. The footer at the end has `scroll-snap-align: none` so it scrolls normally after the last service.

## Common Mistakes

1. **Forgetting `overflow` on the container:** Setting `scroll-snap-type` but not making the container scrollable.
   - **What happens:** Nothing snaps. The browser ignores `scroll-snap-type` if the container does not scroll.
   - **Fix:** The container must have `overflow-y: auto` (or `scroll`) and a constrained height (e.g., `height: 100vh`). Without overflow, there is nothing to snap.
   - **Why:** Scroll snap only works on scroll containers. No scroll = no snap.

2. **Using `mandatory` when `proximity` is more appropriate:** Setting `scroll-snap-type: y mandatory` on a container with variably-sized children (like a blog feed).
   - **What happens:** The user gets trapped. They cannot scroll to a position between snap points, even if they want to read content that spans two sections.
   - **Fix:** Use `mandatory` only when every child fills the viewport (like the services page). Use `proximity` for mixed-height content.
   - **Why:** `mandatory` forces snapping. If children are different heights, the user may not be able to see the bottom of a tall section.

3. **Not opting out non-snapping children:** Adding a footer or spacer inside the snap container without `scroll-snap-align: none`.
   - **What happens:** The footer becomes a snap point. The user snaps to a half-empty footer screen, which feels broken.
   - **Fix:** Add `scroll-snap-align: none` to any child that should not be a snap target.
   - **Why:** By default, snap alignment may be inherited. Explicitly opting out prevents surprises.

## Break It to Learn It

### Exercise 1: Remove scroll snap
1. Open `src/lib/components/ServiceListingPage.svelte`
2. In the `<style>` block, comment out `scroll-snap-type: y mandatory;` in `.scroll-area`
3. **Predict:** What happens when you scroll through the services page?
4. **Verify:** Run `bun run dev`, open `/services`. Scroll between services. The page scrolls freely -- you can stop halfway between two services. The "slideshow" feel is gone.
5. **What you learned:** `scroll-snap-type` is the single property that creates the snapping behavior. Without it, scrolling is free-form.
6. **Undo your change**

### Exercise 2: Change mandatory to proximity
1. Open `src/lib/components/ServiceListingPage.svelte`
2. Change `scroll-snap-type: y mandatory` to `scroll-snap-type: y proximity`
3. **Predict:** Will the snapping still work? Will it feel different?
4. **Verify:** Run `bun run dev`, open `/services`. Scroll gently -- it still snaps. Scroll aggressively past a snap point -- it may not snap if you stop far from a point. The experience is less rigid.
5. **What you learned:** `mandatory` always snaps. `proximity` only snaps when close. For full-viewport sections, `mandatory` provides the crisp experience.
6. **Undo your change**

### Exercise 3: Make the footer snap
1. Open `src/lib/components/ServiceListingPage.svelte`
2. In the `<style>` block, change `.listing-footer { scroll-snap-align: none; }` to `.listing-footer { scroll-snap-align: start; }`
3. **Predict:** What happens when you scroll past the last service?
4. **Verify:** Run `bun run dev`, open `/services`, scroll to the end. The footer now snaps to the top of the container, potentially showing a mostly-empty screen.
5. **What you learned:** `scroll-snap-align: none` is how you exclude elements from snapping. Without it, every child becomes a snap target.
6. **Undo your change**

## Connections

- **Depends on:** [[css-grid-layout]] because scroll snap often works with structured layouts
- **Related:** [[scoped-styles-in-svelte]] because the scroll snap rules use the half-scoped `:global()` pattern to reach into child components
- **Related:** [[mobile-first-responsive]] because the services page layout adjusts at different breakpoints while maintaining snap behavior

## Knowledge Check

1. What two CSS properties are needed for scroll snapping? → See [What It Is](#what-it-is)
2. What is the difference between `mandatory` and `proximity`? → See [What It Is](#what-it-is)
3. Why does the footer use `scroll-snap-align: none`? → See [Worked Example](#worked-example)
4. What happens if the container is not scrollable? → See [Common Mistakes](#common-mistakes)
5. What is the SQL analogy for scroll snap? → See [The Analogy](#the-analogy)

## Go Deeper

- [MDN: CSS Scroll Snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap)
- [web.dev: CSS Scroll Snap](https://web.dev/articles/css-scroll-snap)
