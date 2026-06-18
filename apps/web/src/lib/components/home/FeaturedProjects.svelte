<script lang="ts">
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import WheelGesturesPlugin from 'embla-carousel-wheel-gestures';
	import type { EmblaCarouselType } from 'embla-carousel';
	import { allowCarouselDrag } from '$lib/utils/carousel-drag';
	import { resolveLocale } from '$lib/utils';
	import { getLocale } from '$lib/utils/locale-context';
	import { persisted } from '$lib/state/persisted.svelte';
	import { pendingRestore } from '$lib/state/locale-handoff.svelte';
	import { siteLabels } from '$lib/content';
	import type { Project, ProofReelContent, Service } from '$lib/types';
	import ProjectCard from '$lib/components/projects/ProjectCard.svelte';

	const locale = getLocale();

	let {
		proofReel: proofReelContent,
		projects,
		services = [],
		serviceSvgContents = {},
	}: {
		proofReel: ProofReelContent;
		projects: readonly Project[];
		services?: readonly Service[];
		serviceSvgContents?: Record<string, string>;
	} = $props();

	const carouselPrevAria = $derived(resolveLocale(siteLabels.a11y.carouselPrev, locale));
	const carouselNextAria = $derived(resolveLocale(siteLabels.a11y.carouselNext, locale));
	const viewAllLabel = $derived(resolveLocale(proofReelContent.viewAllLabel, locale));
	const viewAllHref = $derived(proofReelContent.viewAllHref);
	const visibleProjects = $derived(projects);
	const total = $derived(visibleProjects.length);

	function wrapCarouselIndex(index: number, count: number): number {
		if (count <= 0) return 0;
		return ((index % count) + count) % count;
	}

	function clampCarouselIndex(index: number, count: number): number {
		if (count <= 0) return 0;
		return Math.min(Math.max(index, 0), count - 1);
	}

	function formatCarouselPosition(index: number, count: number) {
		const safeTotal = Math.max(0, count);
		const wrappedIndex = wrapCarouselIndex(index, safeTotal);
		const current = safeTotal > 0 ? String(wrappedIndex + 1).padStart(2, '0') : '00';
		const totalLabel = String(safeTotal).padStart(2, '0');

		return {
			current,
			index: wrappedIndex,
			label: `${current} / ${totalLabel}`,
			total: totalLabel,
		};
	}

	let emblaApi: EmblaCarouselType | undefined = $state(undefined);
	const card = persisted<number>('featured-card', 0);
	let currentIndex = $derived(card.value);
	const activeIndex = $derived(clampCarouselIndex(currentIndex, total));
	const currentPosition = $derived(formatCarouselPosition(activeIndex, total));
	const previousControlAria = $derived(carouselPrevAria);
	const nextControlAria = $derived(carouselNextAria);

	const emblaOptions = {
		loop: true,
		align: 'start' as const,
		slidesToScroll: 1,
		containScroll: false as const,
		watchDrag: allowCarouselDrag,
	};

	function onEmblaInit(event: CustomEvent<EmblaCarouselType>) {
		emblaApi = event.detail;
		const snapCount = emblaApi.scrollSnapList().length;
		const pending = pendingRestore('featured-card');
		const saved = typeof pending === 'number' ? pending : card.value;
		const target = snapCount > 0 ? Math.min(Math.max(saved, 0), snapCount - 1) : 0;
		if (target !== emblaApi.selectedScrollSnap()) {
			emblaApi.scrollTo(target, true);
		}
		card.value = emblaApi.selectedScrollSnap();
		emblaApi.on('select', () => {
			if (emblaApi) card.value = emblaApi.selectedScrollSnap();
		});
	}

	function scrollPrev() {
		emblaApi?.scrollPrev();
	}

	function scrollNext() {
		emblaApi?.scrollNext();
	}
</script>

<section
	data-testid="proof-reel-section"
	class="proof-reel-section relative px-[var(--space-page-x)] lg:min-h-dvh lg:flex lg:flex-col lg:justify-center"
