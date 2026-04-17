---
title: "The Scroll-Scrub Factory Pattern"
domain: motion
difficulty: 3
difficulty_label: advanced
reading_time: 8
tags:
  - learn
  - motion
  - advanced
  - slice-17e
prerequisites:
  - "[[snappy-doctrine]]"
  - "[[lazy-gsap-plugins]]"
date: 2026-04-17
slice: 17e-6
---

# The Scroll-Scrub Factory Pattern

## The Analogy

A factory in SQL terms is a stored procedure that returns a cursor. Call it with parameters, get a handle back, run queries through the handle, close it when done. `createHeroTimeline(...)` is that stored procedure: the caller passes element refs + options, gets a `destroy` function back, and calls destroy when the component unmounts. The factory encapsulates all the GSAP wiring; the caller never touches ScrollTrigger directly.

## What It Is

A scroll-scrub factory is a synchronous function that:

1. Accepts a target DOM element (or multiple) and an options object.
2. Creates one or more GSAP ScrollTrigger instances scoped to that target.
3. Returns a `() => void` destroy function.
4. Short-circuits on `prefers-reduced-motion: reduce` by rendering the final state and returning a no-op destroy.

```ts
function createScrub(target: HTMLElement, opts: Opts): () => void;
```

The site has three factories in `src/lib/motion/scrubs/`:

- **`createCrescendoScrub`** — scales + fades a target element as its section scrolls through the viewport. Used by the Manifesto statement and rotated edge titles.
- **`createDrawScrub`** — DrawSVG stroke-draws paths from 0% to 100% as the section passes. Used by the Blueprint SVGs on listing pages.
- **`createHeroTimeline`** — the site's only pinned scroll-scrub. 9 phases (dot reveal → pulse → stroke-draw → stations → labels → zoom → cross-fade → text zoom-out → unpin).

## Why It Matters

Without the factory boundary, every component that wants a scroll-scrub has to import ScrollTrigger directly, configure its trigger/start/end/scrub values, remember to clean up, remember to check reduced-motion, and repeat this dance per scrub. Five components doing that is five places a bug can hide — and seven places to update when the GSAP API changes.

Factories centralize:
- The ScrollTrigger wiring (one canonical shape)
- The reduced-motion short-circuit
- The destroy contract
- The option surface (callers only see the semantic options: `minScale`, `pathSelector`, `pinLength`)

For a reviewer: "does this factory's call site use the right options?" is a faster question than "is this ad-hoc ScrollTrigger setup correct?"

## How We Use It in This Project

| File | Factory | Used by |
|---|---|---|
| `src/lib/motion/scrubs/createHeroTimeline.ts` | `createHeroTimeline` | `HeroBanner.svelte` |
| `src/lib/motion/scrubs/createCrescendoScrub.ts` | `createCrescendoScrub` | `Manifesto.svelte`, `HomePage.svelte` (rotated edge titles) |
| `src/lib/motion/scrubs/createDrawScrub.ts` | `createDrawScrub` | `BlogListingPage.svelte`, `ProjectListingPage.svelte` |

## The Mental Model

```
┌────────────────────────────────────────────────────────────┐
│                     CONSUMER COMPONENT                     │
│                                                            │
│   onMount(async () => {                                    │
│     if (isPrefersReducedMotion()) return;                  │
│ A   await loadDrawSVG();   ◄── preload plugins             │
│     initScrollTriggerConfig();                             │
│ B   const destroy = createDrawScrub(el, { section });      │
│     onDestroy(() => destroy());                            │
│   });                                                      │
└────────────────────────────────────────────────────────────┘
                         │
                         │ Caller owns steps A + B.
                         ▼
┌────────────────────────────────────────────────────────────┐
│                FACTORY (createDrawScrub)                   │
│                                                            │
│   if (isPrefersReducedMotion()) {                          │
│     // Render final state                                  │
│     gsap.set(paths, { drawSVG: '100%' });                  │
│     return () => {};  ◄── no-op destroy                    │
│   }                                                        │
│                                                            │
│   const st = ScrollTrigger.create({                        │
│     trigger: section, start, end, scrub, ...               │
│   });                                                      │
│                                                            │
│   return () => st.kill();  ◄── cleanup closure             │
└────────────────────────────────────────────────────────────┘
```

The factory is **synchronous**. Plugin loading (DrawSVG, CustomEase, MotionPath) is the caller's responsibility — factories document the preconditions and assume the plugins are registered when invoked. This lets factories be used in `$effect` blocks and other sync contexts.

