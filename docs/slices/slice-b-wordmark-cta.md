# Slice B — Animated Wordmark + Horizontal Scroll CTA

## Status: IN PROGRESS (Session 2 needed)

## Goal
Add personality and a clear CTA to the site with two features:
1. Nav "yesid." wordmark animates on hover (rotating effects like gsap.com logo)
2. Horizontal scroll CTA section after the hero — data-driven, SplitText effects, tech stack icons

## Depends On
- Slice A (SVG metro hero) — complete
- Slice C (zoom transition) — complete
- Backup branch: `backup/slice-a-c-complete`

## Acceptance Criteria

### Part 1: Nav Wordmark — DONE
- [x] Hovering "yesid." plays a different GSAP animation each time (4 effects cycling: bounce, wiggle, wave, spin)
- [x] The orange dot (`.`) pulses on every hover regardless of effect
- [x] Page load: bounce animation plays after 500ms
- [x] Mobile: click triggers animation (then navigates home)
- [x] Reduced motion: no animation
- [x] SplitText registered in gsap.ts, cleaned up on destroy

### Part 2: Hero Welcome — DONE
- [x] Replace "SCROLL DOWN" with "NEXT STOP: SCROLL DOWN"
- [x] Typewriter effect: chars appear one by one with trailing `_` cursor
- [x] Cursor blinks forever after typing completes
- [x] Berri-UQAM dot visible on page load
- [x] Text centered on screen (top-1/2 left-1/2)

### Part 3: Horizontal Scroll CTA (SkillsJourney) — PARTIAL
- [x] `SkillsJourney.svelte` placed after `<HeroBanner />` in +page.svelte
- [x] Independent GSAP ScrollTrigger (does NOT touch hero timeline)
- [x] Data-driven: panels in content.ts as typed array
- [x] 5 panels scroll horizontally (4 data + 1 merged CTA):
  1. "Every system starts at the foundation" — SQL icon
  2. "Routes that move data, logic, and pixels" — TypeScript + Python
  3. "Stations where users stop and understand" — SvelteKit + Power BI
  4. "The motion that makes the ride unforgettable" — GSAP + Docker
  5. "Your next stop?" + CTA button "Let's build together →"
- [x] Simple line-art SVG icons (white/orange, metro aesthetic)
- [x] Icons animate on hover (unique effect per icon)
- [x] CTA button links to /contact with pulsing glow
- [x] Reduced motion: panels stacked vertically
- [x] No background (transparent, page gradient shows through)
- [x] `bun run test` passes (271/271)
- [x] `bun run check` passes (0 errors)
- [x] Slices A+C hero animation unchanged

### Part 3b: Scroll-Linked Text Animations — NOT WORKING
- [ ] Panel 1: "foundation" starts grey, glows orange on scroll, REVERSES on scroll back
- [ ] Panel 2: "data" (orange), "logic" (yellow), "pixels" (orange) — char reveal + bounce that returns to y:0
- [ ] Panel 3: "Stations" (yellow) wave, "understand" (orange) dramatic pop with glow
- [ ] Panel 4: "motion" (gradient) rotates 360°, "unforgettable" (orange) pulses
- [ ] All animations reverse when scrolling back
- [ ] Scale-ups don't overlap adjacent text

**Root cause:** GSAP `containerAnimation` pattern with `scrub`/`toggleActions` doesn't reverse properly. Need to consult GSAP MCP for correct approach.

### Part 4: Geometric Shape Morphs — NOT STARTED
- [ ] SVG shapes float near keywords, morph via MorphSVGPlugin on scroll
- [ ] See `memory/project_slice_b_shapes.md` for exact shape→keyword mapping

### Part 5: Cleanup — NOT STARTED
- [x] Train journey removed from home page
- [x] Scroll rail removed from layout
- [x] Native scrollbar visible
- [ ] Mobile horizontal scroll timing (was too fast)
- [ ] Dev log update
- [ ] Handoff report (after Yesid approves)

## Tech Stack Displayed
SQL (PostgreSQL + SQL Server), TypeScript, Python, SvelteKit, GSAP, Power BI, Docker

## Key Technical Decisions
- SplitText for text effects (register in gsap.ts)
- Data-driven panel system (JourneyPanel + JourneySkill types)
- Horizontal scroll via pinned container + x-translate of inner track
- SVG icons inline in component (switch on skill.id)
- Independent ScrollTrigger — no coupling to hero
- `containerAnimation` pattern for per-panel animations (NEEDS FIX)

## Panel Animation Spec (LOCKED)
| Panel | Word Colors | Animation |
|-------|------------|-----------|
| 1 FOUNDATION | grey #999, "foundation" → orange | Pulse glow, reverse on scroll back |
| 2 ROUTES | white, "data" orange, "logic" yellow, "pixels" orange | Char reveal + bounce (y:-20→0) |
| 3 STATIONS | "Stations" yellow, "understand" orange | Wave + dramatic pop with glow |
| 4 MOTION | "motion" gradient, "unforgettable" orange | Rotation + pulse |
| 5 CTA | "Your next stop?" + glowing button | Char reveal + elastic button + massive glow |

## Files Created
- `src/lib/components/SkillsJourney.svelte`
- `src/lib/components/SkillsJourney.test.ts`

## Files Modified
- `src/lib/components/Nav.svelte` — SplitText hover + load + click animation
- `src/lib/components/Nav.test.ts` — new tests
- `src/lib/components/HeroBanner.svelte` — typewriter + Berri dot on load
- `src/lib/motion/utils/gsap.ts` — register SplitText
- `src/lib/motion/utils/gsap.test.ts` — SplitText tests
- `src/lib/data/content.ts` — skillsJourneyPanels + CTA + hero text
- `src/lib/data/content.test.ts` — panel data tests
- `src/lib/data/types.ts` — JourneyPanel, JourneySkill types
- `src/lib/data/index.ts` — exports
- `src/routes/+page.svelte` — add SkillsJourney, remove train/rail
- `src/routes/+layout.svelte` — remove ScrollRail
- `src/app.css` — unhide scrollbar
- `src/tests/setup.ts` — SplitText mock

## Design Spec
`docs/superpowers/specs/2026-04-04-slice-b-wordmark-cta-design.md`

## Next Session Instructions
1. Read `CLAUDE.md` → sees active slice status
2. Read memory `project_slice_b_status.md` → full details
3. Use GSAP MCP: `mcp__gsap-master__get_gsap_api_expert` with `containerAnimation` to learn correct pattern
4. Fix scroll-linked text animations per panel spec above
5. Then: geometric shape morphs (separate task)
6. Then: mobile scroll timing fix
7. Then: Yesid tests → iterate → handoff
