# Patterns

Reusable solutions discovered during implementation. Consult this before writing specs and during implementation to avoid re-solving solved problems.

## How to use this file

- **Before writing a spec:** Check if the problem already has a known pattern
- **During implementation:** Check if a pattern applies before inventing a new approach
- **After a slice:** Add any new patterns discovered during iteration

## How to add a pattern

When a slice handoff introduces a workaround, a non-obvious fix, or a reusable approach:

1. Give it a short descriptive name
2. Document: what went wrong, what fixed it, where to see it, when to reuse it
3. Add it to the appropriate section below

---

## Animation Patterns

### Entrance Animation Hover Guard
**Discovered in:** Slice 09c-2b
**Problem:** Hover/tap handlers fire during SVG entrance animations, causing visual glitches (morph interrupts draw-fill sequence)
**Solution:** Add `entranceDone` boolean flag. Guard all hover/tap handlers with `if (!entranceDone) return`. Set flag in timeline's `onComplete` callback.
**Files:** `BlogSvgIcon.svelte`, `WorkSvgIcon.svelte`
**Reuse when:** Any component with an entrance animation that also has interactive states (hover, click, drag)

### FLIP Animation + Tilt Conflict
**Discovered in:** Slice 09c-1
**Problem:** `use:tilt` applied to the same element as FLIP animation targets causes cards to get stuck (absolute positioning + transform conflicts)
**Solution:** Move `use:tilt` to an inner wrapper element, not the FLIP target. Remove `absolute:true` from FLIP config. Kill competing reveal tweens before FLIP runs.
**Files:** `WorkCard.svelte`, `WorkListingPage.svelte`
**Reuse when:** Any list with both filter/sort animations (FLIP) and hover interactions on the same cards

### Scroll-Linked Media
**Discovered in:** Slice 06b
**Problem:** Need video or animation to advance based on scroll position, not time
**Solution:** Set `<video>.currentTime = scrollProgress * video.duration` inside a ScrollTrigger `onUpdate`. Same concept works for Lottie (`lottie.goToAndStop(frame)`) and any time-based media. LottiePlayer has `scrub` + `progress` props for this.
**Files:** `LottiePlayer.svelte`, `ServiceStation.svelte`
**Reuse when:** Any media that should advance with scroll (video, Lottie, sprite sheet, CSS animation)

### containerAnimation: Per-Word Triggers
**Discovered in:** Slice B (4 iterations)
**Problem:** In GSAP horizontal scroll with `containerAnimation`, using the paragraph element as `trigger` causes all word animations in a panel to fire based on when the paragraph enters. Words at the end of the sentence animate off-screen.
**Solution:** Use the actual word element (`trigger: hw`) instead of the paragraph (`trigger: el`). Each word animates when IT enters the viewport. Also: Panel 1 (already visible when section pins) needs standard vertical ScrollTrigger, not `containerAnimation`.
**Files:** `SkillsJourney.svelte`
**Reuse when:** Any horizontal scroll with per-element animations inside a `containerAnimation` context

### SplitText Cleanup Order
**Discovered in:** Slice B
**Problem:** SplitText instances must revert in reverse order (inner before outer). The outer SplitText wraps the paragraph; inner SplitTexts wrap individual highlight words into chars. Reverting outer first restores HTML that invalidates inner references.
**Solution:** Always revert inner SplitText instances before outer ones in cleanup functions.
**Files:** `SkillsJourney.svelte`
**Reuse when:** Any nested SplitText usage (paragraph-level + word-level splits)

### GSAP Timeline Extension (Beyond 1.0)
**Discovered in:** Slice C
**Problem:** Need to add animation phases after an existing GSAP timeline without changing the timing of existing phases.
**Solution:** Add tweens after position 1.0 — this extends `totalDuration`. With `scrub: 1`, scroll maps proportionally, so existing phases keep their exact pacing. No remapping needed.
**Files:** `HeroBanner.svelte`
**Reuse when:** Extending a scroll-linked timeline with new phases without touching existing phase timing

