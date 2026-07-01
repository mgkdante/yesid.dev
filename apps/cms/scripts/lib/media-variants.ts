/**
 * Media variant generation — consolidation-deploy-honesty slice.
 *
 * Emits width/format (webp) variants for every RASTER asset in the mirror
 * manifest, written NEXT TO the originals under apps/web/static and committed
 * (same model as the mirrored originals: hermetic/Vercel builds skip the
 * export, so anything the runtime needs must be in the repo). The companion
 * manifest data is emitted as the GENERATED media-variants.ts module; the web
 * asset helper composes srcset/width/height from it. Deliberately NOT Vercel
 * Image Optimization — that is a billed, per-transform feature; these are
 * plain static files behind the CDN.
 *
 * Variant naming: `<original-basename>.w<width>.webp`
 *   images/work/yesid-dev-home.png → images/work/yesid-dev-home.w600.webp
 *
 * Width ladder: the preset widths (thumb-240 / card-600 / hero-1200) plus a
 * 1600w rung for the lightbox, capped at the source's intrinsic width (never
 * upscale). The intrinsic width itself joins the ladder when the source is
 * smaller than the largest rung, so srcset always tops out at a real file.
 */

import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { MediaVariantEntry, MediaVariantSource } from '@repo/shared';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = resolve(SCRIPT_DIR, '../../../..');

/** Preset widths + lightbox rung. Keep ascending. */
export const VARIANT_WIDTHS = [240, 600, 1200, 1600] as const;

const RASTER_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);
const WEBP_QUALITY = 82;

export interface MediaVariantsManifestInput {
	sourceRoot: string;
	assets: readonly { legacyPath: string }[];
}

export function isRasterAsset(legacyPath: string): boolean {
	const ext = legacyPath.split('.').pop()?.toLowerCase() ?? '';
	return RASTER_EXTENSIONS.has(ext);
}

/**
 * Widths to generate for a source of `intrinsicWidth`: every ladder rung
 * strictly below the intrinsic width, plus the intrinsic width itself when it
 * is at or below the top rung (a small source still gets ONE full-size webp).
 * Sources wider than the top rung are capped at the top rung — no upscales,
 * no multi-megapixel webp for a 2482px screenshot.
 */
export function pickVariantWidths(
	intrinsicWidth: number,
	ladder: readonly number[] = VARIANT_WIDTHS,
): number[] {
	const below = ladder.filter((w) => w < intrinsicWidth);
	const top = ladder[ladder.length - 1];
	if (intrinsicWidth <= top) return [...below, intrinsicWidth];
	return [...below];
}

/** `images/work/a.png` + 600 → `images/work/a.w600.webp` */
export function variantPathFor(legacyPath: string, width: number): string {
	const withoutExt = legacyPath.replace(/\.[^./]+$/, '');
	return `${withoutExt}.w${width}.webp`;
}

/**
 * Generate variant files for every raster asset in the manifest and return
 * the media-variants module data, keyed by the original's static URL path
 * ('/images/work/a.png'). Writes are idempotent (existing variants are
 * overwritten). Keys and variant lists are emitted in deterministic order so
 * regeneration diffs stay minimal.
 */
export async function buildMediaVariants(
	manifest: MediaVariantsManifestInput,
	repoRoot = DEFAULT_REPO_ROOT,
): Promise<Readonly<Record<string, MediaVariantEntry>>> {
	// Dynamic import: sharp is a native module, and export-fallbacks must be
	// able to honor EXPORT_FALLBACKS_SKIP / VERCEL skip WITHOUT resolving it —
	// a hermetic CI run on a platform without the prebuilt binary must not
	// crash at import time for a step it will never execute.
	const { default: sharp } = await import('sharp');
	const staticRoot = resolve(repoRoot, manifest.sourceRoot);
	const out: Record<string, MediaVariantEntry> = {};

	const rasterAssets = manifest.assets
		.filter((a) => isRasterAsset(a.legacyPath))
		.sort((a, b) => a.legacyPath.localeCompare(b.legacyPath));

	for (const { legacyPath } of rasterAssets) {
		const sourcePath = resolve(staticRoot, legacyPath);
		if (!existsSync(sourcePath)) {
			throw new Error(`[media-variants] missing mirrored source file: ${legacyPath}`);
		}

		const source = sharp(sourcePath);
		const meta = await source.metadata();
		if (!meta.width || !meta.height) {
			throw new Error(`[media-variants] could not read dimensions of ${legacyPath}`);
		}

		const variants: MediaVariantSource[] = [];
		for (const width of pickVariantWidths(meta.width)) {
			const variantRelPath = variantPathFor(legacyPath, width);
			await sharp(sourcePath)
				.resize({ width })
				.webp({ quality: WEBP_QUALITY })
				.toFile(resolve(staticRoot, variantRelPath));
			variants.push({ width, path: `/${variantRelPath}` });
		}

		out[`/${legacyPath}`] = { width: meta.width, height: meta.height, variants };
	}

	return out;
}
