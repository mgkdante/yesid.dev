import { describe, it, expect } from 'vitest';
import { getOgFonts } from './fonts';

describe('getOgFonts', () => {
	it('returns 3 font entries', () => {
		expect(getOgFonts()).toHaveLength(3);
	});

	it('each entry has name, data, weight, style', () => {
		for (const font of getOgFonts()) {
			expect(typeof font.name).toBe('string');
			expect(font.data).toBeInstanceOf(Uint8Array);
			expect(font.data.byteLength).toBeGreaterThan(10_000);
			expect([500, 900]).toContain(font.weight);
			expect(font.style).toBe('normal');
		}
	});

	it('exposes Inter 500, Inter 900, JetBrains Mono 500', () => {
		const ids = getOgFonts().map((f) => `${f.name}-${f.weight}`);
		expect(ids).toEqual(
			expect.arrayContaining(['Inter-500', 'Inter-900', 'JetBrains Mono-500']),
		);
	});
});
