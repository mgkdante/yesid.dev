# Handoff: Slice B — Animated Wordmark + Horizontal Scroll CTA

## Summary
Added personality and a clear call-to-action to yesid.dev with two major features: a nav wordmark that animates on hover (4 cycling GSAP effects), and a horizontal-scrolling SkillsJourney section with cinematic scroll-linked text animations for each keyword and a CTA button. The site now has a distinct, polished feel that communicates craft and technical skill.

## What Was Built

### Part 1: Nav Wordmark
- `src/lib/components/Nav.svelte`: SplitText-powered hover animations (bounce, wiggle, wave, spin) cycling on each hover. Orange dot pulses every time. Page load triggers bounce after 500ms. Mobile: click → animate → navigate.

### Part 2: Hero Welcome
- `src/lib/components/HeroBanner.svelte`: "NEXT STOP: SCROLL DOWN" typewriter effect with trailing `_` cursor that blinks forever. Berri-UQAM dot visible on load.

### Part 3: Horizontal Scroll CTA (SkillsJourney)
- `src/lib/components/SkillsJourney.svelte`: 5-panel horizontal scroll section (4 data + 1 CTA) with:
  - Data-driven panel system (panels in `content.ts`)
  - 7 unique per-keyword scroll-linked text animations
  - Interactive SVG skill icons with per-icon hover effects
  - "Let's build together →" CTA button with pulsing glow
  - Reduced motion: vertical stack, no animations
  - Orange metro line threading through all panels

### Keyword Animation Spec (Final)
| Keyword | Effect | Color |
|---------|--------|-------|
| foundation | Structural assembly — chars rise from below | #E07800 (orange) |
| data | Text scramble — random symbols resolve one by one | #E07800 (orange) |
| logic | Precise assembly — chars converge from center | #FFB627 (yellow) |
| pixels | Fragmented particles — tiny rotated fragments snap to type | #E07800 (orange) |
| Stations | Wave — chars ripple up then settle with color | #FFB627 (yellow) |
| understand | Disorder → comprehension — scattered chars resolve randomly | #E07800 (orange) |
| motion | 360° rotation + color change | #E07800 (orange) |
| unforgettable | Ghosted → permanent — two-phase opacity + blur resolve | #E07800 (orange) |
| stop | Train braking — horizontal momentum decelerates to lock | #FFB627 (yellow) |

## Files Created
- `src/lib/components/SkillsJourney.svelte` — main component (horizontal scroll + all animations)
- `src/lib/components/SkillsJourney.test.ts` — tests

## Files Modified
- `src/lib/components/Nav.svelte` — SplitText hover + load + click animation
- `src/lib/components/Nav.test.ts` — new tests
- `src/lib/components/HeroBanner.svelte` — typewriter + Berri dot on load
- `src/lib/motion/utils/gsap.ts` — register SplitText plugin
- `src/lib/motion/utils/gsap.test.ts` — SplitText tests
- `src/lib/data/content.ts` — skillsJourneyPanels + CTA + hero text data
- `src/lib/data/content.test.ts` — panel data tests
- `src/lib/data/types.ts` — JourneyPanel, JourneySkill types
- `src/lib/data/index.ts` — exports
- `src/routes/+page.svelte` — add SkillsJourney, remove train/rail
- `src/routes/+layout.svelte` — remove ScrollRail
- `src/app.css` — unhide native scrollbar

## How It Works

### Horizontal Scroll Architecture
1. Outer `<section>` height is set dynamically: `window.innerHeight + scrollDistance`
2. `pinContainer` is pinned via `ScrollTrigger.create({ pin: true })`
3. Inner `track` is translated left via `gsap.to(track, { x: -scrollDistance })`
4. All per-word animations use `containerAnimation: tween` to tie their progress to the horizontal scroll's progress
5. Each keyword uses `trigger: hw` (the word element itself) so animations fire when the specific word enters viewport — not when the paragraph does

### Key Pattern: `trigger: hw` vs `trigger: el`
With `containerAnimation`, the trigger element determines when the animation fires relative to horizontal scroll progress. Using the paragraph (`el`) as trigger means ALL word animations in a panel fire based on when the paragraph's left edge enters. This causes words at the end of the sentence (like "pixels") to animate off-screen. Using the actual word element (`hw`) as trigger fixes this — each word animates when IT enters the viewport.

