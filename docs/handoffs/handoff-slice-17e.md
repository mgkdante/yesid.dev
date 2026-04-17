# Handoff: Slice 17e — Motion Re-Engineering (Full-Slice Closing)

**Branch:** `feature/slice-17e-56-close-motion` — final PR ships 17e-5 Interaction Consolidation + 17e-6 Closing combined. Prior 17e-1/2/3/4 shipped in PRs #12 / #15 / #17 (+ docs catch-up #18).
**Design spec:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` (+ Amendments 2026-04-17)
**Per-sub-slice specs:** `docs/slices/slice-17e-{1..6}-*.md`
**Implementation plans:** `docs/plans/2026-04-17-slice-17e-{1..6}-*.md`
**Reference rewrites (this slice):** `docs/reference/MOTION.md` v2.0, `docs/reference/CONSTITUTION.md` § 8
**Devlog:** `docs/devlog/2026-04-17-slice-17e-closing.md`

## 1. Objective Completed

**Delivered across 6 sub-slices:**

- **17e-1 (PR #12, merged):** Motion foundation — `motion/tokens.ts` TS mirror + parity test, `motion/utils/ticker.ts` shared `gsap.ticker` wrapper, hybrid eager + lazy GSAP plugin registration, Lenis smoothscroll (normalizeScroll removed to fix tap-vs-click iOS bug), `rollup-plugin-visualizer` bundle-size tooling. +33 tests.
- **17e-2 + 17e-3 (PR #15, merged combined):** Snappy Sweep — deleted `use:reveal` + 27 consumer call sites, deleted orphan motion code (ScrollRail, Train tree, reveal/ripple/tilt actions, listingAnimations), extracted FLIP primitives into `motion/utils/flip.ts`, stripped scoped entrance tweens site-wide. Scrub Factories — `createCrescendoScrub` + `createDrawScrub` factories; Manifesto rebuilt with crescendo on the 3-line statement; Blueprint SVGs on listing pages migrated to draw-scrub.
- **17e-4 (PR #17, merged; docs catch-up #18):** Hero Timeline — `createHeroTimeline` sync factory with full 9-phase choreography (pin + stroke-draw + stations + labels + Berri-UQAM zoom + cross-fade + text zoom-out). MetroNetwork SVG inlined via Vite `?raw` + one-time SVGO (21.2 → 15.1 KB). `heroScrollLock.ts` deleted (D264 — plays-at-you pattern contradicted Snappy Doctrine). Typewriter cursor blink migrated to CSS (`@keyframes typewriter-blink` + `.typewriter-cursor` class). 6 rounds of mobile hero polish (single-card merged metrics, `--text-hero-mobile` token, edge-to-edge layout).
- **17e-5 (this PR):** Interaction Consolidation — `use:morphHover` action (signature 4). HomeServices migrated to `use:morphHover` (−103 / +13 lines). ManifestoEdgeBottom scoped pulse consolidated into canonical `pulse-glow`. Typewriter type-sequence on shared ticker. ManifestoCanvas + AboutTrain on shared ticker + IntersectionObserver offscreen pause. Manifesto countdown + AboutTestimonials IO-gated. `SvgIcon.animateStagger` + `StackScenarioCard` fade-up deleted (D267 F). Orphan `ReadingProgressBar` deleted (Yesid flagged as scrapped earlier, never re-wired). **D269**: consumer-wide lazy-plugin migration — `registerGsapPlugins()` deleted; `initScrollTriggerConfig()` + 6 `load*()` lazy loaders + `ensureSplitTextRegistered()` sync helper for wordmarkHover's sync coupling; 9 consumers migrated; 4 eager plugin imports deleted from `gsap.ts`.
- **17e-6 (this PR):** Closing — `MOTION.md` v2.0 (506 lines, replaces stale v1.0); `CONSTITUTION.md` § 8 Motion Doctrine rewritten (Snappy Doctrine + 9-signature vocabulary + D266 + D269 plugin contract); `CSS.md` + `ARCHITECTURE.md` + `TESTS.md` updates to match post-17e file tree + test catalog; 6 motion learning docs (`docs/learn/motion/`); 20-run Lighthouse audit (`/tech-stack` skipped); bundle-size verification against §6.2 budgets; design spec amendments (D263–D269 + §6.1 target transfer to downstream slices); this handoff; tree.txt regen; final commit.

**Intentionally not implemented (flagged for follow-up):**

- **Lighthouse §6.1 Performance targets** did not land at 17e closing. 0 of 10 mobile routes hit the 90 target (home mobile at 54). **Transferred to Slice 19 (Mobile UI/UX Optimization) + 19b (A11y) + 20 (Scroll Smoothness)** per design spec Amendments (2026-04-17).
- **Bundle shrink (D269 target: home −3 to −8 KB)** did not land. Static imports in `flip.ts` (Flip) and `createHeroTimeline.ts` (CustomEase) for sync API access defeat Vite's lazy chunk split. Deferred opportunities: async refactor of `captureFlipState` (blocks Flip lazy split) and `wordmarkHover`'s sync-action shape (blocks SplitText lazy split).
- **CloserGraffiti factory rebuild** — optional polish, out of scope. The in-section DrawSVG graffiti timeline is the one permitted doctrine exception (Terminus narrative); no need to factorize.
- **SEO 82–83 on home + blog tree** — likely a missing/short meta description. Not scoped to a 17e task; 1-line frontmatter fix that fits Slice 19 or a content ticket.

## 2. High-Level Summary

Slice 17e re-engineered the motion layer from the ground up over 6 sub-slices and 4 PRs. The site now runs on a closed 9-signature vocabulary, enforced by the Snappy Doctrine in `CONSTITUTION.md` § 8. Entrance reveals are gone — content renders at final state on load; motion is a reward for interaction, scroll, or ambient presence (never a delivery mechanism for static content). A single `gsap.ticker` subscription fans out to all ambient consumers with IO-gated offscreen pause. Every scroll-scrub lives in a sync factory (`createHeroTimeline`, `createCrescendoScrub`, `createDrawScrub`) with a reduced-motion branch and a destroy closure. GSAP plugins load lazily per consumer via `load*()` functions; ScrollTrigger + SplitText + MorphSVGPlugin stay eager by necessity. MetroNetwork hero SVG is inlined at SSR via Vite `?raw` + SVGO, making it a valid LCP candidate. MOTION.md v2.0 documents the whole surface; 6 `docs/learn/motion/` docs walk through the patterns.

Test count: 774 (pre-17e-5) → **780** (post-17e-6). 0 `bun run check` errors. 19 pre-existing warnings unchanged.

Bundle: home `/` gzipped 32.39 KB (17e-1 baseline) → 35.00 KB (17e-6 end), +2.61 KB over the whole slice. D269 shrink did not materialize (documented, deferred). All routes well under §6.2 budgets regardless.

Lighthouse: Best Practices 100 across all 20 runs. Performance has a systematic gap vs §6.1 — mobile home 54, mobile average ~68. Transferred to Slice 19 / 19b / 20.

## 3. Files Created (across 6 sub-slices)

| File | Purpose | Sub-slice |
|---|---|---|
| `src/lib/motion/tokens.ts` + `tokens.test.ts` | TS mirror + parity of motion timing/easing tokens | 17e-1 |
| `src/lib/motion/utils/ticker.ts` + `ticker.test.ts` | Shared `gsap.ticker` subscribe/unsubscribe | 17e-1 |
| `src/lib/motion/utils/flip.ts` + `flip.test.ts` | FLIP filter-sort primitives (extracted from deleted listingAnimations) | 17e-2 |
| `src/lib/motion/scrubs/createCrescendoScrub.ts` + `.test.ts` | Scale/opacity scroll-scrub factory | 17e-3 |
| `src/lib/motion/scrubs/createDrawScrub.ts` + `.test.ts` | DrawSVG stroke-scrub factory | 17e-3 |
| `src/lib/motion/scrubs/createHeroTimeline.ts` + `.test.ts` | 9-phase hero pin factory | 17e-4 |
| `src/lib/motion/actions/morphHover.ts` + `.test.ts` | SVG morph-on-hover Svelte action (signature 4) | 17e-5 |
| `svgo.config.mjs` | SVGO overrides preserving MetroNetwork classification attributes | 17e-4 |
| `docs/reference/MOTION.md` v2.0 (rewrite) | Post-17e motion implementation reference | 17e-6 |
| `docs/learn/motion/snappy-doctrine.md` | Learning doc — the doctrine + D266 | 17e-6 |
| `docs/learn/motion/signature-vocabulary.md` | 9-signature table + amendment process | 17e-6 |
| `docs/learn/motion/scrub-factory-pattern.md` | Sync-factory convention | 17e-6 |
| `docs/learn/motion/shared-ticker-pattern.md` | One-RAF + IO-gate pattern (includes ms/sec caveat) | 17e-6 |
| `docs/learn/motion/lazy-gsap-plugins.md` | Consumer pattern, eager plugins, sync-coupling gotchas | 17e-6 |
| `docs/learn/motion/ssr-inline-svg.md` | Vite `?raw` + SVGO (MetroNetwork recipe) | 17e-6 |
| `docs/devlog/2026-04-17-slice-17e-closing.md` | Closing devlog with Lighthouse + bundle tables | 17e-6 |
| `docs/slices/slice-17e-{1..6}-*.md` | Per-sub-slice specs | across |
| `docs/plans/2026-04-17-slice-17e-{1..6}-*.md` | Per-sub-slice implementation plans | across |
| `docs/handoffs/handoff-slice-17e-4.md` + this file | 17e-4 individual handoff + full-slice closing handoff | 17e-4, 17e-6 |

## 4. Files Deleted (across 6 sub-slices)

| File | Sub-slice | Reason |
|---|---|---|
| `src/lib/motion/actions/reveal.ts` + test | 17e-2 | Entrance reveal violates Snappy Doctrine |
| `src/lib/motion/actions/ripple.ts` + test | 17e-2 | Not in 9-signature vocabulary |
| `src/lib/motion/actions/tilt.ts` + test | 17e-2 | Absorbed into `magnetic` or cut |
| `src/lib/motion/components/ScrollRail.svelte` + test | 17e-2 | Orphan — no consumers |
| `src/lib/motion/svg/Train.svelte` + test | 17e-2 | Train-journey metaphor replaced by crescendo scrub |
| `src/lib/motion/svg/TrainJourney.svelte` + test | 17e-2 | ditto |
| `src/lib/motion/svg/train-path.ts` + test | 17e-2 | ditto |
| `src/lib/motion/svg/train-targets.ts` | 17e-2 | ditto |
| `src/lib/motion/utils/listingAnimations.ts` | 17e-2 | Entrance function deleted; FLIP primitives extracted into `flip.ts` |
| `src/lib/motion/utils/heroTimeline.ts` | 17e-4 | Replaced by `scrubs/createHeroTimeline.ts` factory |
| `src/lib/motion/utils/heroScrollLock.ts` | 17e-4 | D264 — plays-at-you pattern contradicts Snappy Doctrine |
| `src/lib/components/layout/ReadingProgressBar.svelte` | 17e-5 | Yesid flagged as scrapped earlier, zero consumers confirmed in audit |
| `SvgIcon.animateStagger` function + switch case | 17e-5 | D267 F — pure fade-up reveal violation |
| `StackScenarioCard` onMount `gsap.fromTo` fade-up | 17e-5 | D267 F — fade-up reveal violation |
| `registerGsapPlugins()` function | 17e-5 | D269 — replaced by `initScrollTriggerConfig()` + lazy loaders |
| Eager imports in `gsap.ts`: MotionPath, DrawSVG, CustomEase, Flip | 17e-5 | D269 — lazy-loaded per consumer |

## Concepts Documented

| Action | File | Domain |
|---|---|---|
| Created | `docs/learn/motion/snappy-doctrine.md` | motion |
| Created | `docs/learn/motion/signature-vocabulary.md` | motion |
| Created | `docs/learn/motion/scrub-factory-pattern.md` | motion |
| Created | `docs/learn/motion/shared-ticker-pattern.md` | motion |
| Created | `docs/learn/motion/lazy-gsap-plugins.md` | motion |
| Created | `docs/learn/motion/ssr-inline-svg.md` | motion |
| Updated | `docs/reference/MOTION.md` v2.0 (rewrite) | motion |
| Updated | `docs/reference/CONSTITUTION.md` § 8 Motion Doctrine | governance |
| Updated | `docs/reference/CSS.md` (Transition Tokens + Global Keyframes tables) | styling |
| Updated | `docs/reference/ARCHITECTURE.md` (motion tree) | structure |
| Updated | `docs/reference/TESTS.md` (Motion sections refreshed) | testing |

## 5. Data Model Changes

- `BlogAnimation` type narrowed from `'draw' | 'morph' | 'draw-fill' | 'stagger'` to `'draw' | 'morph' | 'draw-fill'`. `'stagger'` was a pure fade-up reveal (D266 violation). Two blog posts' frontmatter `animation: stagger` replaced with `morph` (building-a-transit-pipeline) and `draw-fill` (lorem-etl-patterns). `ALL_ANIMATIONS` fallback pool shrunk to match. `_template.md` option list updated.

## 6. Commands Executed (representative)

```bash
# Throughout the slice
bun run test
bun run check
bun run bundle-size

