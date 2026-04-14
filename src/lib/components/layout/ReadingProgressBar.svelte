<!--
  Reading progress bar — fixed at top of viewport.
  Tracks scroll progress through a target element (blog content).
  Uses requestAnimationFrame + getBoundingClientRect for smooth tracking.
  Respects prefers-reduced-motion — skips rendering entirely when enabled.
  Uses bits-ui Progress for proper ARIA progressbar semantics.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { Progress } from '$lib/components/ui/progress';

	let {
		targetSelector = '[data-testid="blog-content"]',
		accentColor = 'var(--primary)'
	}: {
		targetSelector?: string;
		accentColor?: string;
	} = $props();

	let progress = $state(0);
	let reducedMotion = $state(false);
	let progressPercent = $derived(Math.round(progress * 100));

	onMount(() => {
		reducedMotion = isPrefersReducedMotion();

		// Skip scroll tracking entirely when reduced motion is preferred
		if (reducedMotion) return;

		let rafId: number;
		let ticking = false;

		function updateProgress() {
			const target = document.querySelector(targetSelector);
			if (!target) {
				ticking = false;
				return;
			}

			const rect = target.getBoundingClientRect();
			// How far the target top has scrolled past the viewport top
			const scrolledPast = -rect.top;
			// Total scrollable distance = target height minus viewport height
			const scrollable = rect.height - window.innerHeight;

			if (scrollable <= 0) {
				progress = 0;
			} else {
				progress = Math.min(1, Math.max(0, scrolledPast / scrollable));
			}

			ticking = false;
		}

		function onScroll() {
			if (!ticking) {
				ticking = true;
				rafId = requestAnimationFrame(updateProgress);
			}
		}

		// Initial calculation
		updateProgress();

		window.addEventListener('scroll', onScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(rafId);
		};
	});
</script>

{#if !reducedMotion}
	<div
		class="fixed left-0 right-0 top-0 z-50"
		data-testid="reading-progress-bar"
		style="--progress-gradient: linear-gradient(90deg, {accentColor}, var(--accent));"
	>
		<Progress
			value={progressPercent}
			max={100}
			class="reading-progress-root rounded-none bg-transparent"
		/>
	</div>
{/if}

<style>
	/* Override the progress indicator to use our gradient fill instead of default bg-primary */
	:global([data-slot="progress"].reading-progress-root [data-slot="progress-indicator"]) {
		background: var(--progress-gradient);
		transition: transform 75ms linear;
	}
</style>
