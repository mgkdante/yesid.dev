# Slice 17e — Motion Re-Engineering — Design Spec

**Date:** 2026-04-16
**Status:** Approved — ready for implementation plan
**Companion to:** `docs/reference/CONSTITUTION.md`, `docs/reference/CSS.md`, `docs/reference/MOTION.md` (v1.0 — to be superseded by v2.0 at 17e closing)
**Supersedes:** MOTION.md v1.0 (2026-04-02) — Three.js/Threlte sections are stale (packages deleted in 17a-6); `use:reveal` vocabulary contradicts the Snappy Doctrine established here.

---

## 1. Context

After 17d, the site is structurally sound (atomic design system, one `ui/card`, CSS Grid Recipes, unified shells). Motion has not kept pace with that discipline.

**What's wrong today:**

- **75 GSAP calls across 15 files**, many with hardcoded timings, ignoring the `--duration-*` / `--ease-*` tokens established in 17a-5.
- **27+ `use:reveal` / entrance-animation call sites** on article pages (blog, projects, services, about, contact). Content fades up on load, which makes the site feel slow.
- **Duplicate ambient loops** — four copies of `@keyframes pulse`/`led-pulse`, three always-on `requestAnimationFrame` loops (ManifestoCanvas, ReadingProgressBar, AboutTrain), three cursor-blink implementations.
- **`ScrollTrigger.normalizeScroll({ allowNestedScroll: true })`** in `motion/utils/lenis.ts` is the known root cause of the tap-vs-click bug on mobile — `TocPill` opens on vertical scroll, `ProjectsStrip` links fire on horizontal swipe.
- **Orphaned code**: `motion/svg/Train.svelte`, `TrainJourney.svelte`, `TrainTop.svelte`, `train-path.ts`, `train-targets.ts` — imported nowhere in production code, only in their own tests.
- **MOTION.md v1.0 is stale** — mandates Three.js/Threlte (deleted in 17a-6) and documents the `use:reveal` vocabulary this slice is killing.
- **Mobile Lighthouse performance is compromised** by runtime SVG `fetch()` for MetroNetwork, expensive `filter: drop-shadow` animations, and a full 800vh pinned hero that runs on every visit.

**Goal of 17e:**

Rebuild motion from the ground up (per Constitution D49) into a small, uniform, brand-signature vocabulary. Consolidate duplication. Token-drive every timing. Optimize for Lighthouse. Fix the tap-vs-click bug. Do all of this while preserving the site's character — hero MetroNetwork scroll narrative, HomeCloser graffiti destination, and all interaction polish.

---

## 2. Philosophy — The Snappy Doctrine

> Content renders at its final state on page load. Zero entrance animations. Motion triggers only on **interaction**, **scroll-scrub**, or **idle ambient**.

**Forbidden:**

- `use:reveal` action (deleted)
- Fade-up on load (`gsap.from(..., { y, opacity: 0 })` on mount)
- Scale-in on enter (`scale: 0 → 1` on scroll entry)
- SplitText char-stagger on enter (replaced by scroll-scrub crescendo)
- Staggered list entrances on mount (cards render in place)
- "Appear when scrolled to" reveals of any kind

**Permitted exceptions — exactly one:**

- **HomeCloser graffiti** — retains its on-enter DrawSVG timeline + hover interactions. This is the site's narrative destination (the "Terminus"), the one place where content is allowed to play *at* the user. Justified by placement: users have already scrolled the entire page to arrive here, so the arrival flourish reinforces the destination metaphor instead of slowing first impression.

**Three triggers — the only legal kinds of motion:**

| Trigger | Means | Perceptual quality |
|---|---|---|
| **Interaction** | Hover / click / focus fires a transform that resets itself in ≤ 400ms | Instant feedback — "this UI is alive" |
| **Scroll-scrub** | Already-rendered elements transform as a function of scroll position | User is in control — motion tracks their input |
| **Idle ambient** | Always-running low-cost CSS keyframe, IntersectionObserver-gated | Background heartbeat — barely conscious |

**Success criteria for "snappy" (measurable):**

- First Contentful Paint < 1.5s mobile, < 0.6s desktop
- Largest Contentful Paint < 2.5s mobile, < 1.0s desktop
- Cumulative Layout Shift < 0.05
- Zero CSS rules with `opacity: 0` as initial state on article pages
- Zero `gsap.from(..., { autoAlpha: 0 })` on article pages

---

## 3. Signature Vocabulary

Nine canonical signatures, locked to specific existing elements. The vocabulary is closed — future slices may not introduce new signatures without amending this document.

### 3.1 Interaction lane (4)

| # | Signature | Targets | Behavior | Status |
|---|---|---|---|---|
| 1 | **Boop** | `yesid.` dot, all CTAs, nav links, interactive icons | 300ms spring transform, self-resets | Existing `use:boop` — standardize and audit every call site |
| 2 | **Cursor glow + magnetic** | All cards (`ui/card`), CTAs, StackNodes, bento cards | Radial-gradient glow tracks cursor; CTAs translate ±3px toward cursor | Existing `use:cursorGlow` + `use:magnetic` — keep, consolidate auto-injection |
| 3 | **Wordmark hover** | Header wordmark, footer wordmark | Current `use:wordmarkHover` behavior | Existing — keep as-is, no rework |
| 4 | **SVG morph hover** | `BlogSvgIcon`, `WorkSvgIcon` / `ProjectSvgIcon`, `ServiceSvgPanel` | MorphSVG tween between shapes on hover | Existing `morphHelpers.ts` → becomes `actions/morphHover.ts`; MorphSVG plugin lazy-loaded |

