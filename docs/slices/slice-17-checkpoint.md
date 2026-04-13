# Slice 17 — Checkpoint

**Last updated:** 2026-04-13 | Implementation Session 1 (Tasks 1-9)
**Branch:** `feature/slice-17a-5-spacing-layout`

## Current Position

- **Sub-slice:** 17a-5 (Spacing & Layout Constitution) — IN PROGRESS
- **Task:** 9 of 14 complete. Session 1 done (foundation + all page migrations + arbitrary fixes).
- **Status:** Tasks 1-9 committed. Full-bleed layout live, spacing tokens wired across all pages.
- **Next action:** Session 2 — Tasks 10-14 (viewport units, safe areas, CONSTITUTION.md, docs, sweep).
- **Decision D47 revised:** Kept Tailwind default breakpoints (640/768/1024/1280/1536) instead of custom 360/520/768/1024/1440. Edge-to-edge controlled by layout model, not breakpoints.
- **Pending brainstorm:** Edge-to-edge visual design (edge decorations, vertical typography, circuit lines) for all pages — feeds into 17d.

## Execution Sequence

```
Phase 1 — Foundation (visual cohesion first)
  17a-1: Token Foundation .............. COMPLETE (PR #2 merged)
  17a-2a: Build Primitives ............. COMPLETE (PR #3 merged)
  17a-2b: Wire Primitives .............. COMPLETE (PR #4 merged)
  17a-3a: Color Lockdown ............... COMPLETE (20 tasks, PR #5 merged)
  17a-3b: Token Wiring + Normalization . COMPLETE (8 tasks, PR #6 merged)
  17a-5: Spacing & Layout Constitution . IN PROGRESS → 9/14 tasks done, session 2 pending
  17a-6: Bits UI Integration ........... PLANNED → needs implementation plan
  17d:   Component API ................. PLANNED → needs implementation plan (4 sessions)
  17e:   Motion Re-Engineering ......... PLANNED → needs implementation plan (2-3 sessions)
  17a-4: Dead Code + Trivial Dedup ..... PLANNED → needs implementation plan (1 session, after 17d+17e)
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

## Next Steps

1. **17a-5: Spacing & Layout Constitution** — 14 tasks, 3 sessions. Plan written. Ready to implement.
2. **17a-6: Bits UI Integration** — Needs implementation plan. 1-2 sessions.
3. **17d: Component API** — Needs implementation plan. 4 sessions.
4. **17e: Motion Re-Engineering** — Needs implementation plan. 2-3 sessions.
5. **17a-4: Dead Code Cleanup** — Needs implementation plan. 1 session (last).

