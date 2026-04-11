# Slice 04 — Motion Infrastructure + Component Enhancement

**Status:** ready
**Priority:** 1
**Estimated effort:** 1-2 sessions
**Depends on:** 02 (complete), 03 (complete)

## Objective

Install the animation toolkit, build reusable motion primitives, update the Service interface for the train journey, and wire motion behavior into the existing components from slice 03. After this slice, every component has animation built in and the motion system is ready for page composition.

## Context

Slice 03 built 6 static UI components. This slice brings them to life. The motion system has four layers defined in `docs/reference/MOTION.md`:

1. **Threlte (atmosphere)** — 3D background, built in slice 06
2. **GSAP (choreography)** — scroll-linked movement, section reveals, built here
3. **Lottie (illustration)** — station icons, built here
4. **Svelte actions (interaction)** — hover boops, magnetic cursor, click ripple, built here

This slice builds layers 2-4. Layer 1 (Threlte/3D) gets installed but the actual 3D scene is slice 06.

The Service interface also needs updating: the train journey requires `id`, `station`, and `relatedProjects` fields that weren't in the original slice 02 build.

4 Lottie JSON files are already in `src/lib/assets/lottie/` (station-sql.json, station-pipeline.json, station-analytics.json, station-performance.json). These have been recolored to the brand palette (#E07800, #FFB627, #C96A00, #F5F5F0, dark grays).

### Critical Architecture Rule: Data-Driven Stations

The station system must be fully data-driven. The number of stations is determined by the services array, not hardcoded anywhere. This means:

- Adding a new service = adding one object to `services.ts` + one Lottie JSON file. Zero component or layout changes.
- The home page, scroll rail, train path, and Threlte nodes all derive from `services.length` and service data.
- No `if station === 1` logic. No hardcoded station count. No magic number 4.
- Components iterate over the services array. The array is the source of truth.

This rule applies to every slice from here forward.

## Acceptance Criteria

- [ ] GSAP + ScrollTrigger installed and registered
- [ ] Threlte (@threlte/core, @threlte/extras) + Three.js installed
- [ ] lottie-web installed
- [ ] `src/lib/motion/` directory structure created per MOTION.md section 12
- [ ] `use:boop` Svelte action: applies a brief transform on hover that resets after ~300ms (MOTION.md section 4)
- [ ] `use:reveal` Svelte action: scroll-triggered entrance animation using GSAP ScrollTrigger (MOTION.md section 4)
- [ ] `use:magnetic` Svelte action: subtle element pull toward cursor on desktop, disabled on touch/reduced-motion (MOTION.md section 4)
- [ ] `use:ripple` Svelte action: orange ripple effect on click (MOTION.md section 4)
- [ ] `prefersReducedMotion` store: reads OS preference, reactive (MOTION.md section 10)
- [ ] Scroll position/progress store
- [ ] Stagger timing utility: calculates delay arrays with slight randomization (MOTION.md section 2)
- [ ] `LottiePlayer.svelte` component: generic wrapper for lottie-web, accepts src/trigger/loop/speed props (MOTION.md section 13)
- [ ] Service interface updated with `id` (string), `station` (number, sequential starting from 1), `relatedProjects` (string[], slugs)
- [ ] Service data file updated with new fields for all existing services
- [ ] Existing data integrity tests updated to cover new Service fields (unique ids, unique sequential station numbers, valid relatedProjects slugs)
- [ ] Motion behavior added to existing components: boop on ProjectCard hover, stagger entrance on TagList
- [ ] All motion respects `prefers-reduced-motion` (actions return early, animations skip)
- [ ] Unit tests for all actions, stores, and utilities
- [ ] All tests pass with `bun run test`
- [ ] tree.txt updated
- [ ] Dev log written
- [ ] Handoff report written with "What Was Built", "Files Modified", and "Learn" sections

## Technical Spec

### Libraries to Install

- `gsap` (includes ScrollTrigger, MotionPathPlugin)
- `@threlte/core` + `@threlte/extras` + `three`
- `@types/three` (dev dependency)
- `lottie-web`

### Motion Directory Structure

Follow MOTION.md section 12:

```
src/lib/motion/
├── actions/        (boop, reveal, magnetic, ripple)
├── stores/         (scroll, reducedMotion)
├── components/     (LottiePlayer)
├── three/          (empty for now, used in slice 06)
└── utils/          (gsap registration, stagger calculator)
```

### Svelte Actions

All actions follow the pattern in MOTION.md section 12: check `prefersReducedMotion`, set up on mount, clean up on destroy. Each action accepts configuration params with sensible defaults.

Reference MOTION.md section 13 for the target API:
- `use:boop={{ scale: 1.05, rotation: 5, timing: 300 }}`
- `use:reveal={{ direction: 'up', delay: 200 }}`
- `use:magnetic={{ strength: 3, radius: 50 }}`
- `use:ripple={{ color: '#E07800' }}`

### Stores

- `prefersReducedMotion`: wraps `window.matchMedia('(prefers-reduced-motion: reduce)')`, reactive, SSR-safe
- `scrollProgress`: tracks scroll position as 0-1 value, updated on scroll event, SSR-safe

### LottiePlayer Component

Generic wrapper for lottie-web. Props per MOTION.md section 13:
- `src` (string, path to JSON file)
- `trigger` ('scroll' | 'mount' | 'hover')
- `loop` (boolean)
- `speed` (number, default 1)

The component must be fully generic. It doesn't know what animation it's playing. It receives a path and plays it.

The 4 station Lottie files already exist at `src/lib/assets/lottie/`.

### Service Interface Update

Add to the existing Service interface in `src/lib/data/types.ts`:
- `id` (string, unique identifier)
- `station` (number, position in the train journey, sequential starting from 1)
- `relatedProjects` (string array of project slugs to show at each station)

**Important:** The `station` field is NOT capped at 4. It's a sequential number that grows with the services array. If a 5th service is added later, it gets `station: 5`. No code anywhere should assume a maximum station count. Tests should validate uniqueness and sequential ordering, not a fixed range.

Update `src/lib/data/services.ts` with the new fields for all existing services. Current station assignment:
1. SQL development & optimization
2. Data pipeline architecture
3. Analytics & reporting systems
4. Database performance tuning

### Component Enhancement

Add motion to existing components from slice 03:
- `ProjectCard`: add `use:boop` on hover
- `TagList`: add stagger entrance using `use:reveal` with stagger utility delays
- Other components get motion when composed into pages (slices 05-08), not here

### Tests

- Each action: verify it applies/removes transforms, verify it skips when reduced motion is on
- `prefersReducedMotion` store: returns boolean, reacts to changes
- `scrollProgress` store: returns 0-1 range
- Stagger utility: correct number of delays, randomization within bounds, configurable base delay
- LottiePlayer: renders without errors, accepts props
- Service data integrity:
  - `id` values are unique across all services
  - `station` values are unique, sequential (1, 2, 3, ..., N), no gaps
  - `station` count equals `services.length` (every service has a station)
  - `relatedProjects` contain valid slugs that exist in the projects array
  - No hardcoded upper bound on station count

## Out of Scope

- No 3D scene (slice 06). Threlte is installed but no scene components are built.
- No SVG train (slice 06)
- No ScrollRail component (slice 05)
- No page composition (slices 05-08)
- No scroll-linked 3D behavior
- No FLIP animation on ProjectGrid (that's wired in slice 07)
- ServiceStation component is NOT built here (that's a new component for slice 05 or 06 that replaces ServiceCard in the train journey context)

## Learn

### Svelte Actions (`use:directive`)
**What it is:** A function you attach to a DOM element with `use:`. It runs when the element mounts and can clean up when it unmounts. `use:boop` means "when this element appears, set up the boop behavior. When it disappears, tear it down."
**Why it matters:** Actions are like database triggers. They're side effects that fire automatically when conditions are met (element enters DOM = INSERT trigger, element leaves = DELETE trigger). They keep behavior separate from markup.
**Try this:** After the slice is built, add `use:boop` to any element in `+page.svelte`. Hover over it. Remove it. See the difference.
**Go deeper:** https://svelte.dev/docs/svelte/use

### prefers-reduced-motion
**What it is:** An OS-level setting that says "I prefer less animation." The `prefersReducedMotion` store reads this and every action checks it before animating.
**Why it matters:** Some people get motion sick from animations. Some have cognitive disabilities. Respecting this preference isn't optional. It's like adding wheelchair access: it doesn't change the building, it makes it usable by more people.
**Try this:** On Windows: Settings > Accessibility > Visual effects > Animation effects (turn off). Reload the site. Hover a ProjectCard. The boop should not fire. Turn it back on, reload, hover again.
**Go deeper:** https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

### GSAP ScrollTrigger
**What it is:** A GSAP plugin that links animations to scroll position. "When this element enters the viewport at 80%, fade it in." The scroll IS the playhead.
**Why it matters:** The entire home page train journey is scroll-driven. Every station reveals when you scroll to it. ScrollTrigger is the engine. Think of scroll position like a cursor moving through a query result set. Each row (section) processes as the cursor advances.
**Try this:** After slice is built, find a `use:reveal` element in the code. Change the direction from 'up' to 'left'. Scroll to it. See it slide in from the left instead.
**Go deeper:** https://gsap.com/docs/v3/Plugins/ScrollTrigger/

### Data-Driven Architecture
**What it is:** The station system reads from data, not from hardcoded templates. Adding a 5th service means adding one object to `services.ts` and one Lottie file. The home page, scroll rail, train path, and 3D nodes all adapt automatically.
**Why it matters:** Same reason you normalize a database. If station count is hardcoded in 5 files, adding a service means finding and updating 5 files. If it's data-driven, it's one file. DRY principle applied to UI architecture.
**Try this:** After the slice is built, temporarily add a 5th service to `services.ts` with `station: 5`. Run `bun run test`. The data integrity tests should pass. Remove it. (The home page won't render it yet since page composition is slice 06, but the data layer should accept it.)
**Go deeper:** You already know this from SQL. A view doesn't hardcode row counts. Neither should a component.

## Verify

1. `bun run test` passes all new + existing tests
2. `bun run check` passes (TypeScript)
3. `bun run dev`: hover a ProjectCard, see the boop
4. Scroll down, see reveal animations on elements with `use:reveal`
5. Disable OS animation preference, reload, confirm no motion fires
6. Service data has sequential station numbers and valid relatedProjects slugs
7. Adding a temporary 5th service with `station: 5` to `services.ts` passes all data integrity tests
8. `src/lib/motion/` directory structure matches MOTION.md section 12
9. tree.txt reflects all new files
