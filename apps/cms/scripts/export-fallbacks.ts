#!/usr/bin/env bun
/**
 * Generate ephemeral runtime modules before web dev, test, check and build.
 * Local/CI/untrusted previews default to the shared fixture without credentials or network.
 * Trusted Vercel targets always require live content and refuse fixture mode.
 * EXPORT_FALLBACKS_SOURCE=live selects live export with local cache fallback.
 * EXPORT_FALLBACKS_LIVE remains the trusted-target operator flag.
 * Missing live content and cache fails the export.
 */

import { parseArgs } from 'node:util';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { buildEmitConfigs } from './lib/emitters/configs';
import { emitModule, type ModuleEmitConfig } from './lib/emitters/emit-module';
import { readCache, writeCache as persistCache } from './lib/cache';
import { validateLiveExport } from './lib/validators/live-export';
import type { ExportData } from './export-data';
import { fetchSiteMeta, fetchSiteSeoDefaults } from './lib/fetchers/site-meta';
import { fetchRouteSeoOverrides } from './lib/fetchers/route-seo';
import { fetchMorphShapes } from './lib/fetchers/morph-shapes';
import { fetchErrorPageFallback, fetchAllErrorPages } from './lib/fetchers/error-pages';
import { fetchNavData, type NavData } from './lib/fetchers/nav';
import { fetchSitePages } from './lib/fetchers/site-pages';
import { fetchLegalPages } from './lib/fetchers/legal-pages';
import { fetchBlogPosts, fetchBlogBodies } from './lib/fetchers/blog-posts';
import { fetchServices } from './lib/fetchers/services';
import { fetchProjects } from './lib/fetchers/projects';
import { fetchSiteLabels } from './lib/fetchers/site-labels';
import {
	fetchBlogPageContent,
	fetchProjectsPageContent,
} from './lib/fetchers/page-blocks-simple';
import {
	fetchContactContent,
} from './lib/fetchers/page-blocks-medium';
import {
	fetchHeroContent,
	fetchManifestoContent,
	fetchProofReelContent,
	fetchServicesGridContent,
	fetchAboutIntroContent,
	fetchCtaContent,
	fetchCloserContent,
} from './lib/fetchers/page-blocks-home';
import { fetchAboutContent } from './lib/fetchers/page-blocks-about';
import type { CmsClient } from './lib/fetchers/types';
import {
	prepareMediaVariants,
	writeMediaVariants,
	type PreparedMediaVariants,
} from './lib/media-variants';
import assetIdMap from '../fixtures/assets-id-map.json' with { type: 'json' };
import assetManifest from '../fixtures/assets-manifest.json' with { type: 'json' };

const log = createLogger('export-fallbacks');

// Anchor output paths to the script's own location so cwd doesn't matter.
// Script lives at apps/cms/scripts/export-fallbacks.ts; web content lives at
// apps/web/src/lib/content/. Both work from monorepo root and from apps/cms/.
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_WEB_CONTENT_DIR = resolve(SCRIPT_DIR, '../../web/src/lib/content');
const EXPORT_FIXTURE_PATH = resolve(SCRIPT_DIR, '../../../packages/shared/fixtures/export-data.json');

export interface RunOptions {
	directusUrl: string;
	token: string;
	dryRun: boolean;
	source?: 'fixture' | 'live';
	/** Where to write emitted .ts modules. Defaults to apps/web/src/lib/content. */
	emitDir?: string;
	/** Trusted targets fail on fetch errors; local live exports may use cache. */
	policy?: FallbackPolicy;
}

/**
 * Promise.race against a stall timer that is ALWAYS cleared. The inline
 * setTimeout this replaces was never cleared on success, so every live export
 * held the event loop for the full 60s after finishing (audit 2026-07-01,
 * bucket A #6). Timer fns are injectable so tests can assert the clear.
 */
export async function raceWithStallGuard<T>(
	work: Promise<T>,
	timeoutMs: number,
	timers: {
		set: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
		clear: (id: ReturnType<typeof setTimeout>) => void;
	} = { set: (fn, ms) => setTimeout(fn, ms), clear: (id) => clearTimeout(id) },
): Promise<T> {
	let stallTimer: ReturnType<typeof setTimeout> | undefined;
	const timeoutReject = new Promise<never>((_, reject) => {
		stallTimer = timers.set(
			() => reject(new Error(`fetchAll timed out after ${timeoutMs}ms`)),
			timeoutMs,
		);
	});
	try {
		return await Promise.race([work, timeoutReject]);
	} finally {
		if (stallTimer !== undefined) timers.clear(stallTimer);
	}
}

