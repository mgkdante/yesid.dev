# yesid. Motion Reference

**Version:** 2.0 | 2026-04-17
**Supersedes:** v1.0 (April 2026 — motion-design manifesto with heavy Three.js/Threlte content, now stale)
**Design spec:** `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\specs\2026-04-16-slice-17e-motion-reengineering-design.md` (cloud mirror)
**Governance:** `docs/reference/CONSTITUTION.md` — Motion Doctrine — Snappy

v2.0 is the **implementation reference** for the motion layer after the Slice 17e re-engineering. v1.0 was an aesthetic manifesto that over time accumulated references to deleted systems (Three.js, Threlte, `use:reveal`, entrance-animation helpers). v2.0 documents what actually exists in `src/lib/motion/` and how to use it.

---

## 1. Overview

```
src/lib/motion/
├── actions/          — Svelte actions (interaction lane)
│   ├── boop.ts            — tap-shaped hover impulse
│   ├── cursorGlow.ts      — radial glow tracks cursor
│   ├── magnetic.ts        — element attracts toward cursor
│   ├── morphHover.ts      — SVG path morph on hover/tap (17e-5)
│   ├── wordmarkHover.ts   — SplitText-driven wordmark effects
│   ├── scrollChain.ts     — utility: chain scroll events across elements
│   └── index.ts           — barrel
├── scrubs/           — Scroll-linked factories (scroll-scrub lane)
│   ├── createCrescendoScrub.ts   — scale/opacity scrub as section passes
│   ├── createDrawScrub.ts        — DrawSVG stroke-scrub as section passes
│   ├── createHeroTimeline.ts     — 9-phase hero pin (the site's only pin)
│   └── index.ts
├── stores/           — Svelte stores + sync helpers
│   ├── reducedMotion.ts   — prefers-reduced-motion store + sync getter
│   ├── scroll.ts          — shared scroll position store
│   └── index.ts
├── svg/              — motion-owned SVG components
│   └── MetroNetwork.svelte   — inlined via Vite ?raw (17e-4)
├── utils/            — infrastructure
│   ├── device.ts          — isTouchDevice() helper
│   ├── flip.ts            — FLIP filter-sort primitives
│   ├── gsap.ts            — plugin registration hub
│   ├── heroTypewriter.ts  — ambient typewriter (signature 9)
│   ├── lenis.ts           — Lenis smooth-scroll bridge
│   ├── morphHelpers.ts    — MorphSVGPlugin.convertToPath wrapper
│   ├── stagger.ts         — reduced-motion-aware stagger helper
│   ├── ticker.ts          — shared gsap.ticker fan-out
│   └── index.ts
├── tokens.ts         — TS mirror of motion tokens in tokens.css
└── index.ts          — top-level barrel
```

Reusable motion patterns belong here. One-off presentational flourishes can live as scoped CSS inside the component that uses them, but anything with an API or shared by multiple consumers must be extracted into this tree and get its own test file.

---

## 2. The Snappy Doctrine

Content renders at its final state on page load. Motion triggers only on **interaction**, **scroll-scrub**, or **idle ambient**.

Full text lives in `docs/reference/CONSTITUTION.md` § Motion Doctrine — Snappy. The one-line summary:

> No entrance animations, no fade-ups on load, no scale-in on scroll-into-view. If you want the user's attention, earn it through interaction or through scroll-linked motion — never by animating a stationary page.

### The one permitted exception

**HomeCloser graffiti** retains an on-enter DrawSVG timeline because it is the narrative "Terminus" — the flourish reinforces arrival at the destination, not a delivery mechanism.

### D266 clarification

**Drawing motion** (DrawSVG stroke-tracing, morphSVG path tracing, motionPath tracing) is doctrine-compatible on enter. The drawing IS the content, not a delivery mechanism. Pure fade-up / scale-in / stagger-reveal entrances remain forbidden — they read as loading states.

---

## 3. The 9-Signature Vocabulary

