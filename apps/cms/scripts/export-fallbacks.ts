#!/usr/bin/env bun
/**
 * Export Directus CMS state into static TS modules under apps/web/src/lib/content/.
 * Becomes the apps/web `prebuild` step in P6 — output is committed so CMS edits
 * surface as PR diffs and the static adapter has fresh fallback data when
 * Directus is unreachable at runtime.
 *
 * Run:
 *   bun apps/cms/scripts/export-fallbacks.ts                   # full export
 *   bun apps/cms/scripts/export-fallbacks.ts --dry-run         # validate flow, no writes, no network
 *   bun apps/cms/scripts/export-fallbacks.ts --module=services # single module
 *
 * Env:
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
import { fetchSiteMeta } from './lib/fetchers/site-meta';
import { fetchMorphShapes } from './lib/fetchers/morph-shapes';
import { fetchErrorPageFallback } from './lib/fetchers/error-pages';
import { fetchNavData, type NavData } from './lib/fetchers/nav';
import { fetchBlogPosts, fetchBlogBodies } from './lib/fetchers/blog-posts';
import { fetchServices } from './lib/fetchers/services';
import { fetchProjects } from './lib/fetchers/projects';
import { fetchTechStack } from './lib/fetchers/tech-stack';
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
}

const ALL_MODULES = [
	'site-meta',
	'morph-shapes',
	'error-pages',
	'nav',
	'blog-posts',
	'services',
	'projects',
	'tech-stack',
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

async function fetchAll(opts: RunOptions): Promise<ExportData> {
	log.info(`fetch: source=${opts.directusUrl}`);
	if (opts.dryRun) {
		log.info(`  dry-run: would fetch modules: ${ALL_MODULES.join(', ')}`);
		if (opts.module) log.info(`  filtered to: ${opts.module}`);
		return {};
	}

	const client = createClient(opts.directusUrl, opts.token) as unknown as CmsClient;
	const out: ExportData = {};

	if (shouldRun(opts.module, 'site-meta')) {
		log.info('  site-meta...');
		out.siteMeta = await fetchSiteMeta({ client });
		log.info('  site-meta done.');
	}
	if (shouldRun(opts.module, 'morph-shapes')) {
		log.info('  morph-shapes...');
		out.morphShapes = await fetchMorphShapes({ client });
		log.info(`  morph-shapes done (${out.morphShapes.length} rows).`);
	}
	if (shouldRun(opts.module, 'error-pages')) {
		log.info('  error-pages...');
		out.errorPageFallback = await fetchErrorPageFallback({ client });
		log.info('  error-pages done.');
	}
	if (shouldRun(opts.module, 'nav')) {
		log.info('  nav...');
		out.nav = await fetchNavData({ client });
		log.info(`  nav done (${out.nav.navLinks.length} header / ${out.nav.menuItems.length} menu / ${out.nav.footerLinks.length} footer / ${out.nav.mobileLinks.length} mobile).`);
	}
	if (shouldRun(opts.module, 'blog-posts')) {
		log.info('  blog-posts...');
		out.blogPosts = await fetchBlogPosts({ client });
		out.blogBodies = await fetchBlogBodies({ client });
		log.info(
			`  blog-posts done (${out.blogPosts.length} posts, ${Object.keys(out.blogBodies).length} bodies).`,
		);
	}
	if (shouldRun(opts.module, 'services')) {
		log.info('  services...');
		out.services = await fetchServices({ client });
		log.info(`  services done (${out.services.length} services).`);
	}
	if (shouldRun(opts.module, 'projects')) {
		log.info('  projects...');
		out.projects = await fetchProjects({ client });
		log.info(`  projects done (${out.projects.length} projects).`);
	}
	if (shouldRun(opts.module, 'tech-stack')) {
		log.info('  tech-stack...');
		out.techStack = await fetchTechStack({ client });
		log.info(`  tech-stack done (${out.techStack.length} items).`);
	}
	if (shouldRun(opts.module, 'blog-page')) {
		log.info('  blog-page...');
		out.blogPage = await fetchBlogPageContent({ client });
		log.info('  blog-page done.');
	}
	if (shouldRun(opts.module, 'projects-page')) {
		log.info('  projects-page...');
		out.projectsPage = await fetchProjectsPageContent({ client });
		log.info('  projects-page done.');
	}
	if (shouldRun(opts.module, 'tech-stack-page')) {
		log.info('  tech-stack-page...');
		out.techStackPage = await fetchTechStackPageContent({ client });
		log.info('  tech-stack-page done.');
	}
	if (shouldRun(opts.module, 'contact-page')) {
		log.info('  contact-page...');
		out.contactPage = await fetchContactContent({ client });
		log.info('  contact-page done.');
	}
	if (shouldRun(opts.module, 'hero')) {
		log.info('  hero...');
		out.hero = await fetchHeroContent({ client });
		log.info('  hero done.');
	}
	if (shouldRun(opts.module, 'manifesto')) {
		log.info('  manifesto...');
		out.manifesto = await fetchManifestoContent({ client });
		log.info(`  manifesto done (${out.manifesto.pills.length} pills, ${out.manifesto.hiddenTransitLines.length} transit lines).`);
	}
	if (shouldRun(opts.module, 'proof-reel')) {
		log.info('  proof-reel...');
		out.proofReel = await fetchProofReelContent({ client });
		log.info(`  proof-reel done (${out.proofReel.slugs.length} slugs).`);
	}
	if (shouldRun(opts.module, 'services-grid')) {
		log.info('  services-grid...');
		out.servicesGrid = await fetchServicesGridContent({ client });
		log.info('  services-grid done.');
	}
	if (shouldRun(opts.module, 'about-intro')) {
		log.info('  about-intro...');
		out.aboutIntro = await fetchAboutIntroContent({ client });
		log.info(`  about-intro done (${out.aboutIntro.stackItems.length} stack items).`);
	}
	if (shouldRun(opts.module, 'cta')) {
		log.info('  cta...');
		out.cta = await fetchCtaContent({ client });
		log.info('  cta done.');
	}
	if (shouldRun(opts.module, 'closer')) {
		log.info('  closer...');
		out.closer = await fetchCloserContent({ client });
		log.info('  closer done.');
	}
	if (shouldRun(opts.module, 'about-page')) {
		log.info('  about-page...');
		out.aboutPage = await fetchAboutContent({ client });
		log.info(
			`  about-page done (${out.aboutPage.metrics.length} metrics, ${out.aboutPage.methodology.length} steps, ${out.aboutPage.testimonials.length} testimonials, ${out.aboutPage.techStack.length} tech, ${out.aboutPage.clientLogos.length} logos).`,
		);
	}

	return out;
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
	log.info(`mode=${opts.dryRun ? 'dry-run' : 'live'} target=${opts.directusUrl}`);
	if (opts.module) log.info(`scope: --module=${opts.module}`);

	let data: ExportData;
	let dataFromCache = false;
	try {
		data = await fetchAll(opts);
	} catch (fetchErr) {
		log.warn(`fetch failed: ${(fetchErr as Error).message}`);
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

	// Token resolution is lenient — Vercel preview deploys without the secret
	// shouldn't kill the build. Failure here surfaces in run() as a fetch error
	// → cache fallback → if no cache, exit 0 and let the committed .ts files
	// serve as the authoritative source for this build.
	let token = '';
	if (!dryRun) {
		try {
			token = await getAdminToken(url);
		} catch (authErr) {
			log.warn(`auth failed: ${(authErr as Error).message}`);
			log.warn(
				'continuing without token; will try cache fallback, else exit 0 (committed .ts files become authoritative).',
			);
		}
	}

	await run({ directusUrl: url, token, dryRun, module: moduleFilter, emitDir });
}

if (import.meta.main) {
	main().catch((err) => {
		log.error('FAILED:', err);
		process.exit(1);
	});
}
