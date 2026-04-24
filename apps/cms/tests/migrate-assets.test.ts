import { describe, expect, it } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { tmpdir } from 'node:os';
import {
	type AssetEntry,
	type AssetsManifest,
	buildFileDescription,
	findMissingSources,
	mergeExistingFiles,
	resolveSourcePath,
} from '../scripts/migrate-assets';

/**
 * Unit tests for the pure helpers in scripts/migrate-assets.ts.
 *
 * No network, no Directus. Covers:
 *   - Source-path resolution from manifest entry + root.
 *   - Missing-source detection with a real temp directory.
 *   - Idempotency: matching existing files by the `[legacy:<path>]`
 *     description tag, partitioning into alreadyUploaded vs toUpload.
 *   - Description tag construction.
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

describe('buildFileDescription', () => {
	it('prefixes description with [legacy:<path>] tag', () => {
		const entry: AssetEntry = {
			legacyPath: 'about/headshot.webp',
			folder: 'about',
			title: 'Headshot',
			description: 'Portrait of Yesid used on /about.',
		};
		expect(buildFileDescription(entry)).toBe(
			'[legacy:about/headshot.webp] Portrait of Yesid used on /about.',
		);
	});
});

describe('mergeExistingFiles — idempotency', () => {
	const manifest: AssetsManifest = {
		description: 'x',
		sourceRoot: 'static/images',
		folders: { about: 'About', brand: 'Brand' },
		assets: [
			{
				legacyPath: 'about/a.webp',
				folder: 'about',
				title: 'A',
				description: 'Descriptive alt text here',
			},
			{
				legacyPath: 'about/b.webp',
				folder: 'about',
				title: 'B',
				description: 'Descriptive alt text here',
			},
			{
				legacyPath: 'brand/c.svg',
				folder: 'brand',
				title: 'C',
				description: 'Descriptive alt text here',
			},
		],
	};

	it('classifies all as toUpload when no existing files match', () => {
		const result = mergeExistingFiles(manifest, []);
		expect(result.alreadyUploaded.size).toBe(0);
		expect(result.toUpload.length).toBe(3);
	});

	it('classifies entries with matching legacy tag as alreadyUploaded', () => {
		const result = mergeExistingFiles(manifest, [
			{ id: 'uuid-1', description: '[legacy:about/a.webp] Anything' },
			{ id: 'uuid-2', description: '[legacy:about/b.webp] Anything' },
		]);
		expect(result.alreadyUploaded.get('about/a.webp')).toBe('uuid-1');
		expect(result.alreadyUploaded.get('about/b.webp')).toBe('uuid-2');
		expect(result.toUpload.length).toBe(1);
		expect(result.toUpload[0]?.legacyPath).toBe('brand/c.svg');
	});

	it('ignores existing files with no legacy tag in description', () => {
		const result = mergeExistingFiles(manifest, [
			{ id: 'uuid-x', description: 'Some random file description with no tag' },
			{ id: 'uuid-y', description: null },
		]);
		expect(result.alreadyUploaded.size).toBe(0);
		expect(result.toUpload.length).toBe(3);
	});

	it('is fully idempotent — every manifest entry present = nothing to upload', () => {
		const result = mergeExistingFiles(manifest, [
			{ id: 'u1', description: '[legacy:about/a.webp] A' },
			{ id: 'u2', description: '[legacy:about/b.webp] B' },
			{ id: 'u3', description: '[legacy:brand/c.svg] C' },
		]);
		expect(result.alreadyUploaded.size).toBe(3);
		expect(result.toUpload.length).toBe(0);
	});

	it('only matches exact legacy paths (no fuzzy matching)', () => {
		// A file whose tag looks similar but differs — should NOT be treated
		// as a match. Prevents accidentally skipping an upload because of a
		// typo'd tag on a previously-uploaded asset.
		const result = mergeExistingFiles(manifest, [
			{ id: 'u1', description: '[legacy:about/a.WEBP] case-mismatch' },
		]);
		expect(result.alreadyUploaded.size).toBe(0);
		expect(result.toUpload.length).toBe(3);
	});
});