>
	<div
		class="embla"
		use:emblaCarouselSvelte={{ options: emblaOptions, plugins: [WheelGesturesPlugin()] }}
		onemblaInit={onEmblaInit}
	>
		<div class="embla__container">
			{#each visibleProjects as project, i}
				<div class="embla__slide">
					<ProjectCard
						{project}
						{services}
						{serviceSvgContents}
						variant="proof"
						cardSize="proof"
						testId="proof-card"
						mediaTestId="proof-card-image"
						titleTestId="proof-card-title"
						excerptTestId="proof-excerpt"
						metricTestPrefix="proof"
						class="w-full"
						data-active={activeIndex === i}
					/>
				</div>
			{/each}
		</div>
	</div>

	<div class="proof-controls">
		<button
			type="button"
			class="proof-control-btn"
			onclick={scrollPrev}
			aria-label={previousControlAria}
			data-testid="proof-prev"
		>
			<span class="proof-control-arrow" aria-hidden="true">←</span>
		</button>
		<button
			type="button"
			class="proof-control-btn"
			onclick={scrollNext}
			aria-label={nextControlAria}
			data-testid="proof-next"
		>
			<span class="proof-control-arrow" aria-hidden="true">→</span>
		</button>
		<div class="proof-count" aria-live="polite" aria-label={currentPosition.label} data-testid="proof-count">
			<span class="proof-count-current">{currentPosition.current}</span>
			<span class="proof-count-sep">/</span>
			<span class="proof-count-total">{currentPosition.total}</span>
		</div>
		<a
			data-testid="proof-view-all"
			href={viewAllHref}
			class="home-view-all tap-feedback ml-auto inline-flex items-center font-mono text-caption tracking-wider md:text-mono"
		>{viewAllLabel}</a>
	</div>
</section>

<style>
	.proof-reel-section {
		padding-block: clamp(2rem, 4dvh, 4rem);
	}

	.embla {
		overflow-x: clip;
		overflow-y: visible;
		margin-bottom: 1.5rem;
		padding-block: 0.5rem;
	}

	.embla__container {
		display: flex;
		touch-action: pan-y pinch-zoom;
	}

	.embla__slide {
		flex: 0 0 100%;
		min-width: 0;
		margin-right: 1.25rem;
		display: flex;
	}

	.proof-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.proof-control-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 999px;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--primary) 35%, transparent);
		color: var(--primary);
		font-family: var(--font-mono);
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			background 200ms ease-out,
			border-color 200ms ease-out;
	}

	.proof-control-btn:hover {
		background: color-mix(in srgb, var(--primary) 10%, transparent);
		border-color: color-mix(in srgb, var(--primary) 55%, transparent);
	}

	.proof-control-arrow {
		font-size: 1.125rem;
		line-height: 1;
	}

	.proof-count {
		display: inline-flex;
		align-items: baseline;
		gap: 0.375rem;
		margin-left: 0.5rem;
		font-family: var(--font-mono);
		letter-spacing: 0.15em;
		flex-shrink: 0;
		white-space: nowrap;
	}

	.proof-count-current {
		font-size: 1rem;
		font-weight: 700;
		color: var(--accent-text);
	}

	.proof-count-sep,
	.proof-count-total {
		font-size: 0.875rem;
		color: color-mix(in srgb, var(--accent-text) 85%, transparent);
	}

	.home-view-all {
		color: var(--primary);
		border-bottom: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
		min-height: 2.75rem;
		padding-inline: 0.25rem;
		transition: border-color var(--duration-normal) var(--ease-default);
	}

	.home-view-all:hover {
		border-color: color-mix(in srgb, var(--primary) 60%, transparent);
	}

	@media (min-width: 768px) {
		.embla__slide {
			flex-basis: clamp(340px, 44vw, 720px);
		}
	}

	@media (max-width: 767px) {
		.proof-reel-section {
			padding-block: clamp(2.5rem, 6dvh, 4rem);
		}
	}
</style>
