<!-- Decorative hover/tap morph surface; filter synthetic touch hover so taps retain their toggle state. -->
<script lang="ts">
	import { cn } from '@yesid/ui/cn';
	import { CornerMarks } from '@yesid/ui/brand';
	import SvgIcon from '#lib/components/brand/SvgIcon.svelte';

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

	// Single morph switch — hover sets/clears it (mouse/pen only), tap toggles.
	let panelMorphed = $state(false);
</script>

{#if svgContent}
	<button
		type="button"
		class={cn(
			'svg-panel',
			variant === 'banner' && 'svg-panel--banner',
			className
		)}
		data-testid="service-svg-panel"
		onpointerenter={(e) => {
			if (e.pointerType !== 'touch') panelMorphed = true;
		}}
		onpointerleave={(e) => {
			if (e.pointerType !== 'touch') panelMorphed = false;
		}}
		onclick={() => (panelMorphed = !panelMorphed)}
		aria-hidden="true"
		tabindex="-1"
		{...rest}
	>
		<CornerMarks size="sm" />
		<!-- pointer-events-none: the panel owns the hover/tap, so the morph
		     fires across the whole tile (HomeServices wrapper precedent). -->
		<div class="svg-art pointer-events-none">
			<SvgIcon {svgContent} size={variant === 'banner' ? 120 : 224} hovered={panelMorphed} />
		</div>
	</button>
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

		border: none;
		background: transparent;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	/* Remap amber linework locally to line-amber so service art remains visible on light paper. */
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
	   ≥768px only: phones show the banner variant instead. */
	@media (--tablet-min) {
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
