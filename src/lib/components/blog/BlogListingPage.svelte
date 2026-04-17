<!--
  Shared blog listing layout used by BOTH /blog (professional) and /blog/personal.
  Parameterized by category — no category logic inside, just renders what it's given.
  Includes: search, tag filter, date range filter.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { BlogPost, Locale } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { captureFlipState, animateFlipTransition } from '$lib/motion/utils/flip.js';
	import { loadDrawSVG, loadFlip, initScrollTriggerConfig } from '$lib/motion/utils/gsap.js';
	import { createDrawScrub } from '$lib/motion/scrubs/index.js';
	import SearchInput from '$lib/components/shared/SearchInput.svelte';
	import FilterSummary from '$lib/components/shared/FilterSummary.svelte';
	import BlogRow from './BlogRow.svelte';
	import BlogFilterSidebar from './BlogFilterSidebar.svelte';
	import BlogFilterMobile from './BlogFilterMobile.svelte';
	import BlogBlueprint from './BlogBlueprint.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';

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

	// Blueprint draw-scrub: paths stroke-dash from 0% → 100% as user scrolls
	// through the listing page section. DrawSVG plugin lazy-loaded at mount.
	let blueprintWrapEl = $state<HTMLElement>(undefined!);
	let listingSectionEl = $state<HTMLElement>(undefined!);
	let destroyDrawScrub: (() => void) | undefined;

	onMount(async () => {
		if (!browser) return;

		// Flip is loaded regardless of reduced-motion — filter transitions
		// use captureFlipState/animateFlipTransition on every filter change
		// (animations short-circuit on reduced-motion inside flip.ts).
		// DrawSVG is only needed for the Blueprint scroll-scrub.
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

<div
	bind:this={listingSectionEl}
	data-testid="blog-listing"
	class="w-full pb-16"
	style={accentColor !== 'var(--accent)' ? `--accent: ${accentColor};` : ''}
>
	<!-- Section 1: Header — blueprint visualization -->
	<section class="w-full">
		<div bind:this={blueprintWrapEl} class="blog-blueprint-header" data-batch="blog-item">
			<BlogBlueprint />
			<!-- Subtitle: always visible, overlaid on blueprints -->
			<div class="blog-header-text">
				<!-- "Blog." heading: only on mobile (edge title in route layout carries it on desktop) -->
				<h1 class="blog-mobile-heading">Blog<span class="text-[var(--primary)]">.</span></h1>
				<div class="blog-header-subtitle">{subtitle}</div>
			</div>
		</div>
	</section>

	<Separator variant="hazard" />

	<!-- Section 2: Listing — filter sidebar + posts in CSS Grid -->
	<section class="blog-listing-grid">
		<aside class="blog-filter-column">
			<div class="sticky top-8 max-h-[calc(100dvh-6rem)] overflow-y-auto px-4 py-4" use:scrollChain>
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
		</aside>

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
	</section>
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

	/* Hide "Blog." heading on desktop (edge title in route layout carries it) */
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

	/* Recipe 3: Filter sidebar + content */
	.blog-listing-grid {
		display: grid;
		grid-template-columns: 1fr;
		width: 100%;
	}

	.blog-filter-column {
		display: none;
	}

	@media (min-width: 1024px) {
		.blog-listing-grid {
			grid-template-columns: clamp(220px, 22vw, 320px) 1fr;
		}
		.blog-filter-column {
			display: block;
		}
	}

	/* WHY: items render at final state on load (Snappy Doctrine, 17e-2). FLIP
	   handles filter transitions only. The `data-batch="blog-item"` attribute
	   stays as a query target for animateFlipTransition. */

</style>
