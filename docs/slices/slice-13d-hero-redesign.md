# Slice 13d — Hero Text Redesign

**Status:** ready
**Priority:** 1
**Estimated effort:** 2–3 sessions
**Depends on:** 13a (foundation — hero fixes, Lenis, home teardown)

## Objective

Replace the hero text section with a two-column proof layout: "PIPELINES THAT / DON'T BREAK." headline with live transit metric cards and a syntax-highlighted SQL panel, backed by a constrained mock data generator.

## Context

After the metro SVG zooms into the orange dot, the current hero text ("DIGITAL INFRA. BUILT RIGHT." + 3-line SQL decoration) lacks the energy the animation builds. The redesign turns the hero into a **proof moment** — real SQL from the Gold layer, live KPI cards from the transit pipeline, and a refresh button that regenerates data. The manifesto section below the hard cut handles the personal statement; the hero handles proof.

Design spec: `docs/specs/2026-04-10-hero-redesign.md`
Reference HTML: `docs/specs/hero-v4-approved-reference.html`
Implementation plan: `docs/plans/2026-04-10-hero-redesign.md`

## Architecture

New `HeroMetrics` and `HeroSqlPanel` child components render inside `HeroBanner.svelte`'s existing `heroTextContainer`. Content comes from updated `heroContent` in `content.ts`. Mock data generation lives in a new `hero-data.ts` module with typed interfaces (`HeroMetric`, `HeroQueryRow`, `HeroData`). The GSAP stagger reveal expands from 4 to 7 groups. A site-wide circuit grid CSS background is added to `app.css`. The orange "." in "DON'T BREAK." replaces the current "INFRA." dot as the zoom-out transform-origin.

## Tech Stack

SvelteKit 2 + Svelte 5 (runes), TypeScript, GSAP (ScrollTrigger, CustomEase), Tailwind v4, Vitest + @testing-library/svelte, Bun

## File Structure

### New Files

```
src/lib/data/hero-data.ts              — CREATE: types, mock data generator, STM route list
src/lib/data/hero-data.test.ts         — CREATE: tests for mock data constraints
src/lib/components/HeroMetrics.svelte   — CREATE: 3 metric cards (vehicles, delay, routes)
src/lib/components/HeroMetrics.test.ts  — CREATE: component tests
src/lib/components/HeroSqlPanel.svelte  — CREATE: SQL query + results panel
src/lib/components/HeroSqlPanel.test.ts — CREATE: component tests
docs/reference/CSS.md                            — CREATE: CSS architecture reference
```

### Modified Files

```
src/lib/data/content.ts                — MODIFY: replace heroContent (new headline, remove badge/sqlDecoration)
src/lib/data/content.test.ts           — MODIFY: update heroContent assertions
src/lib/data/index.ts                  — MODIFY: add hero-data exports
src/lib/styles/tokens.css              — MODIFY: add terminal/status tokens
src/app.css                            — MODIFY: add circuit grid background, @theme tokens
src/lib/components/HeroBanner.svelte   — MODIFY: replace heroTextContainer contents, update GSAP Phase 8
src/routes/home.test.ts                — MODIFY: update hero assertions for new structure
```

### Reused (no changes needed)

```
src/lib/motion/utils/gsap.ts           — ScrollTrigger, CustomEase already registered
src/lib/motion/svg/MetroNetwork.svelte — metro SVG animation (phases 1-6 untouched)
src/lib/data/locale.ts                 — resolveLocale() for i18n
```

---

## Task 1: Data Layer — Types, Mock Generator, Content Strings

**Files:**
- Create: `src/lib/data/hero-data.ts`, `src/lib/data/hero-data.test.ts`
- Modify: `src/lib/data/content.ts`, `src/lib/data/content.test.ts`, `src/lib/data/index.ts`

- [ ] Create `HeroMetric`, `HeroQueryRow`, `HeroData` interfaces in `hero-data.ts`
- [ ] Implement `generateHeroData()` with constrained random STM data
- [ ] Export `INITIAL_HERO_DATA` with deterministic mock values for SSR
- [ ] Write tests verifying metric bounds (vehicles 900–1500, delay 20–90, routes 160–203)
- [ ] Replace `heroContent` in `content.ts` — new headline, subheadline, remove badge/sqlDecoration
- [ ] Update `content.test.ts` assertions
- [ ] Add barrel exports to `index.ts`
- [ ] Run: `bun run test -- --run src/lib/data/hero-data.test.ts src/lib/data/content.test.ts`
- [ ] Run: `bun run check`

**STOP. Ask Yesid to verify tests pass before moving to Task 2.**

---

## Task 2: CSS Tokens + Circuit Grid Background

**Files:**
- Modify: `src/lib/styles/tokens.css`, `src/app.css`

