import { mediaVariants } from '#lib/content/media-variants.ts';
import type { AssetImageSource } from '#lib/directus/assets.ts';
import type { MediaVariantEntry } from '#lib/types.ts';

/** src + srcset + intrinsic size for a mirrored static path; bare src when it has no variants. */
export function variantImage(
	path: string,
	variants: Readonly<Record<string, MediaVariantEntry>> = mediaVariants,
): AssetImageSource {
	const entry = variants[path];
	if (!entry) return { src: path };
	return {
		src: path,
		srcset: entry.variants.map((variant) => `${variant.path} ${variant.width}w`).join(', '),
		width: entry.width,
		height: entry.height,
	};
}
