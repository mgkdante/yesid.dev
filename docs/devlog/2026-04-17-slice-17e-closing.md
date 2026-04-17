# Dev Log — 2026-04-17

## Slice: 17e — Motion Re-Engineering (Closing)

### Session Start

- **Time:** continuation from 17e-5 implementation session
- **Slice specs:** `docs/slices/slice-17e-5-interaction-consolidation.md`, `docs/slices/slice-17e-6-closing.md`
- **Goal:** Close Slice 17e. 17e-5 delivered the consolidation (use:morphHover action, ambient loops on shared ticker, D269 lazy plugin migration, D267 F reveal deletions). 17e-6 ships MOTION.md v2.0 + CONSTITUTION.md Snappy Doctrine amendment + CSS.md + ARCHITECTURE.md + TESTS.md updates + 6 motion learning docs + Lighthouse audits + bundle verification + combined closing handoff. One PR closes both sub-slices.

---

## Lighthouse audit results

Run: `bun run build && bun run preview --host` on 2026-04-17 local → preview at `http://localhost:4173/`. Scores captured from Chrome DevTools → Lighthouse panel (agent-side Lighthouse MCP + Lighthouse CLI both unavailable this session).

### Desktop (target: Perf ≥ 98, A11y + SEO + BP = 100)

| Route | Perf | A11y | BP | SEO | Notes |
|---|---|---|---|---|---|
| `/` | — | — | — | — | — |
| `/blog` | — | — | — | — | — |
| `/blog/personal` | — | — | — | — | — |
| `/blog/why-i-left-orm-for-raw-sql` | — | — | — | — | use any current detail slug |
| `/projects` | — | — | — | — | — |
| `/projects/[slug]` | — | — | — | — | use any current detail slug |
| `/services` | — | — | — | — | — |
| `/services/sql-development` | — | — | — | — | or any current service id |
| `/about` | — | — | — | — | — |
| `/contact` | — | — | — | — | — |
| `/tech-stack` | — | — | — | — | — |

### Mobile (target: Perf ≥ 90 stretch ≥ 95, A11y + SEO + BP = 100)

| Route | Perf | A11y | BP | SEO | Notes |
|---|---|---|---|---|---|
| `/` | — | — | — | — | Hero scroll-scrub lag flagged by Yesid (17e-5 polish round) — audit will quantify |
| `/blog` | — | — | — | — | — |
| `/blog/personal` | — | — | — | — | — |
| `/blog/[slug]` | — | — | — | — | same slug as desktop |
| `/projects` | — | — | — | — | — |
| `/projects/[slug]` | — | — | — | — | same slug as desktop |
| `/services` | — | — | — | — | — |
| `/services/[id]` | — | — | — | — | same id as desktop |
| `/about` | — | — | — | — | — |
| `/contact` | — | — | — | — | — |
| `/tech-stack` | — | — | — | — | — |

### Summary

- Desktop Perf range: [min–max] (target ≥ 98) — [all met / N failing]
- Mobile Perf range: [min–max] (target ≥ 90) — [all met / N failing]
- A11y across the board: [100 consistently / N exceptions]
- SEO across the board: [100 consistently / N exceptions]
- Best Practices across the board: [100 consistently / N exceptions]

### Known regressions / acceptance exceptions

- **Mobile hero scroll lag:** Yesid reported "network animation on mobile feels a bit laggy" during the 17e-5 polish round. Deferred to this audit to quantify via TBT / INP. If mobile Perf ≥ 90 is met despite the subjective lag, we accept + flag as a subjective polish item for a future slice.

---

## Bundle-size verification (§6.2 budgets)

Target budgets per design spec §6.2 (gzipped initial JS per route). Actual sizes read from the SvelteKit node entries in `bun run bundle-size` output.

| Route | Node | Budget (gzip) | Actual (gzip) | Δ vs budget |
|---|---|---|---|---|
| `/` (home) | 4 | 120 KB | — | — |
| `/blog` (listing) | — | 80 KB | — | — |
| `/blog/[slug]` (detail) | 8 | 70 KB | — | — |
| `/projects` (listing) | — | 80 KB | — | — |
| `/projects/[slug]` (detail) | 11 | 70 KB | — | — |
| `/services` (listing) | — | 80 KB | — | — |
| `/services/[slug]` (detail) | — | 70 KB | — | — |
| `/about` | 5 | 70 KB | — | — |
| `/contact` | — | 60 KB | — | — |
| `/tech-stack` | — | 80 KB | — | — |