### 3.2 Scroll-scrub lane (3)

| # | Signature | Targets | Behavior | Status |
|---|---|---|---|---|
| 5 | **MetroNetwork hero scrub** | Hero MetroNetwork SVG | DrawSVG lines + label fades + Phase 5 Berri-UQAM zoom, all scrub with scroll through pin | Existing `heroTimeline.ts` — rebuild via `scrubs/createHeroTimeline.ts` factory |
| 6 | **DrawSVG scrub (other SVGs)** | Blueprint SVGs (blog + projects), circuit grid | Already rendered on page render; stroke-dashoffset scrubs with scroll through the containing section. Never on-enter. | New — `scrubs/createDrawScrub.ts` factory |
| 7 | **Crescendo scrub** | Manifesto 3-line statement, rotated edge titles on Projects + Services sections | Target element scales with scroll position through its section — HUGE mid-scroll, small at edges | New — `scrubs/createCrescendoScrub.ts` factory |

### 3.3 Idle ambient lane (2)

| # | Signature | Targets | Behavior | Status |
|---|---|---|---|---|
| 8 | **LED pulse** | `yesid.` dot, all status dots, station dots | Single CSS keyframe `.led-pulse`, consolidated from four copies | Existing — dedupe 4 copies → 1 |
| 9 | **Typewriter idle** | Hero tagline | JS interval, plain DOM — no GSAP. Cursor blink via CSS keyframe, not `setInterval` | Existing `heroTypewriter.ts` — replace `setInterval` blink with CSS |

### 3.4 Doctrine exception

| # | What | Justification |
|---|---|---|
| — | **HomeCloser graffiti** | On-enter DrawSVG timeline + hover interactions kept as-is. Narrative destination; one permitted "plays at you" moment. Rebuilt as `scrubs/createCloserTimeline.ts` factory for consistency with the architecture, but its trigger (on-enter) is grandfathered. |

### 3.5 Contract for future work

If a future slice wants a new motion:

- It must justify why none of the 9 signatures fit.
- If adding a new signature, it must earn a new row in this table (via brainstorm + spec revision), including a doctrine-compatible trigger (Interaction / Scroll-scrub / Idle ambient).
- On-enter entrance animations on content are permanently disallowed except for the one graffiti exception.

---

## 4. Architecture — Hybrid (Actions + Scrub Factories + Ambient)

### 4.1 File layout

```
src/lib/motion/
├── actions/                         # Interaction signatures — Svelte actions
│   ├── boop.ts
│   ├── cursorGlow.ts
│   ├── magnetic.ts
│   ├── morphHover.ts                # absorbs morphHelpers.ts
│   ├── wordmarkHover.ts
│   └── index.ts
├── scrubs/                          # Scroll-linked signatures — factory fns
│   ├── createHeroTimeline.ts        # MetroNetwork hero (replaces utils/heroTimeline.ts)
│   ├── createDrawScrub.ts           # Blueprint/circuit SVGs
│   ├── createCrescendoScrub.ts      # edge titles + manifesto 3-line
│   ├── createCloserTimeline.ts      # doctrine exception
│   └── index.ts
├── ambient/
│   └── typewriter.ts                # hero idle
├── stores/
│   ├── reducedMotion.ts
│   └── scroll.ts
├── utils/
│   ├── device.ts
│   ├── gsap.ts                      # core + lazy plugin loaders
│   ├── lenis.ts                     # NO normalizeScroll
│   ├── ticker.ts                    # shared gsap.ticker
│   ├── flip.ts                      # FLIP filter logic (from listingAnimations.ts)
│   └── stagger.ts
├── tokens.ts                        # mirror of CSS --duration-* / --ease-*
└── index.ts
```

`motion/svg/` folder collapses to just `MetroNetwork.svelte` + test after the Train* deletions.

### 4.2 Five contracts

**1. Timing tokens.** `src/lib/styles/tokens.css` is the **source of truth** for timing + easing values (already established in 17a-3b). `motion/tokens.ts` mirrors the same values as TypeScript constants for JS consumers that cannot read CSS variables at compute time. Values must stay in sync — a unit test asserts parity. Every action, factory, and CSS rule reads from one of these two surfaces. **No hardcoded `0.6`, no inline cubic-beziers.**

```ts
// motion/tokens.ts
export const duration = {
  instant: 150,   // --duration-instant
  fast: 250,      // --duration-fast
  normal: 400,    // --duration-normal
  slow: 600,      // --duration-slow
  slower: 900,    // --duration-slower
} as const;

export const ease = {
  snap: 'cubic-bezier(0.34, 1.56, 0.64, 1)',  // spring-back — boop
  out:  'cubic-bezier(0.2, 0.8, 0.2, 1)',      // default ease-out
  inOut:'cubic-bezier(0.4, 0, 0.2, 1)',         // scrub default
} as const;
```

**2. Shared ticker.** `motion/utils/ticker.ts` exposes `subscribe(id, fn)` that piggybacks a single `gsap.ticker.add(...)` callback. Three always-on RAF loops today → one.

