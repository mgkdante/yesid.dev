<!--
  AsidePanel — Tier 3 shell for sidebar content.
  Semantic <aside>, optional sticky positioning, responsive show/hide.
  Hidden on mobile, shown at lg:+ (768px).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	export interface AsidePanelProps {
		/** Which side the panel appears on */
		position?: 'left' | 'right';
		/** Enable sticky positioning when scrolling */
		sticky?: boolean;
		/** Panel content */
		children?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		position = 'right',
		sticky = false,
		children,
		class: className,
		...rest
	}: AsidePanelProps = $props();
</script>

<aside
	data-slot="aside-panel"
	data-position={position}
	class={cn('aside-panel', sticky && 'aside-sticky', className)}
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</aside>

<style>
	.aside-panel {
		display: none;
	}

	@media (min-width: 768px) {
		.aside-panel {
			display: block;
		}
	}

	.aside-sticky {
		position: sticky;
		top: var(--space-section-y, 2rem);
		align-self: start;
	}
</style>