### Conditional Scroll Handler (Lenis desktop / normalizeScroll mobile)
**Discovered in:** Slice 13 (scroll smoothness fix)
**Problem:** Lenis and `ScrollTrigger.normalizeScroll()` both intercept scroll events — using both causes jank, double-smoothing, and broken pin calculations. Mobile also needs browser chrome (address bar) prevention that Lenis can't provide.
**Solution:** Check `ScrollTrigger.isTouch > 0` at init. Desktop: Lenis with `autoRaf: false` + GSAP ticker bridge. Mobile: `normalizeScroll(true)` for stable pins and chrome prevention. Never combine both. Use `ScrollTrigger.config({ ignoreMobileResize: true })` as a safety net. Use `scrub: true` on desktop (Lenis provides smoothing), `scrub: 0.5` on mobile (small buffer for touch).
**Files:** `lenis.ts`, `gsap.ts`, `HeroBanner.svelte`
**Reuse when:** Any site using Lenis + GSAP ScrollTrigger with pinned scroll-driven animations

### Viewport-Responsive Typography: min(vw, vh)
**Discovered in:** Slice 13 (hero text sizing)
**Problem:** `clamp()` with `vw` only doesn't account for short viewports (13" laptops, tablets in landscape). Text overflows vertically.
**Solution:** Use `clamp(min, min(Xvw, Yvh), max)` so font size scales with whichever dimension is smaller. Account for fixed elements (navbar) by reducing the `vh` factor or adding `py-[max(Nvh, Nrem)]` padding.
**Files:** `HeroBanner.svelte`
**Reuse when:** Any large display text that needs to fit within a viewport-height-constrained area across varied screen sizes

### Velocity-Driven Visual Effects
**Discovered in:** Slice 06b
**Problem:** Need visual feedback proportional to scroll speed (glow, blur, etc.)
**Solution:** `ScrollTrigger.getVelocity()` returns pixels/second. Normalize by dividing by a max (e.g., 3000) and clamping to 0-1. Pass as a CSS custom property (`--train-glow`) for `drop-shadow` or `filter` intensity.
**Files:** `TrainJourney.svelte`
**Reuse when:** Any element that should respond to scroll speed (particles, glow, blur, parallax intensity)

### GSAP `onComplete` with Stagger
**Discovered in:** Slice 09c-2b
**Problem:** `gsap.to()` with `stagger` fires `onComplete` per-element, not once for the whole batch. This breaks "entrance done" flags.
**Solution:** Wrap staggered animations in `gsap.timeline()`. The timeline's `onComplete` fires once after all children finish.
**Files:** `BlogSvgIcon.svelte`, `WorkSvgIcon.svelte`
**Reuse when:** Any staggered animation that needs a single "all done" callback

### SVG ViewBox Cropping for Mobile Scale
**Discovered in:** Slice 13 (closing session)
**Problem:** Wide landscape SVGs (e.g., 1821×1260 metro map) render tiny on portrait mobile screens because `preserveAspectRatio="xMidYMid meet"` scales to fit the narrow width.
**Solution:** Detect mobile at mount time and set a tighter viewBox (e.g., `972 300 600 600` vs `0 0 1821 1260`). To keep a focal point at the same percentage position, calculate: `viewBoxX = focalX - (percent × newWidth)`. Same aspect ratio → same rendered pixel size, but fewer SVG units → elements appear proportionally larger.
**Files:** `MetroNetwork.svelte`
**Reuse when:** Any SVG that needs to appear bigger on mobile without CSS transforms or duplicate assets

### SVG DOM Order Affects Stagger Animation
**Discovered in:** Slice 13 (closing session)
**Problem:** GSAP `stagger` animates elements in DOM order from `querySelectorAll`. Elements added at the end of an SVG (e.g., REM line stations) animate visually last, creating a delayed appearance.
**Solution:** Reorder SVG elements so new additions are interspersed with existing ones rather than appended at the end. This ensures stagger distributes evenly across all elements.
**Files:** `static/images/montreal-metro.svg`
**Reuse when:** Any SVG with staggered GSAP animations where new elements should animate simultaneously with existing ones

---

## SVG Patterns