Closed at 9. Future additions require a CONSTITUTION.md amendment.

| # | Signature | Lane | Trigger | Primary consumer |
|---|---|---|---|---|
| 1 | **Boop** | Interaction | hover/click/focus | buttons, CTAs |
| 2 | **Cursor glow + magnetic** | Interaction | hover + pointer move | cards, CTAs, StackNodes |
| 3 | **Wordmark hover** | Interaction | hover | Nav + Footer "yesid." wordmark |
| 4 | **SVG morph hover** | Interaction | hover (desktop) / tap (mobile) | HomeServices panels |
| 5 | **MetroNetwork hero scrub** | Scroll-scrub | scroll (pinned) | Home page hero |
| 6 | **DrawSVG scrub** (non-hero) | Scroll-scrub | scroll (through section) | Blueprints on listing pages |
| 7 | **Crescendo scrub** | Scroll-scrub | scroll (through section) | Manifesto + rotated edge titles |
| 8 | **LED pulse** | Idle ambient | always (IO-gated) | status dots, stop-label glows |
| 9 | **Typewriter idle** | Idle ambient | on-load (one-shot) | Hero scroll prompt |

---

## 4. Interaction Actions

All actions use the uniform Svelte action shape: `(node, params) => { update?, destroy }`. On `prefers-reduced-motion: reduce`, every action returns a no-op `{ destroy(){} }`.

### `use:boop`

Brief transform that resets itself after ~300ms. Creates an "alive" feeling without staying transformed.

```svelte
<button use:boop={{ scale: 1.05, rotation: 5, timing: 300 }}>Click me</button>
```

Params: `scale` (default 1.05), `rotation` (degrees, default 0), `timing` (ms, default 300).

### `use:cursorGlow`

Radial gradient that follows the cursor across the element. Pairs with `use:magnetic` on cards and CTAs.

```svelte
<div class="group" use:cursorGlow>...</div>
```

### `use:magnetic`

Element translates ±3px toward the cursor on proximity. Adds subtle weight-shift feel.

```svelte
<button use:magnetic>...</button>
```

### `use:morphHover` (17e-5)

SVG path morphing on hover (desktop) or tap-toggle (mobile). MorphSVG plugin lazy-loaded on first hover.

```svelte
<button use:morphHover={{ shapes: SHAPES, enabled: svgReady[i] }}>
  <svg>...</svg>
</button>
```

Params:
- `shapes` — `Record<string, string>` of shape-name → SVG path `d` string
- `enabled?` — defer morphs until SVG content is ready (e.g., async-fetched SVGs)
- `lastShapeIdx?` — deterministic starting shape index (default: random)

The action locates `<path>` elements inside the node's SVG subtree, converts shape primitives via `MorphSVGPlugin.convertToPath`, and tweens their `d` attribute.

### `use:wordmarkHover`

GSAP SplitText-driven animation pool for the "yesid." brand wordmark. Four effects rotate on each hover (bounce, wiggle, wave, spin). The orange dot always pulses alongside.

```svelte
<script>
  let dotRef: HTMLElement;
</script>
<span use:wordmarkHover={{ dotEl: dotRef, autoPlay: false }}>yesid</span>
<span bind:this={dotRef}>.</span>
```

Note: SplitText is eagerly imported in `gsap.ts` because the action's sync contract cannot await a dynamic import. `loadSplitText()` exists as a lazy counterpart — currently a no-op because the plugin is already registered eagerly.

---

## 5. Scroll-Scrub Factories

Sync factories returning `() => void` (destroy). Caller preloads required GSAP plugins before invoking.

### `createCrescendoScrub(target, opts)`

Scales + fades the target across its section's scroll. `minScale` at section edges, `maxScale` mid-scroll.

