# Slice 06b — Home Page Redesign: Station Signs + Right Rail + Scroll Lotties

**Status:** ready
**Priority:** 1
**Estimated effort:** 2-3 sessions
**Depends on:** 06 (complete)

## Objective

Redesign the home page to replace the broken Threlte 3D background with a CSS gradient, move the train rail to the right edge, restyle service sections as station-sign cards with 400x400 scroll-linked Lotties, and add interactive polish (card tilt, train velocity glow, indicator lights, easter egg).

## Why This Exists

Slice 06 shipped a working home page, but the visual result has problems: the Threlte 3D curves don't read as rails, the service cards are tiny and scattered in empty space, and the train isn't visible. This slice fixes the visual design while keeping the data-driven architecture, GSAP scroll wiring, and SVG train intact. It's a revision, not a rebuild.

## Context for Claude Code

You are revising `src/routes/+page.svelte` and related components. The data layer, motion actions (`use:boop`, `use:magnetic`, `use:reveal`, `use:ripple`), GSAP utils, and SVG train component are already built and tested. You are changing the LAYOUT and VISUAL DESIGN of the home page, not the data flow or motion infrastructure.

**Read before starting:**
- `docs/handoffs/handoff-slice-06.md` (what was built)
- `docs/reference/MOTION.md` (motion principles, especially sections 2, 4, 5)
- `docs/reference/ARCHITECTURE.md` (file structure)
- `src/lib/data/services.ts` (the services array that drives everything)

## Acceptance Criteria

### Layout
- [ ] Threlte 3D scene removed from the home page (no `HeroScene` import, no Three.js on the home page)
- [ ] Background is a dark CSS gradient: `#141414` base with a subtle radial glow that shifts warmer (toward `#E07800` at low opacity) as scroll progresses
- [ ] Vertical SVG rail on the RIGHT side of the page (approximately 24px from the right edge)
- [ ] Rail has crossties: small horizontal dashes across the vertical line, evenly spaced, styled as a repeating pattern
- [ ] Station node dots on the rail, one per service, positioned at each station card's vertical midpoint
- [ ] Station nodes glow orange when their station is active (in viewport center)
- [ ] Dashed connector line from each rail node to its station card
- [ ] SVG train on the right rail, oriented NOSE-DOWN (top-down view, pointing in scroll direction), moving downward via GSAP MotionPathPlugin as the user scrolls
- [ ] Station cards are full-width (minus rail gutter ~56px on right), not split or alternating
- [ ] Mobile fallback (<768px): no rail, no train, station cards stack normally, Lotties still work

### Station Sign Cards
- [ ] Each station card is styled as a transit station sign:
  - Header bar: dark background (`#1e1e1e`), 2px orange (`#E07800`) bottom border
  - Station number in mono font (01, 02, 03, 04), orange color
  - Service title in the header, white
  - Indicator light: small circle (10px) in the upper-right corner of the header. Default state: dark/off (`#333`). Active state: orange with soft glow (`box-shadow`). Transitions on/off when the station enters/exits the viewport center zone
  - Card body: slightly lighter dark background (`#1a1a1a`), rounded corners, 1px border `#2a2a2a`
- [ ] Station number is derived from the service's index in the array (index + 1), zero-padded to 2 digits. NOT hardcoded
- [ ] All station cards render from `services` array via `{#each}`. Adding a service = one more card, zero layout changes

### Lotties (400x400, scroll-linked)
- [ ] Each station card contains a 400x400px Lottie animation, centered in the card body, above the description text
- [ ] On mobile, Lotties scale down proportionally (max-width: 100%, aspect-ratio: 1/1)
- [ ] Lotties are SCROLL-LINKED, not autoplay:
  - Each station section has a GSAP ScrollTrigger that maps scroll progress through that section (0 to 1) to Lottie frame position
  - Use `lottie.goToAndStop(frame, true)` where `frame = progress * totalFrames`
  - Scrolling down plays the animation forward. Scrolling back up reverses it
  - The `LottiePlayer.svelte` component needs a new prop (e.g. `scrub: boolean` and a `progress` prop) or a new wrapper component. Decide the cleanest approach based on the existing `LottiePlayer` API
- [ ] Lottie files are already in `static/lottie/` (moved in slice 06). Filenames: `station-sql.json`, `station-pipeline.json`, `station-analytics.json`, `station-performance.json`
- [ ] Respect `prefers-reduced-motion`: if reduced motion, show Lottie at frame 0 (static), no scrubbing

