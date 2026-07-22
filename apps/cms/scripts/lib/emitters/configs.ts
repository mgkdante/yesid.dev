import { resolve } from 'node:path';
import type { ExportData } from '../../export-data';
import type {
	ExportDecl,
	ImportDecl,
	ModuleEmitConfig,
} from './emit-module';

type CompleteExportData = Required<ExportData>;
type DataKey = keyof ExportData;

interface ExportModuleDefinition {
	fileName: `${string}.ts`;
	requires: readonly DataKey[];
	description: string;
	imports: readonly ImportDecl[] | ((data: CompleteExportData) => readonly ImportDecl[]);
	exports: (data: CompleteExportData) => readonly ExportDecl[];
}

const typeImport = (from: string, ...symbols: string[]): ImportDecl => ({
	symbols,
	from,
	typeOnly: true,
});

const declaration = (name: string, typeName: string, value: unknown): ExportDecl => ({
	name,
	typeName,
	value,
});

const defineModule = (
	fileName: ExportModuleDefinition['fileName'],
	requires: readonly DataKey[],
	description: string,
	imports: ExportModuleDefinition['imports'],
	exports: ExportModuleDefinition['exports'],
): ExportModuleDefinition => ({ fileName, requires, description, imports, exports });

const HOME_EXPORTS = [
	['hero', 'heroContent', 'HeroContent'],
	['manifesto', 'manifestoContent', 'ManifestoContent'],
	['proofReel', 'proofReelContent', 'ProofReelContent'],
	['servicesGrid', 'servicesGridContent', 'ServicesGridContent'],
	['aboutIntro', 'aboutContent', 'AboutIntroContent'],
	['cta', 'ctaContent', 'CtaContent'],
	['closer', 'closerContent', 'CloserContent'],
] as const satisfies readonly [DataKey, string, string][];

