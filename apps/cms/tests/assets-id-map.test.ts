import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { z } from 'zod';
import { parseManifest } from '../scripts/lib/assets-manifest';
import { readCmsFixtureJson } from './helpers/cms-fixtures';

// Directus admin chrome assets referenced from settings are not in the upload manifest.
const ADMIN_CHROME_KEYS = ['brand/yesid-icon.svg', 'brand/yesid-wordmark.svg'];

/**
 * Schema for fixtures/assets-id-map.json — a frozen record of the 18d migration,
 * consumed by 18e-18i (and packages/shared via re-export). Slice 18l added the
 * `brand/` namespace for Directus admin chrome assets (icon + wordmark SVGs
 * referenced from settings.json); the
 * brand-svg-og-cards slice added `og/` for route share cards wired through
 * route_seo.og_image.
 */
const AssetsIdMapSchema = z.record(
	z.string().regex(/^(images|brand|og)\//),
	z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
);

function loadIdMap(): Record<string, string> {
	return readCmsFixtureJson('assets-id-map.json');
}

function loadSharedIdMap(): Record<string, string> {
	const path = joinPath(
		import.meta.dir,
		'..',
		'..',
		'..',
		'packages',
		'shared',
		'fixtures',
		'assets-id-map.json',
	);
	return JSON.parse(readFileSync(path, 'utf8'));
}

describe('fixtures/assets-id-map.json', () => {
	it('parses against AssetsIdMapSchema (every key is "images/..." path; every value is UUID)', () => {
		expect(() => AssetsIdMapSchema.parse(loadIdMap())).not.toThrow();
	});

	it('maps every manifest asset plus the admin chrome, and nothing else', () => {
		const manifestPaths = parseManifest(readCmsFixtureJson('assets-manifest.json')).assets.map(
			(asset) => asset.legacyPath,
		);
		expect(Object.keys(loadIdMap()).sort()).toEqual([...manifestPaths, ...ADMIN_CHROME_KEYS].sort());
	});

	it('keys are sorted alphabetically (diff-friendly)', () => {
		const m = loadIdMap();
		const keys = Object.keys(m);
		const sorted = [...keys].sort();
		expect(keys).toEqual(sorted);
	});

	it('every value is a unique UUID (no duplicates)', () => {
		const m = loadIdMap();
		const ids = Object.values(m);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('contains the metro-svg + headshot + yesid-dev sentinel paths', () => {
		const m = loadIdMap();
		// Use direct key access — toHaveProperty splits on '/' as a path separator
		expect(m['images/montreal-metro.svg']).toMatch(/^[0-9a-f-]{36}$/);
		expect(m['images/about/headshot.webp']).toMatch(/^[0-9a-f-]{36}$/);
		expect(m['images/work/yesid-dev.png']).toMatch(/^[0-9a-f-]{36}$/);
		expect(m['images/work/yesid-dev-home.png']).toMatch(/^[0-9a-f-]{36}$/);
		expect(m['images/work/yesid-dev-case-study.png']).toMatch(/^[0-9a-f-]{36}$/);
		expect(m['images/about/languages/quebec.svg']).toMatch(/^[0-9a-f-]{36}$/);
		expect(m['images/about/languages/canada.svg']).toMatch(/^[0-9a-f-]{36}$/);
		expect(m['images/about/languages/colombia.svg']).toMatch(/^[0-9a-f-]{36}$/);
	});

	it('matches packages/shared copy exactly', () => {
		expect(loadSharedIdMap()).toEqual(loadIdMap());
	});
});
