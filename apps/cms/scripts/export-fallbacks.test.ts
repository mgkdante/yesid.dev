import { describe, expect, it } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { tmpdir } from 'node:os';
import { verifyContentDir } from './verify-content-manifest';
import {
	buildMirroredMediaAssetsFromManifest,
	decideExit,
	fallbackBannerLines,
	getExportSkipReason,
	raceWithStallGuard,
	resolveFallbackPolicy,
	run,
} from './export-fallbacks';

describe('offline export fixture', () => {
	const fixtureCli = async (args: string[], env: Record<string, string> = {}) => {
		const child = Bun.spawn({
			cmd: [process.execPath, '--no-env-file', joinPath(import.meta.dir, 'export-fallbacks.ts'), ...args],
			cwd: joinPath(import.meta.dir, '..'),
			env: { PATH: process.env.PATH ?? '', SystemRoot: process.env.SystemRoot ?? '',
				EXPORT_FALLBACKS_SOURCE: 'fixture', PUBLIC_DIRECTUS_URL: 'http://127.0.0.1:1', ...env },
			stdout: 'pipe', stderr: 'pipe',
		});
		const [exitCode, stdout, stderr] = await Promise.all([
			child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
		]);
		return { exitCode, output: stdout + stderr };
	};

	it('emits all modules and matching fixture manifest without credentials or a reachable CMS', async () => {
		const emitDir = joinPath(import.meta.dir, '..', `.fixture-export-test-${crypto.randomUUID()}`);
		try {
			const result = await fixtureCli(['--emit-dir', emitDir], {
				VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'feature/offline',
			});
			expect(result.exitCode).toBe(0);
			expect(result.output).not.toMatch(/auth failed|fetch:|cache fallback/);
			const manifest = await Bun.file(joinPath(emitDir, 'generated.manifest.json')).json();
			expect(manifest.source).toBe('fixture');
			expect(Object.keys(manifest.files)).toHaveLength(22);
			expect(await verifyContentDir(emitDir)).toEqual({ verified: Object.keys(manifest.files), violations: [] });
			expect(await Bun.file(joinPath(emitDir, '.cms-cache.json')).exists()).toBe(false);
		} finally { rmSync(emitDir, { recursive: true, force: true }); }
	}, 30_000);

	it('refuses production and develop before SKIP, LIVE, argument parsing or authentication', async () => {
		for (const env of [
			{ VERCEL_ENV: 'production' },
			{ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'develop' },
		]) {
			for (const overrides of [{}, { EXPORT_FALLBACKS_SKIP: '1', EXPORT_FALLBACKS_LIVE: '1' }]) {
				const result = await fixtureCli(['--unknown'], { ...env, ...overrides });
				expect(result.exitCode).toBe(1);
				expect(result.output).toContain('Trusted CMS builds refuse EXPORT_FALLBACKS_SOURCE=fixture');
				expect(result.output).not.toMatch(/auth failed|fetch:|Unknown option/);
			}
		}
	});
});

describe('failed live export retains last-good generated output', () => {
	it('does not replace an existing content module after a real HTTP fetch failure', async () => {
		const emitDir = joinPath(tmpdir(), `cms-export-failure-${crypto.randomUUID()}`);
		mkdirSync(emitDir, { recursive: true });
		const marker = joinPath(emitDir, 'site-meta.ts');
		writeFileSync(marker, 'last approved generated content');
		const server = Bun.serve({ port: 0, fetch: () => new Response('fixture CMS unavailable', { status: 403 }) });
		try {
			expect(await run({ directusUrl: server.url.origin, token: 'fixture', emitDir, dryRun: false, policy: 'fail' })).toEqual({ source: 'none', emitted: 0 });
			expect(await Bun.file(marker).text()).toBe('last approved generated content');
			expect(await Bun.file(joinPath(emitDir, 'generated.manifest.json')).exists()).toBe(false);
		} finally { server.stop(true); rmSync(emitDir, { recursive: true, force: true }); }
	});
});

