<!--
  ImageBlock.svelte renders Editor.js `image` blocks.
  data.file.fileId is the Directus file UUID; data.file.url is the asset URL.
  AM2: caption is HTML, rendered via {@html}.
-->
<script lang="ts">
	import type { ImageBlock } from '@repo/shared';
	import { assetImage } from '#lib/directus/assets.ts';
	import { onMount } from 'svelte';
	import type { Theme } from '@yesid/ui/state';
	import { resolveThemeValue, watchTheme } from '#lib/utils/theme-media.ts';
	import { getArticleMedia } from '#lib/media/article-media.svelte.ts';
	import { siteLabels } from '#lib/content/index.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';

	let { data }: { data: ImageBlock['data'] } = $props();
	const media = getArticleMedia();
	const openTemplate = resolveLocale(siteLabels.a11y.projectImageOpen, getLocale());
	let activeTheme = $state<Theme>('dark');
	onMount(() => watchTheme((theme) => { activeTheme = theme; }));
	const file = $derived(resolveThemeValue(activeTheme, data.file, data.variants?.light));

	// Prefer the mirrored asset (with webp variants) via fileId; fall back to
	// the raw url if no fileId.
	const source = $derived(
		file.fileId ? assetImage(file.fileId, 'card-600') : { src: file.url },
	);
	const altText = $derived(data.caption ? data.caption.replace(/<[^>]*>/g, '') : '');

	// Article column width is capped below the full viewport on desktop.
	const SIZES = '(min-width: 768px) 680px, 94vw';
</script>

{#snippet image()}
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
{/snippet}

<figure class:bordered={data.withBorder} class:bg={data.withBackground} class:stretched={data.stretched}>
	{#if media}
		<button type="button" class="article-image-open" aria-label={openTemplate.replace('{caption}', altText)} onclick={(event) => { event.stopPropagation(); media.openImage(data, event.currentTarget); }}>
			{@render image()}
		</button>
	{:else}
		{@render image()}
	{/if}
	{#if data.caption}
		<figcaption>{@html data.caption}</figcaption>
	{/if}
</figure>

<style>
	.article-image-open { display: block; max-width: 100%; border: 0; padding: 0; background: transparent; cursor: zoom-in; }
	.article-image-open:focus-visible { outline: 3px solid var(--ring); outline-offset: 3px; }
	.stretched .article-image-open { width: 100%; }
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
