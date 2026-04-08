<!--
  Rotating testimonial carousel. Auto-rotates 6s, pauses on hover.
  Metro stop label + cursor glow.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AboutTestimonial } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { tilt } from '$lib/motion/actions/tilt.js';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';

	let { testimonials, stop = '04', label = 'TESTIMONIALS' }: { testimonials: readonly AboutTestimonial[]; stop?: string; label?: string } = $props();

	let activeIndex = $state(0);
	let paused = $state(false);
	let intervalId: ReturnType<typeof setInterval> | undefined;

	const ROTATE_MS = 6000;

	function goTo(index: number) {
		activeIndex = index;
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

	onMount(() => { startTimer(); });
	onDestroy(() => { stopTimer(); });

	const active = $derived(testimonials[activeIndex]);
	const quote = $derived(resolveLocale(active.quote, 'en'));
	const role = $derived(resolveLocale(active.role, 'en'));
</script>

<div
	class="group bento-card relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3"
	data-testid="about-testimonials"
	use:reveal
	use:tilt={{ maxDeg: 1, perspective: 800 }}
	use:cursorGlow
	onmouseenter={() => (paused = true)}
	onmouseleave={() => (paused = false)}
	role="region"
	aria-label="Client testimonials"
>
	<!-- Cursor glow -->
	<div class="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		style="background: radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(224,120,0,0.06), transparent 60%);"
	></div>

	<div class="relative flex h-full flex-col">
		<!-- Stop label: always top-left -->
		<div class="stop-label">STOP {stop} — {label}</div>

		<!-- Centered content area -->
		<div class="flex flex-1 flex-col justify-center">
			<!-- Decorative quote mark -->
			<div class="text-center font-heading text-5xl leading-none text-[var(--brand-primary)] select-none" aria-hidden="true">
				&ldquo;
			</div>

			<!-- Quote -->
			<div class="min-h-[80px] flex items-center">
				{#key activeIndex}
					<blockquote class="animate-fade-in text-center text-base leading-relaxed text-[var(--text-primary)] italic md:text-lg">
						{quote}
					</blockquote>
				{/key}
			</div>

			<!-- Author -->
			<div class="mt-3">
				{#key activeIndex}
					<div class="animate-fade-in text-right">
						<span class="text-sm font-semibold text-[var(--text-primary)]">{active.author}</span>
						<span class="text-sm text-[var(--text-secondary)]">
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
						? 'bg-[var(--brand-primary)]'
						: 'bg-[var(--bg-elevated)] hover:bg-[var(--text-muted)]'}"
					aria-label="Show testimonial {i + 1}"
					aria-selected={i === activeIndex}
					role="tab"
					onclick={() => goTo(i)}
				></button>
			{/each}
		</div>
	</div>
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
