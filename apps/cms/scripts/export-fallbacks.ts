#!/usr/bin/env bun
/**
 * Export Directus CMS state into static TS modules under apps/web/src/lib/content/.
 * Runs as the apps/web `prebuild` step — output is committed so CMS edits
 * surface as PR diffs. Since slice-27.2 (Directus dropped from the SSR data
 * path) these modules are NOT a fallback: they are the sole runtime content
 * source, regenerated per build. What this script emits is exactly what ships.
 *
 * Run:
 *   bun apps/cms/scripts/export-fallbacks.ts                   # full export
 *   bun apps/cms/scripts/export-fallbacks.ts --dry-run         # validate flow, no writes, no network
 *   bun apps/cms/scripts/export-fallbacks.ts --module=services # single module
 *
 * Env:
 *   EXPORT_FALLBACKS_SKIP  — set to 1 to skip the export entirely (logs + exits
 *                            0 before any network). Used by hermetic CI builds
 *                            (web.yml) where the committed modules already ARE
 *                            the content source and no CMS should be contacted.
 *   EXPORT_FALLBACKS_LIVE  - set to 1 to force a live export on Vercel. With
 *                            VERCEL_ENV set it also means live-or-die: ANY
 *                            fallback (fetch failure, token failure, missing
 *                            cache) exits 1, production and preview alike, so
 *                            the build aborts and the prior deploy stays live.
 *                            Vercel builds without it skip the CMS fetch and
 *                            ship the committed modules (see the skip gate).
 *   PUBLIC_DIRECTUS_URL    — Directus URL. Defaults to cms.dev.yesid.dev (P6 flip,
 *                            once dev mirrors prod). Set to https://cms.yesid.dev
 *                            for production builds (Vercel: encrypted env var
 *                            scoped to the Production environment).
 *   DIRECTUS_ADMIN_TOKEN   — preferred auth (or DIRECTUS_ADMIN_EMAIL +
 *                            DIRECTUS_ADMIN_PASSWORD fallback). If absent OR fetch
 *                            fails: under the live-or-die policy above the build
 *                            exits 1; local (soft-policy) runs try `.cms-cache.json`
 *                            and degrade to a no-op (exit 0) if no cache exists,
 *                            printing an unmissable stderr banner either way
 *                            because the committed .ts files then become the
 *                            authoritative source for that build. The manifest
 *                            records the provenance (source: live|cache) and
 *                            ci:content rejects committing a cache-emitted set.
 *
 * Build-time integration: registered as the apps/web `prebuild` script (P6)
 * so `bun run build` regenerates content before Vite kicks off. Vercel runs
 * `prebuild` automatically — confirmed by Node npm convention which Bun honours.
 */