/** Timeout (ms) for the entire fetchAll operation before falling back to cache. */
const FETCH_ALL_TIMEOUT_MS = 60_000;
type Env = Record<string, string | undefined>;

interface MediaMirrorManifest {
	sourceRoot: string;
	assets: readonly { legacyPath: string; sha256: string }[];
}

interface FetchedExport {
	data: ExportData;
	preparedMediaVariants?: PreparedMediaVariants;
}

export function buildMirroredMediaAssetsFromManifest(
	manifest: MediaMirrorManifest,
	ids: Readonly<Record<string, string>>,
	repoRoot = resolve(SCRIPT_DIR, '../../..'),
): Readonly<Record<string, string>> {
	const staticRoot = resolve(repoRoot, manifest.sourceRoot);
	const mirrored: Record<string, string> = {};
	const missingIds: string[] = [];
	const missingFiles: string[] = [];
	const mismatchedFiles: string[] = [];

	for (const item of manifest.assets) {
		const id = ids[item.legacyPath];
		if (!id) {
			missingIds.push(item.legacyPath);
			continue;
		}
		if (!existsSync(resolve(staticRoot, item.legacyPath))) {
			missingFiles.push(item.legacyPath);
			continue;
		}
		const digest = createHash('sha256')
			.update(readFileSync(resolve(staticRoot, item.legacyPath)))
			.digest('hex');
		if (digest !== item.sha256) mismatchedFiles.push(item.legacyPath);
		mirrored[id] = `/${item.legacyPath}`;
	}

	if (missingIds.length > 0) {
		throw new Error(
			`[media-assets] missing Directus UUID(s) in assets-id-map.json: ${missingIds.join(', ')}`,
		);
	}
	if (missingFiles.length > 0) {
		throw new Error(
			`[media-assets] missing mirrored static asset file(s) under ${manifest.sourceRoot}: ${missingFiles.join(', ')}`,
		);
	}

	if (mismatchedFiles.length > 0) {
		throw new Error(`[media-assets] sha256 mismatch for mirrored asset(s): ${mismatchedFiles.join(', ')}`);
	}
	return mirrored;
}

export function buildMirroredMediaAssets(): Readonly<Record<string, string>> {
	return buildMirroredMediaAssetsFromManifest(
		assetManifest as MediaMirrorManifest,
		assetIdMap as Record<string, string>,
	);
}

const LIVE_PREVIEW_BRANCH = 'develop';

function isTrustedVercelExportTarget(env: Env): boolean {
	return (
		env.VERCEL_ENV === 'production' ||
		(env.VERCEL_ENV === 'preview' && env.VERCEL_GIT_COMMIT_REF === LIVE_PREVIEW_BRANCH)
	);
}

export function resolveContentSource(env: Env = process.env): 'live' | 'fixture' {
	if (env.EXPORT_FALLBACKS_SOURCE === 'fixture' && isTrustedVercelExportTarget(env)) {
		throw new Error('Trusted CMS builds refuse EXPORT_FALLBACKS_SOURCE=fixture; a live export is required.');
	}
	if (isTrustedVercelExportTarget(env)) return 'live';
	return env.EXPORT_FALLBACKS_SOURCE === 'live' ? 'live' : 'fixture';
}

export type FallbackPolicy = 'fail' | 'soft';

/** Trusted targets never fall back, regardless of the operator flag. */
export function resolveFallbackPolicy(env: Env = process.env): FallbackPolicy {
	return isTrustedVercelExportTarget(env) ? 'fail' : 'soft';
}

/** Where the run's emitted content came from; 'none' means nothing was emitted. */
export type ContentSource = 'live' | 'cache' | 'fixture' | 'none';

export interface RunOutcome {
	source: ContentSource;
	/** Number of modules written to disk. */
	emitted: number;
}

/**
 * Pure exit-code decision so the policy matrix is unit-testable: under 'fail'
 * any non-live outcome fails; every policy fails when no content source exists.
 */
export function decideExit(outcome: RunOutcome, policy: FallbackPolicy): number {
	return outcome.source === 'none' || (policy === 'fail' && outcome.source !== 'live') ? 1 : 0;
}

/**
 * Unmissable stderr banner for soft-policy fallbacks. Local builds keep the
 * graceful degrade, but a boxed block on stderr is much harder to scroll past
 * than a single WARN line. Pure line-builder so tests can assert the content.
 */
