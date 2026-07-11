<!--
  Shared blog listing layout used by BOTH /blog (professional) and /blog/personal.
  Parameterized by category — no category logic inside, just renders what it's given.
  Includes desktop filters and mobile in-flow filters.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { BlogPost, Locale } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import '$lib/styles/listing-header.css';
	import '$lib/styles/listing-shell.css';

	const locale = getLocale();
	import { siteLabels } from '$lib/content';
	import { captureFlipState, animateFlipTransition } from '$lib/motion/utils/flip.js';
	import SearchInput from '$lib/components/shared/SearchInput.svelte';
	import FilterSummary from '$lib/components/shared/FilterSummary.svelte';
	import ListingMobileFilters from '$lib/components/shared/ListingMobileFilters.svelte';
	import { startListingBlueprintScrub } from '$lib/components/shared/listing-blueprint-scrub';
	import BlogRow from './BlogRow.svelte';
	import BlogFilterSidebar from './BlogFilterSidebar.svelte';
	import BlogBlueprint from './BlogBlueprint.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';
	import { persisted } from '$lib/state/persisted.svelte';

	let {
		posts,
		allTags,
		languages = [],
		mobileHeading = undefined,
		subtitle,
		accentColor = 'var(--primary)',
		cornerLink = null,
		svgContents = {}
	}: {
		posts: readonly BlogPost[];
		allTags: readonly string[];
		languages?: readonly Locale[];
		mobileHeading?: string;
		subtitle: string;
		accentColor?: string;
		cornerLink?: { href: string; label: string; subtitle: string } | null;
		svgContents?: Record<string, string>;
	} = $props();

	const listingChrome = siteLabels.blogChrome.listing;
	const mobileHeadingText = $derived(mobileHeading ?? resolveLocale(listingChrome.mobileHeading, locale));
	const mobileFiltersLabel = resolveLocale(listingChrome.filters.filtersLabel, locale);

	// Filter state. slice-34.1: search/language/date are session-scoped so they
	// survive a language switch via the locale-handoff orchestrator — each stored
	// value is a locale-free primitive (the literal query string, a Locale code, an
	// ISO date). A language code can become incompatible after the server narrows
	// the listing to the new request locale, so it is normalized below. The `tag`
	// filter lives in the URL and is carried for free by localizeUrl.
	// Browser-gated: the page prerenders (url.searchParams is unreadable at
	// build), so SSR HTML is the unfiltered listing and ?tag deep-links apply
	// on hydration.
	let activeTag = $derived(browser ? $page.url.searchParams.get('tag') : null);
	const activeLang = persisted<Locale | null>('blog-lang', null); // null = show all languages
	const searchQuery = persisted('blog-q', '');
	const dateFrom = persisted('blog-from', '');
	const dateTo = persisted('blog-to', '');
	const mobileFiltersOpen = persisted('blog-mobile-filters-open', false);
	const compatibleLang = $derived(
		activeLang.value && languages.includes(activeLang.value) ? activeLang.value : null,
	);

	$effect(() => {
		if (activeLang.value && !languages.includes(activeLang.value)) {
			activeLang.value = null;
		}
	});

	function setMobileFiltersOpen(next: boolean): void {
		mobileFiltersOpen.value = next;
	}

	// Apply all filters
	let filteredPosts = $derived.by(() => {
		let result = [...posts];

		// Language filter
		if (compatibleLang) {
			result = result.filter((p) => p.lang === compatibleLang);
		}

		// Tag filter
		if (activeTag) {
			result = result.filter((p) => p.tags.includes(activeTag!));
		}

		// Search filter (title, excerpt, tags)
		if (searchQuery.value.trim()) {
			const q = searchQuery.value.trim().toLowerCase();
			result = result.filter((p) => {
				const title = p.title.toLowerCase();
				const excerpt = p.excerpt.toLowerCase();
				const tags = p.tags.join(' ').toLowerCase();
				return title.includes(q) || excerpt.includes(q) || tags.includes(q);
			});
		}

		// Date range filter
		if (dateFrom.value) {
			result = result.filter((p) => p.date >= dateFrom.value);
		}
		if (dateTo.value) {
			result = result.filter((p) => p.date <= dateTo.value);
		}

		return result;
	});

	function handleTagSelect(tag: string | null) {
		flipState = captureFlipState();
		const url = new URL($page.url);
		if (tag) {
			url.searchParams.set('tag', tag);
		} else {
			url.searchParams.delete('tag');
		}
		goto(url.toString(), { replaceState: true, noScroll: true });
	}

	function handleLangSelect(lang: Locale | null) {
		flipState = captureFlipState();
		activeLang.value = lang;
	}

	function clearFilters() {
		flipState = captureFlipState();
		searchQuery.value = '';
		dateFrom.value = '';
		dateTo.value = '';
		activeLang.value = null;
		handleTagSelect(null);
	}

	let hasActiveFilters = $derived(
		!!activeTag ||
			!!compatibleLang ||
			searchQuery.value.trim() !== '' ||
			dateFrom.value !== '' ||
			dateTo.value !== ''
	);

	// After 17e-2 (Snappy Doctrine) there is no entrance gate — cards render at final
	// state on load. batchFired stays true so FLIP filter transitions work immediately.
	const batchFired = true;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let flipState: any = null;

	$effect(() => {
		filteredPosts;
		animateFlipTransition('[data-batch="blog-item"]', flipState, batchFired, () => {
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

<div
	bind:this={listingSectionEl}
	data-testid="blog-listing"
	class="w-full pb-16"
	style={accentColor !== 'var(--accent)' ? `--accent: ${accentColor};` : ''}
>
	<!-- Section 1: Header — blueprint visualization -->
	<section class="w-full">
		<div bind:this={blueprintWrapEl} class="listing-blueprint-header" data-batch="blog-item">
			<BlogBlueprint />
			<!-- Subtitle: always visible, overlaid on blueprints -->
			<div class="listing-header-text">
				<h1 class="listing-mobile-heading">{mobileHeadingText}<span class="text-[var(--primary)]">.</span></h1>
				<div class="listing-header-subtitle">{subtitle}</div>
			</div>
		</div>
	</section>

	<Separator variant="hazard" />

	<!-- Section 2: Listing — filter sidebar + posts in CSS Grid -->
	<section class="listing-grid">
		<aside class="listing-filter-column">
			<div class="sticky top-8 max-h-[calc(100dvh-6rem)] overflow-y-auto px-4 py-4" use:scrollChain>
				<BlogFilterSidebar
					tags={allTags}
					{languages}
					{activeTag}
					activeLang={compatibleLang}
					{accentColor}
					{cornerLink}
					bind:searchQuery={searchQuery.value}
					onTagSelect={handleTagSelect}
					onLangSelect={handleLangSelect}
					bind:dateFrom={dateFrom.value}
					bind:dateTo={dateTo.value}
				/>
			</div>
		</aside>

		<!-- Listing content with padding -->
		<div class="listing-content">

		<!-- Mobile search (always visible below lg, hidden when sideLeft shows it) -->
		<div class="mb-4 lg:hidden">
			<SearchInput placeholder={resolveLocale(listingChrome.searchPlaceholder, locale)} bind:value={searchQuery.value} testId="blog-search-mobile" />
		</div>

		<ListingMobileFilters
			open={mobileFiltersOpen.value}
			label={mobileFiltersLabel}
			testId="blog-filter-mobile"
			onOpenChange={setMobileFiltersOpen}
		>
			<BlogFilterSidebar
				tags={allTags}
				{languages}
				{activeTag}
				activeLang={compatibleLang}
				{accentColor}
				{cornerLink}
				showSearch={false}
				bind:searchQuery={searchQuery.value}
				onTagSelect={handleTagSelect}
				onLangSelect={handleLangSelect}
				bind:dateFrom={dateFrom.value}
				bind:dateTo={dateTo.value}
			/>
		</ListingMobileFilters>

		{#if hasActiveFilters}
			<FilterSummary count={filteredPosts.length} countLabel={siteLabels.ui.resultCount} onClear={clearFilters} />
		{/if}

		{#if filteredPosts.length === 0}
			<!-- Two empty states: "your filters matched nothing" vs "this section has
			     no posts at all" (blaming filters that don't exist reads as a bug). -->
			<p class="py-12 text-center text-sm text-[var(--muted-foreground)]">
				{resolveLocale(
					hasActiveFilters ? listingChrome.noPostsMessage : listingChrome.noPostsEmptyMessage,
					locale
				)}
			</p>
		{:else}
			<div class="flex flex-col gap-4">
				{#each filteredPosts as post, i (post.slug)}
					<BlogRow
						{post}
						svgContent={svgContents[post.slug] ?? ''}
						{accentColor}
						index={i}
						data-flip-id={post.slug}
					/>
				{/each}
			</div>
		{/if}
		</div>
	</section>
</div>

<style>
	/* WHY: items render at final state on load (Snappy Doctrine, 17e-2). FLIP
	   handles filter transitions only. The `data-batch="blog-item"` attribute
	   stays as a query target for animateFlipTransition. */

</style>
