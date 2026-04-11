# Handoff: Slice C — Zoom Transition

## Summary
The fully orange screen from Slice A (Berri-UQAM zoomed in) seamlessly transitions into the hero text section. The orange shrinks to reveal it was the "." dot in "INFRA." — a microscope pull-back that reveals the brand statement with a split layout (headline left, SQL decoration right).

## What Was Built
- Extended GSAP timeline in `HeroBanner.svelte` with 4 new phases (cross-fade, zoom-out, text stagger, hold)
- Hero text markup: badge, headline (DATA/INFRA./BUILT RIGHT.), subtitle, CTAs, SQL decoration
- DOM baseline probe + Canvas `measureText` for precise dot glyph centering
- Transparent background transition during zoom-out

## Files Modified
- `src/lib/components/HeroBanner.svelte`: Hero text markup + 4 new animation phases + glyph measurement
- `src/routes/home.test.ts`: 6 new tests for hero text elements (badge, headline, dot, subtitle, CTAs, SQL)

## Files Created
- `docs/slices/slice-c-zoom-transition.md`: Slice spec
- `docs/specs/2026-04-04-slice-c-zoom-transition-design.md`: Design spec

## How It Works

### Extended Timeline (1200% scroll, timeline 0→1.5)
| Timeline | Phase | What Happens |
|----------|-------|-------------|
| 0→0.95 | Slice A | Metro network draws, zooms into Berri-UQAM → orange |
| 0.95→1.0 | Hold | Fully orange (buffer) |
| 1.0→1.05 | Cross-fade | SVG fades out, hero text container fades in (both orange, seamless) |
| 1.05→1.40 | Zoom out | Hero text container scales from massive to 1.0 |
| 1.10→1.32 | Text stagger | Elements fade in: headline → BUILT RIGHT → badge/CTAs → SQL |
| 1.10→1.30 | Background | pinContainer bg fades to transparent |
| 1.40→1.50 | Hold | Full hero visible, user reads, then unpin |

### Dot Glyph Centering
The "." character's visible glyph is much smaller than its layout box (which includes line-height). At 100x+ scale, even a few pixels of offset gets magnified to thousands of pixels. Solution:
1. **DOM probe**: Zero-height `inline-block` at `vertical-align:baseline` finds the exact baseline Y in the browser layout
2. **Canvas measureText**: `actualBoundingBoxAscent/Descent` gives the glyph's offset from baseline
3. **Combined**: Glyph center = baseline - ascent + glyphHeight/2

### Hero Text Layout
- **Desktop (≥768px)**: Split — headline left (flex:1), SQL decoration right (flex:0.7) with border divider
- **Mobile (<768px)**: Stacked — SQL decoration hidden (`hidden md:block`)

## Decisions Made
| Decision | Why | Alternative Considered |
|----------|-----|----------------------|
| Text "." character (not visual element) | Yesid wanted real typography for the dot | Inline-block circle (simpler math but doesn't look like a period) |
| DOM baseline probe for Y position | Only reliable cross-font way to find baseline in browser layout | Canvas font metrics estimation (fragile, font-dependent) |
| Extend timeline (not remap) | Adding phases after 1.0 preserves exact Slice A pacing | Remapping all phases to 0-0.67 (changes relative timing) |
| Background → transparent | Page gradient shows through after reveal | Keep dark bg (felt disconnected from rest of page) |
| Split layout with SQL decoration | Shows personality + technical identity | Centered (too generic), left-aligned only (missed SQL branding) |

## What Yesid Should Know

### GSAP Timeline Extension
Adding tweens after position 1.0 extends `totalDuration`. With `scrub: 1`, the scroll maps proportionally — existing phases keep their exact pacing. Like adding rows to a SQL result set: the existing data doesn't change.

### Transform-Origin at Scale
At 100x zoom, a 5px offset becomes 500px. That's why getBoundingClientRect center (which includes line-height padding) doesn't work for text characters — the glyph is at the baseline, not at the center of the line box. The DOM probe + Canvas approach solves this precisely.

## Iterations

| # | What Yesid Reported | What Was Fixed | Files Changed |
|---|---------------------|----------------|---------------|
| 1 | Dot not full-screen, positioned at bottom | Used dotRect.width for scale, offset Y to 0.82 | HeroBanner.svelte |
| 2 | Now at the top (overcompensated) | Replaced with DOM baseline probe + Canvas glyph metrics | HeroBanner.svelte |
| 3 | Also: remove hero background after zoom | Added pinContainer bg → transparent animation | HeroBanner.svelte |
| Final | Approved — works on mobile and desktop | — | — |

## What Comes Next
**Slice B — GSAP Text Effects** (deferred): SplitText effects on the headline, now that the hero text is in place.

Or continue with remaining slices: 06e (blog), 07 (work pages), 08 (about/contact).

## How to Verify
1. `bun run test` — 258 tests pass
2. `bun run check` — 0 errors
3. `bun run dev` → scroll through hero on localhost:5173
4. Metro network draws → zooms to orange → orange shrinks to dot → hero text reveals
5. Background becomes transparent during reveal
6. Resize browser during animation — dot stays centered
7. Mobile viewport — layout stacks, zoom fills screen
