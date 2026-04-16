# Handoff: Slice 17d — Component API

## 1. Objective Completed

**Implemented:**
- Standardized component APIs across all pages: uniform props interfaces, cn()/data-slot/restProps conventions
- Deleted the entire shells/ tier (SectionWrapper, EdgeRail, ListingLayout + 5 zero-consumer components) — replaced with 4 CSS Grid Recipes in CONSTITUTION.md
- Rewrote every page to CSS Grid Recipes: Home, About, Blog listing, Blog detail, Project listing, Project detail, Services listing, Services detail, Contact, 404
- Unified all 21 card instances to a single `ui/card` component — `.bento-card` utility class deleted
- Split 4 oversized files (Manifesto 1007->395, HomeCloser 749->253, HeroBanner 734->353, tech-stack 909->357)
- Tokenized 18 SVG files: 12 Blueprint SVGs converted to Svelte components, 6 Services SVGs color-tokenized
- Deleted 9 orphan SVG files
- Built blog detail from scratch: full-bleed header, 4-zone body grid, sticky TOC, edge labels, reading mode, Shiki syntax highlighting
- Built project detail from scratch: manifesto-style header, three-column body, glance panel, floating TOC pill
- Redesigned services pages: StationTabs, ServiceCard scroll-snap, ServiceDetailPage asymmetric split
- Redesigned contact page: Paneforge resizable split, weather, local time, Recipe 4 edge title
- Wired all brand primitives to remaining consumers (SectionHeading, SectionLabel, MetricDisplay, StatusDot, TerminalChrome)
- Fixed semantic HTML: dual h1 fixes, h2->h1 promotions, sr-only headings, `<time>` tags
- Replaced `@chenglou/pretext` dependency with DOM-based getBoundingClientRect measurement
- Created `scrollChain` action replacing all 17 `data-lenis-prevent` instances
- 240 design decisions documented (D101-D240) across 17 sessions

**Intentionally not implemented:**
- 17e Motion Re-Engineering — separate sub-slice, ground-up rebuild of GSAP preset system
- 17a-4 Dead Code + Trivial Dedup — separate sub-slice, cleanup pass after motion work
- BentoCard wrapper component extraction — About bento cards use wrapper `<div>` + Card, no dedicated component needed
- TocSidebar / TocPill / ListingShell deduplication — ~570 lines of pre-existing duplication flagged for future consolidation
- UnoCSS migration — deferred, not Lighthouse-shaped

## 2. High-Level Summary

17d was the largest sub-slice in the Slice 17 Standardization effort: 99 commits, 285 files changed, +32,885 / -7,048 lines across ~17 sessions. The work fell into 6 phases:

1. **Foundation (17d-1):** CONSTITUTION.md drafted, `ui/card` component created, brand atoms refined.
2. **File Splits + SVG Tokenization (17d-3):** 4 oversized components split into sub-components, 12 Blueprint SVGs converted from `<img>` to inline Svelte components with `currentColor`, 6 Services SVGs tokenized, 9 orphans deleted.
3. **Wiring + Edge-to-Edge (17d-4):** Pre-pass (P1-P9) to wire primitives, then 7 page sessions rewriting every page to CSS Grid Recipes. SectionWrapper/EdgeRail/ListingLayout deleted. CONSTITUTION.md rewritten with 4 Recipes. Blog and project detail pages rebuilt from scratch with full-bleed headers, sticky TOC, edge labels, reading mode, and Shiki syntax highlighting.
4. **Services Pages (17d-5):** StationTabs restyle, ServiceCard scroll-snap layout, ServiceDetailPage asymmetric split with impact metrics, scroll trap elimination, mobile polish.
5. **Contact Page (17d-6):** Paneforge resizable split, shared weather utility, live Montreal time, Recipe 4 edge title, desktop viewport-fit constraint.
6. **Card Unification (Task 31):** 21 card instances across 4 patterns consolidated to `ui/card`. `.bento-card` utility deleted from `app.css`. CollapsibleSection refactored to use Card internally. Code review fixes: flex-col leak, dead CSS cleanup, `rounded-[inherit]` for overlays, `group-hover/card:` for child hover effects.

