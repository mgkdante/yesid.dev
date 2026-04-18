<!--
  Rotating testimonial carousel. Auto-rotates 6s, pauses on hover.
  Metro stop label + cursor glow.
  Uses proper ARIA carousel semantics (aria-roledescription="carousel",
  role="group" + aria-roledescription="slide" on active content).
  Kept as manual fade carousel (not embla) to preserve fade transition.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AboutTestimonial } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	let { testimonials, stop = '04', label = 'TESTIMONIALS' }: { testimonials: readonly AboutTestimonial[]; stop?: string; label?: string } = $props();

	let activeIndex = $state(0);
	let paused = $state(false);
	let intervalId: ReturnType<typeof setInterval> | undefined;
	let rootEl = $state<HTMLElement>(undefined!);
	let visibilityObserver: IntersectionObserver | null = null;
	let isVisible = false;

	const ROTATE_MS = 6000;

	function goTo(index: number) {
		activeIndex = index;
		// Reset timer on manual navigation so user gets full 6s to read.
		// Only restart the timer if the carousel is in view — an offscreen
		// click shouldn't wake a paused rotation.
		if (isVisible) startTimer();
	}

	function startTimer() {
		stopTimer();
		intervalId = setInterval(() => {
			if (!paused) {
				activeIndex = (activeIndex + 1) % testimonials.length;
			}
		}, ROTATE_MS);
	}

	function stopTimer() {
		if (intervalId !== undefined) {
			clearInterval(intervalId);
			intervalId = undefined;
		}
	}

	onMount(() => {
		// IO-gate rotation — testimonials only rotate while the carousel
		// is in view. Hover pause (via `paused`) still applies on top.
		visibilityObserver = new IntersectionObserver(
			(entries) => {
				isVisible = entries[0].isIntersecting;
				if (isVisible) startTimer();
				else stopTimer();
			},
			{ rootMargin: '100px' },
		);
		if (rootEl) visibilityObserver.observe(rootEl);
	});
	onDestroy(() => {
		stopTimer();
		visibilityObserver?.disconnect();
		visibilityObserver = null;
	});

	const active = $derived(testimonials[activeIndex]);
	const quote = $derived(resolveLocale(active.quote, 'en'));
	const role = $derived(resolveLocale(active.role, 'en'));
</script>

<div
	bind:this={rootEl}
	class="group h-full"
	use:cursorGlow
>
<Card
	class="h-full p-3"
	data-testid="about-testimonials"
	onmouseenter={() => (paused = true)}
	onmouseleave={() => (paused = false)}
	role="region"
	aria-roledescription="carousel"
	aria-label="Client testimonials"
>
	<div class="relative flex h-full flex-col">
		<!-- Stop label: always top-left -->
		<StopLabel {stop} {label} />

		<!-- Centered content area — active slide -->
		<div
			class="flex flex-1 flex-col justify-center"
			role="group"
			aria-roledescription="slide"
			aria-label="Testimonial {activeIndex + 1} of {testimonials.length}"
		>
			<!-- Decorative quote mark -->
			<div class="text-center font-heading text-5xl leading-none text-[var(--primary)] select-none" aria-hidden="true">
				&ldquo;
			</div>

			<!-- Quote -->
			<div class="min-h-20 flex items-center" aria-live="polite" aria-atomic="true">
				{#key activeIndex}
					<blockquote class="animate-fade-in text-center text-base leading-relaxed text-[var(--foreground)] italic md:text-lg">
						{quote}
					</blockquote>
				{/key}
			</div>

			<!-- Author -->
			<div class="mt-3">
				{#key activeIndex}
					<div class="animate-fade-in text-right">
						<span class="text-sm font-semibold text-[var(--foreground)]">{active.author}</span>
						<span class="text-sm text-[var(--secondary-foreground)]">
							— {role}, {active.company}
						</span>
					</div>
				{/key}
			</div>
		</div>

		<!-- Dot indicators: bottom-left -->
		<div class="mt-auto flex gap-2" role="tablist" aria-label="Testimonial navigation">
			{#each testimonials as _, i}
				<button
					class="h-2 w-2 rounded-full transition-colors duration-300 {i === activeIndex
						? 'bg-[var(--primary)]'
						: 'bg-[var(--popover)] hover:bg-[var(--muted-foreground)]'}"
					aria-label="Show testimonial {i + 1}"
					aria-selected={i === activeIndex}
					role="tab"
					onclick={() => goTo(i)}
				></button>
			{/each}
		</div>
	</div>
</Card>
</div>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}
	:global(.animate-fade-in) {
		animation: fade-in 0.4s ease-out;
	}
</style>
