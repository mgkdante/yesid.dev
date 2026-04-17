# Handoff: Slice 17e-4 — Hero Timeline Rewrite

**PR:** [yesid.dev#17](https://github.com/mgkdante/yesid.dev/pull/17) (squash-merged 2026-04-17, commit `b6e3a57`)
**Branch:** `feature/slice-17e-4-hero-timeline` (deleted after merge)
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md`
**Implementation plan:** `docs/plans/2026-04-17-slice-17e-4-hero-timeline.md`
**Slice spec:** `docs/slices/slice-17e-4-hero-timeline.md` (contains iteration log + bundle-size delta table)

## 1. Objective Completed

**Implemented:**

- `src/lib/motion/scrubs/createHeroTimeline.ts` — sync factory composing `ScrollTrigger` + pin + `DrawSVG` stroke scrub + station/label fades + Phase 5 Berri-UQAM zoom + Phase 6 cross-fade + Phase 7 hero-text zoom-out. Full 9-phase choreography ported verbatim from the old `utils/heroTimeline.ts` with internal `CustomEase.create('networkDraw')` and reduced-motion branch. Factory is synchronous; caller must `await loadDrawSVG()` + `await loadCustomEase()` before invoking.
- `src/lib/motion/svg/MetroNetwork.svelte` — runtime `fetch('/images/montreal-metro.svg')` replaced with Vite `?raw` import + `{@html}`. SVG is now in SSR HTML; valid LCP candidate per design spec §8 rule 9.
- `static/images/montreal-metro.svg` — one-time `svgo@4.0.1` pass via new `svgo.config.mjs`: **21.175 KB → 15.083 KB (28.8%)**. Config disables `convertColors` / `mergePaths` / `cleanupIds` to preserve classification attributes (`#E07800` case-sensitive) and per-station path granularity (87 stations animated individually).
- `src/lib/components/home/HeroBanner.svelte` — rewired: `buildHeroTimeline(refs, callbacks)` + `gsap.matchMedia` wrapper → `createHeroTimeline(pinContainer, opts)` with `pinLength: isMobile ? '300%' : '800%'` via a single `window.matchMedia('(max-width: 1023px)')` at mount. Dedicated reduced-motion early branch preserves the static preview without running typewriter or visibility listener.
- `src/lib/motion/utils/heroScrollLock.ts` **deleted** (D264). Typewriter now runs `typewriter.type(() => {})` on every visit — pure ambient; truncates gracefully on early scroll.
- `src/lib/motion/utils/heroTypewriter.ts` — cursor blink migrated from `setInterval` to CSS via `classList.add/remove('typewriter-cursor')`. Also removed the `scrollPrompt.style.opacity = '1'` write inside `startBlink` (Yesid-caught bug — see §9).
- `src/lib/motion/utils/heroTimeline.ts` **deleted** (−222 lines). Dead code post-Task-4.
- **Mobile hero polish** (6 follow-up commits from iterative review):
  - New `--text-hero-mobile: clamp(3rem, min(13vw, 8svh), 4rem)` token in `@theme`. `HeroTextContent` spans use `text-hero-mobile md:text-hero`. No hardcoded clamp values in the component.
  - `.hero-viewport-text` mobile: `padding-block: 0.75rem`, edge-to-edge (no `padding-inline`).
  - `HeroMetrics.svelte` — single `Card` with 3 metrics laid out horizontally on mobile; 3-card grid on desktop. Saves ~150px of vertical space so the full hero (headline + metrics + subhead + subtitle + CTAs) fits in `calc(100svh - 5rem)` on short phones (iPhone SE, 12 mini).
  - `AboutMetrics.svelte` — stack on mobile (`flex-col md:flex-row`).
  - `HeroMobileSql.svelte` — `py-10` → `pb-10 pt-4` so the SQL section sits closer to the CTAs.
  - `MetricDisplay.svelte` — one-step-smaller size mappings (`lg → text-title`, `md → text-heading`, `sm → text-subheading`) + `.metric-value` marker class for a mobile-only `lg` shrink override in `app.css`.
- `src/app.css` — added `@keyframes typewriter-blink { to { visibility: hidden; } }` + `.typewriter-cursor` class + `.scroll-block-cursor` default (moved from HeroBanner scoped style to resolve Svelte-scoped specificity fight). Reduced-motion rule disables the animation.
- `src/app.d.ts` — `declare module '*.svg?raw'` ambient type.
- `.gitignore` — excludes `static/images/*.source.svg` local backups.

**Intentionally not implemented:**

- Typewriter type-sequence `setInterval` → shared `ticker.ts` (17e-5 consolidates all ambient RAF / setInterval loops, including `ManifestoCanvas` and `ReadingProgressBar`).
- `morphHelpers.ts` → `actions/morphHover.ts` rename (17e-5).
- LED pulse consolidation (17e-5).
- `CloserGraffiti` rebuild as `createCloserTimeline` (optional polish, 17e-5 or later).
- `SplitText` lazy migration (17e-5 or later, blocked on `wordmarkHover` sync-action shape per 17e-3 Task 7 deferral).
- Full Lighthouse audit on every route (17e-6).
- Consumer-wide migration off `registerGsapPlugins()` to pure lazy loaders (17e-5 / 17e-6 — see §12 for why this didn't land).
- MOTION.md v2.0, CONSTITUTION.md Snappy Doctrine amendment, `docs/learn/motion/*` (17e-6 closing).

## 2. High-Level Summary

The hero's scroll-scrubbed timeline is now a self-contained factory matching the 17e-3 scrub-factory convention. MetroNetwork SVG is inlined at build; the runtime `fetch(...)` that used to block LCP paint is gone. `heroScrollLock` is deleted, so the typewriter plays as pure ambient on every visit — no more "plays at you" viewport lock. Cursor blink is CSS-driven (one fewer JS timer per hero mount).

Mobile hero layout received six iterations of polish to fit inside `calc(100svh - 5rem)` on short phones: single-card merged metric row, tighter padding, new mobile-only typography token, edge-to-edge layout. Desktop was explicitly untouched throughout per Yesid ("desktop is perfecto").

Two bug fixes Yesid caught during iterative review landed as separate commits: **Phase 1a snap-fade** for the scrollPrompt on any scroll (was staying visible for ~136vh because Phase 2 fade didn't start until progress 0.17), and **typewriter opacity handoff** to the scrub (`startBlink` was writing inline `opacity: '1'` that stuck past the scrub window). Both are now documented in the factory code comments so future maintainers won't re-introduce them.

No runtime regressions. Tests: 767 → 774 (+7 net new: 6 factory + 1 mobile wrapper). `bun run check`: 0 errors, 19 warnings unchanged.

## 3. Files Created

| File | Purpose |
|------|---------|
| `docs/slices/slice-17e-4-hero-timeline.md` | Narrow slice spec + iteration log + bundle-size delta table |
| `src/lib/motion/scrubs/createHeroTimeline.ts` | 9-phase sync factory for the hero |
| `src/lib/motion/scrubs/createHeroTimeline.test.ts` | 6 unit tests |
| `svgo.config.mjs` | One-time SVGO runner config (preserves classification attributes + per-path granularity) |

## 4. Files Modified

| File | What Changed | Why |
|------|--------------|-----|
| `src/lib/motion/svg/MetroNetwork.svelte` | `fetch()` → Vite `?raw` + `{@html}`; try/catch removed; onMount classification now runs sync on inlined SVG | §7 Load Veil + §8 rule 9 — no runtime fetch, SVG is a valid LCP candidate |
| `src/lib/motion/svg/MetroNetwork.test.ts` | Stale "SVG is fetched async" comment refreshed | Reflect the new inlined reality |
| `src/lib/components/home/HeroBanner.svelte` | Dropped `buildHeroTimeline` + `createScrollLock` imports + their wiring; added `loadDrawSVG` + `loadCustomEase` preloads; `createHeroTimeline` call with mobile pin branch; reduced-motion early return | Task 4 + Task 5 — factory wiring + D264 (scroll lock removal) |
| `src/lib/motion/utils/heroTypewriter.ts` | `setInterval` blink → class toggle; removed `scrollPrompt.style.opacity = '1'` write from `startBlink` | Task 6 (CSS blink) + bug fix (scrub-vs-typewriter opacity conflict) |
| `src/lib/components/home/HeroTextContent.svelte` | Spans use `text-hero-mobile md:text-hero`; scoped `.hero-viewport-text` mobile `padding-block: 0.75rem`; old hardcoded clamp removed | Mobile polish (iteration with Yesid) |
| `src/lib/components/home/HeroMetrics.svelte` | Mobile single-card layout (horizontal metrics + dividers) + desktop 3-card grid (unchanged) | Fit the hero inside `calc(100svh - 5rem)` on short phones |
| `src/lib/components/home/HeroMetrics.test.ts` | Split desktop / mobile card-count assertions; switched value/label assertions to `getAllByText` | Each metric now renders twice (mobile + desktop variant) |
| `src/lib/components/home/HeroMobileSql.svelte` | `py-10` → `pb-10 pt-4` | Shorten gap between hero CTAs and mobile SQL section |
| `src/lib/components/about/AboutMetrics.svelte` | Inner row `flex` → `flex-col md:flex-row` | Stack on mobile per Yesid brief |
| `src/lib/components/brand/MetricDisplay.svelte` | Added `.metric-value` marker class; shifted size mappings one step down | Enables mobile-only `lg` shrink via CSS + reduces metric numbers across the board (labels unchanged) |
| `src/lib/components/brand/__tests__/MetricDisplay.test.ts` | Updated expected class names for new size mappings | Match new defaults |
| `src/lib/motion/scrubs/index.ts` | Re-export `createHeroTimeline` + `HeroTimelineOpts` | Barrel surface |
| `src/app.css` | `.scroll-block-cursor` default moved here; `.typewriter-cursor` class + `@keyframes typewriter-blink`; `--text-hero-mobile` token; mobile-only `.metric-value.text-title` override; reduced-motion rules | Global surfaces — scoped styles don't work for classes toggled via JS |
| `src/app.d.ts` | `declare module '*.svg?raw'` | Vite `?raw` import typed |
| `static/images/montreal-metro.svg` | SVGO pass (in-place) | 21.2 KB → 15.1 KB |
| `.gitignore` | `static/images/*.source.svg` | Backup stays local |

## 5. Files Deleted

| File | Reason |
|------|--------|
| `src/lib/motion/utils/heroTimeline.ts` | Replaced by `scrubs/createHeroTimeline.ts` (−222 lines) |
| `src/lib/motion/utils/heroScrollLock.ts` | D264 — "plays at you" pattern contradicts Snappy Doctrine (−74 lines) |

## Concepts Documented

| Action | File | Domain |
|--------|------|--------|
| Deferred to 17e-6 closing | `docs/learn/motion/*.md` | motion |

_17e-4 ships the hero rewrite + MetroNetwork inlining + typewriter CSS blink. Learning docs (factory pattern, Load Veil Principle, Snappy Doctrine) are batched to 17e-6 closing per the design spec._

## 6. Data Model Changes

None. Only CSS + motion-layer types touched.

## 7. Validation Results

```
bun run check: PASS — 0 errors, 19 pre-existing warnings (unchanged from 17e-3 baseline)
bun run test:  PASS — 774/774 tests passing
  Delta from 17e-3 end (767):
    + 6  createHeroTimeline factory tests
    + 1  HeroMetrics mobile single-card wrapper test
    = +7 tests total
bun run bundle-size: PASS — dist/stats.html generated
```

Per-route SvelteKit node gzipped delta (17e-1 baseline → 17e-4 end):

| Route | Node | 17e-1 baseline | 17e-4 end | Δ |
|---|---|---|---|---|
| **Home `/`** | 4 | 32.39 KB | **34.57 KB** | **+2.18** |
| Blog detail `/blog/[slug]` | 8 | 14.39 | 14.15 | −0.24 |
| Projects detail | 11 | 7.95 | 7.61 | −0.34 |
| About | 5 | 8.47 | 8.19 | −0.28 |
| All others | — | — | — | flat or ≤ ±0.1 |

Shared layout (node 0) + error (node 1) unchanged. Home +2.18 KB — see §12.

Preview verification (desktop + mobile real device + reduced-motion) performed by Yesid before PR approval, including the two iterative bug fixes (Phase 1a early fade + typewriter opacity handoff).

## 8. Errors Encountered

- **SVGO default preset destroyed animation targets.** First pass reduced 42.5% but lowercased `#E07800 → #e07800` (breaking `stroke === '#E07800'` classification in MetroNetwork) and merged 87 station `<path>` elements into 1 (breaking per-station opacity fades). Also SVGO 4 dropped the `--disable` CLI flag.
  - **Fix:** Wrote `svgo.config.mjs` with `overrides: { convertColors: false, mergePaths: false, cleanupIds: false }`. Reduction dropped to 28.8% but animation remained intact. Documented rationale in the config file's header comment.
  - **Resolved:** yes (committed `e5d78ce`).

- **Bug: typewriter billboard stayed visible after scroll, even when scrolled well past Phase 2.** Reproduction: load page, wait for typewriter mid-type, scroll. Billboard should fade via Phase 1a (introduced earlier in the session). Reality: it briefly faded, then reappeared and stuck.
  - **Cause:** `startBlink()` writes `scrollPrompt.style.opacity = '1'` at the end of the type sequence. With `scrub: true`, GSAP only ticks tweens inside their own time window (Phase 1a: progress 0.005–0.015). Once the scrub was past that window, GSAP stopped writing opacity. The inline `1` from `startBlink` then persisted permanently until the user scrolled back into the Phase 1a window.
  - **Fix:** Removed the `scrollPrompt.style.opacity = '1'` line from `startBlink`. The hero timeline scrub now owns scrollPrompt opacity exclusively; typewriter owns text + cursor only. Commit `65885af`.
  - **Resolved:** yes.

- **Bug: Yesid's first feedback was that scrollPrompt stayed visible for too long on scroll.** The original hero timeline faded scrollPrompt in Phase 2 at progress 0.17 — roughly 136vh of scroll (16–17% of the 800% pin) before the billboard disappeared. Plus Phase 1b (0.03–0.15) actively pulsed scrollPrompt opacity, so any scroll into that window made the billboard flicker back visible.
  - **Fix:** Added new Phase 1a (progress 0.005–0.015) that fades scrollPrompt 1 → 0 over ~8vh of scroll. Phase 1b pulses now target berri only (scrollPrompt removed from all six pulse tweens). Commit `b988b7f`.
  - **Resolved:** yes. Typewriter `setInterval` keeps running in the background per Yesid's request ("keep playing the animation just fade it").

- **HeroMetrics test count assumption broken by mobile/desktop dual rendering.** After merging metrics into a single mobile card + keeping the desktop 3-card grid, `getAllByTestId('metric-card')` returned 4 (3 desktop + 1 mobile wrapper) and `getByText('VEHICLES TRACKED')` threw "multiple matches" because the label renders in both variants.
  - **Fix:** Mobile wrapper gets `data-testid="metric-card-mobile"` (distinct). Desktop card count stays exactly 3. All text-based assertions use `getAllByText(...).length > 0`.
  - **Resolved:** yes.

## 9. Iterations

Yesid drove six rounds of mobile-polish refinement after the core 7-task plan landed. Each became its own fix commit. Desktop was never touched.

| # | What Yesid Reported | What Was Fixed | Files | Commit |
|---|---------------------|----------------|-------|--------|
| 1 | "If I interrupt typewriter it still remains visible at all time on the hero. Typewriter should keep playing, just fade." | Removed `scrollPrompt.style.opacity='1'` from `startBlink`; scrub owns opacity exclusively | heroTypewriter.ts | `65885af` |
| 2 | Typewriter billboard didn't fade until 136vh of scroll | Phase 1a snap-fade at progress 0.005; removed scrollPrompt from Phase 1b pulse | createHeroTimeline.ts | `b988b7f` |
| 3 | Mobile "PIPELINES" cut off on right edge; "Let's talk" button clipped at bottom; metric text too big | Width-capped `.text-hero` on mobile (11vw), `padding-inline: 1rem`, shifted `MetricDisplay` sizes one step down | HeroTextContent.svelte, MetricDisplay.svelte | `c9dbc09` |
| 4 | "Remove side paddings, keep top/bottom. Metrics text smaller on mobile only, desktop is perfect. Shorten gap to SQL section" | Removed `padding-inline`; added `.metric-value.text-title` mobile override in app.css; `HeroMobileSql` `py-10 → pb-10 pt-4` | HeroTextContent.svelte, MetricDisplay.svelte, HeroMobileSql.svelte, app.css | `3a8e392` |
| 5 | "Don't make top/bottom paddings too big either. I still want PIPELINES quite big but not overflowing" | `.hero-viewport-text` `padding-block: 1.5rem → 0.75rem`; width cap `11vw → 12vw` | HeroTextContent.svelte | `f637543` |
| 6 | "Bigger on mobile. Do NOT hardcode values" | New `--text-hero-mobile` token (clamp with vw + svh), referenced via Tailwind utility `text-hero-mobile md:text-hero`. Scoped clamp deleted. `HeroMetrics` + `AboutMetrics` stack on mobile | app.css, HeroTextContent.svelte, HeroMetrics.svelte, AboutMetrics.svelte | `5d7cd37` |
| 7 | "Two columns with third centered" | 4-col grid with cards spanning 2 cols; 3rd at `col-start-2` for centered position | HeroMetrics.svelte | `91cade0` |
| 8 | "Actually stack them. Go loose on spacing or merge into one card — everything must fit the usable area. Desktop is perfect" | **Final layout:** single Card on mobile with 3 metrics horizontally divided (size='sm'); desktop unchanged 3-card grid. Saves ~150px of vertical space | HeroMetrics.svelte, HeroMetrics.test.ts | `47508d8` |

## 10. Assumptions Made

- **The factory's phase boundaries (timeline positions 0.03, 0.05, 0.08, 0.17, 0.47, 0.58, 0.65, 1.0, 1.05, 1.10–1.38, 1.55) port verbatim from `utils/heroTimeline.ts`.** They were tuned over many prior iterations; changing them mid-migration would introduce visual drift that would be impossible to distinguish from real bugs. Phase 1a (the new 0.005–0.015 fade on scrollPrompt) was added on top without disturbing the existing constants.
- **`registerGsapPlugins()` stays in HeroBanner.** The plan's Task 4 template implied removal, but it's still called for its `ScrollTrigger.config({ ignoreMobileResize: true })` side-effect and for the other non-migrated plugins (`MotionPathPlugin` consumed by `StackConnections`, `SplitText` consumed by `wordmarkHover`, `MorphSVGPlugin` consumed by SVG morphs, `Flip` consumed by FLIP layouts). Realizing the lazy-plugin bundle savings requires a consumer-wide migration; that's 17e-5 + 17e-6 scope. Flagged at Task 4 STOP; Yesid approved.
- **Mobile pin length of 300% is committed at mount.** The original used `gsap.matchMedia` to rebuild both breakpoints and preserve scroll progress on resize; the new approach does a single `window.matchMedia('(max-width: 1023px)')` at mount. Users who resize across the 1024px boundary won't get a re-pinned timeline until the next navigation. Plan decision A1; Yesid approved.
- **Typewriter type-sequence `setInterval` remains.** Per Yesid's iteration feedback: "keep playing the animation even when scrolled, just fade it visually." The type-sequence loop keeps running on a hidden billboard. Functional consolidation onto the shared ticker is 17e-5.
- **SVGO's `--pretty --indent=2` output** is kept for repo diff-ability even though gzip handles whitespace efficiently. Trade-off: raw file size is ~15 KB instead of ~12 KB, but reviewers can see what SVGO did.

## 11. Known Gaps / Deferred Work

- **Consumer-wide lazy-plugin migration.** `loadDrawSVG` + `loadCustomEase` are invoked in HeroBanner, but `registerGsapPlugins()` still runs on the same route for non-migrated plugins. Home `/` bundle grew +2.18 KB instead of shrinking 3–8 KB. Lazy-only path arrives in 17e-5/17e-6.
- **Stale `normalizeScroll` comments** still present in `+layout.svelte:24` and `HeroBanner.svelte:16` (17e-1 follow-up that was deferred to 17e-4 but didn't get touched because the hero rewrite landed different code). Cheap cleanup — next session can drop them.
- **Typewriter type-sequence `setInterval` → shared ticker** (17e-5).
- **`morphHelpers.ts` → `actions/morphHover.ts` rename** (17e-5).
- **LED pulse consolidation across the 4 `@keyframes pulse` copies** (17e-5).
- **`ManifestoCanvas` + `ReadingProgressBar` RAF → shared ticker** (17e-5).
- **`CloserGraffiti` rebuild as `createCloserTimeline`** — optional polish (17e-5 or later).
- **`SplitText` lazy migration** — blocked on the `wordmarkHover` sync-action refactor (17e-5 or later).
- **Full Lighthouse audit on every route** + MOTION.md v2.0 + CONSTITUTION.md Snappy Doctrine amendment + `docs/learn/motion/*.md` (17e-6 closing).

## 12. What Yesid Should Know

**Why the home bundle grew instead of shrank.** The plan predicted a 3–8 KB shrink from `DrawSVG` + `CustomEase` becoming route-lazy. Reality: home gained 2.18 KB gzipped. Root cause — `registerGsapPlugins()` still runs on the home route for the `ScrollTrigger.config({ ignoreMobileResize: true })` side-effect and for non-migrated plugin consumers (StackConnections uses MotionPath, wordmarkHover uses SplitText, etc.). As long as any consumer on the route pulls the eager registration path, DrawSVG + CustomEase ride along for free — the lazy loader becomes an idempotent no-op, and the eager import keeps them in the bundle. Fixing this means migrating every consumer to lazy + removing the eager imports, which is a cross-cutting change properly scoped to 17e-5/17e-6.

The net size additions that account for the +2.18 KB: the new factory carries more self-contained logic than the old util (its own reduced-motion branch, its own `CustomEase.create`, pin-length branching). `HeroMetrics` renders two variants (mobile single card + desktop grid). `HeroTextContent` has responsive class variants. Plus the inlined SVG inside `{@html}` in the SSR HTML isn't counted in the JS bundle — that's the real LCP win (no blocking `fetch`) and it lives in the HTML path, which Lighthouse will measure in 17e-6.

**Why the Phase 1a fix is *before* the Phase 2 stroke-draw.** Original timeline had scrollPrompt fade at progress 0.17 (where Phase 2 starts). That's 136vh of scroll on a 800% pin — users started scrolling and the billboard still lingered, creating an awkward "is this broken?" moment. Moving scrollPrompt fade into a new Phase 1a at progress 0.005 (fading over ~8vh) makes it feel instant on any scroll. Phase 1b berri pulse keeps playing if the user is stationary; if they scroll, Phase 1a wins. Typewriter `setInterval` keeps running invisibly — Yesid has a downstream idea that depends on that.

**Why the typewriter doesn't own opacity anymore.** The old scroll-lock model called `scrollPrompt.style.opacity = '1'` inside `startBlink` to re-assert visibility after unlock. That pattern became a bug the moment scroll-lock was deleted — the typewriter finishing its sequence would write `opacity: '1'` inline, and GSAP's scrub (which only ticks tweens inside their own time window) wouldn't overwrite it. The fix (commit `65885af`) was minimal: delete the one line. The rule going forward: **scrub owns scrollPrompt opacity exclusively; typewriter owns text + cursor only.** Documented in the factory code header.

**Why mobile ended up as a single merged metric card.** Tried three layouts before Yesid settled: (a) three stacked cards — didn't fit the viewport on iPhone SE; (b) two columns with third centered — looked weird; (c) single card with 3 horizontally divided metrics — fits cleanly, ~150px shorter, visually reads as a dashboard strip. Desktop kept the 3-card grid untouched per Yesid's explicit "desktop is perfecto." Mobile variant uses `MetricDisplay size="sm"` (text-subheading value = 18px); the mobile-only `.metric-value.text-title` override in app.css handles the desktop `lg` size-down on smaller screens. Two variants in the same component, visibility toggled by `md:hidden` / `hidden md:grid`. Each metric renders twice in the DOM — accepted trade-off for simpler architecture.

**SVG inlining side-effect to know for future.** `MetroNetwork.svelte` now runs its classification code on every mount against the `{@html}`-rendered SVG subtree. The mount-time logic that finds `.metro-berri` by bbox size depends on `getBBox()` returning real geometry — in jsdom tests `getBBox` returns zeros, so `biggestStation` stays null and `.metro-berri` is never added. The existing test only checks that the container renders (it doesn't assert on classification), so it still passes. If a future test needs to verify classification, it needs JSDOM's `getBBox` mocked.

## 13. Next Recommended Slice

**17e-5 — Ambient Loop Consolidation + Lazy Plugin Migration.**

Three streams of work:

1. **Consolidate all ambient loops onto the shared ticker** (introduced in 17e-1 `motion/utils/ticker.ts`):
   - `heroTypewriter` type-sequence `setInterval`
   - `ManifestoCanvas` RAF
   - `ReadingProgressBar` RAF
   - LED pulse `@keyframes` across the 4 duplicate copies (consolidate into one + shared class)
2. **Cursor blink migration for the remaining two implementations** called out in design spec §4.6 (the typewriter blink was the first; there are two more cursor-blink spots scattered in components).
3. **Migrate remaining GSAP plugin consumers to the lazy path + delete the eager imports.**
   - `StackConnections` → `loadMotionPathPlugin` (once it's added to `gsap.ts`).
   - `wordmarkHover` → `loadSplitText` refactor (requires sync-action shape rework — the 17e-3 Task 7 deferral).
   - Any remaining `MorphSVGPlugin` + `Flip` consumers (blog/projects filter sort).
   - Once every consumer is on lazy + `registerGsapPlugins()` has no remaining callers, delete the eager imports from `gsap.ts` and measure the actual bundle shrink.

Optional polish: `CloserGraffiti` rebuild as `createCloserTimeline` factory (doctrine exception, not critical), `morphHelpers.ts` → `actions/morphHover.ts` rename.

17e-5's expected bundle-size win is the 3–8 KB home-route shrink the 17e-4 plan originally predicted. 17e-6 closes out with the formal Lighthouse audits per route, MOTION.md v2.0, CONSTITUTION.md Snappy Doctrine amendment, and the learning-docs batch.

## 14. Final Status

**COMPLETE** — PR #17 squash-merged to main (commit `b6e3a57`). All tests pass (774/774). `bun run check`: 0 errors.

Full-slice closing artifacts (MOTION.md v2.0, CONSTITUTION.md Snappy Doctrine, learning docs) correctly deferred to 17e-6 per the design spec.