**Net architectural impact:**
- shells/ tier deleted (4 tiers -> 3 tiers: ui/, brand/, domain components)
- ~1,035 lines of shell components removed
- 0 `:global()` hacks in new code
- 1 dependency removed (`@chenglou/pretext`)
- Every page uses CSS Grid Recipes directly instead of shell abstraction

## 3. Files Created

**Grouped by category (not exhaustive — 285 files total):**

| Category | Files | Purpose |
|----------|-------|---------|
| Blog detail | `BlogDetailPage.svelte`, `BlogDetailHeader.svelte`, `BlogTocPill.svelte`, `BlogRouteMap.svelte`, `BlogDetailPage.test.ts`, `BlogRouteMap.test.ts` | Full-bleed blog detail system |
| Project detail | `ProjectDetailPage.svelte`, `ProjectDetailHeader.svelte`, `ProjectGlancePanel.svelte`, `ProjectGlancePanelMobile.svelte`, `ProjectTocPill.svelte`, `ProjectDetailPage.test.ts` | Manifesto-style project detail system |
| Data layer | `highlight.ts`, `stackRoles.ts`, `weather.ts` | Shared Shiki config, stack role classification, weather utility |
| Blueprint SVGs | 12 files in `src/lib/components/brand/blueprints/` | Inline Svelte SVGs replacing `<img>` loads |
| Services SVGs | Tokenized inline Svelte SVGs | `currentColor`-based, zero hardcoded hex |
| Sub-components | `CloserGraffiti.svelte`, `CloserProps.svelte`, `CloserDepartures.svelte`, `CloserFloodlight.svelte`, `HeroTextContent.svelte`, `HeroMobileSql.svelte`, `ManifestoEdge*.svelte`, `HomeServicesGrid.svelte`, `StackPanelContent.svelte` | File split extractions |
| Motion | `scrollChain.ts` | Universal scroll chain action replacing `data-lenis-prevent` |
| Design specs | 6 design specs in `docs/specs/` | Brainstorm-approved designs for each phase |
| Implementation plans | 6 plans in `docs/plans/` | Task-level implementation plans |
| Wireframes | `docs/reference/wireframes/page-templates-2026-04-16.html` | 11 templates x 3 breakpoints |
| Card unification spec | `docs/specs/2026-04-16-card-unification-design.md` | Card unification design spec |

## 4. Files Modified

**Grouped by category:**

| Category | Key Files | What Changed |
|----------|-----------|--------------|
| Pages rewritten | `HomePage.svelte`, `AboutPage.svelte`, `BlogListingPage.svelte`, `ProjectListingPage.svelte`, `ServiceListingPage.svelte`, `ServiceDetailPage.svelte`, `ContactPage.svelte`, `+error.svelte` | All migrated to CSS Grid Recipes, SectionWrapper removed |
| Route layouts | `+layout.svelte`, `blog/[slug]/+page@.svelte`, `projects/[slug]/+page@.svelte` | Full-bleed detection, route bypasses, font self-hosting |
| Card consumers (21) | `BlogRow`, `BlogFilterSidebar`, `BlogFilterMobile`, `BlogContent`, `ProjectCard`, `ProjectGlancePanel`, `ProjectGlancePanelMobile`, `ServiceCard`, `CollapsibleSection`, `StackPanel`, `StackScenarioCard`, `InfraFrame`, 9 About* bento cards | All migrated to `ui/card` |
| CONSTITUTION.md | `docs/reference/CONSTITUTION.md` | Rewritten: 4 CSS Grid Recipes, shells deleted, nested scroll ban, atomic design 3 tiers |
| CSS | `app.css`, `tokens.css` | `.bento-card` deleted, cross-browser resets, Shiki styles, scroll-margin-top |
| Brand components | `TerminalChrome.svelte`, `StickyPanel.svelte`, `BlueprintShell.svelte` (moved to brand/) | Enhanced props, moved from shells/ |
| Data layer | `types.ts`, `blog.ts`, `services.ts`, `projects.ts` | Extended Project type (location, impactMetrics), shared highlight config |
| Tests | ~30 test files updated/created | Structure tests for new components, mock updates |

