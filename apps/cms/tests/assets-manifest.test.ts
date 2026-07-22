import { describe, expect, it } from 'bun:test';
import { join as joinPath } from 'node:path';
import sharp from 'sharp';
import {
	AssetsManifestSchema,
	parseManifest,
	validateFolderReferences,
	extractLegacyTopLevel,
} from '../scripts/migrate-assets';
import { readCmsFixtureJson } from './helpers/cms-fixtures';

/**
 * Fixture shape assertion — `fixtures/assets-manifest.json` must parse against
 * the Zod schema authored alongside the migration script. Drift on either
 * side is caught in CI before any upload runs.
 *
 * Scope: repo-local. No network. No Directus. No filesystem reads beyond the
 * manifest itself.
 */

function loadManifest() {
	return parseManifest(readCmsFixtureJson('assets-manifest.json'));
}

describe('fixtures/assets-manifest.json', () => {
	it('parses against AssetsManifestSchema (no silent drift)', () => {
		expect(() => loadManifest()).not.toThrow();
	});

	it('declares at least one folder + at least one asset', () => {
		const m = loadManifest();
		expect(Object.keys(m.folders).length).toBeGreaterThan(0);
		expect(m.assets.length).toBeGreaterThan(0);
	});

	it('every asset references a declared folder (no typos)', () => {
		const m = loadManifest();
		const errors = validateFolderReferences(m);
		expect(errors).toEqual([]);
	});

	it('every legacyPath is unique (no duplicate upload attempts)', () => {
		const m = loadManifest();
		const paths = m.assets.map((a) => a.legacyPath);
		expect(new Set(paths).size).toBe(paths.length);
	});

	it('every title is non-empty + human-readable (not a raw filename)', () => {
		const m = loadManifest();
		for (const entry of m.assets) {
			expect(entry.title.length).toBeGreaterThan(3);
			// Heuristic: titles shouldn't look like raw filenames with extensions.
			expect(entry.title.endsWith('.webp')).toBe(false);
			expect(entry.title.endsWith('.png')).toBe(false);
			expect(entry.title.endsWith('.svg')).toBe(false);
		}
	});

	it('every description (alt text) is a full sentence (≥ 20 chars)', () => {
		const m = loadManifest();
		for (const entry of m.assets) {
			expect(entry.description.length).toBeGreaterThanOrEqual(20);
		}
	});

	it('no entry references the stray ChromeSetup.exe (tracked separately)', () => {
		const m = loadManifest();
		for (const entry of m.assets) {
			expect(entry.legacyPath.toLowerCase()).not.toContain('chromesetup');
			expect(entry.legacyPath.toLowerCase()).not.toContain('.exe');
		}
	});

	it('sourceRoot points at apps/web/static (monorepo-aware)', () => {
		const m = loadManifest();
		expect(m.sourceRoot).toBe('apps/web/static');
	});

	it('declares exactly 26 assets after the og route-card additions', () => {
		const m = loadManifest();
		expect(m.assets.length).toBe(26);
		expect(m.assets.map((asset) => asset.legacyPath)).toEqual(
			expect.arrayContaining([
				'images/about/languages/quebec.svg',
				'images/about/languages/canada.svg',
				'images/about/languages/colombia.svg',
				'og/routes/services.png',
				'og/routes/contact.png',
				'og/routes/about.png',
				'og/routes/projects.png',
			]),
		);
	});

	it('declares all 6 content folders (services/projects/blog/brand/about/og)', () => {
		const m = loadManifest();
		const expected = ['services', 'projects', 'blog', 'brand', 'about', 'og'].sort();
		expect(Object.keys(m.folders).sort()).toEqual(expected);
	});

	it('every legacyPath starts with "images/" or "og/" (full-path-from-static convention)', () => {
		const m = loadManifest();
		for (const entry of m.assets) {
			expect(entry.legacyPath.startsWith('images/') || entry.legacyPath.startsWith('og/')).toBe(
				true,
			);
		}
	});

	it('keeps the canonical portrait background transparent at every responsive size', async () => {
		const staticRoot = joinPath(import.meta.dir, '..', '..', 'web', 'static');
		for (const file of [
			'images/about/headshot.webp',
			'images/about/headshot.w240.webp',
			'images/about/headshot.w600.webp',
			'images/about/headshot.w800.webp',
		]) {
			const metadata = await sharp(joinPath(staticRoot, file)).metadata();
			expect(metadata.hasAlpha, file).toBe(true);
		}
	});
});

describe('AssetsManifestSchema — shape guards', () => {
	it('rejects a manifest with an empty assets array', () => {
		expect(() =>
			AssetsManifestSchema.parse({
				description: 'x',
				sourceRoot: 'static/images',
				folders: { about: 'x' },
				assets: [],
			}),
		).toThrow();
	});

	it('rejects an entry missing description / title', () => {
		expect(() =>
			AssetsManifestSchema.parse({
				description: 'x',
				sourceRoot: 'static/images',
				folders: { about: 'x' },
				assets: [
					{ legacyPath: 'a.webp', folder: 'about', title: 'T' },
				],
			}),
		).toThrow();
	});
});

describe('extractLegacyTopLevel', () => {
	it('returns the first path segment when nested', () => {
		// Pre-Task-8: paths were 'about/...', 'work/...', 'hero-station-art.png'
		// Post-Task-8: paths are 'images/about/...', 'images/work/...', 'images/montreal-metro.svg'
		// With the images/ prefix convention, extractLegacyTopLevel always returns 'images'.
		expect(extractLegacyTopLevel('images/about/headshot.webp')).toBe('images');
		expect(extractLegacyTopLevel('images/about/interests/anime.webp')).toBe('images');
		expect(extractLegacyTopLevel('images/work/yesid-dev.png')).toBe('images');
	});

	it('returns empty string when the path is top-level (no slash)', () => {
		// Paths without a slash still return '' — helper contract is unchanged.
		expect(extractLegacyTopLevel('montreal-metro.svg')).toBe('');
	});

	it('returns "images" for all current manifest paths (images/ prefix convention)', () => {
		expect(extractLegacyTopLevel('images/montreal-metro.svg')).toBe('images');
		expect(extractLegacyTopLevel('images/about/interests/anime.webp')).toBe('images');
		expect(extractLegacyTopLevel('images/work/yesid-dev.png')).toBe('images');
	});
});

describe('validateFolderReferences', () => {
	it('returns [] when every asset references a declared folder', () => {
		const m = loadManifest();
		expect(validateFolderReferences(m)).toEqual([]);
	});

	it('returns an error string per mis-referenced folder', () => {
		const errors = validateFolderReferences({
			description: 'x',
			sourceRoot: 'static/images',
			folders: { about: 'x', brand: 'x' },
			assets: [
				{
					legacyPath: 'a.webp',
					folder: 'proyects', // typo — should be 'projects'
					title: 'Title',
					description: 'A valid-length description here',
				},
			],
		});
		expect(errors.length).toBe(1);
		expect(errors[0]).toContain('proyects');
		expect(errors[0]).toContain('not declared');
	});
});
