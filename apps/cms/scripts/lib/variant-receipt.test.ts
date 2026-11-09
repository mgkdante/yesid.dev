import { describe, expect, it } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareMediaVariants, writeMediaVariants } from './media-variants';
import { createVariantReceipt } from './variant-receipt';

describe('verified variant reuse', () => {
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
