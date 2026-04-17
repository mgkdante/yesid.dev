<!--
  Reading progress bar — fixed at top of viewport.
  Tracks scroll progress through a target element (blog content).
  Subscribes to the shared gsap.ticker (17e-5) so the whole site ticks
  from a single RAF callback. No IO gate — the bar is relevant throughout
  the article route while mounted.
  Respects prefers-reduced-motion — skips rendering entirely when enabled.
  Uses bits-ui Progress for proper ARIA progressbar semantics.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { subscribe, unsubscribe } from '$lib/motion/utils/ticker.js';
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

		// Unique id per mount so multiple progress bars (should never happen
		// in practice, but cheap insurance) don't collide on the ticker.
		const subscriptionId = `reading-progress-bar-${Math.random().toString(36).slice(2, 9)}`;

		function updateProgress() {
			const target = document.querySelector(targetSelector);
			if (!target) return;

			const rect = target.getBoundingClientRect();
			// How far the target top has scrolled past the viewport top
			const scrolledPast = -rect.top;
			// Total scrollable distance = target height minus viewport height
			const scrollable = rect.height - window.innerHeight;

			const next = scrollable <= 0
				? 0
				: Math.min(1, Math.max(0, scrolledPast / scrollable));

			// Only write when changed to avoid needless reactivity updates.
			if (next !== progress) progress = next;
		}

		// Initial calculation + shared-ticker subscription
		updateProgress();
		subscribe(subscriptionId, updateProgress);

		return () => unsubscribe(subscriptionId);
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
