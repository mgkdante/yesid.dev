import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import {
	AssetsManifestSchema,
	parseManifest,
	validateFolderReferences,
	extractLegacyTopLevel,
} from '../scripts/migrate-assets';

/**
 * Fixture shape assertion — `fixtures/assets-manifest.json` must parse against
 * the Zod schema authored alongside the migration script. Drift on either
 * side is caught in CI before any upload runs.
 *
 * Scope: repo-local. No network. No Directus. No filesystem reads beyond the
 * manifest itself.
 */

function loadManifest() {
	const path = joinPath(
		import.meta.dir,
		'..',
		'fixtures',
		'assets-manifest.json',
	);
	return parseManifest(JSON.parse(readFileSync(path, 'utf8')));
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

	it('sourceRoot points at yesid.dev static/images tree', () => {
		const m = loadManifest();
		expect(m.sourceRoot).toBe('static/images');
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
		expect(extractLegacyTopLevel('about/headshot.webp')).toBe('about');
		expect(extractLegacyTopLevel('about/interests/anime.webp')).toBe('about');
		expect(extractLegacyTopLevel('work/yesid-dev.png')).toBe('work');
	});

	it('returns empty string when the path is top-level', () => {
		expect(extractLegacyTopLevel('hero-station-art.png')).toBe('');
		expect(extractLegacyTopLevel('montreal-metro.svg')).toBe('');
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
