<script lang="ts">
	import { assetImage, type AssetImageSource } from '#lib/directus/assets.ts';
	import { siteLabels } from '#lib/content/index.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import type { Theme } from '@yesid/ui/state';
	import { resolveThemeValue, watchTheme } from '#lib/utils/theme-media.ts';
	import { onMount } from 'svelte';
	import type { ImageBlock } from '@repo/shared';
	import { youtubeLabels } from '#lib/utils/youtube.ts';

	import { getArticleMedia } from '#lib/media/article-media.svelte.ts';
	let { kind }: { kind: 'image' | 'video' } = $props();
	const media = getArticleMedia()!;
	const locale = getLocale();
	let activeTheme = $state<Theme>('dark');
	let hydrated = $state(false);
	const images = $derived(kind === 'image' ? media.images : []);
	const videos = $derived(kind === 'video' ? media.videos : []);
	const videoLabels = youtubeLabels[locale];
	const projectImageOpenTemplate = resolveLocale(siteLabels.a11y.projectImageOpen, locale);
	const THUMB_SIZES = '(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 92vw';
	onMount(() => {
		hydrated = true;
		return watchTheme((theme) => { activeTheme = theme; });
	});

	function imageSource(image: ImageBlock, preset: string): AssetImageSource {
		const file = resolveThemeValue(activeTheme, image.data.file, image.data.variants?.light);
		return file.fileId ? assetImage(file.fileId, preset) : { src: file.url };
	}
	function stripHtml(value: string): string { return value.replace(/<[^>]*>/g, ''); }

	function openImageLabel(image: ImageBlock): string {
		return projectImageOpenTemplate.replace('{caption}', stripHtml(image.data.caption));
	}
</script>
<div class="project-image-gallery" class:project-image-gallery--videos={kind === 'video'} data-testid={kind === 'image' ? 'project-image-gallery' : 'article-video-gallery'} data-lenis-prevent>
	{#each images as image (image.id)}
		{@const source = imageSource(image, 'hero-1200')}
		<figure class="project-image-gallery__item">
			<button
				type="button"
				disabled={!hydrated}
				class="project-image-gallery__trigger"
				aria-label={openImageLabel(image)}
				data-testid="project-image-gallery-trigger"
				onfocus={(event) => event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' })}
				onclick={(event) => { event.stopPropagation(); media.openImage(image.data, event.currentTarget); }}
			>
				<img
					src={source.src}
					srcset={source.srcset}
					sizes={THUMB_SIZES}
					width={source.width}
					height={source.height}
					alt={stripHtml(image.data.caption)}
					loading="lazy"
					decoding="async"
				/>
			</button>
		</figure>
	{/each}
	{#each videos as video (video.id)}
		<figure class="project-image-gallery__item">
			<button
				type="button"
				disabled={!hydrated}
				class="project-image-gallery__trigger project-image-gallery__video-trigger"
				aria-label={`${videoLabels.play}: ${video.caption || videoLabels.title}`}
				data-testid="project-video-gallery-trigger"
				onfocus={(event) => event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' })}
				onclick={(event) => { event.stopPropagation(); media.openVideo(video, event.currentTarget); }}
			>
				<img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
				<span class="project-image-gallery__play" aria-hidden="true">▶</span>
			</button>
		</figure>
	{/each}
</div>

<style>
	.project-image-gallery {
		--project-image-gallery-mat: #050505;
	}

	.project-image-gallery {
		display: flex;
		gap: 1rem;
		max-width: 100%;
		min-width: 0;
		overflow-x: auto;
		scroll-snap-type: x proximity;
		scroll-padding-inline: 0.5rem;
		padding: 0.5rem;
		overscroll-behavior-x: contain;
	}

	@media (--desktop-min) {
		.project-image-gallery:not(.project-image-gallery--videos) {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			overflow-x: visible;
			scroll-snap-type: none;
		}
	}

	:global([data-theme="light"]) .project-image-gallery,
	:global(.theme-light) .project-image-gallery {
		--project-image-gallery-mat: #fff;
	}

	.project-image-gallery__item {
		margin: 0;
		min-width: 0;
		flex: 0 0 90%;
		scroll-snap-align: center;
	}

	.project-image-gallery__trigger {
		display: block;
		width: 100%;
		overflow: hidden;
		aspect-ratio: 16 / 10;
		border: 1.5px solid var(--border-subtle);
		border-radius: var(--radius-md);
		background: var(--project-image-gallery-mat);
		padding: 0;
		cursor: zoom-in;
	}

	.project-image-gallery__trigger img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.project-image-gallery__trigger:focus-visible {
		outline: 3px solid var(--ring);
		outline-offset: 3px;
	}

	.project-image-gallery__video-trigger { position: relative; cursor: pointer; }
	.project-image-gallery__play { position: absolute; inset: 0; display: grid; place-items: center; font-size: 3rem; color: #fff; text-shadow: 0 2px 12px #000; }

	@media (--tablet-min) {
		.project-image-gallery:not(.project-image-gallery--videos) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

</style>
