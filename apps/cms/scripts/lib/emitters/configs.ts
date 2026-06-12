/**
 * Per-module emit configs. One entry per generated `.ts` file under
 * apps/web/src/lib/content/.
 *
 * Each config maps an `ExportData` slot (filled by the P3 fetchers) to a
 * concrete output file with header + type imports + export declarations.
 *
 * Files marked "NEW" did not exist in the hand-written content layer; the
 * shape audit (slice-18m P1) introduced them so block_blog_page_content,
 * block_projects_page_content, and morph_shapes have first-class fallback
 * modules instead of being inlined as static.ts fallbacks.
 */

import { resolve } from 'node:path';
import type { ExportData } from '../../export-data';
import type { ModuleEmitConfig } from './emit-module';

/**
 * Builds the emit configs for all generated modules. Skips a config if the
 * required `ExportData` slot is undefined — useful for `--module=<name>`
 * partial runs where only one fetcher populated its slot.
 */
export function buildEmitConfigs(data: ExportData, contentDir: string): readonly ModuleEmitConfig[] {
	const out: ModuleEmitConfig[] = [];

	const path = (file: string) => resolve(contentDir, file);

	if (data.siteMeta) {
		out.push({
			filePath: path('site-meta.ts'),
			description: 'Site-wide brand identity (name, tagline, description, links, owner).',
			imports: [{ symbols: ['SiteMeta'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'siteMeta', typeName: 'SiteMeta', value: data.siteMeta }],
		});
	}

	if (data.siteSeoDefaults) {
		out.push({
			filePath: path('site-seo-defaults.ts'),
			description: 'SEO defaults (defaultOgImage UUID, themeColor, defaultDescription). CMS-driven from site_meta singleton.',
			imports: [{ symbols: ['SiteSeoDefaults'], from: '$lib/types', typeOnly: true }],
			exports: [
				{
					name: 'STATIC_SITE_SEO_DEFAULTS',
					typeName: 'SiteSeoDefaults',
					value: data.siteSeoDefaults,
				},
			],
		});
	}

	if (data.aboutPage) {
		out.push({
			filePath: path('about-page.ts'),
			description: '/about page content (identity, metrics, methodology, testimonials, etc.).',
			imports: [{ symbols: ['AboutContent'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'aboutPageContent', typeName: 'AboutContent', value: data.aboutPage }],
		});
	}

	if (data.contactPage) {
		out.push({
			filePath: path('contact-page.ts'),
			description: '/contact page content (terminals, validation, success states).',
			imports: [{ symbols: ['ContactContent'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'contactContent', typeName: 'ContactContent', value: data.contactPage }],
			reExportFromCompanion: './contact-page.companion',
		});
	}

	// site-content.ts collects all home-page block content under one barrel module.
	// Each export's type is precise so consumers can import them individually.
	const siteContentExports = [
		{ key: 'hero', name: 'heroContent', typeName: 'HeroContent' },
		{ key: 'manifesto', name: 'manifestoContent', typeName: 'ManifestoContent' },
		{ key: 'proofReel', name: 'proofReelContent', typeName: 'ProofReelContent' },
		{ key: 'servicesGrid', name: 'servicesGridContent', typeName: 'ServicesGridContent' },
		{ key: 'aboutIntro', name: 'aboutContent', typeName: 'AboutIntroContent' },
		{ key: 'cta', name: 'ctaContent', typeName: 'CtaContent' },
		{ key: 'closer', name: 'closerContent', typeName: 'CloserContent' },
	] as const;
	const presentSiteContent = siteContentExports.filter((e) => data[e.key as keyof ExportData] !== undefined);
	// slice-18k Phase 8 Codex final fix #1: site-content.ts aggregates 7 home-page
	// blocks. Emitting with partial data (e.g. only data.hero present from a
	// `--module=hero` run) would clobber sibling exports like manifestoContent,
	// proofReelContent, etc. that consumers import. Require ALL slots present
	// before emitting — partial runs leave the file untouched (no-op + warn).
	if (presentSiteContent.length > 0 && presentSiteContent.length < siteContentExports.length) {
		// Partial site-content — skip emit to avoid clobbering siblings.
		// Caller should rerun without --module (or with --module=site-content
		// once we add that grouped mode) to regenerate the full file.
		// eslint-disable-next-line no-console
		console.warn(
			`[buildEmitConfigs] skipping site-content.ts emit: only ${presentSiteContent.length}/${siteContentExports.length} ` +
				`required slots populated (${presentSiteContent.map((e) => e.key).join(', ')}). ` +
				`Run without --module to regenerate the full shared file.`,
		);
	} else if (presentSiteContent.length === siteContentExports.length) {
		// heroAnimContent is destructured from heroContent.heroAnim — emit it as a
		// separate export so the existing import sites (e.g. `import { heroAnimContent }`)
		// keep resolving without changes.
		const heroAnim = data.hero?.heroAnim;
		const heroAnimExports = heroAnim
			? [{ name: 'heroAnimContent', typeName: 'HeroAnimContent', value: heroAnim }]
			: [];
		out.push({
			filePath: path('site-content.ts'),
			description: 'Home-page block content (hero, manifesto, proof reel, services grid, about teaser, CTA, closer).',
			imports: [
				{
					symbols: [
						...new Set([
							...(heroAnim ? ['HeroAnimContent'] : []),
							...presentSiteContent.map((e) => e.typeName),
						]),
					],
					from: '$lib/types',
					typeOnly: true,
				},
			],
			exports: [
				...heroAnimExports,
				...presentSiteContent.map((e) => ({
					name: e.name,
					typeName: e.typeName,
					value: data[e.key as keyof ExportData],
				})),
			],
			reExportFromCompanion: './site-content.companion',
		});
	}

	// slice-18k Phase 8 Codex final fix #1: tech-stack.ts aggregates 2 modules
	// (techStackPage from block_tech_stack_page_content + techStack from
	// tech_stack collection). Partial emit would clobber sibling exports.
	// Require both present before emitting.
	if (data.techStackPage && data.techStack) {
		// slice-18m follow-up (GH #63 + #64): tech-stack.ts emits BOTH the page
		// chrome (techStackPageContent) AND the items array (techStackItems).
		out.push({
			filePath: path('tech-stack.ts'),
			description: '/tech-stack page chrome + tech-stack items array, both CMS-derived.',
			imports: [
				{ symbols: ['TechStackPageContent', 'TechStackItem'], from: '$lib/types', typeOnly: true },
			],
			exports: [
				{
					name: 'techStackPageContent',
					typeName: 'TechStackPageContent',
					value: data.techStackPage,
				},
				{
					name: 'techStackItems',
					typeName: 'readonly TechStackItem[]',
					value: data.techStack,
				},
			],
		});
	} else if (data.techStackPage || data.techStack) {
		// eslint-disable-next-line no-console
		console.warn(
			`[buildEmitConfigs] skipping tech-stack.ts emit: only ` +
				`${data.techStackPage ? 'techStackPage' : 'techStack'} populated (need both). ` +
				`Run without --module to regenerate the full shared file.`,
		);
	}

	if (data.stackArchetypes) {
		out.push({
			filePath: path('stack-archetypes.ts'),
			description:
				'Published stack_archetypes rows (slug, trilingual copy, proof project, service, layered tech links). Feeds the pure client-side Tech Stack Engine on /tech-stack — tech links arrive pre-sorted by (STACK_LAYERS render order, sort) so the blueprint derives its rows from data. NEW in slice-29.',
			imports: [{ symbols: ['StackArchetype'], from: '@repo/shared/schemas', typeOnly: true }],
			exports: [
				{
					name: 'stackArchetypes',
					typeName: 'StackArchetype[]',
					value: data.stackArchetypes,
				},
			],
		});
	}

	if (data.blogPosts) {
		out.push({
			filePath: path('blog.ts'),
			description: 'Blog posts (slugs, titles, excerpts, dates, tags, SVG illustration refs). Helpers + chrome live in blog.companion.ts.',
			imports: [{ symbols: ['BlogPost'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'blogPosts', typeName: 'readonly BlogPost[]', value: data.blogPosts }],
			reExportFromCompanion: './blog.companion',
		});
	}

	if (data.blogBodies) {
		// Block Editor `body` per published post, keyed by slug. Mirrors the
		// blog.html-cache.ts precedent (kept OUT of the $lib/content barrel) so the
		// static adapter can serve blog.bodyBySlug + blog.html without a network
		// round-trip. NEW in slice-27.1 — was previously a hardcoded `null` stub.
		out.push({
			filePath: path('blog-bodies.ts'),
			description: 'Block Editor body per published blog post, keyed by slug. Powers static blog.bodyBySlug + blog.html (serializeBlocksToHtml).',
			imports: [{ symbols: ['BlockEditorDoc'], from: '$lib/types', typeOnly: true }],
			exports: [
				{
					name: 'blogBodies',
					typeName: 'Readonly<Record<string, BlockEditorDoc>>',
					value: data.blogBodies,
				},
			],
		});
	}

	if (data.services) {
		out.push({
			filePath: path('services.ts'),
			description: 'Services array (id, title, station, deliverables, sections, related projects). Chrome + helpers live in services.companion.ts.',
			imports: [{ symbols: ['Service'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'services', typeName: 'readonly Service[]', value: data.services }],
			reExportFromCompanion: './services.companion',
		});
	}

	if (data.projects) {
		// projects.ts in the hand-written code uses RawProject (description + sections
		// as plain LocalizedString); the static adapter calls rawProjectToProject to
		// wrap into BlockEditorDoc at the port boundary. The CMS-derived fetcher already
		// returns full Project shape (description as LocalizedBlockEditorDoc), so we emit
		// against the Project type directly.
		out.push({
			filePath: path('projects.ts'),
			description: 'Projects array (slugs, titles, oneLiners, descriptions, sections, impact metrics, stack, tags, related services). Helpers live in projects.companion.ts.',
			imports: [{ symbols: ['Project'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'projects', typeName: 'readonly Project[]', value: data.projects }],
			reExportFromCompanion: './projects.companion',
		});
	}

	// slice-27.1 FIX A: error-pages.ts emits the full per-statusCode map so the
	// static adapter can mirror directus's _or: [status_code=N, status_code=0]
	// lookup semantics. Keyed by numeric status_code (0 = generic fallback).
	if (data.errorPages) {
		out.push({
			filePath: path('error-pages.ts'),
			description: 'All published error_pages rows keyed by status_code. Powers static content.errorPage(statusCode) per-code lookup.',
			imports: [
				{
					symbols: ['ErrorPageContent'],
					from: './nav.companion',
					typeOnly: true,
				},
			],
			exports: [
				{
					name: 'errorPagesById',
					typeName: 'Readonly<Record<number, ErrorPageContent>>',
					value: data.errorPages,
				},
			],
		});
	}

	// slice-18k Phase 8 Codex final fix #1: nav.ts aggregates nav (navLinks +
	// menuItems) AND errorPageFallback. Partial emit would clobber sibling
	// exports. Require both present before emitting.
	if (data.nav && data.errorPageFallback) {
		out.push({
			filePath: path('nav.ts'),
			description: 'Navigation links (header + menu + footer + mobile placements) + error page fallback. Interfaces, navDirections, sharedChromeContent live in nav.companion.ts.',
			imports: [
				{
					symbols: ['NavLink', 'MenuItem', 'ErrorPageContent'],
					from: './nav.companion',
					typeOnly: true,
				},
			],
			exports: [
				{ name: 'navLinks', typeName: 'readonly NavLink[]', value: data.nav.navLinks },
				{ name: 'menuItems', typeName: 'readonly MenuItem[]', value: data.nav.menuItems },
				{ name: 'footerLinks', typeName: 'readonly NavLink[]', value: data.nav.footerLinks },
				{ name: 'mobileLinks', typeName: 'readonly NavLink[]', value: data.nav.mobileLinks },
				{
					name: 'errorPageContent',
					typeName: 'ErrorPageContent',
					value: data.errorPageFallback,
				},
			],
			reExportFromCompanion: './nav.companion',
		});
	} else if (data.nav || data.errorPageFallback) {
		// eslint-disable-next-line no-console
		console.warn(
			`[buildEmitConfigs] skipping nav.ts emit: only ` +
				`${data.nav ? 'nav' : 'errorPageFallback'} populated (need both). ` +
				`Run without --module to regenerate the full shared file.`,
		);
	}

	if (data.sitePages) {
		out.push({
			filePath: path('site-pages.ts'),
			description:
				'Published site_pages registry rows (path, type, title). PUBLISHED rows only — a path\'s absence IS the hidden signal: the route gate 404s it, the sitemap drops it, and nav links pointing at it disappear (cascade applied in the nav fetcher). NEW in slice-26.1.',
			imports: [{ symbols: ['SitePage'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'sitePages', typeName: 'readonly SitePage[]', value: data.sitePages }],
		});
	}

	if (data.siteLabels) {
		out.push({
			filePath: path('site-labels.ts'),
			description: 'Global UI microcopy (aria labels, card markers, edge titles, email templates) from the site_labels singleton.',
			imports: [{ symbols: ['SiteLabels'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'siteLabels', typeName: 'SiteLabels', value: data.siteLabels }],
		});
	}

	if (data.blogPage) {
		out.push({
			filePath: path('blog-page.ts'),
			description: '/blog page chrome (intro, heading, back-nav labels). NEW in slice-18m — was previously inlined as a static fallback in adapters/static.ts.',
			imports: [{ symbols: ['BlogPageContent'], from: '@repo/shared', typeOnly: true }],
			exports: [{ name: 'blogPageContent', typeName: 'BlogPageContent', value: data.blogPage }],
		});
	}

	if (data.projectsPage) {
		out.push({
			filePath: path('projects-page.ts'),
			description: '/projects page chrome (intro, heading, empty-state). NEW in slice-18m; heading/emptyState added in go2-t1c2.',
			imports: [{ symbols: ['ProjectsPageContent'], from: '@repo/shared', typeOnly: true }],
			exports: [
				{ name: 'projectsPageContent', typeName: 'ProjectsPageContent', value: data.projectsPage },
			],
		});
	}

	if (data.morphShapes) {
		out.push({
			filePath: path('morph-shapes.ts'),
			description: 'Geometric morph-target library (id, label, path, viewbox, sort). NEW in slice-18m — was previously derived from utils/shapes.ts SHAPES const.',
			imports: [{ symbols: ['MorphShape'], from: '$lib/types', typeOnly: true }],
			exports: [
				{ name: 'morphShapes', typeName: 'readonly MorphShape[]', value: data.morphShapes },
			],
		});
	}

	return out;
}
