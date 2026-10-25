<script lang="ts">
	import type { AboutLabels, AboutTestimonial } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { fillTemplate } from '#lib/utils/labels.ts';
	import { cursorGlow } from '@yesid/motion/actions';
	import { StopLabel } from '#lib/components/brand/index.ts';
	import { Card } from '#lib/components/ui/card/index.ts';

	const locale = getLocale();

	let {
		testimonials,
		stop,
		label,
		labels,
	}: {
		testimonials: readonly AboutTestimonial[];
		stop: string;
		label: string;
		labels: AboutLabels;
	} = $props();

	let activeIndex = $state(0);
	const active = $derived(testimonials[activeIndex] ?? testimonials[0]);
	const quote = $derived(active ? resolveLocale(active.quote, locale) : '');
	const role = $derived(active ? resolveLocale(active.role, locale) : '');
	const author = $derived(active?.author ?? '');
	const hasSlides = $derived(testimonials.length > 1);
	const carouselAria = $derived(resolveLocale(labels.testimonialsCarouselAria, locale));
	const tabNavAria = $derived(resolveLocale(labels.testimonialsTabNavAria, locale));
	const prevAria = $derived(resolveLocale(labels.testimonialsPrevAria, locale));
	const nextAria = $derived(resolveLocale(labels.testimonialsNextAria, locale));
	const slideAria = $derived(
		fillTemplate(resolveLocale(labels.testimonialSlideAria, locale), {
			index: String(activeIndex + 1),
			total: String(testimonials.length),
		}),
	);

	function previous() {
		if (testimonials.length === 0) return;
		activeIndex = (activeIndex - 1 + testimonials.length) % testimonials.length;
	}

	function next() {
		if (testimonials.length === 0) return;
		activeIndex = (activeIndex + 1) % testimonials.length;
	}

	function goTo(index: number) {
		activeIndex = index;
	}

	function showSlideAria(index: number): string {
		return fillTemplate(resolveLocale(labels.showTestimonialAria, locale), {
			index: String(index + 1),
		});
	}
</script>

<div class="group h-full" use:cursorGlow>
	<Card class="h-full min-h-[19rem] p-3" data-testid="about-testimonials" role="region" aria-label={carouselAria}>
		<div class="relative flex flex-col">
			<StopLabel {stop} {label} as="h2" />

			<div class="pr-1" data-testid="about-quote-body" aria-label={slideAria} aria-live="polite">
				<div class="flex flex-col justify-center">
					<div class="font-heading text-7xl leading-none text-[var(--primary)] select-none" aria-hidden="true">
						&ldquo;
					</div>

					<blockquote class="-mt-2 max-w-xl text-pretty text-xl leading-tight font-semibold text-[var(--foreground)] md:text-2xl">
						{quote}
					</blockquote>

					<div class="mt-5 flex items-center gap-3">
						<span class="h-px w-10 bg-[var(--primary)]" aria-hidden="true"></span>
						<div class="min-w-0">
							<div class="font-mono text-caption font-bold tracking-[0.12em] text-[var(--accent-text)]">
								{author}
							</div>
							{#if role}
								<div class="mt-1 font-mono text-[0.64rem] tracking-[0.1em] text-[var(--muted-foreground)]">
									{role}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			{#if hasSlides}
				<div class="mt-3 flex shrink-0 items-center justify-between gap-3" data-testid="about-quote-controls">
					<button
						type="button"
						class="quote-arrow tap-press"
						aria-label={prevAria}
						onclick={previous}
					>
						‹
					</button>
					<div class="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1" role="tablist" aria-label={tabNavAria}>
						{#each testimonials as _testimonial, i}
							<button
								type="button"
								class="quote-dot"
								class:quote-dot-active={i === activeIndex}
								data-testid="about-quote-dot"
								aria-label={showSlideAria(i)}
								aria-selected={i === activeIndex}
								role="tab"
								onclick={() => goTo(i)}
							></button>
						{/each}
					</div>
					<button
						type="button"
						class="quote-arrow tap-press"
						aria-label={nextAria}
						onclick={next}
					>
						›
					</button>
				</div>
			{/if}
		</div>
	</Card>
</div>

<style>
	.quote-arrow {
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		flex-shrink: 0;
		place-items: center;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-pill);
		background: var(--card);
		box-shadow: inset 0 1px 0 var(--edge-highlight);
		color: var(--foreground);
		font-family: var(--font-heading);
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		transition:
			border-color var(--duration-fast) var(--ease-default),
			color var(--duration-fast) var(--ease-default),
			transform var(--duration-fast) var(--ease-default);
	}

	.quote-arrow:hover {
		border-color: var(--primary);
		color: var(--primary);
		transform: translateY(-1px);
	}

	.quote-dot {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 0;
		background: transparent;
		cursor: pointer;
	}

	.quote-dot::after {
		content: '';
		width: 0.55rem;
		height: 0.55rem;
		border: 1px solid var(--primary);
		border-radius: var(--radius-pill);
		background: transparent;
		transition:
			background var(--duration-fast) var(--ease-default),
			transform var(--duration-fast) var(--ease-default);
	}

	.quote-dot-active::after {
		background: var(--primary);
		transform: scale(1.25);
	}
</style>
