---
title: "Lazy GSAP Plugin Loading"
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
  - "[[signature-vocabulary]]"
date: 2026-04-17
slice: 17e-6
---

# Lazy GSAP Plugin Loading

## The Analogy

A SQL database ships with a dozen extensions available — PostGIS, pg_stat_statements, uuid-ossp — but you only `CREATE EXTENSION` the ones you use. You don't load PostGIS on every project "just in case". Lazy-loading GSAP plugins is the same idea: GSAP has ~8 plugins (DrawSVG, MorphSVG, Flip, MotionPath, SplitText, CustomEase, etc.), each a few KB gzipped. Shipping all of them to every route wastes bandwidth. Ship only what each route actually uses, loaded on demand.

## What It Is

A pattern where GSAP plugins are:

- **Eagerly imported** (always bundled) when they're used site-wide or when they must run synchronously. Currently: `ScrollTrigger`, `SplitText`, `MorphSVGPlugin`.
- **Lazy-loaded** via dynamic `import()` when they're route-specific and can be awaited. Currently: `DrawSVG`, `Flip`, `CustomEase`, `MotionPath`.

Implementation in `src/lib/motion/utils/gsap.ts`:

```ts
const loadedPlugins = new Set<string>();

export async function loadDrawSVG(): Promise<void> {
  if (loadedPlugins.has('DrawSVG')) return;          // idempotent
  const mod = await import('gsap/DrawSVGPlugin');    // dynamic import
  gsap.registerPlugin(mod.DrawSVGPlugin);
  loadedPlugins.add('DrawSVG');
}
```

Consumers call `await loadDrawSVG()` at the top of their `onMount` before using any `drawSVG:` tween syntax.

## Why It Matters

Each GSAP plugin is 3–15 KB gzipped. Bundling all of them into the main chunk means every route pays the bandwidth + parse cost even if only one route uses Flip. Lazy-loading means Flip lands only in the chunks Vite code-splits for the blog + projects listing routes.

