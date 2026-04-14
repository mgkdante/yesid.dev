<!--
  ListingShell — Tier 3 shell for listing pages (blog, work).
  Encodes the shared structure: header → mobile filters → sidebar + content layout.
  Animation logic stays in page components — this shell is layout only.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	export interface ListingShellProps {
		/** Page title rendered as h1 */
		title: string;
		/** Optional subtitle below the title */
		subtitle?: string;
		/** Mobile filter controls */
		filters?: Snippet;
		/** Desktop sidebar (sticky filter panel) */
		sidebar?: Snippet;
		/** Main listing content */
		children?: Snippet;
		/** Content shown when listing is empty */
		emptyState?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		title,
		subtitle,
		filters,
		sidebar,
		children,
		emptyState,
		class: className,
		...rest
	}: ListingShellProps = $props();
</script>

<div
	data-slot="listing-shell"
	class={cn('listing-shell', className)}
	{...rest}
>
	<!-- Header -->
	<header class="listing-header">
		<h1 class="font-heading text-3xl font-bold leading-tight text-[var(--foreground)] md:text-4xl lg:text-5xl">
			{title}<span class="text-[var(--primary)]">.</span>
		</h1>
		{#if subtitle}
			<p data-listing-subtitle class="mt-2 font-mono text-caption uppercase tracking-widest text-[var(--muted-foreground)]">
				{subtitle}
			</p>
		{/if}
	</header>

	<!-- Mobile filters -->
	{#if filters}
		<div class="listing-filters mt-6 lg:hidden">
			{@render filters()}
		</div>
	{/if}

	<!-- Main layout: sidebar + content -->
	<div class="listing-layout">
		<div data-listing-sidebar class="listing-sidebar">
			{#if sidebar}
				{@render sidebar()}
			{/if}
		</div>

		<div data-listing-content class="listing-content">
			{#if children}
				{@render children()}
			{:else if emptyState}
				{@render emptyState()}
			{/if}
		</div>
	</div>
</div>

<style>
	.listing-shell {
		width: 100%;
		padding-block: var(--space-section-y, 2rem);
	}

	.listing-header {
		margin-block-end: 1.5rem;
	}

	.listing-layout {
		display: flex;
		gap: clamp(1.5rem, 3vw, 2.5rem);
	}

	.listing-sidebar {
		display: none;
	}

	@media (min-width: 1024px) {
		.listing-sidebar {
			display: block;
			flex: 0 0 clamp(180px, 18vw, 240px);
			position: sticky;
			top: var(--space-section-y, 2rem);
			align-self: start;
		}
	}

	.listing-content {
		flex: 1;
		min-width: 0;
	}
</style>
