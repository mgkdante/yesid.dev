<!--
  BentoGrid — Tier 3 shell for named-area CSS Grid layouts.
  Thin wrapper providing the grid container. Consumers define
  grid-template-areas and area assignments via class/scoped CSS.
  The About page bento layout is too page-specific to encode here —
  this shell provides the shared surface (gap, display, width).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	export interface BentoGridProps {
		/** Grid content (bento cards) */
		children?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		children,
		class: className,
		...rest
	}: BentoGridProps = $props();
</script>

<div
	data-slot="bento-grid"
	class={cn('grid w-full', className)}
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</div>
