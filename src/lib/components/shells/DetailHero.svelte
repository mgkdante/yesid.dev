<!--
  DetailHero — Tier 3 shell for detail page headers.
  Back link → h1 → subtitle → extras slot → GradientSeparator.
  Used by WorkDetailPage. Blog/Service headers have unique structures.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { boop } from '$lib/motion/actions/boop.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { cn } from '$lib/utils.js';

	export interface DetailHeroProps {
		/** Back navigation URL */
		backHref: string;
		/** Back navigation label text */
		backLabel: string;
		/** Page title rendered as h1 */
		title: string;
		/** Optional subtitle below the title */
		subtitle?: string;
		/** Extra content (tags, metadata) below subtitle */
		extras?: Snippet;
		/** Main hero content */
		children?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		backHref,
		backLabel,
		title,
		subtitle,
		extras,
		children,
		class: className,
		...rest
	}: DetailHeroProps = $props();
</script>

<div
	data-slot="detail-hero"
	class={cn('detail-hero', className)}
	{...rest}
>
	<a
		href={backHref}
		class="mb-6 inline-block font-mono text-xs text-[var(--primary)] transition-colors hover:underline"
		use:boop={{ scale: 1.05, timing: 200 }}
	>
		{backLabel}
	</a>

	<header class="relative mb-10" use:reveal={{ direction: 'up', delay: 0 }}>
		<h1 class="font-heading text-3xl font-bold leading-tight text-[var(--foreground)] md:text-4xl lg:text-5xl">
			{title}
		</h1>

		{#if subtitle}
			<p data-detail-subtitle class="mt-3 text-base text-text-secondary md:text-lg">
				{subtitle}
			</p>
		{/if}

		{#if extras}
			<div class="mt-5" use:reveal={{ direction: 'up', delay: 80 }}>
				{@render extras()}
			</div>
		{/if}

		{#if children}
			{@render children()}
		{/if}
	</header>

	<Separator variant="gradient" />
</div>
