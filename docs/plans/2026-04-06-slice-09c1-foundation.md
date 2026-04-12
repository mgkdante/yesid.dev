# Slice 09c-1: Foundation — DRY Extraction + Quick Wins

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract duplicated CollapsibleSection and FilterGroup patterns into reusable components, standardize card hover CSS, apply existing motion actions to cards/filters, and fix hardcoded strings.

**Architecture:** DRY-first approach — extract shared components (Tasks 1-2), then standardize styling (Task 3), then apply quick wins on top of clean code (Tasks 4-8). Each task produces independently testable changes.

**Tech Stack:** SvelteKit 2, Svelte 5 (snippets/runes), Tailwind v4, Vitest, Bun

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/components/CollapsibleSection.svelte` | Reusable collapsible card with icon/numbered variants |
| Create | `src/lib/components/CollapsibleSection.test.ts` | Tests for CollapsibleSection |
| Create | `src/lib/components/FilterGroup.svelte` | Reusable filter button group |
| Create | `src/lib/components/FilterGroup.test.ts` | Tests for FilterGroup |
| Modify | `src/lib/components/WorkDetailPage.svelte` | Replace inline sections with CollapsibleSection |
| Modify | `src/lib/components/ServiceDetailPage.svelte` | Replace inline sections with CollapsibleSection |
| Modify | `src/lib/components/BlogContent.svelte` | Wrap in CollapsibleSection (collapsible=false) |
| Modify | `src/lib/components/BlogFilterSidebar.svelte` | Compose FilterGroup, fix hardcoded strings |
| Modify | `src/lib/components/WorkFilterSidebar.svelte` | Compose FilterGroup |
| Modify | `src/lib/components/BlogRow.svelte` | Standardize hover, add `use:magnetic` to tags |
| Modify | `src/lib/components/WorkCard.svelte` | Standardize hover, add `use:tilt`, `use:magnetic` to tags |
| Modify | `src/lib/components/ProjectMiniCard.svelte` | Standardize hover (300ms, glow overlay) |
| Modify | `src/lib/components/BlogDetailHeader.svelte` | Add reading time badge, fix hardcoded strings |
| Modify | `src/lib/components/WorkDetailSidebar.svelte` | Wrap tags in `<a>` links |
| Modify | `src/routes/blog/[slug]/+page.ts` | Calculate reading time in load function |

---

### Task 1: CollapsibleSection Component

**Files:**
- Create: `src/lib/components/CollapsibleSection.svelte`
- Create: `src/lib/components/CollapsibleSection.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/components/CollapsibleSection.test.ts
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import CollapsibleSection from './CollapsibleSection.svelte';

