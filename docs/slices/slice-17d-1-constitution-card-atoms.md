# Slice 17d-1 — Constitution + Card + Brand Atoms

**Status:** ready
**Priority:** 1
**Estimated effort:** 1 session
**Depends on:** 17a-6 complete (PR #9 merged to main)
**Branch:** `feature/slice-17d-component-api` (from main after PR #9 merge)
**Design spec:** `docs/specs/2026-04-13-slice-17d-atomic-design-system.md`
**Implementation plan:** `docs/plans/2026-04-13-slice-17d-atomic-design-system.md`

## Objective

Establish the atomic design system foundation: Constitution Section 13 (Atomic Design) + Section 9 upgrade (Responsive Mathematical Guarantee + No Overflow + Scroll Law), unified Card surface, and first brand atoms (SectionHeading, MetroStation).

## Context

17d is the atomic backbone of yesid.dev — 7 sub-slices transforming 22 slices of iterative building into a 4-tier atomic design system. 17d-1 lays the governance and foundational atoms that all subsequent sub-slices build on. Nothing else can start until the Constitution is updated and Card is unified.

## Architecture

- Constitution gets 2 new sections: Atomic Design (tier hierarchy, composition rules, Card spec) and upgraded Responsive (device matrix, no overflow guarantee, scroll law)
- ui/card gets customized with unified ProofReel surface (replaces 18 hand-rolled card patterns across 3 clusters)
- 2 new brand atoms: SectionHeading (heading + dot + mono sub), MetroStation (badge + pulse + SVG line)
- Global CSS additions: `::selection` highlight, `station-ping` keyframes, `grid-rows-collapse` utility, no-overflow enforcement chain

## Tech Stack

SvelteKit 2 + Svelte 5, TypeScript, Tailwind CSS v4, shadcn-svelte, Vitest + @testing-library/svelte

## File Structure

### New Files

```
src/lib/components/brand/SectionHeading.svelte      — CREATE: heading + orange dot + mono subheading atom
src/lib/components/brand/SectionHeading.test.ts      — CREATE: tests
src/lib/components/brand/MetroStation.svelte          — CREATE: badge + pulse + SVG line atom
src/lib/components/brand/MetroStation.test.ts         — CREATE: tests
```

### Modified Files

```
docs/reference/CONSTITUTION.md                        — MODIFY: Add Section 13 (Atomic Design), upgrade Section 9 (Responsive)
src/lib/components/ui/card/card.svelte               — MODIFY: Unified ProofReel surface
src/app.css                                           — MODIFY: ::selection, station-ping, grid-rows-collapse, no-overflow globals
src/lib/components/brand/index.ts                    — MODIFY: Export SectionHeading, MetroStation
src/lib/components/ProofReel.svelte                  — MODIFY: Wire SectionHeading (replace hand-rolled CSS)
src/lib/components/HomeServices.svelte               — MODIFY: Wire SectionHeading (replace hand-rolled CSS)
src/lib/components/BlogRow.svelte                    — MODIFY: Wire MetroStation (replace copy-pasted station badge + CSS)
src/lib/components/WorkListingPage.svelte            — MODIFY: Wire MetroStation (replace copy-pasted station badge + CSS)
```

### Reused (no changes needed)

```
src/lib/components/brand/StatusDot.svelte            — Used inside MetroStation
src/lib/components/ui/badge/                         — NumberBadge variant used inside MetroStation
src/lib/components/ui/separator/                     — Gradient variant used in SectionHeading context
```

---

## Task 1: Constitution Section 13 — Atomic Design

**Files:**
- Modify: `docs/reference/CONSTITUTION.md`

- [ ] **Step 1:** Add Section 13: Atomic Design to CONSTITUTION.md covering:
  - 4-tier hierarchy: ui/ → brand/ → shells/ → page components
  - Composition rules: Tier 4 never creates UI patterns, only wires data into Tier 1-3
  - Card as universal surface: ProofReel background/border, universal border glow, tilt bento-only
  - SectionWrapper as CSS Grid layout engine: 3 layers (background, sides, content), 4 patterns (A/B/C/D)
  - EdgeRail as page-level edge decoration
  - When to create a new atom: pattern appears on 2+ pages
  - Slot conventions per tier
  - Anti-patterns: page components creating custom card styles, inline section padding, hand-rolled edge decorations

- [ ] **Step 2:** Upgrade Section 9: Responsive with:
  - Device coverage matrix (6 classes: 280-359, 360-519, 520-767, 768-1023, 1024-1439, 1440+)
  - Two-pronged system: breakpoints for layout, clamp() for values
  - Touch target enforcement: 44x44px min below 1024px
  - Container overflow prevention: `min(container, 100vw - page-x * 2)`
  - **No Overflow Guarantee** — 7-layer CSS enforcement chain:
    1. `html { overflow-x: clip }` — viewport boundary
    2. `body { overflow-wrap: anywhere }` — text breaks
    3. `img, svg, video { max-width: 100% }` — media scales
    4. Flex/grid children `min-width: 0` — can shrink
    5. Containers `min(token, 100vw - gutters)` — viewport-capped
    6. Side panels `minmax(0, var(--edge-width))` — collapse before overflow
    7. Pre/code/table `overflow-x: auto` — scroll internally
  - **Scroll Law:** "Scroll flows downward. Touch scroll is sacred." No child element may block page-level scroll. No motion action may preventDefault on touch scroll events.
  - Safe area expansion to ALL fixed/sticky elements
  - Edge decorations only at xl:+ (1024px)

- [ ] **Step 3:** Run `bun run check`

**STOP. Ask Yesid to verify the Constitution updates before proceeding.**

---

## Task 2: No-Overflow Global CSS + Brand Selection Highlight

**Files:**
- Modify: `src/app.css`

- [ ] **Step 1:** Add no-overflow enforcement CSS to app.css globals:
  ```css
  html { overflow-x: clip; }
  body { overflow-wrap: anywhere; word-break: break-word; }
  img, svg, video, iframe, canvas { max-width: 100%; height: auto; }
  pre, code, table { overflow-x: auto; max-width: 100%; }
  ```

- [ ] **Step 2:** Add brand `::selection` highlight:
  ```css
  ::selection {
    background: color-mix(in srgb, var(--primary) 30%, transparent);
    color: var(--foreground);
  }
  ```

- [ ] **Step 3:** Move `@keyframes station-ping` to app.css (will be consumed by MetroStation in Task 4):
  ```css
  @keyframes station-ping {
    0% { transform: scale(1); opacity: 0.6; }
    75%, 100% { transform: scale(2.5); opacity: 0; }
  }
  ```

- [ ] **Step 4:** Add `.grid-rows-collapse` utility:
  ```css
  .grid-rows-collapse {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--duration-slow) var(--ease-default);
  }
  .grid-rows-collapse[data-state="open"] {
    grid-template-rows: 1fr;
  }
  ```

- [ ] **Step 5:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Select text anywhere — should highlight in translucent brand orange
- No horizontal scroll on any page at any viewport

---

## Task 3: Unify Card Surface

**Files:**
- Modify: `src/lib/components/ui/card/card.svelte`
- Modify: `src/app.css` (update .bento-card to align with Card tokens)

- [ ] **Step 1:** Read current `ui/card/card.svelte` to understand existing shadcn structure.

- [ ] **Step 2:** Customize Card with unified ProofReel surface:
  - Background: `color-mix(in srgb, var(--background) 80%, transparent)` + `backdrop-blur(6px)`
  - Border: `1px solid color-mix(in srgb, var(--primary) 15%, transparent)`
  - Radius: `var(--radius-lg)`
  - Hover: border glow to `color-mix(in srgb, var(--primary) 60%, transparent)` + `var(--shadow-section)`
  - Transition: `border-color var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default)`

- [ ] **Step 3:** Update `.bento-card` class in app.css to use the same token values as Card (so existing bento cards get the unified look without immediately migrating to the Card component). The .bento-card class is the bridge until Task 31 (17d-7) wires all cards to the Card component.

- [ ] **Step 4:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- About page bento cards still look correct (they use .bento-card class)
- Any page currently using ui/card (if any) has the new ProofReel surface
- Hover glow is consistent: translucent orange border + shadow

---

## Task 4: SectionHeading Brand Atom

**Files:**
- Create: `src/lib/components/brand/SectionHeading.svelte`
- Create: `src/lib/components/brand/SectionHeading.test.ts`
- Modify: `src/lib/components/brand/index.ts`
- Modify: `src/lib/components/ProofReel.svelte`
- Modify: `src/lib/components/HomeServices.svelte`

- [ ] **Step 1:** Write test for SectionHeading:
  - Renders heading text
  - Renders orange dot after heading
  - Renders mono subheading when provided
  - Accepts class prop
  - Has data-slot="section-heading"

- [ ] **Step 2:** Build SectionHeading component:
  - Props: `heading: string`, `subheading?: string`, `class?: string`, `...rest`
  - Heading: `font-heading`, `clamp(2.5rem, 6vw, 4rem)`, `font-weight: 900`, `letter-spacing: -2px`
  - Dot: `color: var(--primary)` (the period at end of heading)
  - Subheading: `font-mono`, `13px`, `letter-spacing: 2px`, `uppercase`, `color: var(--muted-foreground)`
  - Uses cn() for class composition

- [ ] **Step 3:** Export from `src/lib/components/brand/index.ts`

- [ ] **Step 4:** Wire into ProofReel:
  - Replace `.section-heading` + `.section-dot` + `.section-subheading` with `<SectionHeading heading="Proof in the data" subheading="// measured impact" />`
  - Delete the `.section-heading`, `.section-dot`, `.section-subheading` CSS blocks

- [ ] **Step 5:** Wire into HomeServices:
  - Same replacement pattern
  - Delete duplicate CSS blocks

- [ ] **Step 6:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- ProofReel section heading looks identical to before
- HomeServices section heading looks identical to before
- Both headings have the orange dot

---

## Task 5: MetroStation Brand Atom

**Files:**
- Create: `src/lib/components/brand/MetroStation.svelte`
- Create: `src/lib/components/brand/MetroStation.test.ts`
- Modify: `src/lib/components/brand/index.ts`
- Modify: `src/lib/components/BlogRow.svelte`
- Modify: `src/lib/components/WorkListingPage.svelte`

- [ ] **Step 1:** Write test for MetroStation:
  - Renders station badge with index number
  - Renders pulse animation element
  - Renders SVG line when showLine is true
  - Accepts class prop
  - Has data-slot="metro-station"

- [ ] **Step 2:** Build MetroStation component:
  - Props: `index: number`, `showLine?: boolean`, `lineHeight?: string`, `class?: string`, `...rest`
  - Badge: uses `Badge variant="number"` from ui/badge
  - Pulse: `.station-pulse` with `animation: station-ping` (now global in app.css from Task 2)
  - SVG line: optional vertical line connecting stations

- [ ] **Step 3:** Export from `src/lib/components/brand/index.ts`

- [ ] **Step 4:** Wire into BlogRow:
  - Replace hand-rolled `.station-badge-wrapper` + `.station-pulse` markup with `<MetroStation index={...} showLine />`
  - Delete `.station-badge-wrapper`, `.station-pulse`, and `@keyframes station-ping` CSS blocks (keyframes now global)

- [ ] **Step 5:** Wire into WorkListingPage:
  - Same replacement pattern
  - Delete duplicate CSS blocks

- [ ] **Step 6:** Run `bun run test` + `bun run check`

**STOP. Ask Yesid to verify:**
- Blog listing page station badges look identical (number, pulse, line)
- Work listing page station badges look identical
- Pulse animation plays correctly on both

---

## Execution Order

```
Task 1 (Constitution) → independent, must be first
Task 2 (Global CSS) → independent, can parallel Task 1
Task 3 (Card) → after Task 2 (uses app.css tokens)
Task 4 (SectionHeading) → after Task 3
Task 5 (MetroStation) → after Task 2 (needs station-ping in global CSS)
```

Tasks 1 and 2 can be done in parallel. Tasks 4 and 5 are independent of each other but both depend on earlier tasks.

## Out of Scope

- SvgIcon merge (17d-2)
- Utility extractions — isTouchDevice, SHAPES, morphHelpers (17d-2)
- Shell creation — SectionWrapper, EdgeRail, ListingShell (17d-3)
- File splits (17d-4)
- SVG tokenization (17d-5)
- SectionLabel / MetricDisplay / TerminalChrome / StatusDot wiring (17d-6)
- Edge-to-edge pass (17d-7)
- Motion preset system (17e)
- Scroll behavior fixes — investigated in 17d-6, not this sub-slice

## Acceptance Criteria

- [ ] CONSTITUTION.md has Section 13 (Atomic Design) covering 4-tier hierarchy, composition rules, Card spec
- [ ] CONSTITUTION.md Section 9 upgraded with device coverage matrix, no overflow guarantee, scroll law
- [ ] app.css has no-overflow enforcement CSS (overflow-x: clip, overflow-wrap, max-width 100% on media)
- [ ] app.css has brand `::selection` highlight (translucent orange)
- [ ] app.css has `@keyframes station-ping` (moved from component-scoped)
- [ ] app.css has `.grid-rows-collapse` utility class
- [ ] ui/card has unified ProofReel surface (background, border, radius, hover glow)
- [ ] .bento-card class aligned with Card token values
- [ ] SectionHeading built, tested, wired into ProofReel + HomeServices
- [ ] MetroStation built, tested, wired into BlogRow + WorkListingPage
- [ ] Both brand atoms exported from brand/index.ts with data-slot + cn() + class/rest
- [ ] Zero duplicate section heading CSS (was in 2 files, now in SectionHeading)
- [ ] Zero duplicate station-ping CSS (was in 2 files, now global)
- [ ] `bun run test` + `bun run check` pass

## Learn

### Atomic Design Tiers
**What it is:** A 4-tier component hierarchy where each tier has strict composition rules. ui/ (headless primitives) → brand/ (unique craft) → shells/ (page scaffolds) → page (pure composition).
**Why it matters:** Adding a new page means composing from atoms, not inventing patterns. One change to Card cascades to all 18 card instances.
**Try this:** Look at how SectionHeading replaces identical CSS in ProofReel and HomeServices. Change the heading font-weight in SectionHeading — both sections update automatically.
**Go deeper:** Brad Frost's Atomic Design methodology

### No Overflow Guarantee
**What it is:** 7 layers of CSS constraints that make content overflow mathematically impossible. From `overflow-x: clip` on html to `min-width: 0` on flex children.
**Why it matters:** Instead of testing every viewport and hoping nothing overflows, the CSS system PREVENTS overflow. If an element would exceed its parent, CSS recalculates automatically.
**Try this:** Resize the browser to 280px width. No horizontal scrollbar appears. No content clips unexpectedly.
**Go deeper:** CSS `min()`, `max()`, `clamp()` functions

### CSS clamp() for Fluid Scaling
**What it is:** `clamp(min, preferred, max)` gives a value that scales with the viewport but has hard boundaries. Used for typography, spacing, and container widths.
**Why it matters:** Instead of breakpoint-based sizing (jumps between sizes), clamp() scales continuously — every viewport width gets the right value. No device falls through the cracks.
**Try this:** Inspect `--space-page-x: clamp(1.5rem, 4vw, 5rem)` and resize the browser. Watch the padding change fluidly from 1.5rem to 5rem.
**Go deeper:** MDN Web Docs — clamp()

## Verify

1. Open localhost:5173 at 375px width — no horizontal scroll, text selection is orange
2. Open About page — bento cards have unified glow hover
3. Open ProofReel section — heading has orange dot, mono subheading
4. Open HomeServices section — same heading pattern
5. Open /blog — station badges have pulse animation, connected by SVG lines
6. Open /work — same station badge pattern
7. Run `bun run test` — all tests pass
8. Run `bun run check` — zero errors