### SVG Paint-Server in SPA
**Discovered in:** Slice 09c-2b
**Problem:** SVG gradients using `url(#gradient-id)` break during SvelteKit SPA navigation because the base URL changes, making the fragment reference invalid
**Solution:** Use direct color values instead of gradient references on elements that appear across routes. If gradients are essential, use unique IDs per component instance or inline the gradient definition.
**Files:** `WorkListingPage.svelte` (metro lines changed from gradient to direct color)
**Reuse when:** Any SVG with `url(#id)` references that appears on pages reached via client-side navigation

### SVG Inline Fetch for DOM Access
**Discovered in:** Slice A (2 iterations)
**Problem:** Need GSAP to target individual SVG elements (paths, circles, groups) but `<img src="file.svg">` doesn't expose DOM nodes.
**Solution:** Fetch the SVG file as text, inject via `innerHTML` into a container div. This gives full DOM access for GSAP `DrawSVGPlugin`, class-based targeting, and element queries.
**Files:** `MetroNetwork.svelte`, `HeroBanner.svelte`
**Reuse when:** Any SVG that needs GSAP animation on internal elements (not just the wrapper)

### MorphSVGPlugin Requires Path Elements
**Discovered in:** Slice B+
**Problem:** MorphSVGPlugin can only morph between `<path>` elements. SVG icons often contain `<rect>`, `<circle>`, `<line>`, etc.
**Solution:** Call `MorphSVGPlugin.convertToPath()` on the SVG container first. This converts all geometric elements to `<path>` equivalents, then morphing works. `<text>` elements can't morph — fade them separately.
**Files:** `SkillsJourney.svelte`, `BlogSvgIcon.svelte`
**Reuse when:** Any MorphSVGPlugin animation targeting SVGs with non-path elements

### Deterministic SVG Fallback from Slug Hash
**Discovered in:** Slice 07
**Problem:** Not every blog post has a custom SVG illustration, but showing nothing looks empty.
**Solution:** Hash the post slug to a number, mod by the fallback SVG count. Same slug always gets the same illustration, consistent across builds. No randomness, no manual assignment needed.
**Files:** `blog.ts` (`resolveSvgFallbackName`)
**Reuse when:** Any content type that needs a deterministic default asset based on an identifier

---

## Data / State Patterns

### Filter Reset with batchFired + $effect
**Discovered in:** Slice 09c-2b
**Problem:** "Clear all filters" button resets filter state but cards don't re-render because the reactive chain doesn't trigger a visibility recalculation
**Solution:** Add a `batchFired` counter that increments on clear. Include it as a dependency in the `$effect` that computes card visibility, forcing re-evaluation even when filter values reset to defaults.
**Files:** `WorkListingPage.svelte`
**Reuse when:** Any filter/search UI where resetting to default state needs to trigger a re-render

### CollapsibleSection syncOpen Bindable
**Discovered in:** Slice 09c-1
**Problem:** Table of Contents toggle doesn't sync with CollapsibleSection open/close state because the prop isn't two-way bound
**Solution:** Make `open` prop `$bindable()` in CollapsibleSection. Parent component uses `bind:open` and a `syncOpen` flag to toggle all sections simultaneously.
**Files:** `CollapsibleSection.svelte`, `WorkDetailPage.svelte`
**Reuse when:** Any component where a parent needs to control a child's open/close state AND the child can also toggle itself

### Data-Driven Station System
**Discovered in:** Slices 04, 06, 06d
**Problem:** Adding a new service required touching multiple components, layouts, and hardcoded counts
**Solution:** Everything derives from `services.length` and service data objects. Home page sections, scroll rail stations, train path stops, metro line nodes, and stop numbers all read from the same array. Adding a service = adding one object to `services.ts` + one Lottie JSON. Zero component or layout changes. `buildMetroLine()` in `metro.ts` computes all stop numbers and labels.
**Files:** `services.ts`, `metro.ts`, `+page.svelte`, `ScrollRail.svelte`
**Reuse when:** Any system where the number of items should drive layout, navigation, and animation without per-item code

