import { describe, expect, it } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { tmpdir } from 'node:os';
import {
	type AssetEntry,
	type AssetsManifest,
	findMissingSources,
	resolveSourcePath,
	deriveAltText,
	filterToUpload,
	buildIdMap,
	parseManifest,
	mimeTypeForLegacyPath,
	imageMetadataFromBytes,
	buildFileMetadataPatch,
} from '../scripts/migrate-assets';

/**
 * Unit tests for the pure helpers in scripts/migrate-assets.ts.
 *
 * No network, no Directus. Covers:
 *   - Source-path resolution from manifest entry + root.
 *   - Missing-source detection with a real temp directory.
 *   - Idempotency partitioning by legacy_path (filterToUpload + buildIdMap).
 *   - Alt-text derivation.
 *
 * Pre-18d the script used `mergeExistingFiles` + `buildFileDescription` for
 * idempotency via a description-tag pattern; both were removed in 18d Task 12
 * when idempotency moved onto the dedicated `legacy_path` field.
 */

describe('resolveSourcePath', () => {
	it('joins sourceRoot + legacyPath into an absolute path', () => {
		const entry: AssetEntry = {
			legacyPath: 'about/headshot.webp',
			folder: 'about',
			title: 'T',
			description: 'desc that is long enough',
		};
		const absPath = resolveSourcePath(entry, '/a/b/c');
		// Either forward or backslash depending on platform — just check the join.
		expect(absPath).toContain('about');
		expect(absPath).toContain('headshot.webp');
	});
});

describe('findMissingSources', () => {
	const tempRoot = joinPath(tmpdir(), `assets-test-${Date.now()}`);

	it('returns [] when every source file exists', () => {
		mkdirSync(joinPath(tempRoot, 'about'), { recursive: true });
		writeFileSync(joinPath(tempRoot, 'about', 'a.webp'), 'fake-bytes');

		const manifest: AssetsManifest = {
			description: 'x',
			sourceRoot: 'static/images',
			folders: { about: 'About assets' },
			assets: [
				{
					legacyPath: 'about/a.webp',
					folder: 'about',
					title: 'A',
					description: 'Descriptive alt text here',
				},
			],
		};
		const missing = findMissingSources(manifest, tempRoot);
		expect(missing).toEqual([]);

		rmSync(tempRoot, { recursive: true, force: true });
	});

	it('returns each entry + absPath for missing sources', () => {
		const manifest: AssetsManifest = {
			description: 'x',
			sourceRoot: 'static/images',
			folders: { about: 'About' },
			assets: [
				{
					legacyPath: 'about/not-there.webp',
					folder: 'about',
					title: 'T',
					description: 'Descriptive alt text here',
				},
			],
		};
		const missing = findMissingSources(manifest, '/nonexistent-root-for-test');
		expect(missing.length).toBe(1);
		expect(missing[0]?.entry.legacyPath).toBe('about/not-there.webp');
	});
});

describe('deriveAltText', () => {
	it('strips extension + sentence-cases single-word names', () => {
		expect(deriveAltText('headshot.webp')).toBe('Headshot');
	});

	it('splits on hyphens + sentence-cases each segment', () => {
		expect(deriveAltText('polaroid-1.webp')).toBe('Polaroid 1');
		expect(deriveAltText('montreal-metro.svg')).toBe('Montreal Metro');
		// edu-bishops.svg replaces the deleted logo-3.svg (removed in the /about
		// "real person" pass); keeps a surviving multi-segment .svg example.
		expect(deriveAltText('edu-bishops.svg')).toBe('Edu Bishops');
	});

	it('handles names without extensions', () => {
		expect(deriveAltText('plain-name')).toBe('Plain Name');
	});

	it('handles names with multiple dots', () => {
		expect(deriveAltText('archive.tar.gz')).toBe('Archive.tar');
	});
});

describe('mimeTypeForLegacyPath', () => {
	it('returns image MIME types Directus needs for asset transforms', () => {
		expect(mimeTypeForLegacyPath('images/work/yesid-dev.png')).toBe('image/png');
		expect(mimeTypeForLegacyPath('images/about/headshot.webp')).toBe('image/webp');
		expect(mimeTypeForLegacyPath('images/montreal-metro.svg')).toBe('image/svg+xml');
		expect(mimeTypeForLegacyPath('images/project/photo.jpeg')).toBe('image/jpeg');
	});

	it('falls back to octet-stream for unknown extensions', () => {
		expect(mimeTypeForLegacyPath('images/archive.bin')).toBe(
			'application/octet-stream',
		);
	});
});

