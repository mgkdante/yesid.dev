import { describe, expect, it } from 'bun:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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

	it('records live provenance by default and cache when the emit came from the fallback', () => {
		expect(buildManifest({ 'a.ts': '1' }).source).toBe('live');
		expect(buildManifest({ 'a.ts': '1' }, 'cache').source).toBe('cache');
		expect(serializeManifest({ 'a.ts': '1' }, 'cache')).toContain('"source": "cache"');
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

	it('round-trips the cache provenance', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'manifest-test-'));
		try {
			await writeManifest(dir, { 'nav.ts': hashContent('one') }, 'cache');
			expect((await loadManifest(dir))?.source).toBe('cache');
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it('loads a pre-provenance manifest without a source field (backward compat)', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'manifest-test-'));
		try {
			// Hand-built legacy shape: the committed manifest predates `source`.
			const legacy = {
				'//': 'legacy note',
				algorithm: 'sha256',
				files: { 'nav.ts': hashContent('one') },
			};
			await writeFile(manifestPath(dir), `${JSON.stringify(legacy, null, '\t')}\n`, 'utf8');
			const loaded = await loadManifest(dir);
			expect(loaded).not.toBeNull();
			expect(loaded?.source).toBeUndefined();
			expect(loaded?.files).toEqual(legacy.files);
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
	// The emitter constant and staged-content guard must agree byte-for-byte.
	// A mismatch silently disables hand-edit protection.
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

	it('blocks a staged hand-edit through the live pre-commit guard', async () => {
		const temporaryDirectory = await mkdtemp(join(tmpdir(), 'generated-content-index-'));
		const indexPath = join(temporaryDirectory, 'index');
		const target = 'apps/web/src/lib/content/site-labels.ts';
		const env = { ...process.env, GIT_INDEX_FILE: indexPath };
		try {
			execFileSync('git', ['read-tree', 'HEAD'], { cwd: REPO_ROOT, env });
			const committed = await readFile(resolve(REPO_ROOT, target), 'utf8');
			const blob = execFileSync('git', ['hash-object', '-w', '--stdin'], {
				cwd: REPO_ROOT,
				encoding: 'utf8',
				input: `${committed}\n// staged hand edit\n`,
			}).trim();
			execFileSync(
				'git',
				['update-index', '--add', '--cacheinfo', `100644,${blob},${target}`],
				{ cwd: REPO_ROOT, env },
			);

			const result = spawnSync('bash', ['.githooks/pre-commit'], {
				cwd: REPO_ROOT,
				env,
				encoding: 'utf8',
			});
			expect(result.status).toBe(1);
			expect(`${result.stdout}${result.stderr}`).toContain(
				'ERROR: a CMS-generated content module was hand-edited.',
			);
			expect(`${result.stdout}${result.stderr}`).toContain(target);
		} finally {
			await rm(temporaryDirectory, { recursive: true, force: true });
		}
	});
});
