<!--
		ImageBlock.svelte renders Editor.js `image` blocks.
		data.file.fileId is the Directus file UUID; data.file.url is the asset URL.
		AM2: caption is HTML, rendered via {@html}.
-->
<script lang="ts" module>
	/** Article column width on desktop (px). */
	export const ARTICLE_COLUMN = 680;
</script>

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

	let { data, slot = ARTICLE_COLUMN }: {
		data: ImageBlock['data'];
		/** Desktop width (px) of the column this image sits in; rows and beside layouts pass less. */
		slot?: number;
	} = $props();
	const media = getArticleMedia();
	const labels = articleMediaLabels[getLocale()];
	const openTemplate = resolveLocale(siteLabels.a11y.projectImageOpen, getLocale());
	let activeTheme = $state<Theme>('dark');
	onMount(() => watchTheme((theme) => { activeTheme = theme; }));
	const file = $derived(resolveThemeValue(activeTheme, data.file, data.variants?.light));

	const altText = $derived(data.caption ? data.caption.replace(/<[^>]*>/g, '') : '');

	const PORTRAIT_CAP = 400;
	const PAIR_GAP = 24;
	const isPortrait = (f: ImageBlockFile) => (f.height ?? 0) > (f.width ?? Infinity);
	const pair = $derived(Boolean(data.showBothThemes && data.variants?.light));
	/** The rendered width: the column (halved for a theme pair on desktop), never above the portrait cap. */
	function sizesFor(f: ImageBlockFile): string {
		const desktop = Math.round(pair ? (slot - PAIR_GAP) / 2 : slot);
		if (!isPortrait(f)) return `(min-width: 768px) ${desktop}px, 94vw`;
		const cap = Math.min(PORTRAIT_CAP, f.width!);
		return `(min-width: 768px) ${Math.min(desktop, cap)}px, (max-width: ${Math.ceil(cap / 0.94)}px) 94vw, ${cap}px`;
	}
</script>

{#snippet image(file: ImageBlockFile)}
	{@const source = file.fileId ? assetImage(file.fileId, 'card-600') : { src: file.url, srcset: undefined, width: undefined, height: undefined }}
	<img src={source.src} srcset={source.srcset} sizes={sizesFor(file)}
		width={file.width ?? source.width} height={file.height ?? source.height}
		alt={altText} loading="lazy" decoding="async" />
{/snippet}

{#snippet capture(file: ImageBlockFile, theme: Theme, label?: string)}
	{@const portrait = isPortrait(file)}
	<figure class:bordered={data.withBorder} class:bg={data.withBackground} class:stretched={data.stretched}
		class:portrait style={portrait ? `--portrait-width: ${Math.min(file.width!, PORTRAIT_CAP)}px` : undefined}>
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

{#if pair && data.variants?.light}
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
