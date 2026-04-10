# Slice 13b — Manifesto Section

**Status:** ready
**Priority:** 1
**Estimated effort:** 1 session
**Depends on:** 13a (hero fixes, Lenis, home teardown)

## Objective

Add the Manifesto as Section 2 of the home page — a full-viewport SplitText character reveal with capability pills linking to service pages.

## Context

Slice 13 rebuilds the home page as a 7-section kinetic experience. 13a stripped the page to hero-only and installed Lenis. The Manifesto is the first new section: it bridges the hero animation into the proof/content sections below with a bold personal statement.

## Architecture

New `Manifesto.svelte` component rendered in `+page.svelte` after HeroBanner. Content comes from a new `manifestoContent` export in `content.ts`. GSAP SplitText handles the character reveal, ScrollTrigger pins the section during the animation. Pills are `<a>` tags routing to `/services/[id]`.

## Tech Stack

SvelteKit 2 + Svelte 5, TypeScript, GSAP (ScrollTrigger, SplitText), Tailwind v4, Vitest + @testing-library/svelte

## File Structure

### New Files

```
src/lib/components/Manifesto.svelte      — CREATE: full-viewport SplitText manifesto + pills
src/lib/components/Manifesto.test.ts     — CREATE: tests for rendering, pills, links
```

### Modified Files

```
src/lib/data/content.ts                  — MODIFY: add manifestoContent
src/lib/data/content.test.ts             — MODIFY: test manifestoContent structure
src/routes/+page.svelte                  — MODIFY: import + render Manifesto after Hero
src/routes/home.test.ts                  — MODIFY: assert Manifesto section renders
```

### Reused (no changes needed)

```
src/lib/motion/utils/gsap.ts             — SplitText + ScrollTrigger already registered
src/lib/motion/utils/lenis.ts            — smooth scroll active from layout
src/lib/styles/tokens.css                — existing brand/surface tokens
```

---

## Task 1: Add manifestoContent to data layer

**Files:**
- Modify: `src/lib/data/content.ts`
- Test: `src/lib/data/content.test.ts`

- [ ] **Step 1: Add manifestoContent export**
  Add statement (LocalizedString) and pills array (label + serviceId per pill). 5 pills: pipelines→data-pipeline, databases→database-engineering, dashboards→analytics-reporting, internal_tools→internal-tooling, web_apps→web-development.

- [ ] **Step 2: Add tests for manifestoContent**
  Test that statement has `en` key, pills has 5 entries, each pill has label.en and a valid serviceId.

- [ ] **Step 3: Run tests**
  Run: `bun run test`
  Expected: All pass.

**STOP. Ask Yesid to verify before moving to Task 2.**

---

## Task 2: Create Manifesto component with tests

**Files:**
- Create: `src/lib/components/Manifesto.svelte`
- Create: `src/lib/components/Manifesto.test.ts`

- [ ] **Step 1: Write failing tests**
  Test: renders manifesto text (uppercased), renders 5 capability pills, each pill links to correct `/services/[id]` route.

- [ ] **Step 2: Implement Manifesto.svelte**
  Full-viewport (100vh) section, centered. Uppercase text in 4 lines with INFRASTRUCTURE scaled larger. Orange highlights on INFRASTRUCTURE, OPERATIONS, and trailing dot. 5 mono-font ghost-border pills below. GSAP SplitText char-by-char reveal scrubbed to ScrollTrigger (~300vh pin). Pills stagger in after text. Reduced-motion: skip animation, show all immediately.

- [ ] **Step 3: Run tests**
  Run: `bun run test`
  Expected: All pass.

**STOP. Ask Yesid to verify on localhost before moving to Task 3.**

---

## Task 3: Integrate into home page

**Files:**
- Modify: `src/routes/+page.svelte`
- Modify: `src/routes/home.test.ts`

- [ ] **Step 1: Import and render Manifesto after HeroBanner**

- [ ] **Step 2: Update home.test.ts**
  Assert the Manifesto section renders on the home page.

- [ ] **Step 3: Run tests and check**
  Run: `bun run test && bun run check`
  Expected: All pass.

- [ ] **Step 4: Pre-flight visual check**
  Desktop (1440px): hero scrolls into full-viewport manifesto, text reveals char-by-char, pills appear after text completes, pills clickable to service pages.
  Mobile (375px): text scales down, pills wrap to 2 rows, same reveal behavior.

**STOP. Ask Yesid to verify on localhost.**

---

## Execution Order

Sequential: Task 1 → Task 2 → Task 3. Each depends on the previous.

## Out of Scope

- No changes to Hero section (done in 13a)
- No other home page sections (13c–13f)
- No service page changes
- No new CSS tokens (uses existing brand/surface tokens)
- No Lenis changes (already installed in 13a)

## Acceptance Criteria

- [ ] Manifesto section renders as Section 2 after the Hero
- [ ] Text displays uppercase in 4 lines with INFRASTRUCTURE scaled larger
- [ ] INFRASTRUCTURE, OPERATIONS, and trailing dot are orange (#E07800)
- [ ] SplitText reveals characters on scroll (scrubbed, reversible)
- [ ] 5 pills render: pipelines, databases, dashboards, internal_tools, web_apps
- [ ] Each pill links to correct `/services/[id]` route
- [ ] Pill hover: full orange fill (#E07800), dark text (#141414)
- [ ] Pills use JetBrains Mono, lowercase with underscores
- [ ] Reduced motion: text and pills visible immediately, no animation
- [ ] Responsive: text scales via clamp(), pills wrap on mobile
- [ ] `bun run test` and `bun run check` both pass

## Learn

### GSAP SplitText
**What it is:** A GSAP plugin that splits text into characters, words, or lines as separate DOM elements, enabling per-character animation.
**Why it matters:** Character-by-character scroll reveals are the signature effect on Awwwards portfolio sites. SplitText handles the DOM splitting; ScrollTrigger handles the scroll binding.
**Try this:** In browser devtools, inspect the manifesto text after scroll starts — each character is wrapped in a `<div>` with inline transforms.
**Go deeper:** https://gsap.com/docs/v3/Plugins/SplitText/

## Verify

1. Open `http://localhost:5173/`
2. Scroll past the hero — manifesto should pin and reveal character by character
3. Scroll back — text should disappear in reverse
4. After full reveal, 5 pills should appear with stagger animation
5. Hover each pill — should fill orange with dark text
6. Click a pill — should navigate to the correct service page
7. Test at 375px width — text smaller, pills wrap, same behavior
