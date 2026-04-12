# Slice 09c-1 — Foundation: DRY Extraction + Quick Wins

**Date:** 2026-04-06
**Status:** approved
**Depends on:** Slices 07, 08, 09
**Scope:** DRY consolidation + quick micro-interaction wins. No new pages or routes.

## Split Strategy

Slice 09c was split into two sub-slices:

- **09c-1 (this spec):** DRY extraction + Quick Wins — clean the codebase first
- **09c-2 (future):** Medium Enhancements (cursorGlow, progress bar, gradient border, batch scroll, code copy, heading anchors) + Metro/Transit Brand Enhancements (metro line, station badges, next/prev stop, dashed separators)

Rationale: DRY work must land before adding new interactions on top. Building cursorGlow and gradient borders on duplicated code means touching the same code twice.

---

## DRY-1: CollapsibleSection Component

**File:** `src/lib/components/CollapsibleSection.svelte`
**Test:** `src/lib/components/CollapsibleSection.test.ts`

### Props

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `title` | `string` | required | Section heading text |
| `open` | `boolean` | `true` | Initial open/closed state |
| `index` | `number \| null` | `null` | If set, shows numbered badge. If null, uses icon snippet |
| `accentColor` | `string` | `'#E07800'` | Border-left + badge background color |
| `collapsible` | `boolean` | `true` | When `false`: no chevron, no toggle, header is `<div>` not `<button>`, body always visible |

### Snippets (Svelte 5)

- `icon` — optional SVG icon, rendered when `index` is null
- `children` — the collapsible body content (any HTML/components)

### Visual Pattern

```
rounded-lg border-l-[3px] border-[accentColor] bg-[#141414]
  └─ header: [icon OR numbered badge] + title + chevron (if collapsible)
  └─ body: grid rows transition (0→1fr open, 1fr→0 closed)
```

### Shared Styles (moved into component)

- `.section-chevron` — `transition: transform 0.25s ease, color 0.15s ease`
- `.section-chevron.rotated` — `transform: rotate(90deg)`
- `button:hover .section-chevron` — `color: #E07800`
- `.section-card:hover` — box-shadow glow

### Consumers

| Page | Usage | `collapsible` |
|------|-------|---------------|
| **WorkDetailPage** | Overview (icon), dynamic sections (numbered), README (icon) | `true` |
| **ServiceDetailPage** | Value prop (icon), deliverables (icon), dynamic sections (numbered) | `true` |
| **BlogContent** | Blog content card — title from first `#` heading in markdown, stripped from body to avoid duplication | `false` |

### Migration

1. Extract pattern from WorkDetailPage + ServiceDetailPage into CollapsibleSection
2. Replace inline pattern in both pages with the new component
3. Wrap BlogContent's card div with CollapsibleSection (`collapsible={false}`)
4. Existing tests must stay green — add new tests for CollapsibleSection itself

---

## DRY-2: FilterGroup Extraction

**File:** `src/lib/components/FilterGroup.svelte`
**Test:** `src/lib/components/FilterGroup.test.ts`

### Props

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `label` | `string` | required | Section heading ("Tags", "Services", "Language") |
| `items` | `{ key: string; label: string }[]` | required | Filter options |
| `activeKey` | `string \| null` | `null` | Currently selected item key |
| `accentColor` | `string` | `'#E07800'` | Active/hover color |
| `allowDeselect` | `boolean` | `true` | Click active item to deselect |
| `onSelect` | `(key: string \| null) => void` | required | Selection callback |
| `testIdPrefix` | `string \| undefined` | `undefined` | For `data-testid` attributes |

### Pattern Extracted

```
monospace label (uppercase, tracking-widest)
  └─ "All" button (active style when no selection)
  └─ list of filter buttons (tag-active style when selected)
```

### Shared Styles (moved into FilterGroup)

- `.active` — `background: var(--accent); color: #f5f5f0`
- `.tag-active` — `border-color: var(--accent); color: var(--accent); background: color-mix(...)`

### Consumers

| Sidebar | Composes | Custom (stays inline) |
|---------|----------|-----------------------|
| **BlogFilterSidebar** | FilterGroup x2 (language, tags) | Date range inputs, corner link |
| **WorkFilterSidebar** | FilterGroup x2 (services, tags) | — |

### Migration

1. Extract shared button group pattern into FilterGroup
2. Refactor BlogFilterSidebar to compose FilterGroup + keep date range + corner link inline
3. Refactor WorkFilterSidebar to compose FilterGroup x2
4. `use:ripple` added to filter buttons inside FilterGroup (QW-3)
5. Existing tests must stay green

---

## DRY-3: Card Hover Standardization

**No new component** — align CSS values across existing cards.

### Standardized Values

