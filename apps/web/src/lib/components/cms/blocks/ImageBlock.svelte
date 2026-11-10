<!--
		ImageBlock.svelte renders Editor.js `image` blocks.
		data.file.fileId is the Directus file UUID; data.file.url is the asset URL.
		AM2: caption is HTML, rendered via {@html}.
-->
<script lang="ts">
	import type { ImageBlock, ImageBlockFile } from '@repo/shared';
	import { assetImage } from '#lib/directus/assets.ts';
	import { onMount } from 'svelte';
	import type { Theme } from '@yesid/ui/state';
	import { resolveThemeValue, watchTheme } from '#lib/utils/theme-media.ts';
	import { articleMediaLabels, getArticleMedia } from '#lib/media/article-media.svelte.ts';
	import { siteLabels } from '#lib/content/index.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';

	let { data }: { data: ImageBlock['data'] } = $props();
	const media = getArticleMedia();
	const labels = articleMediaLabels[getLocale()];
	const openTemplate = resolveLocale(siteLabels.a11y.projectImageOpen, getLocale());
	let activeTheme = $state<Theme>('dark');
	onMount(() => watchTheme((theme) => { activeTheme = theme; }));
	const file = $derived(resolveThemeValue(activeTheme, data.file, data.variants?.light));

	const altText = $derived(data.caption ? data.caption.replace(/<[^>]*>/g, '') : '');

	// Article column width is capped below the full viewport on desktop.
	const SIZES = '(min-width: 768px) 680px, 94vw';
</script>

{#snippet image(file: ImageBlockFile)}
	{@const source = file.fileId ? assetImage(file.fileId, 'card-600') : { src: file.url, srcset: undefined, width: undefined, height: undefined }}
	<img src={source.src} srcset={source.srcset} sizes={SIZES}
		width={file.width ?? source.width} height={file.height ?? source.height}
		alt={altText} loading="lazy" decoding="async" />
{/snippet}

{#snippet capture(file: ImageBlockFile, theme: Theme, label?: string)}
	{@const portrait = (file.height ?? 0) > (file.width ?? Infinity)}
	<figure class:bordered={data.withBorder} class:bg={data.withBackground} class:stretched={data.stretched}
		class:portrait style={portrait ? `--portrait-width: ${Math.min(file.width!, data.layout ? file.width! : 400)}px` : undefined}>
		{#if media}
			<button type="button" class="article-image-open" aria-label={openTemplate.replace('{caption}', label ? `${altText} · ${label}` : altText)} onclick={(event) => { event.stopPropagation(); media.openImage(data, event.currentTarget, undefined, theme); }}>
				{@render image(file)}
			</button>
		{:else}
			{@render image(file)}
		{/if}
		{#if data.caption || label}
			<figcaption>{@html data.caption}{label ? `${data.caption ? ' · ' : ''}${label}` : ''}</figcaption>
		{/if}
	</figure>
{/snippet}

{#if data.showBothThemes && data.variants?.light}
	<div class="theme-pair">
		{@render capture(data.file, 'dark', labels.dark)}
		{@render capture(data.variants.light, 'light', labels.light)}
	</div>
{:else}
	{@render capture(file, activeTheme)}
{/if}

<style>
	.article-image-open { display: block; max-width: 100%; border: 0; padding: 0; background: transparent; cursor: zoom-in; }
	.article-image-open:focus-visible { outline: 3px solid var(--ring); outline-offset: 3px; }
	.stretched .article-image-open { width: 100%; }
	.theme-pair { display: grid; gap: 1.5rem; min-width: 0; }
	.portrait { width: 100%; max-width: min(100%, var(--portrait-width)); margin-inline: auto; }
	.portrait img, .portrait .article-image-open { width: 100%; }
	@media (min-width: 768px) { .theme-pair { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
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
