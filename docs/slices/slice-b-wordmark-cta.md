# Slice B — Animated Wordmark + Horizontal Scroll CTA

## Goal
Add personality and a clear CTA to the site with two features:
1. Nav "yesid." wordmark animates on hover (rotating effects like gsap.com logo)
2. Horizontal scroll CTA section after the hero — data-driven, SplitText effects, tech stack icons

## Depends On
- Slice A (SVG metro hero) — complete
- Slice C (zoom transition) — complete
- Backup branch: `backup/slice-a-c-complete`

## Acceptance Criteria

### Part 1: Nav Wordmark
- [ ] Hovering "yesid." plays a different GSAP animation each time (4 effects cycling: bounce, wiggle, wave, spin)
- [ ] The orange dot (`.`) pulses on every hover regardless of effect
- [ ] Mobile menu wordmark stays static (no hover on touch)
- [ ] Reduced motion: no animation
- [ ] SplitText registered in gsap.ts, cleaned up on destroy

### Part 2: Hero Welcome
- [ ] Replace "SCROLL DOWN" with "NEXT STOP: SCROLL DOWN"
- [ ] Updates `heroAnimContent` in content.ts (data-driven, not hardcoded)

### Part 3: Horizontal Scroll CTA (SkillsJourney)
- [ ] New `SkillsJourney.svelte` placed after `<HeroBanner />` in +page.svelte
- [ ] Completely independent GSAP timeline + ScrollTrigger (does NOT touch hero timeline)
- [ ] Data-driven: panels defined in content.ts as typed array — adding/removing a skill = editing data only
- [ ] 6 panels scroll horizontally (pinned, scrubbed):
  1. "Every system starts at the foundation." — SQL icon
  2. "Routes that move data, logic, and pixels." — TypeScript + Python
  3. "Stations where users stop and understand." — SvelteKit + Power BI
  4. "The motion that makes the ride unforgettable." — GSAP + Docker
  5. "Your next stop?" — metro dot pulses
  6. CTA button: "Let's build together →"
- [ ] SplitText effects on key words per panel (scale, gradient, wave, char-reveal)
- [ ] Simple line-art SVG icons (white/orange, metro aesthetic)
- [ ] Orange metro line threads horizontally across all panels
- [ ] Reduced motion: panels stacked vertically, no animation, all content visible
- [ ] CTA button links to /contact
- [ ] `bun run test` passes
- [ ] `bun run check` passes
- [ ] Slices A+C hero animation unchanged (zero modifications to HeroBanner.svelte)

## Tech Stack Displayed
SQL (PostgreSQL + SQL Server), TypeScript, Python, SvelteKit, GSAP, Power BI, Docker

## Key Technical Decisions
- SplitText for text effects (register in gsap.ts)
- Data-driven panel system (JourneyPanel + JourneySkill types)
- Horizontal scroll via pinned container + x-translate of inner track
- SVG icons inline in component (switch on skill.id)
- Independent ScrollTrigger — no coupling to hero

## Files to Create
- `src/lib/components/SkillsJourney.svelte`
- `src/lib/components/SkillsJourney.test.ts`

## Files to Modify
- `src/lib/components/Nav.svelte` — SplitText hover
- `src/lib/components/Nav.test.ts`
- `src/lib/motion/utils/gsap.ts` — register SplitText
- `src/lib/motion/utils/gsap.test.ts`
- `src/lib/data/content.ts` — skillsJourneyContent + welcome text
- `src/lib/data/types.ts` — JourneyPanel, JourneySkill types
- `src/routes/+page.svelte` — add SkillsJourney
- `src/tests/setup.ts` — SplitText mock

## Design Spec
`docs/superpowers/specs/2026-04-04-slice-b-wordmark-cta-design.md`

## Verify
1. `bun run test` + `bun run check`
2. `bun run dev` → hover "yesid." in nav (4 effects cycling)
3. Scroll through hero → horizontal CTA section animates
4. Resize during animation — layout stays correct
5. Mobile: wordmark static, horizontal section adapts
6. Reduced motion: all animations skip
7. Hero (Slices A+C) still works exactly as before