### Data Scramble (custom pattern)
The "data" scramble uses `ScrollTrigger.create()` with `onUpdate` instead of a standard tween. This allows real-time character replacement tied to scroll position:
- `onUpdate`: cycles chars through random symbols, resolves them one by one as progress increases
- `onLeaveBack`: resets to scrambled state when scrolling back past the start
- `onLeave`: locks in final resolved state when scrolling past the end

## Decisions Made
| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| Pure `scrub: true` for all effects | `toggleActions` and `yoyo`/`repeat` desync from scroll position with `containerAnimation` | toggleActions, yoyo, repeat |
| `trigger: hw` per-word triggers | Paragraph-level triggers caused off-screen animations for end-of-line words | `trigger: el` (paragraph) |
| No animation on non-keyword text | User wanted static white text for uniform look + lighter performance | Fade-in + y-slide entrance |
| `filter: 'blur(Xpx)'` for initial states | Creates the dim/unfocused feel specified in design without opacity alone | Opacity only |
| `start: 'left 55%', end: 'left 15%'` baseline | Animations play when words are centered on screen, not while still entering from right | 80%→30% (too early) |
| "stop" completes by center (50%) | Ensures animation finishes on mobile where viewport is narrower | End at 42% (didn't finish on mobile) |
| Plain color for "motion" (not CSS gradient) | GSAP can't animate `backgroundImage`/`backgroundClip` — text disappeared | CSS gradient properties |

## What Yesid Should Know

### GSAP `containerAnimation`
This is the key pattern for animating elements inside a horizontally-scrolling pinned container. Instead of using raw scroll position, each inner ScrollTrigger uses `containerAnimation: tween` to calculate its trigger positions based on the horizontal tween's progress. Think of it as "scroll position within the horizontal scroll" rather than "scroll position on the page."

### SplitText Cleanup Order
SplitText instances must revert in reverse order (inner before outer). The outer SplitText wraps the paragraph text; inner SplitTexts wrap individual highlight words into chars. Reverting the outer first would restore HTML that invalidates inner SplitText references.

### Adding New Panels
To add a new panel to the journey: edit `skillsJourneyPanels` in `content.ts`, add a new `JourneyPanel` object with `highlightWords`, `highlightEffect`, and `skills`. The component renders panels data-driven — no template changes needed.

## What Comes Next
**Slice B+ (Geometric Shape Morphs)** — Add SVG shapes near keywords that morph via MorphSVGPlugin on scroll. Each keyword gets a starting geometric shape (circle, square, triangle, etc.) that morphs into a meaning-specific icon (bricks for "foundation", stacked lines for "data", octagon for "stop", etc.). See `memory/project_slice_b_shapes.md` for the full mapping.

## How to Verify
1. `bun run test` — 271/271 pass
2. `bun run check` — 0 errors
3. Open `http://localhost:5173/`
4. Hover "yesid." in nav — 4 cycling effects, dot pulses
5. Scroll down — typewriter plays "NEXT STOP: SCROLL DOWN"
6. Continue scrolling into SkillsJourney horizontal scroll:
   - Panel 1: "foundation" chars rise and assemble into orange
   - Panel 2: "data" scrambles, "logic" converges, "pixels" fragments snap
   - Panel 3: "Stations" waves, "understand" resolves from disorder
   - Panel 4: "motion" rotates, "unforgettable" ghosts into permanence
   - CTA: "stop" brakes to yellow, button glows
7. Scroll back — all effects reverse
8. Test on mobile — "stop" fully resolves, no broken states
9. White text is always static, never animated

## Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 | Animations play too early, "pixels" off-screen | `trigger: el` → `trigger: hw`; shifted start/end values | SkillsJourney.svelte |
| 2 | "stop" stuck/smeared, needs yellow | Reduced gsap.set extremity, added yellow, adjusted range | SkillsJourney.svelte |
| 3 | Remove white text animations | Removed non-highlight word tweens | SkillsJourney.svelte |
| 4 | "stop" doesn't finish on mobile | Changed end to 'left 50%' (center) | SkillsJourney.svelte |
| Final | Approved | — | — |
