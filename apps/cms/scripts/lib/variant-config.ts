/** Bump for changes to resizing, naming or fallback behaviour not expressed by options. */
export const VARIANT_ALGORITHM_REVISION = 1;

export interface VariantConfig {
	readonly widths: readonly number[];
	readonly webp: { readonly quality: number; readonly effort: number };
}

/** Preset widths + lightbox rung. Keep ascending. Sharp's previous default effort was 4. */
export const VARIANT_CONFIG: VariantConfig = {
	widths: [240, 600, 1200, 1600],
	webp: { quality: 82, effort: 4 },
};

export function pickVariantWidths(intrinsicWidth: number, ladder = VARIANT_CONFIG.widths): number[] {
	const below = ladder.filter((width) => width < intrinsicWidth);
	const top = ladder.at(-1);
	return top !== undefined && intrinsicWidth <= top ? [...below, intrinsicWidth] : below;
}

export function variantPathFor(legacyPath: string, width: number): string {
	return `${legacyPath.replace(/\.[^./]+$/, '')}.w${width}.webp`;
}
