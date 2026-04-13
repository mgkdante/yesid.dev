# Slice 17a-6: Component Library Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor yesid.dev's component architecture to use shadcn-svelte + Bits UI, adopt ecosystem token naming, delete dead code, and eliminate all a11y suppressions — while keeping the visual output identical.

**Architecture:** shadcn-svelte scaffolds all ~58 ui/ components (full install). We customize 15 with brand styling + GSAP integration. 7 brand primitives migrate from brand/ to ui/. 12 page components rewire to use ui/ wrappers. 8 unique brand primitives remain hand-built. Token naming adopts the shadcn ecosystem convention (background/foreground pairs, full words).

**Tech Stack:** SvelteKit 2, Svelte 5, Tailwind v4, Bits UI (via shadcn), Vaul Svelte (via shadcn), shadcn-svelte CLI, GSAP, Bun

**Design spec:** `docs/specs/2026-04-13-slice-17a-6-component-library-design.md`
**Constitution:** `docs/reference/CONSTITUTION.md`
**Branch:** `feature/slice-17a-6-component-library` (from main after PR #8 merge)

---

## Session 1: Dead Code + Token Rename

### Task 1: Create branch + verify clean state

**Files:** None created

- [ ] **Step 1: Create branch from main**

```bash
git checkout main && git pull origin main
git checkout -b feature/slice-17a-6-component-library
```

- [ ] **Step 2: Verify clean build**

```bash
bun run check && bun run test
```
Expected: all pass.

- [ ] **Step 3: Commit branch creation**

No commit needed — empty branch.

---

### Task 2: Delete dead components

**Files:**
- Delete: `src/lib/components/AboutBento.svelte`
- Delete: `src/lib/components/BlogCard.svelte`
- Delete: `src/lib/components/ProjectCard.svelte` (+ `ProjectCard.test.ts`)
- Delete: `src/lib/components/SectionHeader.svelte` (+ `SectionHeader.test.ts`)

- [ ] **Step 1: Verify no live imports of dead components**

```bash
# Search for imports of each dead component — should only appear in test files or dead code
grep -r "AboutBento\|BlogCard\b\|SectionHeader" src/ --include="*.svelte" --include="*.ts" -l
```
Expected: Only test files and the components themselves. If any live imports exist, do NOT delete — document in devlog.

- [ ] **Step 2: Delete dead component files**

```bash
rm src/lib/components/AboutBento.svelte
rm src/lib/components/BlogCard.svelte
rm src/lib/components/ProjectCard.svelte src/lib/components/ProjectCard.test.ts
rm src/lib/components/SectionHeader.svelte src/lib/components/SectionHeader.test.ts
```

- [ ] **Step 3: Verify build**

```bash
bun run check
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore(slice-17a-6): delete dead components — AboutBento, BlogCard, ProjectCard, SectionHeader"
```

---

### Task 3: Delete dead Three.js/Threlte files + preview routes

**Files:**
- Delete: 6 Three.js/Threlte files (identify via `src/lib/motion/three/` and unused Threlte imports)
- Delete: 2 preview routes (`src/routes/preview/`)

- [ ] **Step 1: Identify dead Three.js files**

```bash
ls src/lib/motion/three/
ls src/routes/preview/ 2>/dev/null || echo "no preview routes"
```

Only delete files NOT imported by any live route. Verify each with grep before deleting.

- [ ] **Step 2: Delete confirmed dead files**

Delete each file confirmed as dead. Do NOT delete files used by live routes.

- [ ] **Step 3: Delete preview routes**

```bash
rm -rf src/routes/preview/
```

- [ ] **Step 4: Verify build**

```bash
bun run check
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore(slice-17a-6): delete dead Three.js files + preview routes"
```

---

### Task 4: Delete scrapped metro line + unused tokens

**Files:**
- Modify: `src/lib/components/ServiceListingPage.svelte` (remove scrapped metro line code)
- Modify: `src/lib/styles/tokens.css` (remove unused token definitions)

- [ ] **Step 1: Remove scrapped metro line from ServiceListingPage**

Read ServiceListingPage.svelte, identify scroll-linked metro line code (should be commented or dead), remove it.

- [ ] **Step 2: Identify unused token definitions in tokens.css**

For each token defined in tokens.css, grep for usage across src/. Tokens with zero references outside tokens.css itself are candidates for deletion.

- [ ] **Step 3: Delete confirmed unused tokens**

Remove from tokens.css and corresponding @theme entries in app.css.

- [ ] **Step 4: Verify build**

```bash
bun run check && bun run test
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore(slice-17a-6): remove scrapped metro line + unused token definitions"
```

---

### Task 5: Token rename — tokens.css (source of truth)

**Files:**
- Modify: `src/lib/styles/tokens.css`

This is the single source of truth. Rename all token DEFINITIONS to ecosystem convention.

- [ ] **Step 1: Rename :root brand tokens**

```css
/* Before → After */
--brand-primary: #E07800;         → --primary: #E07800;
--brand-accent: #FFB627;          → --accent: #FFB627;
--brand-primary-hover: #C96A00;   → --primary-hover: #C96A00;
--brand-accent-hover: #E5A220;    → --accent-hover: #E5A220;
--brand-primary-rgb: 224 120 0;   → --primary-rgb: 224 120 0;
--brand-accent-rgb: 255 182 39;   → --accent-rgb: 255 182 39;
```

- [ ] **Step 2: Rename dark theme tokens**

In `[data-theme="dark"]`, `.theme-dark`, and `@media (prefers-color-scheme: dark)`:

```css
--bg-primary: #141414;            → --background: #141414;
--bg-surface: #1E1E1E;            → --muted: #1E1E1E; (also serves as secondary surface)
--bg-elevated: #2A2A2A;           → --popover: #2A2A2A;
--bg-card: #1a1a1a;               → --card: #1a1a1a;
--text-primary: #F5F5F0;          → --foreground: #F5F5F0;
--text-secondary: #999999;        → --secondary-foreground: #999999;
--text-muted: #666666;            → --muted-foreground: #666666;
--text-dim: #4a4a4a;              → --dim-foreground: #4a4a4a;
--text-code: #cccccc;             → --code-foreground: #cccccc;
--text-light: #cccccc;            → --light-foreground: #cccccc;
--bg-terminal: #0a0a0a;           → --terminal: #0a0a0a;
--bg-manifesto: #0f0d0a;          → --manifesto: #0f0d0a;
--bg-deep: #0D0D0D;               → --deep: #0D0D0D;
--border-subtle: #2a2a2a;         → --border-subtle: #2a2a2a; (keep)
--border-strong: #333333;         → --border-strong: #333333; (keep)
--status-live: #22c55e;           → --live: #22c55e;
--status-error: #ff5f57;          → --destructive: #ff5f57;
--status-success: #28c840;        → --success: #28c840;
--status-warning: #ffbd2e;        → --warning: #ffbd2e;
--brand-primary-border: ...       → --primary-border: ...
```

- [ ] **Step 3: Add new paired tokens (foreground companions)**

```css
--card-foreground: var(--foreground);
--popover-foreground: var(--foreground);
--primary-foreground: var(--background);  /* dark bg on orange */
--accent-foreground: var(--background);   /* dark bg on yellow */
--secondary: var(--popover);              /* secondary surface = elevated */
--ring: var(--primary);
--input: var(--border);
--radius: var(--radius-md);
```

- [ ] **Step 4: Repeat for light theme block and prefers-color-scheme blocks**

Same renames for `[data-theme="light"]`, `.theme-light`, `@media (prefers-color-scheme: light)`, and `@media (prefers-color-scheme: dark)` blocks.

- [ ] **Step 5: Update shadow definitions that reference old token names**

```css
/* Update all color-mix() references from var(--brand-primary) to var(--primary) */
--shadow-glow-sm: 0 0 6px color-mix(in srgb, var(--primary) 30%, transparent);
/* etc. for all --shadow-* tokens */
```

- [ ] **Step 6: Commit tokens.css**

```bash
git add src/lib/styles/tokens.css && git commit -m "feat(slice-17a-6): rename token definitions to ecosystem convention"
```

---

### Task 6: Token rename — app.css @theme inline

**Files:**
- Modify: `src/app.css`

- [ ] **Step 1: Replace @theme inline block**

Replace the entire `@theme inline { ... }` block with ecosystem-standard mappings:

```css
@theme inline {
  /* Core semantic — shadcn convention */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --color-input: var(--input);

  /* Our extensions — same convention */
  --color-terminal: var(--terminal);
  --color-deep: var(--deep);
  --color-manifesto: var(--manifesto);
  --color-dim-foreground: var(--dim-foreground);
  --color-code-foreground: var(--code-foreground);
  --color-light-foreground: var(--light-foreground);
  --color-border-subtle: var(--border-subtle);
  --color-border-strong: var(--border-strong);
  --color-live: var(--live);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-primary-hover: var(--primary-hover);
  --color-accent-hover: var(--accent-hover);
  --color-primary-border: var(--primary-border);
}
```

- [ ] **Step 2: Update all var() references in app.css base styles**

```css
/* html block */
background-color: var(--background);
color: var(--foreground);

/* scrollbar */
scrollbar-color: color-mix(in srgb, var(--primary) 40%, transparent) transparent;
/* ... all other var(--brand-primary) → var(--primary) in app.css */
```

- [ ] **Step 3: Verify build (will fail — consumers still use old names)**

```bash
bun run check  # Expected: warnings/errors from consumer files using old token names
```

- [ ] **Step 4: Commit app.css**

```bash
git add src/app.css && git commit -m "feat(slice-17a-6): update app.css @theme inline to ecosystem convention"
```

---

### Task 7: Token rename — consumer files (batch find-and-replace)

**Files:**
- Modify: ~80 files across `src/lib/components/`, `src/routes/`, `src/lib/motion/`

This is mechanical find-and-replace. Process each rename in order, one at a time, verifying no false positives.

- [ ] **Step 1: Rename var() references in all .svelte and .css files**

Process these renames in order (longest match first to avoid partial replacements):

```
var(--brand-primary-border) → var(--primary-border)
var(--brand-primary-hover)  → var(--primary-hover)
var(--brand-accent-hover)   → var(--accent-hover)
var(--brand-primary-rgb)    → var(--primary-rgb)
var(--brand-accent-rgb)     → var(--accent-rgb)
var(--brand-primary)        → var(--primary)
var(--brand-accent)         → var(--accent)
var(--bg-primary)           → var(--background)
var(--bg-surface)           → var(--muted)
var(--bg-elevated)          → var(--popover)
var(--bg-card)              → var(--card)
var(--bg-terminal)          → var(--terminal)
var(--bg-manifesto)         → var(--manifesto)
var(--bg-deep)              → var(--deep)
var(--text-primary)         → var(--foreground)
var(--text-secondary)       → var(--secondary-foreground)
var(--text-muted)           → var(--muted-foreground)
var(--text-dim)             → var(--dim-foreground)
var(--text-code)            → var(--code-foreground)
var(--text-light)           → var(--light-foreground)
var(--status-error)         → var(--destructive)
var(--status-live)          → var(--live)
var(--status-success)       → var(--success)
var(--status-warning)       → var(--warning)
```

Use project-wide find-and-replace. Exclude `node_modules/`, `.svelte-kit/`, `docs/`.

- [ ] **Step 2: Rename Tailwind class references**

```
text-[var(--text-muted)]      → text-muted-foreground
text-[var(--text-primary)]    → text-foreground
bg-[var(--bg-primary)]        → bg-background
bg-[var(--bg-card)]           → bg-card
bg-[var(--bg-surface)]        → bg-muted
border-[var(--border-subtle)] → border-border-subtle
/* etc. — check each file for Tailwind class patterns referencing old tokens */
```

- [ ] **Step 3: Verify build**

```bash
bun run check
```
Fix any remaining references that were missed.

- [ ] **Step 4: Run tests**

```bash
bun run test
```
Fix any test failures caused by the rename (likely test snapshots or hardcoded token names in assertions).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): rename all token references across 80+ consumer files"
```

---

### Task 8: Verify visual parity after token rename

- [ ] **Step 1: Start dev server**

```bash
bun run dev
```

- [ ] **Step 2: Spot-check key pages**

Visit each route and verify no visual regression:
- `/` (home — hero, manifesto, services, proof reel, closer)
- `/about` (bento grid, testimonials, polaroids)
- `/services` (station tabs, service cards)
- `/tech-stack` (control room, bottom sheet)
- `/blog` (listing, filters)
- `/work` (listing, filters)
- `/contact` (terminal contact form)

- [ ] **Step 3: Commit session 1 checkpoint**

```bash
git add -A && git commit -m "docs(slice-17a-6): session 1 complete — dead code deleted, tokens renamed"
```

---

## Session 2: shadcn-svelte Init + Customize ui/ Components

### Task 9: Initialize shadcn-svelte (full install)

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts` (cn utility)
- Create: `src/lib/components/ui/` (all ~58 component directories)
- Modify: app.css (shadcn may add CSS variable scaffolding — merge with our tokens)

