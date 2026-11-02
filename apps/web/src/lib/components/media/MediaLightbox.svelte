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

	import { articleMediaLabels, type ArticleMedia } from '#lib/media/article-media.svelte.ts';
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import YouTubeVideoPlayer from '#lib/components/cms/blocks/YouTubeVideo.svelte';
	let { media }: { media: ArticleMedia } = $props();
	const locale = getLocale();
	const labels = articleMediaLabels[locale];
	const videoLabels = youtubeLabels[locale];
	let activeTheme = $state<Theme>('dark');
	let closeButton: HTMLButtonElement | undefined = $state();
	let touchStart: { x: number; y: number } | null = null;
	const activeImage = $derived(media.selection?.kind === 'image' ? media.images[media.index] : null);
	const activeVideo = $derived(media.selection?.kind === 'video' ? media.videos[media.index] : null);
	const activeDiagram = $derived(media.selection?.kind === 'diagram' ? media.selection : null);
	const activeCaption = $derived(activeImage ? stripHtml(activeImage.data.caption) : activeDiagram?.label || activeVideo?.caption || videoLabels.title);
	const closeLabel = $derived(activeVideo ? videoLabels.close : resolveLocale(siteLabels.a11y.projectImageClose, locale));
	const activeSource = $derived(activeImage ? imageSource(activeImage, 'hero-1200') : undefined);
	const LIGHTBOX_SIZES = 'min(96vw, 1440px)';
	onMount(() => watchTheme((theme) => { activeTheme = theme; }));

	function imageSource(image: ImageBlock, preset: string): AssetImageSource {
		const file = resolveThemeValue(activeTheme, image.data.file, image.data.variants?.light);
		return file.fileId ? assetImage(file.fileId, preset) : { src: file.url };
	}
	function stripHtml(value: string): string { return value.replace(/<[^>]*>/g, ''); }

	function closeImage(event?: Event) { event?.stopPropagation(); media.close(); }
	function navigateKey(event: KeyboardEvent) {
		if (!media.selection || event.altKey || event.ctrlKey || event.metaKey) return;
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			event.preventDefault();
			event.stopPropagation();
			media.move(event.key === 'ArrowLeft' ? -1 : 1);
		}
	}
	function startSwipe(event: TouchEvent) {
		const touch = event.touches.length === 1 ? event.touches[0] : undefined;
		touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
	}
	function endSwipe(event: TouchEvent) {
		const touch = event.changedTouches[0];
		if (touchStart && touch) {
			const dx = touch.clientX - touchStart.x;
			const dy = touch.clientY - touchStart.y;
			if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) media.move(dx < 0 ? 1 : -1);
		}
		touchStart = null;
	}
</script>
<svelte:window onkeydown={navigateKey} />
<DialogPrimitive.Root open={media.selection !== null} onOpenChange={(open) => { if (!open) closeImage(); }}>
	<DialogPrimitive.Portal>
	{#if media.selection}
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
				onCloseAutoFocus={media.restoreOpener}
			>
				{#snippet child({ props })}
					<div {...props} class="project-image-gallery__lightbox-panel" data-lenis-prevent data-card-interactive ontouchstart={startSwipe} ontouchend={endSwipe} ontouchcancel={() => { touchStart = null; }}>
						<button
							type="button"
							class="project-image-gallery__close"
							aria-label={closeLabel}
							bind:this={closeButton}
							onclick={closeImage}
						>
							<span class="project-image-gallery__close-mark" aria-hidden="true"></span>
						</button>
						{#if media.selection?.kind !== 'diagram'}
							<div class="article-media-navigation" data-card-interactive>
								<button type="button" aria-label={labels.previous} disabled={media.index === 0} onclick={() => media.move(-1)}>←</button>
								<span role="status" aria-label={labels.position}>{media.index + 1} / {media.count}</span>
								<button type="button" aria-label={labels.next} disabled={media.index === media.count - 1} onclick={() => media.move(1)}>→</button>
							</div>
						{/if}
						{#if activeDiagram}
							<div class="article-media-diagram" data-testid="article-media-diagram">{@html activeDiagram.svg}</div>
						{:else if activeImage}
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
							{#key activeVideo.id}<YouTubeVideoPlayer video={activeVideo} active />{/key}
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
	.project-image-gallery__lightbox { --project-image-gallery-mat: #050505; }
	:global([data-theme="light"]) .project-image-gallery__lightbox,
	:global(.theme-light) .project-image-gallery__lightbox { --project-image-gallery-mat: #fff; }

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
	.project-image-gallery__close:focus-visible {
		outline: 3px solid var(--ring);
		outline-offset: 3px;
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

	.article-media-navigation { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 0.5rem 3.75rem; flex-shrink: 0; }
	.article-media-navigation button { border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--surface-2); color: var(--foreground); min-width: 2.75rem; min-height: 2.75rem; cursor: pointer; }
	.article-media-navigation button:disabled { opacity: 0.35; cursor: default; }
	.article-media-navigation button:focus-visible { outline: 3px solid var(--ring); outline-offset: 2px; }
	.article-media-diagram { padding: 3.75rem 1rem 1rem; overflow: auto; }
	.article-media-diagram :global(svg) { display: block; width: 100%; max-width: none !important; height: auto; }
</style>