export function fallbackBannerLines(
	source: 'cache',
	fetchError: string,
): string[] {
	const detail = 'emitting from .cms-cache.json (last-known-good snapshot), NOT the live CMS';
	return [
		'!!==================================================================!!',
		'!!  CONTENT FALLBACK IN USE: BUILD IS NOT LIVE CMS CONTENT           ',
		`!!  source: ${source}`,
		`!!  ${detail}`,
		`!!  fetch error: ${fetchError}`,
		'!!  Fix CMS connectivity and re-run export:fallbacks before          ',
		'!!  trusting this build output.                        ',
		'!!==================================================================!!',
	];
}

function logFallbackBanner(source: 'cache', fetchError: string): void {
	for (const line of fallbackBannerLines(source, fetchError)) console.error(line);
}

async function fetchAll(opts: RunOptions): Promise<FetchedExport> {
	log.info(`fetch: source=${opts.directusUrl}`);
	if (opts.dryRun) {
		log.info('  dry-run: would fetch the complete export registry');
		return { data: {} };
	}

	const fetchAllInner = async (): Promise<ExportData> => {
		const client = createClient(opts.directusUrl, opts.token) as unknown as CmsClient;
		const out: ExportData = {};
		out.mediaAssets = buildMirroredMediaAssets();

		// Each task is [moduleName, async () => void that assigns to out.*].
		// Fan out the complete source set in parallel.
		// The Bottleneck limiter inside createQueuedFetch() keeps actual
		// in-flight HTTP requests ≤ 4 concurrent / ≤ 50 req/s.
		const tasks: Array<Promise<void>> = [];

		const enqueue = (name: string, task: () => Promise<void>) => {
			log.info(`  ${name}...`);
			tasks.push(task());
		};

		enqueue('site-meta', async () => {
			out.siteMeta = await fetchSiteMeta({ client });
			log.info('  site-meta done.');
		});
		enqueue('site-seo-defaults', async () => {
			out.siteSeoDefaults = await fetchSiteSeoDefaults({ client });
			log.info('  site-seo-defaults done.');
		});
		enqueue('route-seo', async () => {
			out.routeSeo = await fetchRouteSeoOverrides({ client });
			log.info(`  route-seo done (${out.routeSeo.length} rows).`);
		});
		enqueue('morph-shapes', async () => {
			out.morphShapes = await fetchMorphShapes({ client });
			log.info(`  morph-shapes done (${out.morphShapes.length} rows).`);
		});
		enqueue('error-pages', async () => {
			// Two fetches for the same module — kept together to preserve semantics.
			out.errorPageFallback = await fetchErrorPageFallback({ client });
			out.errorPages = await fetchAllErrorPages({ client });
			log.info(`  error-pages done (${Object.keys(out.errorPages).length} rows).`);
		});
		enqueue('nav', async () => {
			out.nav = await fetchNavData({ client });
			log.info(
				`  nav done (${out.nav.navLinks.length} header / ${out.nav.menuItems.length} menu / ${out.nav.footerLinks.length} footer / ${out.nav.mobileLinks.length} mobile).`,
			);
		});
		enqueue('site-pages', async () => {
			out.sitePages = await fetchSitePages({ client });
			log.info(`  site-pages done (${out.sitePages.length} published rows).`);
		});
		enqueue('blog-posts', async () => {
			// fetchBlogPosts + fetchBlogBodies are independent of each other.
			const [posts, bodies] = await Promise.all([
				fetchBlogPosts({ client }),
				fetchBlogBodies({ client }),
			]);
			out.blogPosts = posts;
			out.blogBodies = bodies;
			log.info(
				`  blog-posts done (${out.blogPosts.length} posts, ${Object.keys(out.blogBodies).length} bodies).`,
			);
		});
		enqueue('services', async () => {
			out.services = await fetchServices({ client });
			log.info(`  services done (${out.services.length} services).`);
		});
		enqueue('projects', async () => {
			out.projects = await fetchProjects({ client });
			log.info(`  projects done (${out.projects.length} projects).`);
		});
		enqueue('site-labels', async () => {
			out.siteLabels = await fetchSiteLabels({ client });
			log.info('  site-labels done.');
		});
		enqueue('blog-page', async () => {
			out.blogPage = await fetchBlogPageContent({ client });
			log.info('  blog-page done.');
		});
		enqueue('projects-page', async () => {
			out.projectsPage = await fetchProjectsPageContent({ client });
			log.info('  projects-page done.');
		});
		enqueue('contact-page', async () => {
			out.contactPage = await fetchContactContent({ client });
			log.info('  contact-page done.');
		});
		enqueue('legal-pages', async () => {
			out.legalPages = await fetchLegalPages({ client });
			log.info(`  legal-pages done (${out.legalPages.length} pages).`);
		});
		enqueue('hero', async () => {
			out.hero = await fetchHeroContent({ client });
			log.info('  hero done.');
		});
		enqueue('manifesto', async () => {
			out.manifesto = await fetchManifestoContent({ client });
			log.info(
				`  manifesto done (${out.manifesto.pills.length} pills, ${out.manifesto.hiddenTransitLines.length} transit lines).`,
			);
		});
		enqueue('proof-reel', async () => {
			out.proofReel = await fetchProofReelContent({ client });
			log.info('  proof-reel done.');
		});
		enqueue('services-grid', async () => {
			out.servicesGrid = await fetchServicesGridContent({ client });
			log.info('  services-grid done.');
		});
		enqueue('about-intro', async () => {
			out.aboutIntro = await fetchAboutIntroContent({ client });
			log.info(`  about-intro done (${out.aboutIntro.stackItems.length} stack items).`);
		});
		enqueue('cta', async () => {
			out.cta = await fetchCtaContent({ client });
			log.info('  cta done.');
		});
		enqueue('closer', async () => {
			out.closer = await fetchCloserContent({ client });
			log.info('  closer done.');
		});
		enqueue('about-page', async () => {
			out.aboutPage = await fetchAboutContent({ client });
			log.info(
				`  about-page done (${out.aboutPage.metrics.length} metrics, ${out.aboutPage.methodology.length} beliefs, ${out.aboutPage.testimonials.length} testimonials, ${out.aboutPage.languages.length} languages, ${out.aboutPage.education.length} education rows).`,
			);
		});

		await Promise.all(tasks);
		return out;
	};

	// Top-level stall guard: if the entire fetch hasn't completed within
	// FETCH_ALL_TIMEOUT_MS, reject so the caller falls through to cache. The
	// timer is cleared in raceWithStallGuard's finally, win or lose.
	const out = await raceWithStallGuard(fetchAllInner(), FETCH_ALL_TIMEOUT_MS);

	// Variant preparation runs outside the network-timeout race: it is local-only
	// and sharp encode time must not eat into the CMS fetch budget. Preparation
	// retains encoded buffers but performs no writes; run() validates the complete
	// snapshot before committing them.
	const preparedMediaVariants = await prepareMediaVariants(
		assetManifest as MediaMirrorManifest,
	);
	out.mediaVariants = preparedMediaVariants.data;
	log.info(
		`  media-variants prepared (${Object.keys(out.mediaVariants).length} raster assets).`,
	);

	return { data: out, preparedMediaVariants };
}

