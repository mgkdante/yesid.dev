# Slice 06c — Bug Fixes: Lights, Lotties, Train, Tilt

**Status:** ready
**Priority:** 1
**Estimated effort:** 1 session
**Depends on:** 06b (complete)

## Objective

Fix four bugs from slice 06b: indicator lights don't turn off when scrolling to the next station, Lottie animations are not syncing to scroll, the train SVG is not visible, and the card tilt is too sensitive.

## Bug 1: Indicator Lights Stay On

**Current behavior:** When scrolling down from station 01 to station 02, station 01's indicator light stays on. Multiple lights can be on simultaneously.

**Expected behavior:** Only ONE station light is on at a time. When the user scrolls to station 02, station 01's light turns off and station 02's light turns on. When no station is in the active zone, all lights are off. Scrolling back up to station 01 turns its light back on and turns station 02's off.

**Root cause:** Each `ServiceStation` independently uses its own `IntersectionObserver` to determine if it's active. Since adjacent stations can both be in the viewport simultaneously, multiple observers fire `isIntersecting = true` at the same time. There is no "only one active" coordination.

**Fix approach:** Move the active-station calculation to `+page.svelte` (the parent). Use a SINGLE mechanism to determine which station index is active based on scroll position. Options:
- Use the existing GSAP ScrollTrigger progress value to compute the active index: `activeIndex = Math.round(scrollProgress * (services.length - 1))`
- Or use a single IntersectionObserver on all station elements and pick the one closest to viewport center

Pass `active={index === activeIndex}` as a prop to each `ServiceStation`. The station component should NOT run its own IntersectionObserver for the light. It receives `active` as a prop and renders the light state accordingly.

The rail station nodes in `+page.svelte` should also use this same `activeIndex` to determine which node glows.

**Acceptance criteria:**
- [ ] Only one indicator light is on at a time
- [ ] Only one rail station node glows at a time
- [ ] Light transitions smoothly (CSS transition on the light element, already styled)
- [ ] Active station updates as scroll progresses through each section

## Bug 2: Lotties Not Synced to Scroll

**Current behavior:** Lottie animations are either static (frame 0) or playing on autoplay. They do NOT respond to scroll position.

**Expected behavior:** Each station's Lottie animation frame position tracks scroll progress through that station's section. Scrolling down plays it forward. Scrolling back up reverses it. The animation is a scrubber, not a player.

**Likely root causes (check each):**

1. **ScrollTrigger not created or not firing:** The per-station ScrollTrigger in `ServiceStation.svelte` may not be initialized correctly. Verify in the browser console that ScrollTrigger instances exist (GSAP registers them globally). Check that the trigger element reference is valid (not null at mount time).

2. **Progress value not updating reactively:** If `lottieProgress` is a `$state` variable updated in a ScrollTrigger callback, verify that the callback actually fires. Add a `console.log` in the `onUpdate` callback temporarily to confirm. If using `$state`, Svelte should react to updates. If using a regular `let`, it won't trigger Svelte reactivity.

3. **LottiePlayer not reacting to progress prop changes:** The `scrub` and `progress` props were added to `LottiePlayer.svelte`. Verify that when `scrub=true`, the component watches for `progress` changes and calls `animation.goToAndStop(Math.round(progress * totalFrames), true)`. This needs to be in a `$effect` block (Svelte 5 runes) that depends on the `progress` prop. If it's in `onMount` only, it runs once and never updates.

4. **totalFrames not available:** `lottie.loadAnimation()` is async. `animation.totalFrames` may be 0 until the `DOMLoaded` event fires. The `goToAndStop` call must happen AFTER the animation is loaded. Use the `DOMLoaded` callback on the animation instance to know when `totalFrames` is valid.

5. **Lottie autoplay overriding scrub:** If the Lottie is initialized with `autoplay: true` even when `scrub=true`, it will play on its own timeline regardless of `goToAndStop` calls. When `scrub=true`, the lottie must be initialized with `autoplay: false`.

**Fix approach:** Debug systematically starting from #1. The correct implementation chain is:

```
ScrollTrigger onUpdate(self) →
  lottieProgress = self.progress →
    $effect reacts to lottieProgress →
      animation.goToAndStop(Math.round(lottieProgress * animation.totalFrames), true)
```

Every link in this chain must work. If any link is broken, the Lotties appear static.

**Acceptance criteria:**
- [ ] Each Lottie advances frame-by-frame as the user scrolls through its station section
- [ ] Scrolling backward reverses the Lottie (goes to earlier frames)
- [ ] Lottie is at frame 0 when station section has not been scrolled to
- [ ] Lottie is at the last frame when station section has been fully scrolled past
- [ ] Reduced motion: Lottie stays at frame 0, no scrubbing

## Bug 3: Train Not Visible

**Current behavior:** The train SVG is nowhere on the page. It does not appear at any scroll position.

**Likely root causes (check each):**

1. **Z-index / stacking context:** The train layer (`TrainJourney.svelte`) may be behind the content layer or behind the gradient background. The train container needs a z-index higher than the background but appropriate relative to the content. Check that the train's fixed-position container has `z-index` set and is not clipped by a parent with `overflow: hidden`.

