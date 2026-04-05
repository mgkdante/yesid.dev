# Slice B+ — Geometric Shape Morphs for SkillsJourney

## Status: READY

## Goal
Add SVG shapes beside/above each keyword in the SkillsJourney horizontal scroll. Each shape starts as a generic geometric form (circle, square, triangle, hexagon) and morphs into a meaning-specific icon on scroll using GSAP MorphSVGPlugin. This adds visual richness and reinforces each keyword's meaning.

## Depends On
- Slice B (Animated Wordmark + Horizontal Scroll CTA) — complete
- Handoff at `docs/handoffs/handoff-slice-b.md`

## Reference SVGs
All target shapes are in `static/svg/` (Yesid-provided) as **visual references only**.
These use `<rect>` elements — do NOT use them directly. Create new SVGs using `<path>` elements
that match the visual layout of the references. MorphSVGPlugin requires `<path>` for morphing.

## Shape Mapping

| Keyword | Start Shape | Morph Target | SVG File | Position |
|---------|------------|--------------|----------|----------|
| foundation | circle | 3 bricks + base bar | foundation.svg | Above/beside "foundation" |
| data | square | 4 stacked horizontal lines | data.svg | Above/beside "data" |
| logic | triangle | Hierarchy tree (1-2-1 pattern) | logic.svg | Above/beside "logic" |
| pixels | hexagon | 2×2 grid of squares | pixels.svg | Above/beside "pixels" |
| Stations | circle | Station layout (bar+rect+pills) | train-station.svg | Above/beside "Stations" |
| understand | polygon | Convergence (split→merge) | understand.svg | Above/beside "understand" |
| motion | triangle | Dynamic bars + vertical bar | motion.svg | Above/beside "motion" |
| unforgettable | hexagon | 4 corner squares (1 bigger) | unforgettable.svg | Above/beside "unforgettable" |
| stop | circle | Octagon outline (4 bars) | stop-sign.svg | Above/beside "stop" |

## Acceptance Criteria

### Shapes
- [ ] Each keyword has an SVG shape element positioned near it
- [ ] Shapes start as simple geometric forms (circle, square, triangle, hexagon, polygon)
- [ ] Shapes morph into their target form on scroll (MorphSVGPlugin)
- [ ] Morph is scrubbed to scroll (containerAnimation + scrub: true)
- [ ] Morph triggers per-word (trigger: hw) matching the text animation timing
- [ ] Morph reverses on scroll back
- [ ] Shapes use keyword colors (orange #E07800 or yellow #FFB627 per colorMap)

### Technical
- [ ] SVG target paths converted from `<rect>` elements using `MorphSVGPlugin.convertToPath()`
- [ ] Start shapes defined as inline SVG paths in the component
- [ ] Shapes cleaned up on destroy (kill tweens, remove elements if dynamically created)
- [ ] Reduced motion: shapes shown in final (morphed) state, no animation
- [ ] `bun run test` passes
- [ ] `bun run check` passes (0 errors)

### Visual
- [ ] Shapes don't overlap or obscure keyword text
- [ ] Shapes feel like floating decorative elements, not UI
- [ ] Shape size is proportional to text (not too big, not too small)
- [ ] Shapes are semi-transparent or use subtle opacity so they don't dominate

## Key Technical Decisions
- MorphSVGPlugin (free) for SVG path morphing
- Create all shapes as `<path>` elements (NOT `<rect>`) — MorphSVGPlugin requires paths
- Reference SVGs in `static/svg/` are visual guides only — recreate as paths matching the layout
- Start shapes: simple geometric `<path>` strings (circle, square, triangle, hexagon, polygon)
- Target shapes: `<path>` elements drawn to match the reference SVG layouts
- Positioned via CSS (absolute within panel, relative to keyword)
- Same `containerAnimation` + `scrub` pattern as text animations

## SVG Implementation Notes

Each reference SVG has ~4 rounded rect elements forming a composed shape.
For MorphSVGPlugin, create equivalent `<path>` data:
- Start: single geometric `<path>` (e.g., circle: `M32,8 a24,24 0 1,1 0,48 a24,24 0 1,1 0,-48`)
- Target: `<path>` drawn to match the reference layout (bricks, stacked lines, grid, etc.)
- MorphSVGPlugin interpolates between any two paths regardless of point count

## Files to Create/Modify
- `src/lib/components/SkillsJourney.svelte` — add shape elements + morph animations
- Possibly: `src/lib/components/JourneyShape.svelte` — extracted shape component (if SkillsJourney gets too long)

## Design Spec
- Shape mapping: `memory/project_slice_b_shapes.md`
- Reference SVGs: `static/svg/*.svg`

## Notes
- Start by implementing one shape (e.g., "foundation") end-to-end, then replicate for others
- Test MorphSVGPlugin.convertToPath() with the rect-based SVGs first
- Consider performance: 9 shapes × 4 rects = 36 morph tweens. May need to batch or simplify.
