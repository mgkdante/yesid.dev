# Test Suite Guide

Last updated: 2026-04-08
Total test files: 51
Total tests: 480
Runner: Vitest + Bun (`bun run test`)

---

## Test Environment

### How the Test Runner Is Configured

Vitest is configured inside `vite.config.ts` using two **projects** (split for performance in slice 10d+):

| Project | Environment | Setup File | What It Covers |
|---------|-------------|------------|---------------|
| **data** | `node` | `src/tests/setup.data.ts` | Pure data/logic tests (9 files). No DOM, no mocks. |
| **dom** | `happy-dom` | `src/tests/setup.dom.ts` | Component, motion, and route tests (42 files). Full mock suite. |

Other config:
- **Pool:** `threads` — faster IPC than default `forks`. Safe because all native deps (GSAP, Three.js, lottie) are mocked.
- **Globals:** `true` — `describe`, `it`, `expect` are available without importing from `vitest`.
- **svelteTesting() plugin:** Ensures Svelte components compile to their browser (not SSR) entry points during tests.

### Setup Files

**`src/tests/setup.data.ts`** (~5 lines) — only imports jest-dom matchers. Data tests run in Node with zero DOM overhead.

**`src/tests/setup.dom.ts`** (~200 lines) — patches happy-dom gaps and mocks libraries that require a real browser. Detailed below.

**When adding a new mock:** Add it to `setup.dom.ts`. The `setup.data.ts` file should stay minimal — data tests should never need DOM APIs or library mocks.

### What `src/tests/setup.dom.ts` Does

The setup file solves one problem: **happy-dom is not a real browser.** Many libraries crash on import because they expect canvas rendering, WebGL, or SVG measurement. The setup file stubs these out so tests can focus on structure and behavior, not rendering.

#### DOM API Stubs

| What's Stubbed | Why happy-dom Needs It | What the Stub Returns |
|---------------|--------------------|-----------------------|
| `HTMLCanvasElement.prototype.getContext` | lottie-web calls `getContext('2d')` at import time. happy-dom returns `null`, causing a crash. | A fake 2D context object with no-op methods (`fillRect`, `drawImage`, `arc`, etc.) and `measureText` returning `{ width: 0 }`. |
| `IntersectionObserver` | Kept for test controllability — happy-dom has it but without real layout, callbacks don't fire meaningfully. | A class with no-op `observe()`, `unobserve()`, `disconnect()` methods. |
| `ResizeObserver` | Same reasoning as IntersectionObserver — our stub is simpler and predictable. | A class with no-op `observe()`, `unobserve()`, `disconnect()` methods. |

**Not stubbed (happy-dom provides natively):** `window.matchMedia` — happy-dom implements it since v9.19.0. Individual tests can still override it with `Object.defineProperty` when they need `matches: true`.

#### Animation Library Mocks (GSAP)

GSAP is the animation engine for this project. It relies heavily on DOM measurement (`getBoundingClientRect`, computed styles, scroll position) that jsdom can't provide. The setup mocks the entire GSAP ecosystem:

| Mock | What It Replaces | What It Returns |
|------|-----------------|-----------------|
| `gsap` | Core animation engine | `gsap.from()`, `gsap.to()`, `gsap.fromTo()` return objects with a `kill()` spy. `gsap.timeline()` returns a chainable mock timeline. `gsap.registerPlugin()` is a spy. |
| `gsap/ScrollTrigger` | Scroll-linked animations | `ScrollTrigger.create()` returns `{ kill: spy }`. `refresh()`, `getAll()`, `killAll()` are spies. |
| `gsap/MotionPathPlugin` | SVG motion path animations | Empty object (just needs to exist for registration). |
| `gsap/DrawSVGPlugin` | SVG stroke drawing animations | Empty object. |
| `gsap/CustomEase` | Custom easing curves | `CustomEase.create()` returns the string `'custom'`. |
| `gsap/MorphSVGPlugin` | SVG shape morphing | `convertToPath()` returns `[]`. |
| `gsap/SplitText` | Text splitting for character/word animation | A class with empty `chars`, `words`, `lines` arrays and a `revert()` spy. |

