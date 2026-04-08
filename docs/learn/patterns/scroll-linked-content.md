---
title: "Scroll-Linked Content"
domain: patterns
difficulty: 2
difficulty_label: intermediate
reading_time: 10
tags:
  - learn
  - patterns
  - intermediate
prerequisites:
  - "[[gsap-scrolltrigger]]"
date: 2026-04-08
---

# Scroll-Linked Content


## The Analogy

Think of cursor-based pagination in SQL. Instead of `OFFSET 50 LIMIT 25`, you use `WHERE id > :last_seen_id ORDER BY id LIMIT 25`. The cursor position (`:last_seen_id`) drives which data is visible. As the cursor advances, different records come into view. Scroll-linked content works the same way: the scroll position is the cursor, and it drives which content is visible, which tab is active, which station dot is highlighted, and how far the progress bar has filled. Scroll replaces the cursor; the viewport replaces the result window.

## What It Is

Scroll-linked content ties UI state to the user's scroll position. Instead of animations playing on a fixed timeline (like a video), they advance as the user scrolls. A progress value between 0 and 1 represents "how far through the section the user has scrolled," and that value drives everything: which tab is highlighted, how much of the metro line is filled, which Lottie frame is displayed, and which station is "active."

GSAP's ScrollTrigger provides the `onUpdate` callback, which fires on every scroll frame and gives a `self.progress` value from 0 (trigger start) to 1 (trigger end). This project uses two approaches to scroll-linked content:

1. **ScrollTrigger with `onUpdate`** -- for complex state synchronization (active tabs, metro line fill, Lottie scrubbing)
2. **Native scroll event with manual math** -- for simpler cases where GSAP is not needed (the services listing page)

## Why It Matters

Scroll-linked design is one of the most impactful UX patterns in modern web development. Apple, Stripe, and Linear all use it extensively. In interviews, understanding the scroll-to-state pipeline (scroll position to normalized progress to UI state) shows you can build experiences that feel native and responsive, not just pages that load static content.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/ServiceListingPage.svelte` | Lines 50-65: `handleScroll()` function | Converts scroll position to 0-1 progress and active service ID |
| `src/lib/components/ServiceListingPage.svelte` | Lines 88-93: scroll-snap container | CSS scroll snap + scroll listener = section-by-section reveals |
| `src/lib/components/ServiceListingPage.svelte` | Lines 90-105: metro line + dots | Progress fills the metro line, dots light up as sections are visited |
| `src/lib/components/ServiceStation.svelte` | Lines 68-76: ScrollTrigger onUpdate | Per-station ScrollTrigger drives Lottie animation progress |
| `src/lib/components/StationTabs.svelte` | Lines 23-33: activeId prop | Active tab syncs to scroll position via parent state |

## The Mental Model

```
Scroll Position Pipeline:

  User scrolls ──────────────────────────────────────────────►

  ┌─────────────────────────────────────────────────────────┐
  │ scrollTop = 2400px                                      │
  │ scrollHeight = 7200px                                   │
  │ clientHeight = 800px                                    │
  │ maxScroll = 7200 - 800 = 6400                          │
  └─────────┬───────────────────────────────────────────────┘
            │
            ▼
  ┌─────────────────────────────────────────────────────────┐
  │ scrollProgress = scrollTop / maxScroll                  │
  │ scrollProgress = 2400 / 6400 = 0.375                   │
  └─────────┬───────────────────────────────────────────────┘
            │
            ▼
  ┌─────────────────────────────────────────────────────────┐
  │ activeIndex = Math.round(0.375 * (6 - 1))              │
  │ activeIndex = Math.round(1.875) = 2                    │
  │ activeId = sorted[2].id = "analytics-reporting"        │
  └─────────┬───────────────────────────────────────────────┘
            │
            ├──► StationTabs: "Analytics" tab highlighted
            ├──► Metro line: filled to 37.5%
            ├──► Metro dots: first 3 dots lit orange
            └──► ProofStrip: shows analytics projects


  SQL equivalent:

  -- scrollProgress is the cursor position
  SELECT *
  FROM services
  WHERE station <= ROUND(:scroll_progress * COUNT(*))
  ORDER BY station;

  -- activeId is the current row
  SELECT id
  FROM services
  ORDER BY station
  OFFSET ROUND(:scroll_progress * (COUNT(*) - 1))
  LIMIT 1;
