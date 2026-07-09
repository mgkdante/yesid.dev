<!--
  Full work listing page layout: header, desktop and mobile filters, and a card grid
  with GSAP Flip animation on filter changes.
  Service + tag filters use AND logic with URL params via goto().
  Desktop: sticky left sidebar (~220px) + main grid on the right.
  Mobile: search + in-flow collapsible filters.
  Respects prefers-reduced-motion — skips FLIP if reduced motion is on.
  No entrance animation — cards render at final state on load (Snappy Doctrine, 17e-2).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { Project, ProjectsPageContent, Service } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import '$lib/styles/listing-header.css';
	import '$lib/styles/listing-shell.css';

	const locale = getLocale();
	import { captureFlipState, animateFlipTransition } from '$lib/motion/utils/flip.js';
	import SearchInput from '$lib/components/shared/SearchInput.svelte';
	import FilterSummary from '$lib/components/shared/FilterSummary.svelte';
	import ListingMobileFilters from '$lib/components/shared/ListingMobileFilters.svelte';
	import { startListingBlueprintScrub } from '$lib/components/shared/listing-blueprint-scrub';
	import ProjectCard from './ProjectCard.svelte';
	import ProjectFilterSidebar from './ProjectFilterSidebar.svelte';
	import { MetroStation } from '$lib/components/brand';
	import ProjectsBlueprint from './ProjectsBlueprint.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';
	import { siteLabels } from '$lib/content';
	import { persisted } from '$lib/state/persisted.svelte';

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
	const listingChrome = siteLabels.projectsChrome.listing;
	// $derived on the projectsPage reads so they recompute if the prop changes:
	// a plain const captures only the initial value, which Svelte 5 flags.
	const listingHeading = $derived(
		resolveLocale(projectsPage.heading, locale) || resolveLocale(listingChrome.heading, locale)
	);
	const searchPlaceholder = resolveLocale(listingChrome.searchPlaceholder, locale);
	const mobileFiltersLabel = resolveLocale(listingChrome.filters.filtersLabel, locale);
	const listingIntro = $derived(resolveLocale(projectsPage.intro, locale));
	const emptyStateText = $derived(
		resolveLocale(projectsPage.emptyState, locale) ||
			resolveLocale(
				{
					en: 'No projects match the selected filters.',
					fr: 'Aucun projet ne correspond aux filtres choisis.',
					es: 'Ningún proyecto coincide con los filtros elegidos.',
				},
				locale
			)
	);
	// Filter state — read from URL params. Browser-gated: the page prerenders
	// (url.searchParams is unreadable at build), so SSR HTML is always the
	// unfiltered listing — the only representation a static file can carry —
	// and ?service/?tag/?stack deep-links apply on hydration.
	let activeService = $derived(browser ? $page.url.searchParams.get('service') : null);
	let activeTag = $derived(browser ? $page.url.searchParams.get('tag') : null);
	let activeStack = $derived(browser ? $page.url.searchParams.get('stack') : null);
	// slice-34.1: free-text search is session-scoped (the locale-free string IS the
	// query the user typed — valid verbatim in any locale) so it survives a language
	// switch via the locale-handoff orchestrator. The tag/service/stack filters live
	// in the URL and are carried for free by localizeUrl.
	const searchQuery = persisted('projects-q', '');
	const mobileFiltersOpen = persisted('projects-mobile-filters-open', false);
	function setMobileFiltersOpen(next: boolean): void {
		mobileFiltersOpen.value = next;
	}

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
		if (searchQuery.value.trim()) {
			const q = searchQuery.value.trim().toLowerCase();
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

	let hasActiveFilters = $derived(!!activeService || !!activeTag || !!activeStack || searchQuery.value.trim() !== '');

	async function clearFilters() {
		flipState = captureFlipState();
		searchQuery.value = '';
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

	// Blueprint artwork renders on every viewport. DrawSVG scroll-scrub is a
	// desktop-only enhancement so mobile keeps native scroll behavior.
	let blueprintWrapEl = $state<HTMLElement>(undefined!);
	let listingSectionEl = $state<HTMLElement>(undefined!);
	let destroyDrawScrub: (() => void) | undefined;

	onMount(() => {
		let cancelled = false;
		void startListingBlueprintScrub(blueprintWrapEl, listingSectionEl).then((destroy) => {
			if (cancelled) destroy?.();
			else destroyDrawScrub = destroy;
		});

		return () => {
			cancelled = true;
			destroyDrawScrub?.();
		};
	});
</script>

<div bind:this={listingSectionEl} data-testid="project-listing" class="w-full pb-16">
	<!-- Blueprint header: full-bleed, outside container -->
	<div bind:this={blueprintWrapEl} class="listing-blueprint-header" data-batch="project-item">
		<ProjectsBlueprint />
		<div class="listing-header-text">
			<h1 class="listing-mobile-heading">{listingHeading}<span class="text-[var(--primary)]">.</span></h1>
			<div class="listing-header-subtitle">{listingIntro}</div>
		</div>
	</div>

	<Separator variant="hazard" />

	<!-- Section 2: Listing — filter sidebar (desktop) + cards -->
	<section class="listing-grid">
		<aside class="listing-filter-column">
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
					bind:searchQuery={searchQuery.value}
				/>
			</div>
		</aside>

		<!-- Listing content with padding -->
		<div class="listing-content">

		<!-- Mobile search (always visible below lg, hidden when sideLeft shows it) -->
		<div class="mb-4 lg:hidden">
			<SearchInput placeholder={searchPlaceholder} bind:value={searchQuery.value} testId="project-search-mobile" />
		</div>

		<ListingMobileFilters
			open={mobileFiltersOpen.value}
			label={mobileFiltersLabel}
			testId="project-filter-mobile"
			onOpenChange={setMobileFiltersOpen}
		>
			<ProjectFilterSidebar
				{serviceIds}
				{serviceMap}
				tags={allTags}
				stack={allStack}
				{activeService}
				{activeTag}
				{activeStack}
				showSearch={false}
				onServiceSelect={handleServiceSelect}
				onTagSelect={handleTagSelect}
				onStackSelect={handleStackSelect}
				bind:searchQuery={searchQuery.value}
			/>
		</ListingMobileFilters>

		<!-- Active filter summary -->
		{#if hasActiveFilters}
			<FilterSummary count={filteredProjects.length} countLabel={siteLabels.ui.resultCount} onClear={clearFilters} />
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
							<!-- First card is the listing's LCP candidate: eager + high priority.
							     The rest stay lazy. -->
							<ProjectCard {project} {services} {serviceSvgContents} eager={i === 0} />
						</div>
					</div>
				{/each}
			</div>
		{/if}
		</div>
	</section>
</div>

<style>
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
