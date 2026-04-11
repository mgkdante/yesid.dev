---
title: "GSAP matchMedia for Responsive Animations"
domain: motion
difficulty: 2
difficulty_label: intermediate
reading_time: 4
tags:
  - learn
  - motion
  - intermediate
prerequisites:
  - "[[gsap-scrolltrigger]]"
  - "[[gsap-timeline-and-stagger]]"
date: 2026-04-11
---

# GSAP matchMedia for Responsive Animations

## The Analogy

Imagine you have two different animation playbooks — one for desktop, one for mobile. When the screen size changes, `gsap.matchMedia()` tears up the current playbook, resets everything to its original state, and hands you the correct playbook for the new screen size. No leftover inline styles, no zombie animations.

## What It Is

`gsap.matchMedia()` lets you define breakpoint-specific GSAP animations. When a media query matches, GSAP runs your setup function. When it stops matching (e.g., the user resizes across a breakpoint), GSAP automatically **reverts all inline styles** it applied and **kills all animations** created inside that function. Then it re-runs the matching breakpoint's setup.

This solves the problem of desktop animations leaving residual `transform`, `opacity`, or `scale` styles that break the mobile layout (or vice versa).

## Why It Matters

Without matchMedia, resizing a browser window from desktop to mobile leaves GSAP inline styles (like `transform: scale(3.5)`) orphaned on elements, breaking layouts. Manual cleanup is error-prone. matchMedia handles the entire lifecycle: setup, revert, re-setup.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/components/HeroBanner.svelte` | The `gsap.matchMedia()` block | Desktop vs mobile hero timeline with different scales and layouts |

## The Mental Model

```
Window resize: 1200px → 500px (crosses md breakpoint)

1. matchMedia detects breakpoint change
2. REVERTS all inline styles from desktop timeline
3. KILLS all desktop ScrollTrigger instances
4. Elements return to their CSS/class-defined state
5. RUNS mobile setup function
6. New mobile timeline + ScrollTrigger created
```

## Worked Example

```typescript
// From: src/lib/components/HeroBanner.svelte (simplified)
const mm = gsap.matchMedia();

mm.add('(min-width: 768px)', () => {
  // Desktop timeline — only exists while viewport ≥ 768px
  const tl = gsap.timeline({ scrollTrigger: { ... } });
  tl.to(svgWrapper, { scale: calcZoomScale(), ... });
  // When viewport shrinks below 768px, GSAP reverts ALL of this automatically
});

mm.add('(max-width: 767px)', () => {
  // Mobile timeline — different scale, different layout
  const tl = gsap.timeline({ scrollTrigger: { ... } });
  tl.to(svgWrapper, { scale: calcMobileZoomScale(), ... });
});
```

Key: everything created inside `mm.add()` is tracked and reverted on breakpoint exit.

## Common Mistakes

1. **Creating animations outside matchMedia:** Animations outside `mm.add()` won't be reverted on resize.
   - **Fix:** Move ALL GSAP animations that differ by breakpoint inside `mm.add()`.
   - **Why:** Only animations created inside the callback are tracked for automatic revert.

2. **Using function-based values without invalidateOnRefresh:** Dynamic values (like zoom scale) must recalculate on scroll refresh.
   - **Fix:** Use `invalidateOnRefresh: true` on ScrollTrigger and function-based values in tweens.
   - **Why:** Without it, the initial value is cached and never updates, causing drift on within-breakpoint resize.

## Connections

- **Depends on:** [[gsap-scrolltrigger]] because matchMedia wraps ScrollTrigger-driven timelines
- **Related:** [[svg-viewbox-mobile-scaling]] because both address responsive behavior

## Knowledge Check

1. What happens to inline styles when a breakpoint exits? → See [What It Is](#what-it-is)
2. Why must animations be created inside `mm.add()`? → See [Common Mistakes](#common-mistakes)

## Go Deeper

- [GSAP matchMedia docs](https://gsap.com/docs/v3/GSAP/gsap.matchMedia())
- [GSAP responsive animations guide](https://gsap.com/resources/responsive/)