- [ ] **Step 1: Run shadcn-svelte init**

```bash
bunx shadcn-svelte@latest init
```

When prompted:
- Base color: Neutral (closest to our dark theme)
- Global CSS file: `src/app.css`
- Import alias for components: `$lib/components`
- Import alias for utils: `$lib/utils`
- Import alias for ui: `$lib/components/ui`

- [ ] **Step 2: Install all components**

```bash
bunx shadcn-svelte@latest add --all
```

This scaffolds all ~58 components into `src/lib/components/ui/` and installs bits-ui, vaul-svelte, paneforge, formsnap, clsx, tailwind-merge.

- [ ] **Step 3: Reconcile CSS — merge shadcn's token scaffolding with our tokens**

shadcn will generate CSS variables in app.css. Our tokens.css already defines everything. Remove shadcn's generated CSS variables and keep ours. Ensure our @theme inline block provides all the mappings shadcn components expect (`--color-primary`, `--color-background`, etc. — already done in Task 6).

- [ ] **Step 4: Verify build**

```bash
bun run check
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): shadcn-svelte init — full install, all components scaffolded"
```

---

### Task 10: Customize ui/dialog with brand styling + GSAP

**Files:**
- Modify: `src/lib/components/ui/dialog/dialog-overlay.svelte`
- Modify: `src/lib/components/ui/dialog/dialog-content.svelte`

