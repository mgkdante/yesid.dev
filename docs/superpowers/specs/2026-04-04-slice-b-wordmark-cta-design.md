# Slice B — Animated Wordmark + Horizontal Scroll CTA

**Date:** 2026-04-04
**Status:** Design approved, pending implementation

## Overview

Two additive features that bring personality to the site without touching the existing hero animation (Slices A+C):

1. **Nav wordmark hover animation** — "yesid." letters animate with rotating effects on each hover (gsap.com logo style)
2. **Horizontal scroll CTA section** — pinned section after the hero that bridges the metro metaphor to the tech offering with SplitText effects, tech stack SVG icons, and a CTA button

## Part 1: Nav Wordmark Hover Animation

### Behavior
- SplitText splits "yesid" into char `<span>`s on mount
- The orange dot (`.`) is already a separate span — animated independently
- Each `mouseenter` cycles through 4 effects in order:
  1. **Bounce** — letters stagger up 15px, `back.out(1.7)`
  2. **Wiggle** — letters rotate ±12°, `elastic.out(1, 0.3)`
  3. **Wave** — sine-wave y-offset, 0.05s stagger left→right
  4. **Spin** — 360° rotation per letter, `power2.inOut`, staggered
- The dot always pulses (scale 1→1.4→1) in brand orange on every hover
- Mobile menu wordmark: static (no hover on touch devices)
- Reduced motion: skip all animation

### Technical
- Register SplitText in `src/lib/motion/utils/gsap.ts`
- `onMount` in Nav.svelte: create SplitText instance
- `mouseenter` handler: increment effect index (mod 4), build + play GSAP timeline
- `onDestroy`: `splitInstance.revert()` to restore DOM
- Check `isPrefersReducedMotion()` before animating

## Part 2: Horizontal Scroll CTA Section

### Architecture
- New component: `SkillsJourney.svelte`
- Placed after `<HeroBanner />` in `+page.svelte`
- Independent GSAP timeline + ScrollTrigger — fully isolated from hero
- Pinned container, inner flex track translated via `gsap.to(track, { x: -totalWidth })`
- ~400-500vh scroll distance

### Data-Driven Design (CRITICAL)
The entire panel system is driven by a typed data array. The component iterates over the array and generates panels + animations dynamically. Adding, removing, or reordering a skill means editing ONE data file — zero component changes.

```typescript
interface JourneyPanel {
  id: string;
  label: LocalizedString;       // "01 — FOUNDATION"
  text: LocalizedString;        // "Every system starts at the foundation."
  highlightWords: string[];     // ["foundation"] — these get special text effects
  highlightEffect: 'scale' | 'gradient' | 'wave' | 'charReveal';
  skills: JourneySkill[];       // tech icons for this panel
}

interface JourneySkill {
  id: string;
  name: string;                 // "SQL"
  subtitle?: string;            // "PostgreSQL · SQL Server"
  icon: 'sql' | 'typescript' | 'python' | 'sveltekit' | 'gsap' | 'powerbi' | 'docker';
}
```

- Panel count, text, icons, and effects all come from data
- GSAP timeline builds dynamically: `panels.forEach((panel, i) => { ... })`
- SVG icons are a `switch` on `skill.icon` — adding a new icon means adding one case
- ScrollTrigger `end` recalculates based on panel count

### Panel Content

Narrative bridges the metro/train theme to **digital infrastructure** — the brand encompasses the full stack from databases to animated frontends, not just SQL/data. This keeps the brand open for future growth without rebranding.

**Tech stack (7):** SQL, TypeScript, Python, SvelteKit, GSAP, Power BI, Docker
**Narrative:** bridges metro/train metaphor → digital infrastructure offering

| Panel | Text | Decoration | Text Effect |
|-------|------|------------|-------------|
| 1 | "Every system starts at the foundation." | SQL icon | Word-by-word, "foundation" orange + scale |
| 2 | "Routes that move data, logic, and pixels." | TypeScript + Python SVG icons | Char-by-char on "data, logic, and pixels" |
| 3 | "Stations where users stop and understand." | SvelteKit + Power BI SVG icons | "Stations" wave stagger, "understand" scale |
| 4 | "The motion that makes the ride unforgettable." | GSAP + Docker SVG icons | "motion" gradient sweep, "unforgettable" scale |
| 5 | "Your next stop?" | Metro dot pulses (Berri-UQAM callback) | Char-by-char + dot pulse |
| CTA | "Let's build together →" button | Orange glow radiates | Elastic scale-in |

**Additional change:** Replace "SCROLL DOWN" on the hero's initial black screen with a welcome message: "Welcome — scroll down" (or similar). This addresses the cold-start problem where the site loads to near-black with no context.

### Visual Style
- Dark background: `#141414`
- Large text: `font-heading`, 4xl–6xl responsive
- Key words: brand orange `#E07800` or accent yellow `#FFB627`
- SVG icons: simple line-art, white strokes with orange accents (metro aesthetic)
- Thin orange horizontal line threading through all panels (metro line continuity)

### Reduced Motion
- Show all panels stacked vertically (no horizontal scroll)
- Text visible immediately (no SplitText animation)
- Icons visible at rest positions

## Files

### Create
- `src/lib/components/SkillsJourney.svelte`
- `src/lib/components/SkillsJourney.test.ts`

### Modify
- `src/lib/components/Nav.svelte` — SplitText hover animation
- `src/lib/components/Nav.test.ts` — hover tests
- `src/lib/motion/utils/gsap.ts` — register SplitText
- `src/lib/motion/utils/gsap.test.ts` — SplitText registration test
- `src/lib/data/content.ts` — add `skillsJourneyContent`
- `src/routes/+page.svelte` — add `<SkillsJourney />`
- `src/tests/setup.ts` — SplitText mock

### Untouched
- `src/lib/components/HeroBanner.svelte`
- `src/lib/motion/svg/MetroNetwork.svelte`
- Hero timeline phases 1–9

## Acceptance Criteria
- [ ] Hovering "yesid." in nav plays a different animation each time (4 effects cycling)
- [ ] Orange dot pulses on every hover
- [ ] Mobile wordmark has no hover animation
- [ ] Horizontal scroll section appears after hero
- [ ] 6 panels scroll horizontally with SplitText + SVG decorations
- [ ] CTA button at the end with "Let's build together →"
- [ ] Reduced motion: static fallback for both features
- [ ] `bun run test` passes
- [ ] `bun run check` passes
- [ ] Slices A+C hero animation unchanged