```ts
import { createCrescendoScrub } from '$lib/motion/scrubs';
import { initScrollTriggerConfig } from '$lib/motion/utils/gsap.js';

initScrollTriggerConfig();
const destroy = createCrescendoScrub(statementEl, {
  section: sectionEl,
  minScale: 0.85,
  maxScale: 1.0,
});
onDestroy(() => destroy?.());
```

Used by: Manifesto 3-line statement, rotated edge titles on Projects / Services / Terminus (D263).

### `createDrawScrub(svgRoot, opts)`

DrawSVG stroke-scrub: paths draw from `0%` to `100%` as the user scrolls through the section.

```ts
import { createDrawScrub } from '$lib/motion/scrubs';
import { loadDrawSVG, initScrollTriggerConfig } from '$lib/motion/utils/gsap.js';

await loadDrawSVG();
initScrollTriggerConfig();
const destroy = createDrawScrub(blueprintWrapEl, {
  section: listingSectionEl,
  pathSelector: 'svg path',
});
```

Used by: Blueprint SVGs on blog + projects listing pages.

### `createHeroTimeline(pinContainer, opts)` (17e-4)

The site's **only** pinned scroll-scrub. 9-phase choreography: dot + text visible → pulse → stroke-draw → station nodes → labels → Berri-UQAM zoom → cross-fade → hero text zoom-out → stagger → unpin.

```ts
import { createHeroTimeline } from '$lib/motion/scrubs';
import { loadDrawSVG, loadCustomEase, initScrollTriggerConfig } from '$lib/motion/utils/gsap.js';

await Promise.all([loadDrawSVG(), loadCustomEase()]);
initScrollTriggerConfig();
const destroy = createHeroTimeline(pinContainer, {
  svgWrapper,
  heroTextContainer,
  heroDot,
  scrollPrompt,
  startBlink,
  stopBlink,
  pinLength: isMobile ? '300%' : '800%',
});
```

Invariants (D268):

- **The scrub owns `scrollPrompt` opacity exclusively.** Typewriter owns text + cursor only. Never write `scrollPrompt.style.opacity` from the typewriter or any other source.
- **Phase boundaries are fixed** — tuned across many iteration cycles. Do not adjust without Yesid's review.

---

## 6. Idle Ambient

### Typewriter (signature 9)

`heroTypewriter.ts` — character-by-character reveal of the hero "SCROLL DOWN" prompt. Advances one character every 80ms of wall-clock time via the shared ticker. Cursor blink is pure CSS.

**Lesson from the 17e-5 migration:** GSAP's `deltaTime` in ticker callbacks is in **milliseconds** (not seconds). Compare accumulators to `80`, not `0.08`. Getting this wrong makes the typewriter blow through the entire string in one frame.

### LED pulse

Global `@keyframes pulse-glow` in `app.css` (opacity 1 ↔ 0.7 + box-shadow pulse). Consumers: `StopLabel.svelte`, `MetricDisplay.svelte` pulse-glow elements, `ManifestoEdgeBottom.svelte`'s status dot. A future `.led-pulse` alias may emerge if more consumers need the pattern.

### Typewriter cursor

`.typewriter-cursor` class in `app.css`:

```css
@keyframes typewriter-blink {
  0%, 100% { visibility: visible; }
  50%      { visibility: hidden; }
}
.typewriter-cursor {
  opacity: 1;
  animation: typewriter-blink 1s step-end infinite;
}
```

Uses **visibility** (not opacity) so the blink does not multiply with the scroll-scrub's opacity tween on the parent `scrollPrompt`.

**Don't use `steps(2, start)` with a single `to` keyframe for a blink.** For discrete properties like `visibility`, both steps resolve to the same "hidden" value → the element stays hidden the entire time. Use explicit `0%/50%/100%` keyframes with `step-end` timing, as above.

---

## 7. Shared Ticker

`motion/utils/ticker.ts` — single `gsap.ticker.add` callback that fans out to all subscribers. Avoids N independent `requestAnimationFrame` loops.

