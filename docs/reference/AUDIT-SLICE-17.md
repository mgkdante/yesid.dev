# Slice 17 — Codebase Audit Findings

**Date:** 2026-04-11
**Purpose:** Detailed audit results to guide implementation. Every finding here is a task to fix. Check items off during implementation. DO NOT DRIFT from these findings.

---

## 1. Hardcoded Color Violations (by file)

### Brand Orange `#E07800` — 178 occurrences (should be `var(--brand-primary)`)

Heaviest offenders:
- `Train.svelte` (38), `SkillsJourney.svelte` (36), `TrainTop.svelte` (22)
- `HomeCloser.svelte` (21), `HomeServices.svelte` (21), `WorkDetailPage.svelte` (18)
- `ContactPage.svelte` (17/18), `BlogContent.svelte` (14/17)
- `ServiceDetailPage.svelte` (13), `Manifesto.svelte` (11), `ServiceCard.svelte` (11)
- `WorkCard.svelte` (12), `WorkFilterMobile.svelte` (9), `MetroNetwork.svelte` (9)
- `BlogFilterMobile.svelte` (8/11), `AboutBento.svelte` (7), `ConstructionScene.svelte` (7)

Also: `rgba(224,120,0,...)` pattern — **151 occurrences across 37 files**.

### Brand Accent `#FFB627` — 75 occurrences (should be `var(--brand-accent)`)

### Border `#2a2a2a` — 49 occurrences (should be `var(--border-subtle)`)

Files: AboutBento, BlogCard, BlogFilterSidebar, BlogFilterMobile, BlogListingPage, BlogRow, BlogSvgIcon, CollapsibleSection, ContactPage, FilterGroup, TableOfContents, WorkCard, WorkFilterMobile, WorkDetailSidebar, WorkDetailPage, WorkSvgIcon, blog/[slug]/+page.

### Card BG `#1a1a1a` — 36 occurrences (NO TOKEN EXISTS — need `--bg-card`)

Files: AboutBento (4x), BlogCard, BlogListingPage, BlogFilterMobile, BlogRow, CollapsibleSection, ContactPage (2x), ServiceStation, WorkCard, WorkFilterMobile, WorkDetailSidebar, WorkServiceBadge.

### Deep BG `#141414` — 47 occurrences (should be `var(--bg-primary)`)

Files: BlogFilterMobile, BlogFilterSidebar, BlogSvgIcon, ContactPage, TableOfContents, WorkDetailSidebar, WorkDetailPage, WorkSvgIcon, blog/[slug]+page.

### Strong Border `#333` — 18 occurrences (NO TOKEN EXISTS — need `--border-strong`)

### Light text `#f5f5f0` — 14 occurrences (should be `var(--text-primary)`)

### Muted text `#555` — 14 occurrences (should be `var(--text-secondary)`)

### Warm gray `#C8C6C0` — 9 occurrences (NO TOKEN — evaluate need)

### Terminal red `#ff5f57` — 5+ occurrences (NO TOKEN — need `--status-error`)

### Terminal green `#28c840` — 5+ occurrences (NO TOKEN — need `--status-success`)

### Other grays `#222`, `#1C1C1C`, `#0D0D0D` — scattered (map to existing or new tokens)

---

## 2. Duplicated Brand Patterns (exact locations)

### 2.1 Cursor Glow Overlay (12 files — MOST DUPLICATED)

Pattern: `pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100` with radial-gradient.

Files:
- `AboutIdentity.svelte` (line 30)
- `AboutLogos.svelte` (line 32)
- `AboutMethod.svelte` (line 23)
- `AboutMetrics.svelte` (line 25)
- `AboutPolaroids.svelte` (line 37)
- `AboutTestimonials.svelte` (line 62)
- `AboutWeather.svelte` (line 109)
- `AboutPage.svelte` (line 75)
- `AboutCta.svelte` (line 28, 0.08 opacity variant)
- `BlogRow.svelte`
- `ProjectMiniCard.svelte`
- `WorkCard.svelte`

**Fix:** `<GlowOverlay>` component + enhance `cursorGlow` action to auto-inject overlay.

### 2.2 Hazard Stripes (10+ files, 3 size variants)

Standard (8px):
- `StationDivider.svelte` (line 17)
- `InfraFrame.svelte` (line 192)
- `HeroBanner.svelte`
- `HomeCloser.svelte` (line 736)
- `+error.svelte` (line 108)
- `tech-stack/+page.svelte` (line 919)
- `AboutPage.svelte` (lines 54, 112)

Small (6px):
- `ProofStrip.svelte` (line 36)
- `StationTabs.svelte` (line 63)