In practice (17e-5 D269 measurement), the shrink from going lazy was smaller than expected because some plugins have sync-API coupling that defeats code-splitting (see Common Mistakes #3 below). But the architectural boundary — "consumer declares what it needs" — is valuable regardless: it makes route-level dependency analysis grep-able, and future bundle improvements are localized changes to gsap.ts, not rewrites of every consumer.

## How We Use It in This Project

| Plugin | Loading strategy | Why | Consumers |
|---|---|---|---|
| `ScrollTrigger` | Eager | Used site-wide; every pin/scrub needs it | All scrubs + `+layout.svelte` |
| `SplitText` | Eager | `wordmarkHover`'s action contract runs `new SplitText(...)` synchronously; can't await | `wordmarkHover.ts` |
| `MorphSVGPlugin` | Eager | `morphHelpers.ts` calls `MorphSVGPlugin.convertToPath()` as a static method from SvgIcon, which ships on every major route | `morphHover` action, `SvgIcon.animateMorph`, `HomeServices` (via action) |
| `DrawSVG` | Lazy (`loadDrawSVG`) | Route-specific — home hero, listing blueprints, SvgIcon, DataFlowDiagram | `HeroBanner`, `DataFlowDiagram`, `SvgIcon`, `HomeCloser` (via CloserGraffiti), `BlogListingPage`, `ProjectListingPage`, `StackConnections` |
| `Flip` | Lazy (`loadFlip`) | Only used on listing-page filter transitions | `BlogListingPage`, `ProjectListingPage` |
| `CustomEase` | Lazy (`loadCustomEase`) | Only the hero's `networkDraw` ease | `HeroBanner` (via `createHeroTimeline`) |
| `MotionPathPlugin` | Lazy (`loadMotionPathPlugin`) | Only the tech-stack connections dots | `StackConnections` |
| `SplitText` (loader) | Lazy available but currently no-op | `ensureSplitTextRegistered()` sync helper handles wordmarkHover; `loadSplitText` kept for API completeness | — |

## The Mental Model

Sync helpers on the eager side, async loaders on the lazy side:

```
                      gsap.ts
      ┌───────────────────┴───────────────────┐
      │                                       │
   EAGER (always bundled)                LAZY (awaited on demand)
      │                                       │
   ScrollTrigger                         loadDrawSVG()
   SplitText                             loadMorphSVG()      ← currently no-op
   MorphSVGPlugin                        loadFlip()           (MorphSVG is eager)
      │                                  loadCustomEase()
      │                                  loadMotionPathPlugin()
      ▼                                  loadSplitText()      ← currently no-op
  ┌───────────────────┐                         │            (SplitText is eager)
  │ Sync helpers       │                         ▼
  │                    │                  Dynamic import + registerPlugin
  │ initScrollTrigger-│
  │   Config()         │
  │ ensureSplitText-   │
  │   Registered()     │
  └───────────────────┘
```

### Consumer pattern

```ts
onMount(async () => {
  if (isPrefersReducedMotion()) return;

  // 1. Preload the plugins this consumer needs
  await Promise.all([loadDrawSVG(), loadMorphSVG()]);

  // 2. Unmount-during-await guard
  if (!container) return;

  // 3. Initialize ScrollTrigger config (idempotent)
  initScrollTriggerConfig();

  // 4. Now it's safe to use drawSVG: / morphSVG: tween syntax
  gsap.to(paths, { drawSVG: '0%', duration: 1 });
});
```

## Worked Example

Before 17e-5 D269, every consumer called `registerGsapPlugins()` which registered all 7 plugins eagerly. After D269, each consumer declares its plugins:

**Before (all plugins eager):**

```ts
// src/lib/components/home/DataFlowDiagram.svelte
import { registerGsapPlugins, gsap, DrawSVGPlugin } from '$lib/motion/utils/gsap.js';

onMount(() => {
  if (isPrefersReducedMotion() || !container) return;
  registerGsapPlugins();  // ← registers ALL 7 plugins even though we only use DrawSVG + ScrollTrigger

  gsap.timeline({ scrollTrigger: { trigger: container } })
    .from(paths, { drawSVG: '0%' });
});
```

**After (explicit deps):**

```ts
// src/lib/components/home/DataFlowDiagram.svelte
import { initScrollTriggerConfig, loadDrawSVG, gsap } from '$lib/motion/utils/gsap.js';

onMount(async () => {                  // ← async now
  if (isPrefersReducedMotion() || !container) return;
  await loadDrawSVG();                  // ← only what we need
  if (!container) return;               // ← unmount-during-await guard
  initScrollTriggerConfig();             // ← ScrollTrigger config

  gsap.timeline({ scrollTrigger: { trigger: container } })
    .from(paths, { drawSVG: '0%' });
});
```

The delta:
- Component declares "I need DrawSVG + ScrollTrigger" at the call site.
- MorphSVG, Flip, CustomEase, MotionPath, SplitText don't land in DataFlowDiagram's chunk (except MorphSVG which is eager for unrelated reasons).
- `onMount` becomes async — consumer now handles the promise chain.

## Common Mistakes

1. **Forgetting the unmount-during-await guard**
   - **What happens:** Test environments mount+unmount rapidly; by the time `await loadDrawSVG()` resolves, `container` is null. `container.querySelector(...)` throws.
   - **Fix:** Re-check the binding after every `await`: `if (!container) return;`
   - **Why:** Svelte doesn't cancel in-flight `onMount` promises on destroy. The component is gone but your code keeps running.

2. **Calling `initScrollTriggerConfig()` before `loadDrawSVG`**
   - **What happens:** The order actually doesn't matter for correctness (both are idempotent), BUT if you mix with `ScrollTrigger.create(...)` right after the config call, you may hit an un-registered plugin error.
   - **Fix:** Canonical order: `await loadX()` first, THEN `initScrollTriggerConfig()`, THEN your tweens.
   - **Why:** Predictable ordering is easier to audit in PR review.

3. **Assuming the lazy loader actually splits the chunk**
   - **What happens:** You lazy-load Flip via `loadFlip()`, but `flip.ts` also statically `import`s `Flip` from `'gsap/Flip'` because `captureFlipState` must be synchronous. Vite resolves the static import first; the dynamic import becomes a no-op. Flip ends up in the route bundle.
   - **Fix:** For a true lazy split, every code path must be dynamic. If any consumer has a static reference, the plugin ships statically. Document the coupling in `MOTION.md` "deferred bundle-shrink opportunities".
   - **Why:** Vite bundles at the module boundary. Static > dynamic when both exist.

4. **Returning a cleanup closure from an async `onMount`**
   - **What happens:** Svelte's `onMount` signature is `() => (() => void) | Promise<void>`. An async function returning a cleanup closure resolves to `Promise<() => void>`, which Svelte can't use. TypeScript will flag this in `bun run check`.
   - **Fix:** Move cleanup to `onDestroy()`. Keep `onMount` async but don't return a cleanup.
   - **Why:** Svelte's lifecycle API pre-dates async/await composition; this gap won't be fixed.

## Connections

- **Depends on:** [[signature-vocabulary]] — each signature declares its plugin needs
- **Enables:** Route-level bundle analysis ("which plugins does /blog need?")
- **Related:** [[scrub-factory-pattern]] — scrubs are sync because caller handles the await chain

## Knowledge Check

1. Which 3 plugins stay eager and why? → ScrollTrigger (site-wide), SplitText (wordmarkHover sync contract), MorphSVGPlugin (morphHelpers static call on every major route).
2. Why does `loadSplitText` exist if SplitText is eager? → API completeness + future: when wordmarkHover's sync coupling is refactored, the loader is ready.
3. What's the guard after `await loadX()`? → Re-check the DOM binding — `if (!container) return;`.
4. Why didn't the D269 migration shrink the bundle as predicted? → Static imports in `flip.ts` and `createHeroTimeline.ts` for sync API access (captureFlipState, CustomEase.create) defeated the Vite chunk split.

## Go Deeper

- `docs/reference/MOTION.md` § 9 — full plugin loading contract
- `docs/slices/slice-17e-5-interaction-consolidation.md` — D269 migration log
- GSAP plugin docs: https://gsap.com/docs/v3/Plugins/
