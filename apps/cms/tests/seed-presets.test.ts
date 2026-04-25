import { describe, expect, it } from 'bun:test';
import { buildPresetPayload, loadPresetsFixture } from '../scripts/seed-presets';
import { PresetsConfigSchema } from '../scripts/lib/schemas/presets';

describe('buildPresetPayload', () => {
	it('wraps presets array in { storage_asset_presets: [...] }', () => {
		const config = PresetsConfigSchema.parse({
			presets: [
				{ key: 'a', fit: 'contain', width: 100, format: 'webp', quality: 80 },
			],
		});
		const out = buildPresetPayload(config);
		expect(out).toHaveProperty('storage_asset_presets');
		expect(out.storage_asset_presets).toHaveLength(1);
		expect(out.storage_asset_presets[0]?.key).toBe('a');
	});

	it('preserves the order of presets from input', () => {
		const config = PresetsConfigSchema.parse({
			presets: [
				{ key: 'first', fit: 'contain', width: 100, format: 'webp', quality: 80 },
				{ key: 'second', fit: 'cover', width: 200, format: 'jpg', quality: 90 },
			],
		});
		const out = buildPresetPayload(config);
		expect(out.storage_asset_presets.map((p) => p.key)).toEqual(['first', 'second']);
	});
});

describe('loadPresetsFixture', () => {
	it('loads + validates fixtures/brand/presets.json', () => {
		const config = loadPresetsFixture();
		expect(config.presets.length).toBeGreaterThanOrEqual(4);
	});
});

describe('PresetsConfigSchema rejects malformed input', () => {
	it('rejects empty presets array', () => {
		expect(() => PresetsConfigSchema.parse({ presets: [] })).toThrow();
	});

	it('rejects non-kebab-case key', () => {
		expect(() =>
			PresetsConfigSchema.parse({
				presets: [
					{ key: 'BadKey', fit: 'contain', width: 100, format: 'webp', quality: 80 },
				],
			}),
		).toThrow();
	});

	it('rejects quality > 100', () => {
		expect(() =>
			PresetsConfigSchema.parse({
				presets: [
					{ key: 'k', fit: 'contain', width: 100, format: 'webp', quality: 150 },
				],
			}),
		).toThrow();
	});
});