### LocalizedString + resolveLocale Pattern
**Discovered in:** Slice 02
**Problem:** Adding i18n later means refactoring every interface, data file, and component.
**Solution:** Every user-visible text is `{ en: string; fr?: string; es?: string }` from day one. Components never read `.en` directly — they call `resolveLocale(field, locale)` which falls back to English. Like `COALESCE(fr_text, en_text)` in SQL. Adding a language = filling in optional fields, no schema changes.
**Files:** `types.ts`, `locale.ts`, all data files
**Reuse when:** Any project that might need i18n — build it into the data layer from the start

### Markdown Strip First H1
**Discovered in:** Slice 09c-2a
**Problem:** Blog markdown files include an `# H1` title that duplicates the page title rendered by the detail page component
**Solution:** Strip the first `<h1>` from the rendered markdown HTML before injecting into the page
**Files:** `BlogContent.svelte`, `blog/[slug]/+page.ts`
**Reuse when:** Any markdown-rendered content where the page template already renders the title

---

## Design System Patterns

### Brand Primitive Wiring
**Discovered in:** Slice 17a-2b (17 iterations)
**Problem:** Same brand patterns (buttons, cards, terminal chrome, metric displays) were reimplemented differently across 40+ files, leading to visual inconsistency and maintenance burden.
**Solution:** Build small, focused "brand primitive" components in `src/lib/components/brand/` that encode a single brand pattern each. Each primitive has typed props, `...rest` spread for customization, and uses tokens (never hardcoded values). Wire them into consumer components, replacing bespoke implementations. Import from barrel: `import { X } from '$lib/components/brand'`.
**Files:** `src/lib/components/brand/` (15 components), 40+ consumer files
**Reuse when:** Any project with visual patterns repeated across 3+ files — extract the pattern into a primitive component.
**Key decisions:**
- Svelte actions (`use:`) don't work on component tags — use wrapper div pattern: `<div use:action><Card>...</Card></div>`
- `ui/card` is the single card surface for all cards site-wide. `.prose-dark` remains as a utility class for prose styling.
- Barrel export pattern enables renaming internals without touching consumers

### cursorGlow Auto-Inject
**Discovered in:** Slice 17a-2b (W7)
**Problem:** 11 components manually created a `<div>` overlay with `pointer-events-none`, `position: absolute`, and a radial gradient that tracked mouse position — duplicating ~15 lines per file.
**Solution:** Created `cursorGlow` Svelte action that auto-injects the overlay div on mount, tracks mouse position via `mousemove`, and cleans up on destroy. Applied as `use:cursorGlow` on any element. Respects `prefers-reduced-motion` and skips on touch devices.
**Files:** `src/lib/motion/actions/cursorGlow.ts`, 11 consumer files
**Reuse when:** Any component that needs a mouse-tracking glow effect — one `use:cursorGlow` replaces 15 lines of markup + script.

---

## Layout Patterns

### Full-Viewport CSS Scroll-Snap
**Discovered in:** Slice 09
**Problem:** Need each section to lock into the viewport on scroll (station-by-station reveal)
**Solution:** Container gets `scroll-snap-type: y mandatory`, children get `scroll-snap-align: start` + `min-height: 100vh`. Combine with ScrollTrigger for scroll-position-aware state (active tab sync, metro line progress). CSS scroll-snap is more reliable than GSAP snap for this.
**Files:** `ServiceListingPage.svelte`
**Reuse when:** Full-page section reveals, product tours, vertical slideshows

### Metro Line + Dot Navigation
**Discovered in:** Slices 09, 09c-2a
**Problem:** Need a vertical visual connector between listed items with positioned indicator dots
**Solution:** Absolute-positioned vertical line (2px, brand color) with `::before` pseudo-element dots at each item's vertical center. Combined with `use:reveal` for staggered entrance animation.
**Files:** `ServiceListingPage.svelte`, `WorkListingPage.svelte`, `BlogListingPage.svelte`
**Reuse when:** Any vertical listing that needs visual connection between items (timelines, changelogs, step indicators)

