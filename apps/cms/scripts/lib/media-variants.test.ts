// Pure-logic tests for the media-variant generator (width ladder, naming,
// raster detection). File generation itself is exercised by running the
// export module; these lock the decisions that shape committed output.

import { describe, expect, it } from 'bun:test';
import { isRasterAsset, pickVariantWidths, variantPathFor, VARIANT_WIDTHS } from './media-variants';

describe('isRasterAsset', () => {
	it('accepts png/jpg/jpeg/webp and rejects svg/gif', () => {
		expect(isRasterAsset('images/work/a.png')).toBe(true);
		expect(isRasterAsset('images/about/b.webp')).toBe(true);
		expect(isRasterAsset('images/c.JPG')).toBe(true);
		expect(isRasterAsset('images/flags/d.svg')).toBe(false);
		expect(isRasterAsset('images/e.gif')).toBe(false);
	});
});

describe('pickVariantWidths', () => {
	it('caps a wide source at the top rung (no full-res webp of a 2482px screenshot)', () => {
		expect(pickVariantWidths(2482)).toEqual([240, 600, 1200, 1600]);
	});

	it('never upscales — only rungs below the intrinsic width, plus the intrinsic itself', () => {
		expect(pickVariantWidths(600)).toEqual([240, 600]);
		expect(pickVariantWidths(1222)).toEqual([240, 600, 1200, 1222]);
	});

	it('gives a tiny source exactly one full-size variant', () => {
		expect(pickVariantWidths(200)).toEqual([200]);
	});

	it('a source exactly on the top rung ends at the rung, not duplicated', () => {
		const top = VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1];
		expect(pickVariantWidths(top)).toEqual([240, 600, 1200, 1600]);
	});
});

describe('variantPathFor', () => {
	it('inserts .w<width> before a .webp extension', () => {
		expect(variantPathFor('images/about/headshot.webp', 240)).toBe(
			'images/about/headshot.w240.webp',
		);
	});

	it('replaces a png extension with .w<width>.webp', () => {
		expect(variantPathFor('images/work/yesid-dev-home.png', 600)).toBe(
			'images/work/yesid-dev-home.w600.webp',
		);
	});

	it('only touches the final extension (dotted directories stay intact)', () => {
		expect(variantPathFor('images/v2.0/shot.png', 240)).toBe('images/v2.0/shot.w240.webp');
	});
});