### Train Behavior
- [ ] Train SVG (`src/lib/motion/svg/Train.svelte`) is reused but its container is rotated/oriented so the nose points DOWNWARD
- [ ] Train path is a vertical line (with slight horizontal wobble at station positions) running along the right rail
- [ ] Train position is scroll-linked via GSAP MotionPathPlugin (reuse `TrainJourney.svelte` pattern but with a vertical path)
- [ ] `train-path.ts` updated to generate a VERTICAL path instead of horizontal
- [ ] Train velocity glow: when scroll speed is high, the train's nose glow intensifies (brighter orange). When scroll stops, it dims back to idle. Implement via a CSS custom property (e.g. `--train-glow`) updated in the ScrollTrigger `onUpdate` callback based on scroll velocity

### Interactive Polish
- [ ] Card tilt on hover (desktop only): station cards tilt subtly (max 2-3 degrees) following cursor position. Implement as a new Svelte action `use:tilt` in `src/lib/motion/actions/tilt.ts`. Uses CSS `perspective` + `rotateX`/`rotateY` transforms. Resets smoothly on mouseleave. Disabled on mobile and `prefers-reduced-motion`
- [ ] Project tags inside station cards use `use:boop` (already built)
- [ ] CTA buttons ("View work", "Get in touch") use `use:magnetic` (already built)
- [ ] Station cards use `use:reveal` for scroll entrance (already built)
- [ ] Train click easter egg: clicking the train SVG triggers a quick bounce animation (translateY spring) and an orange ripple emanating from the train. No sound. Just visual feedback. Use existing `use:ripple` action on the train container

### Existing Features That Must Still Work
- [ ] Hero section: "yesid." wordmark, "The infrastructure is ready.", tagline, scroll prompt (ScrollPrompt.svelte)
- [ ] CTA section: "Let's build something that moves." with View work and Get in touch links
- [ ] ScrollRail sidebar dots still activate on scroll (this is independent of the in-page rail)
- [ ] Nav and Footer render on all pages
- [ ] Mobile fallback: no train, no rail, simplified layout, Lotties still visible (static or autoplay, not scrubbed)
- [ ] `prefers-reduced-motion` respected everywhere

### Tests
- [ ] All existing tests still pass (207 baseline)
- [ ] New tests for: `use:tilt` action (applies/removes transform, respects reduced motion)
- [ ] New/updated tests for: `ServiceStation.svelte` (renders station sign layout with number, title, indicator light, Lottie zone)
- [ ] New/updated tests for: scroll-linked Lottie behavior (progress prop maps to frame)
- [ ] `bun run check` passes with 0 errors
- [ ] `tree.txt` updated
- [ ] Dev log written
- [ ] Handoff report written

## Technical Spec

### Files to Modify
- `src/routes/+page.svelte` — Rewrite home page layout. Remove Threlte dynamic import. Add CSS gradient background. New layout: hero + journey container (rail + train + station cards) + CTA. Wire GSAP ScrollTrigger per-station for Lottie scrubbing
- `src/lib/components/ServiceStation.svelte` — Restyle as station sign card. Add station number prop (derived from index). Add indicator light element. Accept Lottie progress prop. Render 400x400 Lottie with scroll-linked frame control
- `src/lib/motion/svg/train-path.ts` — Change path generation from horizontal to vertical. Path runs top-to-bottom with slight horizontal wobbles at station positions
- `src/lib/motion/svg/TrainJourney.svelte` — Update to vertical orientation. Train container rotated so nose points down. Path follows right-edge rail
- `src/lib/motion/components/LottiePlayer.svelte` — Add scroll-scrub capability: new `scrub` boolean prop and `progress` number prop (0-1). When `scrub` is true, use `goToAndStop(progress * totalFrames, true)` instead of autoplay. Existing autoplay behavior unchanged when `scrub` is false

### Files to Create
- `src/lib/motion/actions/tilt.ts` — New Svelte action for card tilt on hover. Maps cursor position relative to element center to `rotateX`/`rotateY` via CSS transform with `perspective(800px)`. Max tilt: 3 degrees. Smooth reset on mouseleave (CSS transition). Respects `prefers-reduced-motion`. Follows the standard action pattern from MOTION.md section 13
- `src/lib/motion/actions/tilt.test.ts` — Tests for the tilt action