## Worked Example

**From `src/lib/motion/scrubs/createDrawScrub.ts`** (simplified):

```ts
import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
import { gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';

export interface DrawScrubOpts {
  section: HTMLElement;           // trigger section
  pathSelector?: string;          // default 'path'
}

export function createDrawScrub(
  svgRoot: HTMLElement,
  { section, pathSelector = 'path' }: DrawScrubOpts,
): () => void {
  const paths = svgRoot.querySelectorAll(pathSelector);

  // Reduced-motion: final state, no-op destroy.
  if (isPrefersReducedMotion()) {
    gsap.set(paths, { drawSVG: '100%' });
    return () => {};
  }

  // Start hidden, scrub to fully drawn across the section.
  gsap.set(paths, { drawSVG: '0%' });

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top 80%',
    end: 'bottom 20%',
    scrub: true,
    animation: gsap.to(paths, { drawSVG: '100%', ease: 'none' }),
  });

  return () => st.kill();
}
```

Consumer (`BlogListingPage.svelte`):

```svelte
<script>
  import { createDrawScrub } from '$lib/motion/scrubs';
  import { loadDrawSVG, initScrollTriggerConfig } from '$lib/motion/utils/gsap.js';

  let blueprintWrapEl: HTMLElement;
  let listingSectionEl: HTMLElement;
  let destroyDrawScrub: (() => void) | undefined;

  onMount(async () => {
    if (isPrefersReducedMotion()) return;
    await loadDrawSVG();              // precondition
    initScrollTriggerConfig();         // precondition
    destroyDrawScrub = createDrawScrub(blueprintWrapEl, {
      section: listingSectionEl,
      pathSelector: 'svg path',
    });
  });

  onDestroy(() => destroyDrawScrub?.());
</script>
```

Note the four-line mount pattern: reduced-motion guard → load plugins → init ScrollTrigger config → call factory. The factory itself is one synchronous line.

## Common Mistakes

1. **Calling the factory before awaiting the plugin loader**
   - **What happens:** `drawSVG: '100%'` is unrecognized (the plugin isn't registered yet), tweens no-op silently, paths never draw.
   - **Fix:** Always `await loadDrawSVG()` (or appropriate loader) BEFORE calling the factory.
   - **Why:** Factories are sync and assume preconditions. The async loading belongs at the consumer.

2. **Forgetting the reduced-motion branch in a new factory**
   - **What happens:** Users with `prefers-reduced-motion: reduce` see paths at drawSVG 0% forever (never drawn).
   - **Fix:** Every factory's first line is an `isPrefersReducedMotion()` check that renders the final state and returns a no-op destroy.
   - **Why:** Reduced-motion is a site-wide contract. Missing it in one factory breaks the contract everywhere.

3. **Not returning the destroy closure**
   - **What happens:** ScrollTrigger instances accumulate across route changes. After 3 visits the `/blog` page, 3 ScrollTriggers are watching the same section and the scrub-progression gets racy.
   - **Fix:** Always `return () => st.kill()`. Consumer must call destroy from `onDestroy`.
   - **Why:** ScrollTriggers are globally registered; the component doesn't garbage-collect them.

4. **Using `createDrawScrub` for pinned content**
   - **What happens:** `createDrawScrub` doesn't pin, so pin-dependent choreography (cross-fade, zoom) doesn't work.
   - **Fix:** Use `createHeroTimeline` for pinned scrubs. It's the only factory that pins. Only the home hero uses it.
   - **Why:** Each factory has a specific shape (scrub vs pin-scrub vs scale-scrub). Match the factory to the signature.

## Connections

- **Depends on:** [[snappy-doctrine]] (scrub lane justification), [[lazy-gsap-plugins]] (preload pattern)
- **Enables:** Adding a new scroll-scrub behavior without touching component code
- **Related:** [[shared-ticker-pattern]] — factories use ScrollTrigger's internal RAF, not our shared ticker

## Knowledge Check

1. Why are the factories synchronous? → So callers can use them in sync `$effect` blocks; async plugin loading is the caller's responsibility.
2. What must every factory do on `prefers-reduced-motion`? → Render the final state AND return a no-op destroy.
3. Why does each factory return a destroy closure? → ScrollTrigger instances are globally registered; they don't auto-clean on component destroy.
4. Which factory pins? → Only `createHeroTimeline`. The others are scrubs without pinning.

## Go Deeper

- `docs/reference/MOTION.md` § 5 — full per-factory API reference
- GSAP ScrollTrigger docs: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
