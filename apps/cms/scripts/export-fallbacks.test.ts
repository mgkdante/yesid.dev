import { legalTruth, demoFeedDisclosures } from './lib/validators/live-export';
import { describe, expect, it } from 'bun:test';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { readCache, writeCache } from './lib/cache';
import { FIXTURE_PATH } from './trim-export-fixture';
import {
	buildMirroredMediaAssetsFromManifest,
	decideExit,
	fallbackBannerLines,
	resolveContentSource,
	raceWithStallGuard,
	resolveFallbackPolicy,
	run,
} from './export-fallbacks';

describe('offline export fixture', () => {
	const fixtureCli = async (args: string[], env: Record<string, string | undefined> = {}) => {
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

	it('emits all modules without credentials or a reachable CMS', async () => {
		const emitDir = joinPath(import.meta.dir, '..', `.fixture-export-test-${crypto.randomUUID()}`);
		try {
			const result = await fixtureCli(['--emit-dir', emitDir], {
				VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'feature/offline', EXPORT_FALLBACKS_SOURCE: 'live',
			});
			expect(result.exitCode).toBe(0);
			expect(result.output).toContain('Ignoring EXPORT_FALLBACKS_SOURCE=live on untrusted Vercel target');
			expect(result.output).not.toMatch(/auth failed|fetch:|cache fallback/);
			expect(readdirSync(emitDir).filter(file => file.endsWith('.ts'))).toHaveLength(20);
			expect(readdirSync(emitDir).filter(file => file.endsWith('.json'))).toEqual([]);
			expect(await Bun.file(joinPath(emitDir, '.cms-cache.json')).exists()).toBe(false);
		} finally { rmSync(emitDir, { recursive: true, force: true }); }
	}, 30_000);

	it('refuses production and develop before LIVE, argument parsing or authentication', async () => {
		for (const env of [
			{ VERCEL_ENV: 'production' },
			{ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'develop' },
		]) {
			for (const overrides of [{}, { EXPORT_FALLBACKS_LIVE: '1' }]) {
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
		const emitDir = joinPath(import.meta.dir, '..', `.export-failure-test-${crypto.randomUUID()}`);
		mkdirSync(emitDir, { recursive: true });
		const marker = joinPath(emitDir, 'site-meta.ts');
		writeFileSync(marker, 'last approved generated content');
		const server = Bun.serve({ port: 0, fetch: () => new Response('fixture CMS unavailable', { status: 403 }) });
		try {
			expect(await run({ source: 'live', directusUrl: server.url.origin, token: 'fixture', emitDir, dryRun: false, policy: 'fail' })).toEqual({ source: 'none', emitted: 0 });
			expect(await Bun.file(marker).text()).toBe('last approved generated content');
			expect(readdirSync(emitDir)).toEqual(['site-meta.ts']);
		} finally { server.stop(true); rmSync(emitDir, { recursive: true, force: true }); }
	});

	it('fails without live content or cache, and emits all modules from an available cache', async () => {
		const emitDir = joinPath(import.meta.dir, '..', `.cache-export-test-${crypto.randomUUID()}`);
		const server = Bun.serve({ port: 0, fetch: () => new Response('unavailable', { status: 403 }) });
		const opts = { source: 'live' as const, directusUrl: server.url.origin, token: 'fixture', emitDir, dryRun: false, policy: 'soft' as const };
		try {
			const missing = await run(opts);
			expect(missing).toEqual({ source: 'none', emitted: 0 });
			expect(decideExit(missing, 'soft')).toBe(1);
			const cached = { ...(await readCache(FIXTURE_PATH))!, mediaAssets: {}, mediaVariants: {} };
			cached.siteLabels!.ui.analyticsConsent.description = { ...legalTruth.consent };
			cached.siteLabels!.heroDashboard.vehiclesSub = { ...demoFeedDisclosures };
			cached.legalPages = cached.legalPages!.map(page => ({ ...page, body: Object.fromEntries(
				(['en', 'fr', 'es'] as const).map(locale => [locale, { time: 1, version: '2.31.2', blocks: [
					'contact@yesid.dev', 'Plausible Analytics Cloud ' + legalTruth.clause[locale],
					legalTruth.revision[locale] + ' 2026-07-15', ...legalTruth.modes[locale],
					page.slug === 'privacy' ? legalTruth.privacyProfile[locale] : legalTruth.cookieProfile[locale],
				].map((text, index) => ({ id: String(index), type: 'paragraph', data: { text } })) }]),
			) }));
			const cache = joinPath(emitDir, '.cms-cache.json');
			await writeCache(cache, cached, 'synthetic');
			const before = await Bun.file(cache).text();
			expect(await run(opts)).toEqual({ source: 'cache', emitted: 20 });
			expect(readdirSync(emitDir).filter(file => file.endsWith('.ts'))).toHaveLength(20);
			expect(await Bun.file(cache).text()).toBe(before);
			const emitted = await Bun.file(joinPath(emitDir, 'site-meta.ts')).text();
			cached.siteLabels!.ui.analyticsConsent.description.en = 'Obsolete consent description';
			await writeCache(cache, cached, 'synthetic');
			await expect(run(opts)).rejects.toThrow('CMS cache is stale');
			expect(await Bun.file(joinPath(emitDir, 'site-meta.ts')).text()).toBe(emitted);
		} finally { server.stop(true); rmSync(emitDir, { recursive: true, force: true }); }
	});
});

describe('content source and fallback policy matrix', () => {
	it.each([
		['local default', {}, 'fixture', 'soft'],
		['CI default', { CI: 'true' }, 'fixture', 'soft'],
		['local fixture', { EXPORT_FALLBACKS_SOURCE: 'fixture' }, 'fixture', 'soft'],
		['local explicit live', { EXPORT_FALLBACKS_SOURCE: 'live' }, 'live', 'soft'],
		['local LIVE flag alone', { EXPORT_FALLBACKS_LIVE: '1' }, 'fixture', 'soft'],
		['untrusted preview', { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'feature/test' }, 'fixture', 'soft'],
		['untrusted preview with LIVE flag', { VERCEL_ENV: 'preview', EXPORT_FALLBACKS_LIVE: '1' }, 'fixture', 'soft'],
		['untrusted preview explicit live', { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'feature/test', EXPORT_FALLBACKS_SOURCE: 'live' }, 'fixture', 'soft'],
		['preview without branch explicit live', { VERCEL_ENV: 'preview', EXPORT_FALLBACKS_SOURCE: 'live' }, 'fixture', 'soft'],
		['Vercel development explicit live', { VERCEL_ENV: 'development', EXPORT_FALLBACKS_SOURCE: 'live' }, 'fixture', 'soft'],
		['Vercel development', { VERCEL_ENV: 'development' }, 'fixture', 'soft'],
		['production', { VERCEL_ENV: 'production' }, 'live', 'fail'],
		['production with LIVE flag', { VERCEL_ENV: 'production', EXPORT_FALLBACKS_LIVE: '1' }, 'live', 'fail'],
		['production explicit live', { VERCEL_ENV: 'production', EXPORT_FALLBACKS_SOURCE: 'live' }, 'live', 'fail'],
		['develop preview', { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'develop' }, 'live', 'fail'],
		['develop preview explicit live', { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'develop', EXPORT_FALLBACKS_SOURCE: 'live' }, 'live', 'fail'],
	] as const)('%s', (_label, env, source, policy) => {
		expect(resolveContentSource(env)).toBe(source);
		expect(resolveFallbackPolicy(env)).toBe(policy);
	});
	it.each([
		{ VERCEL_ENV: 'production' },
		{ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'develop' },
	])('refuses fixture on trusted target %j', env => {
		expect(() => resolveContentSource({ ...env, EXPORT_FALLBACKS_SOURCE: 'fixture' })).toThrow('refuse');
	});
	it('fails when no content source exists and forbids cache on trusted targets', () => {
		for (const policy of ['soft', 'fail'] as const) {
			expect(decideExit({ source: 'none', emitted: 0 }, policy)).toBe(1);
			expect(decideExit({ source: 'live', emitted: 20 }, policy)).toBe(0);
		}
		expect(decideExit({ source: 'cache', emitted: 20 }, 'soft')).toBe(0);
		expect(decideExit({ source: 'fixture', emitted: 20 }, 'soft')).toBe(0);
		expect(decideExit({ source: 'cache', emitted: 20 }, 'fail')).toBe(1);
		expect(decideExit({ source: 'fixture', emitted: 20 }, 'fail')).toBe(1);
	});
});

describe('fallbackBannerLines', () => {
	it('names the fallback source and carries the fetch error', () => {
		const cacheBanner = fallbackBannerLines('cache', 'ECONNREFUSED');
		expect(cacheBanner.join('\n')).toContain('CONTENT FALLBACK IN USE');
		expect(cacheBanner.join('\n')).toContain('source: cache');
		expect(cacheBanner.join('\n')).toContain('fetch error: ECONNREFUSED');

	});
});

describe('complete export boundary', () => {
	const runCli = async (env: Record<string, string> = {}) => {
		const child = Bun.spawn({
			cmd: [
				process.execPath,
				'--no-env-file',
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

	it('validates retired flags before an untrusted preview fixture export', async () => {
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
		const root = joinPath(import.meta.dir, '..', `media-mirror-${Date.now()}`);
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
		const root = joinPath(import.meta.dir, '..', `media-mirror-missing-${Date.now()}`);

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
		const root = joinPath(import.meta.dir, '..', `media-mirror-unmapped-${Date.now()}`);
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
