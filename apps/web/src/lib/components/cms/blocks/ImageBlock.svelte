<!--
  ImageBlock.svelte — renders Editor.js `image` block.
  data.file.fileId is the Directus file UUID; data.file.url is the asset URL.
  AM2: caption is HTML — render via {@html}.
-->
<script lang="ts">
	import type { ImageBlock } from '@repo/shared';
	import { asset } from '$lib/directus/assets';

	let { data }: { data: ImageBlock['data'] } = $props();

	// Prefer Directus asset transform via fileId; fall back to raw url if no fileId.
	const src = $derived(data.file.fileId ? asset(data.file.fileId, 'card-600') : data.file.url);
	const altText = $derived(data.caption ? data.caption.replace(/<[^>]*>/g, '') : '');
</script>

<figure class:bordered={data.withBorder} class:bg={data.withBackground} class:stretched={data.stretched}>
	<img src={src} alt={altText} loading="lazy" />
	{#if data.caption}
		<figcaption>{@html data.caption}</figcaption>
	{/if}
</figure>

<style>
	figure {
		margin: 1.5rem 0;
	}
	img {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-md);
	}
	.bordered img {
		border: 1px solid var(--border-subtle);
	}
	.bg {
		background: var(--card);
		padding: 1rem;
		border-radius: var(--radius-md);
	}
	.stretched img {
		width: 100%;
	}
	figcaption {
		text-align: center;
		font-size: var(--text-mono);
		color: var(--muted-foreground);
		margin-top: 0.5rem;
	}
</style>