```ts
// motion/utils/ticker.ts
import { gsap } from './gsap';

const subscribers = new Map<string, () => void>();
gsap.ticker.add(() => subscribers.forEach(fn => fn()));

export function subscribe(id: string, fn: () => void) {
  subscribers.set(id, fn);
  return () => subscribers.delete(id);
}
```

ManifestoCanvas, ReadingProgressBar, typewriter, and any future RAF consumer use this.

**3. Lazy plugin loading.** `motion/utils/gsap.ts` registers only `ScrollTrigger` at module load. Heavier plugins are async:

```ts
// motion/utils/gsap.ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
export { gsap };

export async function loadDrawSVG() {
  const mod = await import('gsap/DrawSVGPlugin');
  gsap.registerPlugin(mod.DrawSVGPlugin);
}
export async function loadMorphSVG() { /* ... */ }
export async function loadFlip() { /* ... */ }
export async function loadCustomEase() { /* ... */ }
```

Route-level await before motion that needs them:

| Route | Plugins loaded |
|---|---|
| `/` (home) | DrawSVG, CustomEase |
| `/blog`, `/projects`, `/services`, `/tech-stack` | MorphSVG (first-hover), Flip (first-filter-change) |
| Other routes | None — just core + ScrollTrigger |

**4. Scroll stack.** Lenis handles desktop smoothscroll (disabled on touch as today). **`ScrollTrigger.normalizeScroll` is removed entirely** — this single change fixes the tap-vs-click bug on mobile (TocPill + ProjectsStrip). No custom `scrollerProxy` unless a concrete case forces it.

**5. Reduced-motion contract.** Every action returns a no-op destroy when `$prefersReducedMotion`. Every scrub factory renders the target's final state directly (no ScrollTrigger registered). Idle loops respect `animation-play-state: paused` via `@media (prefers-reduced-motion: reduce)`. The HomeCloser graffiti exception renders its static final frame (no timeline, hover interactions still permitted).

### 4.3 Factory signature (canonical form)

```ts
// scrubs/createCrescendoScrub.ts
export interface CrescendoOpts {
  section: HTMLElement;          // scroll trigger element (ancestor section)
  minScale?: number;              // default 0.6
  maxScale?: number;              // default 1.4
  ease?: keyof typeof ease;       // default 'inOut'
}

export function createCrescendoScrub(
  target: HTMLElement,
  opts: CrescendoOpts,
): () => void {
  if (get(prefersReducedMotion)) {
    target.style.transform = `scale(${opts.maxScale ?? 1})`;
    return () => {};
  }
  const st = ScrollTrigger.create({
    trigger: opts.section,
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => {
      const t = Math.sin(self.progress * Math.PI); // 0 → 1 → 0
      const scale = (opts.minScale ?? 0.6) + t * ((opts.maxScale ?? 1.4) - (opts.minScale ?? 0.6));
      target.style.transform = `scale(${scale})`;
    },
  });
  return () => st.kill();
}
```

Every scrub factory returns a `destroy` fn. Components wire it as:

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { createCrescendoScrub } from '$lib/motion/scrubs';

  let headingEl: HTMLElement;
  let sectionEl: HTMLElement;
  let destroy: (() => void) | undefined;

  onMount(() => {
    destroy = createCrescendoScrub(headingEl, { section: sectionEl });
  });
  onDestroy(() => destroy?.());
