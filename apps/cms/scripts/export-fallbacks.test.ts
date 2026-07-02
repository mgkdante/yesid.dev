import { describe, expect, it } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { tmpdir } from 'node:os';
import {
	ALL_MODULES,
	assertValidModuleFilter,
	buildMirroredMediaAssetsFromManifest,
	decideExit,
	fallbackBannerLines,
	getExportSkipReason,
	raceWithStallGuard,
	resolveFallbackPolicy,
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

describe('fallback policy (live-or-die)', () => {
	it('is soft for local builds regardless of the LIVE flag', () => {
		expect(resolveFallbackPolicy({})).toBe('soft');
		expect(resolveFallbackPolicy({ EXPORT_FALLBACKS_LIVE: '1' })).toBe('soft');
	});

	it('is fail on ANY Vercel target that opted into a live export', () => {
		expect(resolveFallbackPolicy({ VERCEL_ENV: 'preview', EXPORT_FALLBACKS_LIVE: '1' })).toBe(
			'fail',
		);
		expect(
			resolveFallbackPolicy({ VERCEL_ENV: 'production', EXPORT_FALLBACKS_LIVE: 'true' }),
		).toBe('fail');
	});

	it('stays soft on Vercel without the LIVE flag (the skip gate exits first anyway)', () => {
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

describe('--module filter validation', () => {
	it('accepts every known module name and the absent filter', () => {
		for (const name of ALL_MODULES) {
			expect(() => assertValidModuleFilter(name)).not.toThrow();
		}
		expect(() => assertValidModuleFilter(undefined)).not.toThrow();
	});

	it('rejects a typo loudly instead of silently emitting nothing', () => {
		expect(() => assertValidModuleFilter('servicess')).toThrow(
			"unknown --module 'servicess'",
		);
		expect(() => assertValidModuleFilter('Services')).toThrow('Valid modules:');
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
