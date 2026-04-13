<!--
  Reading progress bar — fixed at top of viewport.
  Tracks scroll progress through a target element (blog content).
  Uses requestAnimationFrame + getBoundingClientRect for smooth tracking.
  Respects prefers-reduced-motion — skips rendering entirely when enabled.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

	let {
		targetSelector = '[data-testid="blog-content"]',
		accentColor = 'var(--brand-primary)'
	}: {
		targetSelector?: string;
		accentColor?: string;
	} = $props();

	let progress = $state(0);
	let reducedMotion = $state(false);

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
		class="fixed left-0 right-0 top-0 z-50 h-[3px]"
		role="progressbar"
		aria-valuenow={Math.round(progress * 100)}
		aria-valuemin={0}
		aria-valuemax={100}
		data-testid="reading-progress-bar"
	>
		<div
			class="h-full origin-left transition-transform duration-75"
			style="transform: scaleX({progress}); background: linear-gradient(90deg, {accentColor}, var(--brand-accent));"
		></div>
	</div>
{/if}
