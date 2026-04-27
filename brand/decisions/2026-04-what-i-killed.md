# what i killed

**Date:** 2026-04-18
**Decision type:** Inventory of removed systems
**Status:** Accepted. Cross-references every sub-slice listed.

## Context

What you keep defines a system. What you kill defines it just as much. This doc is a dated record of the things yesid.dev removed — features, abstractions, dependencies, design ideas — and the reason each was pulled out. It's a case-study artifact as much as a maintenance log.

The list is chronological (Slice order), not ranked. The reasons vary — some were wrong from the start, some were right when shipped and wrong later, some were replaced by a better idea.

## The kills

### PDF brand guide (`brand/yesid_brand_guide.pdf`)

**Removed:** 2026-04-18 (Slice 17h)
**Reason:** Unreadable by LLMs, locked to a format that can't version well in git, never kept in sync with the actual site tokens. Replaced by `brand/BRAND.md` + `brand/foundations/*.md` markdown narrative. The PDF was a "feels like a real brand" decoration, not a working reference.

### Parallel brand token files (`brand/tokens.json`, `brand/tokens.css`, `brand/tailwind.brand.js`)

**Removed:** 2026-04-18 (Slice 17h)
**Reason:** The tokens lived in two places — `brand/tokens.*` (purported source) and `src/lib/styles/tokens.css` + `src/app.css @theme` (actual shipped values). Nothing wired the two together. The `brand/` copies drifted immediately and stayed drifted. Rather than build a generator to keep them in sync, keep one source (`src/lib/styles/tokens.css`) and let `brand/` carry narrative only. Physical separation, manual translation, PR review.

### `colors.json` (`brand/colors.json`)

**Removed:** 2026-04-18 (Slice 17h)
**Reason:** Same as the tokens trio. A "raw palette" file that duplicated what `tokens.css` already held. Downstream consumers (Figma plugins, CI checks) didn't exist — it was a future-proofing file for a future that never came.

### Hardcoded hex colors in components

**Removed:** Slice 17a-3a (Color Lockdown, 2026-04-13)
**Reason:** 40+ files had `#E07800` / `#141414` / `#F5F5F0` inline in class strings, scoped CSS, or inline styles. Each one was a hand-rolled copy of a token. A theme swap would have required editing every consumer. Replaced with `var(--primary)` / `var(--background)` / Tailwind utilities (`bg-primary`, `text-foreground`). Single source of truth per value; changing a token updates every consumer.

### Shell layout components (`SectionWrapper`, `EdgeRail`, `ListingLayout`, `DetailHero`, `CardGrid`, `BentoGrid`, `AsidePanel`)

**Removed:** Slice 17d (CSS Grid Rewrite, 2026-04-16)
**Reason:** 7 layout wrapper components, totaling ~1035 lines, that were meant to codify "the site's layout patterns." In practice they grew modes + variants to cover every page's edge cases, and by slice 17d they were harder to read than the scoped CSS Grid they were hiding. Deleted and replaced by 4 named CSS Grid Recipes documented at `docs/project/CONSTITUTION.md § 2`. Each page owns its grid in scoped CSS, references a Recipe by name. No abstraction layer.

### `.bento-card` utility class

**Removed:** Slice 17d (Card Unification, 2026-04-16)
**Reason:** 21 card instances across 4 patterns, all with slight variations. `.bento-card` was an app.css utility class that codified one of the variations; it grew overrides for every consumer. Deleted and replaced with a single `ui/card` primitive. One Card atom for all card-like surfaces site-wide. Motion actions (`use:tilt`, `use:cursorGlow`, `use:boop`) are opt-in per consumer via the action system.

### Three.js / Threlte (hero 3D scene, train animation)

**Removed:** Pre-Slice-17e (incremental removal through 17a-4)
**Reason:** The home hero originally had a 3D train scene (Threlte-based). It looked good in Chrome on a fast machine, badly on mobile, and required a ~200KB bundle hit just to render a decorative element. Replaced by the 2D MetroNetwork SVG (~15KB after SVGO) with a pinned scroll-scrub timeline. Same brand metaphor (transit infrastructure), one-tenth the bundle cost, works on every device, respects reduced-motion naturally. The reduced-motion fallback for the 3D version duplicated most of the SVG work anyway — keeping only the SVG version was strictly simpler.