#### 3D / WebGL Mocks (Threlte)

Threlte is a Svelte wrapper around Three.js. WebGL is completely unavailable in jsdom.

| Mock | What It Replaces | What It Returns |
|------|-----------------|-----------------|
| `@threlte/core` | 3D scene rendering (Canvas, T, useTask, useThrelte) | No-op functions. `useThrelte()` returns a fake context with scene, renderer, camera, and size. |
| `@threlte/extras` | 3D model loading (useGltf) | `useGltf()` returns a fake Svelte store with `subscribe` and `set` spies. |
| `postprocessing` | Post-processing effects (bloom, etc.) | `EffectComposer`, `EffectPass`, `RenderPass`, `BloomEffect` are all no-op constructors. |

#### Other Mocks

| Mock | What It Replaces | What It Returns |
|------|-----------------|-----------------|
| `lottie-web` | Lottie JSON animation player | `loadAnimation()` returns an object with `play()`, `stop()`, `goToAndStop()`, `destroy()`, `setSpeed()` spies and `totalFrames: 60`. |

### Test Boundaries

**What Vitest tests cover:**
- Component structure: does the right HTML render with the right props?
- Data integrity: are all slugs unique? Do cross-references between services and projects resolve?
- Action behavior: does a Svelte action attach the right event listeners and call GSAP correctly?
- Store logic: does a readable store update when its inputs change?
- Accessibility: are `aria-*` attributes, roles, and semantic HTML correct?

**What Vitest tests do NOT cover:**
- Visual appearance: colors, layout, font rendering, animations playing correctly.
- Real GSAP animation output: tests verify that `gsap.from()` was called with the right parameters, not that the element actually moved.
- Real browser behavior: scroll events, intersection observers, and media queries are all stubbed.
- End-to-end flows: navigation between pages, form submissions, real network requests.

Visual and animation correctness is deferred to Playwright E2E tests (planned for slice 10+).

---

## Test Files by Area

### Data Layer (`src/lib/data/`) — 6 files, 85 tests

These tests validate that the seed data files (projects, services, blog posts, locale strings, metro stops) are structurally correct. They catch human errors — duplicate slugs, missing fields, broken cross-references — at test time instead of in production.

| File | Tests | What It Covers |
|------|-------|----------------|
| `content.test.ts` | 10 | Validates the static content objects (hero, about, CTA, skills journey) have non-empty English strings and required fields. |
| `data-integrity.test.ts` | 33 | The most comprehensive data test. Validates uniqueness, required fields, enum values, cross-references between projects ↔ services, blog post dates, and site metadata. |
| `locale.test.ts` | 10 | Tests the `resolveLocale()` function: correct locale selection, fallback to English on missing/empty/whitespace translations, and the `SUPPORTED_LOCALES` constant. |
| `metro.test.ts` | 9 | Validates the metro line model: correct stop count, sequential numbering, hero/terminal stops, and label formatting functions. |
| `metro-network.test.ts` | 8 | Validates the metro network graph: unique node IDs, valid coordinate ranges, connection integrity, and minimum density. |
| `projects.test.ts` | 16 | Tests the project query functions: `getProjectBySlug`, `getFeaturedProjects`, `getPublicProjects`, `getAllTags`, `getProjectsByService`, `getServiceIdsForProjects`. Verifies filtering, sorting, and edge cases. |

### Components (`src/lib/components/`) — 19 files, 117 tests

Component tests follow a consistent pattern: render the component with props, query the DOM, and assert structure. They verify that the right elements render, props affect output, events fire callbacks, and accessibility attributes are present.

