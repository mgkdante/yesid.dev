# Slice 13f — Proof Reel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Proof Reel as Section 3 of the home page — a 3-card grid of featured projects with prominent impact metrics, staggered scroll entrance, and links to `/work/[slug]`.

**Architecture:** New `ImpactMetric` interface on the `Project` type. 3 projects get `impactMetric` populated. New `proofReelSlugs` constant in `content.ts` defines which projects to feature and in what order. New `ProofReel.svelte` component reads project data by slug and renders a responsive card grid. GSAP ScrollTrigger handles staggered entrance (no pin).

**Tech Stack:** SvelteKit 2 + Svelte 5 (runes), TypeScript, GSAP (ScrollTrigger), Tailwind v4, Vitest + @testing-library/svelte, Bun

**Design spec:** `docs/superpowers/specs/2026-04-10-proof-reel-design.md`
**Reference mockup:** `.superpowers/brainstorm/905-1775861785/content/01-proof-reel-design.html`

**Runtime:** Bun only. Never npm/npx/node.

---

## File Structure

### New Files

```
src/lib/components/ProofReel.svelte      — CREATE: 3-card proof reel section with GSAP entrance
src/lib/components/ProofReel.test.ts     — CREATE: component tests
```

### Modified Files

```
src/lib/data/types.ts                    — MODIFY: add ImpactMetric interface + impactMetric field on Project
src/lib/data/projects.ts                 — MODIFY: add impactMetric to 3 projects
src/lib/data/content.ts                  — MODIFY: add proofReelSlugs + proofReelContent
src/lib/data/content.test.ts             — MODIFY: add proofReelContent tests
src/lib/data/index.ts                    — MODIFY: export proofReelContent, ImpactMetric
src/routes/+page.svelte                  — MODIFY: import + render ProofReel after Manifesto
src/routes/home.test.ts                  — MODIFY: assert ProofReel section renders
```

### Reused (no changes needed)

```
src/lib/motion/utils/gsap.ts             — ScrollTrigger already registered
src/lib/motion/utils/lenis.ts            — smooth scroll active from layout
src/lib/styles/tokens.css                — existing terminal/brand tokens
src/app.css                              — existing .circuit-grid class
```

---

## Task 1: Data Layer — ImpactMetric Type + Project Data

**Files:**
- Modify: `src/lib/data/types.ts:38-64`
- Modify: `src/lib/data/projects.ts`
- Modify: `src/lib/data/index.ts:6`

- [ ] **Step 1: Add ImpactMetric interface to types.ts**

Add the interface right before the `Project` interface (after the `ProjectStatus` type, around line 38):

```typescript
// Structured impact metric for project cards and the Proof Reel section.
// value is a display string ("30s", "500 GB"), label gives context.
// before is optional — when present, cards show a before→after contrast.
export interface ImpactMetric {
	value: string;
	label: string;
	before?: string;
}
```

Then add the field to the `Project` interface, after `sections`:

```typescript
	sections: ProjectSection[];
	// Structured impact metric for proof reel / project cards.
	// Optional — not all projects have quantifiable impact yet.
	impactMetric?: ImpactMetric;
```

- [ ] **Step 2: Export ImpactMetric from barrel**

In `src/lib/data/index.ts`, add `ImpactMetric` to the type export line:

```typescript
export type { Locale, LocalizedString, ServiceSection, ProjectSection, ProjectStatus, Project, Service, SiteLinks, SiteAddress, SiteOwner, SiteMeta, BlogPost, BlogCategory, BlogAnimation, JourneyPanel, JourneySkill, SkillIcon, HighlightEffect, AboutPolaroid, AboutIdentity, AboutMetric, AboutMethodStep, AboutTestimonial, AboutInterest, TechCategory, AboutTechItem, TechStackItem, InfraLayer, DomainCluster, Proficiency, StackScenario, AboutClientLogo, AboutWeatherConfig, AboutCta, AboutContent, ContactContent, ContactInfoTerminal, ContactFormTerminal, ContactValidation, ContactSuccess, ContactTerminalField, ImpactMetric } from './types.js';
```

- [ ] **Step 3: Add impactMetric to 3 projects in projects.ts**

Add `impactMetric` to the `transit-data-pipeline` project object (after `sections: []`):

```typescript
		impactMetric: {
			value: '30s',
			label: 'Real-time refresh cycles',
		},
```

Add `impactMetric` to `lorem-analytics-dashboard` (after its `sections` array):

```typescript
		impactMetric: {
			value: '15 min',
			label: 'Reporting across 12 departments',
			before: '2 days',
		},
```

Add `impactMetric` to `lorem-database-migration` (after its `sections` array):

```typescript
		impactMetric: {
			value: '500 GB',
			label: 'Zero-downtime migration',
		},
```

