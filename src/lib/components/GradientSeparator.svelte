<!--
  Animated gradient separator — horizontal SVG line with advancing orange→yellow gradient.
  Global component used between major sections site-wide for metro/transit brand cohesion.
  DrawSVGPlugin animates the line drawing in from left on scroll enter.
  On detail pages: placed once between header and body content.
  On listing pages / home: between each major section.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap } from '$lib/motion/utils/gsap.js';

	let {
		label = '',
		maxWidth = '64rem'
	}: {
		label?: string;
		/** CSS max-width value, e.g. '64rem' (5xl), '72rem' (6xl). Inline style used
		 *  because Tailwind JIT cannot resolve dynamically interpolated class names. */
		maxWidth?: string;
	} = $props();

	// WHY: module-level counter instead of crypto.randomUUID() — JSDOM (used in Vitest)
	// does not implement crypto.randomUUID(), so a simple incrementing integer is safer.
	// Each instance gets a unique suffix, preventing SVG <defs> gradient ID collisions
	// when multiple separators appear on the same page.
	let instanceId = $state(getNextId());
	let lineEl: SVGLineElement;

	onMount(() => {
		if (isPrefersReducedMotion() || !lineEl) return;

		registerGsapPlugins();
		gsap.fromTo(
			lineEl,
			{ drawSVG: '0%' },
			{
				drawSVG: '100%',
				duration: 0.8,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: lineEl,
					start: 'top 90%',
					once: true
				}
			}
		);
	});
</script>

<div
	class="relative mx-auto w-full px-6 py-4"
	style="max-width: {maxWidth};"
	aria-hidden="true"
>
	<svg width="100%" height="4" preserveAspectRatio="none" class="block">
		<defs>
			<linearGradient id="sep-grad-{instanceId}" x1="0" y1="0" x2="1" y2="0">
				<stop offset="0%" stop-color="#E07800" />
				<stop offset="100%" stop-color="#FFB627" />
			</linearGradient>
		</defs>
		<line
			bind:this={lineEl}
			x1="0"
			y1="2"
			x2="100%"
			y2="2"
			stroke="url(#sep-grad-{instanceId})"
			stroke-width="2"
			stroke-linecap="round"
		/>
	</svg>
	{#if label}
		<div
			class="mt-2 font-mono text-xs tracking-[3px] text-[#E07800] md:text-sm"
			data-testid="separator-label"
		>
			{label}
		</div>
	{/if}
</div>

<script module lang="ts">
	// Module-level counter shared across all GradientSeparator instances on the page.
	// This guarantees unique IDs even when rendered server-side (no crypto API needed).
	let _counter = 0;
	function getNextId(): number {
		return _counter++;
	}
</script>
