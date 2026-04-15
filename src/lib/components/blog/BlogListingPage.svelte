<!--
  Shared blog listing layout used by BOTH /blog (professional) and /blog/personal.
  Parameterized by category — no category logic inside, just renders what it's given.
  Includes: search, tag filter, date range filter.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { BlogPost, Locale } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { useListingEntrance, captureFlipState, animateFlipTransition } from '$lib/motion/utils/listingAnimations.js';
	import SearchInput from '$lib/components/shared/SearchInput.svelte';
	import FilterSummary from '$lib/components/shared/FilterSummary.svelte';
	import BlogRow from './BlogRow.svelte';
	import BlogFilterSidebar from './BlogFilterSidebar.svelte';
	import BlogFilterMobile from './BlogFilterMobile.svelte';
	import BlogBlueprint from './BlogBlueprint.svelte';
	import { SectionWrapper } from '$lib/components/shells';
	import { Separator } from '$lib/components/ui/separator';

	let {
		posts,
		allTags,
		languages = [],
		heading,
		subtitle,
		accentColor = 'var(--primary)',
		cornerLink = null,
		svgContents = {}
	}: {
		posts: readonly BlogPost[];
		allTags: readonly string[];
		languages?: readonly Locale[];
		heading: string;
		subtitle: string;
		accentColor?: string;
		cornerLink?: { href: string; label: string; subtitle: string } | null;
		svgContents?: Record<string, string>;
	} = $props();

	// Filter state
	let activeTag = $derived($page.url.searchParams.get('tag'));
	let activeLang = $state<Locale | null>(null); // null = show all languages
	let searchQuery = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');

	// Apply all filters
	let filteredPosts = $derived.by(() => {
		let result = [...posts];

		// Language filter
		if (activeLang) {
			result = result.filter((p) => p.lang === activeLang);
		}

		// Tag filter
		if (activeTag) {
			result = result.filter((p) => p.tags.includes(activeTag!));
		}

		// Search filter (title, excerpt, tags)
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			result = result.filter((p) => {
				const title = resolveLocale(p.title, 'en').toLowerCase();
				const excerpt = resolveLocale(p.excerpt, 'en').toLowerCase();
				const tags = p.tags.join(' ').toLowerCase();
				return title.includes(q) || excerpt.includes(q) || tags.includes(q);
			});
		}

		// Date range filter
		if (dateFrom) {
			result = result.filter((p) => p.date >= dateFrom);
		}
		if (dateTo) {
			result = result.filter((p) => p.date <= dateTo);
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
		activeLang = lang;
	}

	function clearFilters() {
		flipState = captureFlipState();
		searchQuery = '';
		dateFrom = '';
		dateTo = '';
		activeLang = null;
		handleTagSelect(null);
	}

	let hasActiveFilters = $derived(
		!!activeTag || !!activeLang || searchQuery.trim() !== '' || dateFrom !== '' || dateTo !== ''
	);

	let batchFired = false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let flipState: any = null;

	$effect(() => {
		filteredPosts;
		animateFlipTransition('[data-batch="blog-item"]', flipState, batchFired, () => { flipState = null; });
	});

	onMount(() => {
		useListingEntrance('[data-batch="blog-item"]', () => { batchFired = true; });
	});
</script>

<div
	data-testid="blog-listing"
	class="w-full pb-16"
	style={accentColor !== 'var(--accent)' ? `--accent: ${accentColor};` : ''}
>
	<!-- Section 1: Header — blueprint visualization -->
	<SectionWrapper layout="bleed" container="none">
		<div class="blog-blueprint-header" data-batch="blog-item">
			<BlogBlueprint />
			<!-- Subtitle: always visible, overlaid on blueprints -->
			<div class="blog-header-text">
				<!-- "Blog." heading: only on mobile (EdgeRail carries it on desktop) -->
				<h1 class="blog-mobile-heading">Blog<span class="text-[var(--primary)]">.</span></h1>
				<div class="blog-header-subtitle">{subtitle}</div>
			</div>
		</div>
	</SectionWrapper>

	<Separator variant="hazard" />

	<!-- Section 2: Listing — filters in sideLeft (section-scoped), posts in content -->
	<SectionWrapper layout="centered" container="none" style="--edge-left: clamp(220px, 22vw, 320px)">
		{#snippet sideLeft()}
			<div class="sticky top-8 max-h-[calc(100dvh-6rem)] overflow-y-auto px-4 py-4">
				<BlogFilterSidebar
					tags={allTags}
					{languages}
					{activeTag}
					{activeLang}
					{accentColor}
					{cornerLink}
					bind:searchQuery
					onTagSelect={handleTagSelect}
					onLangSelect={handleLangSelect}
					bind:dateFrom
					bind:dateTo
				/>
			</div>
		{/snippet}

		<!-- Listing content with padding -->
		<div class="px-4 py-6 md:px-6 md:py-8">

		<!-- Mobile search (always visible below lg, hidden when sideLeft shows it) -->
		<div class="mb-4 lg:hidden">
			<SearchInput placeholder="Search posts..." bind:value={searchQuery} testId="blog-search-mobile" />
		</div>

		<!-- Mobile filter (visible below lg, hidden when sideLeft shows) -->
		<BlogFilterMobile
			tags={allTags}
			{languages}
			{activeTag}
			{activeLang}
			{accentColor}
			{cornerLink}
			onTagSelect={handleTagSelect}
			onLangSelect={handleLangSelect}
			bind:dateFrom
			bind:dateTo
		/>

		{#if hasActiveFilters}
			<FilterSummary count={filteredPosts.length} noun="result" onClear={clearFilters} />
		{/if}

		{#if filteredPosts.length === 0}
			<p class="py-12 text-center text-sm text-[var(--muted-foreground)]">
				No posts found. Try adjusting your filters.
			</p>
		{:else}
			<div class="flex flex-col gap-4">
				{#each filteredPosts as post, i (post.slug)}
					<BlogRow
						{post}
						svgContent={svgContents[post.slug] ?? ''}
						{accentColor}
						index={i}
						featured={i === 0}
						data-flip-id={post.slug}
					/>
				{/each}
			</div>
		{/if}
		</div>
	</SectionWrapper>
</div>

<style>
	/* --- Blog header: blueprint visualization --- */
	.blog-blueprint-header {
		position: relative;
		height: calc(100px + 5rem);
		overflow: hidden;
		margin-top: -5rem;
		padding-top: 5rem;
	}

	/* Desktop: taller header */
	@media (min-width: 1024px) {
		.blog-blueprint-header {
			height: calc(160px + 5rem);
		}
	}

	.blog-header-text {
		position: absolute;
		z-index: 20;
		bottom: 1rem;
		left: var(--space-page-x);
	}

	.blog-mobile-heading {
		font-family: var(--font-heading);
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 900;
		color: var(--foreground);
		letter-spacing: -1px;
		line-height: 1;
	}

	/* Hide "Blog." heading on desktop (EdgeRail carries it) */
	@media (min-width: 1024px) {
		.blog-mobile-heading { display: none; }
	}

	.blog-header-subtitle {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--foreground);
		letter-spacing: 2px;
		text-transform: uppercase;
		margin-top: 0.35rem;
	}

	/* Desktop: large to differentiate from blueprint labels */
	@media (min-width: 1024px) {
		.blog-header-subtitle {
			font-size: 1.1rem;
			letter-spacing: 5px;
		}
	}

	/* WHY: batch items start invisible so GSAP can animate them in on scroll */
	:global([data-batch="blog-item"]) {
		opacity: 0;
	}

	/* WHY: respect prefers-reduced-motion — show items immediately without animation */
	@media (prefers-reduced-motion: reduce) {
		:global([data-batch="blog-item"]) {
			opacity: 1;
		}
	}

</style>