- [ ] **Step 4: Run type check**

Run: `bun run check`
Expected: PASS — no type errors.

**STOP. Ask Yesid to verify before moving to Task 2.**

---

## Task 2: Content Layer — proofReelContent

**Files:**
- Modify: `src/lib/data/content.ts`
- Modify: `src/lib/data/content.test.ts`
- Modify: `src/lib/data/index.ts:34`

- [ ] **Step 1: Add proofReelContent to content.ts**

Add after the `manifestoContent` block (around line 92):

```typescript
export const proofReelContent = {
	sectionLabel: { en: '// PROOF' } satisfies LocalizedString,
	viewAllLabel: { en: 'View all work \u2192' } satisfies LocalizedString,
	viewAllHref: '/work',
	slugs: ['transit-data-pipeline', 'lorem-analytics-dashboard', 'lorem-database-migration'] as const,
} as const;
```

- [ ] **Step 2: Export from barrel**

In `src/lib/data/index.ts`, update the content exports line:

```typescript
export { heroAnimContent, heroContent, aboutContent, ctaContent, skillsJourneyPanels, skillsJourneyCta, manifestoContent, proofReelContent } from './content.js';
```

- [ ] **Step 3: Add tests for proofReelContent in content.test.ts**

Add a new `describe` block at the end of the file (after the `skillsJourneyCta` tests):

```typescript
describe('proofReelContent', () => {
	it('has section label and view-all link', () => {
		expect(proofReelContent.sectionLabel.en).toBe('// PROOF');
		expect(proofReelContent.viewAllLabel.en).toContain('View all work');
		expect(proofReelContent.viewAllHref).toBe('/work');
	});

	it('has exactly 3 featured project slugs', () => {
		expect(proofReelContent.slugs).toHaveLength(3);
	});

	it('slugs match existing projects', () => {
		for (const slug of proofReelContent.slugs) {
			const project = getProjectBySlug(slug);
			expect(project).toBeDefined();
			expect(project?.impactMetric).toBeDefined();
		}
	});

	it('slugs are in expected order', () => {
		expect(proofReelContent.slugs).toEqual([
			'transit-data-pipeline',
			'lorem-analytics-dashboard',
			'lorem-database-migration',
		]);
	});
});
```

Also update the import at the top of `content.test.ts`:

```typescript
import { heroContent, manifestoContent, aboutContent, ctaContent, skillsJourneyPanels, skillsJourneyCta, proofReelContent } from './content.js';
import { getProjectBySlug } from './projects.js';
```

- [ ] **Step 4: Run tests**

Run: `bun run test -- --run src/lib/data/content.test.ts`
Expected: All pass.

- [ ] **Step 5: Run full check**

Run: `bun run check`
Expected: PASS.

**STOP. Ask Yesid to verify before moving to Task 3.**

---

## Task 3: ProofReel Component + Tests

**Files:**
- Create: `src/lib/components/ProofReel.test.ts`
- Create: `src/lib/components/ProofReel.svelte`

- [ ] **Step 1: Write failing tests**

Create `src/lib/components/ProofReel.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProofReel from './ProofReel.svelte';

describe('ProofReel', () => {
	it('renders the section with correct testid', () => {
		render(ProofReel);
		expect(screen.getByTestId('proof-reel-section')).toBeInTheDocument();
	});

	it('renders the section label', () => {
		render(ProofReel);
		expect(screen.getByTestId('proof-reel-label')).toBeInTheDocument();
		expect(screen.getByTestId('proof-reel-label').textContent).toContain('// PROOF');
	});

	it('renders exactly 3 project cards', () => {
		render(ProofReel);
		const cards = screen.getAllByTestId('proof-card');
		expect(cards).toHaveLength(3);
	});

	it('renders impact metrics for each card', () => {
		render(ProofReel);
		const metrics = screen.getAllByTestId('proof-metric-value');
		expect(metrics).toHaveLength(3);
		expect(metrics[0].textContent).toContain('30s');
		expect(metrics[1].textContent).toContain('15 min');
		expect(metrics[2].textContent).toContain('500 GB');
	});

	it('renders before value with strikethrough when present', () => {
		render(ProofReel);
		const beforeEl = screen.getByTestId('proof-metric-before');
		expect(beforeEl).toBeInTheDocument();
		expect(beforeEl.textContent).toContain('2 days');
	});

	it('renders project titles', () => {
		render(ProofReel);
		const titles = screen.getAllByTestId('proof-card-title');
		expect(titles).toHaveLength(3);
		expect(titles[0].textContent).toContain('Transit Operations');
		expect(titles[1].textContent).toContain('Lorem Analytics');
		expect(titles[2].textContent).toContain('Lorem Database');
	});

	it('renders tech stack tags', () => {
		render(ProofReel);
		const tags = screen.getAllByTestId('proof-tag');
		expect(tags.length).toBeGreaterThanOrEqual(9);
	});

	it('cards link to /work/[slug]', () => {
		render(ProofReel);
		const cards = screen.getAllByTestId('proof-card');
		expect(cards[0].closest('a')?.getAttribute('href')).toBe('/work/transit-data-pipeline');
		expect(cards[1].closest('a')?.getAttribute('href')).toBe('/work/lorem-analytics-dashboard');
		expect(cards[2].closest('a')?.getAttribute('href')).toBe('/work/lorem-database-migration');
	});

	it('renders view-all link to /work', () => {
		render(ProofReel);
		const link = screen.getByTestId('proof-view-all');
		expect(link).toBeInTheDocument();
		expect(link.getAttribute('href')).toBe('/work');
		expect(link.textContent).toContain('View all work');
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test -- --run src/lib/components/ProofReel.test.ts`
Expected: FAIL — ProofReel module not found.

