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
	import { registerGsapPlugins, gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';
	import BlogRow from './BlogRow.svelte';
	import BlogFilterSidebar from './BlogFilterSidebar.svelte';
	import BlogFilterMobile from './BlogFilterMobile.svelte';


	let {
		posts,
		allTags,
		languages = [],
		heading,
		subtitle,
		accentColor = '#E07800',
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
		const url = new URL($page.url);
		if (tag) {
			url.searchParams.set('tag', tag);
		} else {
			url.searchParams.delete('tag');
		}
		goto(url.toString(), { replaceState: true, noScroll: true });
	}

	function handleLangSelect(lang: Locale | null) {
		activeLang = lang;
	}

	function clearFilters() {
		searchQuery = '';
		dateFrom = '';
		dateTo = '';
		activeLang = null;
		handleTagSelect(null);
	}

	let hasActiveFilters = $derived(
		!!activeTag || !!activeLang || searchQuery.trim() !== '' || dateFrom !== '' || dateTo !== ''
	);

	// WHY: after a filter change, Svelte re-renders BlogRow elements which start
	// at opacity:0 from the batch CSS. The batch onEnter (once:true) already fired
	// on initial load, so it won't re-fire. This effect resets new items to visible.
	let batchFired = false;
	$effect(() => {
		// Subscribe to filteredPosts so this runs on every filter change
		filteredPosts;
		if (batchFired && typeof document !== 'undefined') {
			// Use tick-level delay so Svelte finishes rendering new DOM first
			requestAnimationFrame(() => {
				document.querySelectorAll<HTMLElement>('[data-batch="blog-item"]').forEach(el => {
					el.style.opacity = '1';
					el.style.transform = 'translateY(0)';
				});
			});
		}
	});

	onMount(() => {
		// WHY: if user prefers reduced motion, skip all animation and just make elements visible
		if (isPrefersReducedMotion()) {
			document.querySelectorAll<HTMLElement>('[data-batch="blog-item"]').forEach(el => {
				el.style.opacity = '1';
			});
			return;
		}

		registerGsapPlugins();

		// WHY: ScrollTrigger.batch() groups elements that enter the viewport together
		// into a single wave, producing a staggered cascade rather than N independent tweens
		ScrollTrigger.batch('[data-batch="blog-item"]', {
			start: 'top 85%',
			onEnter: (batch) => {
				batchFired = true;
				gsap.fromTo(batch,
					{ opacity: 0, y: 20 },
					{ opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.4)' }
				);
			},
			once: true
		});

		return () => {
			ScrollTrigger.getAll().forEach(t => t.kill());
		};
	});
</script>

<div data-testid="blog-listing" class="pb-16">
	<!-- Header -->
	<div class="mb-6" data-batch="blog-item">
		<h1 class="font-heading text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
			{heading}
		</h1>
		<p class="mt-1 font-mono text-xs" style="color: {accentColor};">
			{subtitle}
		</p>
	</div>

	<!-- Search bar (full width, above sidebar+content) -->
	<div class="mb-4" data-batch="blog-item">
		<div class="relative">
			<input
				type="text"
				placeholder="Search posts by title, content, or tag..."
				bind:value={searchQuery}
				class="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2.5 pl-10 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)]"
				style="--accent: {accentColor};"
				data-testid="blog-search"
			/>
			<!-- Search icon -->
			<svg class="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={accentColor} stroke-width="1.5">
				<circle cx="7" cy="7" r="5"/>
				<line x1="11" y1="11" x2="14" y2="14"/>
			</svg>
		</div>
	</div>

	<!-- Mobile filter -->
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

	<!-- Main layout: sidebar + posts -->
	<div class="flex gap-6">
		<BlogFilterSidebar
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

		<!-- Post list -->
		<div class="min-w-0 flex-1">
			{#if hasActiveFilters}
				<div class="mb-3 flex items-center gap-2">
					<span class="text-xs text-[var(--text-muted)]">
						{filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}
					</span>
					<button
						class="font-mono text-caption underline transition-colors hover:text-[var(--text-primary)]"
						style="color: {accentColor};"
						onclick={clearFilters}
					>
						clear filters
					</button>
				</div>
			{/if}

			{#if filteredPosts.length === 0}
				<p class="py-12 text-center text-sm text-[var(--text-muted)]">
					No posts found. Try adjusting your filters.
				</p>
			{:else}
				<div class="flex flex-col gap-3">
					{#each filteredPosts as post, i (post.slug)}
						<BlogRow
							{post}
							svgContent={svgContents[post.slug] ?? ''}
							{accentColor}
							index={i}
							featured={i === 0}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	input:focus {
		border-color: var(--accent);
		box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 15%, transparent);
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
