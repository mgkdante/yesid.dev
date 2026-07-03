// Rotated-title fitting (operator spec 2026-07-03):
// A vertical-rl label's run length is its RENDERED TEXT WIDTH rotated onto
// the viewport's height axis. Per locale, the LONGEST rendered label defines
// ONE shared font size: the biggest size at which that label still fits the
// section's height budget, capped by the design max so the rail never eats
// the content column. Every rotated title on the surface then wears that
// same size, so the set reads as one system and nothing overflows on either
// axis, in any language.

export interface RotatedTitleFont {
	/** CSS font-family list, e.g. from getComputedStyle(el).fontFamily. */
	family: string;
	/** Numeric weight (the titles run 900). */
	weight: number;
	/** Letter-spacing as an em ratio (e.g. -0.02). Canvas measureText ignores
	 *  letter-spacing, so it is applied arithmetically per glyph gap. */
	letterSpacingEm: number;
}

/**
 * Pure core: given each label's measured width at a probe size, return the
 * uniform font size where the WIDEST label exactly fills `budgetPx`, never
 * exceeding `maxPx`. Fonts scale linearly with size, so width-at-probe
 * divides out cleanly.
 */
export function uniformFitSize(
	widthsAtProbePx: readonly number[],
	probePx: number,
	budgetPx: number,
	maxPx: number,
): number {
	const widest = Math.max(...widthsAtProbePx);
	if (!Number.isFinite(widest) || widest <= 0 || probePx <= 0 || budgetPx <= 0) return maxPx;
	const emWidth = widest / probePx; // widest label's width per 1px of font-size
	return Math.min(maxPx, Math.floor(budgetPx / emWidth));
}

/** Measure each label's rendered width at `probePx` using a canvas. Returns
 *  null when no 2D context is available (SSR, test DOMs): callers keep the
 *  CSS fallback size in that case. */
export function measureLabelWidths(
	labels: readonly string[],
	font: RotatedTitleFont,
	probePx = 100,
): number[] | null {
	if (typeof document === 'undefined') return null;
	const ctx = document.createElement('canvas').getContext('2d');
	if (!ctx) return null;
	ctx.font = `${font.weight} ${probePx}px ${font.family}`;
	return labels.map((label) => {
		const raw = ctx.measureText(label).width;
		const gaps = Math.max(0, label.length - 1);
		return raw + gaps * font.letterSpacingEm * probePx;
	});
}

/**
 * One-call fit: measures `labels` with the computed font of `sampleEl` (the
 * real title element, so family/weight/letter-spacing are exact) and returns
 * the shared size in px, or null when measurement is impossible.
 */
export function computeRotatedTitleSize(
	sampleEl: Element,
	labels: readonly string[],
	budgetPx: number,
	maxPx: number,
): number | null {
	const style = getComputedStyle(sampleEl);
	const fontSize = parseFloat(style.fontSize) || 16;
	const spacingPx = parseFloat(style.letterSpacing);
	const font: RotatedTitleFont = {
		family: style.fontFamily || 'sans-serif',
		weight: Number(style.fontWeight) || 900,
		letterSpacingEm: Number.isFinite(spacingPx) ? spacingPx / fontSize : 0,
	};
	const probe = 100;
	const widths = measureLabelWidths(labels, font, probe);
	if (!widths) return null;
	return uniformFitSize(widths, probe, budgetPx, maxPx);
}
