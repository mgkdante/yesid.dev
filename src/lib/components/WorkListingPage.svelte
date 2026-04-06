<!--
  Full work listing page layout: header, service filter pills, tag filter pills,
  and a card grid with GSAP Flip animation on filter changes.
  Service + tag filters use AND logic with URL params via goto().
  Respects prefers-reduced-motion — skips FLIP if reduced motion is on.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import type { Project, Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap, Flip } from '$lib/motion/utils/gsap.js';
	import WorkCard from './WorkCard.svelte';

	let {
		projects,
		allTags,
		serviceIds,
		services,
		serviceSvgContents
	}: {
		projects: readonly Project[];
		allTags: readonly string[];
		serviceIds: readonly string[];
		services: readonly Service[];
		serviceSvgContents: Record<string, string>;
	} = $props();

	// i18n content — all user-facing strings go through LocalizedString
	const content = {
		heading: { en: 'Work' },
		subtitle: { en: 'Projects, pipelines, and systems I have built.' },
		allFilter: { en: 'All' },
		emptyState: { en: 'No projects match the selected filters.' },
		servicesLabel: { en: 'Services' },
		tagsLabel: { en: 'Tags' }
	};

	// Filter state — read from URL params
	let activeService = $derived($page.url.searchParams.get('service'));
	let activeTag = $derived($page.url.searchParams.get('tag'));

	// Apply filters: service + tag use AND logic
	let filteredProjects = $derived.by(() => {
		let result = [...projects];

		if (activeService) {
			result = result.filter((p) => p.relatedServices.includes(activeService!));
		}

		if (activeTag) {
			result = result.filter((p) => p.tags.includes(activeTag!));
		}

		return result;
	});

	// FLIP animation on filter changes
	async function updateFilter(type: 'service' | 'tag', value: string | null) {
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
			Flip.from(flipState, {
				targets: cards,
				duration: 0.5,
				ease: 'power2.inOut',
				stagger: 0.05,
				absolute: true,
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

	// Build a lookup from service ID to service title for the filter pills
	let serviceMap = $derived(
		new Map(services.map((s) => [s.id, resolveLocale(s.title, 'en')]))
	);

	let hasActiveFilters = $derived(!!activeService || !!activeTag);
</script>

<div data-testid="work-listing" class="pb-16">
	<!-- Header -->
	<div class="mb-8" use:reveal>
		<h1 class="font-heading text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
			{resolveLocale(content.heading, 'en')}
		</h1>
		<p class="mt-1 font-mono text-xs text-[#E07800]">
			{resolveLocale(content.subtitle, 'en')}
		</p>
	</div>

	<!-- Service filter row -->
	<div class="mb-3" use:reveal={{ delay: 50 }}>
		<div class="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
			{resolveLocale(content.servicesLabel, 'en')}
		</div>
		<div class="flex flex-wrap gap-2">
			<button
				class="filter-pill"
				class:active={!activeService}
				onclick={() => handleServiceSelect(null)}
				data-testid="service-filter-all"
			>
				{resolveLocale(content.allFilter, 'en')}
			</button>
			{#each serviceIds as svcId}
				<button
					class="filter-pill"
					class:active={activeService === svcId}
					onclick={() => handleServiceSelect(activeService === svcId ? null : svcId)}
					data-testid="service-filter-{svcId}"
				>
					{serviceMap.get(svcId) ?? svcId}
				</button>
			{/each}
		</div>
	</div>

	<!-- Tag filter row -->
	<div class="mb-6" use:reveal={{ delay: 100 }}>
		<div class="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
			{resolveLocale(content.tagsLabel, 'en')}
		</div>
		<div class="flex flex-wrap gap-2">
			<button
				class="filter-pill"
				class:active={!activeTag}
				onclick={() => handleTagSelect(null)}
				data-testid="tag-filter-all"
			>
				{resolveLocale(content.allFilter, 'en')}
			</button>
			{#each allTags as tag}
				<button
					class="filter-pill"
					class:active={activeTag === tag}
					onclick={() => handleTagSelect(activeTag === tag ? null : tag)}
					data-testid="tag-filter-{tag}"
				>
					{tag}
				</button>
			{/each}
		</div>
	</div>

	<!-- Active filter summary -->
	{#if hasActiveFilters}
		<div class="mb-4 flex items-center gap-2">
			<span class="text-xs text-[var(--text-muted)]">
				{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
			</span>
			<button
				class="font-mono text-[10px] text-[#E07800] underline transition-colors hover:text-[var(--text-primary)]"
				onclick={() => {
					const url = new URL($page.url);
					url.searchParams.delete('service');
					url.searchParams.delete('tag');
					goto(url.toString(), { replaceState: true, noScroll: true });
				}}
			>
				clear filters
			</button>
		</div>
	{/if}

	<!-- Card grid -->
	{#if filteredProjects.length === 0}
		<p class="py-12 text-center text-sm text-[var(--text-muted)]" data-testid="work-empty-state">
			{resolveLocale(content.emptyState, 'en')}
		</p>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each filteredProjects as project, i (project.slug)}
				<WorkCard
					{project}
					{serviceSvgContents}
					index={i}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Filter pill base and active states */
	.filter-pill {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		border: 1px solid #2a2a2a;
		background: transparent;
		color: var(--text-secondary);
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.filter-pill:hover {
		border-color: color-mix(in srgb, #E07800 50%, transparent);
		color: var(--text-primary);
	}

	.filter-pill.active {
		background: #E07800;
		border-color: #E07800;
		color: #0a0a0a;
	}
</style>