</script>
```

### 4.4 Deletions from `motion/`

| File | Action | Reason |
|---|---|---|
| `actions/reveal.ts` + test | Delete | Snappy Doctrine violation |
| `actions/ripple.ts` + test | Delete | Not in vocabulary |
| `actions/tilt.ts` + test | Delete | Behavior absorbed into `magnetic` or cut |
| `components/ScrollRail.svelte` + test | Delete | Progress rail cut (not on site) |
| `utils/heroScrollLock.ts` | Re-evaluate | Keep only if typewriter genuinely needs it; prefer CSS-only |
| `utils/heroTimeline.ts` | Rewrite | Becomes `scrubs/createHeroTimeline.ts` |
| `utils/heroTypewriter.ts` | Rewrite | `setInterval` blink → CSS keyframe |
| `utils/lenis.ts` | Modify | Remove `normalizeScroll` call |
| `utils/listingAnimations.ts` | Split | Entrance parts deleted, FLIP moves to `utils/flip.ts` |
| `utils/morphHelpers.ts` | Absorbed | Becomes `actions/morphHover.ts` |
| `svg/Train.svelte` + test | Delete | Orphaned — imported only by its own test |
| `svg/TrainJourney.svelte` + test | Delete | Orphaned |
| `svg/TrainTop.svelte` | Delete | Orphaned |
| `svg/train-path.ts` + test | Delete | Orphaned |
| `svg/train-targets.ts` | Delete | Orphaned |

After deletions, `motion/svg/` contains only `MetroNetwork.svelte` + its test.

### 4.5 Component-level entrance animation removals

All on-load / on-scroll-into-view entrance animations stripped:

| Location | Sites |
|---|---|
| `components/services/ServiceDetailPage.svelte` | 10× `use:reveal` |
| `components/about/` (all children) + `AboutPage.svelte` | 13× `use:reveal` |
| `components/contact/ContactPage.svelte` | 2× `use:reveal` |
| `components/shared/TagList.svelte` | 1× staggered list entrance |
| `components/blog/BlogListingPage.svelte`, `projects/ProjectListingPage.svelte` | `opacity: 0` seed CSS deleted, `useListingEntrance()` removed (FLIP filter logic stays) |
| `components/blog/BlogDetailHeader.svelte`, `projects/ProjectDetailHeader.svelte`, `projects/ProjectDetailSidebar.svelte` | GSAP entrance timelines cut |
| `components/blog/BlogRow.svelte`, `projects/ProjectCard.svelte`, `projects/ProjectMiniCard.svelte` | Entrance tweens cut |
| `components/home/Manifesto.svelte` + sub-components | SplitText char-stagger entrance **replaced** by `createCrescendoScrub` on 3-line |
| `components/home/FeaturedProjects.svelte`, `HomeServices.svelte` | On-enter timelines cut; cards render in place |

### 4.6 Ambient duplication consolidation

| What | Fix |
|---|---|
| 4× `@keyframes pulse` / `led-pulse` / `pulse-glow` across InfraFrame, tech-stack, AboutPage, Manifesto | Consolidate to one global `.led-pulse` class in `src/app.css`, applied to `--primary` dot everywhere |
| 3× cursor blink implementations | Consolidate to one CSS keyframe + helper |
| ManifestoCanvas always-on RAF + ReadingProgressBar RAF + AboutTrain RAF | Route through shared `ticker.ts`; add `IntersectionObserver` pause when offscreen |
| Manifesto countdown `setInterval(1000)` always on | Gate on section visibility |

---

## 5. Mobile & Reduced Motion

### 5.1 Mobile posture (locked)

Full fidelity on mobile; earn it with perf work, don't trim the brand.

| Aspect | Desktop | Mobile |
|---|---|---|
| MetroNetwork SVG | Full network | **Full network** |
| Pin length | 800vh | **~300vh** (shorter for scroll-through pace and perf budget) |
| Phase 5 Berri-UQAM zoom | Yes | Yes (preserved as hero → manifesto bridge) |
| DrawSVG scrub on metro lines | Yes | Yes |
| Label fade-ins scrubbed | Yes | Yes |
| Train halo | N/A (deleted) | N/A (deleted) |
| `ScrollTrigger.normalizeScroll` | Removed | Removed |
| Lenis smoothscroll | Yes | Disabled (as today) |
| Crescendo scrub | Yes | Yes (same scale bounds) |
| DrawSVG scrub (other SVGs) | Yes | Yes |
| HomeCloser graffiti | Full timeline | Full timeline |
| Idle RAF loops | IntersectionObserver-gated | IntersectionObserver-gated + 30fps cap |

### 5.2 Required perf work to earn full-fidelity mobile

1. MetroNetwork SVG inlined at build (no runtime `fetch`)
2. SVGO pass on the network SVG (round coordinates, collapse groups, drop metadata)
3. `content-visibility: auto` on offscreen sections
4. Shared `gsap.ticker` — one RAF loop, not four
5. Lazy plugin loading — DrawSVG only on home, MorphSVG only on listings
6. Idle loops gated by IntersectionObserver + offscreen pause (ManifestoCanvas, typewriter, countdown, ReadingProgressBar)
7. All images below hero: `loading="lazy" decoding="async"`
8. Dynamic-import heavy components (Manifesto canvas, Projects, Services, Closer)

### 5.3 Reduced-motion contract

`@media (prefers-reduced-motion: reduce)` honored site-wide:

| Signature | Reduced-motion behavior |
|---|---|
| Boop | Disabled (no transform) |
| Cursor glow + magnetic | Disabled |
| Wordmark hover | Disabled |
| SVG morph hover | Disabled — renders primary shape only |
| MetroNetwork hero scrub | Final state rendered immediately — lines fully drawn, labels visible, Phase 5 zoomed in; no pin, no ScrollTrigger |
| DrawSVG scrub (others) | Final state (full stroke) rendered immediately |
| Crescendo scrub | Target at `maxScale` (or `1.0`), static |
| LED pulse | Disabled (solid orange, no pulse) |
| Typewriter idle | Full text rendered, no type sequence, no cursor |
| **HomeCloser graffiti** (exception) | Static final frame — drawn SVG fully visible, hover still permitted |

---

## 6. Performance Budget

### 6.1 Lighthouse targets

| Metric | Desktop | Mobile |
|---|---|---|
| **Performance score** | **≥ 98** | **≥ 90** (stretch 95+) |
| Accessibility | 100 | 100 |
| SEO | 100 | 100 |
| Best Practices | 100 | 100 |
| LCP | < 1.0s | < 2.0s |
| FCP | < 0.6s | < 1.2s |
| CLS | < 0.05 | < 0.05 |
| INP | < 100ms | < 150ms |
| TBT | < 50ms | < 200ms |

### 6.2 Bundle budget (initial-route JS, gzipped)

| Route | Hard limit | Loads |
|---|---|---|
| `/` (home) | 120KB | GSAP core + ScrollTrigger + DrawSVG + Lenis + all interaction actions + Manifesto canvas |
| `/blog`, `/projects`, `/services` (listings) | 80KB | Core + ScrollTrigger + interactions. MorphSVG + Flip lazy-loaded. |
| `/blog/[slug]` (detail) | 70KB | Interactions only + Shiki highlighter |
| `/projects/[slug]` (detail) | 70KB | Interactions only |
| `/services/[slug]` (detail) | 70KB | Interactions only |
| `/about` | 70KB | No scrubs; static bento + hovers |
| `/contact` | 60KB | No scrubs, no morph — lightest route |
| `/tech-stack` | 80KB | StackDiagram SVGs, StackNode interactions |

### 6.3 GSAP plugin strategy

| Plugin | Where | Approx size (gzipped) | Load strategy |
|---|---|---|---|
| gsap core + ScrollTrigger | Every route | ~30KB | Module-level import |
| DrawSVGPlugin | Home, Closer | ~15KB | Lazy — `loadDrawSVG()` at route |
| MorphSVGPlugin | Listings | ~20KB | Lazy — `loadMorphSVG()` on first hover |
| Flip | Listings | ~10KB | Lazy — `loadFlip()` on first filter change |
| CustomEase | Home (`networkDraw`) | ~3KB | Lazy — `loadCustomEase()` |
| SplitText | Nowhere | 0 | **Removed** — crescendo replaces char-stagger |
| MotionPathPlugin | Nowhere | 0 | **Removed** — train components deleted |

### 6.4 Animation runtime rules

1. **Composite-only animations.** Only `transform`, `opacity`, `stroke-dashoffset`, CSS variables. No `width`/`height`/`top`/`left`/`padding`/`margin` inside a scrub or tween.
2. **No `filter: blur` or `filter: drop-shadow`.** Site-wide ban.
3. **Max 1 ScrollTrigger pin per route** (home hero only).
4. **Max 4 concurrent scrubs per route** (home: hero + manifesto + projects edge + services edge = 4).
5. **All idle loops IntersectionObserver-gated.** Pause when offscreen via `animation-play-state: paused`.
6. **All GSAP plugins dynamic-imported** except core + ScrollTrigger.
7. **Shared `gsap.ticker`** — no component may start its own `requestAnimationFrame` loop.
8. **No animation property set on `display: none` elements.**

### 6.5 Verification workflow

- `bun run bundle-size` with `rollup-plugin-visualizer` — per-PR bundle-budget check
- Chrome DevTools MCP `lighthouse_audit` on every route, desktop + mobile, at end of 17e-4 and 17e-6
- Chrome DevTools MCP `performance_start_trace` during hero scrub on mobile emulation — verify 60fps
- Claude Preview visual verification on every UI task (CLAUDE.md Iteration Protocol)

### 6.6 What's NOT in budget

- Lighthouse CI integration (scope creep — manual verification via DevTools MCP is sufficient for 17e)
- Custom RUM dashboards
- Long-term Sentry integration

---

## 7. Load Veil Principle

A design principle that pairs with the Snappy Doctrine. Not a feature — an architectural constraint.

> The hero's MetroNetwork scroll-scrub is the only LCP-critical path. Everything below it loads silently while the user scrubs. By the time they exit the hero, downstream sections are ready and feel instant.

**Required mechanics:**

- MetroNetwork SVG inlined at build, `fetchpriority="high"`, no runtime fetch
- All non-hero images: `loading="lazy" decoding="async"`
- `IntersectionObserver` with `rootMargin: "100vh 0px"` eager-loads the section about to enter view
- Heavy components (Manifesto canvas, Projects, Services, Closer) dynamic-imported
- SvelteKit `preloadData` / `preloadCode` on `<a>` hovers — already default behavior
- Any third-party JS (Shiki, etc.) loads after hero LCP

The scroll through hero gives the browser 800vh of scroll time (seconds) to prepare everything downstream without the user perceiving loading states.

---

## 8. Motion × SEO Contract

Slice 15 (SEO + Metadata) runs after 17b (service layer). 17e must not create obstacles for 15.

1. **DOM default = final state.** Every scrub target's initial CSS renders identically to what SSR (and a crawler) produces — full scale, full opacity, full stroke, final text content. JS only applies delta on scroll. **Forbidden** in default CSS: `opacity: 0`, `transform: scale(0)`, `stroke-dashoffset: 100%` on scrub targets. SSR + reduced-motion + JS-disabled render the same visible content.

2. **Heading hierarchy preserved through animation.** Crescendo scrub uses only `transform: scale(...)`. No tag swap, no text swap, no DOM reordering. `<h1>` / `<h2>` / `<h3>` semantics unchanged regardless of scroll position.

3. **Edge title semantics decided per-element.** If the rotated "Projects." / "Services." edge title **duplicates** the section's primary heading → `aria-hidden="true"` (decorative). If it **is** the primary heading → keep semantic, no `aria-hidden`, no `font-size: 0`. Decision documented per section in the implementation plan.

4. **All navigation via real `<a href>`.** No JS-driven `<div onclick>` navigation. Crawlers follow hrefs. Also fixes a class of tap-vs-click bugs.

5. **No content in canvas or offscreen-only DOM.** ManifestoCanvas stays `aria-hidden="true"` (decorative). Text that matters to SEO lives in the Svelte template, not painted in canvas.

6. **No `display: none` toggling on content** during scrub or interaction. Use `opacity` / `transform` / `visibility: hidden` only when content is genuinely inert.

7. **Lazy-loaded sections still render in SSR.** Code-splitting is a JS bundle concern — it must not remove content from SSR HTML. Manifesto, Projects, Services, Closer text lives in the SSR payload.

8. **Meta + structured data untouched.** Motion layer does not touch `<head>`, JSON-LD, OG tags, or `<title>`. Slice 15 owns these.

9. **LCP candidate policy.** Hero LCP is either the wordmark `<h1>` or the MetroNetwork `<svg>` inlined in SSR HTML (no runtime fetch).

**Enforcement:**

- Unit tests assert default CSS state on scrub targets (pre-JS render)
- `bun run check` (svelte-check) catches most a11y / semantic issues
- During 17e-6 verification: view-source on each route, confirm text content present without JS
- Lighthouse SEO score must stay at 100 throughout 17e

---

## 9. Scope & Session Estimate

### 9.1 Sub-slice breakdown

Six sub-slices, each shipping as its own PR.

| Sub-slice | Scope | Sessions |
|---|---|---|
| **17e-1 Foundation** | `motion/tokens.ts` + mirror to `tokens.css`. `motion/utils/ticker.ts`. Refactor `motion/utils/gsap.ts` with lazy plugin loaders. Remove `ScrollTrigger.normalizeScroll` from `motion/utils/lenis.ts`. Tests. Add `rollup-plugin-visualizer`. | 1 |
| **17e-2 Snappy Sweep** | Delete `actions/reveal.ts` + 27+ call sites. Delete `actions/ripple.ts`, `actions/tilt.ts`, all `motion/svg/Train*`, `motion/components/ScrollRail.svelte` + all tests. Strip entrance tweens from BlogDetailHeader, ProjectDetailHeader, ProjectDetailSidebar, FeaturedProjects, HomeServices, TagList, ProjectCard, BlogRow, ProjectMiniCard. Remove `opacity:0` seed CSS. FLIP-on-filter moves to `utils/flip.ts`. | 1 |
| **17e-3 Scrub Factories** | Build `scrubs/createDrawScrub.ts`, `scrubs/createCrescendoScrub.ts`. Apply crescendo to Manifesto 3-line (replaces SplitText). Apply crescendo to rotated edge titles on Projects + Services sections. Apply draw-scrub to Blueprints + circuit grid. Enforce SEO DOM-default-state rule in CSS. | 1 |
| **17e-4 Hero Timeline Rewrite** | Build `scrubs/createHeroTimeline.ts` as a self-contained factory (does not delegate to `createDrawScrub` — composes GSAP + ScrollTrigger + DrawSVG directly for the hero's unique pin behavior). Inline MetroNetwork SVG at build (remove runtime fetch). SVGO pass. Mobile branch: ~300vh pin, full network, Phase 5 zoom preserved. Delete `utils/heroTimeline.ts`. Evaluate `heroScrollLock.ts` keep-or-cut. | 1.5 |
| **17e-5 Interaction Consolidation** | Move `morphHelpers.ts` → `actions/morphHover.ts`. Standardize action APIs. Consolidate 4× LED pulse keyframes → one global `.led-pulse`. Replace typewriter `setInterval` blink with CSS. Gate ManifestoCanvas + countdown + ReadingProgressBar with IntersectionObserver via shared ticker. | 1 |
| **17e-6 Closing** | Rewrite `docs/reference/MOTION.md` v2.0. Amend `docs/reference/CONSTITUTION.md` with Snappy Doctrine section. Update `docs/reference/CSS.md` with motion tokens. Chrome DevTools MCP Lighthouse audit on all routes (desktop + mobile). Bundle size verification. Learning docs under `docs/learn/motion/`. Devlog + handoff + tree.txt. | 0.5–1 |

**Total: 6–6.5 sessions.**

### 9.2 Recommended ordering

```
17e-1 Foundation
       │
       ├──► 17e-2 Snappy Sweep ──┐
       │                         │
       ├──► 17e-3 Scrub Factories├──► 17e-6 Closing
       │                         │
       ├──► 17e-4 Hero Timeline ─┤
       │                         │
       └──► 17e-5 Interactions ──┘
