<script lang="ts">
	import type { BlockEditorDoc, ImageBlock } from '@repo/shared';
	import { assetImage, type AssetImageSource } from '#lib/directus/assets.ts';
	import { siteLabels } from '#lib/content/index.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { resolveThemeValue, watchTheme, type Theme } from '#lib/utils/theme-media.ts';
	import { onMount } from 'svelte';
	import { Dialog as DialogPrimitive } from 'bits-ui';

	const locale = getLocale();

	let { doc }: { doc: BlockEditorDoc } = $props();

	let activeTheme = $state<Theme>('dark');

	const images = $derived(doc.blocks.filter((block): block is ImageBlock => block.type === 'image'));
	let activeImage = $state<ImageBlock | null>(null);
	let opener: HTMLButtonElement | null = null;
	let closeButton: HTMLButtonElement | undefined = $state();
	const activeCaption = $derived(activeImage ? stripHtml(activeImage.data.caption) : '');
	const projectImageOpenTemplate = $derived(resolveLocale(siteLabels.a11y.projectImageOpen, locale));
	const projectImageCloseLabel = $derived(resolveLocale(siteLabels.a11y.projectImageClose, locale));
	const activeSource = $derived(
		activeImage ? imageSource(activeImage, 'hero-1200') : undefined,
	);

	// Thumbnails sit in a 2-col grid inside the detail page's center column;
	// the lightbox panel is min(96vw, 1440px).
	const THUMB_SIZES = '(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 92vw';
	const LIGHTBOX_SIZES = 'min(96vw, 1440px)';

	onMount(() => {
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

	function closeImage(event?: Event): void {
		event?.stopPropagation();
		activeImage = null;
	}

	function restoreOpener(event: Event): void {
		event.preventDefault();
		if (opener?.isConnected) opener.focus({ preventScroll: true });
	}
</script>

<div class="project-image-gallery" data-testid="project-image-gallery">
	{#each images as image (image.id)}
		{@const source = imageSource(image, 'hero-1200')}
		<figure class="project-image-gallery__item">
			<button
				type="button"
				class="project-image-gallery__trigger"
				aria-label={openImageLabel(image)}
				data-testid="project-image-gallery-trigger"
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
			{#if image.data.caption}
				<figcaption>{@html image.data.caption}</figcaption>
			{/if}
		</figure>
	{/each}
</div>

<DialogPrimitive.Root open={activeImage !== null} onOpenChange={(open) => { if (!open) closeImage(); }}>
	<DialogPrimitive.Portal>
	{#if activeImage}
		{@const caption = activeImage.data.caption}
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
						aria-label={projectImageCloseLabel}
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
							aria-label={projectImageCloseLabel}
							bind:this={closeButton}
							onclick={closeImage}
						>
							<span class="project-image-gallery__close-mark" aria-hidden="true"></span>
						</button>
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
						{#if caption}
							<p class="project-image-gallery__lightbox-caption">{@html caption}</p>
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
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
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

	figcaption {
		margin-top: 0.55rem;
		color: color-mix(in srgb, var(--foreground) 62%, transparent);
		font-size: var(--text-caption);
		line-height: 1.55;
	}

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
		font-size: var(--text-caption);
		line-height: 1.55;
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
