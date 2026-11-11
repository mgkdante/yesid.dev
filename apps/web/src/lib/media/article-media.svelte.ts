import { getContext, setContext } from 'svelte';
import type { ImageBlock } from '@repo/shared';
import type { YouTubeVideo } from '#lib/utils/youtube.ts';
import { imageIdentity, imagePairIdentity, type GalleryImage } from '#lib/projects/project-images.ts';

export const articleMediaLabels = {
	en: { dark: 'Dark', light: 'Light', images: 'Images', previous: 'Previous', next: 'Next', position: 'Position', diagram: 'Enlarge diagram' },
	fr: { dark: 'Sombre', light: 'Clair', images: 'Images', previous: 'Précédent', next: 'Suivant', position: 'Position', diagram: 'Agrandir le diagramme' },
	es: { dark: 'Oscuro', light: 'Claro', images: 'Imágenes', previous: 'Anterior', next: 'Siguiente', position: 'Posición', diagram: 'Ampliar diagrama' },
};

type Selection = { kind: 'image' | 'video'; index: number } | { kind: 'diagram'; svg: string; label: string };
const ARTICLE_MEDIA = Symbol('article-media');

/** One controller per article, shared by inline openers and both gallery layouts. */
export function setArticleMedia(images: () => readonly GalleryImage[], videos: () => readonly YouTubeVideo[]) {
	let selection = $state<Selection | null>(null);
	let opener: HTMLElement | null = null;
	const media = {
		get images() { return images(); },
		get videos() { return videos(); },
		get selection() { return selection; },
		get count() { return selection?.kind === 'image' ? images().length : selection?.kind === 'video' ? videos().length : 1; },
		get index() { return selection && 'index' in selection ? selection.index : 0; },
		openImage(data: ImageBlock['data'], trigger: HTMLElement, galleryId?: string, displayedTheme: 'dark' | 'light' = 'dark') {
			const identity = imageIdentity(data.file);
			const pairId = imagePairIdentity(data);
			const captureId = data.variants?.light ? `${pairId}:${displayedTheme}` : pairId;
			let index = images().findIndex((image) => image.id === (galleryId ?? captureId));
			if (index < 0 && !galleryId) {
				// Blog lists retain one theme-selected item per original file.
				index = images().findIndex((image) => !image.captureTheme && imageIdentity(image.data.file) === identity);
			}
			if (index < 0) return;
			opener = trigger;
			selection = { kind: 'image', index };
		},
		openVideo(video: YouTubeVideo, trigger: HTMLElement) {
			const index = videos().findIndex((item) => item.id === video.id);
			if (index < 0) return;
			opener = trigger;
			selection = { kind: 'video', index };
		},
		openDiagram(svg: string, label: string, trigger: HTMLElement) {
			opener = trigger;
			selection = { kind: 'diagram', svg, label };
		},
		move(offset: number) {
			if (!selection || selection.kind === 'diagram' || media.count <= 1) return;
			const index = selection.index + offset;
			selection = { ...selection, index: selection.kind === 'image'
				? ((index % media.count) + media.count) % media.count
				: Math.max(0, Math.min(media.count - 1, index)) };
		},
		close() { selection = null; },
		restoreOpener(event: Event) {
			event.preventDefault();
			if (opener?.isConnected) opener.focus({ preventScroll: true });
		},
	};
	setContext(ARTICLE_MEDIA, media);
	return media;
}

export type ArticleMedia = ReturnType<typeof setArticleMedia>;
export function getArticleMedia(): ArticleMedia | undefined { return getContext(ARTICLE_MEDIA); }
