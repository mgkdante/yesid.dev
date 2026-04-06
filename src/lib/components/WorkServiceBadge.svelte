<!--
  Pill badge showing a service's SVG icon + title.
  Used in the detail page sidebar to show which services a project links to.
  SVG icon uses WorkSvgIcon for MorphSVG hover/tap effects.
  Title resolved via resolveLocale for i18n.
  Hover: subtle glow, bg shift, slight scale, and SVG morph.
-->
<script lang="ts">
	import type { Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import WorkSvgIcon from './WorkSvgIcon.svelte';

	let {
		service,
		svgContent
	}: {
		service: Service;
		svgContent: string;
	} = $props();

	// Track hover state to pass down to WorkSvgIcon for MorphSVG effect
	let badgeHovered = $state(false);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="service-badge inline-flex items-center gap-2 rounded-full border bg-[#1a1a1a] px-4 py-2.5"
	style="border-color: rgba(224, 120, 0, 0.4);"
	data-testid="work-service-badge"
	onmouseenter={() => (badgeHovered = true)}
	onmouseleave={() => (badgeHovered = false)}
	role="presentation"
>
	<!-- WorkSvgIcon with morph on hover/tap — replaces raw {@html} -->
	{#if svgContent}
		<WorkSvgIcon {svgContent} size={28} hovered={badgeHovered} />
	{/if}
	<span class="font-mono text-xs leading-tight text-[var(--text-primary)] md:text-[13px]">
		{resolveLocale(service.title, 'en')}
	</span>
</div>

<style>
	/* Force WorkSvgIcon container to not add its own border/bg at badge size */
	.service-badge :global(.work-svg-icon) {
		border: none;
		background: transparent;
		border-radius: 0;
	}

	/* Hover: glow, bg shift, slight scale — makes badges feel interactive */
	.service-badge {
		transition: background-color 0.2s ease, border-color 0.2s ease,
			transform 0.2s ease, box-shadow 0.2s ease;
	}
	.service-badge:hover {
		background-color: #333;
		border-color: rgba(224, 120, 0, 0.7);
		transform: scale(1.02);
		box-shadow: 0 0 12px rgba(224, 120, 0, 0.15);
	}
</style>