- [ ] **Step 1: Update dialog-overlay with brand styling**

Replace shadcn's default overlay classes with our brand dark overlay:

```svelte
<!-- Use our brand overlay: dark bg, blur, proper z-index -->
class={cn(
  "fixed inset-0 z-[var(--z-menu)] bg-black/60 supports-backdrop-filter:backdrop-blur-sm",
  "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0",
  className
)}
```

- [ ] **Step 2: Update dialog-content with brand styling**

Replace default content styling with our brand treatment:

```svelte
class={cn(
  "fixed top-1/2 left-1/2 z-[var(--z-menu)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
  "rounded-lg border border-border-subtle bg-card text-foreground shadow-card",
  "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0",
  "data-closed:zoom-out-95 data-open:zoom-in-95 duration-200",
  "sm:max-w-md",
  className
)}
```

- [ ] **Step 3: Verify dialog renders correctly**

Import Dialog in a test page or dev route, confirm it opens/closes with brand styling.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): customize ui/dialog with brand styling"
```

---

### Task 11: Customize ui/drawer with brand styling

**Files:**
- Modify: `src/lib/components/ui/drawer/drawer-content.svelte`
- Modify: `src/lib/components/ui/drawer/drawer-overlay.svelte`

- [ ] **Step 1: Update drawer-overlay and drawer-content**

Apply brand dark overlay and card styling. Match StackBottomSheet's current visual: dark bg, brand border, rounded top corners.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): customize ui/drawer with brand styling"
```

