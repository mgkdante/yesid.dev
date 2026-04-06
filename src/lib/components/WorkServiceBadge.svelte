<!--
  Pill badge showing a service's SVG icon + title.
  Used in the detail page sidebar to show which services a project links to.
  SVG is rendered inline at 28px; title resolved via resolveLocale for i18n.
  Hover: subtle glow, bg shift, and slight scale for interactivity.
-->
<script lang="ts">
	import type { Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';

	let {
		service,
		svgContent
	}: {
		service: Service;
		svgContent: string;
	} = $props();
</script>

<div
	class="service-badge inline-flex items-center gap-2 rounded-full border bg-[#1a1a1a] px-4 py-2.5"
	style="border-color: rgba(224, 120, 0, 0.4);"
	data-testid="work-service-badge"
>
	<!-- Inline SVG icon at 28px — inherits service illustration -->
	{#if svgContent}
		<div class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden" aria-hidden="true">
			{@html svgContent}
		</div>
	{/if}
	<span class="font-mono text-xs leading-tight text-[var(--text-primary)] md:text-[13px]">
		{resolveLocale(service.title, 'en')}
	</span>
</div>

<style>
	/* Force inline SVG to fit the 28px container */
	.service-badge :global(svg) {
		width: 28px;
		height: 28px;
		display: block;
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
