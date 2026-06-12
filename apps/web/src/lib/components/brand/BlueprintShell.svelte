<!--
  BlueprintShell — Shared shell for Da Vincian blueprint header backgrounds.
  Provides crosshairs, reference labels, and CSS for absolute SVG positioning.
  Consumer passes SVG layers via the `hero` and `details` snippets, plus label text.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	export interface BlueprintShellProps {
		/** Hero SVG layer (full-width, faintest) — rendered first */
		hero: Snippet;
		/** Detail SVG layers (absolutely positioned) — rendered in edge-details container */
		details: Snippet;
		/** Reference labels: [top-right, bottom-left, bottom-right] */
		labels: [string, string, string];
		class?: string;
		[key: string]: unknown;
	}

	let {
		hero,
		details,
		labels,
		class: className = '',
		...rest
	}: BlueprintShellProps = $props();
</script>

<div class="blueprint-bg absolute inset-0 z-0 text-[var(--primary)] {className}" aria-hidden="true" {...rest}>
	<!-- Hero layer -->
	<div class="hero-svg absolute inset-x-0 top-[10%] bottom-[10%] z-0 opacity-[0.16]">
		{@render hero()}
	</div>

	<!-- Detail layers -->
	<div class="edge-details absolute inset-0 z-0 overflow-hidden">
		{@render details()}
	</div>

	<!-- Corner crosshairs -->
	<div class="crosshair" style="top:24px;left:24px;"></div>
	<div class="crosshair" style="top:24px;right:24px;"></div>
	<div class="crosshair" style="bottom:24px;left:24px;"></div>
	<div class="crosshair" style="bottom:24px;right:24px;"></div>

	<!-- Reference labels -->
	<span class="ref-label" style="top:16px;right:56px;">{labels[0]}</span>
	<span class="ref-label" style="bottom:16px;left:56px;">{labels[1]}</span>
	<span class="ref-label" style="bottom:16px;right:56px;">{labels[2]}</span>
</div>

<style>
	.crosshair {
		position: absolute;
		width: 24px;
		height: 24px;
	}
	.crosshair::before {
		content: '';
		position: absolute;
		width: 24px;
		height: 1px;
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		top: 50%;
	}
	.crosshair::after {
		content: '';
		position: absolute;
		width: 1px;
		height: 24px;
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		left: 50%;
	}

	.ref-label {
		position: absolute;
		font-family: var(--font-mono);
		font-size: 10px;
		color: color-mix(in srgb, var(--primary) 20%, transparent);
		letter-spacing: 1.5px;
		z-index: var(--z-base);
	}

	/* GO2-W5: bump label mix 20% → 30% in light so the blueprint annotations
	   survive the warm paper (aria-hidden ornament — decorative). */
	:global([data-theme='light']) .ref-label,
	:global(.theme-light) .ref-label {
		color: color-mix(in srgb, var(--primary) 30%, transparent);
	}

	:global(.edge-detail) {
		position: absolute;
	}

	@media (max-width: 1023px) {
		.ref-label,
		.crosshair {
			display: none;
		}
	}
</style>