---

### Task 12: Customize ui/sheet with brand styling

**Files:**
- Modify: `src/lib/components/ui/sheet/sheet-content.svelte`
- Modify: `src/lib/components/ui/sheet/sheet-overlay.svelte`

- [ ] **Step 1: Update sheet for full-screen metro overlay**

Match MenuOverlay's current visual: full viewport, dark bg, metro line decoration.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): customize ui/sheet for metro overlay"
```

---

### Task 13: Customize ui/collapsible, ui/accordion, ui/tabs, ui/toggle, ui/toggle-group

**Files:**
- Modify: Multiple files in `src/lib/components/ui/collapsible/`, `ui/accordion/`, `ui/tabs/`, `ui/toggle/`, `ui/toggle-group/`

- [ ] **Step 1: Customize ui/collapsible**

Light touch — collapsible is mostly unstyled. Ensure content transitions use our duration tokens.

- [ ] **Step 2: Customize ui/accordion**

Apply CollapsibleSection's card styling: `bg-card border-border-subtle rounded-lg`.

- [ ] **Step 3: Customize ui/tabs**

Apply brand tab styling: orange active indicator, distance-based opacity on inactive tabs.

- [ ] **Step 4: Customize ui/toggle**

Apply Tag's interactive styling: mono font, brand pill borders, pressed state.

- [ ] **Step 5: Customize ui/toggle-group**

Apply FilterGroup's single-select styling: button group with active highlight.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): customize collapsible, accordion, tabs, toggle, toggle-group"
```