### `use:reveal`, `use:ripple`, `use:tilt` actions

**Removed:** Slice 17e-2 (Motion Re-Engineering, 2026-04-17)
**Reason:** Entrance-reveal animations on scroll-into-view. Content that was already there would animate in as if it had just loaded. Read as loading states to any informed reader. Contradicted the Snappy Doctrine articulated in 17e. Deleted in full; no replacement. The 9-signature motion vocabulary (boop, cursor glow, magnetic, morph hover, wordmark hover, scrub variants, LED pulse, typewriter) covers what motion actually needs to do.

### Entrance fade-ups, scale-ins, stagger reveals

**Removed:** Slice 17e-2 through 17e-5
**Reason:** Same as above. Every `gsap.from(el, { opacity: 0, y: 30 })` on mount was deleted. `gsap.fromTo(...)` entrance patterns deleted. `stagger` on card lists deleted. `SvgIcon.animateStagger` variant deleted. `StackScenarioCard` onMount fade-up deleted. Content renders at final state on load. Motion only fires on interaction, scroll-scrub, or idle ambient.

### `ReadingProgressBar.svelte`

**Removed:** Slice 17e-5 (2026-04-17)
**Reason:** Scrapped during Slice 09c-2b (blog rework) and never re-wired. Discovered during the D269 audit of ambient RAF consumers. Nothing referenced it; tests for it still passed because the tests tested the file in isolation. Dead code; removed.

### `ScrollRail`, `Train.svelte`, `TrainJourney.svelte`, `train-path.ts`

**Removed:** Slice 17e-2
**Reason:** The "train journey" metaphor that ran along the right edge of the home page. Replaced by scroll-scrub crescendo over the Manifesto statement. The Train components were pre-17e architecture that the 17e re-engineering didn't preserve — the metaphor survived (transit, journey, terminus), the implementation did not.

### `heroScrollLock.ts`

**Removed:** Slice 17e-4 (D264)
**Reason:** Scroll-locked the viewport while the typewriter played in the hero. "Plays at you" pattern — user scrolls, site says "wait." Contradicted the Snappy Doctrine (the user controls pace, not the site). Typewriter became pure ambient; if the user scrolls mid-animation, it truncates. The truncation is fine — the typewriter is a flourish, not content-critical.

### `heroTimeline.ts` (utility)

**Removed:** Slice 17e-4
**Reason:** Replaced by `src/lib/motion/scrubs/createHeroTimeline.ts` factory. The old utility was 222 lines of procedural GSAP; the factory is a documented signature with invariants. Same choreography, readable API.

### `registerGsapPlugins()` (eager plugin registration)

**Removed:** Slice 17e-5 (D269)
**Reason:** Registered every GSAP plugin the site could possibly use at import time, regardless of whether the current route used it. Replaced by `initScrollTriggerConfig()` + per-plugin lazy loaders (`loadDrawSVG()`, `loadMorphSVG()`, `loadFlip()`, `loadCustomEase()`, `loadMotionPathPlugin()`). Three plugins stay eager by necessity (ScrollTrigger, SplitText, MorphSVGPlugin); everything else loads on first use by the consumer that needs it.

### Three.js preview pages (`/playground`, tech-stack 3D scenes)

**Removed:** Slice 17a-4 (2026-04-17)
**Reason:** Experimental pages kept around "for later." None of them were linked from the live site; they added dependencies (Three.js, OrbitControls, postprocessing) to the bundle budget calculations. Removed alongside the Threlte hero scene. If an interactive 3D demo is needed later, it rebuilds — keeping the experiments as dead code did nothing but inflate the tree.

### The 17h generator + source-of-truth automation

**Killed:** 2026-04-18 (Slice 17h planning shrink)
**Reason:** The original 17h plan (10-11 sessions, 6 sub-slices) would have built a `bun run brand:generate` script that read `brand/tokens.json` and emitted `tokens.css`, `app.css @theme`, a Tailwind config, and a typed TS module. The generator would have turned `brand/` into the source of truth and `src/` into emitted output. Shrunk in favor of `brand/` = narrative + assets, `src/` + `docs/reference/` = implementation + governance, PR review = translation layer. Same end state at this scale; different failure modes. At a team of one with solo review, manual translation is safer than generator-enforced sync — a bad edit stays local instead of propagating instantly.

