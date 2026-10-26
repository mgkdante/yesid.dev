import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('static icons', () => {
	it('provides 16, 32 and 48 px PNG entries in favicon.ico', () => {
		const ico = readFileSync('static/favicon.ico');
		expect(ico.subarray(0, 4)).toEqual(Buffer.from([0, 0, 1, 0]));
		expect(ico.readUInt16LE(4)).toBe(3);
		for (const [index, size] of [16, 32, 48].entries()) {
			const entry = 6 + index * 16;
			expect(ico[entry]).toBe(size);
			expect(ico[entry + 1]).toBe(size);
			const offset = ico.readUInt32LE(entry + 12);
			expect(ico.subarray(offset, offset + 8)).toEqual(pngSignature);
			expect(ico.readUInt32BE(offset + 16)).toBe(size);
			expect(ico.readUInt32BE(offset + 20)).toBe(size);
		}
	});

	it('provides a 180 px apple-touch-icon PNG', () => {
		const png = readFileSync('static/apple-touch-icon.png');
		expect(png.subarray(0, 8)).toEqual(pngSignature);
		expect(png.toString('ascii', 12, 16)).toBe('IHDR');
		expect(png.readUInt32BE(16)).toBe(180);
		expect(png.readUInt32BE(20)).toBe(180);
		expect(png[25]).toBe(2);
	});

	it('declares the apple-touch-icon link and exactly one theme-aware favicon', () => {
		const html = readFileSync('src/app.html', 'utf8');
		expect(html.match(/\brel="icon"/g)).toHaveLength(1);
		expect(html).toContain(
			'<link rel="apple-touch-icon" href="%sveltekit.assets%/apple-touch-icon.png" />',
		);
	});
});