- [ ] **Step 3: Implement ProofReel.svelte**

Create `src/lib/components/ProofReel.svelte`:

```svelte
<!--
  Proof Reel — Section 3: Featured project cards with impact metrics.
  3 curated projects in a responsive grid. Staggered GSAP entrance (no pin).
  Cards link to /work/[slug]. Same dark bg + circuit grid as rest of Act 2.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { proofReelContent, getProjectBySlug, resolveLocale } from '$lib/data/index.js';
	import type { Project } from '$lib/data/index.js';
	import { gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';
	import { prefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

	const sectionLabel = resolveLocale(proofReelContent.sectionLabel, 'en');
	const viewAllLabel = resolveLocale(proofReelContent.viewAllLabel, 'en');

	const projects: (Project | undefined)[] = proofReelContent.slugs.map((slug) =>
		getProjectBySlug(slug)
	);

	let sectionEl: HTMLElement | undefined = $state(undefined);

	onMount(() => {
		if (!browser || $prefersReducedMotion || !sectionEl) return;

		const ctx = gsap.context(() => {
			const tl = gsap.timeline({
				paused: true,
				defaults: { ease: 'power2.out' },
			});

			tl.from('[data-proof-label]', { opacity: 0, duration: 0.3 });
			tl.from('[data-proof-card]', { y: 30, opacity: 0, duration: 0.6, stagger: 0.15 }, '-=0.1');
			tl.from('[data-proof-viewall]', { opacity: 0, duration: 0.3 }, '-=0.2');

			ScrollTrigger.create({
				trigger: sectionEl,
				start: 'top 80%',
				onEnter: () => tl.play(),
				onLeaveBack: () => tl.reverse(),
			});
		}, sectionEl);

		return () => ctx.revert();
	});
</script>

<section
	bind:this={sectionEl}
	data-testid="proof-reel-section"
	class="relative py-16 px-6 md:py-24 md:px-12 lg:px-16"
>
	<!-- Section label -->
	<div
		data-testid="proof-reel-label"
		data-proof-label
		class="mb-8 font-mono text-[11px] tracking-[3px] uppercase md:mb-10"
		style="color: rgba(224,120,0,0.5);"
	>
		{sectionLabel}
	</div>

	<!-- 3-card grid -->
	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 md:mb-10">
		{#each projects as project, i}
			{#if project}
				{@const title = resolveLocale(project.title, 'en')}
				{@const metric = project.impactMetric}
				<a
					href="/work/{project.slug}"
					data-proof-card
					class="proof-card group block rounded-xl p-5 transition-all duration-300 md:p-7"
					style="background: rgba(10,10,10,0.8); border: 1px solid rgba(224,120,0,0.15);"
				>
					<div data-testid="proof-card">
						{#if metric}
							<!-- Impact metric -->
							<div class="mb-1">
								{#if metric.before}
									<span
										data-testid="proof-metric-before"
										class="mr-1.5 text-[22px] font-normal line-through md:text-[28px]"
										style="color: #666;"
									>{metric.before}</span>
								{/if}
								<span
									data-testid="proof-metric-value"
									class="font-heading text-4xl font-black leading-none tracking-tight md:text-5xl"
									style="color: #E07800; letter-spacing: -0.03em;"
								>{metric.value}</span>
							</div>
							<div
								data-testid="proof-metric-label"
								class="mb-5 text-sm md:mb-6 md:text-[14px]"
								style="color: #999;"
							>{metric.label}</div>
						{/if}

						<!-- Title -->
						<div
							data-testid="proof-card-title"
							class="mb-4 font-heading text-[17px] font-bold leading-snug md:mb-5 md:text-xl"
							style="color: #F5F5F0;"
						>{title}</div>

						<!-- Tech tags -->
						<div class="flex flex-wrap gap-1.5">
							{#each project.stack as tech}
								<span
									data-testid="proof-tag"
									class="rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wide md:text-[11px]"
									style="color: rgba(224,120,0,0.7); border: 1px solid rgba(224,120,0,0.2); background: rgba(224,120,0,0.05);"
								>{tech}</span>
							{/each}
						</div>
					</div>
				</a>
			{/if}
		{/each}
	</div>

	<!-- View all link -->
	<div data-proof-viewall class="text-right">
		<a
			data-testid="proof-view-all"
			href={proofReelContent.viewAllHref}
			class="font-mono text-xs tracking-wider md:text-[13px]"
			style="color: #E07800; border-bottom: 1px solid rgba(224,120,0,0.3);"
		>{viewAllLabel}</a>
	</div>
</section>

<style>
	.proof-card:hover {
		border-color: rgba(224, 120, 0, 0.6) !important;
		transform: translateY(-2px);
		box-shadow: 0 8px 32px rgba(224, 120, 0, 0.08);
	}

	.proof-card:hover [data-testid='proof-tag'] {
		color: rgba(224, 120, 0, 0.85) !important;
		border-color: rgba(224, 120, 0, 0.4) !important;
		background: rgba(224, 120, 0, 0.08) !important;
	}
</style>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test -- --run src/lib/components/ProofReel.test.ts`
Expected: All pass.