describe('imageMetadataFromBytes', () => {
	const staticRoot = joinPath(import.meta.dir, '..', '..', 'web', 'static');

	it('detects PNG dimensions from the source bytes', () => {
		const legacyPath = 'images/work/yesid-dev.png';
		const metadata = imageMetadataFromBytes(
			legacyPath,
			readFileSync(joinPath(staticRoot, legacyPath)),
		);
		expect(metadata).toEqual({ type: 'image/png', width: 2482, height: 1326 });
	});

	it('detects WebP dimensions from the source bytes', () => {
		const legacyPath = 'images/about/headshot.webp';
		const metadata = imageMetadataFromBytes(
			legacyPath,
			readFileSync(joinPath(staticRoot, legacyPath)),
		);
		expect(metadata).toEqual({ type: 'image/webp', width: 600, height: 400 });
	});

	it('trusts the file signature when extension and bytes disagree', () => {
		const legacyPath = 'images/about/interests/dataviz.webp';
		const metadata = imageMetadataFromBytes(
			legacyPath,
			readFileSync(joinPath(staticRoot, legacyPath)),
		);
		expect(metadata).toEqual({ type: 'image/jpeg', width: 400, height: 600 });
	});

	it('detects SVG dimensions from width and height attributes', () => {
		// Repointed from the deleted images/about/logo-1.svg (removed in the
		// /about "real person" pass) to montreal-metro.svg, which carries
		// explicit width/height attrs and so still exercises the
		// width/height-attribute branch of parseSvgDimensions (not the viewBox
		// fallback). It is a manifest + id-map asset and is not slated for removal.
		const legacyPath = 'images/montreal-metro.svg';
		const metadata = imageMetadataFromBytes(
			legacyPath,
			readFileSync(joinPath(staticRoot, legacyPath)),
		);
		expect(metadata).toEqual({ type: 'image/svg+xml', width: 1821, height: 1260 });
	});
});

describe('buildFileMetadataPatch', () => {
	it('returns only fields that need repair', () => {
		const patch = buildFileMetadataPatch(
			{ type: 'application/octet-stream', width: null, height: 1326 },
			{ type: 'image/png', width: 2482, height: 1326 },
		);
		expect(patch).toEqual({ type: 'image/png', width: 2482 });
	});

	it('returns an empty patch when metadata already matches', () => {
		const patch = buildFileMetadataPatch(
			{ type: 'image/png', width: 2482, height: 1326 },
			{ type: 'image/png', width: 2482, height: 1326 },
		);
		expect(patch).toEqual({});
	});
});

describe('filterToUpload', () => {
	const fakeManifest = parseManifest({
		description: 'x',
		sourceRoot: 'apps/web/static',
		folders: { about: 'x' },
		assets: [
			{ legacyPath: 'images/about/a.webp', folder: 'about', title: 'A', description: 'A long enough sentence here' },
			{ legacyPath: 'images/about/b.webp', folder: 'about', title: 'B', description: 'B long enough sentence here' },
			{ legacyPath: 'images/about/c.webp', folder: 'about', title: 'C', description: 'C long enough sentence here' },
		],
	});

	it('separates already-uploaded from to-upload by legacyPath', () => {
		const existing = new Map([
			['images/about/a.webp', 'uuid-a'],
			['images/about/c.webp', 'uuid-c'],
		]);
		const { alreadyUploaded, toUpload } = filterToUpload(fakeManifest, existing);
		expect(alreadyUploaded.size).toBe(2);
		expect(alreadyUploaded.get('images/about/a.webp')).toBe('uuid-a');
		expect(toUpload).toHaveLength(1);
		expect(toUpload[0]?.legacyPath).toBe('images/about/b.webp');
	});

	it('returns all-to-upload when existing map is empty', () => {
		const { alreadyUploaded, toUpload } = filterToUpload(fakeManifest, new Map());
		expect(alreadyUploaded.size).toBe(0);
		expect(toUpload).toHaveLength(3);
	});

	it('returns all-already-uploaded when every entry matches', () => {
		const existing = new Map(
			fakeManifest.assets.map((a, i) => [a.legacyPath, `uuid-${i}`] as const),
		);
		const { alreadyUploaded, toUpload } = filterToUpload(fakeManifest, existing);
		expect(alreadyUploaded.size).toBe(3);
		expect(toUpload).toHaveLength(0);
	});
});

describe('buildIdMap', () => {
	it('emits keys in alphabetical order', () => {
		const out = buildIdMap([
			{ legacyPath: 'images/z.webp', id: 'uz' },
			{ legacyPath: 'images/a.webp', id: 'ua' },
			{ legacyPath: 'images/m.webp', id: 'um' },
		]);
		expect(Object.keys(out)).toEqual(['images/a.webp', 'images/m.webp', 'images/z.webp']);
		expect(out['images/a.webp']).toBe('ua');
	});

	it('returns empty object on empty input', () => {
		expect(buildIdMap([])).toEqual({});
	});
});
