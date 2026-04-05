<!--
  Shared blog listing layout used by BOTH /blog (professional) and /blog/personal.
  Parameterized by category — no category logic inside, just renders what it's given.
  Includes: search, tag filter, date range filter.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { BlogPost, Locale } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
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
</script>

<div data-testid="blog-listing" class="pb-16">
	<!-- Header -->
	<div class="mb-6" use:reveal>
		<h1 class="font-heading text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
			{heading}
		</h1>
		<p class="mt-1 font-mono text-xs" style="color: {accentColor};">
			{subtitle}
		</p>
	</div>

	<!-- Search bar (full width, above sidebar+content) -->
	<div class="mb-4" use:reveal={{ delay: 50 }}>
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
						class="font-mono text-[10px] underline transition-colors hover:text-[var(--text-primary)]"
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
</style>