### Files to NOT Delete
- `src/lib/motion/three/` — Keep all Threlte files in the repo. They are not imported on the home page anymore, so they add zero bundle cost (tree-shaking). They may be reused later. Do NOT delete them
- `src/lib/motion/svg/Train.svelte` — Reused, not replaced
- `src/lib/motion/svg/Train.test.ts` — Must still pass

### Libraries
- No new packages needed. Everything uses existing deps: `gsap`, `lottie-web`, `svelte`
- Three.js/Threlte packages stay installed (not uninstalled) but are no longer imported on the home page

### Data-Driven Reminders
- Station count is ALWAYS `services.length`. No hardcoded `4` anywhere
- Station numbers are `index + 1`, zero-padded: `String(index + 1).padStart(2, '0')`
- Rail node positions, train path waypoints, and Lottie file references all derive from the services array
- The `tilt` action must be added to the barrel export in `src/lib/motion/actions/index.ts`

## Out of Scope

- Custom SVG train redesign (still using the existing `Train.svelte`)
- Threlte file deletion (files stay, just unused)
- Three.js/Threlte package removal from `package.json`
- About page, Work pages, Contact page (slices 07-08)
- Custom Lottie animations (marketplace ones are fine for v1)
- Light theme
- i18n locale switching
- SEO meta tags (slice 09)
- Blog, case studies, or any new page routes
- PathParticles, SubtleGrid, or any new Threlte components
- Sound effects on the train easter egg

## Learn

### Scroll-Linked Lottie Playback
**What it is:** Instead of playing a Lottie animation on a timer, you tie its frame position to scroll progress. The user's scroll becomes the playback head.
**Why it matters:** Think of it like a seek bar on a video player, but the seek bar is your scroll position. This is similar to how a SQL cursor moves through a result set one row at a time. You control the position, not the animation.
**Try this:** After the slice ships, open the site and slowly scroll through a station section. Watch the Lottie animation advance frame by frame. Now scroll back up. It reverses. Try scrolling fast vs slow.
**Go deeper:** https://gsap.com/docs/v3/Plugins/ScrollTrigger/

### CSS Perspective and 3D Transforms
**What it is:** `perspective` on a parent element creates a 3D space. `rotateX`/`rotateY` on a child tilts it within that space. Combined with cursor tracking, it creates the illusion that you're physically tilting a card.
**Why it matters:** This is the same math as calculating distance between two points, which you already understand from SQL spatial queries (`ST_Distance`). The cursor position relative to the element center gives you X and Y offsets, which map to rotation angles.
**Try this:** After the slice ships, hover over a station card and move your cursor slowly from corner to corner. Watch the card tilt to follow.
**Go deeper:** https://developer.mozilla.org/en-US/docs/Web/CSS/perspective

### Scroll Velocity Detection
**What it is:** GSAP ScrollTrigger's `onUpdate` callback receives a `self` parameter. `self.getVelocity()` returns the current scroll speed in pixels per second. You can normalize this to a 0-1 range and use it to drive visual intensity.
**Why it matters:** It's like monitoring query throughput. Queries per second on your database maps to scroll pixels per second on the page. High throughput = high intensity visual feedback.
**Try this:** After the slice ships, scroll the page fast and watch the train's nose glow brighten. Stop scrolling and watch it dim.
**Go deeper:** https://gsap.com/docs/v3/Plugins/ScrollTrigger/getVelocity()

## Verify

1. `bun run test` — all tests pass (baseline 207 + new tilt tests + updated station tests)
2. `bun run check` — 0 errors
3. `bun run dev` → `http://localhost:5173/`
4. Desktop: dark gradient background, vertical rail on right with crossties, train facing down, station sign cards with indicator lights
5. Scroll: train moves down the rail, station nodes and indicator lights activate, Lotties scrub forward/backward with scroll, rail fill extends
6. Hover station cards: subtle tilt follows cursor
7. Hover project tags: boop animation fires
8. Hover CTA buttons: magnetic pull toward cursor
9. Click the train: bounce + orange ripple
10. Scroll fast: train nose glow intensifies. Stop: it dims
11. Resize to mobile (<768px): no rail, no train, cards stack normally, Lotties visible (static or autoplay)
12. Enable `prefers-reduced-motion`: no animations, all content visible, Lotties at frame 0
13. Navigate away and back: animations reinitialize cleanly, no stale state
14. Nav, Footer, ScrollRail sidebar all still work