Directional variants:
- `Manifesto.svelte` (lines 422, 437 at -45deg; lines 452, 467 at +45deg)
- `+page.svelte` (home, lines 27-60, 90deg variant)

### 2.3 Terminal Chrome (5 implementations)

- `InfraFrame.svelte` — LED + title bar + hazard stripe + status footer
- `HeroSqlPanel.svelte` — Rounded border + bg-terminal + prompt + live dot
- `AboutCta.svelte` — Terminal window with blinking cursor
- `ContactPage.svelte` (2 instances) — Dual terminal layout
- `Manifesto.svelte` — Terminal-style text with cursor

### 2.4 Card Hover Glow (8+ files)

Pattern: `box-shadow: 0 0 16px rgba(224, 120, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3)` + transition.

- `WorkCard.svelte` (line 188)
- `ProjectMiniCard.svelte` (lines 65, 70)
- `InfraFrame.svelte` (lines 83, 88)
- `AboutPage.svelte` (lines 251, 255)
- `ServiceCard.svelte` (lines 197, 206)
- `ServiceDetailPage.svelte` (lines 256, 263)
- `WorkServiceBadge.svelte` (lines 53, 59)
- `StackNode.svelte` (lines 97, 104)
- `StackConfigurator.svelte` (lines 126, 141)
- `StackFilters.svelte` (lines 133, 150)
- `HomeServices.svelte` (line 388)
- `ProofReel.svelte` (line 206)

### 2.5 Status Dot (7 files)

Orange variant:
- `InfraFrame.svelte` (lines 155-161)
- `AboutPage.svelte` (lines 239-245)
- `tech-stack/+page.svelte` (lines 843-851)
- `Manifesto.svelte` (lines 665-676)
- `Footer.svelte` (lines 107-113)

Green variant:
- `HeroSqlPanel.svelte` (lines 71-82)
- `HomeCloser.svelte` (line 625)

### 2.6 Section Labels (12+ files, 3 variants)

**Section variant** (mono + tiny + uppercase + wide tracking + muted):
- WorkCard (lines 122, 152)
- WorkFilterMobile (lines 72, 97, 123)
- BlogFilterSidebar (line 72)
- BlogFilterMobile (lines 55, 82)
- FilterGroup (lines 61, 68)
- AboutBento (lines 59, 73, 84)
- WorkDetailSidebar (lines 67, 92, 114)
- TableOfContents (lines 228, 258)

**Station variant** (mono + tracking-[3px] + brand color):
- StationDivider (line 26)
- GradientSeparator (line 29)
- SkillsJourney (lines 855, 925)
- +error.svelte (line 41)
- AboutIdentity (line 64)

**Metric variant** (mono + tracking-[2px] + muted):
- HeroMetrics (line 27)
- AboutWeather (line 119)
- AboutMetrics (line 59)
- AboutLogos (line 42)
- AboutPage (line 81)
- ContactPage (lines 167, 174)

### 2.7 CTA Button Variants (5+ files)

- Large primary: HeroBanner (line 527) — `rounded-lg bg-brand px-7 py-3.5 font-bold`
- Medium primary: SkillsJourney (line 896) — `rounded-lg bg-#E07800 px-8 py-4 text-lg font-semibold`
- Small primary: AboutCta (line 78) — `rounded-md bg-brand px-5 py-2.5 text-sm font-semibold`
- Ghost: HeroBanner (line 534), Hero (line 40), ContactPage (line 331) — border + hover:border-brand

### 2.8 Tech Tag Pill (8+ files)

- WorkCard (line 166), WorkDetailSidebar (line 75), BlogDetailHeader (line 77), BlogRow (line 129), ProjectCard (lines 35, 43), TagList (line 15), FilterGroup (line 85), ProofReel (line 159)

### 2.9 Dashed Divider (9 occurrences)

- BlogFilterMobile (lines 78, 107, 132)
- BlogFilterSidebar (lines 102, 116)
- WorkFilterMobile (lines 96, 122)
- WorkFilterSidebar (lines 61, 76)

### 2.10 Hidden Scrollbar (5 files)

- ProofStrip (lines 66-69)
- ServiceListingPage (lines 149-151)
- StackFilters (lines 101-106)
- StackScenarioCard (lines 105-109)
- StationTabs (lines 127-130)

### 2.11 Blink Keyframes (3 duplications beyond TerminalCursor)

- Manifesto.svelte (lines 816-819)
- HomeCloser.svelte (lines 711-713)
- ConstructionScene.svelte (lines 133-143)

---

## 3. Token Gap Details

### 3.1 Shadows — 31 unique declarations, 0 tokens

