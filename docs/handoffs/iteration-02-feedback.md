# Iteration 2 Feedback — Slice 06d

**From:** Yesid
**Date:** 2026-04-03
**Status:** Not yet addressed

## Quick Fixes (Layout/Positioning)

1. **Rail scope:** Nav and footer should NOT overlay the track. Track exists only on the main body between hero and CTA.

2. **Train orientation:** Train needs to be viewed from TOP (bird's eye), not side view. Must sit ON TOP of the rail, not under it. Must also be visible on the hero section.

3. **Double station titles:** Each station has two titles (the StationDivider label AND the section's own header). Remove one — either the divider label or the section header.

4. **ThreeJS box contained:** The 3D scene and its background art should be in a rounded-corner box, not taking up half the hero. Think of it as a card/window into the metro scene.

5. **Hero dark side transparent:** The dark left portion of the hero needs a transparent background so the fixed gradient behind shows through.

6. **Mobile hero:** On mobile, the ThreeJS box and background should stack below the text content as a separate section, not hidden.

## Architecture Work (Bigger Items)

7. **All text from data layer:** Every string on the site must come from the data layer (LocalizedString) for i18n support. This includes:
   - Station labels ("STOP 00 — DEPARTURE")
   - Hero headline ("DATA INFRA. BUILT RIGHT.")
   - Hero subtitle, CTA text, button labels
   - About bento content (name, title, bio, interests)
   - StationDivider labels
   - Footer text

8. **ThreeJS still not rendering:** Canvas element exists (`<canvas data-engine="three.js r183">`) but shows nothing. Likely the Draco decoder path issue — `useDraco: true` without a decoder URL. Need to either:
   - Provide Draco decoder files in `/static/draco/`
   - Or re-export the GLB without Draco compression

9. **Full-screen hamburger menu:** Make the mobile nav menu fullscreen with fun interactions — lights, black/yellow strips, metro station feel. This is a new feature.

10. **Full compartmentalization:** The entire page must be data-driven. Adding a new service, project, blog post, or section should:
    - Automatically compute new stop numbers
    - Extend the rail with new nodes
    - Add station dividers
    - Never require manual stop numbering
    - Section order could be configurable

## Priority Order

1. Fix #8 (ThreeJS) — core visual broken
2. Fix #3 (double titles) — quick
3. Fix #1 (rail scope) — quick
4. Fix #2 (train orientation) — moderate
5. Fix #4, #5, #6 (hero layout) — moderate
6. Implement #10 (compartmentalization) — architecture
7. Implement #7 (all text from data) — architecture
8. Implement #9 (hamburger menu) — new feature
