<script lang="ts">
	import { cn } from '$lib/utils';

	export interface SectionHeadingProps {
		/** Main heading text */
		heading: string;
		/** Optional mono subheading (e.g. "// measured impact") */
		subheading?: string;
		/** Heading level (1-6). Default 2 for section headings; use 1 for page titles. */
		level?: 1 | 2 | 3 | 4 | 5 | 6;
		/** Show orange dot after heading (default true) */
		dot?: boolean;
		/** Consumer styling */
		class?: string;
		[key: string]: unknown;
	}

	let { heading, subheading, level = 2, dot = true, class: className, ...rest }: SectionHeadingProps = $props();

	let tag = $derived(`h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');
</script>

<div data-slot="section-heading" class={cn('', className)} {...rest}>
	<svelte:element this={tag} class="section-heading-text">
		{heading}{#if dot}<span data-slot="section-heading-dot" class="section-heading-dot">.</span>{/if}
	</svelte:element>
	{#if subheading}
		<p data-slot="section-heading-sub" class="section-heading-sub">{subheading}</p>
	{/if}
</div>

<style>
	.section-heading-text {
		font-family: var(--font-heading);
		font-size: var(--text-display);
		font-weight: 900;
		color: var(--foreground);
		letter-spacing: -2px;
		margin-block-end: 6px;
	}
	.section-heading-dot {
		color: var(--primary);
	}
	.section-heading-sub {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--muted-foreground);
		letter-spacing: 2px;
		text-transform: uppercase;
		margin-block-end: 36px;
	}
</style>
