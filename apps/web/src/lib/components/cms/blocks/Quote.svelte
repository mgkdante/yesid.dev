<!--
  Quote.svelte — renders Editor.js `quote` block.
  AM2: data.text + data.caption are HTML. Render via {@html}.
  AM5: each block is single-text. Multi-paragraph quotes are N consecutive
       `quote` blocks at the doc level — handled by BlockRenderer iteration.
-->
<script lang="ts">
	import type { QuoteBlock } from '@repo/shared';

	let { data }: { data: QuoteBlock['data'] } = $props();

	const textAlign = $derived(
		data.alignment === 'center' ? 'center' : data.alignment === 'right' ? 'right' : 'left'
	);
</script>

<blockquote style:text-align={textAlign}>
	{@html data.text}
	{#if data.caption}
		<cite>{@html data.caption}</cite>
	{/if}
</blockquote>

<style>
	blockquote {
		border-left: 3px solid var(--primary);
		padding-left: 1rem;
		margin: 1.5rem 0;
		color: var(--secondary-foreground);
		font-style: italic;
	}
	cite {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.875rem;
		font-style: normal;
		color: var(--secondary-foreground);
	}
</style>
