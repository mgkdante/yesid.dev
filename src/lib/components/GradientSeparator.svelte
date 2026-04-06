<!--
  Gradient separator — horizontal line with continuously flowing orange→yellow gradient.
  Global component used between major sections site-wide for metro/transit brand cohesion.
  Shows immediately on load with a perpetual gradient flow animation.
  On detail pages: placed once between header and body content.
  On listing pages / home: between each major section.
-->
<script lang="ts">
	let {
		label = '',
		maxWidth = '64rem'
	}: {
		label?: string;
		/** CSS max-width value, e.g. '64rem' (5xl), '72rem' (6xl). */
		maxWidth?: string;
	} = $props();
</script>

<div
	class="relative mx-auto w-full py-4"
	style="max-width: {maxWidth};"
	aria-hidden="true"
>
	<!-- WHY: plain CSS div with animated background-position — no SVG, no GSAP,
	     no scroll trigger. Renders instantly, gradient flows continuously. -->
	<div class="gradient-separator-line" data-testid="gradient-separator"></div>
	{#if label}
		<div
			class="mt-2 font-mono text-xs tracking-[3px] text-[#E07800] md:text-sm"
			data-testid="separator-label"
		>
			{label}
		</div>
	{/if}
</div>

<style>
	.gradient-separator-line {
		height: 2px;
		border-radius: 999px;
		background: linear-gradient(90deg, #E07800, #FFB627, #E07800, #FFB627);
		background-size: 200% 100%;
		animation: gradient-flow 3s linear infinite;
	}

	@keyframes gradient-flow {
		0% { background-position: 0% 0%; }
		100% { background-position: 200% 0%; }
	}

	@media (prefers-reduced-motion: reduce) {
		.gradient-separator-line {
			animation: none;
			background: linear-gradient(90deg, #E07800, #FFB627);
			background-size: 100% 100%;
		}
	}
</style>
