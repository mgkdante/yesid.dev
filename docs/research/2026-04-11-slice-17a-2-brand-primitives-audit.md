# Slice 17a-2 — Brand Primitives Research Audit

**Date:** 2026-04-11
**Purpose:** Comprehensive codebase audit to identify all repeating UI patterns, gaps, and missed opportunities before building the brand primitive system. Every finding here informs the 17a-2 implementation plan.

---

## 1. Button & CTA Audit

### 13 Distinct Visual Groups Found

| Group | Description | Occurrences | Key files |
|-------|-------------|-------------|-----------|
| **Primary filled** | Orange bg, dark/white text | 7 | HeroBanner, Hero, AboutCta, ContactPage, SkillsJourney (x2), tech-stack |
| **Ghost/outline** | Transparent bg, border, brand hover | 4 | HeroBanner, Hero, tech-stack, ContactPage |
| **Gradient glow** | Gradient fill + heavy glow, mono font | 1 | HeroBanner refresh |
| **Icon-only circular** | Round, ghost border, icon centered | 2 | AboutPolaroids prev/next |
| **Icon-only square** | Square close (X) button | 3 | StackBottomSheet, StackPanel, tech-stack |
| **FAB** | Floating action button, circular, glow | 1 | tech-stack build |
| **Dot indicator** | Tiny dots for pagination | 1 | AboutTestimonials |
| **Filter pill** | Pill toggle, multi-select | 9+ | StackFilters, FilterGroup, BlogFilterMobile, WorkFilterMobile, StackConfigurator |
| **Collapsible toggle** | Full-width accordion header | 5 | CollapsibleSection, FilterGroup, BlogFilterSidebar, TableOfContents (x2) |
| **Link-styled CTA** | Text with hover underline/color | 12+ | Footer, Nav, BlogDetailHeader, WorkDetailPage, ServiceCard, etc. |
| **Nav prev/next** | Prev/Next sequential nav | 2 | ServiceNav, StackBottomSheet |
| **Interactive node** | Selectable tech node | 1 | StackNode |
| **Text link button** | Plain text, brand-colored, no border | 3 | StackBottomSheet, StackPanel, TableOfContents |

### Inconsistencies in Primary Buttons

- **Text color:** `text-[#141414]` vs `text-white` (no standard)
- **Border radius:** `rounded-lg` vs `rounded-md` vs `rounded` vs CSS `var(--radius-md)`
- **Padding:** ranges from `px-5 py-2.5` (sm) to `px-10 py-5` (xl)
- **Shadow:** Some use `shadow-lg`, some hardcoded `box-shadow`, some none
- **Hover:** Some `hover:bg-*-hover`, some `hover:bg-[#C96A00]`, some add lift (`-translate-y-0.5`)
- **Color source:** Some `var(--brand-primary)`, others hardcode `#E07800`

### Recommended BrandButton API

```
variant: 'primary' | 'ghost'
size: 'sm' | 'md' | 'lg'
href?: string (renders <a> if set, <button> if not)
```

5 practical sizes found: xs (`px-2 py-0.5`), sm (`px-5 py-2.5`), md (`px-6 py-3`), lg (`px-8 py-4`), xl (`px-10 py-5`). Recommend collapsing to 3 (sm/md/lg) for the primitive.

---

## 2. Tab, Toggle, & Navigation Audit

### Patterns Found

| Pattern | File | Layout | Active state | ARIA |
|---------|------|--------|-------------|------|
| StationTabs | StationTabs.svelte | Horizontal scroll | Orange underline + bright text | No tablist/tab roles |
| Testimonial dots | AboutTestimonials.svelte | Horizontal dots | `bg-[var(--brand-primary)]` | Proper `role="tablist"` |
| FilterGroup | FilterGroup.svelte | Vertical list | Full fill (All) or tinted border (items) | None |
| BlogFilterMobile | BlogFilterMobile.svelte | Horizontal wrap | Duplicates FilterGroup styling | None |
| WorkFilterMobile | WorkFilterMobile.svelte | Horizontal wrap | Same as BlogFilter but hardcoded hex | None |
| StackFilters | StackFilters.svelte | Horizontal pills | Brand tint bg + glow | `role="toolbar"` + `aria-pressed` |
| StackConfigurator | StackConfigurator.svelte | Grid cards | Brand border + tint, disabled state | `aria-pressed` |
| TableOfContents | TableOfContents.svelte | Vertical, 3 modes | Orange left border + text | `aria-expanded` on mobile |
| CollapsibleSection | CollapsibleSection.svelte | Vertical card | Chevron rotation | `aria-expanded` |