```

17e-1 is a hard dependency for everything. 17e-2…17e-5 can ship in any order after 17e-1; recommended order puts deletions first so later diffs are cleaner. 17e-6 closes.

### 9.3 Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Crescendo on rotated edge titles feels wrong visually | Medium | Prototype on one section in 17e-3; iterate via Claude Preview before applying to second |
| `normalizeScroll` removal breaks scroll-scrub on a rare device | Low | Chrome DevTools MCP mobile emulation in 17e-1; cover iOS Safari + Android Chrome |
| Mobile LCP regresses from inlined MetroNetwork SVG | Medium | SVGO pass + `content-visibility: auto` on offscreen sections; Lighthouse check at 17e-4 end |
| Hero feels "slower" without on-load reveals (perception) | Low-Medium | Verify hero scrub fires on scroll; interactions remain snappy. Yesid approval gate after 17e-2 |
| Bundle budget missed on some route | Low | `rollup-plugin-visualizer` added in 17e-1; per-PR check |
| `heroScrollLock.ts` turns out to be required | Low | Keep; scope out "nice-to-have" deletion |

### 9.4 Success criteria (definition-of-done for all of 17e)

- All 9 signatures documented and wired per Section 3 table
- HomeCloser graffiti exception preserved and documented
- Zero `use:reveal` call sites in the codebase
- Zero entrance animations on article pages
- Every file in the Kill List (Section 4.4 + 4.5) is deleted or rewritten per plan
- Lighthouse Performance: desktop ≥ 98, mobile ≥ 90 on all routes
- Lighthouse Accessibility + SEO + Best Practices: 100/100/100 on all routes
- Bundle budgets (Section 6.2) met per route
- `bun run test` and `bun run check` pass
- Tap-vs-click bug on mobile resolved (TocPill + ProjectsStrip confirmed working on real iOS + Android)
- `docs/reference/MOTION.md` v2.0 replaces v1.0
- CONSTITUTION.md has Snappy Doctrine section
- Learning doc published in `docs/learn/motion/`

### 9.5 Out of scope (deferred)

- Hero "skip intro" session feature — deferred (user directive; revisit in a future dedicated UX slice)
- Lighthouse CI integration — manual verification sufficient for 17e
- Unrelated dead code cleanup — belongs in 17a-4
- Light theme motion polish — later pass
- Custom Lottie animations — MOTION.md v2.0 will state marketplace-only (existing posture)

---

## 10. Decision Log

Decisions recorded this planning session (continue from 17d's D240):

- **D241:** Snappy Doctrine — content renders at final state on load; motion triggers only on interaction, scroll-scrub, or idle ambient. Forbidden: all entrance animations on load or scroll-into-view.
- **D242:** HomeCloser graffiti is the one doctrine exception — retains on-enter DrawSVG timeline + hover. Justified as the narrative destination.
- **D243:** Signature vocabulary is closed at 9 — boop, cursor glow + magnetic, wordmark hover, SVG morph hover, MetroNetwork hero scrub, DrawSVG scrub (other SVGs), crescendo scrub, LED pulse, typewriter idle. Future additions require spec revision.
- **D244:** Architecture is Hybrid C — `actions/` for interactions, `scrubs/` for scroll-linked factories, `ambient/` for idle, `tokens.ts` + CSS custom properties as single timing/easing source, one shared `gsap.ticker`.
- **D245:** Mobile posture — full MetroNetwork network preserved, Phase 5 Berri-UQAM zoom preserved, pin length compressed to ~300vh, earned via perf work (inline SVG, SVGO, `content-visibility`, lazy plugins, IntersectionObserver gating).
- **D246:** `ScrollTrigger.normalizeScroll({ allowNestedScroll: true })` is removed — single fix for tap-vs-click bug on mobile (TocPill vertical-scroll open, ProjectsStrip horizontal-swipe nav).
- **D247:** `motion/svg/Train*` tree deleted — orphaned code, imported only by its own tests.
- **D248:** Train drop-shadow filter replacement is moot (train deleted). Site-wide ban on `filter: blur` and `filter: drop-shadow` in animations.
- **D249:** Load Veil Principle — hero is the only LCP-critical path; everything below lazy-loads silently during scrub. Not a feature, an architectural constraint.
- **D250:** Hero session-scoped skip + replay toggle deferred to a future slice. 17e ships with full hero on every visit.
- **D251:** Motion × SEO Contract — 9 rules (Section 8). Default CSS = final state, heading hierarchy preserved, real `<a href>` navigation, no content in canvas, LCP on wordmark or inlined MetroNetwork SVG.
- **D252:** Crescendo targets — Manifesto 3-line statement (replaces SplitText char-stagger), rotated edge titles "Projects." / "Services." on respective home sections. Hero and Closer exempt.
- **D253:** Departure-flap letters cut — violates Snappy Doctrine in all feasible placements; user kept flap unsure and chose to cut entirely.
- **D254:** Count-up, marquee drift, line-mask reveal, progress rail + stations, color-break section — all cut. Count-up/marquee/line-mask violate snappy; progress rail and color-break require new elements (user rule: no new elements for the sake of animating).
- **D255:** Lighthouse targets — desktop ≥ 98, mobile ≥ 90 on all routes. Accessibility + SEO + Best Practices hold at 100/100/100.
- **D256:** Bundle budgets per route — home 120KB, listings 80KB, article details 70KB, about 70KB, contact 60KB, tech-stack 80KB (gzipped, initial JS).
- **D257:** GSAP plugins lazy-loaded per route — DrawSVG on home + closer only, MorphSVG on listings, Flip on listing filter, CustomEase on home. SplitText and MotionPathPlugin removed entirely.
- **D258:** 6 sub-slices for 17e (17e-1…17e-6), estimated 6–6.5 sessions total. 17e-1 foundation blocks all others; 17e-2…17e-5 can ship in any order; 17e-6 closes.

---

## 11. Artifacts

- This design spec: `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
- Brainstorm visuals: `.superpowers/brainstorm/488-1776379928/content/` (signature vocabulary, trigger model)
- Implementation plans: `docs/plans/2026-04-17-slice-17e-*.md` (per sub-slice, written as work began)
- **MOTION.md v2.0: `docs/reference/MOTION.md` (written 17e-6, supersedes v1.0)**
- **CONSTITUTION.md Snappy Doctrine section: `docs/reference/CONSTITUTION.md` § 8 (rewritten 17e-6)**
- Per-sub-slice specs: `docs/slices/slice-17e-{1..6}-*.md`
- Motion learning docs: `docs/learn/motion/*.md` (6 concepts, written 17e-6)
- Closing devlog: `docs/devlog/2026-04-17-slice-17e-closing.md`
- Closing handoff: `docs/handoffs/handoff-slice-17e.md` (full-slice retrospective)

