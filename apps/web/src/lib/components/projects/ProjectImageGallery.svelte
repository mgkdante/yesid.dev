<script lang="ts">
	import type { BlockEditorDoc, ImageBlock } from '@repo/shared';
	import { assetImage, type AssetImageSource } from '#lib/directus/assets.ts';
	import { siteLabels } from '#lib/content/index.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import type { Theme } from '@yesid/ui/state';
	import { resolveThemeValue, watchTheme } from '#lib/utils/theme-media.ts';
	import { onMount } from 'svelte';
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import YouTubeVideoPlayer from '#lib/components/cms/blocks/YouTubeVideo.svelte';
	import { youtubeLabels, type YouTubeVideo } from '#lib/utils/youtube.ts';

	const locale = getLocale();

	let { doc, videos = [] }: { doc: BlockEditorDoc; videos?: readonly YouTubeVideo[] } = $props();

	let activeTheme = $state<Theme>('dark');
	let hydrated = $state(false);

	const images = $derived(doc.blocks.filter((block): block is ImageBlock => block.type === 'image'));
	let activeImage = $state<ImageBlock | null>(null);
	let activeVideo = $state<YouTubeVideo | null>(null);
	let opener: HTMLButtonElement | null = null;
	let closeButton: HTMLButtonElement | undefined = $state();
	const videoLabels = $derived(youtubeLabels[locale]);
	const activeCaption = $derived(activeImage ? stripHtml(activeImage.data.caption) : activeVideo?.caption || videoLabels.title);
	const projectImageOpenTemplate = $derived(resolveLocale(siteLabels.a11y.projectImageOpen, locale));
	const projectImageCloseLabel = $derived(resolveLocale(siteLabels.a11y.projectImageClose, locale));
	const closeLabel = $derived(activeVideo ? videoLabels.close : projectImageCloseLabel);
	const activeSource = $derived(
		activeImage ? imageSource(activeImage, 'hero-1200') : undefined,
	);

	// The same images serve the mobile strip and desktop rail;
	// the lightbox panel is min(96vw, 1440px).
	const THUMB_SIZES = '(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 92vw';
	const LIGHTBOX_SIZES = 'min(96vw, 1440px)';

	onMount(() => {
		hydrated = true;
		return watchTheme((theme) => {
			activeTheme = theme;
		});
	});

	function imageSource(image: ImageBlock, preset: string): AssetImageSource {
		const file = resolveThemeValue(activeTheme, image.data.file, image.data.variants?.light);
		return file.fileId ? assetImage(file.fileId, preset) : { src: file.url };
	}

	function stripHtml(value: string): string {
		return value.replace(/<[^>]*>/g, '');
	}

	function openImageLabel(image: ImageBlock): string {
		return projectImageOpenTemplate.replace('{caption}', stripHtml(image.data.caption));
	}

	function openImage(image: ImageBlock, event: MouseEvent): void {
		event.stopPropagation();
		opener = event.currentTarget as HTMLButtonElement;
		activeImage = image;
	}

	function openVideo(video: YouTubeVideo, event: MouseEvent): void {
		event.stopPropagation();
		opener = event.currentTarget as HTMLButtonElement;
		activeVideo = video;
	}

	function closeImage(event?: Event): void {
		event?.stopPropagation();
		activeImage = null;
		activeVideo = null;
	}

	function restoreOpener(event: Event): void {
		event.preventDefault();
		if (opener?.isConnected) opener.focus({ preventScroll: true });
	}
</script>

<div class="project-image-gallery" data-testid="project-image-gallery" data-lenis-prevent>
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
				onclick={(event) => openImage(image, event)}
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
				onclick={(event) => openVideo(video, event)}
			>
				<img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
				<span class="project-image-gallery__play" aria-hidden="true">▶</span>
			</button>
		</figure>
	{/each}
</div>

