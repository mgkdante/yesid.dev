import { describe, expect, it } from 'bun:test';
import { PresetsConfigSchema } from '../scripts/lib/schemas/presets';
import { readCmsFixtureJson } from './helpers/cms-fixtures';

describe('fixtures/brand/presets.json', () => {
	const raw = readCmsFixtureJson('brand/presets.json');

	it('parses against PresetsConfigSchema', () => {
		expect(() => PresetsConfigSchema.parse(raw)).not.toThrow();
	});

	it('declares the 4 expected base presets', () => {
		const parsed = PresetsConfigSchema.parse(raw);
		const keys = parsed.presets.map((p) => p.key);
		expect(keys).toContain('hero-1200');
		expect(keys).toContain('card-600');
		expect(keys).toContain('thumb-240');
		expect(keys).toContain('og-1200');
	});

	it('every preset has a quality score (1-100)', () => {
		const parsed = PresetsConfigSchema.parse(raw);
		for (const p of parsed.presets) {
			expect(p.quality).toBeGreaterThanOrEqual(1);
			expect(p.quality).toBeLessThanOrEqual(100);
		}
	});

	it('thumb-240 is square (width = height)', () => {
		const parsed = PresetsConfigSchema.parse(raw);
		const thumb = parsed.presets.find((p) => p.key === 'thumb-240');
		expect(thumb?.width).toBe(240);
		expect(thumb?.height).toBe(240);
	});

	it('og-1200 has the OG-card aspect (1200x630)', () => {
		const parsed = PresetsConfigSchema.parse(raw);
		const og = parsed.presets.find((p) => p.key === 'og-1200');
		expect(og?.width).toBe(1200);
		expect(og?.height).toBe(630);
	});
});