| Property | Value | Applied to |
|----------|-------|------------|
| Base transition | `300ms ease` | BlogRow, WorkCard, ProjectMiniCard |
| Image scale transition | `500ms ease` | WorkCard (keep as-is) |
| Border hover color | `border-[#E07800]` | All three cards |
| Radial-gradient glow | `opacity 0→1 on hover` | Add to ProjectMiniCard (BlogRow + WorkCard already have it) |
| Box-shadow on hover | `0 0 16px rgba(224,120,0,0.1), 0 2px 8px rgba(0,0,0,0.3)` | All three cards |
| Title hover color | `group-hover:text-[#E07800]` | All three cards |

### Changes per card

- **BlogRow** — already close, just verify `ease` is specified
- **WorkCard** — already close, just verify `ease` is specified
- **ProjectMiniCard** — change `250ms` → `300ms`, add radial-gradient glow overlay, add `group` class for `group-hover` pattern

---

## DRY-4: Hardcoded Content Audit

Scan all components in scope for hardcoded English strings. Move to `LocalizedString` labels resolved via `resolveLocale()`.

### Known offenders

| File | Strings | Fix |
|------|---------|-----|
| `BlogFilterSidebar.svelte` | `"All"`, `"Language"`, `"Date Range"`, `"Tags"`, `"From"`, `"To"` | Labels object with LocalizedString |
| `BlogDetailHeader.svelte` | `"← back to dispatches"`, `"← back to personal corner"` | Labels object with LocalizedString |

`WorkFilterSidebar.svelte` already uses `resolveLocale` — no changes needed.

A full scan of all touched components happens during implementation. Any additional hardcoded strings found get the same treatment.

---

## QW-1: `use:tilt` on WorkCard

**File:** `WorkCard.svelte`

Add `use:tilt={{ maxDeg: 1.5 }}` to the outer `<a>` wrapper. Import `tilt` from `$lib/motion/actions/tilt.js`. Action already exists with tests and respects `prefers-reduced-motion`.

---

## QW-2: `use:magnetic` on Tag Pills

**Files:** `BlogRow.svelte`, `WorkCard.svelte`

Add `use:magnetic` to tag `<span>` elements. Import `magnetic` from `$lib/motion/actions/magnetic.js`. Action already exists with tests and respects `prefers-reduced-motion`.

---

## QW-3: `use:ripple` on Filter Buttons

**Lands inside `FilterGroup.svelte`** after DRY-2 extraction.

Add `use:ripple` to all filter buttons within FilterGroup. Import `ripple` from `$lib/motion/actions/ripple.js`. Action already exists with tests and respects `prefers-reduced-motion`.

---

## QW-4: Reading Time in BlogDetailHeader

**Files:** `src/routes/blog/[slug]/+page.ts`, `BlogDetailHeader.svelte`

1. In the load function, calculate `readingTime = Math.ceil(wordCount / 200)` from the post body
2. Pass as prop to BlogDetailHeader
3. Display as `"X min read"` badge in JetBrains Mono, same style as existing date/lang meta badges

---

## QW-5: Clickable Tech Tags in WorkDetailSidebar

**File:** `WorkDetailSidebar.svelte`

Wrap each tag `<span>` in `<a href="/work?tag={tag}">`. The work listing page filter system already supports URL query params, so this just links to the filtered view.

---

## Rules

1. **Keep all existing components** — enhance, never replace
2. **Existing tests must stay green** — add new tests for new components
3. **All motion respects `prefers-reduced-motion`**
4. **All content stays data-driven** — no hardcoded text

## Acceptance Criteria

- [ ] `CollapsibleSection.svelte` extracted with tests
- [ ] `FilterGroup.svelte` extracted with tests
- [ ] WorkDetailPage, ServiceDetailPage refactored to use CollapsibleSection
- [ ] BlogContent wrapped in CollapsibleSection (`collapsible={false}`)
- [ ] BlogFilterSidebar, WorkFilterSidebar refactored to use FilterGroup
- [ ] Card hover values standardized (300ms ease, glow, box-shadow)
- [ ] `use:tilt` on WorkCard
- [ ] `use:magnetic` on tag pills (BlogRow, WorkCard)
- [ ] `use:ripple` on FilterGroup buttons
- [ ] Reading time badge in BlogDetailHeader
- [ ] Clickable tags in WorkDetailSidebar
- [ ] No hardcoded English strings in touched components
- [ ] `bun run test` passes
- [ ] `bun run check` passes

## Verify

1. Work detail — collapsible sections toggle, same look as before
2. Service detail — collapsible sections toggle, same look as before
3. Blog detail — content card has same visual styling, NOT collapsible
4. Blog listing — filter sidebar works, ripple on click, tags magnetic on hover
5. Work listing — filter sidebar works, cards tilt on hover, ripple on filter click
6. Work detail — tags link to `/work?tag=X`
7. Blog detail — reading time badge shows next to date
8. Mobile — all enhancements degrade gracefully, reduced-motion respected
