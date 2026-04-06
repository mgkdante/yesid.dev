<!--
  Small pill badge showing a service's SVG icon + title.
  Used in the detail page sidebar to show which services a project links to.
  SVG is rendered inline at 20px; title resolved via resolveLocale for i18n.
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
	class="inline-flex items-center gap-1.5 rounded-full border bg-[#1a1a1a] px-2.5 py-1"
	style="border-color: rgba(224, 120, 0, 0.4);"
	data-testid="work-service-badge"
>
	<!-- Inline SVG icon at 20px — inherits service illustration -->
	{#if svgContent}
		<div class="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden" aria-hidden="true">
			{@html svgContent}
		</div>
	{/if}
	<span class="font-mono text-[10px] leading-tight text-[var(--text-primary)] md:text-[11px]">
		{resolveLocale(service.title, 'en')}
	</span>
</div>

<style>
	/* Force inline SVG to fit the 20px container */
	div :global(svg) {
		width: 20px;
		height: 20px;
		display: block;
	}
</style>
