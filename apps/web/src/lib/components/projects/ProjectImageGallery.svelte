<script lang="ts">
	import type { BlockEditorDoc, ImageBlock } from '@repo/shared';
	import { asset } from '$lib/directus/assets';
	import { siteLabels } from '$lib/content';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { getActiveTheme, resolveThemeValue, watchTheme, type Theme } from '$lib/utils/theme-media';
	import { onMount } from 'svelte';

	const locale = getLocale();

	let { doc }: { doc: BlockEditorDoc } = $props();

	let activeTheme = $state<Theme>(getActiveTheme());

	const images = $derived(doc.blocks.filter((block): block is ImageBlock => block.type === 'image'));
	let activeImage = $state<ImageBlock | null>(null);
	const activeCaption = $derived(activeImage ? stripHtml(activeImage.data.caption) : '');
	const projectImageOpenTemplate = $derived(resolveLocale(siteLabels.a11y.projectImageOpen, locale));
	const projectImageCloseLabel = $derived(resolveLocale(siteLabels.a11y.projectImageClose, locale));
	const activeSrc = $derived(
		activeImage ? imageSrc(activeImage, 'hero-1200') : '',
	);

	onMount(() => {
		return watchTheme((theme) => {
			activeTheme = theme;
		});
	});

	function imageSrc(image: ImageBlock, preset: string): string {
		const file = resolveThemeValue(activeTheme, image.data.file, image.data.variants?.light);
		return file.fileId ? asset(file.fileId, preset) : file.url;
	}

	function stripHtml(value: string): string {
		return value.replace(/<[^>]*>/g, '');
	}

	function openImageLabel(image: ImageBlock): string {
		return projectImageOpenTemplate.replace('{caption}', stripHtml(image.data.caption));
	}

	function openImage(image: ImageBlock, event: MouseEvent): void {
		event.stopPropagation();
		activeImage = image;
	}

	function closeImage(event?: Event): void {
		event?.stopPropagation();
		activeImage = null;
	}

	function onDialogKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') closeImage(event);
	}

	function onWindowKeydown(event: KeyboardEvent): void {
		if (!activeImage) return;
		if (event.key === 'Escape') closeImage(event);
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="project-image-gallery" data-testid="project-image-gallery">
	{#each images as image (image.id)}
		<figure class="project-image-gallery__item">
			<button
				type="button"
				class="project-image-gallery__trigger"
				aria-label={openImageLabel(image)}
				data-testid="project-image-gallery-trigger"
				onclick={(event) => openImage(image, event)}
			>
				<img
					src={imageSrc(image, 'hero-1200')}
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

{#if activeImage}
	<div
		class="project-image-gallery__lightbox"
		data-testid="project-image-gallery-lightbox"
	>
		<button
			type="button"
			class="project-image-gallery__backdrop"
			aria-label={projectImageCloseLabel}
			data-testid="project-image-gallery-backdrop"
			onclick={closeImage}
		></button>
		<div
			class="project-image-gallery__lightbox-panel"
			role="dialog"
			aria-modal="true"
			aria-label={activeCaption}
			onkeydown={onDialogKeydown}
			tabindex="-1"
		>
			<button
				type="button"
				class="project-image-gallery__close"
				aria-label={projectImageCloseLabel}
				onclick={closeImage}
			>
				<span class="project-image-gallery__close-mark" aria-hidden="true"></span>
			</button>
			<img
				src={activeSrc}
				alt={activeCaption}
				decoding="async"
				data-testid="project-image-gallery-lightbox-image"
			/>
			{#if activeImage.data.caption}
				<p class="project-image-gallery__lightbox-caption">{@html activeImage.data.caption}</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.project-image-gallery {
		--project-image-gallery-mat: #050505;

		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	:global([data-theme="light"]) .project-image-gallery,
	:global(.theme-light) .project-image-gallery {
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
		z-index: 1000;
		display: grid;
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
		width: min(96vw, 1440px);
		max-height: 90vh;
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
		max-height: calc(90vh - 4rem);
		object-fit: contain;
		background: var(--project-image-gallery-mat);
	}

	.project-image-gallery__lightbox-caption {
		margin: 0;
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

	@media (min-width: 768px) {
		.project-image-gallery {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
