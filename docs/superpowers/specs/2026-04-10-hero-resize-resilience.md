# Slice 13e — Hero Resize Resilience Design Spec

**Date:** 2026-04-10  
**Status:** Approved  
**Approach:** Hybrid — `gsap.matchMedia()` for breakpoints + `invalidateOnRefresh` within

---

## Problem

The GSAP scroll-driven hero animation (metro SVG → zoom → hero text reveal → content scroll) breaks on ANY viewport resize. Even a small desktop resize (1440→1200) permanently freezes the animation in its end state. The root causes are:

1. `invalidate()` reads mid-animation inline styles as new "from" values (feedback loop)
2. State variables (`sectionMinHeight`, `heroOverflow`) set once at mount, never updated
3. `ScrollTrigger.end` is immutable after creation
4. Phase 10 tween can't be created/destroyed dynamically
5. `transformOrigin` calculation unstable at non-1 scale
6. Scroll position maps to different progress after height change

Full research: `docs/slices/13e-research/behaviour.md` (9 issues documented with screenshots)

## Goal

Resize + browser sleep/wake → butter-smooth recalculation. User can resize from mobile to desktop and back, scroll to any position, and the animation stays cohesive. Settle-after-resize is acceptable (brief visual jump during drag is OK; correct state once settled is mandatory).

## Architecture

### One Breakpoint, Two Structural Variants

```
gsap.matchMedia()
├── "(min-width: 769px)" → desktop/tablet timeline (no Phase 10, 800% scroll)
└── "(max-width: 768px)" → mobile timeline (Phase 10 content scroll, 1100% scroll)
```

**Why one breakpoint:** The animation has exactly two structural variants. The CSS grid layout switches at `max-width: 768px` (mobile: single column stacked, desktop: three-column grid). Within each variant, function-based values handle any viewport size continuously — from 769px to 4K, from 320px to 768px.

**Why not multiple breakpoints:** Adding tablet (1024px) would duplicate Phases 1-9 for identical behavior. Tablet at 800px uses three-column grid, zero overflow, no Phase 10 — same as desktop. Function-based values handle continuous scaling.

### Timeline Builder

Extract timeline construction from `onMount` into a reusable function:

```typescript
function buildHeroTimeline(mobile: boolean): void {
  // 1. Measure BEFORE applying scale (fixes transformOrigin drift)
  updateZoomOrigin();
  updateHeroTextOrigin();
  
  // 2. Set initial states
  gsap.set(heroTextContainer, { scale: () => calcHeroTextScale() });
  gsap.set(staggerEls, { opacity: 0 });
  
  // 3. Build shared Phases 1-9 (identical for both variants)
  const tl = gsap.timeline();
  // ... Phase 1-9 tweens with function-based values ...
  
  // 4. Mobile only: Phase 10 content scroll
  if (mobile) {
    tl.to(heroTextContainer, {
      y: () => -measureOverflow(),
      duration: 0.5,
      ease: 'none',
    }, 1.52);
    tl.set({}, {}, 2.05);
  }
  
  // 5. Create ScrollTrigger
  ScrollTrigger.create({
    trigger: pinContainer,
    start: 'top top',
    end: mobile ? '+=1100%' : '+=800%',
    pin: true,
    scrub: 1,
    animation: tl,
    invalidateOnRefresh: true,
    onUpdate: (self) => { /* blink logic */ },
  });
  
  // 6. Set section height
  sectionMinHeight = mobile ? '1200svh' : '900svh';
}
```

### Function-Based Values

Every viewport-dependent value becomes a function that GSAP re-evaluates on refresh:

| Value | Current (baked) | New (function-based) |
|-------|----------------|---------------------|
| Phase 5 zoom scale | `calcZoomScale()` → 103 | `scale: () => calcZoomScale()` |
| Hero text initial scale | `calcHeroTextScale()` → 225 | `scale: () => calcHeroTextScale()` |
| Phase 10 y-translate | `y: -heroOverflow` → -813 | `y: () => -measureOverflow()` |
| Transform origins | Calculated once at mount | Recalculated during builder, before scale is applied |

**`measureOverflow()` replaces `heroOverflow` const:**

```typescript
function measureOverflow(): number {
  const contentInner = heroTextContainer?.firstElementChild as HTMLElement;
  return contentInner ? Math.max(0, contentInner.scrollHeight - window.innerHeight) : 0;
}
```

### Transform-Origin Fix