describe('export-fallbacks skip policy', () => {
	it('skips when EXPORT_FALLBACKS_SKIP is enabled', () => {
		expect(getExportSkipReason({ EXPORT_FALLBACKS_SKIP: '1' })).toBe('EXPORT_FALLBACKS_SKIP');
		expect(getExportSkipReason({ EXPORT_FALLBACKS_SKIP: 'true' })).toBe('EXPORT_FALLBACKS_SKIP');
	});

	it('refuses a trusted target with a missing live flag instead of silently shipping old content', () => {
		expect(getExportSkipReason({ VERCEL_ENV: 'preview' })).toBe('VERCEL_ENV=preview');
		expect(() => getExportSkipReason({ VERCEL_ENV: 'production' })).toThrow('EXPORT_FALLBACKS_LIVE=1');
		expect(() => getExportSkipReason({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'develop' })).toThrow('EXPORT_FALLBACKS_LIVE=1');
		expect(getExportSkipReason({ VERCEL_ENV: 'production', EXPORT_FALLBACKS_SKIP: '1' })).toBe('EXPORT_FALLBACKS_SKIP');
	});

	it('skips arbitrary preview branches even when the live flag is mis-scoped', () => {
		expect(
			getExportSkipReason({
				VERCEL_ENV: 'preview',
				VERCEL_GIT_COMMIT_REF: 'feature/untrusted-preview',
				EXPORT_FALLBACKS_LIVE: '1',
			}),
		).toBe('VERCEL_ENV=preview branch=feature/untrusted-preview');
	});

	it('allows live CMS exports only on production and the develop preview', () => {
		expect(getExportSkipReason({ VERCEL_ENV: 'production', EXPORT_FALLBACKS_LIVE: '1' })).toBeNull();
		expect(
			getExportSkipReason({
				VERCEL_ENV: 'preview',
				VERCEL_GIT_COMMIT_REF: 'develop',
				EXPORT_FALLBACKS_LIVE: '1',
			}),
		).toBeNull();
	});

	it('does not skip local explicit export commands by default', () => {
		expect(getExportSkipReason({})).toBeNull();
	});
});

describe('fallback policy (live-or-die)', () => {
	it('is soft for local builds regardless of the LIVE flag', () => {
		expect(resolveFallbackPolicy({})).toBe('soft');
		expect(resolveFallbackPolicy({ EXPORT_FALLBACKS_LIVE: '1' })).toBe('soft');
	});

	it('is fail only on trusted Vercel targets that opted into a live export', () => {
		expect(
			resolveFallbackPolicy({
				VERCEL_ENV: 'preview',
				VERCEL_GIT_COMMIT_REF: 'develop',
				EXPORT_FALLBACKS_LIVE: '1',
			}),
		).toBe('fail');
		expect(
			resolveFallbackPolicy({ VERCEL_ENV: 'production', EXPORT_FALLBACKS_LIVE: 'true' }),
		).toBe('fail');
	});

	it('stays soft for an arbitrary preview even when the live flag drifts onto it', () => {
		expect(
			resolveFallbackPolicy({
				VERCEL_ENV: 'preview',
				VERCEL_GIT_COMMIT_REF: 'feature/untrusted-preview',
				EXPORT_FALLBACKS_LIVE: '1',
			}),
		).toBe('soft');
	});

	it('leaves missing-live rejection to the trusted-target gate before fallback policy', () => {
		expect(resolveFallbackPolicy({ VERCEL_ENV: 'preview' })).toBe('soft');
		expect(resolveFallbackPolicy({ VERCEL_ENV: 'production' })).toBe('soft');
	});

	it('decideExit fails every non-live outcome under fail, never under soft', () => {
		expect(decideExit({ source: 'live', emitted: 27 }, 'fail')).toBe(0);
		expect(decideExit({ source: 'cache', emitted: 27 }, 'fail')).toBe(1);
		expect(decideExit({ source: 'none', emitted: 0 }, 'fail')).toBe(1);
		expect(decideExit({ source: 'live', emitted: 27 }, 'soft')).toBe(0);
		expect(decideExit({ source: 'cache', emitted: 27 }, 'soft')).toBe(0);
		expect(decideExit({ source: 'none', emitted: 0 }, 'soft')).toBe(0);
	});
});

describe('fallbackBannerLines', () => {
	it('names the fallback source and carries the fetch error', () => {
		const cacheBanner = fallbackBannerLines('cache', 'ECONNREFUSED');
		expect(cacheBanner.join('\n')).toContain('CONTENT FALLBACK IN USE');
		expect(cacheBanner.join('\n')).toContain('source: cache');
		expect(cacheBanner.join('\n')).toContain('fetch error: ECONNREFUSED');

		const shipBanner = fallbackBannerLines('committed-modules', 'boom');
		expect(shipBanner.join('\n')).toContain('source: committed-modules');
		expect(shipBanner.join('\n')).toContain('may be stale vs the CMS');
	});
});