```ts
import { subscribe, unsubscribe } from '$lib/motion/utils/ticker.js';

const SUB_ID = 'my-component';

function tick(_time: number, deltaTime: number) {
  // deltaTime is in MILLISECONDS (e.g., 16.67 at 60fps).
  // Do work conditionally — early-return if offscreen.
  if (!isVisible) return;
  // ... paint / advance state ...
}

onMount(() => subscribe(SUB_ID, tick));
onDestroy(() => unsubscribe(SUB_ID));
```

### IntersectionObserver offscreen pause

Consumers whose work is only meaningful while their owner element is visible should gate via IntersectionObserver:

```ts
let isVisible = false;
let observer: IntersectionObserver | null = null;

onMount(() => {
  observer = new IntersectionObserver(
    (entries) => { isVisible = entries[0].isIntersecting; },
    { rootMargin: '50px' },  // resume slightly before entering viewport
  );
  observer.observe(sectionEl);
  subscribe(SUB_ID, tick);
});

onDestroy(() => {
  unsubscribe(SUB_ID);
  observer?.disconnect();
});
```

Current IO-gated ticker consumers: `ManifestoCanvas`, `AboutTrain`. Non-gated: `heroTypewriter` (one-shot, unsubscribes on completion).

Current IO-gated `setInterval` consumers: `Manifesto.svelte` countdown, `AboutTestimonials.svelte` carousel. These use IO to start/stop the interval (not the shared ticker — discrete-second timer semantics).

---

## 8. Motion Tokens

CSS custom properties in `src/lib/styles/tokens.css`:

```css
--duration-instant: 100ms;
--duration-fast:    150ms;
--duration-normal:  200ms;
--duration-slow:    300ms;
--duration-slower:  500ms;

--ease-default: cubic-bezier(0.4, 0, 0.2, 1);   /* Material standard */
--ease-out:     cubic-bezier(0.2, 0.8, 0.2, 1);
--ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce:  cubic-bezier(0.34, 1.56, 0.64, 1);
```

TS mirror at `src/lib/motion/tokens.ts`:

```ts
import { duration, ease, durationSec } from '$lib/motion/tokens.js';

gsap.to(el, { opacity: 1, duration: durationSec('normal'), ease: ease.default });
```

### Parity

`src/lib/motion/tokens.test.ts` asserts parity — every `--duration-*` / `--ease-*` declared in `tokens.css` must have a matching entry in `tokens.ts`. Adding a new token means updating both files and the parity test's expected list.

### Adding a new token

1. Declare in `src/lib/styles/tokens.css` under the motion section.
2. Mirror in `src/lib/motion/tokens.ts`.
3. Update `docs/reference/CSS.md`'s motion-tokens table.
4. Run `bun run test -- src/lib/motion/tokens.test.ts` to confirm parity.

---

## 9. GSAP Plugin Loading

`motion/utils/gsap.ts` is the single plugin-registration hub.

### Eager (always bundled)

- **`ScrollTrigger`** — site-wide; every pin / scroll-scrub uses it.
- **`SplitText`** — `wordmarkHover` creates SplitText instances synchronously.
- **`MorphSVGPlugin`** — `morphHelpers.ts` calls `MorphSVGPlugin.convertToPath()` as a static method from SvgIcon, which ships on every major route.

### Lazy (per-consumer at mount)

| Loader | Consumers |
|---|---|
| `loadDrawSVG()` | HeroBanner, DataFlowDiagram, SvgIcon, HomeCloser (via CloserGraffiti), BlogListingPage, ProjectListingPage, StackConnections |
| `loadMorphSVG()` | `morphHover` action (first hover); SvgIcon (entrance `animateMorph`) |
| `loadFlip()` | BlogListingPage, ProjectListingPage |
| `loadCustomEase()` | HeroBanner (via `createHeroTimeline` for the `networkDraw` ease) |
| `loadMotionPathPlugin()` | StackConnections |
| `loadSplitText()` | Currently no-op — SplitText already eager. Retained for API completeness. |

