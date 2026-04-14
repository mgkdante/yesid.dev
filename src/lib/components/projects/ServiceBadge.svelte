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
	import { SvgIcon } from '$lib/components/brand';

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

<!-- Clickable badge → /services/{service.id} (page built in future slice, 404 until then) -->
<a
	href="/services/{service.id}"
	class="service-badge inline-flex items-center gap-2 rounded-full border bg-bg-card px-4 py-2.5 no-underline"
	style="border-color: color-mix(in srgb, var(--primary) 40%, transparent);"
	data-testid="work-service-badge"
	onmouseenter={() => (badgeHovered = true)}
	onmouseleave={() => (badgeHovered = false)}
>
	{#if svgContent}
		<SvgIcon {svgContent} size={28} hovered={badgeHovered} />
	{/if}
	<span class="font-mono text-caption leading-tight text-[var(--foreground)] md:text-mono">
		{resolveLocale(service.title, 'en')}
	</span>
</a>

<style>
	/* Force SvgIcon container to not add its own border/bg at badge size */
	.service-badge :global([data-slot="svg-icon"]) {
		border: none;
		background: transparent;
		border-radius: 0;
	}

	/* Hover: glow, bg shift, slight scale — makes badges feel interactive */
	.service-badge {
		transition: background-color var(--duration-normal) var(--ease-default), border-color var(--duration-normal) var(--ease-default),
			transform var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default);
	}
	.service-badge:hover {
		background-color: var(--border-strong);
		border-color: color-mix(in srgb, var(--primary) 70%, transparent);
		transform: scale(1.02);
		box-shadow: var(--shadow-glow-md);
	}
</style>
