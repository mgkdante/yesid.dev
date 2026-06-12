<!--
  ServiceSvgPanel — container for service SVG illustrations with CornerMarks.
  Standard dark styling (keeps existing orange-on-dark SVG appearance).
  variant="panel" (desktop/tablet side panel) or "banner" (mobile full-width).
  Round 5 (operator: "the fun svgs!"): the whole panel is a morph-hover
  surface — hovering anywhere on it morphs the art (SvgIcon's built-in icon
  hover only fired over the icon box itself), and the art runs the
  light-register --accent remap so its amber linework survives daylight.
-->
<script lang="ts">
	import { cn } from '$lib/utils';
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

	let panelHovered = $state(false);
</script>

{#if svgContent}
	<div
		class={cn(
			'svg-panel',
			variant === 'banner' && 'svg-panel--banner',
			className
		)}
		data-testid="service-svg-panel"
		onmouseenter={() => (panelHovered = true)}
		onmouseleave={() => (panelHovered = false)}
		role="presentation"
		{...rest}
	>
		<CornerMarks size="sm" />
		<!-- pointer-events-none: the panel owns the hover, so the morph fires
		     across the whole tile (HomeServices wrapper precedent). -->
		<div class="svg-art pointer-events-none">
			<SvgIcon {svgContent} size={variant === 'banner' ? 120 : 224} hovered={panelHovered} />
		</div>
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

	/* Round 5 light-register: service SVG linework is ~half var(--accent)
	   (#FFB627 brand amber, unmapped per theme) — near-invisible on paper.
	   Scoped remap to --line-amber: dark keeps the identical #FFB627, light
	   gets #B57F00 (the "yellow line survives daylight" precedent). */
	.svg-art {
		--accent: var(--line-amber);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	/* Fluid cap: the panel clamps down to 180px wide (aspect 5/6) — a fixed
	   icon box would clip there (it already did at the old 200px). min() the
	   inline size against the padded panel area; !important outranks the
	   inline style. The inner <svg> tracks its container via viewBox (the
	   app.css media rule: max-width 100% + height auto).
	   ≥768px only: below that, ServiceCard's mobile listing downsizes this
	   same panel to a 48px icon via its --svg-icon-size override — the cap
	   must not outrank it (mobile detail pages use the banner variant). */
	@media (min-width: 768px) {
		.svg-panel:not(.svg-panel--banner) .svg-art :global([data-slot='svg-icon']) {
			width: min(224px, 100%) !important;
			height: min(224px, 100%) !important;
		}
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
