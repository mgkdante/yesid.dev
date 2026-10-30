<script lang="ts">
	import { browser } from '$app/env';
	import { page } from '$app/state';
	import { gotoPreservingScroll } from '#lib/utils/navigation-focus.ts';
	import type { Project, ProjectsPageContent, Service } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';

	const locale = getLocale();
	import { captureFlipState, animateFlipTransition } from '#lib/motion/utils/flip.ts';
	import { blueprintScrub } from '@yesid/motion/utils/blueprintScrub';
	import ProjectCard from './ProjectCard.svelte';
	import ProjectFilterSidebar from './ProjectFilterSidebar.svelte';
	import { MetroStation } from '@yesid/ui/brand';
	import ProjectsBlueprint from './ProjectsBlueprint.svelte';
	import { FilterSummary, SearchInput } from '@yesid/ui/brand';
	import { ListingFrame } from '@yesid/ui/layout';
	import { siteLabels } from '#lib/content/index.ts';
	import { persisted } from '@yesid/ui/state';

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
	const countLabel = {
		singular: resolveLocale(siteLabels.ui.resultCount.singular, locale),
		plural: resolveLocale(siteLabels.ui.resultCount.plural, locale)
	};
	const clearLabel = resolveLocale(siteLabels.navChrome.shared.clearFiltersLabel, locale);
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
	let activeService = $derived(browser ? page.url.searchParams.get('service') : null);
	let activeTag = $derived(browser ? page.url.searchParams.get('tag') : null);
	let activeStack = $derived(browser ? page.url.searchParams.get('stack') : null);
	// Persist the locale-free search string; URL filters travel through the language switch.
	const searchQuery = persisted('projects-q', '');

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
		const url = new URL(page.url.href);
		if (value) {
			url.searchParams.set(type, value);
		} else {
			url.searchParams.delete(type);
		}
		await gotoPreservingScroll(url.toString(), { replaceState: true });
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
		const url = new URL(page.url.href);
		url.searchParams.delete('service');
		url.searchParams.delete('tag');
		url.searchParams.delete('stack');
		await gotoPreservingScroll(url.toString(), { replaceState: true });
	}

	// Cards start at their final pose so filter transitions can run immediately.
	const batchFired = true;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let flipState: any = null;

	$effect(() => {
		filteredProjects;
		animateFlipTransition('[data-batch="project-item"]', flipState, batchFired, () => {
			flipState = null;
		});
	});

</script>

<div data-testid="project-listing" class="w-full">
	<ListingFrame
		heading={listingHeading}
		edgeTitle={resolveLocale(siteLabels.pages.projectsEdgeTitle, locale)}
		subtitle={listingIntro}
		onHeaderMount={blueprintScrub}
		filterLabel={mobileFiltersLabel}
		filterPersistKey="projects-mobile-filters-open"
	>
		{#snippet blueprint()}
			<ProjectsBlueprint />
		{/snippet}

		{#snippet search()}
			<SearchInput
				label={searchPlaceholder}
				placeholder={searchPlaceholder}
				bind:value={searchQuery.value}
				testId="project-search-sidebar"
			/>
		{/snippet}

		{#snippet filters()}
			<ProjectFilterSidebar
				serviceIds={serviceIds}
				serviceMap={serviceMap}
				tags={allTags}
				stack={allStack}
				activeService={activeService}
				activeTag={activeTag}
				activeStack={activeStack}
				onServiceSelect={handleServiceSelect}
				onTagSelect={handleTagSelect}
				onStackSelect={handleStackSelect}
			/>
		{/snippet}

		{#if hasActiveFilters}
			<FilterSummary
				count={filteredProjects.length}
				{countLabel}
				{locale}
				{clearLabel}
				onClear={clearFilters}
			/>
		{/if}

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

							<ProjectCard
								project={project}
								services={services}
								serviceSvgContents={serviceSvgContents}
								eager={i === 0}
							/>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</ListingFrame>
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

</style>