- [ ] Add tokens: `--bg-terminal`, `--border-subtle`, `--text-dim`, `--status-live`
- [ ] Add @theme values: `--color-terminal-bg`, `--color-terminal-border`, `--color-dim`, `--color-live`
- [ ] Add `.circuit-grid` utility class with `::before` pseudo-element (orange repeating gradient)
- [ ] Run: `bun run check`

**STOP. Verify circuit grid renders correctly (apply class to a test element, confirm, remove).**

---

## Task 3: HeroMetrics Component

**Files:**
- Create: `src/lib/components/HeroMetrics.svelte`, `src/lib/components/HeroMetrics.test.ts`

- [ ] Create component with `metrics: HeroMetric[]` prop
- [ ] 3-col grid of cards: label (JetBrains Mono 9px), value (Inter 800 orange), sub-label
- [ ] Hover: border transitions to brand-primary
- [ ] `formatValue()` — comma-format vehicles, fixed-decimal delay
- [ ] Tests: renders 3 cards, correct values, labels, sub-labels
- [ ] Run: `bun run test -- --run src/lib/components/HeroMetrics.test.ts`

**STOP. Component renders correctly when wired in Task 5.**

---

## Task 4: HeroSqlPanel Component

**Files:**
- Create: `src/lib/components/HeroSqlPanel.svelte`, `src/lib/components/HeroSqlPanel.test.ts`

- [ ] Create component with `rows`, `queryTime`, `prompt`, `liveLabel`, `updatedAgo` props
- [ ] Static SQL query with syntax highlighting (keywords orange, table names yellow, columns gray)
- [ ] Green pulsing LIVE dot
- [ ] Results table: 3-col grid (route, avg_delay_s, vehicles)
- [ ] Meta line: "5 rows · {queryTime}s · updated {updatedAgo}"
- [ ] Tests: prompt, LIVE indicator, query keywords, 5 result rows, meta line
- [ ] Run: `bun run test -- --run src/lib/components/HeroSqlPanel.test.ts`

**STOP. Component renders correctly when wired in Task 5.**

---

## Task 5: HeroBanner Layout Swap

**Files:**
- Modify: `src/lib/components/HeroBanner.svelte`

- [ ] Update script imports: add HeroMetrics, HeroSqlPanel, hero-data; remove badge/sqlDecoration refs
- [ ] Add `$state` for heroData + updatedAgo; add `handleRefresh()` function
- [ ] Replace heroTextContainer HTML with two-column grid (1fr | 1px | 1fr)
- [ ] Move `heroDot` binding to "." in "DON'T BREAK."
- [ ] Wire HeroMetrics + HeroSqlPanel with props from heroData state
- [ ] Add refresh button with spin animation + `handleRefresh` onclick
- [ ] Add vertical divider with gradient fade
- [ ] Update `data-hero-stagger` attributes: 7 groups
- [ ] Add scoped styles for `.hero-grid`, `.hero-divider`, `.refresh-btn`
- [ ] Run: `bun run check`

**STOP. Verify on localhost:**
- Desktop (1440px): two-column layout, metrics 3-across, SQL panel right, divider, refresh button centered
- Mobile (375px): stacked, no divider, full-width refresh
- Scroll animation: zoom-out from "." dot still works, stagger not yet updated

---

## Task 6: GSAP Stagger Animation — 7 Groups

**Files:**
- Modify: `src/lib/components/HeroBanner.svelte` (Phase 8 in script)

- [ ] Replace 4-group stagger selectors with 7-group selectors
- [ ] Add stagger tweens: headlines → subheadline → metrics → SQL → divider → subtitle/CTAs → refresh
- [ ] Add initial `y: 12` offset for refresh button (fade-up entrance)
- [ ] Adjust Phase 9 hold to `1.55`
- [ ] Run: `bun run check`

**STOP. Verify full scroll animation — all 7 stagger groups reveal in sequence. Reduced motion shows all content immediately.**

---

## Task 7: Circuit Grid Background — Site-wide

**Files:**
- Modify: `src/routes/+layout.svelte` (or per-section wrappers)

- [ ] Add `circuit-grid` class to main content area (between nav and footer)
- [ ] Verify on home, /work, /contact — grid visible behind content
- [ ] Verify nav and footer do NOT have the grid

**STOP. Verify on localhost — subtle orange grid lines on all pages, clean nav/footer.**

---

## Task 8: Mobile Responsive Polish

**Files:**
- Modify: `src/lib/components/HeroMetrics.svelte`, `src/lib/components/HeroSqlPanel.svelte`, `src/lib/components/HeroBanner.svelte`

