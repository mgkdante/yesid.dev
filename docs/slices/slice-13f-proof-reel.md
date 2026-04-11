# Slice 13f — Proof Reel

**Status:** ready
**Priority:** 1
**Estimated effort:** 1 session
**Depends on:** 13b (manifesto), 13d (hero redesign — provides circuit grid + terminal tokens)

## Objective

Add the Proof Reel as Section 3 of the home page — a 3-card grid of featured projects with prominent impact metrics, staggered scroll entrance, and links to `/work/[slug]`.

## Context

Slice 13 rebuilds the home page as a 7-section kinetic experience. After the hero (proof moment with live data) and manifesto (personal statement), the Proof Reel shows breadth — 3 different projects with real impact numbers. This is Act 2 of the page rhythm: same dark bg, circuit grid, terminal aesthetic. No color break.

## Architecture

New `ImpactMetric` interface on the `Project` type (long-term investment). 3 projects populated with metrics. New `ProofReel.svelte` renders a responsive card grid. GSAP ScrollTrigger handles staggered entrance (no pin — fast pace after dense hero + manifesto).

## Tech Stack

SvelteKit 2 + Svelte 5 (runes), TypeScript, GSAP (ScrollTrigger), Tailwind v4, Vitest + @testing-library/svelte

## Design Spec

`docs/superpowers/specs/2026-04-10-proof-reel-design.md`

## Implementation Plan

`docs/superpowers/plans/2026-04-10-proof-reel.md`

## File Structure

### New Files

```
src/lib/components/ProofReel.svelte      — CREATE: 3-card proof reel section
src/lib/components/ProofReel.test.ts     — CREATE: component tests
```

### Modified Files

```
src/lib/data/types.ts                    — MODIFY: add ImpactMetric interface
src/lib/data/projects.ts                 — MODIFY: add impactMetric to 3 projects
src/lib/data/content.ts                  — MODIFY: add proofReelContent
src/lib/data/content.test.ts             — MODIFY: add proofReelContent tests
src/lib/data/index.ts                    — MODIFY: barrel exports
src/routes/+page.svelte                  — MODIFY: render ProofReel after Manifesto
src/routes/home.test.ts                  — MODIFY: assert ProofReel renders
```

---

## Tasks

See implementation plan for full task breakdown with code. Summary:

1. **Data layer** — ImpactMetric type + populate 3 projects
2. **Content layer** — proofReelSlugs + section labels
3. **Component** — ProofReel.svelte + tests (TDD)
4. **Integration** — Add to +page.svelte + home tests
5. **Polish** — Visual feedback + commit

## Acceptance Criteria

- [ ] `ImpactMetric` interface added to `types.ts`
- [ ] 3 featured projects have `impactMetric` populated
- [ ] `ProofReel.svelte` renders 3 cards in a responsive grid
- [ ] Each card shows: hero metric (orange), supporting line, title, tech stack pills
- [ ] Analytics Dashboard shows before/after (~~2 days~~ 15 min)
- [ ] Cards link to `/work/[slug]`, "View all work →" links to `/work`
- [ ] Hover: border brightens, subtle lift + glow
- [ ] Section label `// PROOF` in JetBrains Mono
- [ ] Dark background with circuit grid
- [ ] GSAP staggered entrance on scroll (no pin)
- [ ] Reduced motion: static, all visible
- [ ] Mobile: stacked full-width
- [ ] `bun run test` and `bun run check` both pass

## Verify

1. Open `http://localhost:5173/` and scroll past hero + manifesto
2. Proof Reel section appears with 3 cards in a row
3. Orange metric numbers: "30s", "~~2 days~~ 15 min", "500 GB"
4. Hover any card — border brightens, card lifts slightly
5. Click a card — navigates to `/work/[slug]`
6. Click "View all work →" — navigates to `/work`
7. Resize to 375px — cards stack vertically
8. Scroll back up — cards animate out (reverse)
