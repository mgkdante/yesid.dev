import { describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { mirrorAsset } from './mirror-asset';

describe('explicit CMS asset mirror release', () => {
	it('previews a same-ID byte replacement and writes only the reviewed hash', async () => {
		const root = await mkdtemp(join(tmpdir(), 'cms-mirror-'));
		const bytes = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>');
		const path = join(root, 'sample.svg');
		const digest = createHash('sha256').update(bytes).digest('hex');
		const fetcher = async () => new Response(bytes, { headers: { 'content-type': 'image/svg+xml' } });
		const options = { directusUrl: 'https://cms.dev.yesid.dev', token: 'fixture-token', repoRoot: root, sourceRoot: '.', legacyPath: 'sample.svg', assets: [{ legacyPath: 'sample.svg' }], idMap: { 'sample.svg': '12345678-1234-1234-1234-123456789abc' } };
		try {
			await writeFile(path, 'last approved bytes');
			const plan = await mirrorAsset(options, fetcher);
			expect(plan).toMatchObject({ changed: true, afterSha256: digest, applied: false });
			expect(await readFile(path, 'utf8')).toBe('last approved bytes');
			await expect(mirrorAsset({ ...options, applySha256: '0'.repeat(64) }, fetcher)).rejects.toThrow('reviewed hash');
			expect(await readFile(path, 'utf8')).toBe('last approved bytes');
			expect((await mirrorAsset({ ...options, applySha256: digest }, fetcher)).applied).toBe(true);
			expect(await readFile(path)).toEqual(bytes);
		} finally { await rm(root, { recursive: true, force: true }); }
	});
	it('rejects unregistered, escaping, wrong-origin and non-image inputs before overwriting a mirror', async () => {
		const root = await mkdtemp(join(tmpdir(), 'cms-mirror-'));
		const options = { directusUrl: 'https://cms.yesid.dev', token: 'fixture', repoRoot: root, sourceRoot: '.', legacyPath: 'sample.svg', assets: [{ legacyPath: 'sample.svg' }], idMap: { 'sample.svg': '12345678-1234-1234-1234-123456789abc' } };
		const fetcher = async () => new Response('not image bytes', { headers: { 'content-type': 'text/plain' } });
		try {
			await writeFile(join(root, 'sample.svg'), 'approved bytes');
			await mkdir(join(root, 'static'));
			await expect(mirrorAsset({ ...options, sourceRoot: 'static', legacyPath: '../sample.svg', assets: [{ legacyPath: '../sample.svg' }], idMap: { '../sample.svg': options.idMap['sample.svg']! } }, fetcher)).rejects.toThrow('escapes the static root');
			await expect(mirrorAsset({ ...options, idMap: {} }, fetcher)).rejects.toThrow('registered');
			await expect(mirrorAsset({ ...options, directusUrl: 'https://example.com' }, fetcher)).rejects.toThrow('CMS origin');
			await expect(mirrorAsset(options, fetcher)).rejects.toThrow('image');
			expect(await readFile(join(root, 'sample.svg'), 'utf8')).toBe('approved bytes');
		} finally { await rm(root, { recursive: true, force: true }); }
	});
	it('rejects real replacement bytes of another format and retains the last approved mirror', async () => {
		const root = await mkdtemp(join(tmpdir(), 'cms-mirror-'));
		const { default: sharp } = await import('sharp');
		const png = await sharp({ create: { width: 2, height: 2, channels: 4, background: '#fff' } }).png().toBuffer();
		try {
			await writeFile(join(root, 'sample.svg'), 'approved SVG bytes');
			const options = { directusUrl: 'https://cms.yesid.dev', token: 'fixture', repoRoot: root, sourceRoot: '.', legacyPath: 'sample.svg', assets: [{ legacyPath: 'sample.svg' }], idMap: { 'sample.svg': '12345678-1234-1234-1234-123456789abc' }, applySha256: createHash('sha256').update(png).digest('hex') };
			await expect(mirrorAsset(options, async () => new Response(png, { headers: { 'content-type': 'image/png' } }))).rejects.toThrow('format');
			expect(await readFile(join(root, 'sample.svg'), 'utf8')).toBe('approved SVG bytes');
		} finally { await rm(root, { recursive: true, force: true }); }
	});
});