- [ ] **Step 5: Run type check**

Run: `bun run check`
Expected: PASS.

**STOP. Ask Yesid to verify before moving to Task 4.**

---

## Task 4: Integrate into Home Page

**Files:**
- Modify: `src/routes/+page.svelte`
- Modify: `src/routes/home.test.ts`

- [ ] **Step 1: Import and render ProofReel after Manifesto**

In `src/routes/+page.svelte`, add the import:

```svelte
<script lang="ts">
	import HeroBanner from '$lib/components/HeroBanner.svelte';
	import Manifesto from '$lib/components/Manifesto.svelte';
	import ProofReel from '$lib/components/ProofReel.svelte';
</script>
```

Add the component after `<Manifesto />`:

```svelte
		<!-- Section 2: Manifesto (interactive circuit board + transit HUD) -->
		<Manifesto />

		<!-- Section 3: Proof Reel (featured project cards with impact metrics) -->
		<ProofReel />

		<!-- Sections 4-7 added in sub-slices 13g-13i -->
```

- [ ] **Step 2: Update home.test.ts**

Add two new tests at the end of the `describe('Home page')` block:

```typescript
	it('renders the proof reel section', () => {
		render(Page);
		expect(screen.getByTestId('proof-reel-section')).toBeInTheDocument();
	});

	it('renders 3 proof reel cards', () => {
		render(Page);
		const cards = screen.getAllByTestId('proof-card');
		expect(cards).toHaveLength(3);
	});
```

- [ ] **Step 3: Run all tests**

Run: `bun run test`
Expected: All pass.

- [ ] **Step 4: Run type check**

Run: `bun run check`
Expected: PASS.

- [ ] **Step 5: Pre-flight visual check**

Desktop (1440px): 3 cards across in a grid, `// PROOF` label top-left, "View all work →" bottom-right, circuit grid visible behind cards, cards have orange metric numbers, hover brightens border with subtle lift.

Mobile (375px): cards stacked full-width, smaller metric/title sizes, tags wrap, same hover behavior.

**STOP. Ask Yesid to verify on localhost before moving to Task 5.**

---

## Task 5: Visual Polish + Commit

**Files:**
- Potentially: `src/lib/components/ProofReel.svelte` (tweaks based on Yesid feedback)

- [ ] **Step 1: Address any visual feedback from Yesid**

Apply any spacing, sizing, or color adjustments Yesid requests from the visual check in Task 4.

- [ ] **Step 2: Run full test suite**

Run: `bun run test && bun run check`
Expected: All pass.

- [ ] **Step 3: Print test table**

```
| Test File | Test Name | Status | Failure Reason |
|-----------|-----------|--------|----------------|
```

**STOP. Ask Yesid for final approval before commit.**

---

## Execution Order

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5
```

All tasks are sequential — each depends on the previous. Task 1 (types) must exist before Task 2 (content referencing types). Task 3 (component) needs Tasks 1+2. Task 4 (integration) needs Task 3.

**Estimated sessions:** 1 session (5 tasks, straightforward implementation).

## Out of Scope

- Changes to hero or manifesto sections
- Changes to `/work` listing or detail pages
- New CSS tokens (reuses existing terminal/brand tokens)
- Lenis changes
- Any other home page sections (Services, Blog, About, CTA)
- Slice closing (separate sub-slice 13k)
