# Slice 06 — Home Page: Train Journey + Hero 3D Scene

**Status:** complete
**Priority:** 1
**Estimated effort:** 2-3 sessions
**Depends on:** 02 (complete), 04 (complete), 05 (complete)

## Objective

Build the centerpiece home page: a scroll-driven train journey between service stations with a 3D Threlte background, GSAP-animated SVG train, Lottie station icons, and a CTA destination.

## Acceptance Criteria

- [x] Hero section: "yesid." wordmark, "The infrastructure is ready." copy, tagline, scroll prompt
- [x] 3D Threlte scene as fixed background (desktop only), responds to scroll
- [x] SVG train animated via GSAP MotionPathPlugin, scroll-linked (desktop only)
- [x] 4 service stations rendered from data (ServiceStation component)
- [x] Lottie station icons play when scroll reaches each station
- [x] Related project cards shown at each station (filtered by status)
- [x] CTA section: "Let's build something that moves." with View work + Get in touch links
- [x] Mobile fallback: CSS gradient instead of 3D, no train
- [x] Reduced motion: static scene, no animations, all content visible
- [x] Data-driven: station count = services.length, no hardcoded counts
- [x] Layout conditional: home page full-width, other pages centered container
- [x] Lottie files moved to static/lottie/ for URL-based serving
- [x] All tests pass (207 total)
- [x] svelte-check: 0 errors
- [x] tree.txt updated
- [x] Dev log written
- [x] Handoff report written

## Out of Scope

- SVG train Figma design (pending pre-slice work)
- Data path curves sketch (pending pre-slice work)
- PathParticles.svelte (deferred — data paths sufficient for v1)
- SubtleGrid.svelte (deferred — minimal scene is cleaner)
- Train idle Lottie animation (optional, v2)
- Easter eggs (slice 10 QA polish)
