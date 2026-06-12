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
 *   PUBLIC_DIRECTUS_URL    — Directus URL. Defaults to cms.dev.yesid.dev (P6 flip,
 *                            once dev mirrors prod). Set to https://cms.yesid.dev
 *                            for production builds (Vercel: encrypted env var
 *                            scoped to the Production environment).
 *   DIRECTUS_ADMIN_TOKEN   — preferred auth (or DIRECTUS_ADMIN_EMAIL +
 *                            DIRECTUS_ADMIN_PASSWORD fallback). If absent OR fetch
 *                            fails, the cache layer (P5) tries `.cms-cache.json`
 *                            and degrades gracefully to a no-op (exits 0) if no
 *                            cache is available — committed .ts files become the
 *                            authoritative source for that build.
 *
 * Build-time integration: registered as the apps/web `prebuild` script (P6)
 * so `bun run build` regenerates content before Vite kicks off. Vercel runs
 * `prebuild` automatically — confirmed by Node npm convention which Bun honours.
 */

import { parseArgs } from 'node:util';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { buildEmitConfigs } from './lib/emitters/configs';
import { emitModule } from './lib/emitters/emit-module';
import { readCache, writeCache as persistCache } from './lib/cache';
import type { ExportData } from './export-data';
import { fetchSiteMeta, fetchSiteSeoDefaults } from './lib/fetchers/site-meta';
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
	 * When true (VERCEL_ENV==='production'), fetch failures and missing tokens
	 * exit 1 instead of silently degrading. Vercel keeps the prior deploy
	 * running, so a loud failure here is safe and far preferable to shipping
	 * stale content without any signal.
	 */
	isProd?: boolean;
}

const ALL_MODULES = [
	'site-meta',
	'site-seo-defaults',
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
] as const;
type ModuleName = (typeof ALL_MODULES)[number];

function shouldRun(filter: string | undefined, name: ModuleName): boolean {
	return !filter || filter === name;
}

/** Timeout (ms) for the entire fetchAll operation before falling back to cache. */
const FETCH_ALL_TIMEOUT_MS = 60_000;

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
			log.info(`  proof-reel done (${out.proofReel.slugs.length} slugs).`);
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
				`  about-page done (${out.aboutPage.metrics.length} metrics, ${out.aboutPage.methodology.length} steps, ${out.aboutPage.testimonials.length} testimonials, ${out.aboutPage.techStack.length} tech, ${out.aboutPage.clientLogos.length} logos).`,
			);
		});

		await Promise.all(tasks);
		return out;
	};

	// Top-level stall guard: if the entire fetch hasn't completed within
	// FETCH_ALL_TIMEOUT_MS, reject so the caller falls through to cache.
	const timeoutReject = new Promise<never>((_, reject) =>
		setTimeout(
			() => reject(new Error(`fetchAll timed out after ${FETCH_ALL_TIMEOUT_MS}ms`)),
			FETCH_ALL_TIMEOUT_MS,
		),
	);

	return Promise.race([fetchAllInner(), timeoutReject]);
}

async function emitAll(data: ExportData, opts: RunOptions): Promise<void> {
	const emitDir = opts.emitDir ?? DEFAULT_WEB_CONTENT_DIR;
	log.info(`emit: target=${emitDir}`);

	const configs = buildEmitConfigs(data, emitDir);
	if (configs.length === 0) {
		log.warn('emit: no modules to write (ExportData has no populated slots)');
		return;
	}

	await mkdir(emitDir, { recursive: true });
	for (const cfg of configs) {
		const content = emitModule(cfg);
		await Bun.write(cfg.filePath, content);
		log.info(`  ${relative(emitDir, cfg.filePath)} (${content.length} bytes)`);
	}
	log.info(`emit: wrote ${configs.length} module(s).`);
}

function cachePath(opts: RunOptions): string {
	return resolve(opts.emitDir ?? DEFAULT_WEB_CONTENT_DIR, '.cms-cache.json');
}