---

## Amendments (2026-04-17)

These amendments capture decisions made during 17e-3 through 17e-6 implementation. They override earlier §2–§10 text where they conflict.

- **D263 (17e-3 planning):** Terminus rotated label is a crescendo-scrub target. The Closer doctrine exception (§3.4) covers ONLY the in-section DrawSVG graffiti timeline, not the edge title. §3.2's Crescendo-scrub row's target list is updated: "Manifesto 3-line statement, rotated edge titles on Projects + Services + Terminus sections." All three rotated edge titles are primary `<h2>` headings — semantic first, visual second; no `aria-hidden`.

- **D264 (17e-4):** `heroScrollLock.ts` cut. Typewriter becomes pure ambient (signature 9) — runs on shared ticker + CSS-keyframe cursor blink. First-visit "plays at you" scroll-lock removed. If the user scrolls past mid-animation, the type-sequence truncates; it's ambient, not narrative-critical.

- **D265 (17e-4):** MetroNetwork SVG inlined via Vite `?raw` import + one-time `svgo` CLI pass. Source file is the optimized committed version. `svgo.config.mjs` disables `convertColors` / `mergePaths` / `cleanupIds` to preserve classification attributes (case-sensitive `#E07800`) and per-station path granularity. SVGO 4 removed the `--disable` CLI flag, so the config file is required. Re-run procedure documented in `docs/reference/MOTION.md` § 13.

