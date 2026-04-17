# Slice 17e-1 — Motion Foundation

**Status:** In progress
**Branch:** `feature/slice-17e-1-foundation`
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-16-slice-17e-1-foundation.md`
**Depends on:** nothing (first 17e sub-slice)
**Blocks:** 17e-2 (Snappy Sweep), 17e-3 (Scrub Factories), 17e-4 (Hero Timeline), 17e-5 (Interaction Consolidation)

## What

Motion infrastructure the other 17e sub-slices depend on.

## Outcomes

1. `src/lib/motion/tokens.ts` exports `duration` and `ease` constants that mirror `tokens.css` CSS custom properties, with a unit test asserting parity.
2. `src/lib/styles/tokens.css` has the complete motion token set (`--duration-instant`, `--duration-fast`, `--duration-normal`, `--duration-slow`, `--duration-slower`, `--ease-default`, `--ease-out`, `--ease-in-out`, `--ease-bounce`).
3. `src/lib/motion/utils/ticker.ts` exposes `subscribe(id, fn)` + `unsubscribe(id)` on a single `gsap.ticker` callback. One frame → one DOM pass for all subscribers.
4. `src/lib/motion/utils/gsap.ts` registers only `ScrollTrigger` eagerly. `loadDrawSVG`, `loadMorphSVG`, `loadFlip`, `loadCustomEase` are async loaders that register-on-demand + are idempotent.
5. `src/lib/motion/utils/lenis.ts` does not call `ScrollTrigger.normalizeScroll`. Touch devices use native browser scroll (no scroll-jacking on mobile).
6. `rollup-plugin-visualizer` produces `dist/stats.html` on production build. `bun run bundle-size` is a working script.
7. `bun run test` and `bun run check` pass. Zero visual regression on the running site.

## Acceptance criteria

- [ ] All outcomes above are verified
- [ ] Tap-vs-click bug on mobile is resolved on a real iPhone + Android device (TocPill opens only on tap, ProjectsStrip links fire only on tap)
- [ ] Home route initial JS bundle size is reported by `bun run bundle-size` (baseline number recorded for future 17e sub-slices to compare against)
- [ ] No hardcoded timing values introduced by this sub-slice (all reads go through `tokens.ts` or CSS `var(--duration-*)` / `var(--ease-*)`)

## Non-goals

- Deleting existing `use:reveal` / entrance animations (that is 17e-2)
- Building scrub factories (17e-3, 17e-4)
- Consolidating LED pulse / cursor blink / RAF loops (17e-5)
- Rewriting MOTION.md (17e-6)

## Baseline bundle sizes (17e start — after 17e-1 Foundation)

Recorded from `bun run bundle-size` (`rollup-plugin-visualizer` emits `dist/stats.html`; vite build prints per-chunk gzip sizes). Measured on `feature/slice-17e-1-foundation` at commit e5d9ef5 (pre-Task-7).

**Per-route SvelteKit node (route entry chunk), gzipped:**

| Route | Node # | Node gzip | Node raw |
|---|---|---|---|
| Home `/` | 4 | **32.39 KB** | 155.28 KB |
| Blog listing `/blog` | 6 | 0.53 KB | 0.94 KB |
| Blog personal `/blog/personal` | 7 | 0.53 KB | 0.92 KB |
| Blog detail `/blog/[slug]` | 8 | **14.39 KB** | 48.95 KB |
| Projects listing `/projects` | 10 | **17.17 KB** | 90.03 KB |
| Projects detail `/projects/[slug]` | 11 | 7.95 KB | 22.83 KB |
| Services listing `/services` | 12 | 2.85 KB | 7.04 KB |
| Services detail `/services/[id]` | 13 | 3.71 KB | 12.02 KB |
| About `/about` | 5 | 8.47 KB | 25.87 KB |
| Contact `/contact` | 9 | 14.67 KB | 45.46 KB |
| Tech stack `/tech-stack` | 14 | 2.08 KB | 5.26 KB |
| **Shared layout (node 0)** | 0 | 13.18 KB | 37.93 KB |
| **Error page (node 1)** | 1 | 2.30 KB | 7.48 KB |

**Notes on methodology:**

- Numbers are **route-node only** (the SvelteKit entry for that route's `+page.svelte`). They do NOT include shared chunks imported transitively — those live in `_app/immutable/chunks/*.js` and load once per session then cache across routes.
- For the design spec §6.2 per-route budgets (home 120KB, listings 80KB, etc.), use `dist/stats.html` treemap — it shows the full import closure per entry.
- What 17e-1 baselines: these raw numbers are the **before** state. Subsequent 17e sub-slices (17e-2 through 17e-5) report the delta against this table in their handoffs.
- The ~32 KB home node reflects the hero + manifesto + projects + services + closer composition. That's the primary target for 17e-4 (hero timeline rewrite + inlined MetroNetwork SVG) and 17e-5 (ambient consolidation).
- The ~17 KB projects listing + ~14 KB blog detail reflect MorphSVG hover + Shiki highlighter. MorphSVG becomes lazy in 17e-2/17e-3 migrations — expected delta of ~5–10 KB on listings.

**To re-generate:**

```bash
bun run bundle-size
# Opens/writes dist/stats.html — interactive treemap, read per-route gzip sizes from there.
```

## Iteration log

(Fill in per task as the session progresses.)