| File | Tests | What It Covers |
|------|-------|----------------|
| `BlogRow.test.ts` | 8 | Renders post title, date, tags, station badge numbering, metro line connector, and featured vs normal padding. |
| `CollapsibleSection.test.ts` | 5 | Renders title, numbered badge, toggle behavior (click expands/collapses), non-collapsible mode (no button), and custom accent color. |
| `FilterGroup.test.ts` | 5 | Renders label/items/"All" button, highlights active filter, fires `onSelect` callback on click, handles deselection. |
| `Footer.test.ts` | 5 | Renders footer landmark, brand name, dynamic year, GitHub and LinkedIn links with correct hrefs and `target="_blank"`. |
| `GradientSeparator.test.ts` | 3 | Renders gradient line, optional label, and absence of label when prop omitted. |
| `Hero.test.ts` | 8 | Renders h1 heading, subheading, primary/secondary CTAs with correct hrefs, CTA visibility combinations (none, one, both). |
| `Nav.test.ts` | 10 | Renders nav landmark, wordmark with link to `/`, orange dot, all nav links with correct hrefs, `aria-current="page"` on active link, hamburger toggle, animated letters container. |
| `ProjectCard.test.ts` | 8 | Renders title, one-liner, link to `/work/[slug]`, tags, status badges (public/wip/private), empty tags, long title. |
| `ProjectGrid.test.ts` | 4 | Renders correct card count, project titles, empty state, single-project case. |
| `ProofStrip.test.ts` | 4 | Renders project count, titles, links to `/work/[slug]`, and "Built with this" label. |
| `ScrollPrompt.test.ts` | 3 | Renders without crashing, has `aria-label="Scroll down"`, contains an SVG chevron. |
| `SectionHeader.test.ts` | 4 | Renders title as h2, optional subtitle, absence of subtitle, long title. |
| `ServiceCard.test.ts` | 6 | Renders title, description, station counter ("Service 01 / 06"), stack pills, deep-dive link, SVG container. |
| `ServiceNav.test.ts` | 5 | Renders prev/next navigation links with correct hrefs and titles, gracefully omits prev or next when undefined. |
| `ServiceStation.test.ts` | 12 | Renders title, description, testid, Lottie container (present/absent based on icon), related public project cards, empty/private project filtering, station number badge, indicator light, Lottie inside scrub zone. |
| `SkillsJourney.test.ts` | 6 | Renders journey container, panels from data, CTA prompt + button linking to `/contact`, skill icons, panel labels. |
| `StationTabs.test.ts` | 4 | Renders tab per service with short name, station numbers, active tab marking, link mode for navigation. |
| `TableOfContents.test.ts` | 10 | Renders desktop and mobile ToC, mobile expand toggle, heading id injection, existing id preservation, empty/no-heading HTML, scroll-into-view on click, duplicate heading dedup, custom class. |
| `TagList.test.ts` | 5 | Renders all tags, empty/missing tags produce no output, single tag uses list, proper `<ul>`/`<li>` semantics. |

### Motion (`src/lib/motion/`) — 16 files, 110 tests

Motion tests verify that Svelte actions and animation utilities correctly attach event listeners, call GSAP with the right parameters, and clean up on destroy. They also test reduced-motion and touch-device guards.

**Actions** (`src/lib/motion/actions/`) — 6 files, 43 tests

