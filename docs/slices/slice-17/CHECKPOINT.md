# Slice 17 — Checkpoint

**Last updated:** 2026-04-18 | **17j ACTIVE — Tasks 0-5 complete. Task 6 (re-measurement) awaiting FRESH session for cold-context measurement.**
**Branch:** `feature/slice-17j-token-efficacy` (off main; 17h PR #22 merged)

## Active sub-slice — 17j Workflow Efficiency

**Status:** 16 of 21 tasks complete (76%). Phase 4 in progress. Next step requires session restart.

### Resume instructions for next session

1. Open fresh Claude Code session in yesid.dev.
2. **First command:** `/context-budget` — measures post-prune cold-session token usage.
3. Paste the output; AI will compute the delta vs baseline (Task 0 measurement: ~89.5K tokens, 9% of 1M window) and commit as Task 6.
4. Then continue with Tasks 7 (workflow-efficiency skill), 8 (config snapshot + restore scripts), 9a (VOCAB co-edit), 9 (handoff finalize + PR).

**Why fresh session:** current session's context is polluted by pre-prune state + Task 5's live-machine changes. A fresh cold session shows the true post-prune cost.

### Progress

| Task | Status | Commit |
|------|--------|--------|
| 0: Baseline measurement | ✅ | 734e887 |
| 0a: Research sprint (6 parallel + 1 structure) | ✅ | 98ab5d4 + cloud doc 07 |
| — Scope expansion + VOCAB draft | ✅ | 4d0f1ad |
| — Close-script simplify + 3f planning | ✅ | 839db63 |
| 1: Three-tier context model + docs prune + cloud mirror | ✅ | d79d319 |
| 2: CLAUDE.md slim (445→196 lines) | ✅ | f8d2a82 |
| 3: WORKFLOW.md v2.0 | ✅ | 71d0646 |
| 3a: Cloud archive reorg (Path B) | ✅ | 09b93eb |
| 3b: Repo hierarchy migration (3-level bundle) | ✅ | cb42219 |
| 3c: scripts/slice-close.ts + mock test | ✅ | c3456af |
| — Progress-tracking workflow rule | ✅ | 699d8cd |
| 3d: PLAN.md reshape + 8 per-slice READMEs | ✅ | cd4de1c |
| 3e: docs/sessions/ + _TEMPLATE.md | ✅ | 96c3d37 |
| 3f: OS-agnosticism + OS-quirks registry | ✅ | 4e1ec09 |
| 4: .mcp.json + cloud mcp-templates + claude-config scaffold | ✅ | c1f1a85 + 3b4af9f |
| 5: Global Claude prune (rules/zh + 15 plugins + 3 MCPs + 32 memory files) | ✅ | 9619f63 |
| **6: Re-measurement + delta table** | **🔄 AWAITING FRESH SESSION** | — |
| 7: workflow-efficiency skill (portable) | ⏳ | — |
| 8: Config export snapshot + snapshot/restore scripts | ⏳ (scope expanded) | — |
| 9a: VOCAB.md co-edit (at close) | drafted ✅, finalize at close | — |
| 9: Handoff finalize + PR | ⏳ | — |

**Core principle codified:** the workflow self-enhances. Every mistake solved in a sub-slice becomes a closing-checklist rule so it cannot recur. Quality compounds.

### Key artifacts produced so far

**In repo (Tier 1):**
- `docs/ARCHIVE.md` — three-tier context model + retrieval/write protocols
- `docs/reference/VOCAB.md` — shared lexicon (brand + industry + Claude Code + workflow)
- `docs/slices/_TEMPLATE-SLICE/` + `_TEMPLATE-SUBSLICE/` — 3-level hierarchy skeletons
- `docs/slices/slice-17/slice-17j/` — active bundle (spec + plan + log + handoff, all self-appending)
- `docs/slices/slice-15/`, `slice-16/`, `slice-18/`, `slice-19/`, `slice-19b/`, `slice-20/`, `slice-21/`, `slice-22/` — future slice directions
- `docs/sessions/_TEMPLATE.md` — non-slice session template
- `scripts/slice-close.ts` — portable close-script (uses `$YESITO_CLOUD_ROOT`)
- `.mcp.json` + `.claude/settings.json` — project-scoped MCP allowlist surface
- `CLAUDE.md` (196 lines), `WORKFLOW.md` (v2.0, 735 lines), `PLAN.md` (462 lines)

**In cloud (Tier 2 + 3):**
- `<cloud>/claude-knowledge/token-efficacy/` — 7 deep-dive docs + index, 15+ sources (2025-26)
- `<cloud>/claude-knowledge/os-quirks/{README, windows, macos, linux, cross-platform}.md` — cross-project platform registry, 8 Windows quirks seeded
- `<cloud>/claude-knowledge/mcp-templates/{README, web-sveltekit, sql-pipeline, data-ops, generic, settings-template}.json` — per-project MCP templates
- `<cloud>/claude-config/README.md` — portable Claude setup (scripts ship in Task 8)
- `<cloud>/yesid.dev/docs/archive/` — full historical mirror + `legacy-flat/` preservation
- `<cloud>/yesid.dev/docs/COMPLETED-SLICES.md` + `INDEX.md` — Tier 3 indexes
- `<cloud>/claude-config/user/2026-04-18-pre-prune-snapshot/` — Task 5 backup (rollback available)

### Task 5 prune summary (live machine)

- `~/.claude/rules/zh/` DELETED (11 files, 48 KB)
- Plugins: 32 → 17 enabled (−15)
- User-scope MCPs: 7 → 4 entries (−3)
- Auto-memory: 67 → 35 files (−32, −48%)
- Estimated savings: ~19–22K tokens per session from ~89K baseline → projected ~67–70K (~22% reduction). **Exact measurement pending Task 6.**

**Next session resume:** Task 2 (CLAUDE.md slim).

---

## Previous sub-slice — 17h Brand Bundle (COMPLETE)

## Current Position

- **17h Brand Bundle (2026-04-17/18):** COMPLETE. Narrative + assets shipped as one PR covering both 17h-3 (narrative docs + Task 0 freshen) and 17h-4 (logo assets). `brand/` is now a 22-file narrative + assets package: `README.md`, `BRAND.md`, 6 `foundations/*.md`, `components.md`, 4 `decisions/*.md`, 10 SVG logos, 30 PNG exports, 2 Bun/TS scripts, 3 source-only example pairs + README, plus `CLAUDE-DESIGN.md` brief for vision LLM grounding. Task 0 freshen touched 9 reference docs (CONSTITUTION, CSS, MOTION, TESTS, ARCHITECTURE, standardization, root README — plus spot-checks on WORKFLOW, PATTERNS, PLAN, FUTURE_PHASES, CLAUDE) to match as-shipped reality. Handoff: `docs/handoffs/slice-17h-brand-bundle.md`; devlog: `docs/devlog/2026-04-17-slice-17h.md`.
- **17h scope shrink (2026-04-18):** Original 10-11-session plan cut to ~4 sessions / 2 sub-slices. `brand/` = non-tech info + assets only. Governance stays at `docs/reference/`; tokens stay at `src/lib/styles/tokens.css`. Killed: 17h-1 tokens consolidation, 17h-2 code generator, 17h-5 source-of-truth refactor, 17h-6 sync orchestrator.
- **Slice 17a-4:** COMPLETE — fresh-audit session (2026-04-17). Original scope was ~90% already absorbed into 17a-2b / 17d / 17e; slice shipped as a short hygiene pass. 2 residue primitive wirings + 1 content rewrite + 5 `any` tightens + planning-doc refresh. Bonus fix: pre-existing CRLF bug on `main` (2 blog files + `parseFrontmatter` regex) unblocked the baseline.
- **Slice 17e:** COMPLETE — all 6 sub-slices landed across 4 PRs. 17e-5 + 17e-6 shipped combined.
- **Build:** 0 type errors, 19 pre-existing warnings, 782/782 tests pass (+2 since 17e end: StatusDot `ring` prop coverage).
- **Status (17e full-slice):** Motion layer re-engineered from the ground up. Snappy Doctrine enforced in governance (CONSTITUTION.md § 8) and implementation (zero entrance reveals remaining). 9-signature vocabulary closed. One shared `gsap.ticker` site-wide with IO-gated subscribers. GSAP plugins lazy-loaded per consumer (ScrollTrigger + SplitText + MorphSVGPlugin stay eager by necessity). MetroNetwork SSR-inlined via Vite `?raw` + SVGO. Scroll-scrub factories (`createHeroTimeline`, `createCrescendoScrub`, `createDrawScrub`). `use:morphHover` as first-class action. Legacy symbol deletion: reveal / ripple / tilt / ScrollRail / Train tree / heroTimeline.ts / heroScrollLock.ts / ReadingProgressBar / listingAnimations / SvgIcon.animateStagger / StackScenarioCard fade-up. MOTION.md v2.0 + CONSTITUTION.md § 8 + 6 motion learning docs shipped in 17e-6.
- **Bundle (17e-5/6 end):** home / at 35.00 KB gzipped (node 4 + layout 0); all routes well under §6.2 budgets. D269 lazy-plugin shrink target did not land — captureFlipState + CustomEase.create sync-API coupling defeats Vite chunk split. Flagged for post-17e async refactor.
- **Lighthouse (17e-6 audit, Yesid-driven):** Best Practices 100 across all 20 runs ✅. Desktop Perf 91–98 (3 of 10 hit ≥ 98), mobile Perf 54–75 (0 of 10 hit ≥ 90). A11y 95–100. SEO 82–100. **Spec §6.1 targets deferred to Slice 19 / 19b / 20** per design-spec amendment.
- **Next slice:** Slice 17 Phase 1 (visual stage) complete. Remaining Slice 17 work (17b Service Layer, 17c Zod Schemas, 17f Test Architecture, 17g Learning Docs) still planned. Outside Slice 17: Slice 18 (Payload CMS in separate `yesid.dev-cms` repo). Launch-readiness checkpoint is the next logical gate.

### 17h Summary (2026-04-17/18, autonomous session)

| Area | What landed |
|---|---|
| **Task 0 — CONSTITUTION.md freshen** | `text-hero-mobile` added; brand count 15+ → 13; `use:tilt` row removed; `--container-prose` + `--space-stack`/`--space-cluster` dropped; breakpoints table switched to Tailwind v4 defaults (reality — `app.css` has no `--breakpoint-*` overrides). |
| **Task 0 — CSS.md freshen** | Type scale 9 → 12 (hero tokens); brand color tokens corrected (`--primary` not `--color-brand-primary`); RGB channel drift fixed; 4 phantom semantic tokens removed; phantom `--shadow-status` + `--z-footer` removed; spacing 5 → 3; container 3 → 2; brand primitives 15 → 13 + migration note; utility classes 11 → 12 (`grid-rows-collapse`). |
| **Task 0 — MOTION.md freshen** | §11 rotated `<h2>` claim corrected (home Projects + home Terminus + blog listing + projects listing + contact; Services has no rotated edge title). |
| **Task 0 — Lighter audit** | TESTS (date + total 785 → 782 + reveal.ts row replaced), ARCHITECTURE (date), standardization (progress table through 17a-4 + architecture bullets), root README (docs path structure), + spot-check of WORKFLOW/PATTERNS/PLAN/FUTURE_PHASES/CLAUDE. |
| **Task 0 — Governance cleanup** | Deleted `brand/tokens.json`, `brand/tokens.css`, `brand/tailwind.brand.js` (dev-dump duplicates). Rewrote `src/app.css:40-47` stale comment. |
| **Task 0 — Consumer repair (option b)** | `ServiceCard.svelte` (`gap: var(--space-cluster)` → `0.75rem`), `ServiceSvgPanel.svelte` 2 sites (`padding: var(--space-stack)` → `1.5rem`), `ProjectsStrip.svelte` (`gap: var(--space-stack)` → `1.5rem`). Preview-verified at desktop + mobile. |
| **Task 1–6 Narrative** | `brand/README.md` rewrite (front door, ~70 lines), `BRAND.md` (5 principles + tone + vocabulary + do/don't), 6 `foundations/*.md` (color, typography, space, motion, voice, accessibility — all cross-linking OUT to `docs/reference/` for authoritative rules), `components.md` (56 ui/ + 13 brand/ inventory + migration section), 4 `decisions/*.md` (why-orange, why-edge-to-edge, why-a-constitution, what-i-killed). |
| **17h-4 SVG logos** | 4 new SVGs (lockup-horizontal, lockup-stacked, clearspace, donts) + 6 existing SVGs restructured under `brand/logos/` with simpler names. |
| **17h-4 scripts** | `brand/scripts/export-logos.ts` (Sharp-based, tested, 30 PNGs written to `brand/logos/exports/`); `brand/scripts/export-examples.ts` (Playwright-based; script valid but launch hangs on this Windows box — documented in handoff § 8 + `brand/examples/README.md`). |
| **17h-4 deletions** | `brand/colors.json` + `brand/yesid_brand_guide.pdf` (superseded by markdown narrative). |
| **Claude Design brief** | `brand/CLAUDE-DESIGN.md` — single prompt-ready doc Yesid can paste into Claude Design for vision-LLM brand grounding. |
| **Packages added** | `sharp@0.34.5` (dev dep, for batch PNG export). |

### 17h Flagged follow-ups (Yesid decisions)

1. **`--space-stack` / `--space-cluster` re-parametrisation** — hardcoded `1.5rem` / `0.75rem` in 3 consumers; do we want to restore these as semantic tokens?
2. **Breakpoint alignment** — CONSTITUTION § 9 device-coverage matrix (360/520/768/1024/1440) is now documented as orthogonal to the wired Tailwind v4 defaults (640/768/1024/1280/1536). Keep the orthogonal framing, or wire custom `--breakpoint-*` overrides into `app.css`?
3. **`brand:export-examples` on Windows** — Playwright `chromium.launch()` + `firefox.launch()` both hang on this dev box. Works on macOS/Linux/CI. Ship PNG pairs from a different env, or investigate the Windows hang later.

### 17a-4 Summary (fresh audit, 2026-04-17)

| Area | What landed |
|---|---|
| **Audit** | Grep pass at kickoff — 5 of 7 original scope bullets already done (dead components gone, Three.js tree gone, isTouchDevice extracted, station-ping global, section-heading primitive built). Scope shrunk from "big cleanup" to "residue fix + doc refresh". |
| **StatusDot `ring` prop** | New `ring?: boolean` — CSS `outline` (not Tailwind `ring-*`, which uses box-shadow and collides with `led-pulse`). `AboutIdentity` availability dot now `<StatusDot color="green" pulse size="md" ring />`. +2 tests. CSS.md row updated. |
| **ContactPage reset Button** | Raw `<button>` → `<Button variant="ghost">`. `Button` was already imported. Subtler look than the original outlined box (closer match is `variant="outline"` — flagged, Yesid approved ghost). |
| **threejs-threlte.md rewrite** | "In Practice" past-tensed ("Killed, not parked"). `relatedProjects: [yesid-dev]` dropped from frontmatter. "Why I use it" → "Why I chose it" (past-tense body). Cross-link to `brand/decisions/what-i-killed.md` (ships in 17h-3). |
| **CRLF bug bonus fix** | Pre-existing bug on `main`: 2 blog files had CRLF line endings, breaking `parseFrontmatter` regex silently. 3 data-integrity tests were failing on `main` but checkpoint claimed 780/780. Files normalized to LF + regex hardened to `/^---\r?\n/` — durable guard. |
| **5 `any` tightens** | `utils.ts` (any→unknown shadcn probes), `flip.ts` (new `FlipState = ReturnType<typeof Flip.getState> \| null`), `morphHelpers.ts` (`as any` → narrow SVG union + path pass-through). Eslint disables removed. |
| **Planning docs refresh** | `standardization.md` (table + tree + "Remaining — 17a-4" block rewritten with strikethrough annotations); `ARCHITECTURE.md` (13-primitive inventory + migration note); `PLAN.md` (motion/three reference removed); `brand/index.ts` header comment (9 → 13); memory note primitive count; barrel test expected list (9 → 13). |
| **Learn docs** | `docs/learn/patterns/audit-before-plan.md` + `docs/learn/styling/outline-vs-ring-pulsing-dots.md`. Both indexed in `meta.json`. |
| **PATTERNS.md** | +2 entries: "CSS Outline for Halos on Pulsing Box-Shadow Elements", "CRLF-Tolerant Frontmatter Parser". |

### 17e-5 + 17e-6 Summary (combined PR, 2026-04-17)

| Area | What landed |
|---|---|
| **`use:morphHover` action (17e-5)** | Signature 4 — new first-class Svelte action. 5 tests. MorphSVG lazy-loaded on first hover. Mobile tap toggle. Reduced-motion no-op. HomeServices migrated (−103 / +13 lines). |
| **Pulse consolidation (17e-5)** | ManifestoEdgeBottom's scoped `@keyframes pulse` deleted; `.manifesto__status-dot` uses canonical global `pulse-glow`. Audit corrected plan — "4 sites" was actually 1 duplicate. |
| **Typewriter → shared ticker (17e-5)** | `heroTypewriter.ts` migrated from `setInterval(80)` to `subscribe(id, fn)` on the shared ticker. deltaTime-in-ms caveat captured. Cursor blink already CSS from 17e-4; CSS keyframe fixed (`steps(2, start)` → explicit keyframes + `step-end`). |
| **Ambient RAF migration (17e-5)** | `ManifestoCanvas` + `AboutTrain` on shared ticker + IntersectionObserver offscreen pause. `ReadingProgressBar` deleted (Yesid flagged as scrapped, never re-wired). |
| **IO-gated intervals (17e-5)** | `Manifesto` countdown + `AboutTestimonials` carousel gated on section visibility. No wasted ticks offscreen. |
| **D267 F deletions (17e-5)** | `SvgIcon.animateStagger` + switch case deleted. `StackScenarioCard` onMount fade-up deleted. `BlogAnimation` type narrowed. Two blog posts' `animation: stagger` frontmatter updated (morph + draw-fill). |
| **D269 lazy plugin migration (17e-5)** | `registerGsapPlugins()` deleted. `initScrollTriggerConfig` + `ensureSplitTextRegistered` + 6 lazy loaders. 9 consumers migrated. 4 eager plugin imports deleted from gsap.ts. Bundle: home flat (+0.43 KB). Sync-API coupling in flip.ts + createHeroTimeline.ts blocks full lazy split. |
| **Mobile hero dead-space fix (17e-5)** | `.hero-section-reserve` CSS media query — mobile 600svh, desktop 900svh. Was unconditionally 900svh; caused ~350svh empty below HeroMobileSql on mobile. |
| **Cursor-blink CSS fix (17e-5)** | 17e-4 shipped `steps(2, start)` which resolves to "always hidden" for discrete visibility. Explicit 0%/50%/100% keyframes + `step-end` timing gives proper 1 Hz blink. |
| **Typewriter ms/sec fix (17e-5)** | GSAP's `deltaTime` is in MILLISECONDS; migration had compared accumulator to `0.08` (seconds). Fixed to `80`; captured as MOTION.md + ticker.ts documentation. |
| **MOTION.md v2.0 (17e-6)** | 506 lines. Full implementation reference replacing v1.0 motion manifesto. 16 sections: overview → doctrine → vocabulary → actions → scrubs → idle ambient → shared ticker → tokens → lazy plugins → reduced-motion → SEO × motion → bundle budgets → SVGO procedure → anti-patterns → migration from v1.0 → changelog. |
| **CONSTITUTION.md § 8 (17e-6)** | Motion Doctrine — Snappy section rewritten. Forbidden list, 9-signature vocabulary, HomeCloser permitted exception, D266, D269 plugin-registration contract, When-to-use-what table, tokens reference, global-keyframes inventory. |
| **CSS.md + ARCHITECTURE.md + TESTS.md (17e-6)** | Transition Tokens table refreshed (17e-1 values). Global Keyframes table with all 4 canonical patterns. ARCHITECTURE.md motion tree updated to post-17e reality. TESTS.md Motion sections fully refreshed — deleted stale reveal/ripple/tilt/ScrollRail/Train entries, added morphHover + scrubs + tokens + ticker + flip + lenis + device + morphHelpers summaries. |
| **Motion learning docs (17e-6)** | 6 concepts under `docs/learn/motion/`: snappy-doctrine, signature-vocabulary, scrub-factory-pattern, shared-ticker-pattern, lazy-gsap-plugins, ssr-inline-svg. Obsidian frontmatter + wikilinks + analogy → mental model → worked example → common mistakes → knowledge check. |
| **Lighthouse audits (17e-6, Yesid-driven)** | 20 runs (11 routes × 2 viewports, `/tech-stack` skipped). Documented in closing devlog. §6.1 targets transferred to Slice 19 / 19b / 20 per amendment. |
| **Design spec amendments (17e-6)** | D263–D269 appended + Lighthouse target transfer logged. |

### 17e-5 + 17e-6 Decisions (D267–D269)

Captured in the design spec Amendments (2026-04-17) section. Summary:
- **D267 (17e-5):** morphHelpers kept as utility; morphHover new action. SvgIcon.animateStagger + StackScenarioCard fade-up deleted. Ripple stays cut.
- **D268 (17e-4, formalized in 17e-6 MOTION.md):** scrub owns scrollPrompt opacity; typewriter owns text + cursor. Invariant in factory header.
- **D269 (17e-5):** registerGsapPlugins deleted; initScrollTriggerConfig + per-plugin lazy loaders. Bundle shrink gap flagged for post-17e.

### Workflow Rule Adopted 2026-04-17

- **Handoff is part of the implementation PR.** Every sub-slice PR now contains: planning docs (if new) + implementation + handoff. No more separate post-merge docs PRs for handoffs. The 17e-4 docs PR (this branch) is catch-up; 17e-5 onward follows the new rule.

### 17e-4 Summary (PR #17)

| Area | What landed |
|------|-------------|
| Hero timeline | `scrubs/createHeroTimeline.ts` sync factory — 9-phase choreography ported verbatim. Composes ScrollTrigger + pin + DrawSVG + CustomEase. Callers preload `loadDrawSVG` + `loadCustomEase`. Mobile pin `300%`, desktop `800%`. Internal reduced-motion branch. |
| MetroNetwork | Runtime `fetch()` replaced with Vite `?raw` + `{@html}`. SVG in SSR HTML. SVGO one-time pass: 21.2 → 15.1 KB. `svgo.config.mjs` disables `convertColors`/`mergePaths`/`cleanupIds` to preserve classification attributes. |
| heroScrollLock | Deleted (−74 lines). D264 — typewriter is pure ambient now. |
| Typewriter | `setInterval` cursor blink → CSS `@keyframes typewriter-blink { to { visibility: hidden; } }` + `.typewriter-cursor` class. Uses `visibility` not opacity so it doesn't multiply with the scrub-driven scrollPrompt fade. Type-sequence `setInterval` still present — 17e-5 consolidates. |
| heroTimeline.ts | Deleted (−222 lines). Replaced in full by the scrub factory. |
| Mobile hero | 6-iteration polish from Yesid review: edge-to-edge layout, `--text-hero-mobile` token (`clamp(3rem, min(13vw, 8svh), 4rem)`), tighter `padding-block`, merge-into-one-card metric layout that fits in `calc(100svh - 5rem)` on short phones. Desktop untouched ("desktop is perfecto"). |
| AboutMetrics | Stack on mobile (`flex-col md:flex-row`) per Yesid brief. |
| MetricDisplay | One-step-smaller size mappings globally; `.metric-value` marker class + mobile-only `lg` shrink override in app.css. |
| Bundle | Home `/` **+2.18 KB gzipped** vs 17e-1 baseline (opposite of plan's −3 to −8 KB target). Other routes flat or slightly down. Root cause: `registerGsapPlugins()` still runs for non-migrated plugins. Fix lands in 17e-5/6. |
| Tests | +7 (6 createHeroTimeline factory, 1 HeroMetrics mobile wrapper). 774/774 total. |
| Bug fixes from iteration | Phase 1a snap-fade (billboard was staying visible 136vh instead of 8vh); typewriter opacity handoff to scrub (removed `scrollPrompt.style.opacity='1'` from `startBlink`). |

### 17e-4 Decisions (executed)

- **D264 (applied):** `heroScrollLock.ts` deleted. Typewriter runs on every visit, truncates on scroll. No visible regressions.
- **D265 (applied):** Vite `?raw` import + one-time SVGO CLI. `svgo.config.mjs` committed with plugin overrides required to preserve classification logic + per-path granularity. SVGO 4 dropped the `--disable` CLI flag, so the config file is required — not optional.
- **D266:** Factory pattern for hero scroll-scrubs — `createHeroTimeline` does NOT delegate to `createDrawScrub`. Composes GSAP primitives directly because the hero's pin + multi-phase + zoom sequence is too specialized to fit the generic scrub factory shape.
- **D267:** Mobile hero metric layout = **single merged Card with 3 metrics horizontally divided**. Desktop keeps the 3-card grid. Two variants render in the DOM at all times (CSS visibility-toggled). Simpler than `gsap.matchMedia` rebuild, no SSR/browser-env concerns.
- **D268:** Scrub owns `scrollPrompt` opacity exclusively. Typewriter owns text + cursor only. Invariant documented in the factory code header to prevent regression. This rule emerged from the iteration-2 bug fix and is the canonical ownership boundary.
- **D269 (deferred to 17e-5/6):** `registerGsapPlugins()` consumer-wide migration to lazy loaders is required to realize the bundle-shrink target. Not a 17e-4 failure — a correctly-scoped handoff to the next sub-slice.

### Planning pt2 Decisions (D263–D265)

- **D263:** Terminus rotated label is a crescendo scrub target. The Closer graffiti doctrine exception (design spec §3.4) covers ONLY the in-section DrawSVG timeline, not the edge title. All 3 home rotated labels (Projects / Services / Terminus) are primary `<h2>` headings — keep semantic, no `aria-hidden`, `transform: scale()` only. Amend design spec §3.2 during 17e-6 closing.
- **D264:** `heroScrollLock.ts` will be cut in 17e-4. Rationale: scroll-locking the viewport during the typewriter is a "plays at you" pattern that contradicts the Snappy Doctrine. Typewriter becomes pure ambient (signature 9) — runs via shared ticker + IntersectionObserver when visible; if user scrolls past mid-animation, it truncates, which is fine (it's ambient, not narrative-critical). _Applied in 17e-4._
- **D265:** MetroNetwork SVG inline mechanism for 17e-4 = **Vite `?raw` import + one-time SVGO CLI** (not a build plugin). Committed SVG file is the optimized source of truth. Alternative build-plugin option rejected for deterministic-source reasons. Command documented in 17e-6 MOTION.md v2.0. _Applied in 17e-4 with plugin-override twist (see D265 note above)._

### Planning pt2 Decisions (D1–D2 — architectural, not numbered globally)

- **Task decomposition for 17e-2:** verb-first (delete orphans → kill `use:reveal` → strip entrance tweens → extract FLIP → scrub CSS → verify). One verification pattern per task. 7 tasks.
- **Scrub factory signatures:** synchronous factories; caller preloads GSAP plugins at route setup before invoking. `createDrawScrub` variant = `(svgRoot, { section, pathSelector, reverse })` — factory queries paths internally from the SVG root.

### 17e-1 Summary (PR #12)

| Area | What landed |
|------|-------------|
| Tokens | `--duration-instant`, `--ease-out`, `--ease-in-out` added; `--ease-default` upgraded to explicit `cubic-bezier(0.4, 0, 0.2, 1)`. `motion/tokens.ts` TS mirror + parity test. |
| Ticker | `motion/utils/ticker.ts` shared `gsap.ticker` wrapper with subscribe/unsubscribe. Ready for 17e-5 RAF consolidation. |
| GSAP | Hybrid eager + lazy in `motion/utils/gsap.ts`. `loadDrawSVG`, `loadMorphSVG`, `loadFlip`, `loadCustomEase` ready for 17e-2+ consumer migration. |
| Lenis | `ScrollTrigger.normalizeScroll` removed — tap-vs-click bug fix validated on real iPhone + Android. |
| Bundle tooling | `rollup-plugin-visualizer@7.0.1` + `bun run bundle-size` → `dist/stats.html`. Per-route baseline gzipped sizes recorded in slice spec. |
| Barrel | `$lib/motion` now exposes tokens + ticker + lazy loaders. |
| Tests | +33 (11 tokens parity, 5 ticker, 10 gsap lazy loaders, 7 lenis). 802/802 total. |

### 17e-1 Decisions (D259–D262)

- **D259:** Option B hybrid for GSAP plugins — eager imports kept alongside lazy loaders for 17e-1. Consumer migration + eager deletion lands in 17e-2 onward. Zero consumer breakage in this sub-slice.
- **D260:** `--ease-default` curve upgrade from CSS keyword `ease` to explicit `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard). 31 component files consume this token — subtle hover-transition feel shift was Yesid-approved at Task 2 gate.
- **D261:** Bundle-size baseline methodology = per-route SvelteKit node gzipped sizes (not full initial JS). Consistent metric for diff-ability across 17e sub-slices. Full per-route budgets verified via `dist/stats.html` treemap when needed.
- **D262:** Sub-slice closing artifacts (MOTION.md v2.0, CONSTITUTION.md Snappy Doctrine amendment, `docs/learn/motion/`) correctly deferred to 17e-6 per design spec §9.1. Each 17e-2..17e-5 sub-slice gets a handoff file but not full slice-closing work.

### 17d Summary (99 commits, 285 files, +32,885 / -7,048)

### 17d Summary (99 commits, 285 files, +32,885 / -7,048)

| Phase | Sessions | Key Outcome |
|-------|----------|-------------|
| 17d-1: Foundation | 1 | CONSTITUTION.md, ui/card, brand atoms |
| 17d-3: File Splits + SVGs | 2 | 4 oversized files split, 12 Blueprint SVGs inlined, 6 Services SVGs tokenized, 9 orphans deleted |
| 17d-4: Wiring + Edge-to-Edge | 8.5 | Pre-pass P1-P9, 7 page sessions, shells/ deleted, 4 CSS Grid Recipes, blog+project detail from scratch |
| 17d-5: Services Pages | 3 | StationTabs, ServiceCard, ServiceDetailPage, scroll fixes, mobile layout |
| 17d-6: Contact Page | 2 | Paneforge resizable split, weather, local time, Recipe 4 edge title |
| Card Unification | 1 | 21 card instances -> 1 ui/card, .bento-card deleted, code review fixes |

### Contact Page Redesign (17d-6) — COMPLETE

**What was done (15 commits):**
- Recipe 4 Edge Title Grid: rotated "Contact." edge title + accent line
- Paneforge resizable split between info (33%) and form (67%) terminals
- Shared weather utility extracted from About page (`src/lib/data/weather.ts`)
- Server-side weather fetch for contact route (`src/routes/contact/+page.server.ts`)
- Live Montreal local time via `Intl.DateTimeFormat`, updates every minute
- Desktop: entire page fits in one viewport (`max-height: calc(100dvh - nav - footer)`)
- Mobile: stacked terminals (info first, form second), visible heading, no viewport constraint
- Data layer cleanup: removed unused `status`/`availability` fields
- 14 contact tests (12 updated + 2 new weather tests)
- All hardcoded hex colors replaced with semantic tokens

**Design decisions (D218-D240):**
- D218: Recipe 4 Edge Title Grid layout
- D219: Big rotated "Contact." edge title, clamp(6rem, 12vw, 13rem)
- D220: Accent line between edge title and content
- D221: Resizable split via Paneforge
- D222: Default pane ratio 33%/67%
- D223: Min pane sizes: info 20%, form 40%
- D224: Resize handle with grip dots, orange on hover
- D225: Mobile stacked, info first
- D226: Mobile: no resize, no edge title
- D227: Remove status/availability from data layer
- D228: Full-bleed, no max-width container
- D229: Live weather in info terminal
- D230: Shared weather utility from About page
- D231: Live Montreal local time

**Artifacts:**
- Design spec: `docs/specs/2026-04-16-contact-page-redesign-design.md`
- Implementation plan: `docs/plans/2026-04-16-contact-page-redesign.md`
- Mockups: `.superpowers/brainstorm/769-1776313859/content/`

### Card Unification (Task 31) — SPEC APPROVED

**Scope:** 21 card instances across 4 patterns → one `ui/card` component

**Key decisions (D232-D240):**
- D232: One unified surface via `ui/card`
- D233: Delete `.bento-card` utility from app.css
- D234: Delete `.bento-card` overrides from AboutPage
- D235: Motion actions stay per-consumer
- D236: Content layout stays unique per card
- D237: CollapsibleSection uses Card internally
- D238: Remove backdrop-blur from BlogRow
- D239: TerminalChrome stays separate
- D240: StackNode stays separate

**Artifacts:**
- Design spec: `docs/specs/2026-04-16-card-unification-design.md`
- Implementation plan: needs to be written

### Constitution CSS Grid Rewrite Session — COMPLETE

**What was done (18 commits):**
- CONSTITUTION.md rewritten: 4 CSS Grid Recipes replace SectionWrapper/6-layer scope model
- Atomic design: 4 tiers → 3 tiers (shells/ tier deleted)
- shells/ directory deleted: SectionWrapper (201 lines), EdgeRail (220 lines), ListingLayout (109 lines), + 5 zero-consumer components (DetailHero, CardGrid, BentoGrid, AsidePanel + tests)
- BlueprintShell moved to brand/
- 7 pages migrated (12 SectionWrapper removals): HomePage, AboutPage, BlogListingPage, ProjectListingPage, BlogDetailHeader, ProjectDetailHeader, ProjectDetailPage
- Route layouts rewritten: inline Recipe 4 (edge title with writing-mode: vertical-rl)
- `@chenglou/pretext` dependency removed
- Edge titles: fully opaque, rotated correctly (180deg), breathing room for descenders
- Mobile hero: text + buttons bounded to calc(100svh - 5rem), proportional scaling via svh
- Universal scroll chaining: `scrollChain` action replaces all 17 `data-lenis-prevent` instances
- Wireframe diagrams: 11 templates × 3 breakpoints saved to `docs/reference/wireframes/`

**Net impact:** ~1035 lines deleted, 0 visual regression, 0 :global() hacks, 1 dependency removed.

**Design decisions (D211-D217):**
- D211: Delete SectionWrapper/EdgeRail/ListingLayout — CSS Grid recipes replace all 3
- D212: 4 recipes: Full-Bleed, Contained, Content+Sidebars, Edge Title Grid
- D213: Rotated edge titles stay, implemented with writing-mode + clamp()
- D214: Background decorations use position: relative/absolute
- D215: Atomic design 4→3 tiers (shells/ deleted)
- D216: BlueprintShell moved to brand/, rest deleted (0 consumers)
- D217: Constitution §2, §6, §9, §11, §13 rewritten

**Artifacts:**
- Design spec: `docs/specs/2026-04-15-constitution-css-grid-rewrite-design.md`
- Implementation plan: `docs/plans/2026-04-15-constitution-css-grid-rewrite.md`
- Wireframes: `docs/reference/wireframes/page-templates-2026-04-16.html`

### Contact Page — NEXT (17d-6)

Yesid's direction: edge-to-edge full-bleed design. Needs planning session (brainstorm → spec → plan).

### 17d-5 Session 3 (ServiceDetailPage + Grid Pass) — COMPLETE

**ServiceDetailPage rewrite:**
- Asymmetric split hero: text left, ServiceSvgPanel right (desktop), banner (mobile)
- Impact metric column: `clamp(88px, 10vw, 140px)` value, sticky on desktop
- Collapsible related projects: right panel (desktop 1fr 2fr 1fr grid), bottom (mobile)
- Full-bleed body, proportional grid (`1fr 2fr 1fr`), zero hardcoded measurements
- Hazard separator, orange stack pills, SectionLabel station counter
- Mobile: inline metric, SVG banner, related projects before prev/next nav
- ProjectsStrip replaced with inline collapsible project links

**BlogDetailPage simplification:**
- SectionWrapper removed entirely, replaced with plain 2-column CSS grid
- Begin./Transmission. edge labels removed (decorative noise)
- Grid: `1fr 2fr` (wide), `1fr 1.5fr` (1024-1279px), single column (mobile)
- Zero hardcoded pixel measurements, no `:global()` specificity hacks

**ProjectDetailPage grid:**
- Proportional `1fr 2fr 1fr` override via `:global(.section-wrapper.detail-body[data-layout="centered"])`
- Removed hardcoded `--edge-left: 340px; --edge-right: 400px` inline styles

**ProjectListingPage responsiveness:**
- Card grid 2-column breakpoint bumped from 768px → 1280px
- At narrower desktops (1118px), cards stack single-column within EdgeRail layout

**Design decisions (D205-D210):**
- D205: ServiceDetailPage uses plain CSS grid, not SectionWrapper
- D206: Impact metric rendered inline (not MetricDisplay) for size control (88-140px)
- D207: Related projects in right panel (desktop) / collapsible bottom (mobile)
- D208: Blog edge labels removed — centered layout is cleaner
- D209: SectionWrapper is an obstacle — constitution rewrite planned
- D210: Proportional `fr` units everywhere, zero hardcoded measurements

**Files modified (4 files, +576 / -342 lines):**
- `src/lib/components/services/ServiceDetailPage.svelte` — full rewrite
- `src/lib/components/blog/BlogDetailPage.svelte` — SectionWrapper removed, plain grid
- `src/lib/components/projects/ProjectDetailPage.svelte` — proportional grid override
- `src/lib/components/projects/ProjectListingPage.svelte` — card grid breakpoint

### 17d-5 Session 2 (Bug Fixes + Mobile Polish) — COMPLETE

**Bugs fixed:**
- Nav gap: `::before` pseudo-element on `.tabs-bar` replaces broken box-shadow approach
- Global scroll: `data-lenis-prevent` added to 16 scrollable containers site-wide (TOC panels, filter sidebars, terminal bodies, horizontal strips)
- Horizontal overflow: `overflow-x: clip` on root `.circuit-grid` wrapper (clips hero GSAP animation elements)
- Services page overflow: `overflow-x: clip` on `.services-page`
- Tab left-alignment: `justify-start` overrides bits-ui Tabs.List base `justify-center` on mobile
- ServiceCard centering: `position: sticky; top: calc(50dvh - 13rem)` on `.viewport-inner` centers content in usable area between sticky tabs and strip at every scroll position
- Swipe guard: `pointer-events: none` during touch swipe prevents click-on-swipe on tab strip
- Cross-browser reset: tap-highlight, text-size-adjust, appearance resets in app.css

**Mobile layout:**
- Card height = usable area: `calc(100svh - 12rem)`, flex centered, `scroll-margin-top: 8.75rem`
- SVG stacked on top (same card as desktop, scaled to 100×120px)
- "Deep dive →" CTA + SVG at opposite ends (`justify-content: space-between`) in bottom row
- Separate desktop/mobile CTA elements with visibility toggles
- Bigger CTA button: `text-body` size, `1rem 2.5rem` padding, hover lift with orange glow

**Desktop layout (untouched after approval):**
- Sticky inner: content centers at usable viewport center (0px offset verified)
- CTA + metric in text area, SVG panel beside text
- Projects strip: `space-evenly` distribution of project links

**Design decisions (D196-D204):**
- D196: `::before` pseudo-element for nav gap cover (box-shadow had wrong height)
- D197: `data-lenis-prevent` attribute is the standard for nested scroll containers
- D198: `overflow-x: clip` (not hidden) preserves sticky positioning
- D199: `position: sticky` on `.viewport-inner` centers content at every scroll position — no scroll-to hack
- D200: `calc(50dvh - 13rem)` sticky top = usable-center minus estimated half-content-height
- D201: Mobile card height = `calc(100svh - 12rem)` = usable area between tabs (8.75rem) and strip (3.25rem)
- D202: `scroll-margin-top: 8.75rem` for mobile tab-click alignment
- D203: Dual CTA elements (desktop-only / mobile-only) with `.deep-dive-cta.desktop-only` / `.mobile-only` specificity
- D204: Swipe guard via `pointer-events: none` class toggle — bulletproof regardless of event ordering

**Files modified (22 files, +175 / -61 lines):**
- `src/app.css` — cross-browser mobile resets
- `src/routes/+layout.svelte` — `overflow-x-clip` on root wrapper
- `src/lib/components/services/ServiceCard.svelte` — sticky centering, mobile layout, dual CTA, spacing
- `src/lib/components/services/ServiceCard.test.ts` — updated for dual CTA links
- `src/lib/components/services/ServiceListingPage.svelte` — nav gap fix, overflow clip, scroll offset
- `src/lib/components/services/ProjectsStrip.svelte` — `space-evenly` on desktop, `var(--space-page-x)` alignment
- `src/lib/components/shared/StationTabs.svelte` — justify-start, swipe guard, touch handlers
- `src/lib/components/brand/StickyPanel.svelte` — `data-lenis-prevent`
- `src/lib/components/brand/TerminalChrome.svelte` — `data-lenis-prevent`
- 13 more components — `data-lenis-prevent` on scrollable containers

### 17d-5 Planning Session — COMPLETE

**Design decisions (D183-D195):**
- D183: Inverted orange accents on dark canvas (not orange background — tested, felt aggressive)
- D184: Three solid orange surfaces (tabs strip, SVG panel, projects strip)
- D185: No EdgeRail on services (StationTabs + orange strips provide identity)
- D186: Asymmetric split layout (Option C — engineering spec sheet vibe)
- D187: Standard cards for detail content sections (not orange-tinted)
- D188: Scroll-snap `y proximity` (not mandatory — allows free scrolling)
- D189: No TOC on detail page (3-4 sections max, TOC overkill)
- D190: Nested scroll container eliminated (violates Constitution Scroll Law)
- D191: Footer restored to global layout (was trapped in inner scroll)
- D192: SVG strokes invert via container `color` (no SVG file changes)
- D193: Constitution amended with nested scroll ban
- D194: Hazard stripes edge the orange strips
- D195: Dynamic projects strip via IntersectionObserver

**Scroll trap diagnosis:**
- `.service-listing` had `height: calc(100dvh - 5rem)` + `overflow: hidden` — blocked page scroll
- `.scroll-area` had `overflow-y: auto` + `scrollbar-width: none` — hidden inner scrollbar
- Lenis managed page scroll but never reached services content
- Footer trapped inside inner scroll container
- Fix: eliminate nested scroll, page-level Lenis scroll, Constitution amendment

**Artifacts:**
- Design spec: `docs/specs/2026-04-15-services-pages-design.md`
- Implementation plan: `docs/plans/2026-04-15-services-pages.md` (10 tasks, 3 sessions)
- Mockups: `.superpowers/brainstorm/1208-1776282068/content/` (4 approved mockups)

**Implementation plan summary:**
| Session | Tasks | Focus |
|---------|-------|-------|
| 1 | T1-T5 | Constitution amendment, layout fix, ServiceSvgPanel, ProjectsStrip, StationTabs restyle |
| 2 | T6-T7 | ServiceCard rewrite + ServiceListingPage rewrite (scroll fix) |
| 3 | T8-T10 | ServiceDetailPage rewrite, scroll audit, visual verification |

### Session 10 (Bug Fixes + Polish + Tests) — COMPLETE

**Bug fixes:**
- **Left panel sticky fix** — `overflow-x: hidden` on `.body-grid` was creating a scroll container that broke `position: sticky`. Changed to `overflow-x: clip` which clips visually without creating a scroll container.
- **Mobile code block overflow fix** — Two-part fix: (1) `overflow-x-hidden` on BlogContent card establishes width constraint, (2) moved `min-width: 0` on `.section-content` outside desktop media query so it applies at all breakpoints. Pre blocks now scroll horizontally within the card.
- **Layout shift fix** — Replaced Google Fonts CDN with self-hosted `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono`. Fonts now bundle with the app, eliminating the font-swap delay. Body grid starts `opacity: 0` on desktop, fades in after edge labels are sized.
- **Pretext removal** — Replaced `@chenglou/pretext` with DOM-based `getBoundingClientRect` measurement for edge label sizing. Exact 1.000 ratio to viewport height. Simpler, no external dependency for this component.

**Tests:**
- 5 new BlogDetailPage structure tests (data-testid, header, content, accent colors)
- Fixed GSAP mock: added `gsap.utils.selector` stub to `setup.dom.ts`
- Total: 785 tests pass (was 780)

**Visual verification:**
- Desktop 1440px: header, TOC sticky, edge labels, code blocks, reading mode — all verified
- Mobile 375px: no overflow, floating TOC pill, code blocks contained, blockquotes styled
- Tested professional posts (orange accent) and personal posts (yellow accent)
- Zero horizontal overflow, zero console errors

### Session 9 (Blog Detail Page Implementation) — COMPLETE

**Completed:**
- Task 1: Route bypass via +page@.svelte, postIndex in load, isFullBleed for blog detail paths
- Task 2: BlogDetailHeader rebuilt from scratch — magazine cover (circuit grid, ManifestoCanvas, watermark, CornerMarks, edge labels, category line, SplitText title with tag highlight, tag pills, meta row, GSAP entrance)
- Task 3: BlogRouteMap component (transit route SVG, CSS-only styling, 6 tests) — later REMOVED per feedback, replaced with edge labels
- Task 4: BlogDetailPage orchestrator — 4-zone body grid (Begin. edge | TOC+content | Transmission. edge), shared IntersectionObserver, BlogTocPill floating mobile TOC
- Task 5: TOC wiring + left column metadata (already done in Session 9 revisions)
- Task 6: N/A (route map animation — component removed)
- Task 7: BlogDetailPage structure tests (Session 10)
- Task 8: Visual verification + polish (Session 10)
- Shiki syntax highlighting integrated (brand theme: orange keywords, yellow strings, warm comments) — both blog + project README
- Reading mode toggle (switch in left panel, dims header/edges/footer)
- Mobile side margins on blog + project detail body
- Scroll-margin-top on all headings (anchors land below nav)
- Prose text bumped to 17px mobile / 18px desktop
- Metadata panel below TOC (category, word count, read time, language, tags)
- Edge labels dynamically sized via DOM getBoundingClientRect (text spans exactly 100dvh when rotated)

**Design decisions (Session 10):**
- D179: `overflow-x: clip` instead of `hidden` on body-grid — prevents scroll container that breaks sticky
- D180: Self-hosted fonts via @fontsource-variable — eliminates layout shift from font swap
- D181: DOM-based edge label sizing via getBoundingClientRect — replaces Pretext, accounts for letter-spacing
- D182: Body grid opacity fade-in on desktop — hides 120px→370px column shift during edge sizing

**Design decisions (Session 9):**
- D170: Route map removed — replaced with "Begin." / "Transmission." rotated edge labels (infrastructure radio protocol)
- D171: Edge labels are section-level (body only), not page-level — don't interrupt header
- D172: Edge labels dynamically sized to 100dvh via DOM getBoundingClientRect (was Pretext, changed in Session 10)
- D173: Equal column widths for both edges (max of the two cross-axis measurements)
- D174: Ghost dimmed text (6% foreground) with bright orange dot
- D175: Reading mode dims via direct opacity on elements, not overlay scrim
- D176: Shiki brand theme: yesid-brand (orange/yellow/warm dark)
- D177: BlogTocPill for mobile (floating pill, same UX as ProjectTocPill)
- D178: Scroll-margin-top globally in app.css for all headings with IDs

**Files created (Sessions 9-10):**
- `src/lib/components/blog/BlogDetailPage.svelte` — orchestrator
- `src/lib/components/blog/BlogDetailPage.test.ts` — 5 structure tests (Session 10)
- `src/lib/components/blog/BlogDetailHeader.svelte` — rebuilt from scratch
- `src/lib/components/blog/BlogRouteMap.svelte` — transit route (kept but unused)
- `src/lib/components/blog/BlogRouteMap.test.ts` — 6 tests
- `src/lib/components/blog/BlogTocPill.svelte` — floating mobile TOC
- `src/lib/data/highlight.ts` — shared Shiki + marked config
- `src/routes/blog/[slug]/+page@.svelte` — clean route (bypasses ListingLayout)

**Files modified (Sessions 9-10):**
- `src/routes/blog/[slug]/+page.ts` — added postIndex
- `src/routes/+layout.svelte` — isFullBleed + @fontsource-variable imports (Session 10)
- `src/lib/data/blog.ts` — imports marked from highlight.ts
- `src/lib/components/blog/BlogContent.svelte` — overflow-x-hidden on card (Session 10)
- `src/app.html` — removed Google Fonts CDN, comment-only now (Session 10)
- `src/app.css` — :root font-family overrides for variable fonts (Session 10)
- `src/tests/setup.dom.ts` — added gsap.utils.selector mock (Session 10)
- `src/routes/projects/[slug]/+page.ts` — imports marked from highlight.ts
- `src/lib/components/projects/ProjectDetailPage.svelte` — mobile padding
- `src/lib/components/blog/BlogContent.svelte` — min-w-0
- `src/app.css` — prose-dark sizing, Shiki styles, scroll-margin-top

### Session 8 (Blog Detail Page Planning) — COMPLETE
- Brainstormed blog detail page design (infrastructure magazine editorial)
- Header: Option C approved — full-bleed cover story (watermark, CornerMarks, edge labels, display title, circuit grid)
- Body: Three-column SectionWrapper (TOC left, prose center, transit route map right)
- Right panel: Transit route map using montreal-metro.svg visual language (CSS-styled SVG)
- Clean-slate approach: old BlogDetailHeader deleted and rebuilt from scratch
- Route bypasses ListingLayout via +page@.svelte (same as project detail)
- Reading progress bar REMOVED per feedback
- All SVG styled via CSS classes — zero inline fill/stroke attributes
- Design spec: `docs/specs/2026-04-14-blog-detail-page-design.md`
- Implementation plan: `docs/plans/2026-04-14-blog-detail-page.md` (8 tasks)
- Mockups: `docs/reference/mockups/blog-detail-page-full.html` (approved)
- D160-D169 design decisions recorded in spec

### Session 7 (Project Detail Polish + Constitutional Audit) — COMPLETE
- Fixed header grid/canvas misalignment — moved ManifestoCanvas out of SectionWrapper background slot
- Scoped GSAP selectors via gsap.utils.selector(headerEl)
- Added depth-based TOC indent for README sub-headings (h3→26px, h4→36px)
- Route verification: +page@.svelte bypasses ListingLayout correctly
- 3 new data layer tests for optional Project metadata fields (774 total)
- Constitutional audit across home, projects, projects/slug, blog:
  - Added semantic h1 to ProjectListingPage and BlogListingPage (were div)
  - Replaced 10 arbitrary text-[Npx] with type scale tokens
  - Replaced hardcoded rgb(20 20 20) in TocPill with var(--background) tokens
  - Replaced transition:all in HomeCloser + Manifesto with specific properties
- D160: Blog detail page designed separately, starts next session

### Session 6 (Project Detail Page Implementation) — COMPLETE
- Plan Tasks 1-7 complete: stackRoles.ts, Project type extensions, ProjectDetailHeader, ProjectGlancePanel, ProjectGlancePanelMobile, ProjectTocPill, ProjectDetailPage rewrite
- Header uses ManifestoCanvas (interactive hover/click), circuit grid, CornerMarks, edge metadata
- Header extends behind nav (negative margin + padding-top), full-bleed via SectionWrapper layout="bleed"
- Body uses SectionWrapper layout="centered" with sideLeft (TOC) and sideRight (GlancePanel)
- TOC, center sections, and right panel all use CollapsibleSection cards (same primitive)
- Mobile: CollapsibleSection "Project Info" panel + floating TOC pill with full heading hierarchy
- TOC tracks all heading levels (h1-h6), README sub-headings nest one level down
- Services in glance panel use ServiceBadge with SVG icons + morph hover
- Route uses `+page@.svelte` to bypass ListingLayout (no EdgeRail on detail pages)
- Root layout `isFullBleed` check skips `pt-20` for project detail pages
- Hazard stripes replace gradient separator
- Sections animate on load (CSS keyframes) instead of scroll-triggered reveal
- Subtitle removed from header per feedback
- **Known issues to fix in Session 7:**
  - Header circuit grid offset needs tuning (grid appears lower than expected)
  - Extract ManifestoCanvas → CircuitGrid (generic brand component)
  - Complete Tasks 8 (route verification), 9 (TOC polish), 10 (GSAP refinement), 11 (visual verification), 12 (data layer tests)
- D155: Use "header" not "hero" for detail page components
- D156: All panels (TOC, sections, glance) use CollapsibleSection — same primitive everywhere
- D157: Mobile TOC pill shows full heading hierarchy matching desktop TOC
- D158: SectionWrapper container="none" on mobile (zero inline padding), desktop gets --space-page-x
- D159: Desktop columns spaced with gap: 2rem

### Session 5 (Project Detail Page Design) — COMPLETE
- Brainstormed content strategy for detail pages (blog + projects)
- Scoped to project detail page ONLY (blog detail + consolidation in later passes)
- Services/stack detail pages get separate design passes
- Approved design: manifesto-style hero (circuit grid, edge metadata, GlowOverlay, CornerMarks) + three-column body (left TOC, center sections, right glance panel)
- Mobile: collapsible glance panel + floating TOC pill
- Sections are dynamic from project.sections[] with 4-5 defaults as content guide
- Hero metadata auto-generated from Project data (slug, stack roles, location, metrics)
- Approved mockup saved: `docs/reference/mockups/project-detail-page-approved.html`
- Design spec: `docs/specs/2026-04-14-project-detail-page-design.md`
- Implementation plan: `docs/plans/2026-04-14-project-detail-page.md` (12 tasks, 1782 lines)
- Primitives reuse: CornerMarks, GlowOverlay, cursorGlow, TerminalCursor, MetricDisplay, SectionLabel, StickyPanel, Badge, Separator, ChevronToggle, TableOfContents, CollapsibleSection, boop, reveal
- Data layer changes needed: add location?, environment?, version?, impactMetrics? to Project type
- New files: ProjectDetailHero, ProjectGlancePanel, ProjectGlancePanelMobile, ProjectTocPill, stackRoles.ts
- D151: No edge rail on detail pages — accent line + manifesto hero instead
- D152: TOC on LEFT, glance panel on RIGHT (opposite of typical blog layouts)
- D153: Sections fully dynamic, no fixed template — defaults are just a content guide
- D154: Blog detail page designed separately, consolidated after both are done

### 17d-4 Pre-pass (P1–P9) — COMPLETE
- P1: SectionHeading wired into BlogListingPage, ProjectListingPage, ContactPage (added `level` prop)
- P2: SectionLabel wired into ServiceCard, ServiceNav, +error, tech-stack
- P3: BlogRow already clean, +error dots not MetroStation-compatible
- P4: Skipped — tech-stack hero stats use mono/foreground style (intentionally different from MetricDisplay)
- P5: All viable StatusDot consumers already wired
- P6: TerminalChrome overflow-y: auto added, AboutCta custom scroll removed (standard behavior)
- P7: Semantic HTML — dual h1 fixed (HeroTextContent), h2→h1 (AboutIdentity), h3→h2 (BlogRow, ProjectCard), sr-only h1 (ServiceListingPage), dates in `<time>` tags
- P8: StationTabs already had overflow-x-auto, StackBottomSheet handled by vaul-svelte
- P9: Props interfaces exported for BlogRow, ProjectCard, ServiceCard + 7 shells, barrel exports updated

### Session 1 (Home) — COMPLETE
- HomePage.svelte created as section orchestrator
- All 5 sections wrapped in SectionWrapper (Hero/Manifesto: bleed, Projects/Services/Closer: centered)
- Alternating rotated SectionHeading titles: Projects (left) → Services (right) → Terminus (left)
- Removed redundant in-content headings from FeaturedProjects, HomeServices, HomeCloser (GSAP refs cleaned)
- ServicesBlueprint moved to SectionWrapper `background` slot (spans full width including edge columns)
- SectionWrapper default `container` changed from "content" to "none" (unconstrained by default)
- SectionWrapper grid columns fixed: `minmax(0, var(...))` → `var(...)` (edge columns no longer collapse)

### Session 2 (About) — COMPLETE
- AboutPage bento grid wrapped in SectionWrapper layout="bleed"
- Hazard stripes moved outside SectionWrapper (matches Home's between-section pattern)
- .about-page CSS removed, min-height moved to SectionWrapper inline style
- No rotated titles — bento dashboard is self-contained (D122 ditched)
- No edge content — layout="bleed" with no side slots (D125)
- Bento cards unchanged — correct per D30/D31, card unification deferred to post-S8 pass

### Session 3 (Blog listing) — COMPLETE
- CONSTITUTION.md: added 6-layer scope model (EdgeRail=page-scoped, SectionWrapper sides=section-scoped, all content-agnostic)
- ListingShell deleted — SectionWrapper's grid columns replace its sidebar layout role
- EdgeRail refactored: position:fixed → position:sticky in parent grid, title variant with Pretext text measurement, "Blog." with orange dot
- Blog layout: CSS grid (EdgeRail column + vertical hazard rail + content column), extends behind nav
- Blog listing: 2 SectionWrappers — header (title + SVG icon) + listing (filters in sideLeft, posts in content)
- Mobile consolidation: "Blog. Dispatches" inline prefix when EdgeRail hidden (Option B)
- BlogRow: uniform padding (no featured distinction), bigger text (title text-lg, excerpt text-base)
- Filter sidebar: search moved from header to sidebar, bigger text, full-width buttons, smooth CSS grid collapse, all sections have dividers, Tags collapsed by default
- ChevronToggle: fixed reversed rotation for down direction
- MetroStation: accent-aware via var(--accent, var(--primary))
- SectionHeading: added dot prop (default true, opt-out)
- Separator: hazard uses --primary (not --accent), vertical orientation support
- Pretext installed for text metric calculation
- Blog + Projects share identical structure (same archetype) — D133
- Services + Stack pages get orange accent — D134

### Session 4 (Blueprint headers + Projects listing + DRY) — COMPLETE
- Da Vincian blueprint headers: 5 transit SVGs (blog) + 6 tunneling SVGs (projects)
- SVG folder reorganized into azur/, detail/, transit/, tunneling/ subfolders
- BlogBlueprint + ProjectsBlueprint composition components (using BlueprintShell)
- Vertical hazard stripe → thin 1px accent line on both layouts
- Blueprint header extends behind nav to viewport top (desktop + mobile)
- "dispatches from the field" subtitle overlaid on blueprints, dynamic via prop
- Metro station dots added to EdgeRail (above/below label)
- Projects listing: SectionWrapper wiring, search bar, 2-column card grid, equal-height cards
- Animations fire on load instead of scroll (both listings)
- FLIP animation added to blog filter changes
- DRY extraction: BlueprintShell, ListingLayout, SearchInput, FilterSummary, listingAnimations.ts
- Blog + Projects layouts reduced to 6 lines each (from ~110)
- Date filter kept as native (shadcn calendar deferred)
- Max-width deferred (needs animation/manifesto consideration)
- D139-D150 design decisions (see spec: docs/specs/2026-04-14-blueprint-headers-design.md)

### Decisions (17d-4)
- D101: Added `level` prop to SectionHeading (h1-h6, default h2)
- D102: ServiceCard heading+dot not wired to SectionHeading (styling too different)
- D103: tech-stack hero not wired to SectionHeading (multi-line layout)
- D104: AboutPage has no heading at component level (bento orchestrator)
- D105: SectionLabel variant="station" for service counter, error label, tech-stack overline
- D106: SectionLabel variant="section" for ServiceNav labels
- D107: +error suggestion dots skipped for MetroStation (wrong component)
- D108: MetricDisplay skipped for tech-stack hero stats (mono/foreground vs heading/primary)
- D109: ManifestoEdgeBottom status dot skipped (intentionally dim, GSAP-orchestrated)
- D110: +error suggestion dots skipped for StatusDot (no hollow variant)
- D111: TerminalChrome overflow-y: auto is the standard; AboutCta custom scroll removed
- D112: StationTabs horizontal scroll already correct (overflow-x-auto)
- D113: SectionWrapper layout per Home section (bleed for Hero/Manifesto, centered for others)
- D114: Rotated titles alternate sides: left → right → left
- D115: Edge column width: clamp(4.5rem, 8vw, 8rem)
- D116: Wiring in HomePage.svelte, not inside each component
- D117: "Proof" → "Projects" naming consistency
- D118: SectionWrapper default container changed to "none" (unconstrained)
- D119: ServicesBlueprint moved to SectionWrapper background slot (full-width coverage)
- D120: ControlRoom scrapped (D90 from 17d-3)
- D121: About page = one SectionWrapper wrapping entire bento grid (layout="bleed")
- D122: DITCHED — no rotated titles on About page (bento dashboard self-contained)
- D123: Hazard separators outside SectionWrapper (matches Home between-section pattern)
- D124: .about-page min-height moved to SectionWrapper inline style
- D125: No edge content on About — bento dashboard self-contained, no side slots
- D126: Card unification (Task 31) deferred to post-S8 pass — all 18 instances to ui/card, zero unused ui/ components
- D127: Blog routes get SectionWrapper layout="bleed" for header, "centered" for listing
- D128: Blog listing gets rotated "Blog." title in EdgeRail (not in SectionWrapper sides)
- D129: ListingShell deleted — SectionWrapper's scope-based grid replaces it
- D130: SectionHeading dot prop added (default true, opt-out)
- D131: "Blog." on left EdgeRail with orange dot, title variant
- D132: Blog detail gets header SectionWrapper + content SectionWrapper (not just bleed)
- D133: Blog + Projects = same archetype, identical constitutional structure
- D134: Services + Stack pages get orange accent (--accent: var(--primary))
- D135: Constitution 6-layer scope model — EdgeRail=page-scoped, SectionWrapper=section-scoped, all layers content-agnostic
- D136: Hazard Separator uses --primary (not --accent) for brand consistency
- D137: Mobile blog heading "Blog. Dispatches" inline prefix (Option B consolidation)
- D138: Filter sidebar breakpoint aligned to 1024px (constitutional standard)
- **Decisions (17d-3 Session 2):**
  - D93: CloserGraffiti uses onReady callback for parent timeline integration — child owns DrawSVG lifecycle, parent coordinates timing
  - D94: CloserProps uses display:contents wrapper to preserve absolute positioning
  - D95: Removed unused StatusDot import from HomeCloser
  - D96: HeroBanner heroDot ref resolved via querySelector('.hero-dot') — avoids $bindable complexity
  - D97: Typewriter controls as factory return object { startBlink, stopBlink, type, showImmediate, destroy }
  - D98: refresh-btn style duplicated in parent + HeroMobileSql (scoped CSS can't cross components)
  - D99: Blueprint SVGs use currentColor + text-[var(--primary)] on container — zero hardcoded hex
  - D100: Blueprint opacity reduced (train 0.15→0.08, edge details 0.18→0.10) per Yesid feedback
- **Decisions (17d-3 Session 1):**
  - D88: DataFlowDiagram placed in home/ (primary usage), imported cross-domain by projects/services via $lib/ paths
  - D89: Static image paths (/images/work/) kept unchanged — asset paths, not route paths
  - D90: Tech-stack engine (ControlRoom + StackDiagram + Build Your Stack) stripped — re-engineered Phase 2. Hero + CTA retained.
  - D91: Nav labels "Work" → "Projects" (French/Spanish already said Projets/Proyectos)
  - D92: Manifesto GSAP timeline uses global class selectors to target child sub-components — works because GSAP queries the full DOM

## 17d-3 Task Progress

| Task | Description | Status |
|------|-------------|--------|
| 0 | Repo restructuring — domain folders + renames + route change | COMPLETE |
| 1 | Split Manifesto (1007→395 lines, 5 sub-components) | COMPLETE |
| 2 | Strip tech-stack engine (919→357 lines) | COMPLETE |
| 3 | Split HomeCloser (749→253 lines, 4 sub-components) | COMPLETE |
| 4 | Split HeroBanner (734→353 lines, 3 TS modules + 2 sub-components) | COMPLETE |
| 5 | Split HomeServices + StackPanel (1 sub-component each) | COMPLETE |
| 6 | Blueprint SVGs → Svelte components (12 files, 743 colors tokenized) | COMPLETE |
| 7 | Services SVG tokenization (6 files, 65 colors tokenized) | COMPLETE |
| 8 | Delete orphan SVGs (9 files) | COMPLETE |

## Revised Sub-slice Plan (consolidated)

```
17d-1: Constitution + Card + Brand Atoms ............ COMPLETE (1 session)
17d-2: SvgIcon + Utilities + Shells .................. READY (2-3 sessions)
       → old 17d-2 (Tasks 5-9) + old 17d-3 (Tasks 10-15) combined
       → spec: docs/slices/slice-17d-2-svgicon-utility-shells.md
17d-3: File Splits + SVG Tokenization ................ COMPLETE (2 sessions)
       → spec: docs/slices/slice-17d-3-file-splits-svg-tokenization.md
17d-4: Wiring + Edge-to-Edge (combined 17d-6 + 17d-7). SPEC + PLAN READY
       → spec: docs/slices/slice-17d-4-wiring-edge-to-edge.md
       → plan: docs/plans/2026-04-14-slice-17d-4-wiring-edge-to-edge.md
       → structure: Pre-pass (P1-P9) → 7 page sessions (S1-S7) → Post-sweep (S8)
       → ~8.5 sessions estimated. UnoCSS migration deferred (not Lighthouse-shaped)
```
- **Decisions this session:**
  - D75: Card surface 100% opaque (not translucent), 25% primary border, 60% hover glow
  - D76: Circuit grid 8% opacity with vignette mask (visible at top/bottom, clear in middle)
  - D77: ::selection uses yellow (--accent) background with black text
  - D78: Edge decorations visibility flexible — not strictly xl:+ if no side panels compete
  - D79: Constitution math-driven layout — all dimensions computed from shared variables via min()/clamp()/minmax()
  - D80: Badge number variant uses text-[0.75rem] instead of text-caption to avoid tailwind-merge stripping text-primary-foreground

## Execution Sequence

```
Phase 1 — Foundation (visual cohesion first)
  17a-1: Token Foundation .............. COMPLETE (PR #2 merged)
  17a-2a: Build Primitives ............. COMPLETE (PR #3 merged)
  17a-2b: Wire Primitives .............. COMPLETE (PR #4 merged)
  17a-3a: Color Lockdown ............... COMPLETE (20 tasks, PR #5 merged)
  17a-3b: Token Wiring + Normalization . COMPLETE (8 tasks, PR #6 merged)
  17a-5: Spacing & Layout Constitution . COMPLETE (PR #8 merged)
  17a-6: Component Library Foundation ... COMPLETE (PR #9 merged)
  17d:   Component API ................. COMPLETE (99 commits, ~17 sessions, PR #10 merged)
  17e:   Motion Re-Engineering ......... IN PROGRESS (6 sub-slices, ~6-6.5 sessions)
    17e-1: Foundation .................. COMPLETE (8 tasks, PR #12 merged)
    17e-2: Snappy Sweep ................ COMPLETE (PR #15 merged — combined 17e-2 + 17e-3)
    17e-3: Scrub Factories ............. COMPLETE (PR #15 merged)
    17e-4: Hero Timeline Rewrite ....... COMPLETE (PR #17 merged — D264 + D265 + D266–D268 applied; +2.18 KB home bundle deferred to 17e-5/6)
    17e-5: Interaction Consolidation ... PLAN WRITTEN (docs/plans/2026-04-17-slice-17e-5-interaction-consolidation.md) — D269 gates the bundle-shrink win
    17e-6: Closing ..................... PLAN WRITTEN (docs/plans/2026-04-17-slice-17e-6-closing.md) — Lighthouse H1 all routes
  17a-4: Dead Code + Trivial Dedup ..... PLANNED → needs implementation plan (1 session, after 17e)
Phase 2 — Data + Architecture
  17b:   Service Layer ................. 2 sessions
    → 15: SEO + Metadata
  17c: Zod Schemas ..................... 0.5 sessions
  17f: Test Architecture ............... 1-2 sessions
  17g: Learning Docs ................... 2 sessions
```

## What's Merged Into Main


| Sub-slice               | Branch                                  | PR  | Merged |
| ----------------------- | --------------------------------------- | --- | ------ |
| 17a-1 Token Foundation  | `feature/slice-17a-1-token-foundation`  | #2  | yes    |
| 17a-2a Build Primitives | `feature/slice-17a-2a-build-primitives` | #3  | yes    |
| 17a-2b Wire Primitives  | `feature/slice-17a-2b-wire-primitives`  | #4  | yes    |
| 17e-1 Motion Foundation | `feature/slice-17e-1-foundation`        | #12 | yes    |
| 17e plans (17e-2 / 17e-3) | `feature/slice-17e-planning-pt2`      | #14 | yes    |
| 17e-2 + 17e-3 Sweep + Factories | `feature/slice-17e-2-snappy-sweep` | #15 | yes    |
| 17e plans (17e-4 / 17e-5 / 17e-6) | `feature/slice-17e-planning-pt3` | #16 | yes    |
| 17e-4 Hero Rewrite      | `feature/slice-17e-4-hero-timeline`     | #17 | yes    |


## Wire Tasks Progress (17a-2b)


| Task | Description                                                    | Files                                                                                                                                                                          | Status |
| ---- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| W1   | StatusDot → 4 consumer files                                   | Footer, InfraFrame, HeroSqlPanel, tech-stack                                                                                                                                   | DONE   |
| W2   | SectionLabel utility classes → 19 files                        | Filter*, Work*, About*, Stack*, HomeCloser, ServiceDetail, ProofStrip                                                                                                          | DONE   |
| W3   | StopLabel → 10 About bento cards                               | All About* components + AboutPage                                                                                                                                              | DONE   |
| W4   | Tag → 7 consumer files                                         | TagList, ProjectCard, ProofReel, BlogRow, BlogDetailHeader, WorkCard, WorkDetailSidebar                                                                                        | DONE   |
| W5   | ChevronToggle → 4 files                                        | CollapsibleSection, FilterGroup, BlogFilterSidebar, TableOfContents                                                                                                            | DONE   |
| W6   | HazardStripe → 6 files                                         | +page, AboutPage, +error, InfraFrame, ProofStrip, StationTabs                                                                                                                  | DONE   |
| W7   | cursorGlow auto-inject → 11 files                              | All About*, BlogRow, WorkCard                                                                                                                                                  | DONE   |
| W8   | BrandButton → 7 files                                          | AboutCta, ContactPage, HeroBanner, tech-stack, StackPanel, StackScenarioCard, StackBottomSheet                                                                                 | DONE   |
| W9   | CardBase token alignment → 12 files                            | BlogCard, CollapsibleSection, WorkCard, BlogRow, WorkDetailSidebar, BlogSvgIcon, WorkSvgIcon, BlogFilterMobile, WorkFilterMobile, BlogListingPage, blog/[slug], WorkDetailPage | DONE   |
| W10  | TerminalChrome → 3 files (4 terminals)                         | ContactPage (2), AboutCta, HomeCloser                                                                                                                                          | DONE   |
| W11  | CornerMarks → 1 file                                           | InfraFrame                                                                                                                                                                     | DONE   |
| W12  | MetricDisplay → 3 files                                        | AboutMetrics, AboutLogos, HeroMetrics                                                                                                                                          | DONE   |
| W13  | .bento-card utility → 11 files                                 | All About* bento cards + AboutPage inline                                                                                                                                      | DONE   |
| W14  | .prose-dark utility → 2 files                                  | BlogContent, WorkDetailPage                                                                                                                                                    | DONE   |
| W15  | Consolidate blink keyframes → 2 files + cursor standardization | Manifesto, HomeCloser, TerminalCursor, HeroBanner                                                                                                                              | DONE   |
| W16  | StickyPanel → 2 files                                          | blog/[slug], WorkDetailPage                                                                                                                                                    | DONE   |
| W17  | NumberBadge → 3 files                                          | BlogRow, CollapsibleSection, WorkListingPage                                                                                                                                   | DONE   |


## Session Stats (W7-W17)

- 45 files modified, +264 / -817 lines (net -553 lines removed)
- 11 manual glow overlay divs eliminated (cursorGlow auto-inject)
- 10 bespoke CTA buttons → BrandButton component
- 4 terminal chrome implementations → TerminalChrome component
- ~160 lines of duplicated prose CSS → .prose-dark utility
- ~35 lines of corner tick CSS → CornerMarks component
- 5 scattered metric displays → MetricDisplay component
- 11 bento cards: redundant Tailwind classes removed
- ~25+ hardcoded hex colors → semantic tokens
- 3 cursor implementations → standardized TerminalCursor (8x14px block)
- Hero scroll cursor: `_` → `█` (U+2588) with separate span (no text wiggle)
- Blog content: added card wrapper for structural consistency with work detail

## Cumulative Stats (W1-W17)

- ~95 files modified across all wire tasks
- 15 brand primitives wired into consumer components
- 12 utility classes applied
- 3+ custom @keyframes consolidated to global
- All About bento cards standardized to .bento-card utility
- All terminal chrome standardized to TerminalChrome component
- All cursors standardized to TerminalCursor component

## Key Decisions (W7-W17)

- **D26:** WorkCard/BlogRow glow standardized from per-project colors to brand-primary
- **D27:** AboutCta intensity normalized from 0.08 to default 0.06
- **D28:** Stack* CTAs changed from always-on brand outline to BrandButton primary
- **D29:** ContactPage submit button now full-width (parent flex stretches it)
- **D30:** CardBase component wrapping skipped for cards using use:boop/use:tilt (Svelte actions don't work on components). Token alignment achieves same standardization.
- **D31:** About* bento cards excluded from CardBase — use .bento-card utility instead
- **D32:** WorkDetailPage prose styles left for W14 (.prose-dark)
- **D33:** ContactPage terminal panels left for W10 (TerminalChrome)
- **D34:** HomeCloser departure board standardized to TerminalChrome (lost green LED, scanlines, left border accent — gained consistency)
- **D35:** TerminalChrome enhanced with noPadding prop for custom body layouts
- **D36:** HomeServices doesn't have corner marks — only InfraFrame had the pattern
- **D37:** MetricDisplay enhanced with labelBelow prop for value-above-label layouts
- **D38:** HeroMetrics, tech-stack stats, HomeServices, ProofReel skipped for MetricDisplay (structural differences) — HeroMetrics later wired per Yesid request
- **D39:** All bento card borders standardized to .bento-card's brand-tinted color-mix
- **D40:** BlogContent keeps per-post --blog-accent overrides for links/code/blockquotes
- **D41:** Copy button styles tokenized from hardcoded hex
- **D42:** StickyPanel changed from  to  to avoid nested landmark elements
- **D43:** WorkDetailSidebar/WorkListingPage sidebars not wired to StickyPanel (responsive behavior not supported)

## Primitive Enhancements During Wiring

- **TerminalChrome:** added ...rest spread, flex-column layout, noPadding prop, class merge fix
- **BrandButton:** added class merge fix (extract class from rest)
- **CardBase:** added class merge fix (extract class from rest)
- **StickyPanel:** changed to , added ...rest + class merge
- **MetricDisplay:** added labelBelow prop
- **TerminalCursor:** standardized to 8x14px block, uses global blink keyframe

## Open Decisions

- **Blueprint SVGs** (static/svg/blueprint/) — all 12 have brand orange but loaded via `<img>` tags (CSS vars don't work). Need to inline them first, then tokenize. Saved for 17d (Component API) with a reusable SVG loader pattern.
- **Static SVGs** (static/svg/ except construction props) — same `<img>` limitation. Tokenize in 17d alongside blueprint inlining.

## Blockers

(none)

## Closing Session Decisions (2026-04-12)

1. **SectionLabel / GlowOverlay / CardBase** — KEEP, wire in 17d (Component API)
2. **17a-3 scope** — EXPANDED to cover z-index, shadows, transitions, opacity token wiring (not just colors)
3. **Dead components** — saved for cleanup task (not deleting in 17a-2b)
4. **accentColor prop pattern** — standardize everything to `var(--brand-primary)` (no per-blog accents)

## Deep Audit Summary (Closing Session)

- ~220 hardcoded hex colors across 40+ files (17a-3)
- 22 unused tokens defined but never referenced (17a-3)
- 4 dead components: AboutBento, BlogCard, ProjectCard, SectionHeader (cleanup)
- 6 dead Three.js/Threlte files + 2 dev preview routes (only used in /preview, not live site) — delete in 17a-4
- 13 missed primitive wiring opportunities (17d)
- Code duplication: BlogSvgIcon/WorkSvgIcon, isTouchDevice() x3, station pulse CSS x2 (17d)
- Large files: Manifesto (1006), tech-stack/+page (909), HomeCloser (760), HeroBanner (734) (17d)

## Planning Artifacts (17a-3)

- Design spec: `docs/specs/slice-17a-3-color-token-lockdown-design.md`
- Slice spec (colors): `docs/slices/slice-17a-3a-color-lockdown.md`
- Slice spec (tokens): `docs/slices/slice-17a-3b-token-wiring.md`

## 17a-3a Session Stats

- 22 commits on branch
- ~40 files modified across C1–C20
- ~200 hardcoded hex/rgba values replaced with var()/color-mix()
- 3 new tokens added (--text-light, --status-warning, --brand-primary-border)
- @theme split into @theme (static) + @theme inline (dynamic)
- Light theme smoke-tested — renders correctly
- Zero hardcoded brand colors in .svelte CSS/Tailwind (only comments + JS runtime exceptions)

### Intentionally excluded from 17a-3a (documented):

- Three.js Color constructors — dead code, delete in 17a-4
- Canvas 2D API (ManifestoCanvas, AboutTrain) — JS runtime, can't use CSS vars
- MetroNetwork external SVG classification — needs inline rewrite (17d)
- Construction props (ConstructionScene) — physical objects, colors don't change with brand
- Static SVGs in static/svg/ — loaded via `<img>`, need inlining first (17d)
- Blueprint SVGs — same `<img>` limitation (17d)
- AboutBento — dead component, delete in 17a-4

## Key Findings (Planning Session)

- Actual hardcoded colors: **371** (vs. ~220 estimate from closing session)
- Tailwind v4 `@theme inline` resolves dual source-of-truth between tokens.css and app.css
- Brand primitives (brand/) already clean — 63 var() refs, zero hardcoded hex
- 3 new tokens needed: --text-light, --status-warning, --brand-primary-border

## 17a-3b Session Stats

- 8 tasks (T1–T8) across 1 session
- ~40 files modified
- 163+ hardcoded values replaced with token references
- Token categories wired: z-index (43), box-shadow (11), transition (45), opacity (16), pill radius (10), font stacks (23), utilities (11), container/radius (4+2 from sweep)
- Zero new tokens — all 22 categories already existed, just unused
- Final sweep: zero raw values remain for any tokenized category

### Intentionally excluded from 17a-3b (documented):

**Opacity (27 occurrences):**
- 12 inside `@keyframes` blocks — animation waypoints, not static design values
- 2 inline `style=` attributes — template markup (Manifesto beck-line, AboutInterests divider)
- 2 `.disabled` / `:disabled` states — UX state opacity, not a design tier (StackConfigurator 0.35, StackBottomSheet 0.3)
- GSAP JS runtime values — HeroBanner (6), StackConnections (1), DataFlowDiagram (1), Manifesto (1)

**Box-shadow (10 occurrences):**
- 2 use `--accent` color (BlogListingPage, BlogRow) — per-blog color, can't use brand token
- 5 unique intensities — 40-50% brand primary (MenuOverlay active stop, Manifesto dot-active, ServiceListingPage metro dot, StackNode selected) — 2x above any existing glow token
- 1 inside `@keyframes pulse` (Manifesto) — animation waypoint
- 1 uses `rgb()` with spread radius (StopLabel) — unique pulse pattern
- 1 unique combo (AboutPage bento hover) — vertical offset + subtle drop shadow

**Transition (5 occurrences):**
- `ease-in` in MenuOverlay closing state — exit-specific easing, no token
- Unique cubic-bezier curves in MenuOverlay open/close — component-specific entry/exit physics
- `0.12s` stagger delay in MenuOverlay — non-standard sub-fast duration
- `0.4s` durations (ServiceCard, ServiceDetailPage, StackNode) — between --duration-slow (300ms) and --duration-slower (500ms), no exact token

**Border-radius (24 occurrences):**
- 14 `border-radius: 50%` — circles, not pills (no token needed)
- 2 `border-radius: 0` — resets
- 4 values 1-3px — below --radius-sm (4px), too small for existing tokens
- 2 `border-radius: 1.25rem` (20px) — above --radius-xl (16px), no token
- 1 `border-radius: 10px` — between --radius-md (8) and --radius-lg (12), no exact match
- 1 `border-radius: 20px` — above --radius-xl, no token

**Metro line in ServiceListingPage:** Scroll-linked metro line is scrapped functionality — marked for cleanup in a future dead code pass.

## Planning Session: Constitution (2026-04-13)

### Key Decisions

- **D44:** Full-bleed edge-to-edge layout for ALL pages (blog, work, services, about, contact — not just home). Viewport is the canvas.
- **D45:** Bits UI adopted for interactive a11y primitives (Dialog, Collapsible, Tabs, Toggle). Skeleton and Flowbite rejected (token conflicts, invasive globals).
- **D46:** shadcn-svelte cherry-pick inspiration only — token naming conflicts prevent full adoption.
- **D47:** 5 canonical breakpoints: 360/520/768/1024/1440 (replacing Tailwind defaults 640/768/1024/1280/1536). Foldable devices explicitly supported at 520px.
- **D48:** 5 semantic spacing tokens (page-x, section-y, card-gap, stack, cluster). Not a full spacing scale — Tailwind's default scale covers the rest.
- **D49:** 17e Motion Re-Engineering is ground-up rebuild, NOT patch existing. Architect preset system first, rewrite all 75 GSAP calls to use it.
- **D50:** CONSTITUTION.md governance document covers all 12 areas: tokens, layout, spacing, typography, semantic HTML, components, a11y, Bits UI, motion, responsive, file org, anti-patterns.
- **D51:** Typography as a design element — oversized type, mono annotations at edges, section labels as visual rhythm.
- **D52:** Container tokens are for TEXT readability only. Visual elements, SVGs, panels, decorative elements USE the full viewport edges.

### Artifacts

- Design spec: `docs/specs/2026-04-13-constitution-design.md`
- Implementation plan (17a-5): `docs/plans/2026-04-13-slice-17a-5-spacing-layout-plan.md`
- Wireframes: `.superpowers/brainstorm/919-1776054861/content/constitution-edge-to-edge.html`

### Library Evaluation Summary

| Library | Verdict | Reason |
|---------|---------|--------|
| Bits UI | ADOPT | Headless, Svelte 5 native, GSAP compatible, zero token conflicts |
| shadcn-svelte | Cherry-pick | Token naming conflicts, most components unused |
| Skeleton | REJECT | --spacing override, 200+ competing tokens, invasive globals |
| Flowbite Svelte | REJECT | JS theming, dark mode mismatch, Svelte transition lock-in |

### Codebase Audit Key Numbers

- 230 hardcoded spacing rules in scoped styles
- 28 arbitrary Tailwind spacing values
- 75 GSAP calls across 15 files
- 15 svelte-ignore a11y suppressions
- 4 files > 500 lines
- 121 responsive Tailwind classes to migrate to new breakpoints

## 17a-6 Session 2 Stats

- 6 commits on branch (Tasks 9-14)
- 56 ui/ component directories scaffolded (shadcn-svelte --all)
- 15 ui/ components customized with brand styling
- 16 new dependencies installed (bits-ui, vaul-svelte, paneforge, etc.)
- CSS additions: tw-animate-css, @custom-variant dark, destructive/sidebar @theme inline tokens
- New files: components.json, src/lib/utils.ts (cn), src/lib/hooks/is-mobile.svelte.ts
- Zero visual regression — all changes are scaffolding + restyling unused components

### Session 2 Decisions

- **D53:** `--destructive: #ff5f57` — preserved original error color (not shadcn default #dc2626)
- **D54:** `--destructive-foreground: #FAFAF8` in `:root` (non-themed, consistent red across light/dark)
- **D55:** Sidebar @theme inline tokens mapped to existing semantics (so scaffolded sidebar doesn't break)
- **D56:** `@custom-variant dark (&:is([data-theme="dark"] *))` — maps dark: to our attribute-based switching
- **D57:** Accordion items use card-style (bg-card, border-subtle) instead of border-b separators
- **D58:** Toggle uses pill shape (rounded-full) + font-mono + brand orange pressed state
- **D59:** Tooltip uses terminal-style (bg-card, font-mono, border-subtle, compact padding)
- **D60:** Progress uses 3px height to match ReadingProgressBar
- **D61:** Scroll-area thumb uses primary/35 to match global scrollbar CSS

### Components Customized in Session 2

| Component | Brand treatment |
|-----------|----------------|
| dialog | dark overlay (60%), blur-sm, z-menu, card bg, border-subtle, shadow-card |
| drawer | same overlay, card bg, border-subtle per direction, shadow-card, muted handle |
| sheet | same overlay, background bg (full viewport), shadow-section, border-subtle |
| accordion | card-style items (bg-card, border-subtle, rounded-lg, mb-2 spacing) |
| tabs | orange active indicator (after:bg-primary), card tab container |
| toggle | pill shape, font-mono, brand orange pressed state |
| button | hover:bg-primary-hover, simplified outline with border-subtle |
| badge | font-mono, border-subtle outline |
| separator | bg-border-subtle default |
| tooltip | terminal-style (bg-card, font-mono, border-subtle, compact) |
| progress | 3px height, transparent track, brand orange fill |
| scroll-area | brand orange thumb (primary/35) |
| carousel | no changes needed (minimal root wrapper) |
| collapsible | no changes needed (already minimal) |
| toggle-group | no changes needed (inherits toggle variants) |

## 17a-6 Session 3 Stats

- 10 commits on branch (Tasks 15-20 + SSR fix + cta rename)
- 7 brand primitives migrated to ui/ (BrandButton, CardBase, Tag, NumberBadge, HazardStripe, GradientSeparator + CardBase had 0 consumers)
- 4 page components wired to ui/ primitives (MenuOverlay→Dialog, StackBottomSheet→Drawer, CollapsibleSection→Collapsible, FilterGroup→ToggleGroup)
- Brand barrel: 15→9 components (6 migrated to ui/)
- ~50 consumer files updated across all pages
- 3 svelte-ignore a11y comments removed (MenuOverlay 1, StackBottomSheet 2)
- SSR fix: added bits-ui to vite ssr.noExternal
- Net code reduction: significant (deleted 8 brand primitive files + 8 test files)
- Build warnings: 18→16 (removed 2 from StackBottomSheet svelte-ignore)
- Tests: 741→707 (deleted primitive tests, replaced with ui/ tests)

### Session 3 Decisions

- **D62:** Button CTA sizes named `cta-sm`/`cta`/`cta-lg` (industry standard, not `brand-*`)
- **D63:** BrandButton `variant="ghost"` maps to ui/button `variant="outline"` (outline has border, ghost doesn't)
- **D64:** Badge extended with `tag`/`tag-active`/`number` variants + `xs`/`sm` sizes
- **D65:** Separator extended with `hazard` (repeating diagonal stripe) and `gradient` (animated orange→yellow) variants
- **D66:** MenuOverlay wired to bits-ui Dialog directly (not shadcn Sheet wrapper) — child snippet pattern for custom scaleY transition. Dialog bound to `visible` (not `open`) so focus trap persists through close animation.
- **D67:** StackBottomSheet wired to vaul-svelte Drawer — native swipe-to-dismiss replaces manual touch tracking + GSAP animation
- **D68:** CollapsibleSection uses CSS grid `data-state` attributes from Collapsible instead of `.expanded` class
- **D69:** FilterGroup "All" button mapped as `__all__` ToggleGroupItem for unified keyboard navigation

### Session 1 Reviewer Notes — RESOLVED in Session 4

- ✅ TESTS.md and ARCHITECTURE.md updated (deleted component refs removed)
- ✅ CSS.md and CONSTITUTION.md updated (new token names, ui/brand tiers documented)
- ✅ Orphaned test mocks removed from setup.dom.ts
- ✅ three, @threlte/*, postprocessing removed from package.json
- ✅ Stale comment in +page.ts fixed

### Pre-existing findings (deferred to 17d)

- Terminal scroll on About/Services pages — TerminalChrome body may need explicit overflow-y: auto
- Mobile scrollbar visibility — dropped per Yesid, not a concern

## 17a-6 Session 4 Stats

- 7 commits on branch (Tasks 21-26)
- 6 page components wired to ui/ primitives (StationTabs→Tabs, BlogFilterMobile→Collapsible, WorkFilterMobile→Collapsible, TableOfContents→Collapsible+ScrollArea, ReadingProgressBar→Progress)
- AboutTestimonials: ARIA carousel semantics added (not embla — preserves fade animation)
- 12 svelte-ignore a11y comments eliminated across 7 files (div→button, role="toolbar", role="presentation")
- 9 brand primitives updated with cn()/data-slot/class/restProps conventions
- End-of-17a sweep: zero violations (0 old tokens, 0 svelte-ignore, 0 arbitrary spacing)
- Dead deps removed: @threlte/core, @threlte/extras, postprocessing, three, @types/three
- Docs updated: CONSTITUTION.md, CSS.md, TESTS.md, ARCHITECTURE.md, roadmap
- Build warnings: 16→12 (4 a11y warnings eliminated by div→button fixes)
- Tests: 707/707 stable

### Session 4 Decisions

- **D70:** AboutTestimonials NOT wired to embla Carousel — fade→slide would break visual parity. ARIA carousel semantics added manually. Can revisit with embla-carousel-fade plugin.
- **D71:** StationTabs navigate mode kept as `<nav>` + `<a>` links — HTML anchors cannot be tab triggers.
- **D72:** ToC section group toggles kept manual — nested Collapsibles in shared list too complex for minimal gain.
- **D73:** StackDiagram uses `role="toolbar"` (semantically appropriate container of selectable nodes).
- **D74:** BlogSvgIcon/WorkSvgIcon kept as decorative `role="presentation"` — only mouse hover, no click.

## Next Steps

1. **17e-2: Snappy Sweep** — Plan written (`docs/plans/2026-04-16-slice-17e-2-snappy-sweep.md`). 7 tasks, 1 session. Merge docs-only PR first, then branch `feature/slice-17e-2-snappy-sweep` from updated main and implement.
2. **17e-3: Scrub Factories** — Plan written (`docs/plans/2026-04-16-slice-17e-3-scrub-factories.md`). 9 tasks, 1 session. After 17e-2 merges.
3. **17e-4 / 17e-5 / 17e-6 plans** — Pending. Foundations already decided (D263 Terminus crescendo, D264 heroScrollLock cut, D265 MetroNetwork `?raw`+SVGO). Next planning session writes these three plans in sequence.
4. **17a-4: Dead Code Cleanup** — Still planned, 1 session, after 17e closes.