```

## Worked Example

```svelte
<!-- From: src/lib/components/ServiceListingPage.svelte -->
<!-- The complete scroll-to-state pipeline: -->

<script lang="ts">
  // Step 1: State for scroll position tracking
  let activeId = $state(sorted[0]?.id ?? '');
  let scrollContainer: HTMLElement | undefined = $state();
  let scrollProgress = $state(0);

  // Step 2: Convert scroll position to normalized progress + active service
  function handleScroll() {
    if (!scrollContainer) return;

    // Raw scroll values (like reading a database cursor position)
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) return;

    // Normalize to 0-1 (like converting row number to percentage)
    scrollProgress = scrollTop / maxScroll;

    // Map progress to active service index
    // (like converting a cursor position to a row offset)
    const serviceCount = sorted.length;
    const activeIndex = Math.round(scrollProgress * (serviceCount - 1));
    const clamped = Math.max(0, Math.min(activeIndex, serviceCount - 1));
    if (sorted[clamped]) {
      activeId = sorted[clamped].id;
    }
  }

  // Step 3: Attach scroll listener with passive flag for performance
  onMount(() => {
    if (!browser || !scrollContainer) return;
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollContainer?.removeEventListener('scroll', handleScroll);
    };
  });
</script>

<!-- Step 4: UI elements driven by scroll state -->

<!-- Tabs sync to active service -->
<StationTabs services={sorted} {activeId} mode="scroll" onSelect={handleTabSelect} />

<!-- Metro line fills based on progress -->
<div class="metro-fill" style="height: {scrollProgress * 100}%"></div>