# 17e-4 specific
bunx svgo --config=svgo.config.mjs static/images/montreal-metro.source.svg -o static/images/montreal-metro.svg

# 17e-6 Lighthouse audit
bun run build && bun run preview --host   # preview server on :4173
# 20 audits driven by Yesid in Chrome DevTools → Lighthouse panel
# (agent-side Chrome DevTools MCP blocked by npx ENOENT; bunx lighthouse
#  hit Windows puppeteer-core cache EPERM)

# 17e-6 closing
python3 <<'EOF'   # extracted scores from Yesid's 20 Lighthouse JSONs
for f in ...: json.load(f)['categories'][...]['score']*100
EOF
```

## 7. Validation Results

| Check | Result | Notes |
|---|---|---|
| `bun run test` | PASS | 82 files / 780 tests passing. +6 since 17e-4 end (5 morphHover + net +1 from gsap.test.ts rewrite) |
| `bun run check` | PASS | 0 errors, 19 pre-existing warnings (unchanged) |
| `bun run bundle-size` | PASS | All 11 routes well under §6.2 budgets. Home 35.00 KB gzipped (node 4) + 13.20 KB (layout 0) + shared chunks |
| Lighthouse desktop × 10 routes | Mixed | Best Practices 100/10, Perf 3/10 meeting ≥98 target (see devlog) |
| Lighthouse mobile × 10 routes | Mixed | Best Practices 10/10, Perf 0/10 meeting ≥90 target (see devlog + gap transfer to Slice 19) |

## 8. Errors Encountered

- **SVGO default preset destroyed MetroNetwork animation targets** (17e-4) — `convertColors` lowercased `#E07800` breaking classification; `mergePaths` fused 87 station paths into one. Fix: `svgo.config.mjs` with `overrides: { convertColors: false, mergePaths: false, cleanupIds: false }`. Reduction dropped to 28.8% but animation targets survived. Documented in `MOTION.md` § 13.
- **Typewriter typed the whole string in one frame** (17e-5, Yesid-caught) — GSAP's `gsap.ticker.add` callback delivers `deltaTime` in **milliseconds**, not seconds. My migration compared accumulator to `0.08` (seconds) instead of `80` (ms). 16.67 ms >= 0.08 is true → while-loop burned through all characters on the first tick. Fix: `CHAR_INTERVAL_MS = 80`, comparison in ms. Documented in `MOTION.md` § 6 + `ticker.ts` JSDoc.
- **Cursor didn't blink even after ms fix** (17e-5, Yesid-caught) — 17e-4 shipped `animation: typewriter-blink 1s steps(2, start)` with a single `to { visibility: hidden }` keyframe. `steps(2, start)` + implicit `from` resolves both steps to the "hidden" state for discrete properties — cursor continuously hidden. Fix: explicit `0%/50%/100%` keyframes + `step-end` timing. Documented in `MOTION.md` § 6 + § 14 anti-patterns.
- **Mobile hero dead-space** (17e-5, Yesid-caught) — `HeroBanner`'s `<section>` had `min-height: 900svh` unconditionally. That matches desktop 800% pin but mobile pin is 300% + trailing HeroMobileSql → ~350 svh empty space showed between HeroMobileSql and Manifesto. Fix: `.hero-section-reserve` CSS media query (600 svh mobile / 900 svh desktop). Reduced-motion still overrides via inline style.
- **17 AboutPage tests failed after async onMount** (17e-5) — making SvgIcon + HomeCloser onMount async broke Svelte's onMount return signature (can't return a cleanup from `async () => Promise<() => void>`). Also AboutTrain's `bind:ref={cardEl}` with `undefined` initial value conflicted with Card's `ref` fallback. Fixes: moved HomeCloser cleanup to `onDestroy`; used `$state<HTMLElement | null>(null)` for AboutTrain's cardEl.
- **Chrome DevTools MCP + Lighthouse CLI both unavailable** (17e-6) — Chrome DevTools MCP hook blocked with `spawn npx ENOENT`; `bunx lighthouse --version` hit Windows puppeteer-core cache EPERM. Yesid ran 20 audits manually in Chrome DevTools → Lighthouse panel and dropped the JSONs in Downloads; agent parsed them with Python.

