---
title: Lenis + GSAP Scroll Smoothness
tags: [learn, motion, intermediate]
related: [[gsap-scrolltrigger]], [[gsap-fundamentals]]
---

# Lenis + GSAP Scroll Smoothness

## The Problem

Lenis and `ScrollTrigger.normalizeScroll()` both intercept scroll events. Using both simultaneously causes:
- **Triple smoothing**: Lenis easing + normalizeScroll interception + `scrub` lag
- **Jank**: Two systems fighting over wheel/touch events
- **Broken pin calculations**: Conflicting scroll position sources

GSAP team's official guidance: *"If you're using Lenis, try not enabling the normalizeScroll() option."*

## The Solution: Conditional by Device

```typescript
// lenis.ts
const isTouchDevice = ScrollTrigger.isTouch > 0;

if (isTouchDevice) {
  // Mobile: normalizeScroll handles scroll, prevents browser chrome interference
  ScrollTrigger.normalizeScroll(true);
} else {
  // Desktop: Lenis for buttery wheel scroll
  const lenis = new Lenis({ autoRaf: false, duration: 1.2 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
```

## Key Rules

| Rule | Why |
|------|-----|
| `autoRaf: false` on Lenis | Lenis v1.3+ defaults `autoRaf: true` — GSAP ticker bridge causes double-update without this |
| `scrub: true` on desktop | Lenis provides all smoothing; numeric scrub adds lag on top |
| `scrub: 0.5` on mobile | Small buffer absorbs touch momentum with normalizeScroll |
| `ignoreMobileResize: true` | Prevents ScrollTrigger recalculating when address bar shows/hides |
| `overscroll-behavior: none` | Prevents browser bounce in pinned sections |
| Store ticker callback ref | `gsap.ticker.remove()` needs the exact function reference |

## Mobile Pinned Sections

Long pinned scroll ranges (800%+) feel worse on mobile touch (1:1 input) than desktop wheel (Lenis smoothed). Solutions:
- Keep pin duration reasonable — same range on both breakpoints
- Don't scroll content *inside* a pin on mobile — break it into a separate section that scrolls naturally after unpin
- Style the breakout section to look seamless (same background, divider)

## What NOT to Do

- Don't use `normalizeScroll(true)` with Lenis — they fight
- Don't use `scrub: 1` with Lenis — double smoothing feels laggy
- Don't forget `autoRaf: false` — Lenis v1.3+ runs its own RAF loop by default
- Don't use anonymous functions with `gsap.ticker.add()` — you can't remove them later