### Key Findings

1. **BlogFilterMobile + WorkFilterMobile duplicate FilterGroup** — ~150 lines of duplicated styling with separate `.m-active` / `.m-tag-active` classes. Should reuse FilterGroup with a horizontal layout prop.
2. **StationTabs lacks ARIA** — Only AboutTestimonials uses proper `role="tablist"` / `role="tab"` / `aria-selected`.
3. **Active-state color inconsistency** — `var(--accent)` vs `var(--brand-primary)` vs hardcoded `#E07800` across different toggle components.

---

## 3. Form, Input, & Micro-Pattern Audit

### New Primitive Candidates (not in original spec)

| # | Pattern | Occurrences | Files | Recommendation |
|---|---------|-------------|-------|----------------|
| 1 | **MetricDisplay** (big number + label) | 6 | HeroMetrics, AboutMetrics, tech-stack, HomeServices, ProofReel, InfraFrame | **Extract** — high variance, brand-defining |
| 2 | **StopLabel** (STOP XX — LABEL + pulsing dot) | 10 | All About bento cards | **Extract** — already has global CSS, needs proper component |
| 3 | **ChevronToggle** (rotatable expand arrow) | 8+ | CollapsibleSection, FilterGroup, BlogFilterSidebar, TableOfContents | **Extract** — 4 different implementations (SVG + Unicode) |
| 4 | **CornerMarks** (blueprint corner ticks) | 8 marks / 2 files | InfraFrame, HomeServices | **Extract** — brand-defining engineering aesthetic |
| 5 | **ProseContent** (markdown styling) | ~160 dup lines | BlogContent, WorkDetailPage | **Extract as utility** — `.prose-dark` base class |
| 6 | **SectionDivider** (line—label—line) | 3+ | tech-stack, Manifesto, HeroBanner | Moderate — some overlap with GradientSeparator |
| 7 | **RefLabel** (engineering micro-annotation) | 3+ | HomeServices, Manifesto | Low priority — highly contextual |
| 8 | **SearchInput** (mono input + icon) | 4 | BlogListingPage, ContactPage | Low — defer to 17d |
| 9 | **BottomSheet/Overlay** | 3 | StackBottomSheet, tech-stack | Low — each is structurally different |
| 10 | **MonoDateStamp** | 6 | BlogCard, BlogRow, Footer, HeroBanner | Low — simple text styling |

### Existing Patterns Confirmed (in spec, verified by audit)

| Pattern | Spec count | Actual count | Notes |
|---------|-----------|--------------|-------|
| Cursor glow overlay | 12 | 12 | Exact match — all in About cards + BlogRow + WorkCard |
| Hazard stripes | 10+ | 11+ across 8 files | 3 size variants (6/8/12px), 3 angle variants |
| Terminal chrome | 5 | 4 distinct + InfraFrame | ContactPage (x2), AboutCta, HomeCloser |
| Card hover glow | 8+ | 12+ | More than expected — WorkCard, StackNode, StackConfigurator, StackFilters too |
| Status dot | 7 | 8+ | Plus 4 separate pulse keyframe definitions |
| Section labels | 12+ | 25+ | The most pervasive micro-pattern — mono uppercase tracking |
| Tech tag pills | 8+ | 5-9 depending on boundary | ServiceCard, ProofReel, WorkCard, BlogRow, TagList |
| Dashed dividers | 9 | 9 | Confirmed across 4 filter files |
| Hidden scrollbar | 5 | 5 | Confirmed |
| Blink keyframes | 3 duplicates | 3 | Manifesto, HomeCloser, ConstructionScene |

---

## 4. Visual & Decorative Pattern Audit

### Hazard Stripe Details