/** The single typed owner of every CMS-generated content module. */
export const EXPORT_MODULE_REGISTRY = [
	defineModule(
		'site-meta.ts',
		['siteMeta'],
		'Site-wide brand identity (name, tagline, description, links, owner).',
		[typeImport('$lib/types', 'SiteMeta')],
		(data) => [declaration('siteMeta', 'SiteMeta', data.siteMeta)],
	),
	defineModule(
		'site-seo-defaults.ts',
		['siteSeoDefaults'],
		'SEO defaults (defaultOgImage UUID, themeColor, defaultDescription). CMS-driven from site_meta singleton.',
		[typeImport('$lib/types', 'SiteSeoDefaults')],
		(data) => [
			declaration('STATIC_SITE_SEO_DEFAULTS', 'SiteSeoDefaults', data.siteSeoDefaults),
		],
	),
	defineModule(
		'route-seo.ts',
		['routeSeo'],
		'Published route_seo overrides for static route title, description, and OG image.',
		[typeImport('$lib/types', 'RouteSeoOverride')],
		(data) => [
			declaration('routeSeoOverrides', 'readonly RouteSeoOverride[]', data.routeSeo),
		],
	),
	defineModule(
		'media-assets.ts',
		['mediaAssets'],
		'Directus media UUID to mirrored static asset path map. Generated from the CMS asset manifest.',
		[],
		(data) => [
			declaration(
				'mirroredMediaAssets',
				'Readonly<Record<string, string>>',
				data.mediaAssets,
			),
		],
	),
	defineModule(
		'media-variants.ts',
		['mediaVariants'],
		'Responsive webp variants of the mirrored raster assets, keyed by original static path (intrinsic width/height + ascending-width variant set). Generated with the variant files themselves by lib/media-variants.ts; the web asset helper composes srcset/width/height from this map.',
		[typeImport('$lib/types', 'MediaVariantEntry')],
		(data) => [
			declaration(
				'mediaVariants',
				'Readonly<Record<string, MediaVariantEntry>>',
				data.mediaVariants,
			),
		],
	),
	defineModule(
		'about-page.ts',
		['aboutPage'],
		'/about page content (identity, metrics, methodology, testimonials, etc.).',
		[typeImport('$lib/types', 'AboutContent')],
		(data) => [declaration('aboutPageContent', 'AboutContent', data.aboutPage)],
	),
	defineModule(
		'contact-page.ts',
		['contactPage'],
		'/contact page content (terminals, validation, success states).',
		[typeImport('$lib/types', 'ContactContent')],
		(data) => [declaration('contactContent', 'ContactContent', data.contactPage)],
	),
	defineModule(
		'site-content.ts',
		HOME_EXPORTS.map(([key]) => key),
		'Home-page block content (hero, manifesto, proof reel, services grid, about teaser, CTA, closer).',
		(data) => [
			typeImport(
				'$lib/types',
				...new Set([
					...(data.hero.heroAnim ? ['HeroAnimContent'] : []),
					...HOME_EXPORTS.map(([, , typeName]) => typeName),
				]),
			),
		],
		(data) => {
			const heroAnim = data.hero.heroAnim;
			return [
				...(heroAnim
					? [declaration('heroAnimContent', 'HeroAnimContent', heroAnim)]
					: []),
				...HOME_EXPORTS.map(([key, name, typeName]) =>
					declaration(name, typeName, data[key]),
				),
			];
		},
	),
	defineModule(
		'tech-stack.ts',
		['techStackPage', 'techStack'],
		'/tech-stack page chrome + tech-stack items array, both CMS-derived.',
		[typeImport('$lib/types', 'TechStackPageContent', 'TechStackItem')],
		(data) => [
			declaration(
				'techStackPageContent',
				'TechStackPageContent',
				data.techStackPage,
			),
			declaration('techStackItems', 'readonly TechStackItem[]', data.techStack),
		],
	),
	defineModule(
		'stack-archetypes.ts',
		['stackArchetypes'],
		'Published stack_archetypes rows (slug, trilingual copy, proof project, service, layered tech links). Feeds the pure client-side Tech Stack Engine on /tech-stack — tech links arrive pre-sorted by (STACK_LAYERS render order, sort) so the blueprint derives its rows from data. NEW in slice-29.',
		[typeImport('@repo/shared/schemas', 'StackArchetype')],
		(data) => [
			declaration('stackArchetypes', 'StackArchetype[]', data.stackArchetypes),
		],
	),
	defineModule(
		'blog.ts',
		['blogPosts'],
		'Blog posts (slugs, titles, excerpts, dates, tags, SVG illustration refs).',
		[typeImport('$lib/types', 'BlogPost')],
		(data) => [declaration('blogPosts', 'readonly BlogPost[]', data.blogPosts)],
	),
	defineModule(
		'legal-pages.ts',
		['legalPages'],
		'Legal pages (OPS1): slug, title, per-locale Block Editor body for /legal/[slug].',
		[typeImport('$lib/types', 'LegalPage')],
		(data) => [declaration('legalPages', 'readonly LegalPage[]', data.legalPages)],
	),
	defineModule(
		'blog-bodies.ts',
		['blogBodies'],
		'Block Editor body per published blog post, keyed by slug. Powers static blog.bodyBySlug + blog.html (serializeBlocksToHtml).',
		[typeImport('$lib/types', 'BlockEditorDoc')],
		(data) => [
			declaration(
				'blogBodies',
				'Readonly<Record<string, BlockEditorDoc>>',
				data.blogBodies,
			),
		],
	),
	defineModule(
		'services.ts',
		['services'],
		'Services array (id, title, station, deliverables, sections, related projects).',
		[typeImport('$lib/types', 'Service')],
		(data) => [declaration('services', 'readonly Service[]', data.services)],
	),
	defineModule(
		'projects.ts',
		['projects'],
		'Projects array (slugs, titles, oneLiners, descriptions, sections, impact metrics, stack, tags, related services).',
		[typeImport('$lib/types', 'Project')],
		(data) => [declaration('projects', 'readonly Project[]', data.projects)],
	),
	defineModule(
		'error-pages.ts',
		['errorPages'],
		'All published error_pages rows keyed by status_code. Powers static content.errorPage(statusCode) per-code lookup.',
		[typeImport('$lib/navigation/types', 'ErrorPageContent')],
		(data) => [
			declaration(
				'errorPagesById',
				'Readonly<Record<number, ErrorPageContent>>',
				data.errorPages,
			),
		],
	),
	defineModule(
		'nav.ts',
		['nav', 'errorPageFallback'],
		'Navigation links (header + menu + footer + mobile placements) + error page fallback.',
		[
			typeImport(
				'$lib/navigation/types',
				'NavLink',
				'MenuItem',
				'ErrorPageContent',
			),
		],
		(data) => [
			declaration('navLinks', 'readonly NavLink[]', data.nav.navLinks),
			declaration('menuItems', 'readonly MenuItem[]', data.nav.menuItems),
			declaration('footerLinks', 'readonly NavLink[]', data.nav.footerLinks),
			declaration('mobileLinks', 'readonly NavLink[]', data.nav.mobileLinks),
			declaration('errorPageContent', 'ErrorPageContent', data.errorPageFallback),
		],
	),
	defineModule(
		'site-pages.ts',
		['sitePages'],
		"Published site_pages registry rows (path, type, title). PUBLISHED rows only — a path's absence IS the hidden signal: the route gate 404s it, the sitemap drops it, and nav links pointing at it disappear (cascade applied in the nav fetcher). NEW in slice-26.1.",
		[typeImport('$lib/types', 'SitePage')],
		(data) => [declaration('sitePages', 'readonly SitePage[]', data.sitePages)],
	),
	defineModule(
		'site-labels.ts',
		['siteLabels'],
		'Global UI microcopy (aria labels, card markers, edge titles, email templates) from the site_labels singleton. slice-30 t1: also carries the code-owned chrome groups (projectsChrome/blogChrome/servicesChrome/navChrome/footerChrome/heroDashboard) recomposed from the companion-shaped flat columns, so a future regen sources the companion/hero-data labels straight from Directus.',
		[typeImport('$lib/types', 'SiteLabels')],
		(data) => [declaration('siteLabels', 'SiteLabels', data.siteLabels)],
	),
	defineModule(
		'blog-page.ts',
		['blogPage'],
		'/blog page chrome (intro, heading, back-nav labels). NEW in slice-18m — was previously inlined as a static fallback in adapters/static.ts.',
		[typeImport('@repo/shared', 'BlogPageContent')],
		(data) => [declaration('blogPageContent', 'BlogPageContent', data.blogPage)],
	),
	defineModule(
		'projects-page.ts',
		['projectsPage'],
		'/projects page chrome (intro, heading, empty-state). NEW in slice-18m; heading/emptyState added in go2-t1c2.',
		[typeImport('@repo/shared', 'ProjectsPageContent')],
		(data) => [
			declaration(
				'projectsPageContent',
				'ProjectsPageContent',
				data.projectsPage,
			),
		],
	),
	defineModule(
		'morph-shapes.ts',
		['morphShapes'],
		'Geometric morph-target library (id, label, path, viewbox, sort). NEW in slice-18m — was previously derived from utils/shapes.ts SHAPES const.',
		[typeImport('$lib/types', 'MorphShape')],
		(data) => [
			declaration('morphShapes', 'readonly MorphShape[]', data.morphShapes),
		],
	),
] as const satisfies readonly ExportModuleDefinition[];

const REQUIRED_DATA_KEYS = [
	...new Set(EXPORT_MODULE_REGISTRY.flatMap(({ requires }) => requires)),
];

function requireCompleteData(data: ExportData): asserts data is CompleteExportData {
	const missing = REQUIRED_DATA_KEYS.filter((key) => data[key] === undefined);
	if (missing.length > 0) {
		throw new Error(`incomplete CMS export data; missing: ${missing.join(', ')}`);
	}
}

/** Validates one complete snapshot before deriving any file write configs. */
export function buildEmitConfigs(
	data: ExportData,
	contentDir: string,
): readonly ModuleEmitConfig[] {
	requireCompleteData(data);
	return EXPORT_MODULE_REGISTRY.map((definition) => {
		return {
			filePath: resolve(contentDir, definition.fileName),
			description: definition.description,
			imports:
				typeof definition.imports === 'function'
					? definition.imports(data)
					: definition.imports,
			exports: definition.exports(data),
		};
	});
}