| File | Tests | What It Covers |
|------|-------|----------------|
| `boop.test.ts` | 7 | Hover scale/rotate effect: sets transform on mouseenter, resets after duration, rotation support, destroy cleanup, reduced-motion guard, `update()` changes params. |
| `cursorGlow.test.ts` | 4 | Cursor-following glow: sets `--glow-x`/`--glow-y` CSS vars on pointermove, resets on pointerleave, disabled on touch/reduced-motion. |
| `magnetic.test.ts` | 6 | Magnetic pull effect: applies translate transform on mousemove within radius, clears on mouseleave/destroy, disabled on touch/reduced-motion. |
| `reveal.test.ts` | 10 | Scroll-reveal animation: calls `gsap.from()` with correct directional offsets (up/down/left/right), converts ms delay to seconds, kills tween on destroy, skips animation and shows element immediately on reduced-motion. |
| `ripple.test.ts` | 6 | Click ripple effect: sets relative positioning, appends colored span on click, removes span after duration, disabled on reduced-motion, uses brand orange by default. |
| `tilt.test.ts` | 8 | 3D tilt effect: applies perspective/rotateX/rotateY on mousemove, resets on mouseleave/destroy, respects maxDeg, dead-zone at center, disabled on touch/reduced-motion. |

**Components** (`src/lib/motion/components/`) — 2 files, 13 tests

| File | Tests | What It Covers |
|------|-------|----------------|
| `LottiePlayer.test.ts` | 8 | Renders container with testid, `role="img"`, aria-label, accepts src/trigger/loop/speed props without error, has correct CSS class. |
| `ScrollRail.test.ts` | 5 | Renders rail container, home page shows no dots or progress bar, subpages show progress bar but no dots. |

**Stores** (`src/lib/motion/stores/`) — 2 files, 16 tests

| File | Tests | What It Covers |
|------|-------|----------------|
| `reducedMotion.test.ts` | 8 | `prefersReducedMotion` store: readable interface, returns false/true based on OS setting, registers/removes change listener. `isPrefersReducedMotion()` helper: returns correct boolean. |
| `scroll.test.ts` | 8 | `scrollProgress` store: returns 0 at top, 1 at bottom, 0.5 at halfway, 0 when no scrollbar, value clamped to [0,1], updates on scroll event. |

**SVG** (`src/lib/motion/svg/`) — 4 files, 21 tests

| File | Tests | What It Covers |
|------|-------|----------------|
| `MetroNetwork.test.ts` | 1 | Renders the container div. (SVG is fetched async — full DOM testing requires E2E.) |
| `Train.test.ts` | 8 | Renders SVG with correct id, all 7 animated group ids present, custom class prop, `aria-hidden="true"`, TRAIN_TARGETS selectors resolve, 3 radial gradients, 12 wheel circles. |
| `TrainJourney.test.ts` | 4 | Renders without crashing, correct testid, contains SVG, has wrapper div. |
| `train-path.test.ts` | 9 | `getTrainMotionPath()`: generates valid SVG path starting with `M`, correct curve commands for various station counts, starts off-screen top, ends off-screen bottom, x coords near right edge, custom dimensions, 0-station edge case. |

**Utils** (`src/lib/motion/utils/`) — 2 files, 19 tests

| File | Tests | What It Covers |
|------|-------|----------------|
| `gsap.test.ts` | 11 | `registerGsapPlugins()`: calls `gsap.registerPlugin` once with all 7 plugins, idempotent on repeated calls. Re-exports gsap, ScrollTrigger, MotionPathPlugin, DrawSVGPlugin, CustomEase, SplitText, MorphSVGPlugin, Flip. |
| `stagger.test.ts` | 8 | `stagger()`: index 0 always returns 0, linear delay when deterministic, randomized results stay within configured range, never negative, zero baseDelay, custom randomRange, defaults to randomize:true. |

### Routes (`src/routes/`) — 1 file, 17 tests

| File | Tests | What It Covers |
|------|-------|----------------|
| `home.test.ts` | 17 | Renders the full home page: app root, hero banner with badge/headline/dot/subtitle/CTAs/SQL decoration, metro network container, all 4 station sections with service titles, featured work section, about bento section, blog feed section, terminal CTA with links. |

---

## Common Patterns

### How Component Tests Work

Every component test follows the same three steps:

