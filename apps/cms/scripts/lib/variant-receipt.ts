/** Committed encoding receipts let builds verify bytes instead of re-encoding them. */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { MediaVariantEntry } from '@repo/shared';
import type { MediaVariantsManifestInput, PreparedMediaVariants } from './media-variants';
import { VARIANT_CONFIG, VARIANT_ALGORITHM_REVISION, pickVariantWidths, variantPathFor, type VariantConfig } from './variant-config';

async function variantRecipe(config: VariantConfig): Promise<string> {
	const { default: sharp } = await import('sharp');
	return JSON.stringify({ algorithm: VARIANT_ALGORITHM_REVISION, ...config,
		sharp: sharp.versions.sharp, vips: sharp.versions.vips, webpVersion: sharp.versions.webp });
}
export interface VariantReceipt {
	recipe: string;
	assets: Record<string, { sourceSha256: string; data: MediaVariantEntry; outputs: Record<string, string> }>;
}

export async function fileDigest(path: string): Promise<string> {
	return createHash('sha256').update(await readFile(path)).digest('hex');
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
	config: VariantConfig = VARIANT_CONFIG,
): Promise<MediaVariantEntry | undefined> {
	if (!receipt || receipt.recipe !== await variantRecipe(config)) return undefined;
	const entry = receipt.assets[legacyPath];
	if (!entry) return undefined;
	const sourceBytes = await readFile(resolve(staticRoot, legacyPath));
	if (createHash('sha256').update(sourceBytes).digest('hex') !== entry.sourceSha256) return undefined;
	const { default: sharp } = await import('sharp');
	const meta = await sharp(sourceBytes).metadata();
	if (!meta.width || !meta.height || entry.data.width !== meta.width || entry.data.height !== meta.height) return undefined;
	const widths = pickVariantWidths(meta.width, config.widths);
	const variants = entry.data.variants;
	if (!Array.isArray(variants) || !variants.length || variants.length > widths.length) return undefined;
	// A receipt cannot prove that encoding a rung would exceed the original size.
	// Regenerate any claimed original fallback through the normal encoding path.
	if (variants.some((variant) => variant.path === `/${legacyPath}`)) return undefined;
	if (variants.length !== widths.length) return undefined;
	if (Object.keys(entry.outputs).length !== variants.length) return undefined;
	try {
		for (const [index, variant] of variants.entries()) {
			const width = widths[index]!;
			if (variant.width !== width) return undefined;
			if (variant.path !== `/${variantPathFor(legacyPath, width)}`) return undefined;
			const digest = entry.outputs[variant.path];
			if (!digest) return undefined;
			const outputBytes = await readFile(resolve(staticRoot, variant.path.slice(1)));
			if (outputBytes.length >= sourceBytes.length || createHash('sha256').update(outputBytes).digest('hex') !== digest) return undefined;
			// JPEG shrink-on-load can round the scaled height by one pixel.
			const output = await sharp(outputBytes).metadata();
			if (output.format !== 'webp' || output.width !== width ||
				!output.height || Math.abs(output.height - Math.max(1, Math.round(meta.height * width / meta.width))) > 1) return undefined;
		}
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
		throw error;
	}
	return entry.data;
}

/** Called only by the explicit local refresh command after writing generated variants. */
export async function createVariantReceipt(
	manifest: MediaVariantsManifestInput, prepared: PreparedMediaVariants, repoRoot: string,
	config: VariantConfig = VARIANT_CONFIG,
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
	return { recipe: await variantRecipe(config), assets };
}