/** Emit only after the complete registry and live-content validators pass. */
async function emitAll(
	configs: readonly ModuleEmitConfig[],
	opts: RunOptions,
): Promise<number> {
	const emitDir = opts.emitDir ?? DEFAULT_WEB_CONTENT_DIR;
	log.info(`emit: target=${emitDir}`);

	await mkdir(emitDir, { recursive: true });
	for (const cfg of configs) {
		const content = emitModule(cfg);
		await Bun.write(cfg.filePath, content);
		log.info(`  ${relative(emitDir, cfg.filePath)} (${content.length} bytes)`);
	}
	log.info(`emit: wrote ${configs.length} module(s).`);

	return configs.length;
}

function cachePath(opts: RunOptions): string {
	return resolve(opts.emitDir ?? DEFAULT_WEB_CONTENT_DIR, '.cms-cache.json');
}

async function writeCache(data: ExportData, opts: RunOptions): Promise<void> {
	const path = cachePath(opts);
	await persistCache(path, data, opts.directusUrl);
	log.info(`cache: wrote ${path}`);
}

export async function run(opts: RunOptions): Promise<RunOutcome> {
	if ((opts.source ?? resolveContentSource()) === 'fixture') {
		// Defense in depth for callers that bypass the CLI's pre-auth gate.
		resolveContentSource({ ...process.env, EXPORT_FALLBACKS_SOURCE: 'fixture' });
		if (opts.policy === 'fail') throw new Error('Trusted CMS builds refuse fixture exports.');
		const data = await readCache(EXPORT_FIXTURE_PATH);
		if (!data) throw new Error(`Missing export fixture: ${EXPORT_FIXTURE_PATH}`);
		data.mediaAssets = buildMirroredMediaAssets();
		const prepared = await prepareMediaVariants(assetManifest as MediaMirrorManifest);
		data.mediaVariants = prepared.data;
		const configs = buildEmitConfigs(data, opts.emitDir ?? DEFAULT_WEB_CONTENT_DIR);
		if (opts.dryRun) return { source: 'fixture', emitted: 0 };
		await writeMediaVariants(prepared);
		log.info(`fixture media-variants: wrote ${prepared.writes.length} file(s).`);
		return { source: 'fixture', emitted: await emitAll(configs, opts) };
	}
	const policy = resolveFallbackPolicy() === 'fail' ? 'fail' : (opts.policy ?? 'soft');
	log.info(`mode=${opts.dryRun ? 'dry-run' : 'live'} target=${opts.directusUrl} policy=${policy}`);

	let data: ExportData;
	let preparedMediaVariants: PreparedMediaVariants | undefined;
	let dataFromCache = false;
	try {
		const fetched = await fetchAll(opts);
		data = fetched.data;
		preparedMediaVariants = fetched.preparedMediaVariants;
	} catch (fetchErr) {
		const fetchMsg = (fetchErr as Error).message;
		log.warn(`fetch failed: ${fetchMsg}`);
		if (policy === 'fail') {
			log.error(
				`BUILD FAILED (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'}): live CMS export failed and ` +
					'Fallbacks are forbidden on this trusted Vercel target. ' +
					'Verify its target-specific Build Bot token and pinned CMS URL. ' +
					'The prior deploy stays live until this build succeeds.',
			);
			return { source: 'none', emitted: 0 };
		}
		log.warn('attempting cache fallback...');
		const cached = await readCache(cachePath(opts)).catch((err) => {
			log.error(`cache read failed: ${(err as Error).message}`);
			return null;
		});
		if (!cached) {
			log.error('No live content or cache available; export failed without emitting.');
			return { source: 'none', emitted: 0 };
		}
		logFallbackBanner('cache', fetchMsg);
		log.info('cache fallback active: emitting from last-known-good snapshot.');
		data = cached;
		dataFromCache = true;
	}

	if (opts.dryRun) {
		log.info('dry-run complete — skipped emit + cache write');
		return { source: 'live', emitted: 0 };
	}

	const emitDir = opts.emitDir ?? DEFAULT_WEB_CONTENT_DIR;
	if (!dataFromCache) validateLiveExport(data);
	const configs = buildEmitConfigs(data, emitDir);
	if (preparedMediaVariants) {
		await writeMediaVariants(preparedMediaVariants);
		log.info(`media-variants: wrote ${preparedMediaVariants.writes.length} file(s).`);
	}
	const emittedCount = await emitAll(configs, opts);
	if (dataFromCache) {
		log.info('cache: skipped re-write (data sourced from cache).');
	} else {
		await writeCache(data, opts);
	}
	log.info('done.');
	return { source: dataFromCache ? 'cache' : 'live', emitted: emittedCount };
}

