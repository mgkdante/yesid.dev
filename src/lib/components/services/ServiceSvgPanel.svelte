<!--
  ServiceSvgPanel — container for service SVG illustrations with CornerMarks.
  Standard dark styling (keeps existing orange-on-dark SVG appearance).
  variant="panel" (desktop/tablet side panel) or "banner" (mobile full-width).
-->
<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { SvgIcon, CornerMarks } from '$lib/components/brand';

	export interface ServiceSvgPanelProps {
		/** Raw SVG content string */
		svgContent: string;
		/** "panel" = sized side panel, "banner" = full-width mobile strip */
		variant?: 'panel' | 'banner';
		class?: string;
		[key: string]: unknown;
	}

	let {
		svgContent,
		variant = 'panel',
		class: className = '',
		...rest
	}: ServiceSvgPanelProps = $props();
</script>

{#if svgContent}
	<div
		class={cn(
			'svg-panel',
			variant === 'banner' && 'svg-panel--banner',
			className
		)}
		data-testid="service-svg-panel"
		{...rest}
	>
		<CornerMarks size="sm" />
		<SvgIcon {svgContent} size={variant === 'banner' ? 100 : 200} />
	</div>
{/if}

<style>
	.svg-panel {
		position: relative;
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		overflow: hidden;
	}

	/* Desktop/tablet: sized panel */
	.svg-panel:not(.svg-panel--banner) {
		width: clamp(180px, 20vw, 280px);
		aspect-ratio: 5 / 6;
	}

	/* Mobile: full-width banner */
	.svg-panel--banner {
		width: 100%;
		padding: 1.5rem;
	}
</style>