import { parseArgs } from 'node:util';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { buildEmitConfigs } from './lib/emitters/configs';
import { emitModule } from './lib/emitters/emit-module';
import { readCache, writeCache as persistCache } from './lib/cache';
import {
	GENERATED_MANIFEST_FILENAME,
	hashContent,
	loadManifest,
	writeManifest,
	type ManifestSource,
} from './lib/generated-manifest';
import type { ExportData } from './export-data';
import { fetchSiteMeta, fetchSiteSeoDefaults } from './lib/fetchers/site-meta';
import { fetchRouteSeoOverrides } from './lib/fetchers/route-seo';
import { fetchMorphShapes } from './lib/fetchers/morph-shapes';
import { fetchErrorPageFallback, fetchAllErrorPages } from './lib/fetchers/error-pages';
import { fetchNavData, type NavData } from './lib/fetchers/nav';
import { fetchSitePages } from './lib/fetchers/site-pages';
import { fetchBlogPosts, fetchBlogBodies } from './lib/fetchers/blog-posts';
import { fetchServices } from './lib/fetchers/services';
import { fetchProjects } from './lib/fetchers/projects';
import { fetchTechStack } from './lib/fetchers/tech-stack';
import { fetchStackArchetypes } from './lib/fetchers/stack-archetypes';
import { fetchSiteLabels } from './lib/fetchers/site-labels';
import {
	fetchBlogPageContent,
	fetchProjectsPageContent,
} from './lib/fetchers/page-blocks-simple';
import {
	fetchTechStackPageContent,
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
import { buildMediaVariants } from './lib/media-variants';
import assetIdMap from '../fixtures/assets-id-map.json' with { type: 'json' };
import assetManifest from '../fixtures/assets-manifest.json' with { type: 'json' };

const log = createLogger('export-fallbacks');

// Anchor output paths to the script's own location so cwd doesn't matter.
// Script lives at apps/cms/scripts/export-fallbacks.ts; web content lives at
// apps/web/src/lib/content/. Both work from monorepo root and from apps/cms/.
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_WEB_CONTENT_DIR = resolve(SCRIPT_DIR, '../../web/src/lib/content');

export interface RunOptions {
	directusUrl: string;
	token: string;
	dryRun: boolean;
	module?: string;
	/** Where to write emitted .ts modules. Defaults to apps/web/src/lib/content. */
	emitDir?: string;
	/**
	 * Fallback policy from resolveFallbackPolicy(). Under 'fail' (any Vercel
	 * build with EXPORT_FALLBACKS_LIVE=1, production and preview alike) a fetch
	 * failure skips every fallback and the run reports a non-live outcome,
	 * which main() turns into exit 1. Vercel keeps the prior deploy running,
	 * so a loud failure is safe and far preferable to shipping stale content
	 * without any signal. 'soft' (local, the default) keeps the cache/no-op
	 * degrade, announced by a stderr banner.
	 */
	policy?: FallbackPolicy;
}

// `--module=<name>` filter values. A few emitted FILES are bundled under one
// module name: `blog-posts` emits both blog.ts and blog-bodies.ts, and
// `tech-stack` needs both tech-stack-page + tech-stack data — so there is no
// `--module=blog-bodies`. A partial run merges its emitted hashes into the
// manifest (see emitAll), so unrelated keys are preserved.
export const ALL_MODULES = [
	'site-meta',
	'site-seo-defaults',
	'route-seo',
	'morph-shapes',
	'error-pages',
	'nav',
	'site-pages',
	'blog-posts',
	'services',
	'projects',
	'tech-stack',
	'stack-archetypes',
	'site-labels',
	'blog-page',
	'projects-page',
	'tech-stack-page',
	'contact-page',
	'hero',
	'manifesto',
	'proof-reel',
	'services-grid',
	'about-intro',
	'cta',
	'closer',
	'about-page',
	'media-assets',
	'media-variants',
] as const;
type ModuleName = (typeof ALL_MODULES)[number];

function shouldRun(filter: string | undefined, name: ModuleName): boolean {
	return !filter || filter === name;
}

/**
 * Reject unknown `--module` values loudly. A typo used to filter every module
 * out silently: zero fetches, zero emits, and an EMPTY .cms-cache.json written
 * over the last-known-good cache (audit 2026-07-01, bucket A #6).
 */
export function assertValidModuleFilter(
	name: string | undefined,
): asserts name is ModuleName | undefined {
	if (name !== undefined && !(ALL_MODULES as readonly string[]).includes(name)) {
		throw new Error(
			`unknown --module '${name}'. Valid modules: ${ALL_MODULES.join(', ')}`,
		);
	}
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
	assets: readonly { legacyPath: string }[];
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

	return mirrored;
}

export function buildMirroredMediaAssets(): Readonly<Record<string, string>> {
	return buildMirroredMediaAssetsFromManifest(
		assetManifest as MediaMirrorManifest,
		assetIdMap as Record<string, string>,
	);
}

function envFlag(value: string | undefined): boolean {
	return ['1', 'true'].includes((value ?? '').toLowerCase());
}

export function getExportSkipReason(env: Env = process.env): string | null {
	if (envFlag(env.EXPORT_FALLBACKS_SKIP)) return 'EXPORT_FALLBACKS_SKIP';
	if (env.VERCEL_ENV && !envFlag(env.EXPORT_FALLBACKS_LIVE)) return `VERCEL_ENV=${env.VERCEL_ENV}`;
	return null;
}

export type FallbackPolicy = 'fail' | 'soft';

/**
 * Live-or-die policy (homework audit item 3, pipeline honesty): opting a
 * Vercel target into a live export (EXPORT_FALLBACKS_LIVE=1) also opts it
 * into failing loudly when that live export cannot happen. Production AND the
 * develop-branch preview (dev.yesid.dev, the QA truth surface) both fail;
 * a stale-but-green deploy is worse than a visibly failed build, because
 * Vercel keeps the previous deploy live. Local runs never set VERCEL_ENV,
 * so they keep the soft cache/no-op fallback (announced by a banner).
 * Note the skip gate (getExportSkipReason) runs first: EXPORT_FALLBACKS_SKIP=1
 * remains the deliberate operator escape hatch for shipping committed modules.
 */
export function resolveFallbackPolicy(env: Env = process.env): FallbackPolicy {
	if (env.VERCEL_ENV && envFlag(env.EXPORT_FALLBACKS_LIVE)) return 'fail';
	return 'soft';
}

/** Where the run's emitted content came from; 'none' means nothing was emitted. */
export type ContentSource = 'live' | 'cache' | 'none';

export interface RunOutcome {
	source: ContentSource;
	/** Number of modules written to disk. */
	emitted: number;
}

/**
 * Pure exit-code decision so the policy matrix is unit-testable: under 'fail'
 * any non-live outcome is a build failure; under 'soft' everything exits 0.
 */
export function decideExit(outcome: RunOutcome, policy: FallbackPolicy): number {
	return policy === 'fail' && outcome.source !== 'live' ? 1 : 0;
}

/**
 * Unmissable stderr banner for soft-policy fallbacks. Local builds keep the
 * graceful degrade, but a boxed block on stderr is much harder to scroll past
 * than a single WARN line. Pure line-builder so tests can assert the content.
 */
export function fallbackBannerLines(
	source: 'cache' | 'committed-modules',
	fetchError: string,
): string[] {
	const detail =
		source === 'cache'
			? 'emitting from .cms-cache.json (last-known-good snapshot), NOT the live CMS'
			: 'nothing emitted; the committed .ts modules ship as-is and may be stale vs the CMS';
	return [
		'!!==================================================================!!',
		'!!  CONTENT FALLBACK IN USE: BUILD IS NOT LIVE CMS CONTENT           ',
		`!!  source: ${source}`,
		`!!  ${detail}`,
		`!!  fetch error: ${fetchError}`,
		'!!  Fix CMS connectivity and re-run export:fallbacks before          ',
		'!!  trusting or committing this build output.                        ',
		'!!==================================================================!!',
	];
}

function logFallbackBanner(source: 'cache' | 'committed-modules', fetchError: string): void {
	for (const line of fallbackBannerLines(source, fetchError)) console.error(line);
}

async function fetchAll(opts: RunOptions): Promise<ExportData> {
	log.info(`fetch: source=${opts.directusUrl}`);
	if (opts.dryRun) {
		log.info(`  dry-run: would fetch modules: ${ALL_MODULES.join(', ')}`);
		if (opts.module) log.info(`  filtered to: ${opts.module}`);
		return {};
	}

	const fetchAllInner = async (): Promise<ExportData> => {
		const client = createClient(opts.directusUrl, opts.token) as unknown as CmsClient;
		const out: ExportData = {};
		if (shouldRun(opts.module, 'media-assets')) {
			out.mediaAssets = buildMirroredMediaAssets();
		}

		// Each task is [moduleName, async () => void that assigns to out.*].
		// Only enqueue if shouldRun passes; then fan-out in parallel.
		// The Bottleneck limiter inside createQueuedFetch() keeps actual
		// in-flight HTTP requests ≤ 4 concurrent / ≤ 50 req/s.
		const tasks: Array<Promise<void>> = [];

		const enqueue = (name: ModuleName, task: () => Promise<void>) => {
			if (shouldRun(opts.module, name)) {
				log.info(`  ${name}...`);
				tasks.push(task());
			}
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
		enqueue('tech-stack', async () => {
			out.techStack = await fetchTechStack({ client });
			log.info(`  tech-stack done (${out.techStack.length} items).`);
		});
		enqueue('stack-archetypes', async () => {
			out.stackArchetypes = await fetchStackArchetypes({ client });
			log.info(`  stack-archetypes done (${out.stackArchetypes.length} archetypes).`);
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
		enqueue('tech-stack-page', async () => {
			out.techStackPage = await fetchTechStackPageContent({ client });
			log.info('  tech-stack-page done.');
		});
		enqueue('contact-page', async () => {
			out.contactPage = await fetchContactContent({ client });
			log.info('  contact-page done.');
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

	// media-variants runs OUTSIDE the network-timeout race: it is local-only
	// (reads mirrored files on disk, writes webp variants next to them) and
	// sharp encode time must not eat into the CMS fetch budget.
	if (shouldRun(opts.module, 'media-variants')) {
		out.mediaVariants = await buildMediaVariants(assetManifest as MediaMirrorManifest);
		log.info(
			`  media-variants done (${Object.keys(out.mediaVariants).length} raster assets).`,
		);
	}

	return out;
}

/** Emits every populated module; returns the number of modules written so the
 *  caller can skip the cache write when nothing was emitted. `source` records
 *  the data's provenance in the manifest so ci:content can reject committing
 *  a cache-emitted set. */
async function emitAll(
	data: ExportData,
	opts: RunOptions,
	source: ManifestSource,
): Promise<number> {
	const emitDir = opts.emitDir ?? DEFAULT_WEB_CONTENT_DIR;
	log.info(`emit: target=${emitDir}`);

	const configs = buildEmitConfigs(data, emitDir);
	if (configs.length === 0) {
		log.warn('emit: no modules to write (ExportData has no populated slots)');
		return 0;
	}

	await mkdir(emitDir, { recursive: true });
	const emittedHashes: Record<string, string> = {};
	for (const cfg of configs) {
		const content = emitModule(cfg);
		await Bun.write(cfg.filePath, content);
		emittedHashes[relative(emitDir, cfg.filePath)] = hashContent(content);
		log.info(`  ${relative(emitDir, cfg.filePath)} (${content.length} bytes)`);
	}
	log.info(`emit: wrote ${configs.length} module(s).`);

	// Record the SHA-256 of every emitted module so the pre-commit guard can
	// detect hand-edits (the CMS is the source of truth; these files are cache).
	// A `--module=<name>` partial run merges into the existing manifest so it
	// never drops the hashes of modules it didn't re-emit; a full run replaces.
	// Provenance is sticky on partial runs: a live --module run over a
	// cache-emitted manifest still leaves the other modules cache-sourced, so
	// only a full live export clears 'cache'.
	const prior = opts.module ? await loadManifest(emitDir) : null;
	const manifestFiles = opts.module ? { ...(prior?.files ?? {}), ...emittedHashes } : emittedHashes;
	const manifestSource: ManifestSource =
		source === 'cache' || prior?.source === 'cache' ? 'cache' : 'live';
	await writeManifest(emitDir, manifestFiles, manifestSource);
	log.info(`emit: updated ${GENERATED_MANIFEST_FILENAME} (${Object.keys(manifestFiles).length} entries).`);
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
	const policy = opts.policy ?? 'soft';
	log.info(`mode=${opts.dryRun ? 'dry-run' : 'live'} target=${opts.directusUrl} policy=${policy}`);
	if (opts.module) log.info(`scope: --module=${opts.module}`);

	let data: ExportData;
	let dataFromCache = false;
	try {
		data = await fetchAll(opts);
	} catch (fetchErr) {
		const fetchMsg = (fetchErr as Error).message;
		log.warn(`fetch failed: ${fetchMsg}`);
		if (policy === 'fail') {
			log.error(
				`BUILD FAILED (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'}): live CMS export failed and ` +
					'EXPORT_FALLBACKS_LIVE=1 forbids fallbacks on Vercel (live-or-die), preview and production alike. ' +
					'Verify DIRECTUS_BUILD_TOKEN is set on this Vercel target and the CMS is reachable. ' +
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
			logFallbackBanner('committed-modules', fetchMsg);
			log.warn(
				'no cache available: exiting 0 without emitting (existing .ts files untouched).',
			);
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

	const emittedCount = await emitAll(data, opts, dataFromCache ? 'cache' : 'live');
	if (dataFromCache) {
		log.info('cache: skipped re-write (data sourced from cache).');
	} else if (emittedCount === 0) {
		log.warn(
			'cache: skipped write: zero modules emitted; an empty cache would poison the fallback path.',
		);
	} else {
		await writeCache(data, opts);
	}
	log.info('done.');
	return { source: dataFromCache ? 'cache' : 'live', emitted: emittedCount };
}

async function main(): Promise<void> {
	// Hermetic-build escape hatch (slice-28.4, audit #137): CI and Vercel builds
	// must not reach out to any live CMS. The committed content modules are
	// already the authoritative source. Checked before ANY token resolution.
	const skipReason = getExportSkipReason();
	if (skipReason) {
		if (process.env.VERCEL_ENV === 'production') {
			log.warn(
				`${skipReason} on a production build: shipping committed content modules as-is, no CMS refresh.`,
			);
		}
		log.info(`${skipReason}: skipping export, committed content modules remain authoritative. Exiting 0.`);
		return;
	}

	const { values } = parseArgs({
		args: process.argv.slice(2),
		options: {
			'dry-run': { type: 'boolean', default: false },
			module: { type: 'string' },
			'emit-dir': { type: 'string' },
		},
		allowPositionals: false,
	});

	const dryRun = values['dry-run'] === true;
	const moduleFilter = typeof values.module === 'string' ? values.module : undefined;
	assertValidModuleFilter(moduleFilter);
	const emitDir = typeof values['emit-dir'] === 'string' ? values['emit-dir'] : undefined;
	const url = defaultDirectusUrl();
	const policy = resolveFallbackPolicy();

	// Token resolution: lenient locally, strict on Vercel (live-or-die policy).
	// On Vercel a missing token is an operator error: fail loud so the build
	// surfaces the problem instead of shipping stale content silently.
	// Operator step: set DIRECTUS_BUILD_TOKEN in Vercel (Preview + Production
	// env var) using a read-only "Build Bot" token from Directus.
	let token = '';
	if (!dryRun) {
		try {
			token = await getAdminToken(url);
		} catch (authErr) {
			if (policy === 'fail') {
				log.error(
					`BUILD FAILED (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'}): token resolution failed: ` +
						`${(authErr as Error).message}. EXPORT_FALLBACKS_LIVE=1 forbids fallbacks on Vercel ` +
						'(live-or-die), preview and production alike. Set DIRECTUS_BUILD_TOKEN on this Vercel target.',
				);
				process.exit(1);
			}
			log.warn(`auth failed: ${(authErr as Error).message}`);
			log.warn(
				'continuing without token; will try cache fallback, else exit 0 (committed .ts files become authoritative).',
			);
		}
	}

	const outcome = await run({ directusUrl: url, token, dryRun, module: moduleFilter, emitDir, policy });
	const exitCode = decideExit(outcome, policy);
	if (exitCode !== 0) process.exit(exitCode);
}

if (import.meta.main) {
	main().catch((err) => {
		log.error('FAILED:', err);
		process.exit(1);
	});
}
