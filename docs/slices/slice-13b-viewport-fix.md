# Slice 13b — Hero Viewport Height Fix

**Status:** ready
**Priority:** 1
**Estimated effort:** 1 session
**Depends on:** 13a (hero fixes, Lenis, home teardown)

## Objective

Fix the hero scroll animation shifting/jumping on mobile browsers caused by the browser chrome (address bar, toolbar) hiding/showing during scroll. Replace `100vh` and `h-screen` with modern viewport units (`dvh`, `svh`, `lvh`) and `env(safe-area-inset-*)` so the hero animation is stable across all mobile browsers.

## Context

Mobile browsers like Brave, Chrome, and Safari have dynamic toolbars that hide on scroll-down and show on scroll-up. `100vh` is calculated from the *largest* possible viewport, so when the toolbar is visible the actual viewport is shorter than 100vh, causing layout shift. The hero uses `h-screen` (= `100vh`) for its pinned container, and `1300vh` for scroll distance — both are affected.

Modern CSS provides:
- `svh` (small viewport height) — viewport with all browser chrome visible (shortest)
- `lvh` (large viewport height) — viewport with all chrome hidden (tallest, same as old `100vh`)
- `dvh` (dynamic viewport height) — updates live as chrome shows/hides
- `env(safe-area-inset-*)` — accounts for notches, rounded corners, home indicators
- Visual Viewport API — JavaScript API for the actual visible area

## Architecture

This is a targeted fix to HeroBanner.svelte. The approach:
1. Pin container: `h-[100svh]` instead of `h-screen` — use the *smallest* viewport so content never overflows when chrome is visible
2. ScrollTrigger calculations: use `svh` for consistent scroll math (no jumps when chrome toggles)
3. Safe area insets: add `env(safe-area-inset-*)` padding for notched devices
4. Fallback: `100vh` for browsers that don't support new units (pre-2022)

**Why `svh` not `dvh`?** `dvh` updates dynamically which causes ScrollTrigger to recalculate mid-scroll — this creates the exact jumping we're trying to fix. `svh` is stable: it never changes during scroll, so ScrollTrigger math stays consistent.

## Tech Stack

SvelteKit 2 + Svelte 5, GSAP ScrollTrigger, Tailwind v4, CSS viewport units (svh/lvh/dvh)

## File Structure

### Modified Files

```
src/lib/components/HeroBanner.svelte    — MODIFY: replace h-screen/100vh with svh units + safe-area padding
src/app.css                             — MODIFY: add fallback custom property for viewport height
```

### Reused (no changes needed)

```
src/lib/motion/utils/gsap.ts            — ScrollTrigger already registered
src/lib/motion/utils/lenis.ts           — smooth scroll unaffected
```

---

## Task 1: Replace viewport height units in HeroBanner

**Files:**
- Modify: `src/lib/components/HeroBanner.svelte`

- [ ] **Step 1: Replace `h-screen` with `h-[100svh]` on pin container**
  The pin container (line ~395) uses `h-screen` (= `100vh`). Replace with `h-[100svh]` and add fallback:
  ```
  class="... h-[100svh] h-[100vh] ..."
  ```
  Tailwind processes last-wins, but older browsers without `svh` support fall back to `100vh`.

- [ ] **Step 2: Update min-height on outer section**
  Line ~391: `min-height: {reducedMotion ? '100vh' : '1300vh'}` — update the reduced-motion branch to use `100svh` with `100vh` fallback.

- [ ] **Step 3: Add safe-area padding for notched devices**
  Add `padding-bottom: env(safe-area-inset-bottom, 0px)` to the pin container to prevent content from being clipped behind home indicators on iPhone.

- [ ] **Step 4: Run tests**
  Run: `bun run test && bun run check`
  Expected: All pass.

**STOP. Ask Yesid to verify on mobile (Brave) — scroll up/down, check for shifting.**

---

## Task 2: Add CSS viewport height fallback utility

**Files:**
- Modify: `src/app.css`

- [ ] **Step 1: Add viewport height custom property**
  Add a `--vh-full` custom property that uses `svh` with `vh` fallback:
  ```css
  :root {
    --vh-full: 100svh;
  }
  @supports not (height: 100svh) {
    :root {
      --vh-full: 100vh;
    }
  }
  ```
  This property can be reused by the Manifesto and other full-viewport sections in later sub-slices.

- [ ] **Step 2: Run tests and check**
  Run: `bun run test && bun run check`
  Expected: All pass.

**STOP. Ask Yesid to verify.**

---

## Execution Order

Sequential: Task 1 → Task 2.

## Out of Scope

- Full site-wide viewport adaptation (that's slice 17a)
- Visual Viewport API JavaScript integration (17a — for complex cases like virtual keyboards)
- Other pages (/services, /about, etc.) — only the hero is fixed here
- Manifesto section viewport (13c will use `--vh-full` when it's built)

## Acceptance Criteria

- [ ] Hero pin container uses `100svh` instead of `100vh`/`h-screen`
- [ ] Safe-area inset padding applied for notched devices
- [ ] Fallback to `100vh` for pre-2022 browsers without `svh` support
- [ ] `--vh-full` CSS custom property available for future sections
- [ ] No scroll animation shifting on mobile when browser chrome hides/shows
- [ ] Hero animation works identically on desktop (no regression)
- [ ] `bun run test` and `bun run check` both pass

## Learn

### Modern Viewport Units (svh, lvh, dvh)
**What it is:** CSS viewport units introduced in 2022 that account for mobile browser chrome. `svh` = smallest viewport (chrome visible), `lvh` = largest (chrome hidden), `dvh` = dynamic (updates live).
**Why it matters:** `100vh` on mobile includes space behind the browser toolbar, causing content to extend below the visible area. `100svh` is the safe choice for pinned/full-screen sections because it never changes during scroll.
**Try this:** On mobile, compare `height: 100vh` vs `height: 100svh` — the vh version will have a small gap when the toolbar is visible.
**Go deeper:** https://web.dev/blog/viewport-units

## Verify

1. Open `http://localhost:5173/` on mobile Brave
2. Scroll down through the hero animation — toolbar should hide
3. Scroll back up — toolbar reappears
4. During both transitions: hero should NOT shift, jump, or resize
5. Check on desktop — no visual regression
6. Inspect: pin container should show `height: 100svh`
