<!--
  CardGrid — Tier 3 shell for responsive card layouts.
  Configurable columns per breakpoint. Uses CSS Grid with gap token.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	export interface CardGridProps {
		/** Columns at small breakpoint */
		sm?: number;
		/** Columns at medium breakpoint */
		md?: number;
		/** Columns at large breakpoint */
		lg?: number;
		children?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		sm = 1,
		md = 2,
		lg = 3,
		children,
		class: className,
		...rest
	}: CardGridProps = $props();
</script>

<div
	data-slot="card-grid"
	data-cols-sm={sm}
	data-cols-md={md}
	data-cols-lg={lg}
	class={cn('card-grid grid', className)}
	style="--cols-sm: {sm}; --cols-md: {md}; --cols-lg: {lg};"
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.card-grid {
		grid-template-columns: repeat(var(--cols-sm), 1fr);
		gap: var(--space-card-gap, 1.5rem);
	}

	@media (min-width: 768px) {
		.card-grid {
			grid-template-columns: repeat(var(--cols-md), 1fr);
		}
	}

	@media (min-width: 1024px) {
		.card-grid {
			grid-template-columns: repeat(var(--cols-lg), 1fr);
		}
	}
</style>