### Registration helpers

```ts
// Call once from anywhere that uses ScrollTrigger. Idempotent.
import { initScrollTriggerConfig } from '$lib/motion/utils/gsap.js';
initScrollTriggerConfig();

// Sync SplitText registration (wordmarkHover's sync contract).
import { ensureSplitTextRegistered } from '$lib/motion/utils/gsap.js';
ensureSplitTextRegistered();
```

### Consumer pattern

```ts
import {
  initScrollTriggerConfig,
  loadDrawSVG,
  loadMorphSVG,
} from '$lib/motion/utils/gsap.js';

onMount(async () => {
  if (isPrefersReducedMotion()) return;

  await Promise.all([loadDrawSVG(), loadMorphSVG()]);
  // Guard against unmount-during-await (tests, fast route transitions)
  if (!container) return;

  initScrollTriggerConfig();
  // ... start tweens that use drawSVG: / morphSVG: syntax ...
});
```

### Adding a new consumer

1. Identify plugins needed (`ScrollTrigger`, `DrawSVG`, `MorphSVG`, etc.).
2. In the consumer's `onMount` (async), `await load*()` for each.
3. After all loads resolve, call `initScrollTriggerConfig()` if using ScrollTrigger.
4. Guard `container` (or the relevant binding) after the await before touching the DOM.

---

## 10. Reduced-Motion Contract

`isPrefersReducedMotion()` is the sync getter. Every motion primitive opts out when it returns `true`.

| Signature | Reduced-motion behavior |
|---|---|
| Boop | no-op destroy, no listeners attached |
| Cursor glow + magnetic | no-op destroy |
| Wordmark hover | no-op destroy, no SplitText instance |
| SVG morph hover | no-op destroy; paths stay at primary shape |
| MetroNetwork hero scrub | factory renders final state (hero text visible, network dimmed) and returns a no-op destroy |
| DrawSVG scrub | paths render at 100% stroke (final state) |
| Crescendo scrub | target rendered at `maxScale`, no scroll tween |
| LED pulse (CSS) | `animation: none`, opacity 1 |
| Typewriter | `showImmediate()` renders full text + cursor-on |

### Pattern for new consumers

```ts
if (isPrefersReducedMotion()) {
  // Render final state synchronously, no ticker subscription, no observers.
  return;
}
// ... full animation path ...
```

---

## 11. SEO × Motion Contract

The site must remain crawler-friendly. Motion rules that protect SEO:

1. **All text content ships in SSR HTML.** No text is created by JS; motion only styles text that already exists.
2. **Headings are real `<h1>`/`<h2>` tags**, not div/span masquerading. Rotated edge titles (home Projects + home Terminus; blog listing, projects listing, contact page) are real `<h2>` with CSS `writing-mode: vertical-rl` + `rotate: 180deg` — semantic first, visual second.
3. **The MetroNetwork SVG is inlined at SSR time** (17e-4 D265 via Vite `?raw` import), so it is a valid LCP candidate and does not require a separate `fetch` that delays paint.
4. **No `aria-hidden` on primary content** — rotated titles use `aria-label` if the visual form obscures read order, but never hide content from assistive tech.

---

## 12. Bundle Budgets

Per design spec §6.2. Gzipped initial JS per route:

| Route | Budget | 17e-5 end actual |
|---|---|---|
| `/` (home) | 120 KB | 35.00 KB gzipped (node 4 only — shared chunks load separately) |
| `/blog` (listing) | 80 KB | see `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\devlog\2026-04-17-slice-17e-closing.md` |
| `/blog/[slug]` | 70 KB | " |
| `/projects` (listing) | 80 KB | " |
| `/projects/[slug]` | 70 KB | " |
| `/services` | 80 KB | " |
| `/services/[slug]` | 70 KB | " |
| `/about` | 70 KB | " |
| `/contact` | 60 KB | " |
| `/tech-stack` | 80 KB | " |