2. **Position off-screen:** The vertical path generated by `train-path.ts` may place the train at X/Y coordinates outside the viewport. The path should run at approximately `right: 24px` from the viewport edge (aligned with the rail). Open browser DevTools, find the train element, and check its computed `transform` values.

3. **Container dimensions:** The train's fixed-position container may have `width: 0` or `height: 0`. A fixed container with no explicit dimensions and no content flow can collapse.

4. **CSS rotate breaking layout:** The inner wrapper has `rotate(90deg)` to orient the train nose-down. If the rotation center is wrong or the rotated element overflows a clipped container, the train disappears. Check `transform-origin`.

5. **GSAP MotionPathPlugin not loaded:** If `MotionPathPlugin` is not registered, the timeline silently fails and the train stays at its initial position (which might be off-screen at the path start). Verify that `gsap.registerPlugin(MotionPathPlugin)` is called before the timeline is created.

6. **Path string invalid:** The vertical path from `train-path.ts` might generate an SVG path string that GSAP can't parse. Open DevTools, find the train element, and check if GSAP has applied any transforms to it.

**Fix approach:** Open the site in the browser. Use DevTools to search for the train element (it has `data-testid` or a recognizable class). Check if it exists in the DOM, what its computed styles are, and where it's positioned. Then fix the specific issue.

**Acceptance criteria:**
- [ ] Train is visible on desktop, positioned on the right rail
- [ ] Train nose points downward (direction of scroll)
- [ ] Train moves from top to bottom as the user scrolls (0% scroll = top, 100% = bottom)
- [ ] Train is not visible on mobile (<768px)
- [ ] Clicking the train triggers the bounce easter egg

## Bug 4: Card Tilt Too Sensitive

**Current behavior:** The `use:tilt` action reacts to every small cursor movement, making the cards feel jittery and distracting. The tilt angle is too aggressive.

**Expected behavior:** The tilt should feel subtle and weighty, like tilting a thick metal sign. The card should only tilt noticeably when the cursor is near the edges, not from small movements near the center. Max tilt angle should be 1.5 degrees (not 3). The response should feel slightly dampened, not instant.

**Fix approach in `src/lib/motion/actions/tilt.ts`:**
- Reduce max rotation from 3 degrees to 1.5 degrees
- Add a dead zone: ignore cursor movement within the center 30% of the card (both X and Y). Only start tilting when the cursor passes that threshold
- Add CSS `transition: transform 0.3s ease-out` so the tilt eases into position instead of snapping. This makes it feel heavy and smooth rather than twitchy
- Keep the smooth reset on mouseleave (already implemented)

**Acceptance criteria:**
- [ ] Max tilt angle is 1.5 degrees (not 3)
- [ ] Cursor in the center ~30% of the card produces zero tilt
- [ ] Tilt transitions smoothly (not instant) via CSS transition
- [ ] Mouseleave resets smoothly (already works)
- [ ] Still disabled on mobile and reduced-motion

## Out of Scope

- Any layout changes beyond fixing these four bugs
- New features or interactions
- Mobile layout changes
- Test additions (unless fixing a test that's asserting wrong behavior)

## Iteration Protocol

**This is mandatory. Do NOT write the handoff report until Yesid confirms all issues are resolved.**

When you believe all four bugs are fixed:

1. Run `bun run test` and `bun run check`. If either fails, fix before proceeding.
2. Make sure `bun run dev` is running on localhost.
3. STOP coding. Ask Yesid to test the following on localhost:
   - Scroll through all four stations: do Lotties animate with scroll?
   - Scroll from station 01 to 02: does station 01's light turn off?
   - Is the train visible on the right rail? Does it move on scroll?
   - Hover a station card: is the tilt subtle and smooth?
   - Scroll fast: does the train glow brighten?
   - Click the train: does it bounce?
4. Wait for Yesid's feedback. He will either:
   - **Approve:** Say something like "looks good", "ship it", "approved". Only then write the handoff report.
   - **Report issues:** Describe what's still broken or what needs adjustment. Fix each issue, then go back to step 1.
5. Each round of feedback is an **iteration**. Track them.

**There is no limit on iterations.** Keep going until Yesid approves. Do not get impatient or skip the check-in. The whole point is that visual/interactive bugs can only be caught by a human looking at a screen.

## Handoff Report Additions

When writing `docs/handoffs/handoff-slice-06c.md`, include a new section:

```markdown
## Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 | [feedback from first test] | [what you changed] | [files] |
| 2 | [feedback from second test] | [what you changed] | [files] |
| ... | ... | ... | ... |
| Final | Approved | — | — |
```

This log is valuable. It shows what kinds of bugs survive automated tests and need human eyes. Over time it reveals patterns that improve future specs.

## Verify

Before asking Yesid to test (step 3 above), confirm these yourself:

1. `bun run test` — 219 tests still pass (or more if you added any)
2. `bun run check` — 0 errors
3. `bun run dev` runs without console errors
4. Mobile (<768px): no train, no rail, Lotties visible (static or autoplay)