- **D266 (17e-4):** Drawing motion (DrawSVG stroke-tracing, morphSVG path tracing, motionPath tracing) is doctrine-compatible even on enter. The drawing IS the content, not a delivery mechanism. §2 Forbidden list clarified: pure fade-up / scale-in / stagger reveals remain forbidden (they read as loading states); drawing-motion entries do not. Affected re-classification: `SvgIcon.animateDraw`, `SvgIcon.animateDrawFill`, `SvgIcon.animateMorph` (cleared), `DataFlowDiagram` DrawSVG entrance (cleared), `StackConnections` DrawSVG entrance (cleared). Still violations: `SvgIcon.animateStagger` (deleted 17e-5), `StackScenarioCard` fade-up (deleted 17e-5).

- **D267 (17e-5):** (E2) `morphHelpers.ts` → `actions/morphHover.ts` — promoted into a first-class Svelte action (not a file rename); `morphHelpers.ts` retained as the `convertSvgToMorphPaths` helper since SvgIcon is also a consumer. (F) `SvgIcon.animateStagger` + `StackScenarioCard` `onMount` fade-up deleted — both D266 violations. (G2) Ripple stays cut; doctrine vocabulary stays at 9 signatures.

- **D268 (17e-4):** **Scrub owns `scrollPrompt` opacity exclusively.** Typewriter owns text + cursor only. Invariant documented in `createHeroTimeline.ts` header to prevent regression. Emerged from an iteration-2 bug fix where typewriter's `startBlink` was writing inline `opacity: '1'` that persisted past the Phase 1a fade window.

