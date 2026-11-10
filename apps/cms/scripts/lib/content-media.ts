/** Discover media identities only at the exported content boundary. */
import type { ExportData } from '../export-data';
import type { ImageBlock } from '@repo/shared';

export const FILE_ID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$(?![\s\S])/i;
const mediaFields = new Set(['image', 'imageLight', 'imageSecondary', 'imageSecondaryLight',
	'coverImage', 'ogImage', 'defaultOgImage', 'fileId']);

export function imageBlocks(value: unknown): ImageBlock['data'][] {
	if (!value || typeof value !== 'object') return [];
	const record = value as Record<string, unknown>;
	return [...(record.type === 'image' && record.data ? [(record as unknown as ImageBlock).data] : []),
		...Object.values(record).flatMap(imageBlocks)];
}

export function referencedMedia(data: ExportData): string[] {
	const ids = new Set<string>();
	for (const block of imageBlocks(data)) {
		for (const file of [block.file, block.variants?.light]) {
			if (file && !file.fileId && !/^\/(images|svg|og)\//.test(file.url)) {
				throw new Error('Image blocks must select a CMS file or an existing site-local image');
			}
		}
	}
	function visit(value: unknown): void {
		if (!value || typeof value !== 'object') return;
		for (const [key, child] of Object.entries(value)) {
			if (mediaFields.has(key) && typeof child === 'string' && child && !child.startsWith('/')) {
				if (!FILE_ID.test(child)) throw new Error(`Invalid CMS image identity: ${child}`);
				ids.add(child);
			} else visit(child);
		}
	}
	const { mediaAssets: _assets, mediaVariants: _variants, ...content } = data;
	visit(content);
	return [...ids].sort();
}

/** Fixture placeholders are conspicuous and never resolve against the CMS. */
export function fixtureMedia(data: ExportData): void {
	const assets = { ...data.mediaAssets };
	for (const id of referencedMedia(data)) assets[id] ??= '/images/cms-fixture-placeholder.png';
	data.mediaAssets = assets;
}
