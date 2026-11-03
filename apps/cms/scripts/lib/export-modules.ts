import { z } from 'zod';
import * as schemas from '@repo/shared/schemas';
import { BlockEditorDocSchema, type SiteMeta } from '@repo/shared';
import type { FetcherContext } from './fetchers/types';
import type { ExportDecl, ImportDecl } from './emitters/emit-module';
import {
	checkProjects,
	checkServices,
	checkBlog,
	checkSitePages,
	checkSiteMeta,
	type Relations,
} from './validators/integrity';
import { fetchSiteMeta, fetchSiteSeoDefaults } from './fetchers/site-meta';
import { fetchRouteSeoOverrides } from './fetchers/route-seo';
import { fetchMorphShapes } from './fetchers/morph-shapes';
import {
	fetchErrorPageFallback,
	fetchAllErrorPages,
} from './fetchers/error-pages';
import { fetchNavData } from './fetchers/nav';
import { fetchSitePages } from './fetchers/site-pages';
import { fetchLegalPages } from './fetchers/legal-pages';
import { fetchBlog } from './fetchers/blog-posts';
import { fetchServices } from './fetchers/services';
import { fetchProjects } from './fetchers/projects';
import { fetchSiteLabels } from './fetchers/site-labels';
import {
	fetchBlogPageContent,
	fetchProjectsPageContent,
} from './fetchers/page-blocks-simple';
import { fetchContactContent } from './fetchers/page-blocks-medium';
import {
	fetchHeroContent,
	fetchManifestoContent,
	fetchProofReelContent,
	fetchServicesGridContent,
	fetchAboutIntroContent,
	fetchCtaContent,
	fetchCloserContent,
} from './fetchers/page-blocks-home';
import { fetchAboutContent } from './fetchers/page-blocks-about';
export interface LiveExportContext extends FetcherContext {
	mediaAssets: () => Readonly<Record<string, string>>;
	mediaVariants: () => Promise<
		Readonly<Record<string, import('@repo/shared').MediaVariantEntry>>
	>;
}
export interface ExportModuleOutput {
	fileName: `${string}.ts`;
	description: string;
	imports: readonly ImportDecl[];
	exports: readonly ExportDecl[];
}
function defineModule<S extends z.ZodRawShape>(
	name: string,
	schema: z.ZodObject<S>,
	fetch: (context: LiveExportContext) => Promise<z.output<z.ZodObject<S>>>,
	emit: (data: z.output<z.ZodObject<S>>) => readonly ExportModuleOutput[],
	check?: (data: z.output<z.ZodObject<S>>, relations: Relations) => void,
	fetchKind: 'network' | 'local' = 'network',
) {
	return { name, schema, fetch, emit, check, fetchKind };
}
const typeImport = (from: string, ...symbols: string[]): ImportDecl => ({
	symbols,
	from,
	typeOnly: true,
});
const declaration = (
	name: string,
	typeName: string,
	value: unknown,
): ExportDecl => ({ name, typeName, value });
/** The owner phone is published only as the JSON-LD telephone. */
export function withoutOwnerPhone(siteMeta: SiteMeta): SiteMeta {
	if (!siteMeta.owner?.phone) return siteMeta;
	const { phone: _phone, ...owner } = siteMeta.owner;
	return { ...siteMeta, owner };
}
const HOME_EXPORTS = [
	['hero', 'heroContent', 'HeroContent'],
	['manifesto', 'manifestoContent', 'ManifestoContent'],
	['proofReel', 'proofReelContent', 'ProofReelContent'],
	['servicesGrid', 'servicesGridContent', 'ServicesGridContent'],
	['aboutIntro', 'aboutContent', 'AboutIntroContent'],
	['cta', 'ctaContent', 'CtaContent'],
	['closer', 'closerContent', 'CloserContent'],
] as const;
/** Fetch, schema, cross-entity checks and outputs have one owner per module. */
export const EXPORT_MODULES = [
	defineModule(
		'site-meta',
		z.object({ siteMeta: schemas.SiteMetaSchema }),
		async (context) => ({ siteMeta: await fetchSiteMeta(context) }),
		(data) => [
			{
				fileName: 'site-meta.ts',
				description:
					'Site-wide brand identity (name, tagline, description, links, owner), without the owner phone.',
				imports: [typeImport('#lib/types.ts', 'SiteMeta')],
				exports: [
					declaration('siteMeta', 'SiteMeta', withoutOwnerPhone(data.siteMeta)),
				],
			},
			{
				fileName: 'site-owner-phone.server.ts',
				description:
					'Owner phone for the JSON-LD telephone only. Server-only, so page data and browser code cannot import it.',
				imports: [],
				exports: [
					declaration(
						'ownerPhone',
						'string | null',
						data.siteMeta.owner?.phone ?? null,
					),
				],
			},
		],
		checkSiteMeta,
	),
	defineModule(
		'site-seo-defaults',
		z.object({ siteSeoDefaults: schemas.SiteSeoDefaultsSchema }),
		async (context) => ({
			siteSeoDefaults: await fetchSiteSeoDefaults(context),
		}),
		(data) => [
			{
				fileName: 'site-seo-defaults.ts',
				description:
					'SEO defaults (defaultOgImage UUID, themeColor, defaultDescription). CMS-driven from site_meta singleton.',
				imports: [typeImport('#lib/types.ts', 'SiteSeoDefaults')],
				exports: [
					declaration(
						'STATIC_SITE_SEO_DEFAULTS',
						'SiteSeoDefaults',
						data.siteSeoDefaults,
					),
				],
			},
		],
	),
	defineModule(
		'route-seo',
		z.object({ routeSeo: z.array(schemas.RouteSeoOverrideSchema).readonly() }),
		async (context) => ({ routeSeo: await fetchRouteSeoOverrides(context) }),
		(data) => [
			{
				fileName: 'route-seo.ts',
				description:
					'Published route_seo overrides for static route title, description, and OG image.',
				imports: [typeImport('#lib/types.ts', 'RouteSeoOverride')],
				exports: [
					declaration(
						'routeSeoOverrides',
						'readonly RouteSeoOverride[]',
						data.routeSeo,
					),
				],
			},
		],
	),
	defineModule(
		'media-assets',
		z.object({ mediaAssets: z.record(z.string(), z.string()) }),
		async (context) => ({ mediaAssets: context.mediaAssets() }),
		(data) => [
			{
				fileName: 'media-assets.ts',
				description:
					'Directus media UUID to mirrored static asset path map. Generated from the CMS asset manifest.',
				imports: [],
				exports: [
					declaration(
						'mirroredMediaAssets',
						'Readonly<Record<string, string>>',
						data.mediaAssets,
					),
				],
			},
		],
		undefined,
		'local',
	),
	defineModule(
		'media-variants',
		z.object({
			mediaVariants: z.record(
				z.string(),
				z.object({
					width: z.number().positive(),
					height: z.number().positive(),
					variants: z
						.array(
							z.object({
								width: z.number().positive(),
								path: z.string().min(1),
							}),
						)
						.readonly(),
				}),
			),
		}),
		async (context) => ({ mediaVariants: await context.mediaVariants() }),
		(data) => [
			{
				fileName: 'media-variants.ts',
				description:
					'Responsive webp variants of the mirrored raster assets, keyed by original static path (intrinsic width/height + ascending-width variant set). Generated with the variant files themselves by lib/media-variants.ts; the web asset helper composes srcset/width/height from this map.',
				imports: [typeImport('#lib/types.ts', 'MediaVariantEntry')],
				exports: [
					declaration(
						'mediaVariants',
						'Readonly<Record<string, MediaVariantEntry>>',
						data.mediaVariants,
					),
				],
			},
		],
		undefined,
		'local',
	),
	defineModule(
		'about-page',
		z.object({ aboutPage: schemas.AboutContentSchema }),
		async (context) => ({ aboutPage: await fetchAboutContent(context) }),
		(data) => [
			{
				fileName: 'about-page.ts',
				description:
					'/about page content (identity, metrics, methodology, testimonials, etc.).',
				imports: [typeImport('#lib/types.ts', 'AboutContent')],
				exports: [
					declaration('aboutPageContent', 'AboutContent', data.aboutPage),
				],
			},
		],
	),
	defineModule(
		'contact-page',
		z.object({ contactPage: schemas.ContactContentSchema }),
		async (context) => ({ contactPage: await fetchContactContent(context) }),
		(data) => [
			{
				fileName: 'contact-page.ts',
				description:
					'/contact page content (terminals, validation, success states).',
				imports: [typeImport('#lib/types.ts', 'ContactContent')],
				exports: [
					declaration('contactContent', 'ContactContent', data.contactPage),
				],
			},
		],
	),
	defineModule(
		'site-content',
		z.object({
			hero: schemas.HeroContentSchema,
			manifesto: schemas.ManifestoContentSchema,
			proofReel: schemas.ProofReelContentSchema,
			servicesGrid: schemas.ServicesGridContentSchema,
			aboutIntro: schemas.AboutIntroContentSchema,
			cta: schemas.CtaContentSchema,
			closer: schemas.CloserContentSchema,
		}),
		async (context) => {
			const [
				hero,
				manifesto,
				proofReel,
				servicesGrid,
				aboutIntro,
				cta,
				closer,
			] = await Promise.all([
				fetchHeroContent(context),
				fetchManifestoContent(context),
				fetchProofReelContent(context),
				fetchServicesGridContent(context),
				fetchAboutIntroContent(context),
				fetchCtaContent(context),
				fetchCloserContent(context),
			]);
			return {
				hero,
				manifesto,
				proofReel,
				servicesGrid,
				aboutIntro,
				cta,
				closer,
			};
		},
		(data) => [
			{
				fileName: 'site-content.ts',
				description:
					'Home-page block content (hero, manifesto, proof reel, services grid, about teaser, CTA, closer).',
				imports: [
					typeImport(
						'#lib/types.ts',
						...new Set([
							...(data.hero.heroAnim ? ['HeroAnimContent'] : []),
							...HOME_EXPORTS.map(([, , typeName]) => typeName),
						]),
					),
				],
				exports: (() => {
					const heroAnim = data.hero.heroAnim;
					return [
						...(heroAnim
							? [declaration('heroAnimContent', 'HeroAnimContent', heroAnim)]
							: []),
						...HOME_EXPORTS.map(([key, name, typeName]) =>
							declaration(name, typeName, data[key]),
						),
					];
				})(),
			},
		],
	),
	defineModule(
		'blog',
		z.object({
			blogPosts: z.array(schemas.BlogPostSchema).readonly(),
			blogBodies: z.record(z.string(), BlockEditorDocSchema),
		}),
		async (context) => {
			const { posts, bodies } = await fetchBlog(context);
			return { blogPosts: posts, blogBodies: bodies };
		},
		(data) => [
			{
				fileName: 'blog.ts',
				description:
					'Blog posts (slugs, titles, excerpts, dates, tags, SVG illustration refs).',
				imports: [typeImport('#lib/types.ts', 'BlogPost')],
				exports: [
					declaration('blogPosts', 'readonly BlogPost[]', data.blogPosts),
				],
			},
			{
				fileName: 'blog-bodies.ts',
				description:
					'Block Editor body per published blog post, keyed by slug. Powers static blog.bodyBySlug + blog.html (serializeBlocksToHtml).',
				imports: [typeImport('#lib/types.ts', 'BlockEditorDoc')],
				exports: [
					declaration(
						'blogBodies',
						'Readonly<Record<string, BlockEditorDoc>>',
						data.blogBodies,
					),
				],
			},
		],
		checkBlog,
	),
	defineModule(
		'legal-pages',
		z.object({ legalPages: z.array(schemas.LegalPageSchema).readonly() }),
		async (context) => ({ legalPages: await fetchLegalPages(context) }),
		(data) => [
			{
				fileName: 'legal-pages.ts',
				description:
					'Legal pages (OPS1): slug, title, per-locale Block Editor body for /legal/[slug].',
				imports: [typeImport('#lib/types.ts', 'LegalPage')],
				exports: [
					declaration('legalPages', 'readonly LegalPage[]', data.legalPages),
				],
			},
		],
	),
	defineModule(
		'services',
		z.object({ services: z.array(schemas.ServiceSchema).readonly() }),
		async (context) => ({ services: await fetchServices(context) }),
		(data) => [
			{
				fileName: 'services.ts',
				description:
					'Services array (id, title, station, deliverables, sections, related projects).',
				imports: [typeImport('#lib/types.ts', 'Service')],
				exports: [declaration('services', 'readonly Service[]', data.services)],
			},
		],
		checkServices,
	),
	defineModule(
		'projects',
		z.object({ projects: z.array(schemas.ProjectSchema).readonly() }),
		async (context) => ({ projects: await fetchProjects(context) }),
		(data) => [
			{
				fileName: 'projects.ts',
				description:
					'Projects array (slugs, titles, oneLiners, descriptions, sections, impact metrics, stack, related services).',
				imports: [typeImport('#lib/types.ts', 'Project')],
				exports: [declaration('projects', 'readonly Project[]', data.projects)],
			},
		],
		checkProjects,
	),
	defineModule(
		'nav',
		z.object({
			nav: z.object({
				navLinks: z.array(schemas.NavLinkSchema).readonly(),
				menuItems: z.array(schemas.MenuItemSchema).readonly(),
				footerLinks: z.array(schemas.NavLinkSchema).readonly(),
			}),
			errorPageFallback: schemas.ErrorPageContentSchema,
			errorPages: z.record(z.string(), schemas.ErrorPageContentSchema),
		}),
		async (context) => ({
			nav: await fetchNavData(context),
			errorPageFallback: await fetchErrorPageFallback(context),
			errorPages: await fetchAllErrorPages(context),
		}),
		(data) => [
			{
				fileName: 'error-pages.ts',
				description:
					'All published error_pages rows keyed by status_code. Powers static content.errorPage(statusCode) per-code lookup.',
				imports: [typeImport('#lib/navigation/types.ts', 'ErrorPageContent')],
				exports: [
					declaration(
						'errorPagesById',
						'Readonly<Record<number, ErrorPageContent>>',
						data.errorPages,
					),
				],
			},
			{
				fileName: 'nav.ts',
				description:
					'Navigation links (header + menu + footer placements) + error page fallback.',
				imports: [
					typeImport(
						'#lib/navigation/types.ts',
						'NavLink',
						'MenuItem',
						'ErrorPageContent',
					),
				],
				exports: [
					declaration('navLinks', 'readonly NavLink[]', data.nav.navLinks),
					declaration('menuItems', 'readonly MenuItem[]', data.nav.menuItems),
					declaration(
						'footerLinks',
						'readonly NavLink[]',
						data.nav.footerLinks,
					),
					declaration(
						'errorPageContent',
						'ErrorPageContent',
						data.errorPageFallback,
					),
				],
			},
		],
	),
	defineModule(
		'site-pages',
		z.object({ sitePages: z.array(schemas.SitePageSchema).readonly() }),
		async (context) => ({ sitePages: await fetchSitePages(context) }),
		(data) => [
			{
				fileName: 'site-pages.ts',
				description:
					"Published site_pages registry rows (path, type, title). PUBLISHED rows only — a path's absence IS the hidden signal: the route gate 404s it, the sitemap drops it, and nav links pointing at it disappear (cascade applied in the nav fetcher). NEW in slice-26.1.",
				imports: [typeImport('#lib/types.ts', 'SitePage')],
				exports: [
					declaration('sitePages', 'readonly SitePage[]', data.sitePages),
				],
			},
		],
		checkSitePages,
	),
	defineModule(
		'site-labels',
		z.object({ siteLabels: schemas.SiteLabelsSchema }),
		async (context) => ({ siteLabels: await fetchSiteLabels(context) }),
		(data) => [
			{
				fileName: 'site-labels.ts',
				description:
					'Global UI microcopy from the site_labels singleton, including accessibility, navigation, project, blog, service, footer, email, and live-dashboard labels.',
				imports: [typeImport('#lib/types.ts', 'SiteLabels')],
				exports: [declaration('siteLabels', 'SiteLabels', data.siteLabels)],
			},
		],
	),
	defineModule(
		'blog-page',
		z.object({ blogPage: schemas.BlogPageContentSchema }),
		async (context) => ({ blogPage: await fetchBlogPageContent(context) }),
		(data) => [
			{
				fileName: 'blog-page.ts',
				description:
					'/blog page chrome (intro, heading, back-nav labels). NEW in slice-18m — was previously inlined as a static fallback in adapters/static.ts.',
				imports: [typeImport('@repo/shared', 'BlogPageContent')],
				exports: [
					declaration('blogPageContent', 'BlogPageContent', data.blogPage),
				],
			},
		],
	),
	defineModule(
		'projects-page',
		z.object({ projectsPage: schemas.ProjectsPageContentSchema }),
		async (context) => ({
			projectsPage: await fetchProjectsPageContent(context),
		}),
		(data) => [
			{
				fileName: 'projects-page.ts',
				description:
					'/projects page chrome (intro, heading, empty-state). NEW in slice-18m; heading/emptyState added in go2-t1c2.',
				imports: [typeImport('@repo/shared', 'ProjectsPageContent')],
				exports: [
					declaration(
						'projectsPageContent',
						'ProjectsPageContent',
						data.projectsPage,
					),
				],
			},
		],
	),
	defineModule(
		'morph-shapes',
		z.object({ morphShapes: z.array(schemas.MorphShapeSchema).readonly() }),
		async (context) => ({ morphShapes: await fetchMorphShapes(context) }),
		(data) => [
			{
				fileName: 'morph-shapes.ts',
				description:
					'Geometric morph-target library (id, label, path, viewbox, sort). NEW in slice-18m — was previously derived from utils/shapes.ts SHAPES const.',
				imports: [typeImport('#lib/types.ts', 'MorphShape')],
				exports: [
					declaration('morphShapes', 'readonly MorphShape[]', data.morphShapes),
				],
			},
		],
	),
] as const;