---

### Task 14: Customize ui/button, ui/badge, ui/separator, ui/tooltip, ui/progress, ui/carousel, ui/scroll-area

**Files:**
- Modify: Multiple files across 7 ui/ component directories

- [ ] **Step 1: Customize ui/button**

Match BrandButton: primary/ghost variants, sm/md/lg sizes, brand orange primary, ghost border. Add `type="button"` default, disabled state.

- [ ] **Step 2: Customize ui/badge**

Match Tag non-interactive: mono font, pill shape, brand color variants (active/inactive).

Add NumberBadge variant: round shape, small size, accent color.

- [ ] **Step 3: Customize ui/separator**

Add two variants:
- `variant="hazard"` — animated hazard stripe pattern (from HazardStripe)
- `variant="gradient"` — animated gradient (from GradientSeparator)
- Default variant stays as simple line

- [ ] **Step 4: Customize ui/tooltip**

Terminal-style: mono font, dark bg, brand border, compact padding.

- [ ] **Step 5: Customize ui/progress**

Match ReadingProgressBar: thin bar, brand orange fill, fixed top position.

- [ ] **Step 6: Customize ui/carousel**

Match ProofReel/AboutTestimonials: card carousel with scroll reveal, dot indicators.

- [ ] **Step 7: Customize ui/scroll-area**

Brand scrollbar: orange thumb on dark track (matching our global scrollbar CSS).

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): customize button, badge, separator, tooltip, progress, carousel, scroll-area"
```

---

## Session 3: Migrate Brand Primitives + Wire Page Components

### Task 15: Migrate BrandButton → ui/button

**Files:**
- Modify: `src/lib/components/brand/index.ts` (remove BrandButton export)
- Delete: `src/lib/components/brand/BrandButton.svelte`
- Modify: ~7 consumer files (import path changes)

- [ ] **Step 1: Update all BrandButton imports**

Change all imports from:
```typescript
import { BrandButton } from '$lib/components/brand';
```
to:
```typescript
import { Button } from '$lib/components/ui/button';
```

Update JSX: `<BrandButton>` → `<Button>`, mapping props (variant, size, href stay the same).

- [ ] **Step 2: Remove from brand/ barrel**

Remove BrandButton export from `src/lib/components/brand/index.ts`.

- [ ] **Step 3: Delete BrandButton.svelte**

- [ ] **Step 4: Verify build + visual parity**

```bash
bun run check
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): migrate BrandButton to ui/button"
```

---

### Task 16: Migrate CardBase → ui/card

**Files:**
- Modify: `src/lib/components/brand/index.ts`
- Delete: `src/lib/components/brand/CardBase.svelte`
- Modify: Consumer files importing CardBase

- [ ] **Step 1: Update all CardBase imports to ui/card**

Map CardBase props to Card sub-components. CardBase's glow/tilt behavior stays as Svelte actions on the consumer side.

- [ ] **Step 2: Remove from brand/ barrel + delete**

- [ ] **Step 3: Verify build**

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): migrate CardBase to ui/card"
```

---

### Task 17: Migrate Tag → ui/badge + ui/toggle, NumberBadge → ui/badge, HazardStripe + GradientSeparator → ui/separator

**Files:**
- Delete: `src/lib/components/brand/Tag.svelte`
- Delete: `src/lib/components/brand/NumberBadge.svelte`
- Delete: `src/lib/components/brand/HazardStripe.svelte`
- Delete: `src/lib/components/GradientSeparator.svelte`
- Modify: `src/lib/components/brand/index.ts`
- Modify: All consumer files importing these primitives

- [ ] **Step 1: Update Tag (non-interactive) imports → ui/badge**

