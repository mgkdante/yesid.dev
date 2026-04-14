<!--
  Full work listing page layout: header, sidebar filters (desktop) / collapsible
  filter (mobile), and a card grid with GSAP Flip animation on filter changes.
  Service + tag filters use AND logic with URL params via goto().
  Desktop: sticky left sidebar (~220px) + main grid on the right.
  Mobile: collapsible filter button above the grid.
  Respects prefers-reduced-motion — skips FLIP if reduced motion is on.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import type { Project, Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap, Flip } from '$lib/motion/utils/gsap.js';
	import ProjectCard from './ProjectCard.svelte';
	import ProjectFilterSidebar from './ProjectFilterSidebar.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { MetroStation } from '$lib/components/brand';
	import { SectionWrapper } from '$lib/components/shells';
	import ProjectFilterMobile from './ProjectFilterMobile.svelte';
	import ProjectsBlueprint from './ProjectsBlueprint.svelte';
	import { Separator } from '$lib/components/ui/separator';


	let {
		projects,
		allTags,
		allStack = [],
		serviceIds,
		services,
		serviceSvgContents
	}: {
		projects: readonly Project[];
		allTags: readonly string[];
		allStack?: readonly string[];
		serviceIds: readonly string[];
		services: readonly Service[];
		serviceSvgContents: Record<string, string>;
	} = $props();

	// i18n content — all user-facing strings go through LocalizedString
	const content = {
		heading: { en: 'Work' },
		subtitle: { en: 'Projects, pipelines, and systems I have built.' },
		emptyState: { en: 'No projects match the selected filters.' },
		clearFilters: { en: 'clear filters' }
	};

	// Filter state — read from URL params
	let activeService = $derived($page.url.searchParams.get('service'));
	let activeTag = $derived($page.url.searchParams.get('tag'));
	let activeStack = $derived($page.url.searchParams.get('stack'));
	let searchQuery = $state('');

	// Apply filters: service + tag + stack + search use AND logic
	let filteredProjects = $derived.by(() => {
		let result = [...projects];

		if (activeService) {
			result = result.filter((p) => p.relatedServices.includes(activeService!));
		}

		if (activeTag) {
			result = result.filter((p) => p.tags.includes(activeTag!));
		}

		if (activeStack) {
			result = result.filter((p) => p.stack.includes(activeStack!));
		}

		// Search filter (title, oneLiner, tags, stack)
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			result = result.filter((p) => {
				const title = resolveLocale(p.title, 'en').toLowerCase();
				const oneLiner = resolveLocale(p.oneLiner, 'en').toLowerCase();
				const tags = p.tags.join(' ').toLowerCase();
				const stack = p.stack.join(' ').toLowerCase();
				return title.includes(q) || oneLiner.includes(q) || tags.includes(q) || stack.includes(q);
			});
		}

		return result;
	});

	// FLIP animation on filter changes
	async function updateFilter(type: 'service' | 'tag' | 'stack', value: string | null) {
		// Capture pre-filter layout for FLIP
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let flipState: any = null;
		if (!isPrefersReducedMotion()) {
			registerGsapPlugins();
			const cards = document.querySelectorAll('[data-flip-id]');
			if (cards.length > 0) {
				flipState = Flip.getState(cards);
			}
		}

		// Update URL params — Svelte reactivity will re-render the filtered list
		const url = new URL($page.url);
		if (value) {
			url.searchParams.set(type, value);
		} else {
			url.searchParams.delete(type);
		}
		await goto(url.toString(), { replaceState: true, noScroll: true });

		// Wait for DOM update then animate
		await tick();

		if (flipState && !isPrefersReducedMotion()) {
			const cards = document.querySelectorAll('[data-flip-id]');
			// WHY: batch CSS sets parent wrappers to opacity:0. After a filter change,
			// new DOM elements have that CSS default. We must reset BOTH the batch
			// wrappers AND the inner cards to visible before FLIP runs.
			const batchItems = document.querySelectorAll('[data-batch="project-item"]');
			gsap.killTweensOf(cards);
			gsap.killTweensOf(batchItems);
			gsap.set(batchItems, { opacity: 1, y: 0 });
			gsap.set(cards, { opacity: 1, y: 0, x: 0, scale: 1 });

			Flip.from(flipState, {
				targets: cards,
				duration: 0.5,
				ease: 'power2.inOut',
				stagger: 0.05,
				onEnter: (els) =>
					gsap.fromTo(
						els,
						{ opacity: 0, scale: 0.8 },
						{ opacity: 1, scale: 1, duration: 0.5 }
					),
				onLeave: (els) =>
					gsap.to(els, { opacity: 0, scale: 0.8, duration: 0.3 })
			});
		}
	}

	function handleServiceSelect(serviceId: string | null) {
		updateFilter('service', serviceId);
	}

	function handleTagSelect(tag: string | null) {
		updateFilter('tag', tag);
	}

	function handleStackSelect(stack: string | null) {
		updateFilter('stack', stack);
	}

	// Build a lookup from service ID to service title for the filter pills
	let serviceMap = $derived(
		new Map(services.map((s) => [s.id, resolveLocale(s.title, 'en')]))
	);

	let hasActiveFilters = $derived(!!activeService || !!activeTag || !!activeStack || searchQuery.trim() !== '');

	function clearFilters() {
		searchQuery = '';
		updateFilter('service', null);
		updateFilter('tag', null);
		updateFilter('stack', null);
	}

	// WHY: after a filter change, Svelte re-renders work items which start at
	// opacity:0 from the batch CSS. The batch onEnter (once:true) already fired
	// on initial load, so it won't re-fire. This effect resets new items to visible.
	let batchFired = false;
	$effect(() => {
		// Subscribe to filteredProjects so this runs on every filter change
		filteredProjects;
		if (batchFired && typeof document !== 'undefined') {
			requestAnimationFrame(() => {
				document.querySelectorAll<HTMLElement>('[data-batch="project-item"]').forEach(el => {
					el.style.opacity = '1';
					el.style.transform = 'translateY(0)';
				});
			});
		}
	});

	onMount(() => {
		// WHY: if user prefers reduced motion, skip all animation and just make elements visible
		if (isPrefersReducedMotion()) {
			document.querySelectorAll<HTMLElement>('[data-batch="project-item"]').forEach(el => {
				el.style.opacity = '1';
			});
			return;
		}

		registerGsapPlugins();

		// WHY: staggered entrance on page load (not scroll) — all items animate in immediately
		const items = document.querySelectorAll('[data-batch="project-item"]');
		batchFired = true;
		gsap.fromTo(items,
			{ opacity: 0, y: 20 },
			{ opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.4)' }
		);
	});
