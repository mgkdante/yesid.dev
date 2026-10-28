<script lang="ts">
	import { browser } from '$app/env';
	import { page } from '$app/state';
	import { gotoPreservingScroll } from '#lib/utils/navigation-focus.ts';
	import type { BlogPost, Locale } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';

	const locale = getLocale();
	import { siteLabels } from '#lib/content/index.ts';
	import { captureFlipState, animateFlipTransition } from '#lib/motion/utils/flip.ts';
	import { blueprintScrub } from '@yesid/motion/utils/blueprintScrub';
	import BlogRow from './BlogRow.svelte';
	import BlogFilterSidebar from './BlogFilterSidebar.svelte';
	import BlogBlueprint from './BlogBlueprint.svelte';
	import { FilterSummary, SearchInput } from '@yesid/ui/brand';
	import { ListingFrame } from '@yesid/ui/layout';
	import { persisted } from '@yesid/ui/state';

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
	const searchPlaceholder = resolveLocale(listingChrome.searchPlaceholder, locale);
	const countLabel = {
		singular: resolveLocale(siteLabels.ui.resultCount.singular, locale),
		plural: resolveLocale(siteLabels.ui.resultCount.plural, locale)
	};
	const clearLabel = resolveLocale(siteLabels.navChrome.shared.clearFiltersLabel, locale);

	// Filter state. slice-34.1: search/language/date are session-scoped so they
	// survive a language switch via the locale-handoff orchestrator — each stored
	// value is a locale-free primitive (the literal query string, a Locale code, an
	// ISO date). A language code can become incompatible after the server narrows
	// the listing to the new request locale, so it is normalized below. The `tag`
	// filter lives in the URL and is carried for free by localizeUrl.
	// Browser-gated: the page prerenders (url.searchParams is unreadable at
	// build), so SSR HTML is the unfiltered listing and ?tag deep-links apply
	// on hydration.
	let activeTag = $derived(browser ? page.url.searchParams.get('tag') : null);
	const activeLang = persisted<Locale | null>('blog-lang', null); // null = show all languages
	const searchQuery = persisted('blog-q', '');
	const dateFrom = persisted('blog-from', '');
	const dateTo = persisted('blog-to', '');
	const compatibleLang = $derived(
		activeLang.value && languages.includes(activeLang.value) ? activeLang.value : null,
	);

	$effect(() => {
		if (activeLang.value && !languages.includes(activeLang.value)) {
			activeLang.value = null;
		}
	});

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
		const url = new URL(page.url.href);
		if (tag) {
			url.searchParams.set('tag', tag);
		} else {
			url.searchParams.delete('tag');
		}
		gotoPreservingScroll(url.toString(), { replaceState: true });
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

</script>

<!--
  Shared blog listing layout used by BOTH /blog (professional) and /blog/personal.
  Parameterized by category — no category logic inside, just renders what it's given.
  ListingFrame owns the header, search, collapsible filter panel and results column.
-->

<div
	data-testid="blog-listing"
	class="w-full"
	style={accentColor !== 'var(--accent)' ? `--accent: ${accentColor};` : ''}
>
	<ListingFrame
		heading={mobileHeadingText}
		edgeTitle={resolveLocale(siteLabels.pages.blogEdgeTitle, locale)}
		{subtitle}
		onHeaderMount={blueprintScrub}
		filterLabel={mobileFiltersLabel}
		filterPersistKey="blog-mobile-filters-open"
	>
		{#snippet blueprint()}
			<BlogBlueprint />
		{/snippet}

		{#snippet search()}
			<SearchInput
				label={searchPlaceholder}
				placeholder={searchPlaceholder}
				bind:value={searchQuery.value}
				testId="blog-search-sidebar"
			/>
		{/snippet}

		{#snippet filters()}
			<BlogFilterSidebar
				tags={allTags}
				languages={languages}
				activeTag={activeTag}
				activeLang={compatibleLang}
				cornerLink={cornerLink}
				onTagSelect={handleTagSelect}
				onLangSelect={handleLangSelect}
				bind:dateFrom={dateFrom.value}
				bind:dateTo={dateTo.value}
			/>
		{/snippet}

		{#if hasActiveFilters}
			<FilterSummary
				count={filteredPosts.length}
				{countLabel}
				{locale}
				{clearLabel}
				onClear={clearFilters}
			/>
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
						post={post}
						svgContent={svgContents[post.slug] ?? ''}
						accentColor={accentColor}
						index={i}
						data-flip-id={post.slug}
					/>
				{/each}
			</div>
		{/if}
	</ListingFrame>
</div>

<style>
	/* WHY: items render at final state on load (Snappy Doctrine, 17e-2). FLIP
	   handles filter transitions only. The `data-batch="blog-item"` attribute
	   stays as a query target for animateFlipTransition. */

</style>
