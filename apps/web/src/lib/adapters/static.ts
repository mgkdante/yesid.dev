// Primary content flows through adapter ports;
// chrome, layout/error fallbacks and the shared CTA read build-time content directly.

import {
	getProjectBySlug,
	getFeaturedProjects,
	getPublicProjects,
	getProjectsByService,
} from '#lib/projects/static-helpers.ts';
import {
	getServiceById,
	getVisibleServices,
	getAdjacentServices,
} from '#lib/services/static-helpers.ts';
import { blogPosts } from '#lib/content/blog.ts';
import { blogBodies } from '#lib/content/blog-bodies.ts';
import {
	getPostBySlug,
	getPostsByCategory,
	getSvgContent,
	getSvgContentsForPosts,
} from '#lib/blog/static-helpers.ts';
import { siteMeta } from '#lib/content/site-meta.ts';
import { ownerPhone } from '#lib/content/site-owner-phone.server.ts';
import { STATIC_SITE_SEO_DEFAULTS } from '#lib/content/site-seo-defaults.ts';
import { routeSeoOverrides } from '#lib/content/route-seo.ts';
import { codeRouteSeoDefaults } from './route-seo-defaults';
import { errorSeoFallback, errorTitleBody } from './error-seo-fallback';
import { routeSeoFactories } from './route-seo-factories';
import { composePageSeo } from './compose-page-seo';
import type { SiteMeta, SiteSeoDefaults } from '#lib/types.ts';
import { PageSeoSchema, type PageSeo } from '#lib/schemas/seo.ts';
import { z } from 'zod';
import {
	parsePort,
	HeroDataSchema,
} from '#lib/schemas/index.ts';
import {
	ProjectSchema,
	ProjectSummarySchema,
	ServiceSchema,
	BlogPostSchema,
	SiteMetaSchema,
	NavLinkSchema,
	ErrorPageContentSchema,
	AboutContentSchema,
	ContactContentSchema,
} from '@repo/shared';
import {
	BlogPageContentSchema,
	ProjectsPageContentSchema,
	type BlogPageContent,
	type ProjectsPageContent,
} from '@repo/shared/schemas';
import type { Locale } from '#lib/types.ts';
import { BlockEditorDocSchema } from '@repo/shared';
import {
	heroContent,
	heroAnimContent,
	manifestoContent,
	proofReelContent,
	servicesGridContent,
	aboutContent,
	closerContent,
} from '#lib/content/site-content.ts';
import { navLinks, menuItems, footerLinks, mobileLinks, errorPageContent } from '#lib/content/nav.ts';
import { legalPages } from '#lib/content/legal-pages.ts';
import { LegalPageSchema } from '@repo/shared';
import { errorPagesById } from '#lib/content/error-pages.ts';
import { aboutPageContent } from '#lib/content/about-page.ts';
import { contactContent } from '#lib/content/contact-page.ts';
import { blogPageContent } from '#lib/content/blog-page.ts';
import { projectsPageContent } from '#lib/content/projects-page.ts';
import { INITIAL_HERO_DATA } from '#lib/live/index.ts';
import { morphShapes } from '#lib/content/morph-shapes.ts';
import { MorphShapeSchema } from '@repo/shared';

import metroSvgRaw from '../../../static/images/montreal-metro.svg?raw';
import { assetIdForOrUndefined } from '@repo/shared';
import type { Project } from '#lib/types.ts';

import type { ContentAdapter } from './types';

/** The JSON-LD telephone is the only output that carries the owner phone. */
const jsonLdSiteMeta: SiteMeta = ownerPhone
	? { ...siteMeta, owner: { ...siteMeta.owner, phone: ownerPhone } }
	: siteMeta;

/** Synchronous so Kit can use the error content during SSR rendering failures. */
export function resolveStaticErrorPage(statusCode?: number) {
	const specific = statusCode !== undefined ? errorPagesById[statusCode] : undefined;
	const fallback = errorPagesById[0] ?? errorPageContent;
	return parsePort('content.errorPage', ErrorPageContentSchema, specific ?? fallback);
}