Consumers using `<Tag text="SQL" />` → `<Badge>SQL</Badge>` with mono font variant.

- [ ] **Step 2: Update Tag (interactive) imports → ui/toggle**

Consumers using `<Tag text="SQL" interactive={true} on:click={...} />` → `<Toggle>` with badge styling.

- [ ] **Step 3: Update NumberBadge imports → ui/badge**

Consumers using `<NumberBadge value={1} />` → `<Badge variant="number">{1}</Badge>`.

- [ ] **Step 4: Update HazardStripe imports → ui/separator**

Consumers using `<HazardStripe />` → `<Separator variant="hazard" />`.

- [ ] **Step 5: Update GradientSeparator imports → ui/separator**

Consumers using `<GradientSeparator />` → `<Separator variant="gradient" />`.

- [ ] **Step 6: Remove from brand/ barrel + delete files**

- [ ] **Step 7: Verify build + visual parity**

```bash
bun run check
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): migrate Tag, NumberBadge, HazardStripe, GradientSeparator to ui/"
```

---

### Task 18: Wire MenuOverlay → ui/sheet

**Files:**
- Modify: `src/lib/components/MenuOverlay.svelte`

- [ ] **Step 1: Refactor MenuOverlay to use ui/sheet**

Replace manual dialog implementation (escape key, scroll lock, backdrop) with Sheet component. Keep the CSS transition animation and metro line visual.

The Sheet handles: focus trap, ESC close, scroll lock, backdrop click, ARIA dialog role.
We keep: metro line decoration, route links, stop dots, CSS transitions.

- [ ] **Step 2: Remove svelte-ignore comment**

The `svelte-ignore a11y_no_noninteractive_element_interactions` on the overlay div is now handled by Sheet's built-in overlay.

- [ ] **Step 3: Verify build + MenuOverlay works**

```bash
bun run check
```
Test: open menu, navigate, close via ESC, close via backdrop click.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): wire MenuOverlay to ui/sheet"
```

---

### Task 19: Wire StackBottomSheet → ui/drawer

**Files:**
- Modify: `src/lib/components/StackBottomSheet.svelte`

- [ ] **Step 1: Refactor StackBottomSheet to use ui/drawer**

Replace manual swipe-to-dismiss, backdrop, and GSAP slide animation with Drawer component. Vaul handles swipe gestures and snap points natively.

Keep: content layout, prev/next navigation, markdown rendering, relation links.
Remove: manual touch tracking, GSAP slide animation (Vaul animates natively), manual backdrop, manual ARIA.

- [ ] **Step 2: Remove svelte-ignore comments (2)**

- [ ] **Step 3: Verify build + StackBottomSheet works**

Test: open on mobile, swipe to dismiss, prev/next navigation, backdrop close.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): wire StackBottomSheet to ui/drawer"
```

---

### Task 20: Wire CollapsibleSection → ui/collapsible + FilterGroup → ui/toggle-group

**Files:**
- Modify: `src/lib/components/CollapsibleSection.svelte`
- Modify: `src/lib/components/FilterGroup.svelte`

- [ ] **Step 1: Refactor CollapsibleSection to use ui/collapsible**

Replace manual toggle with Collapsible.Root + Collapsible.Trigger + Collapsible.Content. Keep NumberBadge (now ui/badge), ChevronToggle, $bindable open, card styling.

- [ ] **Step 2: Refactor FilterGroup to use ui/toggle-group**

Replace manual selection state with ToggleGroup. Single-select mode. Keep ripple action, filter button styling.