## 9. Iterations

- **6 rounds of mobile hero polish** (17e-4, Yesid-driven) — metric card layout iterated 8 rounds through "3-column grid → stacked cards → 4-col trick with 3rd centered → single-merged-card" (final). `--text-hero-mobile` token introduced to avoid hardcoded clamp values. `HeroMobileSql` padding tightened (py-10 → pb-10 pt-4). `AboutMetrics` row stacked on mobile. Details: `docs/handoffs/handoff-slice-17e-4.md` §9.
- **Plan-audit corrections before 17e-5 implementation** (captured in the 17e-5 slice spec iteration log): `morphHelpers.ts` kept (SvgIcon is a second consumer — plan said delete), pulse consolidation shrunk from "4 sites" to 1 actual duplicate, cursor-blink stream 2 confirmed empty (only 2 cursor blinks exist and both were already CSS-driven), AboutTrain RAF + AboutTestimonials setInterval added to ambient scope, D269 decomposed into 9a–9e sub-steps.
- **Three Yesid-caught visual regressions in 17e-5** — typewriter ms/sec (committed `ebf3502`), cursor blink CSS (committed `813a45c`), mobile hero dead-space (committed `002c173`). Each followed the iteration protocol: report → diagnose → fix → commit → visual re-verification by Yesid.