async function main(): Promise<void> {
	// Resolve before authentication or argument parsing, including trusted fixture refusal.
	const source = resolveContentSource();
	const { values } = parseArgs({
		args: process.argv.slice(2),
		options: {
			'dry-run': { type: 'boolean', default: false },
			'emit-dir': { type: 'string' },
		},
		allowPositionals: false,
	});

	const dryRun = values['dry-run'] === true;
	const emitDir = typeof values['emit-dir'] === 'string' ? values['emit-dir'] : undefined;

	if (source === 'fixture') {
		await run({ source, directusUrl: 'fixture', token: '', dryRun, emitDir });
		return;
	}

	const url = defaultDirectusUrl();
	const policy = resolveFallbackPolicy();

	// Token resolution: lenient locally, strict on Vercel (live-or-die policy).
	// On Vercel a missing token is an operator error: fail loud so the build
	// surfaces the problem instead of shipping stale content silently.
	// Production uses DIRECTUS_BUILD_TOKEN against cms.yesid.dev. Only the
	// develop Preview uses DIRECTUS_DEV_BUILD_TOKEN against cms.dev.yesid.dev.
	// Default fixture exports return before authentication.
	let token = '';
	if (!dryRun) {
		try {
			token = await getAdminToken(url);
		} catch (authErr) {
			if (policy === 'fail') {
				log.error(
					`BUILD FAILED (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'}): token resolution failed: ` +
						`${(authErr as Error).message}. Fallbacks are forbidden on ` +
						'this trusted Vercel target. Configure only its target-specific Build Bot token.',
				);
				process.exit(1);
			}
			log.warn(`auth failed: ${(authErr as Error).message}`);
			log.warn(
				'continuing without token; will try cache fallback, else fail the export.',
			);
		}
	}

	const outcome = await run({ source, directusUrl: url, token, dryRun, emitDir, policy });
	const exitCode = decideExit(outcome, policy);
	if (exitCode !== 0) process.exit(exitCode);
}

if (import.meta.main) {
	main().catch((err) => {
		log.error('FAILED:', err);
		process.exit(1);
	});
}