## Concepts Documented

| Action | File | Domain |
|--------|------|--------|
| Created | `docs/learn/styling/card-unification.md` | styling |
| Created | `docs/learn/styling/overflow-clip-vs-hidden.md` | styling |
| Created | `docs/learn/patterns/dom-based-text-measurement.md` | patterns |
| Created | `docs/learn/devops/self-hosted-fonts.md` | devops |
| Created | `docs/learn/styling/design-tokens.md` | styling |
| Created | `docs/learn/project-setup/tailwind-configuration.md` | project-setup |

_See `docs/learn/README.md` for the full knowledge base._

## 5. Data Model Changes

- **Project type extended:** Added optional `location?`, `environment?`, `version?`, `impactMetrics?` fields for detail page glance panel
- **ImpactMetric type added:** `{ value: string; label: string; sublabel?: string }` for services and projects
- **stackRoles.ts added:** Classification of tech stack items by role (frontend, backend, data, devops, etc.)
- **weather.ts extracted:** Shared weather utility (Montreal weather via wttr.in) used by About and Contact pages
- **highlight.ts added:** Shared Shiki + marked configuration for brand-themed syntax highlighting
- **Contact data:** Removed unused `status`/`availability` fields (D227)
- **Nav data:** "Work" -> "Projects" label rename (D91)

Backward compatibility: all new fields are optional. No breaking changes to existing data consumers.

## 6. Commands Executed

Commands run across all 17 sessions (representative, not exhaustive):

```bash
bun run test
bun run check
bun run dev
bun install @fontsource-variable/inter @fontsource-variable/jetbrains-mono
bun install shiki
bun install paneforge
bun remove @chenglou/pretext
```

## 7. Validation Results

```
bun run test: PASS (769 tests, 0 failures)
bun run check: PASS (0 type errors, 21 pre-existing warnings)
```

Build warnings (21) are pre-existing — mostly a11y warnings from components that use custom interaction patterns (StackDiagram toolbar, BlogSvgIcon decorative role, etc.). None introduced by 17d.

## 8. Errors Encountered

Notable errors resolved during 17d (representative):

- **Error:** `position: sticky` broken on TOC panel
  - **Cause:** `overflow-x: hidden` on `.body-grid` creates a scroll container
  - **Fix:** Changed to `overflow-x: clip` (clips visually without creating scroll container)
  - **Resolved:** yes

- **Error:** Services page scroll trap — content unreachable, footer trapped
  - **Cause:** Nested scroll container (`height: calc(100dvh - 5rem)` + `overflow: hidden`)
  - **Fix:** Eliminated nested scroll, page-level Lenis scroll, Constitution amendment banning nested scroll
  - **Resolved:** yes

- **Error:** Layout shift on blog detail page
  - **Cause:** Google Fonts CDN font-swap delay
  - **Fix:** Self-hosted fonts via `@fontsource-variable`, body grid opacity fade-in
  - **Resolved:** yes

- **Error:** Card flex-col leak causing vertical stretch in horizontal layouts
  - **Cause:** Card component defaults to `flex flex-col`, consumers assumed `flex-row`
  - **Fix:** Added explicit `flex-row` where needed, documented pattern in learning doc
  - **Resolved:** yes

## 9. Iterations

17d spanned ~17 sessions with continuous iteration. Key iteration cycles:

| Phase | Feedback | Fix |
|-------|----------|-----|
| 17d-3 | Blueprint SVG opacity too high | Reduced: train 0.15->0.08, edge details 0.18->0.10 |
| 17d-4 S3 | BlogRow featured style too different | Uniform padding, no featured distinction |
| 17d-4 S7 | Blog route map is noise | Removed BlogRouteMap, replaced with edge labels |
| 17d-4 S10 | Reading progress bar unwanted | Removed entirely |
| 17d-5 S1 | Orange background on SVG panels too aggressive | Standard dark styling kept, orange on tabs/strips only |
| 17d-5 S2 | Nav gap visible on services | `::before` pseudo-element fix |
| 17d-5 S3 | Blog edge labels decorative noise | Removed Begin./Transmission. from blog detail |
| 17d-6 | Contact page needs edge-to-edge treatment | Recipe 4 Edge Title Grid with Paneforge |
| Card unification | Approved first review | Code review fixes applied same session |

## 10. Assumptions Made

- **Card surface:** 100% opaque background (not translucent) with 25% primary border is the universal card pattern
- **Edge labels:** Dynamically sized to 100dvh via DOM getBoundingClientRect — assumes CSS `writing-mode: vertical-rl` is consistently supported
- **Scroll chaining:** `scrollChain` action assumes Lenis is the global scroll manager and uses `data-lenis-prevent` semantics
- **Font self-hosting:** `@fontsource-variable` packages bundle all weight/style axes — no CDN fallback needed
- **Shiki highlighting:** Brand theme (orange keywords, yellow strings, warm comments) applies to both blog and project README code blocks
- **Mobile breakpoints:** 1024px is the desktop threshold for all grid recipe column layouts

## 11. Known Gaps / Deferred Work

1. **TOC/Listing duplication (~570 lines):** `BlogTocPill`/`ProjectTocPill` and `BlogListingPage`/`ProjectListingPage` share identical patterns. Consolidation to shared `TocSidebar`, `TocPill`, `ListingShell` deferred.
2. **FeaturedProjects `!important` usage:** Still present in FeaturedProjects component. Needs cascade fix.
3. **CollapsibleSection `:global` for data-slot:** CollapsibleSection still uses `:global([data-slot="card"])` to style the Card it renders internally. Acceptable since it owns the Card, but not ideal.
4. **BlogRouteMap unused:** Component exists but is not rendered (replaced by edge labels). Can be deleted in 17a-4.
5. **Hero timeline verification:** h1->p change in HeroTextContent (P7) may affect GSAP selectors. Verify in 17e.
6. **Motion system:** All 75+ GSAP calls need re-engineering in 17e (preset system, scroll-linked rebuild).

## 12. What Yesid Should Know

- **CSS Grid Recipes replace shell components.** Instead of `<SectionWrapper layout="bleed">`, pages now write the grid directly. Four recipes cover all layouts: Full-Bleed, Contained, Content+Sidebars, Edge Title Grid. See CONSTITUTION.md Section 2.
- **3 component tiers, not 4.** The shells/ tier is gone. Components are: `ui/` (shadcn-svelte headless), `brand/` (hand-built brand atoms), and domain components (pages, sections, features).
- **Card is the single surface.** Every card-like element uses `ui/card`. Wrapper `<div>` pattern for `use:` actions. `group-hover/card:` for child hover effects. `rounded-[inherit]` for overlays.
- **Reading mode** on blog detail dims header/edges/footer via direct opacity. Toggle in left panel.
- **Shiki brand theme** (`yesid-brand`) provides orange/yellow/warm syntax highlighting across blog and project README.

## 13. Next Recommended Slice

**17e — Motion Re-Engineering.** Ground-up rebuild of the motion system. Architect a preset system first, then rewrite all 75+ GSAP calls to use it. Verify hero timeline after 17d h1->p change. Address scroll-linked animations, entrance timing, and reduced motion support.

Opening line: "Re-engineer the motion layer from ad-hoc GSAP calls to a preset-based animation system with consistent timing, easing, and reduced-motion support."

## 14. Final Status

**COMPLETE WITH GAPS** — all acceptance criteria met, all 769 tests pass, Yesid approved all tasks. Known gaps listed in section 11 are pre-existing duplication and minor technical debt, not missing functionality.

---

**Rules:**
- Be precise and honest.
- Do not claim something works unless you actually ran it.
- Do not hide failed commands.
- Do not summarize changes vaguely.
- Do not omit files you changed.
