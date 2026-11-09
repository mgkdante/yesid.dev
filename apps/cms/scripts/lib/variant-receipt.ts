/** Committed encoding receipts let builds verify bytes instead of re-encoding them. */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { MediaVariantEntry } from '@repo/shared';
import type { MediaVariantsManifestInput, PreparedMediaVariants } from './media-variants';

// Bump the recipe whenever resize, width selection, fallback or encoding rules change.
async function variantRecipe(): Promise<string> {
	const { default: sharp } = await import('sharp');
	return `widths-240-600-1200-1600-webp-q82-v1/sharp-${sharp.versions.sharp}/vips-${sharp.versions.vips}/webp-${sharp.versions.webp}`;
}
export interface VariantReceipt {
	recipe: string;
	assets: Record<string, { sourceSha256: string; data: MediaVariantEntry; outputs: Record<string, string> }>;
}

export async function fileDigest(path: string): Promise<string> {
	const hash = createHash('sha256');
	for await (const chunk of createReadStream(path)) hash.update(chunk);
	return hash.digest('hex');
}

export async function readVariantReceipt(repoRoot: string): Promise<VariantReceipt | undefined> {
	try {
		return JSON.parse(await readFile(resolve(repoRoot, 'apps/cms/fixtures/media-variants-receipt.json'), 'utf8'));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
		throw error;
	}
}

export async function reuseVariant(
	receipt: VariantReceipt | undefined, staticRoot: string, legacyPath: string,
): Promise<MediaVariantEntry | undefined> {
	if (!receipt || receipt.recipe !== await variantRecipe()) return undefined;
	const entry = receipt.assets[legacyPath];
	if (!entry || await fileDigest(resolve(staticRoot, legacyPath)) !== entry.sourceSha256) return undefined;
	for (const variant of entry.data.variants) {
		if (variant.path === `/${legacyPath}`) continue;
		const digest = entry.outputs[variant.path];
		if (!digest) return undefined;
		try {
			if (await fileDigest(resolve(staticRoot, variant.path.slice(1))) !== digest) return undefined;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
			throw error;
		}
	}
	return entry.data;
}

/** Called only by the explicit local refresh command after writing generated variants. */
export async function createVariantReceipt(
	manifest: MediaVariantsManifestInput, prepared: PreparedMediaVariants, repoRoot: string,
): Promise<VariantReceipt> {
	const staticRoot = resolve(repoRoot, manifest.sourceRoot);
	const assets: VariantReceipt['assets'] = {};
	for (const [path, data] of Object.entries(prepared.data)) {
		const legacyPath = path.slice(1);
		const outputs: Record<string, string> = {};
		for (const variant of data.variants) {
			if (variant.path !== path) outputs[variant.path] = await fileDigest(resolve(staticRoot, variant.path.slice(1)));
		}
		assets[legacyPath] = { sourceSha256: await fileDigest(resolve(staticRoot, legacyPath)), data, outputs };
	}
	return { recipe: await variantRecipe(), assets };
}