- [ ] **Step 3: Verify build**

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): wire CollapsibleSection to ui/collapsible, FilterGroup to ui/toggle-group"
```

---

### Task 21: Wire remaining components — StationTabs, AboutTestimonials, filters, TableOfContents, ReadingProgressBar

**Files:**
- Modify: `src/lib/components/StationTabs.svelte`
- Modify: `src/lib/components/AboutTestimonials.svelte`
- Modify: `src/lib/components/BlogFilterMobile.svelte`
- Modify: `src/lib/components/WorkFilterMobile.svelte`
- Modify: `src/lib/components/TableOfContents.svelte`
- Modify: `src/lib/components/ReadingProgressBar.svelte`

- [ ] **Step 1: Wire StationTabs → ui/tabs**

Replace manual tab implementation with Tabs.Root + Tabs.List + Tabs.Trigger + Tabs.Content. Keep station dots, opacity distance, short labels.

- [ ] **Step 2: Wire AboutTestimonials → ui/carousel**

Replace manual auto-rotate + dot selection with Carousel. Keep testimonial card styling, tilt/glow actions.

- [ ] **Step 3: Wire BlogFilterMobile + WorkFilterMobile → ui/collapsible**

Replace manual open/close toggle with Collapsible. Keep filter pill styling.

- [ ] **Step 4: Wire TableOfContents → ui/collapsible + ui/scroll-area**

Collapsible for expand/collapse sections. Scroll area for custom scrollbar in sidebar. Keep scroll spy logic.

- [ ] **Step 5: Wire ReadingProgressBar → ui/progress**

Replace custom progress bar with Progress component. Keep fixed top position, brand orange fill.

- [ ] **Step 6: Verify build + all pages work**

```bash
bun run check && bun run test
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): wire StationTabs, AboutTestimonials, filters, ToC, ReadingProgressBar"
```

---

## Session 4: a11y Fixes + End-of-17a Sweep

### Task 22: Fix all remaining svelte-ignore a11y (onclick → button)

**Files:**
- Modify: `src/routes/tech-stack/+page.svelte` (3 suppressions — backdrop + node clicks)
- Modify: `src/lib/components/HomeServices.svelte` (2 — service card clicks)
- Modify: `src/lib/components/ProofReel.svelte` (2 — image tap)
- Modify: `src/lib/components/StackDiagram.svelte` (1 — node clicks)
- Modify: `src/lib/components/AboutInterests.svelte` (2 — interest tag clicks)
- Modify: `src/lib/components/BlogSvgIcon.svelte` (1 — hover trigger)
- Modify: `src/lib/components/WorkSvgIcon.svelte` (1 — hover trigger)

- [ ] **Step 1: Fix tech-stack (3 suppressions)**

Replace `<div onclick>` patterns with `<button>` elements. Backdrop → ui/dialog if applicable, node clicks → `<button>`.

- [ ] **Step 2: Fix HomeServices (2 suppressions)**

Replace `<div onclick>` service cards with `<button>`.

- [ ] **Step 3: Fix ProofReel (2 suppressions)**

Replace `<div onclick>` image tap with `<button>`.

- [ ] **Step 4: Fix StackDiagram (1 suppression)**

Replace `<div onclick>` node click with `<button>`.

- [ ] **Step 5: Fix AboutInterests (2 suppressions)**

Replace `<div onclick>` interest tag clicks with `<button>`.

- [ ] **Step 6: Fix BlogSvgIcon + WorkSvgIcon (2 suppressions)**

Replace `<div>` noninteractive hover trigger with `<button>` or restructure to remove interaction.

- [ ] **Step 7: Verify zero svelte-ignore a11y comments remain**

```bash
grep -r "svelte-ignore a11y" src/ --include="*.svelte" | wc -l
```
Expected: 0

- [ ] **Step 8: Verify build + tests**

```bash
bun run check && bun run test
```

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): eliminate all 15 svelte-ignore a11y suppressions"
```

---

### Task 23: Update brand/ barrel exports + brand primitive conventions

**Files:**
- Modify: `src/lib/components/brand/index.ts`
- Modify: Remaining brand primitives (add cn(), data-slot if missing)

- [ ] **Step 1: Update brand/ barrel**

Remove migrated primitives (BrandButton, CardBase, Tag, NumberBadge, HazardStripe, GradientSeparator). Keep: TerminalChrome, StopLabel, SectionLabel, MetricDisplay, CornerMarks, GlowOverlay, StatusDot, StickyPanel, ChevronToggle.

- [ ] **Step 2: Add cn() + data-slot to remaining brand primitives**

