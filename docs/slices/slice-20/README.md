# Slice 20 — Scroll Smoothness + Animation Polish

**Level 1 direction doc.**

**Status:** planned
**Depends on:** B+, 19b
**Est. Sessions:** 1

## Goal

Fine-tune all scroll-linked animations across the site. Fix any jank on 60fps targets. Polish snap behavior, scrub timing, transition curves.

## Scope

- Animation timing polish (MOTION.md §3 signatures tuned)
- Scroll performance optimization (Lenis wheel multipliers, scroll-snap behavior)
- Consider ScrollSmoother plugin (GSAP) — verify bundle impact
- GSAP tween audit — kill any unused tweens, consolidate where possible
- Frame rate verification via Chrome DevTools performance traces
- Scrub timing tuning

## Out of scope

- New motion signatures (MOTION.md vocabulary is closed after Slice 17e)
- Three.js / Threlte work (retired in Slice 17e)

## Target

60fps scroll on every public route, desktop + mobile.