| File | Angle | Size | Dark color |
|------|-------|------|-----------|
| StationDivider | -45deg | 8px | #141414 |
| StationTabs | -45deg | 6px | #141414 |
| ProofStrip | -45deg | 6px | #141414 |
| InfraFrame | -45deg | 8px | transparent |
| AboutPage (x2) | -45deg | 8px | #141414 |
| Manifesto (x4) | -45/+45deg | 12/7px | #0f0d0a |
| +page.svelte (home) | 90deg | 12px | #141414 |
| +error.svelte | -45deg | 8px | #141414 |
| tech-stack | -45deg | 8px | #141414 |

**Recommended HazardStripe API:** `size: 'sm' | 'md' | 'lg'` (6/8/12px), `angle?: number` (default -45), `label?: string`.

### Bento Card Pattern

12 usages across all About cards use: `group bento-card relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3`. The CSS class `.bento-card` exists globally in AboutPage but the Tailwind classes are copy-pasted.

### LED/Pulse Dot Keyframes

4 separate `@keyframes` definitions for the same pulsing LED effect:
- `frame-led-pulse` (InfraFrame)
- `hero-led-pulse` (tech-stack)
- `stop-pulse` (AboutPage)
- `pulse` (Manifesto)

All follow the same 0%/50%/100% pattern with opacity and box-shadow oscillation.

---

## 5. Component Architecture Findings

### Current State

- **60 components** in a single flat directory (`src/lib/components/`)
- **No `brand/` or `shared/` directories** exist yet
- **Only 4 components** export named `interface Props` — rest use inline destructuring
- **48 of 60** components contain hardcoded hex colors
- **8 components** are completely unused (1,354 lines of dead code)

### Dead Components

| Component | Lines | Notes |
|-----------|-------|-------|
| BlogFeed | 34 | Superseded by BlogListingPage |
| FeaturedWork | 34 | Superseded by ProofReel |
| Hero | 48 | Superseded by HeroBanner |
| ProjectGrid | 29 | Unused |
| ScrollPrompt | 33 | Unused |
| ServiceStation | 163 | ServiceDetailPage has own layout |
| SkillsJourney | 983 | Fully unused — biggest dead code |
| StationDivider | 30 | Unused |

### Component Size Distribution

- 1000+ lines: Manifesto (1021)
- 700-999: SkillsJourney (983, dead), HomeCloser (859), HeroBanner (731)
- 400-600: StackBottomSheet (522), StackPanel (484), HomeServices (479)
- 200-400: ServiceDetailPage (401), TableOfContents (382), WorkListingPage (366), etc.
- Under 200: 38 components (63%)

### Components Importing from $lib/data (16)

These need migration to props-based architecture (scope of 17b, not 17a-2):
AboutBento, AboutPage, BlogFeed, ContactPage, FeaturedWork, Footer, HomeCloser, HomeServices, HeroBanner, Manifesto, MenuOverlay, Nav, ProofReel, SkillsJourney, StackBottomSheet, StackPanel

---

## 6. Design System Foundation State

### tokens.css (152 lines)

**Well-structured:** `:root` primitives → `[data-theme="dark"]` semantics → `[data-theme="light"]` semantics → media query fallbacks.

