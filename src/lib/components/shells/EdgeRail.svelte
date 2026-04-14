<!--
  EdgeRail — Tier 3 shell for page-level edge decorations.
  Sticky positioning along viewport edges. Rotated labels, section markers.
  Hidden below xl: (1024px). Independent of SectionWrapper sides.
  Constitution: EdgeRail = baseline rhythm; SectionWrapper slots = section-specific personality.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	export interface EdgeRailProps {
		/** Which side of the viewport */
		position: 'left' | 'right';
		/** Rotated page label */
		label?: string;
		/** Section markers for vertical navigation */
		sections?: { id: string; label: string }[];
		/** Custom edge content */
		children?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		position,
		label,
		sections,
		children,
		class: className,
		...rest
	}: EdgeRailProps = $props();
</script>

<div
	data-slot="edge-rail"
	data-position={position}
	class={cn('edge-rail', className)}
	aria-hidden="true"
	{...rest}
>
	{#if label}
		<span data-edge-label class="edge-label">{label}</span>
	{/if}

	{#if sections}
		<nav class="edge-markers">
			{#each sections as section}
				<span data-edge-marker data-section={section.id} class="edge-marker">
					{section.label}
				</span>
			{/each}
		</nav>
	{/if}

	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.edge-rail {
		position: fixed;
		top: 0;
		bottom: 0;
		display: none;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		width: clamp(2rem, 3vw, 3.5rem);
		z-index: var(--z-sticky);
		pointer-events: none;
	}

	.edge-rail[data-position="left"] {
		left: 0;
	}

	.edge-rail[data-position="right"] {
		right: 0;
	}

	/* Only visible at xl:+ (1024px) */
	@media (min-width: 1024px) {
		.edge-rail {
			display: flex;
		}
	}

	.edge-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted-foreground);
		white-space: nowrap;
	}

	.edge-rail[data-position="left"] .edge-label {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
	}

	.edge-rail[data-position="right"] .edge-label {
		writing-mode: vertical-rl;
	}

	.edge-markers {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}

	.edge-marker {
		font-family: var(--font-mono);
		font-size: 0.625rem;
		letter-spacing: 0.05em;
		color: var(--muted-foreground);
		opacity: var(--opacity-muted);
		white-space: nowrap;
	}

	.edge-rail[data-position="left"] .edge-marker,
	.edge-rail[data-position="right"] .edge-marker {
		writing-mode: vertical-rl;
	}

	.edge-rail[data-position="left"] .edge-marker {
		transform: rotate(180deg);
	}
</style>
