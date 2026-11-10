import { describe, expect, it } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import manifest from '../../fixtures/assets-manifest.json';
import { prepareMediaVariants, writeMediaVariants } from './media-variants';
import { createVariantReceipt, fileDigest, readVariantReceipt } from './variant-receipt';

describe('verified variant reuse', () => {
	it.each([0, 1])('regenerates an invented original fallback after %i valid rungs', async (prefixLength) => {
		const root = fileURLToPath(new URL('../../../../', import.meta.url));
		const legacyPath = 'images/about/headshot.webp';
		const input = { ...manifest, assets: [{ legacyPath }] };
		const receipt = structuredClone((await readVariantReceipt(root))!);
		const entry = receipt.assets[legacyPath]!;
		const prefix = entry.data.variants.slice(0, prefixLength);
		entry.data.variants = [...prefix, { width: prefixLength ? 600 : 240, path: `/${legacyPath}` }];
		entry.outputs = Object.fromEntries(prefix.map(({ path }) => [path, entry.outputs[path]!]));
		const forced = await prepareMediaVariants(input, root, { reuse: false });
		expect(forced.data[`/${legacyPath}`]!.variants.map(({ width }) => width)).toEqual([240, 600, 800]);
		expect(forced.writes).toHaveLength(3);
		expect(await prepareMediaVariants(input, root, { receipt })).toEqual(forced);
	});

	it('regenerates genuine original fallbacks with the same metadata and bytes as forced generation', async () => {
		const root = fileURLToPath(new URL('../../../../', import.meta.url));
		const receipt = (await readVariantReceipt(root))!;
		const assets = manifest.assets.filter(({ legacyPath }) =>
			receipt.assets[legacyPath]?.data.variants.some(({ path }) => path === `/${legacyPath}`));
		expect(assets.length).toBeGreaterThan(0);
		const input = { ...manifest, assets };
		const forced = await prepareMediaVariants(input, root, { reuse: false });
		for (const { legacyPath } of assets) {
			expect(forced.data[`/${legacyPath}`]).toEqual(receipt.assets[legacyPath]!.data);
		}
		for (const { filePath, content } of forced.writes) {
			expect(Buffer.from(content)).toEqual(readFileSync(filePath));
		}
		expect(await prepareMediaVariants(input, root, { receipt })).toEqual(forced);
	});

	it('repairs receipt-only metadata and incomplete ladders', async () => {
		const root = mkdtempSync(join(tmpdir(), 'variant-metadata-'));
		const manifest = { sourceRoot: 'static', assets: [{ legacyPath: 'sample.png' }] };
		try {
			mkdirSync(join(root, 'static'));
			const { default: sharp } = await import('sharp');
			await sharp({ create: { width: 300, height: 200, channels: 3, background: '#6644cc' } }).png({ compressionLevel: 0 }).toFile(join(root, 'static/sample.png'));
			const first = await prepareMediaVariants(manifest, root);
			await writeMediaVariants(first);
			const receipt = await createVariantReceipt(manifest, first, root);
			expect((await prepareMediaVariants(manifest, root, { receipt })).writes).toEqual([]);
			for (const mutate of [
				(data: typeof first.data[string]) => { data.width = 9999; data.height = 1; },
				(data: typeof first.data[string]) => { data.variants[0]!.width = 999; },
				(data: typeof first.data[string]) => { data.variants = data.variants.slice(0, -1); },
				(data: typeof first.data[string]) => { data.variants = []; },
				(data: typeof first.data[string]) => { data.variants[0]!.path = '/other.webp'; },
			]) {
				const changed = structuredClone(receipt);
				mutate(changed.assets['sample.png']!.data);
				const repaired = await prepareMediaVariants(manifest, root, { receipt: changed });
				expect(repaired.data).toEqual(first.data);
				expect(repaired.writes).toEqual(first.writes);
			}
			// Even a matching digest cannot authorize wrong output geometry.
			const output = first.writes[0]!.filePath;
			await sharp({ create: { width: 240, height: 20, channels: 3, background: '#6644cc' } }).webp().toFile(output);
			const changed = structuredClone(receipt);
			changed.assets['sample.png']!.outputs['/sample.w240.webp'] = await fileDigest(output);
			expect((await prepareMediaVariants(manifest, root, { receipt: changed })).writes).toEqual(first.writes);
		} finally { rmSync(root, { recursive: true, force: true }); }
	});

	it('invalidates reuse when effective quality, effort or width ladder changes', async () => {
		const root = mkdtempSync(join(tmpdir(), 'variant-config-'));
		const manifest = { sourceRoot: 'static', assets: [{ legacyPath: 'sample.png' }] };
		try {
			mkdirSync(join(root, 'static'));
			const { default: sharp } = await import('sharp');
			await sharp({ create: { width: 300, height: 200, channels: 3, background: '#6644cc' } }).png({ compressionLevel: 0 }).toFile(join(root, 'static/sample.png'));
			const first = await prepareMediaVariants(manifest, root);
			await writeMediaVariants(first);
			const receipt = await createVariantReceipt(manifest, first, root);
			for (const config of [
				{ widths: [240, 600, 1200, 1600], webp: { quality: 20, effort: 4 } },
				{ widths: [240, 600, 1200, 1600], webp: { quality: 82, effort: 6 } },
				{ widths: [120, 240, 600, 1200, 1600], webp: { quality: 82, effort: 4 } },
			]) {
				const changed = await prepareMediaVariants(manifest, root, { receipt, config });
				const fresh = await prepareMediaVariants(manifest, root, { reuse: false, config });
				expect(changed.writes.length).toBeGreaterThan(0);
				expect(changed).toEqual(fresh);
			}
		} finally { rmSync(root, { recursive: true, force: true }); }
	});
	it('reuses identical outputs and repairs changed or missing outputs before reuse', async () => {
		const root = mkdtempSync(join(tmpdir(), 'variant-reuse-'));
		const manifest = { sourceRoot: 'static', assets: [{ legacyPath: 'sample.png' }] };
		try {
			mkdirSync(join(root, 'static'));
			const { default: sharp } = await import('sharp');
			await sharp({ create: { width: 300, height: 200, channels: 3, background: '#6644cc' } }).png({ compressionLevel: 0 }).toFile(join(root, 'static/sample.png'));
			const first = await prepareMediaVariants(manifest, root);
			await writeMediaVariants(first);
			const receipt = await createVariantReceipt(manifest, first, root);
			const options = { receipt };
			const reused = await prepareMediaVariants(manifest, root, options);
			expect(reused.data).toEqual(first.data);
			expect(reused.writes).toEqual([]);
			writeFileSync(first.writes[0]!.filePath, 'corrupt');
			const repaired = await prepareMediaVariants(manifest, root, options);
			expect(repaired.writes).toEqual(first.writes);
			expect(readFileSync(first.writes[0]!.filePath, 'utf8')).toBe('corrupt');
			await writeMediaVariants(repaired);
			unlinkSync(first.writes[0]!.filePath);
			expect((await prepareMediaVariants(manifest, root, options)).writes).toEqual(first.writes);
			await writeMediaVariants(first);
			const stale = { ...receipt, recipe: 'old encoder' };
			expect((await prepareMediaVariants(manifest, root, { receipt: stale })).writes).toEqual(first.writes);
			await sharp({ create: { width: 400, height: 200, channels: 3, background: '#cc4466' } }).png({ compressionLevel: 0 }).toFile(join(root, 'static/sample.png'));
			expect((await prepareMediaVariants(manifest, root, options)).data['/sample.png']!.width).toBe(400);
			unlinkSync(join(root, 'static/sample.png'));
			await expect(prepareMediaVariants(manifest, root, options)).rejects.toThrow('missing mirrored source');
		} finally { rmSync(root, { recursive: true, force: true }); }
	});
});