async function writeCache(data: ExportData, opts: RunOptions): Promise<void> {
	const path = cachePath(opts);
	await persistCache(path, data, opts.directusUrl);
	log.info(`cache: wrote ${path}`);
}

export async function run(opts: RunOptions): Promise<void> {
	log.info(`mode=${opts.dryRun ? 'dry-run' : 'live'} target=${opts.directusUrl}${opts.isProd ? ' [PRODUCTION]' : ''}`);
	if (opts.module) log.info(`scope: --module=${opts.module}`);

	let data: ExportData;
	let dataFromCache = false;
	try {
		data = await fetchAll(opts);
	} catch (fetchErr) {
		log.warn(`fetch failed: ${(fetchErr as Error).message}`);
		if (opts.isProd) {
			log.error(
				'PRODUCTION BUILD FAILED: fetch failed and no cache can substitute for a prod deploy. ' +
					'Verify DIRECTUS_BUILD_TOKEN is set and the CMS is reachable.',
			);
			process.exit(1);
		}
		log.warn('attempting cache fallback...');
		const cached = await readCache(cachePath(opts)).catch((err) => {
			log.error(`cache read failed: ${(err as Error).message}`);
			return null;
		});
		if (!cached) {
			log.warn(
				'no cache available — exiting 0 without emitting (existing .ts files untouched).',
			);
			return;
		}
		log.info('cache fallback active: emitting from last-known-good snapshot.');
		data = cached;
		dataFromCache = true;
	}

	if (opts.dryRun) {
		log.info('dry-run complete — skipped emit + cache write');
		return;
	}

	await emitAll(data, opts);
	if (dataFromCache) {
		log.info('cache: skipped re-write (data sourced from cache).');
	} else {
		await writeCache(data, opts);
	}
	log.info('done.');
}

async function main(): Promise<void> {
	// Hermetic-build escape hatch (slice-28.4, audit #137): CI builds must not
	// reach out to any live CMS — the committed content modules are already the
	// authoritative source. Checked before ANY token resolution or fetch.
	if (['1', 'true'].includes((process.env.EXPORT_FALLBACKS_SKIP ?? '').toLowerCase())) {
		if (process.env.VERCEL_ENV === 'production') {
			log.warn(
				'EXPORT_FALLBACKS_SKIP is set on a PRODUCTION build — shipping the committed content modules as-is (no CMS refresh).',
			);
		}
		log.info('EXPORT_FALLBACKS_SKIP set — skipping export, committed content modules remain authoritative. Exiting 0.');
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
	const emitDir = typeof values['emit-dir'] === 'string' ? values['emit-dir'] : undefined;
	const url = defaultDirectusUrl();
	const isProd = process.env.VERCEL_ENV === 'production';

	// Token resolution: lenient for local/preview, strict for production.
	// In production, a missing token is an operator error — fail loud so the
	// build surfaces the problem instead of shipping stale content silently.
	// Operator step: set DIRECTUS_BUILD_TOKEN in Vercel (Production env var)
	// using a read-only "Build Bot" token from Directus.
	let token = '';
	if (!dryRun) {
		try {
			token = await getAdminToken(url);
		} catch (authErr) {
			if (isProd) {
				log.error(
					`PRODUCTION BUILD FAILED: token resolution failed — ${(authErr as Error).message}. ` +
						'Set DIRECTUS_BUILD_TOKEN in Vercel Production environment variables.',
				);
				process.exit(1);
			}
			log.warn(`auth failed: ${(authErr as Error).message}`);
			log.warn(
				'continuing without token; will try cache fallback, else exit 0 (committed .ts files become authoritative).',
			);
		}
	}

	await run({ directusUrl: url, token, dryRun, module: moduleFilter, emitDir, isProd });
}

if (import.meta.main) {
	main().catch((err) => {
		log.error('FAILED:', err);
		process.exit(1);
	});
}
