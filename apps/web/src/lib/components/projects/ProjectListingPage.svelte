<!--
  Full work listing page layout: header, sidebar filters (desktop) / collapsible
  filter (mobile), and a card grid with GSAP Flip animation on filter changes.
  Service + tag filters use AND logic with URL params via goto().
  Desktop: sticky left sidebar (~220px) + main grid on the right.
  Mobile: collapsible filter button above the grid.
  Respects prefers-reduced-motion — skips FLIP if reduced motion is on.
  No entrance animation — cards render at final state on load (Snappy Doctrine, 17e-2).
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { Project, ProjectsPageContent, Service } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { captureFlipState, animateFlipTransition } from '$lib/motion/utils/flip.js';
	import { loadDrawSVG, loadFlip, initScrollTriggerConfig } from '$lib/motion/utils/gsap.js';
	import { createDrawScrub } from '$lib/motion/scrubs/index.js';
	import SearchInput from '$lib/components/shared/SearchInput.svelte';
	import FilterSummary from '$lib/components/shared/FilterSummary.svelte';
	import ProjectCard from './ProjectCard.svelte';
	import ProjectFilterSidebar from './ProjectFilterSidebar.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { MetroStation } from '$lib/components/brand';
	import ProjectFilterMobile from './ProjectFilterMobile.svelte';
	import ProjectsBlueprint from './ProjectsBlueprint.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';
	import { projectsListingContent } from '$lib/content/projects';
	import { siteLabels } from '$lib/content';

	let {
		projects,
		allTags,
		allStack = [],
		serviceIds,
		services,
		serviceSvgContents,
		projectsPage
	}: {
		projects: readonly Project[];
		allTags: readonly string[];
		allStack?: readonly string[];
		serviceIds: readonly string[];
		services: readonly Service[];
		serviceSvgContents: Record<string, string>;
		projectsPage: ProjectsPageContent;
	} = $props();

	// go2-t1c2: /projects chrome now flows from the CMS block
	// (block_projects_page_content — heading/intro/empty_state), with the
	// generated listing module + previous literals as code fallbacks. The
	// formerly orphaned CMS intro is rendered as the header subtitle.
	const listingHeading =
		resolveLocale(projectsPage.heading, locale) || resolveLocale(projectsListingContent.heading, locale);
	const searchPlaceholder = resolveLocale(projectsListingContent.searchPlaceholder, locale);
	const listingIntro = resolveLocale(projectsPage.intro, locale);
	const emptyStateText =
		resolveLocale(projectsPage.emptyState, locale) || 'No projects match the selected filters.';
	const filterNoun = resolveLocale(siteLabels.ui.nounProject, locale) || 'project';

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
				const title = resolveLocale(p.title, locale).toLowerCase();
				const oneLiner = resolveLocale(p.oneLiner, locale).toLowerCase();
				const tags = p.tags.join(' ').toLowerCase();
				const stack = p.stack.join(' ').toLowerCase();
				return title.includes(q) || oneLiner.includes(q) || tags.includes(q) || stack.includes(q);
			});
		}

		return result;
	});

	// FLIP animation on filter changes
	async function updateFilter(type: 'service' | 'tag' | 'stack', value: string | null) {
		flipState = captureFlipState();
		const url = new URL($page.url);
		if (value) {
			url.searchParams.set(type, value);
		} else {
			url.searchParams.delete(type);
		}
		await goto(url.toString(), { replaceState: true, noScroll: true });
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
		new Map(services.map((s) => [s.id, resolveLocale(s.title, locale)]))
	);

	let hasActiveFilters = $derived(!!activeService || !!activeTag || !!activeStack || searchQuery.trim() !== '');

	async function clearFilters() {
		flipState = captureFlipState();
		searchQuery = '';
		const url = new URL($page.url);
		url.searchParams.delete('service');
		url.searchParams.delete('tag');
		url.searchParams.delete('stack');
		await goto(url.toString(), { replaceState: true, noScroll: true });
	}

	// After 17e-2 (Snappy Doctrine) there is no entrance gate — cards render at final
	// state on load. batchFired stays true so FLIP filter transitions work immediately.
	const batchFired = true;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let flipState: any = null;

	$effect(() => {
		filteredProjects;
		animateFlipTransition('[data-batch="project-item"]', flipState, batchFired, () => {
			flipState = null;
		});
	});

	// Blueprint draw-scrub: paths stroke-dash from 0% → 100% as user scrolls
	// through the listing page section. DrawSVG plugin lazy-loaded at mount.
	let blueprintWrapEl = $state<HTMLElement>(undefined!);
	let listingSectionEl = $state<HTMLElement>(undefined!);
	let destroyDrawScrub: (() => void) | undefined;

	onMount(async () => {
		if (!browser) return;

		// Flip: filter-transition plugin; always loaded (consumer-wide sync
		// precondition for captureFlipState). DrawSVG: blueprint scroll-scrub.
		await loadFlip();

		if (isPrefersReducedMotion()) return;

		await loadDrawSVG();
		initScrollTriggerConfig();

		if (blueprintWrapEl && listingSectionEl) {
			destroyDrawScrub = createDrawScrub(blueprintWrapEl, {
				section: listingSectionEl,
				pathSelector: 'svg path',
			});
		}
	});

	onDestroy(() => destroyDrawScrub?.());