### Absolute Positioning for Margin Content
**Discovered in:** Slice 08 (5 iterations)
**Problem:** Table of Contents needs to sit in the page margin without squishing the main content column.
**Solution:** Wrap the content section in `position: relative`. Position the ToC with `position: absolute; right: 100%`. Content stays full width, ToC floats in the left margin. Only visible at 2xl+ (1536px) where margin space exists; embedded inside content below that breakpoint.
**Files:** `WorkDetailPage.svelte`, `blog/[slug]/+page.svelte`
**Reuse when:** Any supplementary content (ToC, annotations, quick nav) that should sit in the page margin without affecting main content width

### CSS Grid Animation for Collapse/Expand
**Discovered in:** Slices 08, 09, 09c-1
**Problem:** Need smooth height animation for collapsible sections, but `height: auto` can't be animated with CSS transitions.
**Solution:** Use `grid-template-rows: 0fr` (collapsed) and `grid-template-rows: 1fr` (expanded) with `transition: grid-template-rows`. Inner element gets `overflow: hidden; min-height: 0`. Extracted into `CollapsibleSection.svelte` for reuse.
**Files:** `CollapsibleSection.svelte`, `FilterGroup.svelte`
**Reuse when:** Any collapsible/expandable section that needs smooth height animation

### Stacking Context Trap for Fixed Elements
**Discovered in:** Slice 06d (4 iterations)
**Problem:** CSS `animate-page-fade-in` on `<main>` creates a stacking context that captures `position: fixed` children. Their z-index becomes relative to the parent, not the viewport — footer can't paint over the fixed rail.
**Solution:** Skip the animation on pages with fixed-position children. Or move fixed elements outside the animated container. Any of `animation`, `opacity < 1`, `transform`, or `filter` on a parent creates this trap.
**Files:** `+layout.svelte`, `Footer.svelte`
**Reuse when:** Any page with both CSS animations/transforms on containers AND fixed-position children that need viewport-level z-index

---

## Component Patterns

### Shared Component with Mode Props
**Discovered in:** Slice 09
**Problem:** StationTabs needed to work as both scroll-position-aware tabs (services index) and navigation tabs (services detail).
**Solution:** Single component with a `mode` prop: `mode='scroll'` syncs active tab to scroll position, `mode='navigate'` makes tabs into links. Same visual, different behavior.
**Files:** `StationTabs.svelte`
**Reuse when:** Any UI element that appears in multiple contexts with different interaction models (tabs, nav bars, toolbars)

### Prop Injection for Testability
**Discovered in:** Slice 05
**Problem:** Components that read `$page.url.pathname` directly from SvelteKit stores are hard to test — you need to mock the entire store system.
**Solution:** Parent layout reads `$page` and passes `pathname` as a prop. Components accept the prop instead of reaching into global state. Same result, but the component is testable with plain prop injection.
**Files:** `Nav.svelte`, `ScrollRail.svelte`, `+layout.svelte`
**Reuse when:** Any Svelte component that reads from SvelteKit stores — pass the value as a prop for testability

### Dynamic Import for Browser-Only Libraries
**Discovered in:** Slices 04, 06
**Problem:** Libraries like `lottie-web` and Three.js access `document`/`window` on import, crashing SSR.
**Solution:** Use `import('lottie-web')` inside `onMount` or `$effect`. The dynamic import only executes in the browser. For Three.js, combine with a `matchMedia` check to skip the import entirely on mobile (zero download).
**Files:** `LottiePlayer.svelte`, `+page.svelte` (HeroScene dynamic import)
**Reuse when:** Any browser-only library that crashes during SSR or should be code-split for performance

### CSS Rotate Wrapper (Preserve Child Markup)
**Discovered in:** Slice 06b
**Problem:** Train SVG was horizontal but needed to display vertically. Modifying the SVG directly would break 8 existing tests and all GSAP selectors.
**Solution:** Wrap the component in a `<div>` with `transform: rotate(90deg)` via CSS. The child SVG markup and all GSAP targets remain unchanged. Zero test breakage.
**Files:** `TrainJourney.svelte`
**Reuse when:** Any component that needs orientation change without modifying its internals or breaking existing tests