See `decisions/2026-04-why-a-constitution.md` for the full reasoning.

### Four sub-slices inside 17h (17h-1, 17h-2, 17h-5, 17h-6)

**Killed:** 2026-04-18 (same shrink)
**Reason:** Each depended on the generator. 17h-1 consolidated tokens and moved CONSTITUTION / CSS / MOTION into `brand/`. 17h-2 built the generator. 17h-5 refactored source-of-truth pointers across `CLAUDE.md` + `WORKFLOW.md` + `PLAN.md`. 17h-6 wired everything with `bun run brand:sync`. All four rested on the assumption that `brand/` would *own* tokens and governance. Under the shrunk model, it owns neither. The four sub-slices were stubbed in place with an OBSOLETE note and a pointer to the new parent slice.

### Unused shadcn-svelte ui/ scaffolds (37 directories)

**Removed:** 2026-04-26 (Slice slice-design, Child 2)
**Reason:** Audit found 37 of 56 ui/ scaffolds had zero consumers — they were installed via shadcn CLI during 17a-6 / 17d but never wired up. Each occupied disk + cognitive context for no benefit. Deleted in 4 batches of ≤10 with `bun run check && bun run test` between each. Re-add via shadcn CLI when actually needed.

Killed: accordion · alert · alert-dialog · aspect-ratio · avatar · breadcrumb · button-group · calendar · carousel · chart · checkbox · command · context-menu · data-table · dropdown-menu · empty · field · form · hover-card · input-otp · item · kbd · menubar · native-select · navigation-menu · pagination · popover · progress · radio-group · range-calendar · select · sidebar · slider · sonner · spinner · switch · table.

Kept: badge · button · card · collapsible · dialog · drawer · input · input-group · label · resizable · scroll-area · separator · sheet · skeleton · tabs · textarea · toggle · toggle-group · tooltip (19 with active consumers).

### `GlowOverlay` brand primitive

**Removed:** 2026-04-26 (Slice slice-design, Child 2)
**Reason:** Spec said "replaces 12 manual overlay divs" but no consumer ever imported it. 0 consumers per the same audit. Cursor-glow effect lives in `motion/actions/cursorGlow.ts` (action, not component) — that's the right shape for the use case.

### `apps/web/brand/CLAUDE-DESIGN.md`

**Removed:** 2026-04-26 (Slice slice-design, Child 2)
**Reason:** Was a paste-into-design-tools reformat of `BRAND.md` tokens + `CSS.md` tokens. After this slice: tokens live in repo-root `DESIGN.md` (Google-spec, agent-readable, no paste needed); principles + voice + vocabulary live in `apps/web/brand/BRAND.md` (preserved). The paste-ready format is obsolete now that AI agents read the file directly via `DESIGN.md`.

### `docs/project/BRAND.md`

**Removed:** 2026-04-26 (Slice slice-design, Child 2)
**Reason:** Duplicate of `apps/web/brand/BRAND.md` — same identity / palette / typography content. Two sources, one drifting against the other. Kept the canonical `apps/web/brand/BRAND.md` (closer to the consumer code) and updated all cross-links.

## Why this list matters

What a system kills defines it as much as what it keeps. A reader of this doc learns:

- The site had a 3D hero and killed it. Bundle discipline matters more than visual novelty.
- The site had entrance animations and killed them. Snappy Doctrine — content renders at final state.
- The site had a generator plan and killed it. Physical separation over enforced sync; manual translation over deterministic pipelines; solo-scale tradeoff.
- The site had wrapper abstractions and killed them. CSS Grid Recipes in scoped styles beat shell components with growing variants.
- The site had duplicate brand data and killed it. One source per value; PR review bridges intent and implementation.

Each kill is a decision the reader can examine. Each kill is also a temptation the reader can now avoid.

## Revisit trigger

This doc grows with every slice that removes something. No existing entry gets revisited (the decisions are closed); new entries get appended with a dated sub-heading.

A kill gets reversed only if external constraints change — bundle budgets relax, scale justifies the generator, browser support changes what's safe to ship. None of those have happened in 2026-04, and none are expected before 2026-Q3.