**Semantic tokens defined (17 per theme):**
- Backgrounds: `--bg-primary`, `--bg-surface`, `--bg-elevated`, `--bg-manifesto`, `--bg-terminal`, `--bg-card`, `--bg-deep`
- Borders: `--border`, `--border-subtle`, `--border-strong`
- Text: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-dim`, `--text-code`
- Status: `--status-live`, `--status-error`, `--status-success`

**Theme-invariant on `:root`:**
- Brand colors (4), fonts (3), shadows (7 via color-mix), z-index (7), transitions (6), opacity (4), containers (3), radius (5)

### app.css @theme (135 lines)

**In @theme:** Brand colors (4), dark palette (4), light palette (4), fonts (3), type scale (10), radius (5), shadows (7), z-index (7), containers (3), terminal colors (4).

**Utility classes:** Only `.circuit-grid`.

### Critical Gaps

1. **No RGB channel tokens** — `--brand-primary-rgb: 224 120 0` missing. Forces `rgba(224,120,0,...)` everywhere needing variable opacity.
2. **No `--text-micro` token** — 10-11px chrome text (7+ usages) has no type scale entry.
3. **No semantic accent surface tokens** — No `--bg-accent`, `--text-on-accent`, `--border-accent`.
4. **Shadow self-references in @theme** — `--shadow-glow-sm: var(--shadow-glow-sm)` is fragile.
5. **4x duplication of theme tokens** — Same values in `[data-theme]` selectors AND `@media (prefers-color-scheme)` blocks.

### cursorGlow Action (57 lines)

Sets `--glow-x` / `--glow-y` CSS custom properties on pointermove. Disabled on touch and reduced-motion. **Does not inject any DOM** — consumer must manually create the overlay div. Auto-injection would require:
- Creating a child `<div>` with `position: absolute; inset: 0; pointer-events: none; border-radius: inherit`
- Setting radial-gradient using `--glow-x`/`--glow-y` and brand token
- Using `radius`/`intensity` params (currently informational-only)
- Cleanup in `destroy()`

---

## 7. Cohesion Analysis

### Border Radius — 15 distinct values, 5 tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | ~6 places |
| `--radius-md` | 8px | ~3 places |
| `--radius-lg` | 12px | ~40+ places (dominant) |
| `--radius-xl` | 16px | ~8 places |
| `--radius-pill` | 9999px | ~20+ places |

**Outliers to normalize:** `3px`, `6px`, `10px`, `20px`, `1.25rem` in CSS blocks. `rounded-[10px]` → `rounded-lg`. `1.25rem` → `--radius-xl`.

### Font Sizes — 20+ distinct values, 10 tokens

Well-tokenized components: About* bento cards, BlogRow, TagList, WorkCard.
Worst offenders: Manifesto (16 hardcoded), HomeCloser (10), InfraFrame (4).
**Gap:** No token for the recurring 10px annotation pattern → add `--text-micro`.

### Transitions — 7 durations, 6 easings

Tokens defined but almost never referenced via `var(--duration-*)`. Components use literal `0.2s`, `0.3s` instead. Functional consistency is good (values match tokens), just not connected.

### Border Colors — 12 distinct values

- `border-[#2a2a2a]` — **~40+ places** (IS `--border-subtle`, but hardcoded)
- `border-[#333]` — ~10 places (IS `--border-strong`, but hardcoded)
- Various brand/status colors hardcoded instead of using tokens

### Background Colors — 15 distinct values

- `bg-[#1a1a1a]` — **~20+ places** (IS `--bg-card`, but hardcoded)
- `bg-[#141414]` — **~15+ places** (IS `--bg-primary`, but hardcoded)
- `bg-[#E07800]` — ~10 places (IS `--brand-primary`, but hardcoded)

**Note:** Color replacement is 17a-3 scope, not 17a-2. But primitives built in 17a-2 must USE tokens from day one.

---

## 8. Decisions for 17a-2

| # | Decision | Rationale |
|---|----------|-----------|
| D13 | Split 17a-2 into 17a-2a (build) and 17a-2b (wire) | Building primitives and wiring them into 40+ files are different risk profiles |
| D14 | Add 3 new primitives: MetricDisplay, StopLabel, ChevronToggle | Research found 6, 10, and 8+ usages respectively |
| D15 | Add CornerMarks primitive | Brand-defining blueprint aesthetic, 2 files / 8 marks |
| D16 | Add 3 new utility classes: .prose-dark, .led-pulse, .bento-card | Research found ~160 dup lines, 4 dup keyframes, 12 dup card wrappers |
| D17 | Add --brand-primary-rgb and --brand-accent-rgb channel tokens | Unlocks `rgba()` usage via tokens instead of hardcoded hex |
| D18 | Add --text-micro (10px) to type scale | 7+ usages of 10-11px chrome text with no token |
| D19 | Remove 8 dead components before building | 1,354 lines of clutter (SkillsJourney alone is 983 lines) |
| D20 | BrandButton uses 3 sizes (sm/md/lg) not 5 | Research found 5 sizes in practice but xs and xl are edge cases |
| D21 | Primary button text is always `text-[var(--bg-primary)]` (dark on orange) | Resolves the `text-[#141414]` vs `text-white` inconsistency |

---

## 9. Final Primitive Inventory (15 components)

| # | Component | Replaces | Props | Complexity |
|---|-----------|----------|-------|-----------|
| 1 | StatusDot | 8+ pulsing dots | `color: 'orange' \| 'green'`, `pulse?: boolean`, `size?: 'sm' \| 'md'` | Simple |
| 2 | SectionLabel | 25+ label patterns | `text`, `variant: 'section' \| 'station' \| 'metric'`, `align?` | Simple |
| 3 | StopLabel | 10 About bento stops | `stop: string`, `label: string` | Simple |
| 4 | Tag | 8+ pill implementations | `text`, `size?: 'xs' \| 'sm'`, `active?`, `accentColor?` | Simple |
| 5 | NumberBadge | 3 numbered circles | `value: number`, `color?` | Simple |
| 6 | ChevronToggle | 8+ expand arrows | `open: boolean`, `size?: 'sm' \| 'md'` | Simple |
| 7 | HazardStripe | 11+ stripe implementations | `size?: 'sm' \| 'md' \| 'lg'`, `angle?`, `label?` | Medium |
| 8 | GlowOverlay | 12 manual overlay divs | `intensity?: number` | Medium |
| 9 | MetricDisplay | 6 stat combos | `value: string`, `label: string`, `sublabel?`, `size?` | Medium |
| 10 | BrandButton | 7+ CTA styles | `variant: 'primary' \| 'ghost'`, `size: 'sm' \| 'md' \| 'lg'`, `href?` | Complex |
| 11 | CardBase | 12+ card patterns | `hover?`, `glow?`, `interactive?`, `children` | Medium |
| 12 | CornerMarks | 8 blueprint ticks | `size?: 'sm' \| 'md'`, `opacity?` | Simple |
| 13 | TerminalChrome | 5 terminal implementations | `title`, `tag?`, `status?`, `footer?`, `children` | Complex |
| 14 | StickyPanel | 4 sticky sidebars | `children` | Simple |
| 15 | GradientSeparator | Exists, needs token fix | `label?`, `maxWidth?` | Simple (fix) |

Plus: TerminalCursor (exists, enforce usage — remove 3 duplicate blink keyframes)

## 10. Utility Class Inventory (12 classes)

| # | Class | Replaces | Definition |
|---|-------|----------|------------|
| 1 | `.brand-fade-line` | 5 gradient separator patterns | `background: linear-gradient(90deg, var(--brand-primary), transparent)` |
| 2 | `.divider-dashed` | 9 dashed border patterns | `border-top: 1px dashed var(--border-strong)` |
| 3 | `.scrollbar-hidden` | 5 hidden scrollbar patterns | `scrollbar-width: none` + webkit hide |
| 4 | `.brand-glow-hover` | 12+ hover shadow patterns | Shadow token + transition bundle |
| 5 | `.img-desat` | 3 grayscale patterns | `filter: grayscale(1) brightness(0.4)` with transition |
| 6 | `.grid-responsive-cards` | 3 responsive grid patterns | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| 7 | `.label-section` | 12+ section labels | `font-mono text-caption uppercase tracking-widest text-muted` |
| 8 | `.label-station` | 6 station labels | `font-mono text-small tracking-[3px] text-brand-primary` |
| 9 | `.label-metric` | 6 metric labels | `font-mono text-caption tracking-[2px] text-muted` |
| 10 | `.prose-dark` | ~160 dup lines of markdown styling | Shared base for BlogContent + WorkDetailPage |
| 11 | `.led-pulse` | 4 separate @keyframes | Single animation + class for pulsing LED |
| 12 | `.bento-card` | 12 copy-pasted card wrappers | Full bento card bundle (border, bg, radius, overflow, group) |

## 11. Global Keyframes (in app.css)

| Keyframe | Currently duplicated in | After |
|----------|------------------------|-------|
| `@keyframes blink` | Manifesto, HomeCloser, ConstructionScene (+ TerminalCursor) | One definition in app.css |
| `@keyframes pulse-glow` | InfraFrame, AboutPage, tech-stack, Manifesto, Footer, HeroSqlPanel | One definition with CSS variable for color |