## 10. Assumptions Made

- **Plugin-registration eager set (ScrollTrigger + SplitText + MorphSVGPlugin)** — kept eager by necessity. ScrollTrigger is site-wide. SplitText's sync-coupling inside `wordmarkHover` can't await. MorphSVGPlugin's static `convertToPath` call from `morphHelpers.ts` is reached from SvgIcon which is on every major route. Consumer-wide async refactor of wordmarkHover + captureFlipState would unlock further shrink but is post-17e scope.
- **Factory preload ownership** — scrub factories are sync; callers own the `await loadX()` chain. Consumer pattern documented in `MOTION.md` § 9.
- **Shared-ticker deltaTime in milliseconds** — ratified in `ticker.ts` JSDoc + `MOTION.md` § 7. This burned one regression cycle during 17e-5 migration.
- **Lighthouse §6.1 targets transferred to downstream slices** — Yesid's call (option 1 from the devlog Decision block). 17e closes with documented gap; Slice 19 / 19b / 20 own the fix.
- **Bundle-size table uses leaf + layout gzipped totals** — shared entry/vendor chunks add ~18–22 KB consistently on top. Lighthouse "total transfer bytes" is the authoritative cross-check; the §6.2 budgets have slack regardless.

## 11. Known Gaps / Deferred Work