Ensure all 8 remaining brand primitives follow the convention:
- `class` prop + `...rest` spread
- `cn()` for class composition
- `data-slot` attribute for targeting
- Typed props interface exported

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): update brand/ barrel + add cn/data-slot conventions"
```

---

### Task 24: End-of-17a sweep

**Files:**
- Verify across entire `src/` directory

- [ ] **Step 1: Zero hardcoded colors**

```bash
grep -rn '#[0-9a-fA-F]\{3,8\}' src/ --include="*.svelte" --include="*.css" | grep -v node_modules | grep -v '.svelte-kit' | grep -v 'tokens.css' | grep -v 'app.css'
```
All matches should be in comments, JS runtime (Canvas, Three.js), or documented exceptions.

- [ ] **Step 2: Zero old token names**

```bash
grep -rn 'var(--bg-primary\|--brand-primary\|--text-primary\|--text-muted\b\|--bg-surface\|--bg-elevated\|--bg-card\b\|--status-error\|--status-live\|--status-success\|--status-warning\|--text-secondary\|--text-dim\|--text-code\|--text-light\b\|--bg-terminal\|--bg-manifesto\|--bg-deep)' src/ --include="*.svelte" --include="*.css" --include="*.ts"
```
Expected: 0 matches (excluding docs/comments).

- [ ] **Step 3: Zero svelte-ignore a11y**

```bash
grep -rn "svelte-ignore a11y" src/ --include="*.svelte"
```
Expected: 0 matches.

- [ ] **Step 4: Zero arbitrary Tailwind spacing**

```bash
grep -rn 'p-\[.*px\]\|m-\[.*px\]\|gap-\[.*px\]\|space-.*\[.*px\]' src/ --include="*.svelte"
```
Expected: 0 matches.

- [ ] **Step 5: Full build + test**

```bash
bun run check && bun run test
```

- [ ] **Step 6: Commit sweep**

```bash
git add -A && git commit -m "chore(slice-17a-6): end-of-17a sweep — zero violations confirmed"
```

---

### Task 25: Update docs — CONSTITUTION.md + CSS.md

**Files:**
- Modify: `docs/reference/CONSTITUTION.md`
- Modify: `docs/reference/CSS.md`
- Modify: `docs/slices/slice-17-checkpoint.md`
- Modify: `docs/roadmap/standardization.md`

- [ ] **Step 1: Update CONSTITUTION.md**

Add/update sections:
- Section 6 (Components): Document ui/ tier (shadcn-scaffolded) + brand/ tier (hand-built). Update wrapping pattern to reference actual ui/ paths.
- Section 12 (Token Reference): Update all token names to new convention.
- Add note about shadcn-svelte as the component factory. Constitution compatible.

- [ ] **Step 2: Update CSS.md**

Full token inventory with new names. Document the naming convention (background/foreground pairs, full words for semantic, prefixed for scale/utility).

- [ ] **Step 3: Update checkpoint**

Mark 17a-6 as COMPLETE. Update next steps (17d Component API — visual pass + file splits + deduplication).

- [ ] **Step 4: Update roadmap**

Mark 17a-6 as COMPLETE in `docs/roadmap/standardization.md`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "docs(slice-17a-6): update CONSTITUTION, CSS.md, checkpoint, roadmap"
```

---

### Task 26: Final verification + visual parity check

- [ ] **Step 1: Full build + test**

```bash
bun run check && bun run test
```

- [ ] **Step 2: Visual spot-check all pages**

Visit every route on localhost:5173, confirm identical visual output:
- `/` — hero, manifesto, services, proof reel, closer
- `/about` — bento grid, testimonials, polaroids
- `/services` — station tabs, service cards, detail pages
- `/services/[id]` — collapsible sections, detail layout
- `/tech-stack` — control room, bottom sheet, configurator
- `/blog` — listing, filters, mobile filters
- `/blog/[slug]` — detail, ToC, reading progress
- `/work` — listing, filters
- `/work/[slug]` — detail, sidebar
- `/contact` — terminal form

- [ ] **Step 3: Print acceptance criteria checklist**

| Criteria | Status |
|----------|--------|
| Dead code: 0 dead components/routes/tokens | |
| Tokens: ecosystem convention | |
| shadcn-svelte: initialized, full install | |
| ui/ components: 15 customized | |
| Brand migrations: 7 to ui/ | |
| Page wiring: 12 components | |
| a11y: 0 svelte-ignore | |
| Brand primitives: 8 remain | |
| CONSTITUTION.md updated | |
| CSS.md updated | |
| Tests pass | |
| Visual parity | |

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "feat(slice-17a-6): component library foundation complete — visual parity verified"
```