- [ ] HeroMetrics: horizontal scroll on mobile (flex, overflow-x auto)
- [ ] HeroSqlPanel: smaller text (10px), reduced padding on mobile
- [ ] HeroBanner: "PIPELINES THAT" nowrap at 34px, mobile CTA sizing
- [ ] Run component tests

**STOP. Verify at 375px — horizontal scroll metrics, stacked SQL panel, full-width refresh, side-by-side CTAs.**

---

## Task 9: Test Updates + Documentation

**Files:**
- Modify: `src/routes/home.test.ts`
- Create: `docs/reference/CSS.md`

- [ ] Replace hero test assertions: new testids (hero-line1/2, hero-subheadline, hero-metrics, sql-panel, hero-refresh)
- [ ] Remove obsolete tests (hero-badge, hero-sql)
- [ ] Create docs/reference/CSS.md documenting 3-layer architecture + all tokens
- [ ] Run: `bun run test` (full suite)
- [ ] Run: `bun run check`

**STOP. All tests green, then proceed to slice closing.**

---

## Execution Order

```
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
```

Tasks are sequential — each depends on the previous. Task 7 (circuit grid) could technically run anytime after Task 2, but keeping it sequential respects the iteration protocol.

**Session estimate:**
- **Session 1:** Tasks 1–5 (data, tokens, components, layout swap)
- **Session 2:** Tasks 6–9 (GSAP, grid, mobile, tests)

## Out of Scope

- Live API integration (Phase 2 — future slice, Neon Postgres)
- Changes to metro SVG animation (Phases 1-6)
- Changes to manifesto section or hard cut transition
- i18n translations (English-only for now)
- Three.js / Threlte (pure 2D slice)

## Acceptance Criteria

- [ ] Desktop: two-column layout with headline+metrics left, SQL panel right, divider between
- [ ] "PIPELINES THAT" full width of left column, metrics 3-across directly below
- [ ] SQL panel top-aligned with "PIPELINES THAT"
- [ ] Real SQL query syntax-highlighted with Gold layer table names
- [ ] "PULL FRESH DATA" button refreshes both metrics and SQL results
- [ ] Mock data within constrained bounds (realistic STM numbers)
- [ ] Mobile: stacked layout, "PIPELINES THAT" on one line, horizontal scroll metrics
- [ ] Circuit grid background visible on all pages except nav/footer
- [ ] GSAP 7-group stagger reveal during zoom-out from metro animation
- [ ] Reduced motion: static display, no animations, all content visible
- [ ] All tests pass (`bun run test`), type check passes (`bun run check`)

## Learn

### Constrained Mock Data
**What it is:** Random data generated within realistic bounds to simulate production KPIs without a live API. Each call to `generateHeroData()` produces different numbers, but always within STM transit ranges.
**Why it matters:** Makes the hero feel alive and data-driven even before the API is wired. The visitor sees real route numbers, plausible delays, and correct sort order — not obviously fake data.
**Try this:** Click "PULL FRESH DATA" multiple times and verify the numbers change but stay realistic. Check that routes are sorted by vehicles descending.
**Go deeper:** The actual transit pipeline lives at `C:\Users\otalo\Yesito\Projects\transit` — 5-schema Postgres with 30s refresh cycles.

### GSAP Stagger Groups
**What it is:** Using `data-hero-stagger="N"` attributes to control the reveal order of hero elements during the scroll-driven zoom-out animation. Each group appears at a different timeline position.
**Why it matters:** Creates a cinematic reveal that guides the eye: headlines first (establish context), then metrics (proof), then SQL (technical depth), then CTAs (action).
**Try this:** In DevTools, change a `data-hero-stagger` value and scroll — watch the element appear at a different time.
**Go deeper:** [GSAP Stagger docs](https://gsap.com/docs/v3/Staggers)

### CSS Custom Property Layers
**What it is:** Three-layer CSS architecture: semantic tokens (theme-switching), brand utilities (@theme static values), and component-scoped styles. The hero uses all three.
**Why it matters:** Separating concerns means changing the theme affects tokens globally, brand colors stay consistent, and component layout is encapsulated.
**Try this:** Change `--bg-terminal` in DevTools and watch the SQL panel background update instantly.
**Go deeper:** `docs/reference/CSS.md` (created in Task 9)

## Verify

1. Navigate to `http://localhost:5173/` and scroll through the full hero animation
2. On desktop (1440px): two-column grid, divider, metrics cards hover effect, SQL panel with green pulsing LIVE dot
3. Click "PULL FRESH DATA" — metrics and SQL results change, icon spins
4. Resize to 375px — stacked layout, horizontal scroll metrics, full-width refresh button
5. Check `/work` and `/contact` — circuit grid visible, nav/footer clean
6. Run `bun run test` — all pass
7. Run `bun run check` — no type errors
8. Enable reduced motion in OS settings — all hero content visible immediately, no animations
