<!--
  ImageBlock.svelte — renders Editor.js `image` block.
  data.file.fileId is the Directus file UUID; data.file.url is the asset URL.
  AM2: caption is HTML — render via {@html}.
-->
<script lang="ts">
	import type { ImageBlock } from '@repo/shared';
	import { assetImage } from '$lib/directus/assets';

	let { data }: { data: ImageBlock['data'] } = $props();

	// Prefer the mirrored asset (with webp variants) via fileId; fall back to
	// the raw url if no fileId.
	const source = $derived(
		data.file.fileId ? assetImage(data.file.fileId, 'card-600') : { src: data.file.url },
	);
	const altText = $derived(data.caption ? data.caption.replace(/<[^>]*>/g, '') : '');

	// Article/prose column width — capped well below full viewport on desktop.
	const SIZES = '(min-width: 768px) 680px, 94vw';
</script>

<figure class:bordered={data.withBorder} class:bg={data.withBackground} class:stretched={data.stretched}>
	<img
		src={source.src}
		srcset={source.srcset}
		sizes={SIZES}
		width={source.width}
		height={source.height}
		alt={altText}
		loading="lazy"
		decoding="async"
	/>
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
