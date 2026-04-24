import { describe, expect, it } from 'bun:test';
import {
	AssetPresetSchema,
	SLICE_18_PRESETS,
	presetsAreEqual,
	validatePresets,
} from '../scripts/seed-presets';

/**
 * Unit tests for the pure helpers in scripts/seed-presets.ts.
 *
 * Covers:
 *   - SLICE_18_PRESETS passes its own schema.
 *   - All 4 required presets are present.
 *   - Key constraints (lowercase-hyphen, format enum, quality range).
 *   - Order-insensitive equality helper (used for CI drift detection).
 */

describe('SLICE_18_PRESETS', () => {
	it('contains exactly 4 presets', () => {
		expect(SLICE_18_PRESETS.length).toBe(4);
	});

	it('has keys hero-1200 + card-600 + thumb-240 + og-1200', () => {
		const keys = new Set(SLICE_18_PRESETS.map((p) => p.key));
		expect(keys).toEqual(new Set(['hero-1200', 'card-600', 'thumb-240', 'og-1200']));
	});

	it('passes validatePresets (Zod array schema)', () => {
		expect(() => validatePresets(SLICE_18_PRESETS)).not.toThrow();
	});

	it('og-1200 is the only preset with a fixed height (for OG card aspect)', () => {
		const withHeight = SLICE_18_PRESETS.filter((p) => p.height !== undefined);
		expect(withHeight.length).toBe(1);
		expect(withHeight[0]?.key).toBe('og-1200');
		expect(withHeight[0]?.height).toBe(630);
	});

	it('og-1200 is the only preset in jpg format (others are WebP)', () => {
		const webps = SLICE_18_PRESETS.filter((p) => p.format === 'webp');
		const jpgs = SLICE_18_PRESETS.filter((p) => p.format === 'jpg');
		expect(webps.length).toBe(3);
		expect(jpgs.length).toBe(1);
		expect(jpgs[0]?.key).toBe('og-1200');
	});

	it('every preset sets withoutEnlargement=true (no upscaling)', () => {
		for (const preset of SLICE_18_PRESETS) {
			expect(preset.withoutEnlargement).toBe(true);
		}
	});

	it('widths are descending (hero > card > thumb)', () => {
		const hero = SLICE_18_PRESETS.find((p) => p.key === 'hero-1200');
		const card = SLICE_18_PRESETS.find((p) => p.key === 'card-600');
		const thumb = SLICE_18_PRESETS.find((p) => p.key === 'thumb-240');
		expect(hero?.width).toBe(1200);
		expect(card?.width).toBe(600);
		expect(thumb?.width).toBe(240);
	});
});

describe('AssetPresetSchema — guards', () => {
	it('rejects keys with uppercase or underscores', () => {
		expect(() =>
			AssetPresetSchema.parse({
				key: 'Hero_1200',
				fit: 'cover',
				width: 1200,
				quality: 85,
				format: 'webp',
			}),
		).toThrow();
	});

	it('rejects quality values outside 1–100', () => {
		expect(() =>
			AssetPresetSchema.parse({
				key: 'bad',
				fit: 'cover',
				width: 100,
				quality: 150,
				format: 'webp',
			}),
		).toThrow();
	});

	it('rejects width 0 or negative (positive int required)', () => {
		expect(() =>
			AssetPresetSchema.parse({
				key: 'zero',
				fit: 'cover',
				width: 0,
				quality: 80,
				format: 'webp',
			}),
		).toThrow();
	});

	it('rejects unknown format values', () => {
		expect(() =>
			AssetPresetSchema.parse({
				key: 'bad',
				fit: 'cover',
				width: 100,
				quality: 80,
				format: 'avif', // not in the docs-listed set — see spec Q10
			}),
		).toThrow();
	});
});

describe('presetsAreEqual — order-insensitive', () => {
	it('returns true when two arrays hold the same presets in any order', () => {
		const reversed = [...SLICE_18_PRESETS].reverse();
		expect(presetsAreEqual(SLICE_18_PRESETS, reversed)).toBe(true);
	});

	it('returns false when preset counts differ', () => {
		const fewer = SLICE_18_PRESETS.slice(0, 3);
		expect(presetsAreEqual(SLICE_18_PRESETS, fewer)).toBe(false);
	});

	it('returns false when a single preset value differs', () => {
		const [first, ...rest] = SLICE_18_PRESETS;
		if (!first) throw new Error('test fixture missing');
		const modified = [{ ...first, quality: (first.quality + 1) as number }, ...rest];
		expect(presetsAreEqual(SLICE_18_PRESETS, modified)).toBe(false);
	});
});
