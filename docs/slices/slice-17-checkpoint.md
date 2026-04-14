# Slice 17 — Checkpoint

**Last updated:** 2026-04-14 | 17d-4 Session 3 — Blog listing DONE
**Branch:** `feature/slice-17d-component-api`

## Current Position

- **Sub-slice:** 17d-4 (Wiring + Edge-to-Edge Pass) — IN PROGRESS
- **Status:** Sessions 0-3 complete. Next: Session 3b (Blog detail) or Session 4 (Projects — same archetype as Blog).
- **Build:** 0 errors, 15 warnings, 765/765 tests pass.
- **Next action:** Blog detail page OR Projects (same constitutional pattern as Blog).

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
  17a-6: Component Library Foundation ... IN PROGRESS → Session 3 done (20/26 tasks), Session 4 next
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

1. **17a-6 Closing:** PR to main (squash-merge), handoff report, devlog, learning docs, tree.txt
2. **17d: Component API** — Needs implementation plan. 4 sessions.
3. **17e: Motion Re-Engineering** — Needs implementation plan. 2-3 sessions.
4. **17a-4: Dead Code Cleanup** — Needs implementation plan. 1 session (last).

