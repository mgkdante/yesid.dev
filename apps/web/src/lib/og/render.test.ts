import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { renderOgPng } from './render';
import { buildOgTree } from './template';

describe('renderOgPng', () => {
	it('produces a valid 1200x630 PNG', async () => {
		const tree = buildOgTree({ eyebrow: 'BLOG', title: 'A real test title' });
		const bytes = await renderOgPng(tree);

		// PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
		expect(bytes[0]).toBe(0x89);
		expect(bytes[1]).toBe(0x50);
		expect(bytes[2]).toBe(0x4e);
		expect(bytes[3]).toBe(0x47);

		// IHDR chunk: width = bytes 16..19, height = bytes 20..23 (big-endian).
		const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		expect(dv.getUint32(16, false)).toBe(1200);
		expect(dv.getUint32(20, false)).toBe(630);

		expect(bytes.byteLength).toBeGreaterThan(5_000);
		expect(bytes.byteLength).toBeLessThan(200_000);
	}, 10_000);

	it('is deterministic for fixed input', async () => {
		const tree = buildOgTree({ eyebrow: 'PROJECT', title: 'Determinism' });
		const a = await renderOgPng(tree);
		const b = await renderOgPng(tree);
		expect(a.byteLength).toBe(b.byteLength);
		for (let i = 0; i < a.byteLength; i++) {
			if (a[i] !== b[i]) {
				throw new Error(`bytes differ at index ${i}: ${a[i]} vs ${b[i]}`);
			}
		}
	}, 15_000);

	it.each([
		{
			eyebrow: 'BLOG',
			title: 'A real test title',
			bytes: 22_905,
			sha256: '5fee47c5e997b897f2a69583c2e93d8beb10d127d7add437fea4a47100ff5618',
		},
		{
			eyebrow: 'PROJECT',
			title: 'Determinism',
			bytes: 23_230,
			sha256: 'ae24f253478563508fdcae41b207c9c0eb77494a44aef69019a3f4e935435f4e',
		},
	])('preserves exact $eyebrow PNG bytes across renderer adoption', async (fixture) => {
		const png = await renderOgPng(buildOgTree(fixture));
		expect({
			bytes: png.byteLength,
			sha256: createHash('sha256').update(png).digest('hex'),
		}).toEqual({ bytes: fixture.bytes, sha256: fixture.sha256 });
	}, 15_000);
});
