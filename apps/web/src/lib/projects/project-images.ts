import type { BlockEditorDoc, ImageBlock, ImageBlockFile } from '@repo/shared';

function fileIdentity(file: ImageBlockFile): string | undefined {
	if (file.fileId.trim()) return `file:${file.fileId.trim().toLowerCase()}`;
	for (const url of [file.fileURL, file.url]) {
		const id = url.match(/\/(?:assets|files)\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?:[/?#]|$)/i)?.[1];
		if (id) return `file:${id.toLowerCase()}`;
	}
	const url = file.url.trim() || file.fileURL.trim();
	return url ? `url:${url}` : undefined;
}

/** First authored occurrence owns order/caption; editor block IDs are local to each document. */
export function collectProjectImages(docs: readonly BlockEditorDoc[]): ImageBlock[] {
	const images = new Map<string, ImageBlock>();
	for (const doc of docs) {
		for (const block of doc.blocks) {
			if (block.type !== 'image') continue;
			const identity = fileIdentity(block.data.file);
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
