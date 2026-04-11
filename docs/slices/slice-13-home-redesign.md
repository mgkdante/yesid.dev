# Slice 13 — Home Page Redesign (Global Source of Truth)

**Status:** in-progress
**Priority:** 1
**Estimated effort:** ~14 sessions total (~7 remaining)
**Started:** 2026-04-09
**Design spec:** `docs/superpowers/specs/2026-04-09-home-page-redesign.md`
**Original plan:** `docs/superpowers/plans/2026-04-09-home-page-redesign.md`

---

## Objective

Rebuild the home page as a full-bleed, kinetic, Awwwards-quality experience with scroll-driven sections that deep-link into existing subpages. Dual audience: freelance clients + hiring managers (Alto, CDPQ Infra).

## Page Architecture (7 Sections)

| # | Section | Component | Data Source | Status |
|---|---------|-----------|-------------|--------|
| 1 | **Hero** | `HeroBanner.svelte` + `HeroMetrics.svelte` + `HeroSqlPanel.svelte` | `content.ts`, `hero-data.ts` | DONE |
| 2 | **Manifesto** | `Manifesto.svelte` | `content.ts` (manifestoContent) | DONE |
| 3 | **Proof Reel** | `ProofReel.svelte` | `projects.ts` | NOT STARTED |
| 4 | **Services Grid** | `HomeServices.svelte` | `services.ts` | NOT STARTED |
| 5 | **Blog Teaser** | `BlogTeaser.svelte` | `blog.ts` | NOT STARTED |
| 6 | **About Strip** | `AboutStrip.svelte` | `content.ts` | NOT STARTED |
| 7 | **Dual CTA** | `HomeCta.svelte` | `content.ts`, `meta.ts` | NOT STARTED |

## Sub-slice Registry

> The original plan assumed linear 13a–13i lettering, but reality diverged.
> This registry is the canonical mapping of what each letter actually delivered.

### Completed

| Sub-slice | Name | Sessions | Commits | Key Artifacts |
|-----------|------|----------|---------|---------------|
| **13a** | Foundation | 1 | `1e3a8f4` | Hero fixes, Lenis smooth scroll, old sections teardown, home page stripped to Hero only |
| **13b** | Manifesto | 1 | `eeb0eec` | SplitText char reveal, capability pills, scroll lock, hard cut (Von Restorff) |
| **13c** | _(absorbed)_ | — | — | Viewport fix (`svh` units) — folded into 13d/13e, no standalone delivery |
| **13d** | Hero Redesign | 2 | `c3042c7`…`bed4f4c` | Two-column layout, HeroMetrics, HeroSqlPanel, circuit grid, 7-group GSAP stagger, mock data generator |
| **13e** | Resize Resilience | 1 | `6f1d87b` | `gsap.matchMedia` for breakpoints, SVG dot replacement, browser sleep/wake fix |
| — | Transit Easter Eggs | — | `06ca467` | 9 Montreal transit line roundels on manifesto, terminal-style pills |

**Spec files for completed sub-slices:**
- `docs/slices/slice-13b-manifesto.md`
- `docs/slices/slice-13c-viewport-fix.md` (absorbed — historical reference only)
- `docs/slices/slice-13d-hero-redesign.md`
- `docs/superpowers/specs/2026-04-10-hero-redesign.md` (13d design spec)
- `docs/superpowers/specs/2026-04-10-hero-resize-resilience.md` (13e design spec)
- `docs/slices/13-handoff-notes.md` (running notes)

### Remaining

| Sub-slice | Section | Est. Sessions | Status |
|-----------|---------|---------------|--------|
| **13f** | Proof Reel | 1–2 | Needs planning + brainstorm |
| **13g** | Services Grid | 1 | Needs planning |
| **13h** | Blog Teaser + About Strip | 1–2 | Needs planning |
| **13i** | Dual CTA | 1 | Needs planning |
| **13j** | Polish Pass | 1 | Section transitions, mobile QA, performance |
| **13k** | Closing | 1 | Handoff, devlog, learn docs, tree.txt |

> Letters 13f–13k continue from where 13e left off. No more letter reuse.

---

## Current Home Page Structure

```svelte
<!-- src/routes/+page.svelte -->
<HeroBanner />          <!-- Section 1: metro SVG → zoom → two-column proof -->
<hard-cut />            <!-- Yellow/black dashed line (Von Restorff break) -->
<Manifesto />           <!-- Section 2: SplitText reveal + transit roundels -->
<!-- Sections 3–7: TBD (13f–13i) -->
```

## Section-to-Page Link Map

| Home Section | Links To | Data Source |
|---|---|---|
| Hero CTAs | `/work`, `/contact` | `content.ts` |
| Manifesto pills | `/services/[id]` | `content.ts` (manifestoContent) |
| Proof Reel cards | `/work/[slug]`, `/work` | `projects.ts` |
| Services grid | `/services/[id]` | `services.ts` |
| Blog Teaser titles | `/blog/[category]/[slug]`, `/blog` | `blog.ts` |
| About Strip | `/about` | `content.ts` |
| CTA buttons | `/contact`, LinkedIn | `meta.ts`, `content.ts` |

## Design Principles (from design spec)

- **Full-bleed, edge-to-edge** — zero side margins. Content fills browser width.
- **Kinetic & immersive** — every section has scroll-driven GSAP animation.
- **SVG + GSAP only** — no Three.js. 2D animations.
- **Content connected** — every section deep-links into existing subpages.
- **Data-driven** — all content from existing data layer. No hardcoded strings.
- **Smooth scroll** — Lenis site-wide.
- **Mobile-first responsive** — full-bleed on all viewports.

## Tech Stack

SvelteKit 2 + Svelte 5 (runes), TypeScript, GSAP (ScrollTrigger, SplitText, DrawSVG, matchMedia), Lenis, Tailwind v4, Vitest + @testing-library/svelte, Bun

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-09 | Hybrid A+C approach (narrative + consultative proof) | Brainstorm voted this as best blend of warmth and credibility |
| 2026-04-09 | Lenis for smooth scroll | Awwwards-grade feel, integrates with GSAP ScrollTrigger |
| 2026-04-10 | Hero redesign (13d) — two-column proof instead of simple headline | Carnegie principle: lead with what they want to hear. Transit pipeline is real proof. |
| 2026-04-10 | `gsap.matchMedia` for resize resilience (13e) | Cleanest GSAP pattern — separate timelines per breakpoint, auto-cleanup on resize |
| 2026-04-10 | Transit easter eggs on manifesto | Montreal identity, delights transit nerds, subtle brand storytelling |
| 2026-04-10 | 13c (viewport fix) absorbed into 13d/13e | No standalone delivery needed — `svh` units applied during hero redesign |
| 2026-04-10 | Hero text scale-up | All hero text much bigger on desktop (headline 84→120px, subhead 34→48px, subtitle 15→20px, CTAs sm→lg), slightly bigger on mobile (headline 48→56px, subhead 22→26px, subtitle 15→17px, CTAs sm→base). Metric labels 9→13px desktop, 9→11px mobile. SVG dot auto-scales via em units. |

## Quality Protocol

- **One sub-slice per session.** No cramming.
- **Each section gets its own brainstorm** before code.
- **Iteration protocol** — one task, one approval, no batching.
- **Session handoffs** — document exactly where things stand.