<!-- Dots light up based on whether station has been scrolled past -->
{#each sorted as service, i}
  {@const isActive = service.id === activeId}
  {@const isVisited = i <= activeIdx}
  <div class="metro-dot" class:active={isActive} class:visited={isVisited}></div>
{/each}

<!-- Scroll container with CSS snap -->
<div class="scroll-area" bind:this={scrollContainer}>
  {#each sorted as service, i}
    <ServiceCard {service} />  <!-- Each takes 100vh, snaps into place -->
  {/each}
</div>
```

The key insight is that `scrollProgress` (a single number from 0 to 1) drives everything: the active tab, the metro line fill, the dot states, and the proof strip content. One scroll event, one calculation, multiple UI updates.

## Common Mistakes

1. **Not using `{ passive: true }` on the scroll listener:** Adding a non-passive scroll event handler.
   - **What happens:** The browser cannot optimize scrolling because it has to wait for your handler to call `preventDefault()` (even though you never do). Scroll becomes janky, especially on mobile.
   - **Fix:** Always pass `{ passive: true }` for scroll listeners that do not call `preventDefault()`.
   - **Why:** Passive listeners tell the browser "I will not block scrolling," allowing it to scroll smoothly on a separate thread.

2. **Dividing by zero when content fits in the viewport:** Calculating `scrollTop / maxScroll` when `maxScroll = 0`.
   - **What happens:** Division by zero produces `NaN` or `Infinity`, which breaks every downstream calculation (active index, metro fill, etc.).
   - **Fix:** Guard with `if (maxScroll <= 0) return;` before the division.
   - **Why:** If all content fits in the viewport, there is nothing to scroll and progress should stay at 0.

3. **Not clamping the active index:** Using `Math.round(progress * count)` without clamping to valid array bounds.
   - **What happens:** At the extreme ends of scroll (progress = 0 or 1), floating point rounding can produce an index of -1 or `count`, which is out of bounds.
   - **Fix:** Use `Math.max(0, Math.min(activeIndex, serviceCount - 1))` to clamp.
   - **Why:** Like a SQL `OFFSET` that must be >= 0 and < COUNT(*), array indices must be within bounds.

4. **Forgetting to clean up the listener:** Not removing the scroll event listener when the component is destroyed.
   - **What happens:** Memory leak. The handler fires on a detached container after navigation.
   - **Fix:** Return a cleanup function from `onMount` that calls `removeEventListener`.
   - **Why:** In an SPA, components mount and unmount frequently. Every `addEventListener` needs a matching `removeEventListener`.

## Break It to Learn It

### Exercise 1: Watch the progress value
1. Open `src/lib/components/ServiceListingPage.svelte`
2. Add `console.log('progress:', scrollProgress, 'active:', activeId)` at the end of `handleScroll()`
3. **Predict:** How many times per second will this fire while scrolling? What range of values will you see?
4. **Verify:** Run `bun run dev`, go to `/services`, open DevTools console, scroll slowly through the services
5. **What you learned:** The scroll handler fires many times per second (60+). Progress goes from 0 to 1. Active ID changes at regular intervals as you pass each station.
6. **Undo your change**

### Exercise 2: Remove scroll snap and compare
1. Open `src/lib/components/ServiceListingPage.svelte`
2. In the `<style>` block, comment out `scroll-snap-type: y mandatory;` from `.scroll-area`
3. **Predict:** How will the scrolling experience change? Will tabs still sync?
4. **Verify:** Run `bun run dev`, go to `/services`, scroll through the services
5. **What you learned:** Without scroll snap, the user can stop between stations. Tabs still sync (the progress math works continuously), but the section-by-section snapping feel is lost.
6. **Undo your change**

### Exercise 3: See the Lottie scrub in ServiceStation
1. Open `src/lib/components/ServiceStation.svelte`
2. Find the `lottieProgress` state and the ScrollTrigger that drives it (lines 55-76)
3. Add `console.log('station', service.id, 'lottie:', lottieProgress.toFixed(2))` inside the `onUpdate` callback
4. **Predict:** Will each station's Lottie have its own progress (0 to 1), or do they all share one?
5. **Verify:** Run `bun run dev`, go to the home page, scroll to a service station, watch the console
6. **What you learned:** Each station has its OWN ScrollTrigger with its own progress 0-1. The Lottie animation scrubs independently per station, driven by that station's visibility in the viewport.
7. **Undo your change**

## Connections

- **Depends on:** [[gsap-scrolltrigger]] because ScrollTrigger provides the `onUpdate` callback and progress normalization
- **Related:** [[data-driven-components]] because the station system is data-driven -- the number of scroll sections, tabs, and dots all derive from the services array
- **Related:** [[svg-paint-server-spa]] because the metro line in the scroll-linked listing page uses direct colors to avoid the SPA gradient bug
- **Related:** [[filter-reset-pattern]] because both patterns coordinate UI state with reactive Svelte state

## Knowledge Check

1. What does `scrollProgress = 0.5` mean in the context of the services page? -> See [The Mental Model](#the-mental-model)
2. Why must you pass `{ passive: true }` to scroll event listeners? -> See [Common Mistakes](#common-mistakes)
3. How does one scroll progress value drive four different UI updates? -> See [Worked Example](#worked-example)
4. What is the difference between the ServiceListingPage approach (native scroll events) and the ServiceStation approach (GSAP ScrollTrigger)? -> See [What It Is](#what-it-is)

## Go Deeper

- [GSAP ScrollTrigger Documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [MDN: Scroll Event](https://developer.mozilla.org/en-US/docs/Web/API/Element/scroll_event)
- [CSS Scroll Snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap)