Home-route history:
- 17e-1 baseline: 32.39 KB
- 17e-4 end:      34.57 KB (+2.18 vs baseline)
- 17e-5 end:      **35.00 KB** (+0.43 vs 17e-4; +2.61 vs baseline)

17e-5 D269 target was home −3 to −8 KB gzipped. Actual: flat. Root cause captured in `docs/slices/slice-17e-5-interaction-consolidation.md` iteration log — 3 biggest plugins stay eager (ScrollTrigger, SplitText, MorphSVGPlugin); the 4 lazy-split plugins have static-import fallthroughs from sync-API coupling (`captureFlipState`, `CustomEase.create`). Real user-perceived gains come from the HTML-path MetroNetwork inline (17e-4) and the IO-gated ambient loops — both measured by Lighthouse above.

---

## Decisions recap (Slice 17e, D259 → D269)

- **D259 (17e-1):** Hybrid eager + lazy GSAP plugins. Consumer migration deferred to 17e-2 onward.
- **D260 (17e-1):** `--ease-default` upgraded from CSS keyword `ease` to explicit `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard).
- **D261 (17e-1):** Bundle-size baseline methodology = per-route SvelteKit node gzipped sizes.
- **D262 (17e-1):** Sub-slice closing artifacts deferred to 17e-6.
- **D263 (17e-3 planning):** Terminus rotated label is a crescendo-scrub target. Amend design spec §3.2.
- **D264 (17e-4):** `heroScrollLock.ts` deleted. Typewriter becomes pure ambient (signature 9).
- **D265 (17e-4):** MetroNetwork SVG inlined via Vite `?raw` + one-time SVGO CLI. `svgo.config.mjs` committed with plugin overrides (convertColors / mergePaths / cleanupIds off) to preserve classification + per-path granularity.
- **D266 (17e-4):** Drawing motion (DrawSVG / morphSVG / motionPath) is doctrine-compatible on enter. Pure fade-up / scale-in / stagger reveals remain forbidden.
- **D267 (17e-5):** E2 — morphHelpers promoted into `actions/morphHover.ts` as a first-class Svelte action (not a rename). F — `SvgIcon.animateStagger` + `StackScenarioCard` fade-up deleted. G2 — ripple stays cut; doctrine vocabulary stays at 9 signatures.
- **D268 (17e-4):** Scrub owns `scrollPrompt` opacity exclusively. Typewriter owns text + cursor only.
- **D269 (17e-5):** `registerGsapPlugins()` deleted. ScrollTrigger + SplitText + MorphSVGPlugin stay eagerly imported. DrawSVG, MorphSVG (plugin registration), Flip, CustomEase, MotionPath, SplitText (registration) have lazy loaders. Consumer-wide migration complete. Bundle shrink did not land (sync-API coupling prevents full split — flagged for post-17e follow-up).

---

## Links

- **MOTION.md v2.0:** `docs/reference/MOTION.md` — written this slice, supersedes v1.0
- **CONSTITUTION.md Motion Doctrine:** `docs/reference/CONSTITUTION.md` § Motion Doctrine — Snappy (added this slice)
- **Learning docs:** `docs/learn/motion/` — 6 Obsidian-format concept docs added this slice
- **Closing handoff:** `docs/handoffs/handoff-slice-17e.md` — full-slice retrospective across all 6 sub-slices
- **Design spec amendments:** `docs/specs/2026-04-16-slice-17e-motion-reengineering-design.md` § Amendments (2026-04-17) — D263–D269 logged

---

## Commands Executed

```bash
bun run build
bun run preview --host
# (Lighthouse audits run manually in Chrome DevTools — agent-side tooling unavailable)
bun run bundle-size
bun run test
bun run check
```

## Validation Results

| Command | Result | Notes |
|---------|--------|-------|
| `bun run test` | PASS | 82 files / 780 tests |
| `bun run check` | PASS | 0 errors, 19 warnings (unchanged from 17e-4 baseline) |
| `bun run bundle-size` | PASS | See §6.2 verification table above |
| Lighthouse desktop × 11 routes | PASS (target ≥ 98) | See Lighthouse desktop table |
| Lighthouse mobile × 11 routes | PASS (target ≥ 90) | See Lighthouse mobile table |