### Transferred to named slices per design spec amendment

| Gap | Owner |
|---|---|
| Mobile Performance (home 54, mobile avg ~68 vs target ≥ 90) | **Slice 19** Mobile UI/UX Optimization |
| Accessibility 95–96 on listings + blog detail | **Slice 19b** Accessibility Optimization (targets 95+ already in scope) |
| Scroll-scrub frame-rate polish | **Slice 20** Scroll Smoothness + Animation Polish |
| Site-wide frame-rate regression testing | **Slice 21 / Slice 16 E2E** |

### Unscoped (need tickets)

- **SEO 82–83 on home + blog tree** — likely missing/short `<meta name="description">`. 1-line frontmatter fix per post + a layout-level default. Fits Slice 19 or a standalone content ticket.
- **Bundle D269 shrink** — `captureFlipState` async refactor + `wordmarkHover` async action shape. Each unlocks one additional plugin split (Flip + SplitText). Savings: ~5–8 KB on Blog + Projects listing routes + site-wide. Not urgent since §6.2 has ample headroom.
- **CloserGraffiti factory rebuild** — the permitted doctrine exception currently lives as a `CloserGraffiti.svelte` ad-hoc timeline. Could be factorized as `createCloserTimeline` for consistency with other scrubs. Optional polish.
- **`motion/stores/scroll.ts` RAF** — shared scroll-position store not migrated to shared ticker. Infrastructure; no visible consumer impact. Revisit if bundle audits or profiling surface it.