export const staticAdapter: ContentAdapter = {
	projects: {
		bySlug: async (slug) => {
			const p = getProjectBySlug(slug);
			return parsePort('projects.bySlug', ProjectSchema.optional(), p);
		},
		featured: async () =>
			parsePort('projects.featured', z.array(ProjectSummarySchema), getFeaturedProjects()),
		public: async () =>
			parsePort('projects.public', z.array(ProjectSummarySchema), getPublicProjects()),
		byService: async (serviceId) =>
			parsePort('projects.byService', z.array(ProjectSummarySchema), getProjectsByService(serviceId)),
	},
	services: {
		byId: async (id) => parsePort('services.byId', ServiceSchema.optional(), getServiceById(id)),
		visible: async () =>
			parsePort('services.visible', z.array(ServiceSchema), getVisibleServices()),
		adjacent: async (id) =>
			parsePort(
				'services.adjacent',
				z.object({ prev: ServiceSchema.optional(), next: ServiceSchema.optional() }),
				getAdjacentServices(id),
			),
	},
	blog: {
		all: async () => parsePort('blog.all', z.array(BlogPostSchema), blogPosts),
		bySlug: async (slug) => parsePort('blog.bySlug', BlogPostSchema.optional(), getPostBySlug(slug)),
		bodyBySlug: async (slug) => {
			// Mirror directusAdapter.blog.bodyBySlug: return the CMS-derived Block
			// Editor doc (validated) for a published post, or null when the slug has
			// no body. blogBodies omits null-body posts, so the lookup miss == null.
			const body = blogBodies[slug];
			if (!body) return null;
			return parsePort('blog.bodyBySlug', BlockEditorDocSchema, body);
		},
		byCategory: async (category) =>
			parsePort('blog.byCategory', z.array(BlogPostSchema), getPostsByCategory(category)),
		svgContent: async (post) => getSvgContent(post),
		svgContentsForPosts: async (posts) => getSvgContentsForPosts(posts),
	},
	meta: {
		site: async () => parsePort('meta.site', SiteMetaSchema, siteMeta),

		siteSeoDefaults: async () => STATIC_SITE_SEO_DEFAULTS,
		// Static-route editorial SEO comes from generated routeSeoOverrides.
		// route-seo-defaults.ts keeps technical defaults only.
		forRoute: async (
			routeId: string,
			locale: Locale,
			params?: Record<string, string>,
		): Promise<PageSeo> => {
			const { adapter } = await import('#lib/adapters/index.ts');
			const dynamicFactory = routeSeoFactories[routeId];
			if (dynamicFactory) {
				return PageSeoSchema.parse(await dynamicFactory({
					params: params ?? {},
					locale,
					adapter,
					siteMeta,
					siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
				}));
			}
			if (routeId === '/__error') {
				return PageSeoSchema.parse(errorSeoFallback({
					locale,
					siteMeta,
					siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
					titleBody: errorTitleBody(errorPagesById),
				}));
			}
			const codeDefaults = codeRouteSeoDefaults[routeId];
			if (!codeDefaults) {
				throw new Error(
					`[adapter.meta.forRoute] Unknown route id: ${routeId}. Add an entry in route-seo-defaults.ts.`,
				);
			}
			const routeOverride = routeSeoOverrides.find((entry) => entry.path === routeId);
			return PageSeoSchema.parse(composePageSeo({
				routeId,
				locale,
				siteMeta: jsonLdSiteMeta,
				siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
				routeOverride,
				codeDefaults,
			}));
		},
	},
	content: {
		// Site-content literals are kept as `typeof import` shape via ContentPort,
		// not wrapped (spec D2 non-goal). Re-encoding as Zod adds maintenance cost
		// with no CMS benefit.
		hero: async () => heroContent,
		heroAnim: async () => heroAnimContent,
		manifesto: async () => manifestoContent,
		proofReel: async () => proofReelContent,
		servicesGrid: async () => servicesGridContent,
		about: async () => aboutContent,
		closer: async () => closerContent,
		// Error copy prefers the status-specific row and falls back to the generic status-0 row.
		errorPage: async (statusCode?: number) => resolveStaticErrorPage(statusCode),
		aboutPage: async () => parsePort('content.aboutPage', AboutContentSchema, aboutPageContent),
		contactPage: async () => parsePort('content.contactPage', ContactContentSchema, contactContent),

		blogPage: async (): Promise<BlogPageContent> =>
			parsePort('content.blogPage', BlogPageContentSchema, blogPageContent),
		projectsPage: async (): Promise<ProjectsPageContent> =>
			parsePort('content.projectsPage', ProjectsPageContentSchema, projectsPageContent),
		initialHeroData: async () =>
			parsePort('content.initialHeroData', HeroDataSchema, INITIAL_HERO_DATA),
		metroSvg: async () => metroSvgRaw,

		morphShapes: async () =>
			parsePort('content.morphShapes', z.array(MorphShapeSchema), morphShapes),
	},

	// Static nav port — reads from the static nav.ts constants, filtered by
	// placement. Preserves the per-method revert recipe per spec §3.6.
	nav: {
		async byPlacement(placement) {
			if (placement === 'header') {
				return parsePort('nav.byPlacement', z.array(NavLinkSchema), navLinks);
			}
			if (placement === 'menu') {
				return parsePort('nav.byPlacement', z.array(NavLinkSchema), menuItems);
			}
			if (placement === 'footer') {
				return parsePort('nav.byPlacement', z.array(NavLinkSchema), footerLinks);
			}
			if (placement === 'mobile') {
				return parsePort('nav.byPlacement', z.array(NavLinkSchema), mobileLinks);
			}
			return [];
		},
	},
	// Legal-pages port (OPS1) — reads the generated legal-pages module.
	legal: {
		all: async () => parsePort('legal.all', z.array(LegalPageSchema), legalPages),
		bySlug: async (slug) =>
			parsePort(
				'legal.bySlug',
				LegalPageSchema.optional(),
				legalPages.find((page) => page.slug === slug),
			),
	},
};