- **D269 (17e-5):** `registerGsapPlugins()` deleted. Three plugins stay eagerly imported in `motion/utils/gsap.ts` (ScrollTrigger site-wide, SplitText for wordmarkHover sync coupling, MorphSVGPlugin for morphHelpers.convertToPath static call). The other plugins (DrawSVG, MorphSVG registration, Flip, CustomEase, MotionPath, SplitText registration) are lazy-loaded per consumer via `loadX()` functions. `initScrollTriggerConfig()` replaces `registerGsapPlugins()` as the canonical ScrollTrigger init. Consumer-wide migration complete. Bundle shrink target (home /: −3 to −8 KB) did NOT land — static imports in `flip.ts` + `createHeroTimeline.ts` for sync API access (captureFlipState, CustomEase.create) defeat Vite's lazy chunk split. Flagged as deferred opportunity (post-17e async refactors of captureFlipState + wordmarkHover).

### §6.1 Lighthouse target transfer

The Lighthouse Performance targets (D255 — desktop ≥ 98, mobile ≥ 90) were **not met** at 17e closing. Audit results pasted into `docs/devlog/2026-04-17-slice-17e-closing.md`. 20 runs, Best Practices 100 across the board, but Performance in 54–98 range (0 of 10 mobile routes met the 90 target; home mobile at 54 is the worst).

**Decision (2026-04-17):** close 17e with the Lighthouse gap documented, transfer §6.1 targets to downstream slices per `docs/roadmap/PLAN.md`:

- **Mobile Performance** (all routes) → **Slice 19 — Mobile UI/UX Optimization**
- **Accessibility 95–96 on listings + blog detail** → **Slice 19b — Accessibility (A11Y) Optimization** (targets 95+ already)
- **Scroll-scrub smoothness** → **Slice 20 — Scroll Smoothness + Animation Polish**
- **Site-wide frame-rate verification** → **Slice 21 / Slice 16 E2E**
- **SEO 82–83 on home + blog tree** — unscoped; likely a missing-meta-description fix (fold into Slice 19 or ticket separately)

17e's architectural goals all landed (Snappy Doctrine, 9-signature vocabulary closed, one RAF site-wide, lazy plugin foundation, MetroNetwork SSR, factories, use:morphHover, legacy symbol deletion). The Lighthouse gap is a perf-quality-polish concern, not an architectural failure.