### CSS Outline for Halos on Pulsing Box-Shadow Elements
**Discovered in:** Slice 17a-4
**Problem:** Tailwind's `ring-*` utility compiles to `box-shadow`. When an element also has a keyframe animation that animates `box-shadow` (e.g. `led-pulse` on a StatusDot), the animation's computed value clobbers the ring. Ring invisible; no error.
**Solution:** Use CSS `outline` for the static halo. `outline` is a separate decoration channel from `box-shadow`, so a pulsing glow and a static ring render together. Tailwind v4: `outline outline-[Npx] outline-[<color>]`.
**Files:** `src/lib/components/brand/StatusDot.svelte` (`ring` prop). See `docs/learn/styling/outline-vs-ring-pulsing-dots.md` for the full explanation.
**Reuse when:** Any element that needs a static hard-edged halo AND an animated `box-shadow` (focus halos, pulse glows, emphasis animations).

### CRLF-Tolerant Frontmatter Parser
**Discovered in:** Slice 17a-4
**Problem:** Content markdown files edited on Windows sometimes save with CRLF (`\r\n`) line endings. A strict frontmatter regex like `/^---\n([\s\S]*?)\n---\n/` doesn't match `---\r\n`, so the whole frontmatter block silently fails to parse. Downstream code sees empty title/date/tags; data-integrity tests start failing; the site renders posts with blank metadata — and nothing logs an error.
**Solution:** Make regexes CRLF-tolerant in any content parser. Use `\r?\n` instead of `\n`, and split lines on `/\r?\n/` instead of `'\n'`.
**Files:** `src/lib/data/blog.ts` (`parseFrontmatter`). Apply the same fix to any future markdown-parsing util in `src/lib/data/` or `src/content/`.
**Reuse when:** Any content parser that may be consumed on Windows or receive cross-platform commits. Pairs well with a pre-commit hook that normalizes LF, but the parser-level fix is the durable one.

---

## Testing Patterns

### svelteTesting() Plugin for Svelte 5 + Vitest
**Discovered in:** Slice 01
**Problem:** Svelte 5 has a client/server split. Node.js resolves `svelte` to `index-server.js` (SSR), which throws `mount() not available on server` when you try to render components in jsdom tests.
**Solution:** Add `svelteTesting()` from `@testing-library/svelte/vite` to Vitest config. It injects `browser` into `resolve.conditions` before `node`, making Svelte resolve to `index-client.js`.
**Files:** `vite.config.ts`
**Reuse when:** Any Svelte 5 project using Vitest with jsdom for component testing

### Global Test Setup for Browser APIs
**Discovered in:** Slices 01, 04, 06
**Problem:** jsdom is missing APIs that animation/3D libraries need: `matchMedia`, `IntersectionObserver`, canvas context, GSAP, lottie-web, Threlte.
**Solution:** Centralized mocks in `vitest.setup.ts`. Don't re-mock per-file unless overriding. Key mocks: `window.matchMedia` (returns `{ matches: false }`), `IntersectionObserver` (no-op), canvas (`getContext` stub), GSAP (timeline/ScrollTrigger/plugins), lottie-web (`loadAnimation` with `totalFrames`).
**Files:** `vitest.setup.ts`
**Reuse when:** Setting up any Vitest + jsdom project that uses animation, 3D, or browser-only APIs

### DOM Baseline Probe for Precise Glyph Positioning
**Discovered in:** Slice C (3 iterations)
**Problem:** At 100x+ zoom, a 5px offset in text character positioning becomes a 500px visual error. `getBoundingClientRect` center includes line-height padding, not the actual glyph position.
**Solution:** Two-step measurement: (1) DOM probe — zero-height `inline-block` at `vertical-align:baseline` finds the exact baseline Y. (2) Canvas `measureText` — `actualBoundingBoxAscent/Descent` gives the glyph's offset from baseline. Glyph center = baseline - ascent + glyphHeight/2.
**Files:** `HeroBanner.svelte`
**Reuse when:** Any text element that needs pixel-precise positioning (extreme zoom, alignment overlays, typographic animations)