**Current bug:** `getDotGlyphCenter()` reads `getBoundingClientRect()` while container is at scale=225, producing wrong percentages that drift across resize cycles.

**Fix:** In `buildHeroTimeline()`, calculate transform-origin BEFORE applying `gsap.set(heroTextContainer, { scale })`. Since matchMedia reverts all styles before calling the builder, the container starts at scale=1 with no inline transforms — the measurement is clean.

### Scroll Position Continuity

When matchMedia crosses the breakpoint, preserve the user's visual position:

```typescript
let savedProgress: number | null = null;

mm.add("(min-width: 769px)", () => {
  buildHeroTimeline(false);
  
  // Restore progress from previous breakpoint
  if (savedProgress !== null) {
    const st = ScrollTrigger.getAll().find(s => s.trigger === pinContainer);
    if (st) {
      const newScrollY = st.start + (savedProgress * (st.end - st.start));
      window.scrollTo(0, newScrollY);
    }
    savedProgress = null;
  }
  
  // Return cleanup function — runs when breakpoint no longer matches
  return () => {
    const st = ScrollTrigger.getAll().find(s => s.trigger === pinContainer);
    if (st) savedProgress = st.progress;
  };
});

// Same pattern for mobile callback
```

### Lifecycle

```
onMount:
  1. Scroll lock + typewriter (unchanged, runs once)
  2. After typewriter completes → unlockScroll()
  3. gsap.matchMedia() with two callbacks
  4. visibilitychange listener for sleep/wake
  5. Store matchMedia instance for cleanup

onDestroy:
  1. mm.revert()     ← kills all animations from both breakpoints
  2. stopBlink()
  3. Remove visibilitychange listener
```

**Deleted entirely:**
- `window.addEventListener('resize', onResize)` — matchMedia + invalidateOnRefresh replaces it
- The `onResize()` function — no longer needed
- `const heroOverflow` — replaced by `measureOverflow()` function
- Manual `invalidate()` calls on tweens

### Browser Sleep/Wake

```typescript
function onVisibilityChange() {
  if (!document.hidden) {
    ScrollTrigger.refresh();
  }
}
document.addEventListener('visibilitychange', onVisibilityChange);
```

## Scope

### Files Changed

| File | Change |
|------|--------|
| `src/lib/components/HeroBanner.svelte` | Refactor timeline lifecycle to matchMedia pattern |

### Not In Scope

- No layout/CSS changes
- No new components or files
- No data layer changes
- No changes to other pages
- No new dependencies (gsap.matchMedia is built into GSAP core)

### Estimated Impact

- ~80 lines new/restructured (builder function + matchMedia wrappers + scroll continuity)
- ~30 lines removed (onResize handler + manual lifecycle)
- Net: ~+50 lines. File stays under 800 lines.

## Testing

### Existing Tests (must pass)

All 14 home tests + 49 slice-specific tests should pass unchanged. No markup, test IDs, or component behavior changes.

### Manual Verification Matrix

| Scenario | Expected |
|----------|----------|
| Load desktop, scroll through all phases | Identical to current behavior |
| Load mobile, scroll through all phases including Phase 10 | Identical to current behavior |
| Desktop → mobile at Phase 9 | Animation settles to correct mobile state |
| Mobile → desktop at Phase 10 | Animation settles to correct desktop state (no Phase 10 y-translate) |
| Desktop → mobile → desktop round-trip | transformOrigin correct, animation functional |
| Small desktop resize (1440→1200) at Phase 5 | Scroll back to 0 shows correct start state |
| Small desktop resize at Phase 9 | Hero stays visible, correct scale |
| Tab sleep/wake | ScrollTrigger.refresh() restores correct state |
| DevTools responsive toggle | matchMedia fires, clean rebuild |

## Acceptance Criteria

1. All 9 issues from `behaviour.md` are resolved
2. Existing tests pass without modification
3. Animation is visually identical on fresh load (desktop and mobile)
4. Desktop↔mobile resize at any scroll position produces correct settled state
5. Within-breakpoint resize (e.g., dragging desktop edge) produces correct settled state
6. Browser tab sleep/wake doesn't break the animation
7. No new dependencies added
8. File stays under 800 lines

## References

- Research: `docs/slices/13e-research/behaviour.md`
- Screenshots: `docs/slices/13e-research/*.png`
- GSAP matchMedia docs: https://gsap.com/docs/v3/GSAP/gsap.matchMedia()
- Current hero code: `src/lib/components/HeroBanner.svelte`