Measurement: `bun run bundle-size` → opens `dist/stats.html` (rollup-plugin-visualizer treemap).

### Lighthouse targets (§6.1)

- **Desktop:** Performance ≥ 98, Accessibility + SEO + Best Practices = 100
- **Mobile:** Performance ≥ 90 (stretch 95+), same A11y/SEO/BP

Closing-audit results live in `C:\Users\otalo\Yesito\cloud\yesid.dev\docs\devlog\2026-04-17-slice-17e-closing.md`.

### Known bundle-shrink opportunities (deferred post-17e)

- **`captureFlipState()` async migration** — currently `flip.ts` statically imports `Flip` from `gsap/Flip` because `captureFlipState` must run synchronously. Making it async would let Vite split Flip into its own chunk loaded only for Blog + Projects listing routes. Estimated savings: ~3–5 KB on those routes.
- **`wordmarkHover` async action shape** — currently SplitText is eagerly imported because `new SplitText(node, ...)` runs synchronously inside the action. An async-aware action (fire-and-forget init pattern) would let `loadSplitText()` do the actual splitting. Estimated savings: ~3 KB site-wide.

---

## 13. MetroNetwork SVG Re-Optimization

The hero metro SVG at `static/images/montreal-metro.svg` is inlined at SSR via Vite `?raw` import. Source = optimized output; there is no build-time SVGO plugin.

### When to re-run

Whenever the SVG source is edited (new stations, path tweaks, color changes). Keep a local-only `.source.svg` backup (excluded via `.gitignore`).

### Procedure

1. Drop the raw SVG into `static/images/montreal-metro.source.svg` (gitignored).
2. Run SVGO with the repo config:

```bash
bunx svgo --config=svgo.config.mjs static/images/montreal-metro.source.svg -o static/images/montreal-metro.svg
```

3. Commit only the optimized `montreal-metro.svg`.

### Config details (`svgo.config.mjs`)

The config **disables** three default SVGO plugins:

- `convertColors` — would lowercase `#E07800` to `#e07800`, breaking the mount-time classification code in `MetroNetwork.svelte` which compares `stroke === '#E07800'`.
- `mergePaths` — would merge the 87 station `<path>` elements into one, breaking per-station opacity fades in Phase 3 of the hero timeline.
- `cleanupIds` — would strip or renumber IDs used by animation selectors.

Reduction expected: ~28–30% (full defaults would be ~42% but break animation targets).

### Sanity checks

After re-running SVGO, verify:

```bash
# Classification attributes survived (expect 8× stroke, 87× fill)
grep -c 'stroke="#E07800"' static/images/montreal-metro.svg
grep -c 'fill="#E07800"' static/images/montreal-metro.svg

# Per-station paths still distinct (expect 87+)
grep -c '<path' static/images/montreal-metro.svg
```

If counts drop significantly, the optimizer re-broke classification — re-check `svgo.config.mjs`.

---

## 14. Anti-Patterns

Common violations and their proper replacements.

| Anti-pattern | Why it violates | Replacement |
|---|---|---|
| `gsap.from(el, { opacity: 0 })` on mount | Pure fade-in reveal (Snappy Doctrine) | Remove. Render at final state. |
| `gsap.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1 })` on mount | Fade-up reveal (D267 F) | Remove. |
| `stagger` reveal on a list of cards entering viewport | Reveal pattern — content was already there | Remove. Cards render immediately. |
| `requestAnimationFrame(loop)` self-recursion in a component | Violates one-RAF-per-site rule | Migrate to `subscribe(id, fn)` from `motion/utils/ticker.js` |
| `setInterval(fn, ms)` always-on in a component | Burns CPU when offscreen | IO-gate via `IntersectionObserver` (start/stop the interval on visibility change) |
| Reading `MorphSVGPlugin` from outside `motion/utils/` | Plugin symbol leak | Import from `$lib/motion/utils/gsap.js` or `$lib/motion/utils/morphHelpers.js` |
| Calling `gsap.registerPlugin()` directly in a component | Breaks the lazy-load chain | Use `initScrollTriggerConfig()` + `await loadX()` per the Consumer Pattern (§9) |
| Inlining clamp values for typography/spacing in scoped CSS | Token bypass | Add a token to `tokens.css` or `@theme`; reference via `var(--...)` or Tailwind utility |
| `animation: my-blink 1s steps(2, start) infinite` for cursor blinks | `steps(2, start)` with implicit `from` resolves to "always hidden" for discrete properties like `visibility` | Use explicit `0%/50%/100%` keyframes with `step-end` timing (see `.typewriter-cursor` pattern) |

