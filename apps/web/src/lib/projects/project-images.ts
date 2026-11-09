import type { BlockEditorDoc, ImageBlock, ImageBlockFile } from '@repo/shared';

export type GalleryImage = ImageBlock & { captureTheme?: 'dark' | 'light' };

/** Expand after deduplication so repeated inline images do not repeat captures. */
export function collectProjectGalleryImages(docs: readonly BlockEditorDoc[]): GalleryImage[] {
	return collectImages(docs, true).flatMap((image): GalleryImage[] => {
		const light = image.data.variants?.light;
		if (!light) return [image];
		return [
			{ ...image, id: `${image.id}:dark`, captureTheme: 'dark' },
			{ ...image, id: `${image.id}:light`, captureTheme: 'light', data: { ...image.data, file: light } },
		];
	});
}

export function imageIdentity(file: ImageBlockFile): string | undefined {
	if (file.fileId.trim()) return `file:${file.fileId.trim().toLowerCase()}`;
	for (const url of [file.fileURL, file.url]) {
		const id = url.match(/\/(?:assets|files)\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?:[/?#]|$)/i)?.[1];
		if (id) return `file:${id.toLowerCase()}`;
	}
	const url = file.url.trim() || file.fileURL.trim();
	return url ? `url:${url}` : undefined;
}

/** Stable across section-local editor IDs, including pairs that share a dark asset. */
export function imagePairIdentity(data: ImageBlock['data']): string | undefined {
	const dark = imageIdentity(data.file);
	return dark ? JSON.stringify([dark, data.variants?.light ? imageIdentity(data.variants.light) : null]) : undefined;
}

/** First authored occurrence owns order/caption; editor block IDs are local to each document. */
export function collectProjectImages(docs: readonly BlockEditorDoc[]): ImageBlock[] {
	return collectImages(docs, false);
}

function collectImages(docs: readonly BlockEditorDoc[], preservePairs: boolean): ImageBlock[] {
	const images = new Map<string, ImageBlock>();
	for (const doc of docs) {
		for (const block of doc.blocks) {
			if (block.type !== 'image') continue;
			const identity = preservePairs ? imagePairIdentity(block.data) : imageIdentity(block.data.file);
			if (!identity) continue;
			const previous = images.get(identity);
			if (!previous) {
				images.set(identity, { ...block, id: identity });
			} else {
				images.set(identity, {
					...previous,
					data: {
						...previous.data,
						caption: previous.data.caption || block.data.caption,
						variants: previous.data.variants?.light ? previous.data.variants : block.data.variants,
					},
				});
			}
		}
	}
	return [...images.values()];
}