Recurring families:
- **Glow small:** `0 0 6px rgba(224,120,0,0.6)` — Footer, InfraFrame, ServiceListingPage, tech-stack, AboutPage
- **Glow medium:** `0 0 12px rgba(224,120,0,0.4)` — MenuOverlay, BlogListingPage, StackNode
- **Glow large:** `0 0 24px rgba(224,120,0,0.2), 0 0 60px rgba(224,120,0,0.08)` — ServiceCard, ServiceDetailPage
- **Card:** `0 0 16px rgba(224,120,0,0.1), 0 2px 8px rgba(0,0,0,0.3)` — WorkCard, ProjectMiniCard
- **Section:** `0 8px 32px rgba(224,120,0,0.08)` — HomeServices, ProofReel
- **Nav glass:** `0 4px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)` — Nav
- **Status green:** `0 0 6px rgba(40,200,64,0.4)` — HomeCloser, InfraFrame

### 3.2 Z-Index — 14 values, 0 tokens

| Value | Components |
|-------|-----------|
| 0-4 | Local stacking (HomeCloser, Manifesto, InfraFrame, StackDiagram, etc.) |
| 30 | tech-stack page |
| 40-41 | tech-stack page, +layout |
| 45 | +layout (nav rail) |
| 50-51 | tech-stack, StackBottomSheet |
| 60 | MenuOverlay |
| 70 | Nav |

### 3.3 Transitions — 42 declarations, 4 unnamed beziers

Duration spread: 0.15s (8), 0.2s (24), 0.25s (7), 0.3s (12), 0.5s (2).

Unnamed beziers:
- `cubic-bezier(0.34, 1.56, 0.64, 1)` — bounce overshoot (4 uses)
- `cubic-bezier(0, 0, 0.2, 1)` — decelerate (2 uses)
- `cubic-bezier(0.33, 1, 0.68, 1)` — custom out (1 use)
- `cubic-bezier(0.32, 0, 0.67, 0)` — custom in (1 use)

### 3.4 @theme Completeness

**Present:** Brand colors (4), dark palette (4), light palette (4), font families (3), radius (3, misnamed).

**Missing:** Type scale (6 tokens defined but not in @theme), `--radius-sm`, `--radius-pill`, shadows, z-index, transitions, opacity, containers.

**Naming conflict:** tokens.css uses `--radius-sm/md/lg/xl`, @theme uses `--radius-brand/brand-lg/brand-xl`. `rounded-sm` resolves to Tailwind default (2px) not brand (4px). Silent mismatch.

---

## 4. Component Architecture Findings

### 4.1 Components importing from `$lib/data` (16 — must migrate to props)

| Component | Imports |
|-----------|---------|
| `AboutBento` | `aboutContent` |
| `AboutPage` | `aboutPageContent` |
| `BlogFeed` | `getLatestPosts()` |
| `ContactPage` | `contactContent` |
| `FeaturedWork` | `getFeaturedProjects()` |
| `Footer` | `siteMeta`, `menuItems` |
| `HomeCloser` | `closerContent`, `getLatestPosts()`, `siteMeta` |
| `HomeServices` | `getVisibleServices()`, `servicesGridContent` |
| `HeroBanner` | `heroAnimContent`, `heroContent`, `INITIAL_HERO_DATA`, `generateHeroData` |
| `Manifesto` | `manifestoContent` (40+ resolved fields) |
| `MenuOverlay` | `menuItems` |
| `Nav` | `navLinks` |
| `ProofReel` | `proofReelContent`, `getProjectBySlug()` |
| `SkillsJourney` | `skillsJourneyPanels`, `skillsJourneyCta` |
| `StackBottomSheet` | `getTechItemContent`, `getOutgoingRelations`, etc. |
| `StackPanel` | `getOutgoingRelations`, `getIncomingRelations`, etc. |

### 4.2 Components over 200 lines (28 total)

Top 10:
1. `Manifesto.svelte` — 1,021 lines
2. `SkillsJourney.svelte` — 983 lines
3. `HomeCloser.svelte` — 859 lines
4. `HeroBanner.svelte` — 731 lines
5. `StackBottomSheet.svelte` — 522 lines
6. `StackPanel.svelte` — 484 lines
7. `HomeServices.svelte` — 479 lines
8. `ServiceDetailPage.svelte` — 401 lines
9. `TableOfContents.svelte` — 382 lines
10. `WorkListingPage.svelte` — 366 lines

### 4.3 Suppressed A11y Warnings (12 across 6 files)

