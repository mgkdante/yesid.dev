<!--
  Full work listing page layout: header, sidebar filters (desktop) / collapsible
  filter (mobile), and a card grid with GSAP Flip animation on filter changes.
  Service + tag filters use AND logic with URL params via goto().
  Desktop: sticky left sidebar (~220px) + main grid on the right.
  Mobile: collapsible filter button above the grid.
  Respects prefers-reduced-motion — skips FLIP if reduced motion is on.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import type { Project, Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap, Flip, ScrollTrigger } from '$lib/motion/utils/gsap.js';
	import WorkCard from './WorkCard.svelte';
	import WorkFilterSidebar from './WorkFilterSidebar.svelte';
	import WorkFilterMobile from './WorkFilterMobile.svelte';


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
		emptyState: { en: 'No projects match the selected filters.' },
		clearFilters: { en: 'clear filters' }
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
			// WHY: batch CSS sets parent wrappers to opacity:0. After a filter change,
			// new DOM elements have that CSS default. We must reset BOTH the batch
			// wrappers AND the inner cards to visible before FLIP runs.
			const batchItems = document.querySelectorAll('[data-batch="work-item"]');
			gsap.killTweensOf(cards);
			gsap.killTweensOf(batchItems);
			gsap.set(batchItems, { opacity: 1, y: 0 });
			gsap.set(cards, { opacity: 1, y: 0, x: 0, scale: 1 });

			Flip.from(flipState, {
				targets: cards,
				duration: 0.5,
				ease: 'power2.inOut',
				stagger: 0.05,
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

	onMount(() => {
		// WHY: if user prefers reduced motion, skip all animation and just make elements visible
		if (isPrefersReducedMotion()) {
			document.querySelectorAll<HTMLElement>('[data-batch="work-item"]').forEach(el => {
				el.style.opacity = '1';
			});
			return;
		}

		registerGsapPlugins();

		// WHY: ScrollTrigger.batch() groups elements that enter the viewport together
		// into a single wave, producing a staggered cascade rather than N independent tweens.
		// once:true means it won't re-fire after FLIP filter changes — FLIP handles post-filter visibility.
		ScrollTrigger.batch('[data-batch="work-item"]', {
			start: 'top 85%',
			onEnter: (batch) => {
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

<div data-testid="work-listing" class="pb-16">
	<!-- Header -->
	<div class="mb-8" data-batch="work-item">
		<h1 class="font-heading text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
			{resolveLocale(content.heading, 'en')}
		</h1>
		<p class="mt-1 font-mono text-xs text-[#E07800]">
			{resolveLocale(content.subtitle, 'en')}
		</p>
	</div>

	<!-- Mobile filter (hidden on md+) -->
	<WorkFilterMobile
		{serviceIds}
		{serviceMap}
		tags={allTags}
		{activeService}
		{activeTag}
		onServiceSelect={handleServiceSelect}
		onTagSelect={handleTagSelect}
	/>

	<!-- Desktop: sidebar + grid layout -->
	<div class="flex gap-8">
		<!-- Sticky sidebar filter (hidden below md) -->
		<div class="hidden shrink-0 md:block md:sticky md:top-20 md:self-start">
			<WorkFilterSidebar
				{serviceIds}
				{serviceMap}
				tags={allTags}
				{activeService}
				{activeTag}
				onServiceSelect={handleServiceSelect}
				onTagSelect={handleTagSelect}
			/>
		</div>

		<!-- Main content area -->
		<div class="min-w-0 flex-1">
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
						{resolveLocale(content.clearFilters, 'en')}
					</button>
				</div>
			{/if}

			<!-- Card grid -->
			{#if filteredProjects.length === 0}
				<p class="py-12 text-center text-sm text-[var(--text-muted)]" data-testid="work-empty-state">
					{resolveLocale(content.emptyState, 'en')}
				</p>
			{:else}
				<div class="flex flex-col gap-4">
					{#each filteredProjects as project, i (project.slug)}
						<div class="flex gap-4" data-batch="work-item">
							<!-- Metro line + station badge -->
							<div class="flex flex-col items-center">
								<!-- Station badge with sonar pulse effect -->
								<div class="station-badge-wrapper">
									<!-- WHY: stagger delay per card index so pulses feel organic, not synchronized -->
									<div
										class="station-pulse"
										style="animation-delay: {i * 0.4}s;"
									></div>
									<div
										class="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold"
										style="background: #E07800; color: #000;"
									>
										{String(i + 1).padStart(2, '0')}
									</div>
								</div>
								<!-- WHY: SVG line with gradient for DrawSVGPlugin — gradient ID scoped per card via index -->
								<svg
									class="flex-1 block"
									width="2"
									viewBox="0 0 2 100"
									preserveAspectRatio="none"
									aria-hidden="true"
									data-metro-line
									style="min-height: 20px;"
								>
									<defs>
										<linearGradient id="metro-grad-{i}" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stop-color="#E07800" />
											<stop offset="100%" stop-color="#FFB627" />
										</linearGradient>
									</defs>
									<line
										x1="1" y1="0" x2="1" y2="100"
										stroke="url(#metro-grad-{i})"
										stroke-width="2"
									/>
								</svg>
							</div>
							<!-- Card -->
							<div class="min-w-0 flex-1">
								<WorkCard {project} {services} {serviceSvgContents} index={i} />
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	/* WHY: batch items start invisible so GSAP can animate them in on scroll */
	:global([data-batch="work-item"]) {
		opacity: 0;
	}

	/* WHY: respect prefers-reduced-motion — show items immediately without animation */
	@media (prefers-reduced-motion: reduce) {
		:global([data-batch="work-item"]) {
			opacity: 1;
		}
	}

	/* WHY: metro lines show with the card entrance — no separate draw animation.
	   The batch fade-in on the parent wrapper reveals everything together. */
	@media (prefers-reduced-motion: reduce) {
		:global([data-metro-line] line) {
		}
	}

	/* WHY: wrapper provides a positioning context for the absolute pulse ring */
	.station-badge-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* WHY: sonar ping effect radiating from the badge center —
	   absolute positioning keeps it centred without affecting layout */
	.station-pulse {
		position: absolute;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: rgba(224, 120, 0, 0.5);
		animation: station-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
	}

	@keyframes station-ping {
		0% {
			transform: scale(1);
			opacity: 0.6;
		}
		75%, 100% {
			transform: scale(2.5);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.station-pulse {
			animation: none;
			display: none;
		}
	}
</style>