1. **Import** the component and `render`/`screen` from `@testing-library/svelte`.
2. **Render** the component with props: `render(MyComponent, { props: { ... } })`.
3. **Query** the DOM using `screen.getByText()`, `screen.getByTestId()`, `screen.getByRole()`, etc.
4. **Assert** with `expect(element).toBeInTheDocument()` (from jest-dom) or `expect(value).toBe(...)`.

Real example from `Footer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Footer from './Footer.svelte';

describe('Footer', () => {
  it('renders the current year', () => {
    render(Footer);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
```

### How Mocks Are Used

**Global mocks** (from `src/tests/setup.dom.ts`) are active in every DOM project test file. They handle libraries that crash on import in happy-dom — GSAP, Threlte, lottie-web, postprocessing. You don't need to set these up per-file. Data project tests do not have these mocks.

**Per-test overrides** are used when a test needs a specific value. The most common override is `window.matchMedia` to simulate reduced-motion preferences:

```typescript
// Override the global matchMedia stub for this specific test
function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })
  });
}

it('does nothing when prefers-reduced-motion is on', async () => {
  mockMatchMedia(true);      // Override: reduced motion ON
  vi.resetModules();          // Force re-import with new matchMedia
  const { boop } = await import('./boop.js');
  // ... test that boop does nothing
});
```

Key pattern: when a module reads `matchMedia` at import time, you must call `vi.resetModules()` after changing the mock, then use dynamic `import()` to get a fresh module instance.

### How to Add a New Test

1. **Create the file** next to the code it tests:
   - Component: `src/lib/components/MyThing.test.ts`
   - Utility: `src/lib/motion/utils/myUtil.test.ts`
   - Data: `src/lib/data/myData.test.ts`

2. **Name it** `[ModuleName].test.ts`. Use the same name as the source file.

3. **Write the test:**
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { render, screen } from '@testing-library/svelte';
   import MyComponent from './MyComponent.svelte';

   describe('MyComponent', () => {
     it('renders the title', () => {
       render(MyComponent, { props: { title: 'Hello' } });
       expect(screen.getByText('Hello')).toBeInTheDocument();
     });
   });
   ```

4. **Run it in isolation:**
   ```bash
   bun run test -- --run src/lib/components/MyComponent.test.ts
   ```

5. **Update `docs/TESTS.md`** with the new test entries.

No additional configuration is needed — the `include` globs in each Vitest project pick up test files automatically. Data tests go in `src/lib/data/`, component tests go in `src/lib/components/`, and motion tests go in `src/lib/motion/`.

---

## Quick Reference

| Command | What It Does |
|---------|-------------|
| `bun run test` | Run all tests (both projects) once and exit |
| `bunx vitest run --project data` | Run only data project tests |
| `bunx vitest run --project dom` | Run only DOM project tests |
| `bunx vitest run src/lib/components/Footer.test.ts` | Run one specific test file |
| `bun run test:watch` | Re-run tests on file changes (interactive mode) |
| `bunx vitest run --reporter=verbose` | Show every test name instead of just pass/fail counts |
| `bun run check` | Run `svelte-check` for type errors (not tests, but required before commits) |

### Key Imports

| Import | From | Purpose |
|--------|------|---------|
| `describe`, `it`, `expect`, `vi` | `vitest` | Test structure, assertions, mocking |
| `render`, `screen`, `fireEvent` | `@testing-library/svelte` | Render Svelte components and query the DOM |
| `get` | `svelte/store` | Read the current value of a Svelte store |
| `toBeInTheDocument`, `toHaveAttribute` | `@testing-library/jest-dom/vitest` | Extended DOM assertions (loaded globally by setup) |

### Query Priority

When querying rendered components, prefer queries in this order (most accessible to least):

1. `screen.getByRole('link', { name: 'Work' })` — accessible queries
2. `screen.getByText('Hello')` — visible text
3. `screen.getByTestId('my-element')` — data-testid attributes
4. `container.querySelector('.my-class')` — CSS selectors (last resort)