| File | Suppression | Should Be |
|------|------------|-----------|
| `AboutInterests` | `a11y_click_events_have_key_events`, `a11y_no_static_element_interactions` | Add `role="button"`, `tabindex="0"`, keyboard handlers |
| `BlogSvgIcon` | `a11y_no_static_element_interactions` | Add keyboard support if interactive |
| `HomeServices` | Both click/static suppressions | Add keyboard support to SVG tap targets |
| `MenuOverlay` | `a11y_no_noninteractive_element_interactions` | Properly handle dialog interactions |
| `ProofReel` | Both click/static suppressions | Add `role="button"`, keyboard handlers |
| `StackBottomSheet` | 3 suppressions incl. `a11y_interactive_supports_focus` | Fix focus management |
| `StackDiagram` | Both suppressions | Add keyboard support |
| `WorkSvgIcon` | `a11y_no_static_element_interactions` | Match BlogSvgIcon fix |

### 4.4 Cross-Page Component Pairs (to unify)

| Pair | Similarity | Unify Into |
|------|-----------|------------|
| `WorkFilterMobile` (180 lines) + `BlogFilterMobile` (160 lines) | ~90% structure identical | `FilterMobile` |
| `WorkFilterSidebar` (130 lines) + `BlogFilterSidebar` (120 lines) | ~85% structure identical | `FilterSidebar` |
| `WorkListingPage` (366 lines) + `BlogListingPage` (272 lines) | Same shell (search + filters + grid) | `ListingShell` |
| `BlogSvgIcon` (241 lines) + `WorkSvgIcon` (120 lines) | Same morph + entrance logic | `SvgIcon` |

### 4.5 Prop Mixin Candidates

| Mixin | Props | Used By |
|-------|-------|---------|
| `AccentColorProps` | `accentColor?: string` | 10+ components |
| `MetroStopProps` | `stop?: string; label?: string` | 9 About bento cards |
| `FilterStateProps` | `activeTag, onTagSelect, activeLang, onLangSelect` | 3+ filter components |

---

## 5. Decisions Log

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| D1 | Keep Tailwind v4, enforce strict token discipline | v4's CSS-first @theme is exactly what we need. Problem is bypassing, not the tool. | 2026-04-11 |
| D2 | Split 17a into 3 sub-slices (17a-1, 17a-2, 17a-3) | 411 hex colors (was 192), scope doubled. Keeps PRs reviewable at ~20 files each. | 2026-04-11 |
| D3 | Move GSAP $effect() cleanup from 17a to 17e | It's motion work, not CSS architecture. Keeps 17a focused. | 2026-04-11 |
| D4 | Brand primitives in `src/lib/components/brand/`, shells in `src/lib/components/shared/` | Clear separation: brand = portable reusable visuals, shared = app-specific layout shells. | 2026-04-11 |
| D5 | Utility classes over @apply for simple patterns | `.brand-fade-line`, `.scrollbar-hidden` etc. as CSS classes, not Svelte components. Components for complex multi-element patterns. | 2026-04-11 |
| D6 | Use `color-mix()` for rgba brand color variants | Replaces `rgba(224,120,0,0.1)` with `color-mix(in srgb, var(--brand-primary) 10%, transparent)`. Future-proof, token-connected. | 2026-04-11 |
| D7 | Z-index scale: 0, 1, 30, 40, 50, 60, 70 | Matches current usage. Local stacking (0-4) stays local. Global scale is tokenized. | 2026-04-11 |
| D8 | `cursorGlow` action auto-injects overlay | Eliminates 12 identical markup blocks. Action handles DOM, not consumer. | 2026-04-11 |
| D9 | Home page's bold typography + full-bleed layout becomes the standard for ALL pages | Home page has the right feel: big type, edge-to-edge sections, immersive. Other pages should match. Apply during 17a-3 (style audit) and 17d (shared shells). Success = changing a page header is trivial because the system handles it. | 2026-04-11 |

---

## 6. Checklist for Implementation Sessions

Use this checklist to verify you haven't drifted:

- [ ] Am I using tokens, not hardcoded values?
- [ ] Am I using brand primitives, not reimplementing?
- [ ] Am I using shared shells, not duplicating layout?
- [ ] Am I using utility classes, not repeating CSS patterns?
- [ ] Am I exporting prop interfaces, not inline typing?
- [ ] Am I passing data via props, not importing from $lib/data?
- [ ] Am I using motion factories, not raw GSAP in $effect()?
- [ ] Am I using semantic z-index tokens, not magic numbers?
- [ ] Am I using shadow tokens, not ad-hoc box-shadow?
- [ ] Am I using transition tokens, not arbitrary durations?
- [ ] Have I checked this audit doc for the exact file + line to fix?
- [ ] Does this page match the home page's energy? (Big type, full-bleed sections, immersive feel — Decision D9)