</script>

<div bind:this={listingSectionEl} data-testid="project-listing" class="w-full pb-16">
	<!-- Blueprint header: full-bleed, outside container -->
	<div bind:this={blueprintWrapEl} class="projects-blueprint-header" data-batch="project-item">
		<ProjectsBlueprint />
		<div class="projects-header-text">
			<h1 class="projects-mobile-heading">{listingHeading}<span class="text-[var(--primary)]">.</span></h1>
			<div class="projects-header-subtitle">{listingIntro}</div>
		</div>
	</div>

	<Separator variant="hazard" />

	<!-- Section 2: Listing — filter sidebar (desktop) + cards -->
	<section class="project-listing-grid">
		<aside class="project-filter-column">
			<div class="sticky top-8 max-h-[calc(100dvh-6rem)] overflow-y-auto px-4 py-4" use:scrollChain>
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
		</aside>

		<!-- Listing content with padding -->
		<div class="px-4 py-6 md:px-6 md:py-8">

		<!-- Mobile search (always visible below lg, hidden when sideLeft shows it) -->
		<div class="mb-4 lg:hidden">
			<SearchInput placeholder={searchPlaceholder} bind:value={searchQuery} testId="project-search-mobile" />
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
			<FilterSummary count={filteredProjects.length} noun={filterNoun} onClear={clearFilters} />
		{/if}

		<!-- Card grid -->
		{#if filteredProjects.length === 0}
			<p class="py-12 text-center text-sm text-[var(--muted-foreground)]" data-testid="work-empty-state">
				{emptyStateText}
			</p>
		{:else}
			<div class="project-grid">
				{#each filteredProjects as project, i (project.slug)}
					<div class="flex gap-3" data-batch="project-item">
						<MetroStation index={i + 1} showLine pulseDelay={i * 0.4} />
						<div class="min-w-0 flex-1">
							<ProjectCard {project} {services} {serviceSvgContents} index={i} />
						</div>
					</div>
				{/each}
			</div>
		{/if}
		</div>
	</section>
</div>

<style>
	/* Recipe 3: Filter sidebar + content */
	.project-listing-grid {
		display: grid;
		grid-template-columns: 1fr;
		width: 100%;
	}

	.project-filter-column {
		display: none;
	}

	@media (min-width: 1024px) {
		.project-listing-grid {
			grid-template-columns: clamp(220px, 22vw, 320px) 1fr;
		}
		.project-filter-column {
			display: block;
		}
	}

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

	/* Hide "Projects." heading on desktop (edge title in route layout carries it) */
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

	@media (min-width: 1280px) {
		.project-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	/* WHY: items render at final state on load (Snappy Doctrine, 17e-2). FLIP
	   handles filter transitions only. `data-batch="project-item"` stays as a
	   query target for animateFlipTransition. */
</style>
