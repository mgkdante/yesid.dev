<script lang="ts">
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import WheelGesturesPlugin from 'embla-carousel-wheel-gestures';
	import type { EmblaCarouselType } from 'embla-carousel';
	import { allowCarouselDrag } from '#lib/utils/carousel-drag.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { persisted } from '@yesid/ui/state';
	import { siteLabels } from '#lib/content/index.ts';
	import type { ProjectSummary, ProofReelContent, Service } from '#lib/types.ts';
	import { SliderButton } from '@yesid/ui/brand';
	import ProjectCard, { alignProjectCards } from '#lib/components/projects/ProjectCard.svelte';

	const locale = getLocale();

	let {
		proofReel: proofReelContent,
		projects,
		services = [],
		serviceSvgContents = {},
	}: {
		proofReel: ProofReelContent;
		projects: readonly ProjectSummary[];
		services?: readonly Service[];
		serviceSvgContents?: Record<string, string>;
	} = $props();

	const carouselPrevAria = $derived(resolveLocale(siteLabels.a11y.carouselPrev, locale));
	const carouselNextAria = $derived(resolveLocale(siteLabels.a11y.carouselNext, locale));
	const viewAllLabel = $derived(resolveLocale(proofReelContent.viewAllLabel, locale));
	const viewAllHref = $derived(proofReelContent.viewAllHref);
	const visibleProjects = $derived(projects);
	const total = $derived(visibleProjects.length);
	// Embla disables loop when the slides barely exceed the viewport (4 projects, 3 per view).
	// A second, hidden set gives it room to wrap at every width.
	const loopCopies = $derived(total > 1 ? visibleProjects : []);

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
	let canScrollPrevious = $state(false);
	let canScrollForward = $state(false);
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
		containScroll: 'trimSnaps' as const,
		watchDrag: allowCarouselDrag,
	};

	function onEmblaInit(event: CustomEvent<EmblaCarouselType>) {
		emblaApi = event.detail;
		const snapCount = emblaApi.scrollSnapList().length;
		const target = snapCount > 0 ? Math.min(Math.max(card.value, 0), snapCount - 1) : 0;
		if (target !== emblaApi.selectedScrollSnap()) {
			emblaApi.scrollTo(target, true);
		}
		const syncPosition = () => {
			if (!emblaApi) return;
			card.value = emblaApi.selectedScrollSnap() % Math.max(total, 1);
			canScrollPrevious = emblaApi.canScrollPrev();
			canScrollForward = emblaApi.canScrollNext();
		};
		// Copies look identical, so resting on the real set is an invisible jump that keeps
		// the clickable, accessible originals in view.
		const restOnRealSet = () => {
			const snap = emblaApi?.selectedScrollSnap() ?? 0;
			if (total > 0 && snap >= total) emblaApi?.scrollTo(snap % total, true);
		};
		syncPosition();
		emblaApi.on('select', syncPosition);
		emblaApi.on('reInit', syncPosition);
		emblaApi.on('settle', restOnRealSet);
		emblaApi.on('reInit', restOnRealSet);
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
		<div class="embla__container" use:alignProjectCards data-ripple-exempt>
			{#each visibleProjects as project, i}
				<div class="embla__slide">
					<ProjectCard {project} {services} {serviceSvgContents} placement="proof" class="w-full" data-active={activeIndex === i} />
				</div>
			{/each}
			{#each loopCopies as project}
				<div class="embla__slide" aria-hidden="true" data-loop-copy>
					<ProjectCard {project} {services} {serviceSvgContents} placement="proof" class="w-full" tabbable={false} data-testid="proof-card-copy" />
				</div>
			{/each}
		</div>
	</div>

	<div class="proof-controls">
		<SliderButton direction="previous" onclick={scrollPrev} aria-label={previousControlAria} data-testid="proof-prev" disabled={!canScrollPrevious} />
		<SliderButton direction="next" onclick={scrollNext} aria-label={nextControlAria} data-testid="proof-next" disabled={!canScrollForward} />
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
		container: proof-reel / inline-size;
		padding-block: clamp(2rem, 4dvh, 4rem);
	}

	.embla {
		--proof-columns: 1;
		--proof-gap: 1.25rem;
		overflow-x: clip;
		overflow-y: visible;
		margin-bottom: 1.5rem;
		padding-block: 0.5rem;
	}

	.embla__container {
		display: flex;
		margin-left: calc(-1 * var(--proof-gap));
		touch-action: pan-y pinch-zoom;
	}

	.embla__slide {
		flex: 0 0 calc(100% / var(--proof-columns));
		min-width: 0;
		padding-left: var(--proof-gap);
		display: flex;
	}

	.proof-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
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
		font-size: var(--text-menu-subtitle);
		font-weight: 700;
		color: var(--accent-text);
	}

	.proof-count-sep,
	.proof-count-total {
		font-size: var(--text-mono);
		color: var(--accent-text);
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

	/* One whole card, then two, then three once each stays readable; never more, even on ultrawide. */
	@container proof-reel (min-width: 45.25rem) {
		.embla { --proof-columns: 2; }
	}

	@container proof-reel (min-width: 70rem) {
		.embla { --proof-columns: 3; }
	}

	@media (--tablet-max) {
		.proof-reel-section {
			padding-block: clamp(2.5rem, 6dvh, 4rem);
		}
	}
</style>
