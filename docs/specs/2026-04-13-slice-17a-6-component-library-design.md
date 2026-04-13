# Slice 17a-6: Component Library Foundation — Design Spec

**Date:** 2026-04-13
**Type:** Planning Session — Component Library + Token Convention + Dead Code
**Status:** Approved
**Scope:** Dead code cleanup, token rename to ecosystem convention, Bits UI + shadcn-svelte integration, component library, end-of-17a sweep
**Branch:** `feature/slice-17a-6-component-library` (from main after PR #8 merge)

---

## 1. Philosophy

We evaluated shadcn-svelte, adopted its conventions and ecosystem alignment, used Bits UI for accessibility, and wrote our own brand layer because our design is unique. The system is simple, compatible, and built to last.

- **Bits UI** = headless a11y engine (npm dependency). Focus traps, keyboard nav, ARIA, scroll lock.
- **shadcn-svelte** = component factory (CLI tool). Scaffolds thin Bits UI wrappers into our source. We own every file.
- **Our tokens** = the look. Ecosystem-standard naming, our brand values.
- **Our brand primitives** = the craft. TerminalChrome, HazardStripe, StopLabel — unique to yesid.dev.

**Constitution compatible:** shadcn-svelte's architecture aligns with every CONSTITUTION.md rule — headless primitives with our tokens, cn() for class composition, data-slot for targeting, barrel exports, typed props with $props(). Adopting shadcn-svelte IS following the constitution.

Case study narrative: "We didn't reinvent the wheel — we used Bits UI for accessibility and adopted the ecosystem's naming convention. But we also didn't settle for a generic look — our brand layer is ours."

---

## 2. Execution Order

Four phases, strictly ordered:

```
Phase 1: Clean House          → Delete dead code (no point touching dead files)
Phase 2: Token Convention     → Rename to ecosystem standard (so new components use correct tokens)
Phase 3: Component Library    → shadcn-svelte init + scaffold + customize + wire existing components
Phase 4: End-of-17a Sweep     → Catch loose ends across all 17a sub-slices
```

**Estimated sessions:** 3-4

### What's NOT in scope (deferred)

| Deferred to | What |
|-------------|------|
| 17d | Full-bleed resize / ScrollTrigger recalc |
| 17d | Per-page typographic decorations (mono annotations, circuit lines, edge labels) |
| 17d | Large file splits (Manifesto 1006, tech-stack 909, HomeCloser 760, HeroBanner 734) |
| 17d | Deduplication (isTouchDevice x3, SvgIcon merge, SHAPES extract) |
| 17d | Semantic HTML gaps (heading hierarchy, `<figure>`, `<time>`) |
| 17e | Motion preset system (ground-up rebuild) |

---

## 3. Phase 1: Dead Code Deletion

| Target | Type | Why dead |
|--------|------|----------|
| `AboutBento.svelte` (+test if exists) | Component | Replaced by individual About* bento cards |
| `BlogCard.svelte` (+test) | Component | Replaced by BlogRow |
| `ProjectCard.svelte` (+test) | Component | Replaced by WorkCard |
| `SectionHeader.svelte` (+test) | Component | Replaced by SectionLabel primitive |
| 6 Three.js/Threlte files | Motion | /preview-only, not used in production site |
| 2 dev preview routes | Routes | `/preview/*` — dev-only, not shipped |
| Scrapped metro line in ServiceListingPage | Dead feature | Scroll-linked metro line never shipped |
| ~22 unused token definitions | CSS | Defined in tokens.css but zero references |

---

## 4. Phase 2: Token Convention Rename

### Naming principles

1. **Full words** — `background` not `bg`, `foreground` not `text`
2. **Role names** — `primary`, `destructive`, not `brand-primary`, `status-error`
3. **Surface/foreground pairs** — `--card` (surface) / `--card-foreground` (text on it)
4. **No type prefix** for semantic tokens — context makes it clear
5. **Scale/utility tokens keep concise prefixes** — `--shadow-*`, `--z-*`, `--duration-*`

### Core semantic tokens (shadcn convention)

| Current | New | Tailwind class |
|---------|-----|---------------|
| `--bg-primary` | `--background` | `bg-background` |
| `--text-primary` | `--foreground` | `text-foreground` |
| `--bg-surface` + `--bg-card` | `--card` | `bg-card` |
| *(new)* | `--card-foreground` | `text-card-foreground` |
| `--bg-elevated` | `--popover` | `bg-popover` |
| *(new)* | `--popover-foreground` | `text-popover-foreground` |
| `--brand-primary` | `--primary` | `bg-primary` / `text-primary` |
| *(new)* | `--primary-foreground` | `text-primary-foreground` |
| `--brand-accent` | `--accent` | `bg-accent` / `text-accent` |
| *(new)* | `--accent-foreground` | `text-accent-foreground` |
| `--text-secondary` | `--secondary-foreground` | `text-secondary-foreground` |
| *(new)* | `--secondary` | `bg-secondary` |
| `--text-muted` | `--muted-foreground` | `text-muted-foreground` |
| *(new)* | `--muted` | `bg-muted` |
| `--status-error` | `--destructive` | `bg-destructive` |
| `--border` | `--border` | `border-border` |
| *(new)* | `--ring` | Focus ring (= primary value) |
| *(new)* | `--input` | Input border (= border value) |

### Our extensions (same convention)

| Current | New | Reasoning |
|---------|-----|-----------|
| `--bg-terminal` | `--terminal` | Drop `bg-` prefix, follow surface convention |
| `--bg-manifesto` | `--manifesto` | Same |
| `--bg-deep` | `--deep` | Same |
| `--text-dim` | `--dim-foreground` | Follow foreground convention |
| `--text-code` | `--code-foreground` | Follow foreground convention |
| `--text-light` | `--light-foreground` | Follow foreground convention |
| `--border-subtle` | `--border-subtle` | Already clean |
| `--border-strong` | `--border-strong` | Already clean |
| `--status-live` | `--live` | Drop prefix, role name |
| `--status-success` | `--success` | Drop prefix, role name |
| `--status-warning` | `--warning` | Drop prefix, role name |
| `--brand-primary-hover` | `--primary-hover` | Drop `brand-` |
| `--brand-accent-hover` | `--accent-hover` | Drop `brand-` |
| `--brand-primary-rgb` | `--primary-rgb` | Drop `brand-` |
| `--brand-accent-rgb` | `--accent-rgb` | Drop `brand-` |
| `--brand-primary-border` | `--primary-border` | Drop `brand-` |

### Tokens that stay as-is (utility/scale tokens)

All `--shadow-*`, `--z-*`, `--duration-*`, `--ease-*`, `--space-*`, `--radius-*`, `--opacity-*`, `--container-*`, `--font-*`, `--text-micro`.

**Addition:** `--radius` alias for `--radius-md` (shadcn components reference this).

### Merges

- `--bg-surface` (#1E1E1E) + `--bg-card` (#1a1a1a) → `--card` (#1a1a1a). Difference imperceptible.

### Migration mechanics

Find-and-replace in three places:
1. `tokens.css` — rename definitions
2. `app.css @theme inline` — update Tailwind mappings
3. ~40 consumer files — `var()` references and Tailwind classes

---

## 5. Phase 3: Component Library

### Installation

```bash
bunx shadcn-svelte@latest init
bunx shadcn-svelte@latest add --all
```

**Full install.** The CLI scaffolds all ~58 components into `src/lib/components/ui/` and installs all underlying dependencies automatically:
- `bits-ui` — headless a11y primitives (Dialog, Collapsible, Tabs, Toggle, Tooltip, Button, etc.)
- `vaul-svelte` — headless drawer/bottom sheet (swipe gestures, snap points)
- `paneforge` — resizable panels (future: bento layouts, dashboard views)
- `formsnap` + `sveltekit-superforms` — accessible forms (future: 17c contact form + Zod schemas)
- `clsx` + `tailwind-merge` — cn() class merging utility

No manual `bun add` needed. The CLI manages the full dependency tree.

We own every scaffolded file. Unused components don't affect the bundle (tree-shaking). We customize the 7 we need now, the rest are available whenever needed — one import away, no future CLI run required.

### Components we actively customize in 17a-6

All 16 extractions happen now. This is a code refactor — the look is locked, we're swapping the plumbing.

**ui/ components we customize with brand styling (13):**

| ui/ component | Library underneath | What we customize |
|--------------|-------------------|------------------|
| dialog | Bits UI | GSAP enter/exit via forceMount, brand border, dark overlay |
| drawer | Vaul Svelte | Brand styling, GSAP slide, content layout |
| sheet | Bits UI (Dialog variant) | Full-screen metro overlay styling |
| collapsible | Bits UI | ChevronToggle, NumberBadge, card styling |
| accordion | Bits UI | Grouped collapsible sections (WorkDetailPage) |
| tabs | Bits UI | Station dots, orange active border, distance opacity |
| carousel | Embla Carousel | Auto-rotate, brand card styling |
| toggle | Bits UI | Tag interactive mode |
| toggle-group | Bits UI | Filter group single-selection |
| tooltip | Bits UI | Terminal-style tooltip, mono font |
| button | Bits UI | Brand primary/ghost, size variants |
| badge | Bits UI | Mono font, brand pill styling (Tag non-interactive + NumberBadge) |
| separator | — | Hazard stripe + gradient variants |
| progress | Bits UI | Reading progress bar |
| scroll-area | Bits UI | Custom scrollbars for panels, sidebars |

**Brand primitives that stay custom (7):**

TerminalChrome, StopLabel, SectionLabel, MetricDisplay, CornerMarks, GlowOverlay, StatusDot — unique to yesid.dev, no library equivalent.

These follow the same conventions (cn(), data-slot, barrel exports) but are hand-built.

**Components available for future use (scaffolded, not customized yet):**

kbd, skeleton, hover-card, pagination, breadcrumb, navigation-menu, popover, select, form, input, checkbox, radio-group, switch, resizable, sidebar, table, and more. Customize at point of use.

### File structure

```
src/lib/components/
├── ui/                          ← shadcn-scaffolded, ALL components, we own it
│   ├── accordion/               ← grouped collapsibles with mutual exclusion
│   ├── badge/                   ← Tag non-interactive + NumberBadge
│   ├── button/                  ← BrandButton replacement
│   ├── card/                    ← CardBase replacement
│   ├── carousel/                ← AboutTestimonials, ProofReel
│   ├── collapsible/             ← CollapsibleSection, FilterGroup, filters
│   ├── dialog/                  ← focus trap, ESC, scroll lock, ARIA
│   ├── drawer/                  ← StackBottomSheet (swipe, snap points)
│   ├── progress/                ← ReadingProgressBar
│   ├── scroll-area/             ← custom scrollbars for panels
│   ├── separator/               ← HazardStripe + GradientSeparator variants
│   ├── sheet/                   ← MenuOverlay (full-screen slide-in)
│   ├── tabs/                    ← StationTabs, AboutTestimonials
│   ├── toggle/                  ← Tag interactive mode
│   ├── toggle-group/            ← FilterGroup button selection
│   ├── tooltip/                 ← terminal-style tooltips
│   ├── ... (remaining ~40 scaffolded but not customized yet)
│   └── index.ts
├── brand/                       ← our 7 unique primitives
│   ├── TerminalChrome.svelte
│   ├── StopLabel.svelte
│   ├── SectionLabel.svelte
│   ├── MetricDisplay.svelte
│   ├── CornerMarks.svelte
│   ├── GlowOverlay.svelte
│   ├── StatusDot.svelte
│   ├── StickyPanel.svelte       ← may use ui/scroll-area internally
│   ├── ChevronToggle.svelte     ← decorative, used inside ui/collapsible
│   └── index.ts
├── MenuOverlay.svelte           ← refactored to use ui/sheet
├── StackBottomSheet.svelte      ← refactored to use ui/drawer
├── CollapsibleSection.svelte    ← refactored to use ui/collapsible
└── ... (page components)
```

### Brand primitive migrations

| Current primitive | Becomes | What happens to the file |
|------------------|---------|------------------------|
| BrandButton | ui/button (customized) | BrandButton.svelte deleted, consumers import from ui/button |
| CardBase | ui/card (customized) | CardBase.svelte deleted, consumers import from ui/card |
| Tag (non-interactive) | ui/badge (customized) | Tag.svelte deleted, consumers import ui/badge or ui/toggle |
| Tag (interactive) | ui/toggle (customized) | Same — Tag splits into badge + toggle |
| NumberBadge | ui/badge variant | NumberBadge.svelte deleted, becomes badge variant |
| HazardStripe | ui/separator variant | HazardStripe.svelte deleted, becomes separator variant |
| GradientSeparator | ui/separator variant | GradientSeparator.svelte deleted, becomes separator variant |

**7 brand primitives migrated → ui/, 7 unique primitives stay in brand/. ChevronToggle stays in brand/ as decorative icon used inside ui/collapsible.**

### Wiring page components to ui/

| Page component | Wires to | What changes |
|---------------|----------|-------------|
| MenuOverlay | **ui/sheet** | Removes manual ESC, scroll lock, focus trap. Sheet = slide-in panel. Keeps CSS transition. |
| StackBottomSheet | **ui/drawer** | Removes manual swipe, backdrop, ARIA. Vaul handles swipe + snap. |
| CollapsibleSection | **ui/collapsible** | Removes manual toggle. Keeps NumberBadge→badge, ChevronToggle, $bindable open. |
| CollapsibleSection (groups) | **ui/accordion** | WorkDetailPage collapsible sections → accordion for group keyboard nav. |
| FilterGroup | **ui/toggle-group** | Removes manual selection state. Toggle group handles single-select + keyboard. |
| BlogFilterMobile | **ui/collapsible** | Removes manual open toggle. |
| WorkFilterMobile | **ui/collapsible** | Same pattern. |
| StationTabs | **ui/tabs** | Gets arrow key nav. Keeps station dots, opacity distance. |
| AboutTestimonials | **ui/carousel** | Auto-rotating cards. Carousel handles dots, keyboard, swipe. |
| TableOfContents | **ui/collapsible** + **ui/scroll-area** | Collapsible gets a11y. Scroll area gets custom scrollbar. |
| ReadingProgressBar | **ui/progress** | Semantic progress element with ARIA. |
| ProofReel | **ui/carousel** | Card carousel with scroll reveal. Carousel handles navigation. |

### a11y fixes (eliminates all 15 svelte-ignore)

| Component (count) | Current issue | Fix |
|-------------------|--------------|-----|
| MenuOverlay (1) | `div` noninteractive backdrop | ui/dialog overlay handles it |
| StackBottomSheet (2) | `div onclick` backdrop + sheet | ui/dialog handles both |
| tech-stack (3) | `div onclick` for backdrop + nodes | Backdrop → ui/dialog, nodes → `<button>` |
| HomeServices (2) | `div onclick` for service cards | → `<button>` |
| ProofReel (2) | `div onclick` for image tap | → `<button>` |
| StackDiagram (1) | `div onclick` for nodes | → `<button>` |
| AboutInterests (2) | `div onclick` for interest tags | → `<button>` |
| BlogSvgIcon (1) | `div` noninteractive hover trigger | → `<button>` or remove |
| WorkSvgIcon (1) | Same | Same |

**Result: 0 svelte-ignore a11y comments.**

### BrandButton enhancement

- Add `type="button"` default (prevent accidental form submission)
- Add `disabled` prop + disabled styling
- May wrap ui/button underneath for consistency, or stay standalone (implementation decision)

### Tag enhancement

- When `interactive=true`, wrap content in ui/toggle for keyboard support (aria-pressed, Enter/Space)
- When `interactive=false`, stays as `<span>` (no change)

---

## 6. Phase 4: End-of-17a Sweep

Final pass across all 17a sub-slices (17a-1 through 17a-6):

| Check | What to verify |
|-------|---------------|
| Zero hardcoded colors | No raw hex in .svelte CSS/Tailwind |
| Zero old token names | No `--bg-primary`, `--brand-primary`, etc. remaining |
| Zero svelte-ignore a11y | Confirmed 0 site-wide |
| Zero arbitrary Tailwind | No `p-[22px]`, `text-[11px]` etc. |
| All brand/ primitives | Have `class` + `...rest`, `cn()`, consistent pattern |
| All ui/ components | Have `data-slot`, barrel exports, typed props |
| CONSTITUTION.md | Updated with Bits UI patterns, shadcn conventions, new token names, ui/ structure |
| CSS.md | Full token inventory with new names |
| Tests | `bun run test` + `bun run check` green |

---

## 7. Acceptance Criteria

1. **Dead code:** 0 dead components, 0 dead routes, 0 unused tokens
2. **Tokens:** All semantic tokens follow ecosystem convention (full words, surface/foreground pairs)
3. **Dependencies:** shadcn-svelte initialized (full install), all underlying deps (bits-ui, vaul-svelte, paneforge, formsnap, clsx, tailwind-merge) installed via CLI
4. **ui/ library:** 15 components actively customized with brand styling (dialog, drawer, sheet, collapsible, accordion, tabs, carousel, toggle, toggle-group, tooltip, button, badge, separator, progress, scroll-area)
5. **Brand migrations:** 7 brand primitives migrated to ui/ (BrandButton→button, CardBase→card, Tag→badge+toggle, NumberBadge→badge, HazardStripe→separator, GradientSeparator→separator)
6. **Wiring:** 12 page components refactored to use ui/ wrappers
7. **a11y:** 0 `svelte-ignore a11y_*` comments in codebase
8. **Brand primitives:** 7 unique primitives remain in brand/ (TerminalChrome, StopLabel, SectionLabel, MetricDisplay, CornerMarks, GlowOverlay, StatusDot) + ChevronToggle as decorative icon
9. **Docs:** CONSTITUTION.md + CSS.md updated with new conventions
10. **Tests:** `bun run test` + `bun run check` pass
11. **Visual parity:** Site looks identical — all changes under the hood

---

## 8. Session Estimates

| Session | Work |
|---------|------|
| 1 | Dead code deletion + token rename (mechanical, high file count) |
| 2 | shadcn init (full install) + customize 15 ui/ components with brand styling |
| 3 | Migrate 7 brand primitives to ui/ + wire 12 page components to ui/ wrappers |
| 4 | Fix all svelte-ignore + end-of-17a sweep + docs update |

This is a code refactor, not a redesign — visual output stays identical. Each extraction is mechanical. Could compress to 3 if sessions 3+4 merge. 17d handles look/feel changes and other refactors.

---

## 9. Library Evaluation (for reference)

### Research findings

**Bits UI:**
- Truly headless — zero CSS, zero tokens, zero opinions
- Exposes `data-*` attributes for styling (data-state, data-disabled)
- Svelte 5 native ($props, $bindable, child snippet pattern)
- forceMount + child snippet gives full GSAP animation control
- Handles: focus trapping, keyboard nav, ARIA, scroll lock, portal
- Install: `bun add bits-ui` — no peer deps beyond Svelte 5
- Tree-shakeable individual imports

**shadcn-svelte:**
- "This is not a component library. It is how you build your component library."
- CLI scaffolds Bits UI wrappers into your project — you own the code
- 33 CSS custom properties following background/foreground convention
- Uses Tailwind v4 `@theme inline` for token → utility mapping
- cn() utility (clsx + tailwind-merge) for class composition
- 58 components available, built on Bits UI
- `components.json` config for future `add` commands

### Why this approach

| Evaluated | Decision | Reason |
|-----------|----------|--------|
| shadcn-svelte | **FULL INSTALL** (CLI + all components) | Scaffolds our component library, we own every file, full toolkit available |
| Bits UI | **ADOPT** (via shadcn) | Headless a11y — zero conflicts, GSAP compatible via forceMount |
| Vaul Svelte | **ADOPT** (via shadcn drawer) | Headless drawer — replaces hand-rolled StackBottomSheet swipe/snap |
| Paneforge | **ADOPT** (via shadcn resizable) | Resizable panels — future bento layouts, dashboard views |
| Formsnap | **ADOPT** (via shadcn form) | Accessible forms — future 17c contact form + Zod integration |
| shadcn token convention | **ADOPT** (rename our tokens) | Ecosystem standard, cleaner names, library compatible |
| Skeleton | REJECT | Invasive globals, 200+ competing tokens |
| Flowbite Svelte | REJECT | JS theming, Svelte transition lock-in |

### Component audit summary

- **12 page components** wired to ui/ wrappers (MenuOverlay→sheet, StackBottomSheet→drawer, CollapsibleSection→collapsible, CollapsibleSection groups→accordion, FilterGroup→toggle-group, BlogFilterMobile→collapsible, WorkFilterMobile→collapsible, StationTabs→tabs, AboutTestimonials→carousel, TableOfContents→collapsible+scroll-area, ReadingProgressBar→progress, ProofReel→carousel)
- **7 brand primitives** migrated to ui/ (BrandButton→button, CardBase→card, Tag→badge+toggle, NumberBadge→badge, HazardStripe→separator, GradientSeparator→separator)
- **15 ui/ components** actively customized with brand styling
- **8 brand primitives** remain in brand/ (TerminalChrome, StopLabel, SectionLabel, MetricDisplay, CornerMarks, GlowOverlay, StatusDot, ChevronToggle)
- **6 components** kept as custom, onclick → button fix only (HomeServices, ProofReel, StackDiagram, AboutInterests, BlogSvgIcon, WorkSvgIcon)
- **~40 ui/ components** scaffolded but not yet customized — available for future use

---

## 10. Key Decisions

| ID | Decision | Reasoning |
|----|----------|-----------|
| D53 | Adopt shadcn-compatible token naming as ecosystem standard | Future library compatibility, cleaner names, industry practice |
| D54 | Use shadcn-svelte CLI to scaffold ui/ components | "How you build your component library" — scaffolds boilerplate, we own the code |
| D55 | Bits UI as headless a11y dependency | Zero styling conflicts, forceMount for GSAP, WAI-ARIA compliant |
| D56 | Full token rename, not alias bridge | One naming system, not two. User preference: "rename our tokens instead of building a system around" |
| D57 | Merge --bg-surface + --bg-card into --card | Imperceptible difference (6 hex units), follows convention |
| D58 | cn() utility adopted project-wide | Industry standard class merging, required by scaffolded components |
| D59 | Dead code deletion moved from 17a-4 into 17a-6 | Avoid double work — delete before wiring |
| D60 | Full-bleed resize + typographic deco deferred to 17d | Natural fit with per-page component work |
| D61 | Our extensions follow same naming convention | --terminal not --bg-terminal, --dim-foreground not --text-dim |