<DialogPrimitive.Root open={activeImage !== null || activeVideo !== null} onOpenChange={(open) => { if (!open) closeImage(); }}>
	<DialogPrimitive.Portal>
	{#if activeImage || activeVideo}
		<div
			class="project-image-gallery__lightbox"
			data-testid="project-image-gallery-lightbox"
		>
			<DialogPrimitive.Overlay>
				{#snippet child({ props })}
					<button
						{...props}
						type="button"
						class="project-image-gallery__backdrop"
						aria-label={closeLabel}
						tabindex="-1"
						data-testid="project-image-gallery-backdrop"
						onclick={closeImage}
					></button>
				{/snippet}
			</DialogPrimitive.Overlay>
			<DialogPrimitive.Content
				aria-label={activeCaption}
				onOpenAutoFocus={(event) => { event.preventDefault(); closeButton?.focus({ preventScroll: true }); }}
				onCloseAutoFocus={restoreOpener}
			>
				{#snippet child({ props })}
					<div {...props} class="project-image-gallery__lightbox-panel" data-lenis-prevent>
						<button
							type="button"
							class="project-image-gallery__close"
							aria-label={closeLabel}
							bind:this={closeButton}
							onclick={closeImage}
						>
							<span class="project-image-gallery__close-mark" aria-hidden="true"></span>
						</button>
						{#if activeImage}
						<img
							src={activeSource?.src}
							srcset={activeSource?.srcset}
							sizes={LIGHTBOX_SIZES}
							width={activeSource?.width}
							height={activeSource?.height}
							alt={activeCaption}
							decoding="async"
							data-testid="project-image-gallery-lightbox-image"
						/>
						{#if activeImage.data.caption}
							<p class="project-image-gallery__lightbox-caption">{@html activeImage.data.caption}</p>
						{/if}
						{:else if activeVideo}
							<YouTubeVideoPlayer video={activeVideo} active />
							{#if activeVideo.caption}
								<p class="project-image-gallery__lightbox-caption">{activeVideo.caption}</p>
							{/if}
						{/if}
					</div>
				{/snippet}
			</DialogPrimitive.Content>
		</div>
	{/if}
	</DialogPrimitive.Portal>
</DialogPrimitive.Root>

<style>
	.project-image-gallery,
	.project-image-gallery__lightbox {
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
		.project-image-gallery {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			overflow-x: visible;
			scroll-snap-type: none;
		}
	}

	:global([data-theme="light"]) .project-image-gallery,
	:global(.theme-light) .project-image-gallery,
	:global([data-theme="light"]) .project-image-gallery__lightbox,
	:global(.theme-light) .project-image-gallery__lightbox {
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

	.project-image-gallery__trigger:focus-visible,
	.project-image-gallery__close:focus-visible {
		outline: 3px solid var(--ring);
		outline-offset: 3px;
	}

	.project-image-gallery__video-trigger { position: relative; cursor: pointer; }
	.project-image-gallery__play { position: absolute; inset: 0; display: grid; place-items: center; font-size: 3rem; color: #fff; text-shadow: 0 2px 12px #000; }

	.project-image-gallery__lightbox {
		position: fixed;
		inset: 0;
		z-index: var(--z-overlay);
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		place-items: center;
		padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right))
			max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
		background: color-mix(in srgb, var(--background) 86%, black);
	}

	.project-image-gallery__backdrop {
		position: absolute;
		inset: 0;
		border: 0;
		background: transparent;
		cursor: zoom-out;
	}

	.project-image-gallery__lightbox-panel {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		width: min(96vw, 1440px);
		max-width: 100%;
		max-height: 90dvh;
		border: 3px solid var(--border-brand-active);
		border-radius: var(--radius-md);
		background: var(--surface-2);
		box-shadow: var(--shadow-section), inset 0 1px 0 var(--edge-highlight),
			0 24px 80px color-mix(in srgb, black 45%, transparent);
		overflow: hidden;
		cursor: default;
	}

	.project-image-gallery__lightbox-panel img {
		display: block;
		width: 100%;
		min-height: 0;
		max-height: calc(90dvh - 4rem);
		object-fit: contain;
		background: var(--project-image-gallery-mat);
	}

	.project-image-gallery__lightbox-caption {
		margin: 0;
		flex-shrink: 0;
		max-height: 40dvh;
		overflow-y: auto;
		border-top: 1px solid color-mix(in srgb, var(--primary) 22%, transparent);
		padding: 0.85rem 1rem 1rem;
		color: color-mix(in srgb, var(--foreground) 70%, transparent);
	}

	.project-image-gallery__close {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		z-index: 1;
		display: grid;
		width: 2.5rem;
		height: 2.5rem;
		place-items: center;
		border: 1px solid color-mix(in srgb, var(--primary) 42%, transparent);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--surface-2) 90%, transparent);
		color: var(--foreground);
		cursor: pointer;
	}

	.project-image-gallery__close-mark,
	.project-image-gallery__close-mark::before,
	.project-image-gallery__close-mark::after {
		display: block;
		width: 1rem;
		height: 2px;
		border-radius: var(--radius-pill);
		background: currentColor;
	}

	.project-image-gallery__close-mark {
		position: relative;
		background: transparent;
	}

	.project-image-gallery__close-mark::before,
	.project-image-gallery__close-mark::after {
		position: absolute;
		content: '';
	}

	.project-image-gallery__close-mark::before {
		transform: rotate(45deg);
	}

	.project-image-gallery__close-mark::after {
		transform: rotate(-45deg);
	}

	@media (--tablet-min) {
		.project-image-gallery {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
