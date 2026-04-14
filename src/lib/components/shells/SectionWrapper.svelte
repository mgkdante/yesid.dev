<!--
  SectionWrapper — Tier 3 shell for CSS Grid section layout.
  3 independent layers: background (z:0), sides (z:1), content (z:1).
  4 layout patterns: split, centered, bleed, grid.
  Empty slots collapse to 0 — no wrapper divs for unused layers.
  Constitution Section 13: SectionWrapper is the layout engine.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	export interface SectionWrapperProps {
		/** Layout pattern: split (sidebar+content), centered, bleed (full-width), grid */
		layout?: 'split' | 'centered' | 'bleed' | 'grid';
		/** Container width constraint for text readability (default: none — unconstrained) */
		container?: 'content' | 'wide' | 'none';
		/** Whether section fills full viewport height */
		fullHeight?: boolean;
		/** Vertically center content within section */
		centerContent?: boolean;
		/** Background decoration layer (z:0) */
		background?: Snippet;
		/** Left edge content (rotated labels, annotations) */
		sideLeft?: Snippet;
		/** Right edge content */
		sideRight?: Snippet;
		/** Main section content */
		children?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		layout = 'centered',
		container = 'none',
		fullHeight = false,
		centerContent = false,
		background,
		sideLeft,
		sideRight,
		children,
		class: className,
		...rest
	}: SectionWrapperProps = $props();
</script>

<section
	data-slot="section-wrapper"
	data-layout={layout}
	class={cn(
		'section-wrapper',
		fullHeight && 'full-height',
		centerContent && 'center-content',
		className
	)}
	{...rest}
>
	{#if background}
		<div class="section-background">
			{@render background()}
		</div>
	{/if}

	{#if sideLeft}
		<div class="section-side-left">
			{@render sideLeft()}
		</div>
	{/if}

	<div class="section-content" data-container={container}>
		{#if children}
			{@render children()}
		{/if}
	</div>

	{#if sideRight}
		<div class="section-side-right">
			{@render sideRight()}
		</div>
	{/if}
</section>

<style>
	.section-wrapper {
		display: grid;
		width: 100%;
		position: relative;
	}

	.section-wrapper.full-height {
		min-height: 100dvh;
	}

	.section-wrapper.center-content {
		align-items: center;
	}

	/* --- Layout patterns --- */

	/* B — Centered + Edges (default) */
	.section-wrapper[data-layout="centered"],
	.section-wrapper[data-layout="grid"] {
		grid-template-columns: var(--edge-left, 0) 1fr var(--edge-right, 0);
	}

	/* A — Asymmetric Split */
	.section-wrapper[data-layout="split"] {
		grid-template-columns: var(--edge-left, 0) 1fr 1fr var(--edge-right, 0);
	}

	/* C — Full-Bleed */
	.section-wrapper[data-layout="bleed"] {
		grid-template-columns: 1fr;
	}

	/* --- Layers --- */

	.section-background {
		grid-column: 1 / -1;
		grid-row: 1;
		z-index: 0;
		pointer-events: none;
		position: relative;
	}

	.section-side-left {
		grid-column: 1;
		grid-row: 1;
		z-index: 1;
	}

	.section-content {
		grid-row: 1;
		z-index: 1;
	}

	/* Content column position depends on layout */
	.section-wrapper[data-layout="centered"] .section-content,
	.section-wrapper[data-layout="grid"] .section-content {
		grid-column: 2;
	}

	.section-wrapper[data-layout="split"] .section-content {
		grid-column: 2 / 4;
	}

	.section-wrapper[data-layout="bleed"] .section-content {
		grid-column: 1;
	}

	.section-side-right {
		grid-row: 1;
		z-index: 1;
	}

	.section-wrapper[data-layout="centered"] .section-side-right,
	.section-wrapper[data-layout="grid"] .section-side-right {
		grid-column: 3;
	}

	.section-wrapper[data-layout="split"] .section-side-right {
		grid-column: 4;
	}

	/* --- Container constraints --- */

	.section-content[data-container="content"] {
		max-width: min(var(--container-content), 100vw - var(--space-page-x) * 2);
		margin-inline: auto;
		padding-inline: var(--space-page-x);
	}

	.section-content[data-container="wide"] {
		max-width: min(var(--container-wide), 100vw - var(--space-page-x) * 2);
		margin-inline: auto;
		padding-inline: var(--space-page-x);
	}

	.section-content[data-container="none"] {
		width: 100%;
	}

	/* --- Responsive: sides collapse below xl --- */

	@media (max-width: 1023px) {
		.section-side-left,
		.section-side-right {
			display: none;
		}

		.section-wrapper[data-layout="centered"],
		.section-wrapper[data-layout="grid"],
		.section-wrapper[data-layout="split"] {
			grid-template-columns: 1fr;
		}

		.section-content {
			grid-column: 1;
		}
	}
</style>