describe('complete export boundary', () => {
	const runCli = async (env: Record<string, string> = {}) => {
		const child = Bun.spawn({
			cmd: [
				Bun.which('bun') ?? 'bun',
				joinPath(import.meta.dir, 'export-fallbacks.ts'),
				'--dry-run',
				'--module=services',
			],
			cwd: import.meta.dir,
			env: { PATH: globalThis.process.env.PATH ?? '', ...env },
			stdout: 'pipe',
			stderr: 'pipe',
		});
		const [exitCode, stderr] = await Promise.all([
			child.exited,
			new Response(child.stderr).text(),
		]);
		return { exitCode, stderr };
	};

	it('rejects partial module selection because generation is all-or-nothing', async () => {
		const { exitCode, stderr } = await runCli();
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain('module');
	});

	it('validates retired flags before the explicit skip gate', async () => {
		const { exitCode, stderr } = await runCli({ EXPORT_FALLBACKS_SKIP: '1' });
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain('module');
	});

	it('validates retired flags before an untrusted preview skip gate', async () => {
		const { exitCode, stderr } = await runCli({
			VERCEL_ENV: 'preview',
			VERCEL_GIT_COMMIT_REF: 'feature/untrusted-preview',
		});
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain('module');
	});
});

describe('raceWithStallGuard', () => {
	const spyTimers = () => {
		const calls: { set: number; clear: number; clearedId?: unknown; setId?: unknown } = {
			set: 0,
			clear: 0,
		};
		const timers = {
			set: (fn: () => void, ms: number) => {
				calls.set += 1;
				const id = setTimeout(fn, ms);
				calls.setId = id;
				return id;
			},
			clear: (id: ReturnType<typeof setTimeout>) => {
				calls.clear += 1;
				calls.clearedId = id;
				clearTimeout(id);
			},
		};
		return { calls, timers };
	};

	it('resolves with the work result and clears the stall timer', async () => {
		const { calls, timers } = spyTimers();
		const out = await raceWithStallGuard(Promise.resolve('ok'), 60_000, timers);
		expect(out).toBe('ok');
		expect(calls.set).toBe(1);
		expect(calls.clear).toBe(1);
		expect(calls.clearedId).toBe(calls.setId);
	});

	it('clears the timer on the rejection path too', async () => {
		const { calls, timers } = spyTimers();
		await expect(
			raceWithStallGuard(Promise.reject(new Error('boom')), 60_000, timers),
		).rejects.toThrow('boom');
		expect(calls.clear).toBe(1);
	});

	it('rejects when the work outlives the timeout', async () => {
		const { calls, timers } = spyTimers();
		const never = new Promise<string>(() => {});
		await expect(raceWithStallGuard(never, 5, timers)).rejects.toThrow(
			'fetchAll timed out after 5ms',
		);
		expect(calls.clear).toBe(1);
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
							sha256: '2c8648d103e3dd7ad87660da0f126a1443b6d21ac1bd3ec000c5e24e2373a90c',
						},
					],
				},
				{ 'images/work/cover.png': 'uuid-cover' },
			);

			expect(mirrored).toEqual({ 'uuid-cover': '/images/work/cover.png' });
			writeFileSync(joinPath(root, 'images', 'work', 'cover.png'), 'changed-bytes');
			expect(() => buildMirroredMediaAssetsFromManifest(
				{ sourceRoot: root, assets: [{
					legacyPath: 'images/work/cover.png',
					sha256: '2c8648d103e3dd7ad87660da0f126a1443b6d21ac1bd3ec000c5e24e2373a90c',
				}] },
				{ 'images/work/cover.png': 'uuid-cover' },
			)).toThrow('[media-assets] sha256 mismatch');
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
					assets: [{ legacyPath: 'images/work/missing.png', sha256: '0'.repeat(64) }],
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
						assets: [{ legacyPath: 'images/orphan.png', sha256: '0'.repeat(64) }],
					},
					{},
				),
			).toThrow('[media-assets] missing Directus UUID(s)');
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});
