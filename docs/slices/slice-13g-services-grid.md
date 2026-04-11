# Slice 13g — Services Grid

**Status:** in-progress
**Priority:** 1
**Estimated effort:** 2-3 sessions
**Depends on:** 13f (Proof Reel)

## Objective

Build Section 4 of the home page: a benefit-led, Carnegie-informed 3x2 services grid with MR-73 blueprint background and SVG morph hover interactions.

## Context

By Section 4, the visitor has been impressed (Hero), aligned (Manifesto), and shown proof (Proof Reel). Their internal state shifts from "Is this person impressive?" to "What can you do for ME?" The services grid answers that question with clarity, not spectacle. Blueprint background reinforces the transit/infrastructure brand.

## Architecture

- New `HomeServices.svelte` component driven by `getVisibleServices()` from data layer
- Two new fields on `Service` type: `benefitHeadline`, `impactMetric`
- Blueprint background: CSS grid layers + inline MR-73 train SVG
- Entrance: GSAP ScrollTrigger staggered fade-up
- SVG morph on hover/tap via MorphSVGPlugin

## Tech Stack

SvelteKit 2 + Svelte 5, TypeScript, GSAP (ScrollTrigger, MorphSVGPlugin), Tailwind v4, Vitest + @testing-library/svelte, Bun

## File Structure

### New Files

```
src/lib/components/HomeServices.svelte      — CREATE: services grid component
src/lib/components/HomeServices.test.ts     — CREATE: component tests
```

### Modified Files

```
src/lib/data/types.ts                       — MODIFY: add benefitHeadline, impactMetric to Service
src/lib/data/services.ts                    — MODIFY: populate new fields for all 6 services
src/lib/data/content.test.ts                — MODIFY: data integrity tests for new fields
src/routes/+page.svelte                     — MODIFY: import + render HomeServices after ProofReel
src/routes/home.test.ts                     — MODIFY: add HomeServices integration tests
docs/reference/TESTS.md                              — MODIFY: add test entries
```

---

## Task 1: Extend Service Type

**Files:** `src/lib/data/types.ts`

Add `benefitHeadline` (optional `LocalizedString`) and `impactMetric` (optional `{ value: LocalizedString; label: LocalizedString }`) to the Service interface. Run `bun run check`.

**STOP. Ask Yesid to verify before Task 2.**

---

## Task 2: Populate Service Data

**Files:** `src/lib/data/services.ts`

Add benefit headlines and impact metrics to all 6 services. Run `bun run check`.

**STOP. Ask Yesid to verify before Task 3.**

---

## Task 3: Data Integrity Tests

**Files:** `src/lib/data/content.test.ts`

Add tests verifying all visible services have `benefitHeadline`, `impactMetric`, and `svg`. Run `bun run test`.

**STOP. Ask Yesid to verify before Task 4.**

---

## Task 4: HomeServices Component — Structure + Cards

**Files:** `src/lib/components/HomeServices.svelte`

Create component with section structure, blueprint CSS background, 3x2 card grid, benefit text, service titles, impact metrics, SVG panels, view-all link, and GSAP entrance animation.

**STOP. Ask Yesid to verify visually before Task 5.**

---

## Task 5: MR-73 Train Blueprint SVG + Edge Details

**Files:** `src/lib/components/HomeServices.svelte`

Add the MR-73 side elevation SVG and edge detail panels from the approved mockup into the blueprint background. Hidden on mobile/tablet as appropriate.

**STOP. Ask Yesid to verify visually before Task 6.**

---

## Task 6: Component Tests

**Files:** `src/lib/components/HomeServices.test.ts`

Write component tests: section renders, label, 6 cards, benefits, titles, metrics, SVG panels, card links, view-all link.

**STOP. Ask Yesid to verify before Task 7.**

---

## Task 7: Integrate into Home Page

**Files:** `src/routes/+page.svelte`

Import HomeServices, render after ProofReel with hard-cut dividers. Run `bun run check && bun run test`.

**STOP. Ask Yesid to verify visually before Task 8.**

---

## Task 8: Home Page Integration Tests

**Files:** `src/routes/home.test.ts`

Add tests for services section, 6 cards, benefit headlines in home page context.

**STOP. Ask Yesid to verify before Task 9.**

---

## Task 9: SVG Morph Hover/Tap

**Files:** `src/lib/components/HomeServices.svelte`

Replace `<img>` SVGs with inline SVGs. Add MorphSVGPlugin morph on hover (desktop) and tap toggle (mobile).

**STOP. Ask Yesid to verify visually before Task 10.**

---

## Task 10: Update docs/reference/TESTS.md

**Files:** `docs/reference/TESTS.md`

Add HomeServices test entries under Components and Data Layer sections.

**STOP. Ask Yesid to verify before Task 11.**

---

## Task 11: Final Verification

Run full `bun run test` + `bun run check`. Visual check at 1440px, 768px, 375px. Print test table.

**STOP. Ask Yesid for final approval.**

---

## Execution Order

Sequential: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

## Out of Scope

- Blog Teaser section (13h)
- About Strip section (13i)
- Any changes to existing Proof Reel or Manifesto
- Closing docs (separate closing session)

## Acceptance Criteria

- [ ] 6 service cards render in 3x2 grid on desktop
- [ ] Each card shows benefit headline, service title, impact metric, SVG panel
- [ ] Cards link to `/services/[id]`
- [ ] Blueprint background with MR-73 train visible on desktop
- [ ] GSAP entrance animation (staggered fade-up) with reduced-motion support
- [ ] SVG morph on hover (desktop) and tap toggle (mobile)
- [ ] All tests pass, `bun run check` clean
- [ ] Responsive: 3x2 desktop, 2x3 tablet, 1x6 mobile
