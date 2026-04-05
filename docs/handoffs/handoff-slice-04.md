# Handoff: Slice 04 — Motion Infrastructure + Component Enhancement

## Summary

Built the complete motion system for yesid.dev: four Svelte actions (`use:boop`, `use:reveal`, `use:magnetic`, `use:ripple`), two reactive stores (`prefersReducedMotion`, `scrollProgress`), GSAP registration, a stagger utility, and a generic `LottiePlayer` component. Updated the Service interface and data to support the data-driven train journey. Wired motion into ProjectCard and TagList. All 149 tests pass.

## What Was Built

- `src/lib/motion/actions/boop.ts` — hover transform that resets itself after ~300ms ("boop" pattern)
- `src/lib/motion/actions/reveal.ts` — GSAP ScrollTrigger entrance animation triggered at 80% viewport
- `src/lib/motion/actions/magnetic.ts` — cursor pull on desktop (disabled on touch/reduced-motion)
- `src/lib/motion/actions/ripple.ts` — brand orange click ripple, 400ms fade
- `src/lib/motion/stores/reducedMotion.ts` — `prefersReducedMotion` store + sync `isPrefersReducedMotion()` helper
- `src/lib/motion/stores/scroll.ts` — `scrollProgress` store (0–1, rAF-gated)
- `src/lib/motion/utils/gsap.ts` — `registerGsapPlugins()`, re-exports gsap/ScrollTrigger/MotionPathPlugin
- `src/lib/motion/utils/stagger.ts` — `stagger(index, baseDelay)` with ±15% randomization
- `src/lib/motion/components/LottiePlayer.svelte` — generic lottie-web wrapper
- `src/lib/motion/index.ts` — top-level barrel: `import { boop, prefersReducedMotion, stagger } from '$lib/motion'`
- `src/lib/motion/three/.gitkeep` — placeholder directory for Slice 06 Threlte scene

## Files Modified

- `src/lib/data/types.ts` — Service interface gains `id: string`, `station: number` (sequential, no cap), `relatedProjects: string[]`
- `src/lib/data/services.ts` — all 4 services updated with new fields; icon points to actual Lottie filenames
- `src/lib/data/data-integrity.test.ts` — replaced hardcoded "exactly 4 services" with 8 structural tests (unique ids, sequential stations, valid slug refs)
- `src/lib/components/ProjectCard.svelte` — added `use:boop={{ scale: 1.05, timing: 300 }}`
- `src/lib/components/TagList.svelte` — added `use:reveal` + `stagger()` on each `<li>`
- `src/tests/setup.ts` — added global stubs: `window.matchMedia`, `IntersectionObserver`, GSAP mocks, lottie-web mock
- `docs/ARCHITECTURE.md` — added motion system directory, new dependencies table
- `tree.txt` — updated

## How It Works

### Motion layers (per MOTION.md section 3)

The site uses four independent animation layers that stack without coupling:

1. **Svelte actions** (this slice): hover boops, scroll reveals, cursor magnetism, click ripple
2. **GSAP choreography** (this slice): `use:reveal` wraps ScrollTrigger; timelines built in Slices 05-06
3. **Lottie illustration** (this slice): `LottiePlayer.svelte` — plays JSON animations; Slice 06 connects them to stations
4. **Threlte 3D atmosphere** (Slice 06): packages installed, no scene built yet

### Actions pattern

Every action follows the same contract (MOTION.md section 12):

```typescript
export function actionName(node: HTMLElement, params = {}) {
    if (isPrefersReducedMotion()) return { update() {}, destroy() {} };
    // setup
    return { update(p) { ... }, destroy() { ... } };
}
```

The `isPrefersReducedMotion()` synchronous helper reads `window.matchMedia` at call time. The `prefersReducedMotion` reactive store is for Svelte components that want to subscribe and react to OS changes.

### Data-driven station system

The Service interface now has `station: number` — a sequential position with **no hardcoded upper bound**. The data-integrity tests validate structure (unique, sequential 1…N, valid slug refs), not a fixed count. Adding a 5th service means adding one object to `services.ts` + one Lottie JSON file. Zero component or layout changes.

### Test isolation

GSAP and lottie-web are mocked globally in `src/tests/setup.ts`. This means:
- Actions are tested for **correct invocation** of GSAP, not for visual output (that's Playwright E2E in Slice 10)
- All existing component tests continue to pass — motion code is transparent to them

## Decisions Made

| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| `isPrefersReducedMotion()` sync helper alongside the store | Actions run in TS, not Svelte components — they need a one-time boolean read, not a subscription | Store-only, but subscribing in a plain TS function is awkward |
| `maxTouchPoints > 0` for touch detection in magnetic | jsdom sets `ontouchstart` on the window object, making `'ontouchstart' in window` always true in tests | `'ontouchstart' in window \|\| maxTouchPoints > 0` — jsdom false positive |
| Individual style properties in ripple, not `cssText` | jsdom re-serializes `cssText` after rAF, dropping the `background` value | `cssText` assignment — worked in dev, unreliable in tests |
| Dynamic import for lottie-web in `$effect()` | lottie-web accesses `document` on import — crashes SSR if imported at module top-level | Top-level import — would fail every SSR render |
| Delay param in `use:reveal` is ms, converted to seconds internally | Calling code uses ms (consistent with CSS, boop timing, stagger) | Pass seconds directly — breaks consistency |
| Replaced hardcoded "exactly 4 services" test | The station system is data-driven — adding a service should pass tests, not break them | Keep the count test and update it every time a service is added |

## What Yesid Should Know

### Svelte actions (`use:directive`)
A Svelte action is a plain TypeScript function you attach to a DOM element: `use:boop`, `use:reveal`. It runs when the element mounts and cleans up when it unmounts — like an INSERT/DELETE database trigger. The action keeps behavior separate from markup.

Try it: add `use:boop` to any element in `+page.svelte`. Hover it. Remove `use:boop`. See the difference.

### prefers-reduced-motion
An OS accessibility setting (Windows: Settings → Accessibility → Visual effects → Animation effects). When on, every action in this slice returns immediately without animating. The content is still there — just no motion. Test it: disable OS animations, reload, hover a ProjectCard.

### GSAP ScrollTrigger
`use:reveal` fires when an element enters the viewport at 80% height. The scroll position IS the playhead — like a cursor moving through a result set. Each row (section) animates when the cursor reaches it.

Try it: find an element with `use:reveal`, change `direction: 'up'` to `direction: 'left'`. Scroll to it. Watch it slide in from the left.

### Data-driven architecture
The `station` field grows with `services.length`. Test this: temporarily add a 5th service to `services.ts` with `station: 5`. Run `bun run test`. All tests pass. The home page won't render it yet (that's Slice 06) but the data layer accepts it with zero friction.

## What Comes Next

**Slice 05 — Layout Shell + Scroll Progress Rail:** builds `+layout.svelte` with Nav and Footer, and the `ScrollRail` component that uses `scrollProgress` (built this slice). The rail shows station markers on the home page — those markers map to `services.length` (data-driven, of course).

## How to Verify

1. `bun run test` — 149 tests pass
2. `bun run check` — 0 TypeScript errors
3. `bun run dev` → hover a ProjectCard → see a brief scale pulse (boop)
4. Scroll down → elements with `use:reveal` slide in from below
5. Disable OS animation preference → reload → no motion fires on hover or scroll
6. `src/lib/data/services.ts` → all 4 services have `id`, `station`, `relatedProjects`
7. Add a temporary 5th service with `station: 5` → `bun run test` → all pass → remove it
8. `src/lib/motion/` directory structure matches MOTION.md section 12
