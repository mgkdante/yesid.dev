import { describe, expect, it } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { emitModule } from './emitters/emit-module';
import {
	GENERATED_HEADER_MARKER,
	GENERATED_MANIFEST_FILENAME,
	buildManifest,
	hashContent,
	loadManifest,
	manifestPath,
	serializeManifest,
	writeManifest,
} from './generated-manifest';

describe('hashContent', () => {
	// Known SHA-256 vectors — proves hashContent produces the SAME hex that the
	// bash pre-commit hook gets from `sha256sum` / `shasum -a 256`. If these two
	// ever diverge, the guard would false-positive on every commit.
	it('matches the canonical sha256sum of "" and "abc"', () => {
		expect(hashContent('')).toBe(
			'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
		);
		expect(hashContent('abc')).toBe(
			'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
		);
	});

	it('is sensitive to a single-byte change (catches hand-edits)', () => {
		expect(hashContent('export const x = 1;\n')).not.toBe(hashContent('export const x = 2;\n'));
	});
});

describe('buildManifest', () => {
	it('sorts file keys deterministically regardless of insertion order', () => {
		const a = buildManifest({ 'z.ts': '1', 'a.ts': '2', 'm.ts': '3' });
		const b = buildManifest({ 'a.ts': '2', 'm.ts': '3', 'z.ts': '1' });
		expect(Object.keys(a.files)).toEqual(['a.ts', 'm.ts', 'z.ts']);
		expect(serializeManifest(a.files)).toBe(serializeManifest(b.files));
		expect(a.algorithm).toBe('sha256');
	});
});

describe('serializeManifest', () => {
	it('emits tab-indented JSON with a trailing newline (stable diffs)', () => {
		const out = serializeManifest({ 'a.ts': 'deadbeef' });
		expect(out.endsWith('\n')).toBe(true);
		expect(out).toContain('\t"algorithm": "sha256"');
		expect(out).toContain('\t\t"a.ts": "deadbeef"');
	});
});

describe('write/loadManifest round-trip', () => {
	it('persists and reads back the file hash map', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'manifest-test-'));
		try {
			const files = { 'about-page.ts': hashContent('one'), 'nav.ts': hashContent('two') };
			await writeManifest(dir, files);

			const onDisk = await readFile(manifestPath(dir), 'utf8');
			expect(onDisk).toBe(serializeManifest(files));
			expect(manifestPath(dir).endsWith(GENERATED_MANIFEST_FILENAME)).toBe(true);

			const loaded = await loadManifest(dir);
			expect(loaded?.files).toEqual(buildManifest(files).files);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it('returns null for a missing manifest', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'manifest-test-'));
		try {
			expect(await loadManifest(dir)).toBeNull();
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});

describe('GENERATED_HEADER_MARKER', () => {
	// The marker is only useful if all four sites agree byte-for-byte: the
	// emitter header, this constant, and the two bash guards that grep for it.
	// A mismatch (the pre-2026-07 em-dash rot) silently disables both hand-edit
	// guards, so each site is asserted here instead of trusted.
	const REPO_ROOT = resolve(import.meta.dir, '../../../..');

	it('is a substring of every emitModule() output', () => {
		const out = emitModule({
			filePath: '/tmp/marker-probe.ts',
			description: 'marker sync probe',
			imports: [],
			exports: [{ name: 'probe', typeName: 'number', value: 1 }],
		});
		expect(out).toContain(GENERATED_HEADER_MARKER);
		// The guards only scan the first 400 bytes (head -c 400).
		expect(out.slice(0, 400)).toContain(GENERATED_HEADER_MARKER);
	});

	it('is the exact string the git pre-commit hook greps for', () => {
		const hook = readFileSync(resolve(REPO_ROOT, '.githooks/pre-commit'), 'utf8');
		expect(hook).toContain(`GENERATED_MARKER="${GENERATED_HEADER_MARKER}"`);
	});

	it('is the exact string the Claude PreToolUse hook greps for', () => {
		const hook = readFileSync(
			resolve(REPO_ROOT, '.claude/hooks/pretool-block-generated-ts.sh'),
			'utf8',
		);
		expect(hook).toContain(`grep -q "${GENERATED_HEADER_MARKER}"`);
	});
});