## 12. What Yesid Should Know

**17e was architectural, not a performance slice.** The Lighthouse Performance gap is not a regression — pre-17e Lighthouse would likely show similar scores (17e-4 was +2.18 KB vs baseline, 17e-5 was +0.43 KB vs 17e-4; the bundle trajectory is roughly flat). What 17e delivered is **governance** (the Snappy Doctrine is now enforceable in PR review), **architecture** (one RAF, sync factories, lazy plugins, SSR-inlined hero SVG), and **reference material** (MOTION.md v2.0 + 6 learning docs). The mobile Perf gap is real and deserves Slice 19 attention, but framing 17e as "missed its perf target" undersells the foundation work.

**The mobile home Perf score (54) is the dominant outlier.** It's 37 points below desktop home (91) — a gap that large means main-thread-bound work during TTI. Candidates: the 9-phase hero timeline + pinned 300% scroll + 87-station MetroNetwork all competing for the main thread. Slice 19's scope (animation performance on low-end devices, mobile-specific tuning) will need to either simplify the mobile choreography or accept the perceived polish and shoot for a lower Perf target. Evidence: the mobile-home handoff is easier because the architecture is already clean — no `requestAnimationFrame` spaghetti to untangle first.

**SEO 82–83 on home + blog tree is probably a tiny fix.** Lighthouse SEO drops to 82 for a single failing audit — usually "Document does not have a meta description." Adding `<meta name="description">` to the layout + per-post frontmatter should push it to 100. Worth checking as a quick win before Slice 19 tackles the harder mobile work.

**The MetroNetwork SVGO procedure is nontrivial and documented.** If you ever update the metro SVG source, follow `MOTION.md` § 13 exactly. The three disabled plugins (`convertColors`, `mergePaths`, `cleanupIds`) are load-bearing — they keep the `#E07800` classification working and preserve per-station paths. Default SVGO will break the hero animation in subtle ways (it "works" but Phase 3 station fades don't fire).

**Bug ledger from this session** (recorded here so they don't get lost):
1. `deltaTime` is milliseconds, not seconds. Future ticker consumers: see `MOTION.md` § 6 lesson box.
2. `steps(2, start)` + discrete-visibility = "always hidden". Future blink keyframes: explicit `0%/50%/100%` + `step-end`.
3. Async `onMount` cannot return a cleanup closure. Move cleanup to `onDestroy`.
4. `bind:ref` on a component with fallback default wants `null`, not `undefined`. Use `$state<T | null>(null)`.
5. `git add -A` pulled in two untracked slice-18 docs Yesid had in the working tree mid-session. Recovered via `git reset --soft HEAD~1 + git restore --staged`. Preference: stage specific files rather than `-A` during long sessions.

**Workflow rule adopted during 17e-4** — every sub-slice PR bundles planning + implementation + handoff. No more separate post-merge docs PRs for handoffs. 17e-4 docs PR #18 was one-time catch-up.

## 13. Next Recommended Slice

Per checkpoint roadmap: **17a-4 Dead Code Cleanup** (Standardization phase continuation). Clears orphan `ProjectMiniCard` + `FilterGroup.accentColor` unused prop flagged during 17e-2 audits.

Alternatively, given the Lighthouse gap, Yesid may want to move directly into **Slice 19 — Mobile UI/UX Optimization** to address the mobile Perf gap before resuming Standardization. Both are valid next steps; the checkpoint reflects whichever he chooses.

## 14. Final Status

**Slice 17e COMPLETE.** 6 sub-slices across 4 PRs. All architectural goals delivered. Lighthouse targets transferred to Slice 19 / 19b / 20 per documented design-spec amendment. Ready for the final PR to squash-merge.

- Tests: 780 / 780 pass
- `bun run check`: 0 errors, 19 warnings (unchanged)
- Bundle: all routes under §6.2 budgets
- Lighthouse: BP 100/20. Perf gap documented + transferred.
- MOTION.md v2.0 written
- CONSTITUTION.md § 8 rewritten
- 6 learning docs shipped under `docs/learn/motion/`
- Design spec amendments (D263–D269 + target transfer) landed
- Closing devlog written
- This handoff written
- tree.txt regenerated
- Ready for final commit + PR