---

## 15. Migration from v1.0

v1.0 documented systems that no longer exist. v2.0 drops them entirely. For historical grep-searchers:

| v1.0 concept | Status in v2.0 |
|---|---|
| Three.js / Threlte | **Removed** (pre-17e). No 3D scenes. |
| `use:reveal` action | **Removed** (17e-2). Entrance reveals forbidden per Snappy Doctrine. |
| `use:ripple` action | **Removed** (17e-2). Not in the 9-signature vocabulary. |
| `use:tilt` action | **Removed** (17e-2). Absorbed into `magnetic` or deleted. |
| `ScrollRail` component | **Removed** (17e-2). Orphan code. |
| Train SVG components (`Train.svelte`, `TrainJourney.svelte`, train-path.ts) | **Removed** (17e-2). The "train journey" metaphor was replaced by scroll-scrub crescendo over the Manifesto statement. |
| `useListingEntrance` | **Removed** (17e-2). Entrance violation. Listing cards render at final state on load. |
| `listingAnimations.ts` | **Removed** (17e-2). `captureFlipState` + `animateFlipTransition` extracted into `flip.ts`. |
| `heroTimeline.ts` utility | **Removed** (17e-4). Replaced by `scrubs/createHeroTimeline.ts` factory. |
| `heroScrollLock.ts` | **Removed** (17e-4, D264). "Plays at you" pattern contradicted the Snappy Doctrine. |
| `ReadingProgressBar.svelte` | **Removed** (17e-5). Scrapped during 09c-2b, never re-wired; discovered during the D269 audit. |
| `morphHelpers.ts` | **Kept** (17e-5). Used by both `use:morphHover` action and `SvgIcon.animateMorph`. |
| `SvgIcon.animateStagger` variant | **Removed** (17e-5, D267 F). Pure fade-up reveal. |
| `StackScenarioCard` onMount fade-up | **Removed** (17e-5, D267 F). |
| `registerGsapPlugins()` | **Removed** (17e-5, D269). Replaced by `initScrollTriggerConfig()` + per-plugin `load*()` loaders. |

v1.0's "data in transit" motion metaphor is still honored by the site's aesthetic — MetroNetwork hero, transit-themed rotated labels, terminus closer — but v2.0 documents the implementation, not the metaphor.

---

## 16. Changelog

### v2.0 — 2026-04-17

Full rewrite as post-17e implementation reference. v1.0 motion-manifesto content superseded.

- Added §3 9-signature vocabulary table with consumer examples
- Added §4–§7 per-primitive API reference
- Added §9 lazy-plugin-loading contract + consumer pattern
- Added §10 reduced-motion contract table
- Added §13 MetroNetwork SVGO procedure
- Added §14 anti-patterns table
- Removed Three.js / Threlte / scroll-rail / train-journey / `use:reveal` / `use:ripple` / `use:tilt` content
- Corrected: gsap.ticker `deltaTime` documented as MILLISECONDS (not seconds — cost one Yesid-caught regression)
- Corrected: `.typewriter-cursor` keyframe shape (explicit visible/hidden + `step-end`) — previous `steps(2, start)` never actually blinked

### v1.0 — April 2026

Motion spec manifesto (pre-17e). Historical — see git for content if needed.
