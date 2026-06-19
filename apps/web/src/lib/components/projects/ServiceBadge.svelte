<!--
  Pill badge showing a service's SVG icon + title.
  Used in the detail page sidebar to show which services a project links to.
  SVG icon uses WorkSvgIcon for MorphSVG hover/tap effects.
  Title resolved via resolveLocale for i18n.
  Hover: subtle glow, bg shift, slight scale, and SVG morph.
-->
<script lang="ts">
	import type { Service } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';
	import { serviceLineColor } from '$lib/utils/service-colors';

	const locale = getLocale();
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

	// GO2-W5 STM line bullets — service id → métro line color (shared util).
	const lineColor = $derived(serviceLineColor(service.id));
</script>

<!-- Clickable badge → /services/{service.id} (page built in future slice, 404 until then) -->
<a
	href={localizeHref(`/services/${service.id}`, locale)}
	class="service-badge inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 no-underline"
	style="border-color: color-mix(in srgb, var(--primary) 40%, transparent);"
	data-testid="work-service-badge"
	onmouseenter={() => (badgeHovered = true)}
	onmouseleave={() => (badgeHovered = false)}
>
	{#if svgContent}
		<SvgIcon {svgContent} size={28} hovered={badgeHovered} />
	{/if}
	<span class="line-bullet" style="background: {lineColor};" aria-hidden="true"></span>
	<span class="font-mono text-caption leading-tight text-[var(--foreground)] md:text-mono">
		{resolveLocale(service.title, locale)}
	</span>
</a>

<style>
	/* Force SvgIcon container to not add its own border/bg at badge size */
	.service-badge :global([data-slot="svg-icon"]) {
		border: none;
		background: transparent;
		border-radius: 0;
	}

	/* GO2-W5 STM line bullet — the service's line color as a roundel dot. */
	.line-bullet {
		display: inline-block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	/* Hover: glow, bg shift, slight scale — makes badges feel interactive */
	.service-badge {
		transition: background-color var(--duration-normal) var(--ease-default), border-color var(--duration-normal) var(--ease-default),
			transform var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default);
	}
	.service-badge:hover {
		background-color: var(--surface-4);
		border-color: color-mix(in srgb, var(--primary) 70%, transparent);
		transform: scale(1.02);
		box-shadow: var(--shadow-glow-md);
	}
</style>