describe('CollapsibleSection', () => {
	it('renders title and children when open', () => {
		const { getByText } = render(CollapsibleSection, {
			props: { title: 'Overview', open: true }
		});
		expect(getByText('Overview')).toBeTruthy();
	});

	it('renders numbered badge when index is provided', () => {
		const { container } = render(CollapsibleSection, {
			props: { title: 'Step', open: true, index: 0 }
		});
		const badge = container.querySelector('[aria-hidden="true"]');
		expect(badge?.textContent?.trim()).toBe('1');
	});

	it('toggles body visibility on button click when collapsible', async () => {
		const { container } = render(CollapsibleSection, {
			props: { title: 'Test', open: true, collapsible: true }
		});
		const button = container.querySelector('button');
		expect(button).toBeTruthy();
		// Body should have expanded class when open
		const body = container.querySelector('.section-body');
		expect(body?.classList.contains('expanded')).toBe(true);
		// Click to collapse
		await fireEvent.click(button!);
		expect(body?.classList.contains('expanded')).toBe(false);
	});

	it('renders as div (not button) when collapsible is false', () => {
		const { container } = render(CollapsibleSection, {
			props: { title: 'Static', open: true, collapsible: false }
		});
		const button = container.querySelector('button');
		expect(button).toBeNull();
		// No chevron
		const chevron = container.querySelector('.section-chevron');
		expect(chevron).toBeNull();
	});

	it('uses custom accent color', () => {
		const { container } = render(CollapsibleSection, {
			props: { title: 'Yellow', open: true, accentColor: '#FFB627' }
		});
		const card = container.querySelector('.section-card') as HTMLElement;
		expect(card.style.borderColor).toBe('#FFB627');
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test -- --reporter=verbose CollapsibleSection`
Expected: FAIL — component file not found

- [ ] **Step 3: Create CollapsibleSection.svelte**

```svelte
<!--
  Reusable collapsible section card.
  Used in WorkDetailPage, ServiceDetailPage (collapsible=true)
  and BlogContent (collapsible=false, visual card wrapper only).
  Pattern: border-l-[3px] accent bg-[#141414] card with optional toggle.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		open = true,
		index = null,
		accentColor = '#E07800',
		collapsible = true,
		icon,
		children
	}: {
		title: string;
		open?: boolean;
		index?: number | null;
		accentColor?: string;
		collapsible?: boolean;
		icon?: Snippet;
		children?: Snippet;
	} = $props();

	let isOpen = $state(open);

	function toggle() {
		if (collapsible) isOpen = !isOpen;
	}
</script>

<div
	class="section-card rounded-lg border-l-[3px] bg-[#141414]"
	style="border-color: {accentColor};"
>
	{#if collapsible}
		<button
			class="section-header flex w-full items-center gap-2.5 px-6 py-4 text-left"
			onclick={toggle}
		>
			{#if index !== null}
				<span
					class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-[#0a0a0a]"
					style="background-color: {accentColor};"
					aria-hidden="true"
				>
					{index + 1}
				</span>
			{:else if icon}
				{@render icon()}
			{/if}

			<h2 class="flex-1 font-heading text-lg font-bold" style="color: {accentColor};">
				{title}
			</h2>

			<svg
				class="section-chevron h-5 w-5 shrink-0 text-[#555]"
				class:rotated={isOpen}
				viewBox="0 0 20 20"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M8 4l7 6-7 6V4z" />
			</svg>
		</button>
	{:else}
		<div class="flex items-center gap-2.5 px-6 py-4">
			{#if index !== null}
				<span
					class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-[#0a0a0a]"
					style="background-color: {accentColor};"
					aria-hidden="true"
				>
					{index + 1}
				</span>
			{:else if icon}
				{@render icon()}
			{/if}

			<h2 class="flex-1 font-heading text-lg font-bold" style="color: {accentColor};">
				{title}
			</h2>
		</div>
	{/if}

	<div class="section-body overflow-hidden" class:expanded={collapsible ? isOpen : true}>
		<div class="min-h-0 overflow-hidden">
			<div class="px-6 pb-6 pt-3">
				{#if children}
					{@render children()}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.section-card {
		transition: box-shadow 0.25s ease, border-color 0.25s ease;
	}
	.section-card:hover {
		box-shadow: 0 0 16px rgba(224, 120, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.section-chevron {
		transition: transform 0.25s ease, color 0.15s ease;
	}
	.section-chevron.rotated {
		transform: rotate(90deg);
	}
	.section-header:hover .section-chevron {
		color: #E07800;
	}

	.section-body {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.3s ease;
	}
	.section-body.expanded {
		grid-template-rows: 1fr;
	}
	.section-body > div {
		overflow: hidden;
	}
</style>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test -- --reporter=verbose CollapsibleSection`
Expected: 5 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/CollapsibleSection.svelte src/lib/components/CollapsibleSection.test.ts
git commit -m "feat(09c-1): add CollapsibleSection reusable component"
```

---

### Task 2: Refactor WorkDetailPage + ServiceDetailPage + BlogContent to Use CollapsibleSection

**Files:**
- Modify: `src/lib/components/WorkDetailPage.svelte`
- Modify: `src/lib/components/ServiceDetailPage.svelte`
- Modify: `src/lib/components/BlogContent.svelte`

- [ ] **Step 1: Run existing tests to confirm green baseline**

Run: `bun run test -- --reporter=verbose`
Expected: All 304+ tests pass

- [ ] **Step 2: Refactor WorkDetailPage**

Replace the three inline collapsible patterns (overview, dynamic sections, README) with `CollapsibleSection`. Key changes:

1. Import `CollapsibleSection` at the top
2. Remove `overviewOpen`, `sectionOpen`, `readmeOpen` state variables and `toggleSection` function
3. Replace each inline section-card block with `<CollapsibleSection>` using snippets for icons
4. Remove the duplicated `.section-card`, `.section-chevron`, `.section-body` styles from `<style>` — they're now in the component
5. Keep the README card's special structure (ToC inside) by passing it as the children snippet

**Overview section** (lines 79-124) becomes:
```svelte
<CollapsibleSection title="Overview" open={true}>
	{#snippet icon()}
		<svg class="h-4 w-4 shrink-0 text-[#E07800]" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<circle cx="8" cy="8" r="2.5" />
			<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
		</svg>
	{/snippet}
	<p class="text-sm leading-relaxed text-[#ccc] md:text-base">
		{resolveLocale(project.description, 'en')}
	</p>
</CollapsibleSection>
```

**Dynamic sections** (lines 127-169) become:
```svelte
{#each project.sections as section, i}
	<CollapsibleSection title={resolveLocale(section.title, 'en')} open={true} index={i}>
		<p class="text-sm leading-relaxed text-[#ccc]">
			{resolveLocale(section.content, 'en')}
		</p>
	</CollapsibleSection>
{/each}
```

**README section** (lines 182-203) becomes:
```svelte
<CollapsibleSection title="Repository README" open={true}>
	{#snippet icon()}
		<svg class="h-5 w-5 shrink-0 text-[#E07800]" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
			<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
		</svg>
	{/snippet}
	<!-- Mobile ToC inside readme card -->
	<div class="border-b border-[#2a2a2a] px-0 py-4 2xl:hidden">
		<TableOfContents html={readmeHtml} embedded startOpen={false} />
	</div>
	<div class="readme-content">
		{@html processedReadmeHtml}
	</div>
</CollapsibleSection>
```

**Note:** The `use:reveal` directives stay on wrapper `<div>`s around each `<CollapsibleSection>`, not on the component itself (actions need native elements).

- [ ] **Step 3: Refactor ServiceDetailPage**

Same pattern. Replace value prop, deliverables, and dynamic sections with `<CollapsibleSection>`. Remove `valueOpen`, `deliverablesOpen`, `sectionOpen` state and `toggleSection` function. Remove duplicated styles.

**Value Proposition** (lines 118-140) becomes:
```svelte
<div use:reveal={{ direction: 'up', delay: 100 }}>
	<CollapsibleSection title="How This Helps You" open={true}>
		{#snippet icon()}
			<svg class="h-4 w-4 shrink-0 text-[#E07800]" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
				<circle cx="8" cy="8" r="2.5" />
				<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
			</svg>
		{/snippet}
		<p class="text-sm leading-relaxed text-[#ccc] md:text-base">
			{resolveLocale(service.valueProposition, 'en')}
		</p>
	</CollapsibleSection>
</div>
```

**Deliverables** and **dynamic sections** follow the same pattern.

- [ ] **Step 4: Refactor BlogContent**

Replace the outer card `<div>` with `<CollapsibleSection collapsible={false}>`. The first `#` heading from the markdown populates the title. Strip it from the body to avoid duplication.

Current BlogContent wraps children in:
```svelte
<div class="blog-card mt-8 rounded-lg border-l-[3px] bg-[#141414] p-6" style="border-color: {accentColor};">
```

Replace with:
```svelte
<CollapsibleSection title={contentTitle} collapsible={false} accentColor={accentColor}>
	<div class="blog-content" style="--blog-accent: {accentColor};">
		{@render children()}
	</div>
</CollapsibleSection>
```

Add a `contentTitle` prop (passed from the blog detail page, which has the post title). Remove the `.blog-card` styles that are now in CollapsibleSection. Keep `.blog-content` prose styles.

Update `BlogContent` props:
```ts
let {
	accentColor = '#E07800',
	contentTitle = 'Article',
	children
}: {
	accentColor?: string;
	contentTitle?: string;
	children: import('svelte').Snippet;
} = $props();
```

Update the blog detail route (`src/routes/blog/[slug]/+page.svelte`) to pass the title:
```svelte
<BlogContent accentColor={accent} contentTitle={resolveLocale(data.post.title, 'en')}>
```

- [ ] **Step 5: Run all tests**

Run: `bun run test -- --reporter=verbose`
Expected: All existing tests still pass + CollapsibleSection tests pass

- [ ] **Step 6: Run type check**

Run: `bun run check`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/WorkDetailPage.svelte src/lib/components/ServiceDetailPage.svelte src/lib/components/BlogContent.svelte src/routes/blog/
git commit -m "refactor(09c-1): use CollapsibleSection in work, service, and blog detail pages"
```

---

### Task 3: FilterGroup Component

**Files:**
- Create: `src/lib/components/FilterGroup.svelte`
- Create: `src/lib/components/FilterGroup.test.ts`
- Modify: `src/lib/components/BlogFilterSidebar.svelte`
- Modify: `src/lib/components/WorkFilterSidebar.svelte`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/components/FilterGroup.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import FilterGroup from './FilterGroup.svelte';

describe('FilterGroup', () => {
	const items = [
		{ key: 'sql', label: 'SQL' },
		{ key: 'python', label: 'Python' },
		{ key: 'svelte', label: 'Svelte' }
	];

	it('renders label and all items plus "All" button', () => {
		const onSelect = vi.fn();
		const { getByText } = render(FilterGroup, {
			props: { label: 'Tags', items, onSelect }
		});
		expect(getByText('Tags')).toBeTruthy();
		expect(getByText('All')).toBeTruthy();
		expect(getByText('SQL')).toBeTruthy();
		expect(getByText('Python')).toBeTruthy();
		expect(getByText('Svelte')).toBeTruthy();
	});

	it('highlights active item', () => {
		const onSelect = vi.fn();
		const { getByText } = render(FilterGroup, {
			props: { label: 'Tags', items, activeKey: 'python', onSelect }
		});
		const btn = getByText('Python');
		expect(btn.classList.contains('tag-active')).toBe(true);
	});

	it('calls onSelect with key on click', async () => {
		const onSelect = vi.fn();
		const { getByText } = render(FilterGroup, {
			props: { label: 'Tags', items, onSelect }
		});
		await fireEvent.click(getByText('SQL'));
		expect(onSelect).toHaveBeenCalledWith('sql');
	});

	it('calls onSelect with null when "All" clicked', async () => {
		const onSelect = vi.fn();
		const { getByText } = render(FilterGroup, {
			props: { label: 'Tags', items, activeKey: 'sql', onSelect }
		});
		await fireEvent.click(getByText('All'));
		expect(onSelect).toHaveBeenCalledWith(null);
	});

	it('deselects active item when allowDeselect is true', async () => {
		const onSelect = vi.fn();
		const { getByText } = render(FilterGroup, {
			props: { label: 'Tags', items, activeKey: 'sql', allowDeselect: true, onSelect }
		});
		await fireEvent.click(getByText('SQL'));
		expect(onSelect).toHaveBeenCalledWith(null);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test -- --reporter=verbose FilterGroup`
Expected: FAIL — component not found

- [ ] **Step 3: Create FilterGroup.svelte**

```svelte
<!--
  Reusable filter button group: monospace label + "All" + filter buttons.
  Shared by BlogFilterSidebar and WorkFilterSidebar.
-->
<script lang="ts">
	import { ripple } from '$lib/motion/actions/ripple.js';

	let {
		label,
		items,
		activeKey = null,
		accentColor = '#E07800',
		allowDeselect = true,
		onSelect,
		testIdPrefix = undefined
	}: {
		label: string;
		items: readonly { key: string; label: string }[];
		activeKey?: string | null;
		accentColor?: string;
		allowDeselect?: boolean;
		onSelect: (key: string | null) => void;
		testIdPrefix?: string | undefined;
	} = $props();

	function handleClick(key: string) {
		if (allowDeselect && activeKey === key) {
			onSelect(null);
		} else {
			onSelect(key);
		}
	}
</script>

<div>
	<div class="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
		{label}
	</div>
	<div class="mt-2 flex flex-col gap-1" style="--accent: {accentColor};">
		<button
			class="filter-btn rounded px-2 py-1 text-left text-xs transition-colors"
			class:active={activeKey === null}
			onclick={() => onSelect(null)}
			use:ripple={{ color: accentColor }}
		>
			All
		</button>
		{#each items as item}
			<button
				class="filter-btn rounded border border-[#2a2a2a] px-2 py-1 text-left text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
				class:tag-active={activeKey === item.key}
				data-testid={testIdPrefix ? `${testIdPrefix}-${item.key}` : undefined}
				onclick={() => handleClick(item.key)}
				use:ripple={{ color: accentColor }}
			>
				{item.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.active {
		background: var(--accent);
		color: #f5f5f0;
	}
	.tag-active {
		border-color: var(--accent) !important;
		color: var(--accent) !important;
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}
</style>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test -- --reporter=verbose FilterGroup`
Expected: 5 PASS

- [ ] **Step 5: Refactor BlogFilterSidebar to compose FilterGroup**

Replace inline language buttons and tag buttons with `<FilterGroup>`. Keep date range inputs and corner link inline. Fix hardcoded strings by adding a labels object:

```ts
const labels = {
	language: { en: 'Language' },
	dateRange: { en: 'Date Range' },
	from: { en: 'From' },
	to: { en: 'To' },
	tags: { en: 'Tags' }
};
```

Language items: `languages.map(lang => ({ key: lang, label: LANG_LABELS[lang] }))`.
Tag items: `tags.map(tag => ({ key: tag, label: tag }))`.

- [ ] **Step 6: Refactor WorkFilterSidebar to compose FilterGroup**

Replace inline service buttons and tag buttons with `<FilterGroup>`. Labels already use `resolveLocale` — keep them.

Service items: `serviceIds.map(id => ({ key: id, label: serviceMap.get(id) ?? id }))`.
Tag items: `tags.map(tag => ({ key: tag, label: tag }))`.

- [ ] **Step 7: Run all tests**

Run: `bun run test -- --reporter=verbose`
Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add src/lib/components/FilterGroup.svelte src/lib/components/FilterGroup.test.ts src/lib/components/BlogFilterSidebar.svelte src/lib/components/WorkFilterSidebar.svelte
git commit -m "refactor(09c-1): extract FilterGroup, refactor blog + work sidebars"
```

---

### Task 4: Card Hover Standardization

**Files:**
- Modify: `src/lib/components/BlogRow.svelte`
- Modify: `src/lib/components/WorkCard.svelte`
- Modify: `src/lib/components/ProjectMiniCard.svelte`

- [ ] **Step 1: Standardize BlogRow hover**

In `BlogRow.svelte`, line 41: verify `transition-all duration-300` — add explicit `ease` if not present via Tailwind. The `<style>` block (line 89-92) already uses `color-mix` for border and box-shadow. Confirm values match standard:

```css
.blog-row:hover {
	border-color: color-mix(in srgb, var(--accent) 50%, transparent);
	box-shadow: 0 0 16px rgba(224, 120, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

Update the box-shadow to match the standard value if different.

- [ ] **Step 2: Standardize WorkCard hover**

In `WorkCard.svelte`, the `<style>` block (line 177-180) already has hover. Confirm box-shadow matches:

```css
.work-card:hover article {
	border-color: color-mix(in srgb, #E07800 50%, transparent);
	box-shadow: 0 0 16px rgba(224, 120, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

- [ ] **Step 3: Standardize ProjectMiniCard hover**

In `ProjectMiniCard.svelte`, change transition from `0.25s` to `0.3s` (line 59). Add radial-gradient glow overlay. Add `group` class to outer `<a>` for consistent `group-hover` support.

Update the `<style>` block:
```css
.project-mini-card {
	/* ... existing ... */
	transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
}
.project-mini-card:hover {
	border-color: rgba(224, 120, 0, 0.5);
	box-shadow: 0 0 16px rgba(224, 120, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3);
	transform: translateY(-2px);
}
```

Add a radial-gradient glow overlay `<div>` inside the `<a>` tag (same pattern as BlogRow and WorkCard):
```svelte
<div
	class="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
	style="background: radial-gradient(ellipse at 50% 50%, rgba(224, 120, 0, 0.06), transparent 70%);"
></div>
```

Add `relative overflow-hidden` and `group` to the outer `<a>`.

- [ ] **Step 4: Run all tests**

Run: `bun run test -- --reporter=verbose`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/BlogRow.svelte src/lib/components/WorkCard.svelte src/lib/components/ProjectMiniCard.svelte
git commit -m "refactor(09c-1): standardize card hover timing, glow, and box-shadow"
```

---

### Task 5: QW-1 — `use:tilt` on WorkCard

**Files:**
- Modify: `src/lib/components/WorkCard.svelte`

- [ ] **Step 1: Add tilt action**

In `WorkCard.svelte`, add import:
```ts
import { tilt } from '$lib/motion/actions/tilt.js';
```

On the outer `<a>` tag (line 62), add the action:
```svelte
<a
	href="/work/{project.slug}"
	class="work-card group block"
	...
	use:tilt={{ maxDeg: 1.5 }}
>
```

- [ ] **Step 2: Run tests + type check**

Run: `bun run test -- --reporter=verbose WorkCard` && `bun run check`
Expected: Pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/WorkCard.svelte
git commit -m "feat(09c-1): add use:tilt to WorkCard for 3D hover effect"
```

---

### Task 6: QW-2 — `use:magnetic` on Tag Pills

**Files:**
- Modify: `src/lib/components/BlogRow.svelte`
- Modify: `src/lib/components/WorkCard.svelte`

- [ ] **Step 1: Add magnetic to BlogRow tags**

In `BlogRow.svelte`, add import:
```ts
import { magnetic } from '$lib/motion/actions/magnetic.js';
```

On each tag `<span>` (line 73), add:
```svelte
<span
	class="rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors duration-200 md:text-xs"
	style="border-color: color-mix(in srgb, {accentColor} 60%, transparent); color: {accentColor};"
	use:magnetic={{ strength: 2, radius: 30 }}
>
	{tag}
</span>
```

- [ ] **Step 2: Add magnetic to WorkCard tags**

In `WorkCard.svelte`, add import:
```ts
import { magnetic } from '$lib/motion/actions/magnetic.js';
```

On each tag `<span>` (line 159), add:
```svelte
<span
	class="rounded border border-[#E07800]/30 px-1.5 py-0.5 font-mono text-[10px] text-[#E07800]"
	use:magnetic={{ strength: 2, radius: 30 }}
>
	{tag}
</span>
```

- [ ] **Step 3: Run tests**

Run: `bun run test -- --reporter=verbose`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/BlogRow.svelte src/lib/components/WorkCard.svelte
git commit -m "feat(09c-1): add use:magnetic to tag pills on BlogRow and WorkCard"
```

---

### Task 7: QW-4 — Reading Time in BlogDetailHeader

**Files:**
- Modify: `src/routes/blog/[slug]/+page.ts`
- Modify: `src/lib/components/BlogDetailHeader.svelte`

- [ ] **Step 1: Add reading time calculation to load function**

In `src/routes/blog/[slug]/+page.ts`:
```ts
import { error } from '@sveltejs/kit';
import { getPostBySlug, getPostHtml, getSvgContent } from '$lib/data';

export function load({ params }: { params: { slug: string } }) {
	const post = getPostBySlug(params.slug);
	if (!post) error(404, 'Post not found');

	const html = getPostHtml(params.slug);
	const svgContent = getSvgContent(post);

	// Strip HTML tags, count words, estimate reading time at 200 wpm
	const plainText = html.replace(/<[^>]*>/g, '');
	const wordCount = plainText.split(/\s+/).filter(Boolean).length;
	const readingTime = Math.max(1, Math.ceil(wordCount / 200));

	return { post, html, svgContent, readingTime };
}
```

- [ ] **Step 2: Add reading time badge to BlogDetailHeader**

Add `readingTime` prop and fix hardcoded strings:
```ts
let {
	post,
	svgContent = '',
	accentColor = '#E07800',
	readingTime = 0
}: {
	post: BlogPost;
	svgContent?: string;
	accentColor?: string;
	readingTime?: number;
} = $props();

// i18n labels
const labels = {
	backDispatches: { en: '\u2190 back to dispatches' },
	backPersonal: { en: '\u2190 back to personal corner' },
	minRead: { en: 'min read' }
};

let backHref = $derived(
	post.category === 'personal' ? '/blog/personal' : '/blog'
);
let backLabel = $derived(
	post.category === 'personal'
		? resolveLocale(labels.backPersonal, 'en')
		: resolveLocale(labels.backDispatches, 'en')
);
```

Add reading time badge after the date span (line 76):
```svelte
<span class="font-mono text-[10px] text-[var(--text-muted)] md:text-xs">
	{post.date}
</span>
{#if readingTime > 0}
	<span class="font-mono text-[10px] text-[var(--text-muted)]">
		&middot; {readingTime} {resolveLocale(labels.minRead, 'en')}
	</span>
{/if}
<span class="font-mono text-[10px] text-[var(--text-muted)]">
	&middot; {post.lang}
</span>
```

- [ ] **Step 3: Pass readingTime from the blog detail page**

In `src/routes/blog/[slug]/+page.svelte`, pass `readingTime={data.readingTime}` to `<BlogDetailHeader>`.

- [ ] **Step 4: Run tests + type check**

Run: `bun run test -- --reporter=verbose` && `bun run check`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add src/routes/blog/ src/lib/components/BlogDetailHeader.svelte
git commit -m "feat(09c-1): add reading time badge to blog detail header"
```

---

### Task 8: QW-5 — Clickable Tech Tags in WorkDetailSidebar

**Files:**
- Modify: `src/lib/components/WorkDetailSidebar.svelte`

- [ ] **Step 1: Wrap tags in links**

In `WorkDetailSidebar.svelte`, replace the tag `<span>` (line 63) with an `<a>` link:

```svelte
{#each project.stack as tech}
	<a
		href="/work?tag={tech}"
		data-animate="tag"
		class="sidebar-tag rounded-sm border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-0.5 font-mono text-[10px] text-[var(--text-primary)] no-underline md:text-xs"
	>
		{tech}
	</a>
{/each}
```

- [ ] **Step 2: Run tests + type check**

Run: `bun run test -- --reporter=verbose` && `bun run check`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/WorkDetailSidebar.svelte
git commit -m "feat(09c-1): make tech tags clickable links to filtered work listing"
```

---

### Task 9: DRY-4 — Hardcoded Content Audit

**Files:**
- Modify: `src/lib/components/BlogFilterSidebar.svelte` (if not already fixed in Task 3)
- Modify: any other files found during scan

- [ ] **Step 1: Scan all touched components for hardcoded English**

Run a grep for common hardcoded patterns in the components we've modified:
```bash
cd src/lib/components && grep -rn '"All"' *.svelte && grep -rn '"Tags"' *.svelte && grep -rn '"Services"' *.svelte && grep -rn '"Links"' *.svelte && grep -rn '"Tech Stack"' *.svelte
```

Known offenders (if not already fixed):
- `BlogFilterSidebar.svelte`: `"All"`, `"Language"`, `"Date Range"`, `"Tags"`, `"From"`, `"To"`
- `BlogDetailHeader.svelte`: back link labels (fixed in Task 7)
- `WorkCard.svelte`: `"Services"` label (line 118)
- `WorkDetailSidebar.svelte`: `"Tech Stack"`, `"Services"`, `"Links"` (lines 57, 81, 103)
- `FilterGroup.svelte`: `"All"` button text

For FilterGroup, add an `allLabel` prop (default `'All'`) so consumers can pass localized text.

- [ ] **Step 2: Fix any remaining hardcoded strings**

For each file, add a `labels` object with `LocalizedString` values and resolve with `resolveLocale()`. Follow the pattern already used in `WorkFilterSidebar.svelte`.

- [ ] **Step 3: Run all tests + type check**

Run: `bun run test -- --reporter=verbose` && `bun run check`
Expected: All pass

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "refactor(09c-1): remove hardcoded English strings, use LocalizedString throughout"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `bun run test -- --reporter=verbose`
Expected: All tests pass (304+ existing + new CollapsibleSection + FilterGroup tests)

- [ ] **Step 2: Run type check**

Run: `bun run check`
Expected: 0 errors

- [ ] **Step 3: Start dev server and verify visually**

Run: `bun run dev`

Check each page per the spec's Verify section:
1. `/work/transit-data-pipeline` — collapsible sections toggle, same look
2. `/services/sql-development` — collapsible sections toggle, same look
3. `/blog/sql-window-functions-guide` — content card same look, NOT collapsible
4. `/blog` — filter sidebar works, ripple on click
5. `/work` — filter sidebar works, cards tilt on hover, tags magnetic
6. `/work/transit-data-pipeline` — tech tags link to `/work?tag=X`
7. Resize to mobile — all enhancements degrade gracefully

- [ ] **Step 4: Stop and wait for Yesid's approval**

Tell Yesid what to check on localhost:5173. Do NOT write the handoff report until approved.
