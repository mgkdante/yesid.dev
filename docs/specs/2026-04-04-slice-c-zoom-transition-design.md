# Slice C — Zoom Transition Design Spec

**Date:** 2026-04-04
**Status:** approved
**Depends on:** Slice A (SVG metro network hero)
**Deferred:** Slice B (GSAP text effects) — after C

## Problem

Slice A ends with the screen fully orange (Berri-UQAM node zoomed to fill viewport). The page currently just unpins and the metro journey sections scroll in. There's no introduction — no hero text, no brand statement, no CTAs. The visitor sees a cinematic network animation and then... stations. Slice C bridges that gap.

## Solution

The fully orange screen seamlessly transitions into the hero text section. The orange shrinks to reveal it was the "." dot in "INFRA." — a microscope pull-back that reveals the brand statement. One continuous pinned scroll, no seam.

## Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Dot placement | After "INFRA" (line 2) | "Data Infra." reads as a complete phrase — the brand positioning |
| Transition style | Zoom out together | Microscope pull-back: whole container scales down, text appears around the dot |
| Hero layout | Split — headline left, SQL decoration right | Shows personality + technical identity |
| Scroll behavior | Extend existing pin (800% → ~1200%) | Seamless, no visual pop between pins |
| Technical approach | Scale-down container | The "." IS the real element. Same scale math as zoom-in, inverted |

## Extended Timeline

The existing HeroBanner ScrollTrigger pin extends from 800% to ~1200% scroll distance. The existing Slice A phases are remapped to the first ~67% of the new timeline. Slice C occupies the remaining ~33%.

```
0%────────55%───67%──72%──────────92%──100%
│  SLICE A:      │ZOOM│XFADE│ SLICE C:    │HOLD│
│  Metro Network │ IN │     │ ZOOM OUT    │    │
```

| Scroll % | Phase | What Happens |
|-----------|-------|-------------|
| 0-55% | Slice A: Metro Network | Dot pulse, lines draw, stations appear, labels fade in |
| 55-67% | Slice A: Zoom In | SVG zooms into Berri-UQAM → screen fills orange |
| 67-72% | Cross-fade | SVG wrapper opacity → 0, hero text container opacity → 1 (container is scaled up so dot fills screen — visually identical) |
| 72-92% | Slice C: Zoom Out | Container scales down from massive to 1.0. Text elements stagger in during the scale. |
| 92-100% | Hold | Full hero visible. User reads. Then unpin. |

## Markup Structure

Two layers inside the existing pinContainer, stacked with absolute positioning:

```
pinContainer (existing)
├── svgWrapper (existing) — Metro network + zoom
├── heroTextContainer (NEW) — Hero text layout, initially opacity:0
│   ├── heroLeft
│   │   ├── badge: "AVAILABLE FOR HIRE"
│   │   ├── headline
│   │   │   ├── line1: "DATA"
│   │   │   ├── line2: "INFRA" + dot (span.hero-dot, color #E07800)
│   │   │   └── line3: "BUILT RIGHT."
│   │   ├── subtitle: freelance description
│   │   └── ctas: "View work →" + "Get in touch"
│   └── heroRight
│       └── sqlDecoration: SELECT expertise FROM yesid...
└── scrollPrompt (existing) — "SCROLL DOWN"
```

## Transform Origin

The `heroTextContainer` uses `transform-origin` set to the pixel position of the `.hero-dot` element — same `getBoundingClientRect()` pattern used for the SVG zoom-in. Recalculated on resize.

At massive scale: only the dot is visible (fills viewport with orange).
At scale 1.0: full hero layout visible.

## Scale Calculation

Same formula as zoom-in, inverted usage:
```
initialScale = ceil((screenDiagonal / dotSize) * 2)
```
The container starts at `initialScale` and animates to `1`.

## Element Stagger Order

During the zoom-out (72-92%), elements fade in sequentially:

1. **The "." dot** — already visible as orange (opacity: 1 throughout)
2. **DATA / INFRA** — headline words, first to contextualize the dot
3. **BUILT RIGHT.** — completes the statement
4. **Badge + subtitle + CTAs** — supporting content
5. **SQL decoration** — right side, last, ambient detail

Each element animates `opacity: 0 → 1` with slight offset timing (stagger ~0.02-0.03 in timeline units).

## Hero Layout (Final State)

### Desktop (≥768px)
Split layout with vertical divider:
- **Left (flex:1):** Badge → Headline (DATA / INFRA. / BUILT RIGHT.) → Subtitle → CTAs
- **Right (flex:0.7):** SQL decoration in monospace, separated by left border

### Mobile (<768px)
Stacked vertically:
- Full-width headline
- Subtitle + CTAs below
- SQL decoration below or hidden (TBD during implementation based on feel)

## Content Source

All text from `src/lib/data/content.ts` — already defined:
- `heroContent.badge`
- `heroContent.headline.line1/line2/line3`
- `heroContent.subtitle`
- `heroContent.ctaWork` / `heroContent.ctaContact`
- `heroContent.sqlDecoration.line1/line2`

No new content strings needed.

## Responsive Resize

On window resize:
1. Recalculate `transform-origin` for heroTextContainer (dot position)
2. Recalculate initial scale (screen/dot ratio)
3. Update tween values + invalidate
4. `ScrollTrigger.refresh()`

Same pattern as existing resize handler in HeroBanner.

## Reduced Motion

- No zoom animation — show hero text layout statically at full opacity
- SVG network at 20% opacity (existing behavior)
- All text elements visible immediately
- No scroll pin (or minimal pin for reading time)

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/components/HeroBanner.svelte` | Add hero text markup, extend timeline, new phases |
| `src/lib/data/content.ts` | No changes needed (content already exists) |
| `src/routes/+page.svelte` | No changes expected (HeroBanner is self-contained) |
| `src/routes/home.test.ts` | Add tests for hero text elements |

## Out of Scope

- GSAP SplitText effects on the headline (that's Slice B, deferred)
- Parallax or 3D effects on the hero text
- Light theme
- i18n (content is ready, locale switching comes later)
- Changes to the metro network SVG animation (Slice A phases unchanged)
- Changes to the rest of the home page (services, featured work, etc.)

## Acceptance Criteria

- [ ] Orange screen from Slice A seamlessly becomes the "." in "INFRA."
- [ ] Zoom-out reveals split hero layout (headline left, SQL right)
- [ ] One continuous pin — no visual pop or seam between phases
- [ ] Transform-origin recalculates on resize (works on any screen size)
- [ ] All hero text content comes from `content.ts` (no hardcoded strings)
- [ ] Element stagger order: dot → DATA/INFRA → BUILT RIGHT. → badge/subtitle/CTAs → SQL
- [ ] Desktop: split layout with SQL decoration right
- [ ] Mobile: stacked layout
- [ ] Reduced motion: static hero text, no animation
- [ ] `bun run test` passes
- [ ] `bun run check` passes

## Verify

1. `bun run dev` → scroll through the full hero on localhost:5173
2. Metro network draws → zooms to orange → orange shrinks to dot → hero text reveals
3. Resize browser during animation — zoom stays centered on dot
4. Test on mobile viewport — layout stacks, zoom fills screen
5. Enable `prefers-reduced-motion` — hero text shows statically
6. `bun run test` — all tests pass
7. `bun run check` — 0 errors