</script>

<div data-testid="project-listing" class="w-full pb-16">
	<!-- Blueprint header: full-bleed, outside container -->
	<div class="projects-blueprint-header" data-batch="project-item">
		<ProjectsBlueprint />
		<div class="projects-header-text">
			<div class="projects-mobile-heading">Projects<span class="text-[var(--primary)]">.</span></div>
			<div class="projects-header-subtitle">{resolveLocale(content.subtitle, 'en')}</div>
		</div>
	</div>

	<Separator variant="hazard" />

	<!-- Section 2: Listing — filters in sideLeft (section-scoped), cards in content -->
	<SectionWrapper layout="centered" container="none" style="--edge-left: clamp(220px, 22vw, 320px)">
		{#snippet sideLeft()}
			<div class="sticky top-8 max-h-[calc(100dvh-6rem)] overflow-y-auto px-4 py-4">
				<ProjectFilterSidebar
					{serviceIds}
					{serviceMap}
					tags={allTags}
					stack={allStack}
					{activeService}
					{activeTag}
					{activeStack}
					onServiceSelect={handleServiceSelect}
					onTagSelect={handleTagSelect}
					onStackSelect={handleStackSelect}
					bind:searchQuery
				/>
			</div>
		{/snippet}

		<!-- Listing content with padding -->
		<div class="px-4 py-6 md:px-6 md:py-8">

		<!-- Mobile search (always visible below lg, hidden when sideLeft shows it) -->
		<div class="mb-4 lg:hidden">
			<div class="relative">
				<input
					type="text"
					placeholder="Search projects..."
					bind:value={searchQuery}
					class="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] px-4 py-2.5 pl-10 font-mono text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none transition-colors focus:border-[var(--accent)]"
					data-testid="project-search-mobile"
				/>
				<svg class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
					<circle cx="7" cy="7" r="5"/>
					<line x1="11" y1="11" x2="14" y2="14"/>
				</svg>
			</div>
		</div>

		<!-- Mobile filter (visible below lg, hidden when sideLeft shows) -->
		<ProjectFilterMobile
			{serviceIds}
			{serviceMap}
			tags={allTags}
			stack={allStack}
			{activeService}
			{activeTag}
			{activeStack}
			onServiceSelect={handleServiceSelect}
			onTagSelect={handleTagSelect}
			onStackSelect={handleStackSelect}
		/>

		<!-- Active filter summary -->
		{#if hasActiveFilters}
			<div class="mb-3 flex items-center gap-2">
				<span class="text-xs text-[var(--muted-foreground)]">
					{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
				</span>
				<button
					class="font-mono text-caption text-primary underline transition-colors hover:text-[var(--foreground)]"
					onclick={clearFilters}
				>
					{resolveLocale(content.clearFilters, 'en')}
				</button>
			</div>
		{/if}

		<!-- Card grid -->
		{#if filteredProjects.length === 0}
			<p class="py-12 text-center text-sm text-[var(--muted-foreground)]" data-testid="work-empty-state">
				{resolveLocale(content.emptyState, 'en')}
			</p>
		{:else}
			<div class="project-grid">
				{#each filteredProjects as project, i (project.slug)}
					<div data-batch="project-item">
						<ProjectCard {project} {services} {serviceSvgContents} index={i} />
					</div>
				{/each}
			</div>
		{/if}
		</div>
	</SectionWrapper>
</div>

<style>
	/* --- Projects header: blueprint visualization --- */
	.projects-blueprint-header {
		position: relative;
		height: calc(100px + 5rem);
		overflow: hidden;
		margin-top: -5rem;
		padding-top: 5rem;
	}

	/* Desktop: taller header */
	@media (min-width: 1024px) {
		.projects-blueprint-header {
			height: calc(160px + 5rem);
		}
	}

	.projects-header-text {
		position: absolute;
		z-index: 20;
		bottom: 1rem;
		left: var(--space-page-x);
	}

	.projects-mobile-heading {
		font-family: var(--font-heading);
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 900;
		color: var(--foreground);
		letter-spacing: -1px;
		line-height: 1;
	}

	/* Hide "Projects." heading on desktop (EdgeRail carries it) */
	@media (min-width: 1024px) {
		.projects-mobile-heading { display: none; }
	}

	.projects-header-subtitle {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--foreground);
		letter-spacing: 2px;
		text-transform: uppercase;
		margin-top: 0.35rem;
	}

	/* Desktop: large to differentiate from blueprint labels */
	@media (min-width: 1024px) {
		.projects-header-subtitle {
			font-size: 1.1rem;
			letter-spacing: 5px;
		}
	}

	/* 2-column grid on desktop, single column on mobile */
	.project-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.project-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	input:focus {
		border-color: var(--accent);
		box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 15%, transparent);
	}

	/* WHY: batch items start invisible so GSAP can animate them in on scroll */
	:global([data-batch="project-item"]) {
		opacity: 0;
	}

	/* WHY: respect prefers-reduced-motion — show items immediately without animation */
	@media (prefers-reduced-motion: reduce) {
		:global([data-batch="project-item"]) {
			opacity: 1;
		}
	}
</style>
