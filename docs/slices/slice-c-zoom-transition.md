# Slice C — Zoom Transition

**Status:** in-progress
**Priority:** 1
**Estimated effort:** 1 session
**Depends on:** Slice A (SVG metro network hero)

## Objective
Seamlessly transition the fully orange hero screen into the brand statement by zooming out to reveal "INFRA." with a split hero layout.

## Context
Slice A ends with the screen fully orange (Berri-UQAM node zoomed to fill viewport). There's no hero text or CTAs yet. Slice C bridges the gap — the orange becomes the "." in "INFRA." and zooms out to reveal the full hero section.

## Acceptance Criteria
- [ ] Orange screen from Slice A seamlessly becomes the "." in "INFRA."
- [ ] Zoom-out reveals split hero layout (headline left, SQL right)
- [ ] One continuous pin — no visual pop or seam between phases
- [ ] Transform-origin recalculates on resize
- [ ] All hero text content from content.ts (no hardcoded strings)
- [ ] Element stagger: dot → DATA/INFRA → BUILT RIGHT. → badge/subtitle/CTAs → SQL
- [ ] Desktop: split layout with SQL decoration
- [ ] Mobile: stacked layout
- [ ] Reduced motion: static hero text, no animation
- [ ] bun run test passes
- [ ] bun run check passes

## Technical Spec
- Extend HeroBanner.svelte — add hero text markup, extend GSAP timeline
- Hero text container starts at opacity:0, scaled up (transform-origin at dot)
- Timeline extends from 1.0 to ~1.5, scroll distance 800% → 1200%
- Cross-fade SVG → text container, then scale down with text stagger
- Content from heroContent in content.ts (already defined)
- Design spec: docs/superpowers/specs/2026-04-04-slice-c-zoom-transition-design.md

## Out of Scope
- GSAP SplitText effects (Slice B, deferred)
- Parallax or 3D effects
- Light theme, i18n locale switching
- Changes to metro network animation (Slice A phases unchanged)

## Learn

### GSAP Timeline Extension
**What it is:** Adding phases to an existing GSAP timeline after position 1.0 extends the total duration. With scrub, the scroll-to-timeline mapping adjusts proportionally.
**Why it matters:** Like adding rows to a SQL result set — the existing rows don't change, you just have more data. The ScrollTrigger's scrub maps the full scroll range across the full timeline duration.
**Try this:** In browser devtools, inspect the ScrollTrigger and check `animation.totalDuration()` — it should be ~1.5 instead of 1.0.
**Go deeper:** https://gsap.com/docs/v3/GSAP/Timeline/

### Transform Origin for Zoom Effects
**What it is:** CSS transform-origin sets the point around which transforms (like scale) happen. Setting it to the dot's pixel position means the dot stays fixed while everything else scales around it.
**Why it matters:** Same concept as a SQL JOIN's anchor column — one point stays fixed while related data arranges around it.
**Try this:** In devtools, change the transform-origin on the hero text container and watch how the zoom changes.
**Go deeper:** https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin

## Verify
1. bun run dev → scroll through full hero on localhost:5173
2. Metro network draws → zooms to orange → orange shrinks to dot → hero text reveals
3. Resize browser during animation — zoom stays centered on dot
4. Test mobile viewport — layout stacks, zoom fills screen
5. Enable prefers-reduced-motion — hero text shows statically
6. bun run test — all tests pass
7. bun run check — 0 errors
