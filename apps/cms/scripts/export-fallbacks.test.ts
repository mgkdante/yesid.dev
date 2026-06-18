import { describe, expect, it } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { tmpdir } from 'node:os';
import {
	buildMirroredMediaAssetsFromManifest,
	getExportSkipReason,
} from './export-fallbacks';

describe('export-fallbacks skip policy', () => {
	it('skips when EXPORT_FALLBACKS_SKIP is enabled', () => {
		expect(getExportSkipReason({ EXPORT_FALLBACKS_SKIP: '1' })).toBe('EXPORT_FALLBACKS_SKIP');
		expect(getExportSkipReason({ EXPORT_FALLBACKS_SKIP: 'true' })).toBe('EXPORT_FALLBACKS_SKIP');
	});

	it('skips Vercel builds by default so committed content remains authoritative', () => {
		expect(getExportSkipReason({ VERCEL_ENV: 'preview' })).toBe('VERCEL_ENV=preview');
		expect(getExportSkipReason({ VERCEL_ENV: 'production' })).toBe('VERCEL_ENV=production');
	});

	it('allows an explicit live CMS export on Vercel when requested', () => {
		expect(getExportSkipReason({ VERCEL_ENV: 'production', EXPORT_FALLBACKS_LIVE: '1' })).toBeNull();
	});

	it('does not skip local explicit export commands by default', () => {
		expect(getExportSkipReason({})).toBeNull();
	});
});

describe('media asset mirror export', () => {
	it('emits UUID to site-local URL mappings only when the static mirror file exists', () => {
		const root = joinPath(tmpdir(), `media-mirror-${Date.now()}`);
		mkdirSync(joinPath(root, 'images', 'work'), { recursive: true });
		writeFileSync(joinPath(root, 'images', 'work', 'cover.png'), 'image-bytes');

		try {
			const mirrored = buildMirroredMediaAssetsFromManifest(
				{
					sourceRoot: root,
					assets: [
						{
							legacyPath: 'images/work/cover.png',
						},
					],
				},
				{ 'images/work/cover.png': 'uuid-cover' },
			);

			expect(mirrored).toEqual({ 'uuid-cover': '/images/work/cover.png' });
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('fails the export when a manifest asset has no local mirror file', () => {
		const root = joinPath(tmpdir(), `media-mirror-missing-${Date.now()}`);

		expect(() =>
			buildMirroredMediaAssetsFromManifest(
				{
					sourceRoot: root,
					assets: [{ legacyPath: 'images/work/missing.png' }],
				},
				{ 'images/work/missing.png': 'uuid-missing' },
			),
		).toThrow('[media-assets] missing mirrored static asset file(s)');
	});

	it('fails the export when a manifest asset has no Directus UUID mapping', () => {
		const root = joinPath(tmpdir(), `media-mirror-unmapped-${Date.now()}`);
		mkdirSync(joinPath(root, 'images'), { recursive: true });
		writeFileSync(joinPath(root, 'images', 'orphan.png'), 'image-bytes');

		try {
			expect(() =>
				buildMirroredMediaAssetsFromManifest(
					{
						sourceRoot: root,
						assets: [{ legacyPath: 'images/orphan.png' }],
					},
					{},
				),
			).toThrow('[media-assets] missing Directus UUID(s)');
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});
