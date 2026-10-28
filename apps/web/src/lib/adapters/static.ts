// Static adapter — reads from $lib/content directly.
//
// OWNER AUTHORIZATION: GO 2026-07-29 — G7 removes the verified pass-through
// repository layer and amends this doctrine header.
//
// BOUNDARY RULE (rewritten slice-28.5, audit #124; amended G7 2026-07-29):
//
//   1. COLLECTION / PRIMARY data (projects, services, blog, page
//      blocks, meta singletons, morph shapes — anything with an adapter port)
//      must flow server loader/helper -> $lib/adapters (the active swap point)
//      -> this module -> $lib/content. Server consumers call typed adapter
//      ports directly; display components receive resolved values as props.
//      Those consumers must not import this module, raw primary content, or
//      static helpers. This module remains the only RUNTIME reader of that data,
//      so an adapter re-point still reaches every render.
//   2. CMS CHROME SINGLETONS (siteLabels.*) MAY be imported directly by
//      display components when the copy is global chrome, aria text, or route
//      shell labels. They are build-cache values, not runtime CMS calls; routing
//      them through every load() would add plumbing with no client benefit.
//   3. SANCTIONED EXCEPTIONS: +layout.ts / +layout.server.ts / +error.svelte /
//      SiteHeader / Footer static-fallback imports (CSR-only fallback
//      when server data is absent); HeroBanner's client-side
//      generateHeroData() refresh (interactive mock regen, not CMS data);
//      test files stubbing load output.
//
// The `staticAdapter: ContentAdapter` annotation below is the compile-time
// port-coverage gate. Existing parsing, validation, serialization, lookup,
// fallback, and error behavior stays in the adapter ports; G7 changes only
// the call path.
//
// HomeServices and FeaturedProjects were the last component-level bypasses for
// primary data; slice-28.5 threaded both through the home +page.server.ts.

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
import { STATIC_SITE_SEO_DEFAULTS } from '#lib/content/site-seo-defaults.ts';
import { routeSeoOverrides } from '#lib/content/route-seo.ts';
import { codeRouteSeoDefaults } from './route-seo-defaults';
import { errorSeoFallback } from './error-seo-fallback';
import { routeSeoFactories } from './route-seo-factories';
import { composePageSeo } from './compose-page-seo';
import type { SiteSeoDefaults } from '#lib/types.ts';
import { PageSeoSchema, type PageSeo } from '#lib/schemas/seo.ts';
import { z } from 'zod';
import {
	parsePort,
	HeroDataSchema,
} from '#lib/schemas/index.ts';
import {
	ProjectSchema,
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
	ctaContent,
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
// Slice 18d Phase 8 introduced this as the static fallback for
// content.metroSvg; since slice-27.2 (static-only data path — the directus
// fetch layer was removed at slice-26 close) the build-time `?raw` import IS
// the live source.
import metroSvgRaw from '../../../static/images/montreal-metro.svg?raw';
import { assetIdForOrUndefined } from '@repo/shared';
import type { Project } from '#lib/types.ts';

import type { ContentAdapter } from './types';

// ---------------------------------------------------------------------------
// Static adapter — slice-18m note: Project.image is now a UUID (CMS-derived)
// and description/sections.content are LocalizedBlockEditorDoc (slice-18 #41
// migration complete). The legacy `RawProject → Project` wrapper +
// `withImageUuid(filename → UUID)` shims are gone; the static array IS the
// runtime shape now.
// ---------------------------------------------------------------------------

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
			parsePort('projects.featured', z.array(ProjectSchema), getFeaturedProjects()),
		public: async () =>
			parsePort('projects.public', z.array(ProjectSchema), getPublicProjects()),
		byService: async (serviceId) =>
			parsePort('projects.byService', z.array(ProjectSchema), getProjectsByService(serviceId)),
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
		// slice-18 18h Q9: SEO defaults shape sourced from the static fallback.
		// (The retired directus adapter sourced this from the CMS singleton;
		// the static module keeps the same shape so the contract is uniform.)
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
				siteMeta,
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
		cta: async () => ctaContent,
		closer: async () => closerContent,
		// Schema-validated content ports.
		// slice-27.1 FIX A: mirror directus's _or: [status_code=N, status_code=0]
		// semantics — look up the specific status code first, then fall back to the
		// 0-row (generic fallback). errorPagesById is keyed by status_code (number).
		errorPage: async (statusCode?: number) => resolveStaticErrorPage(statusCode),
		aboutPage: async () => parsePort('content.aboutPage', AboutContentSchema, aboutPageContent),
		contactPage: async () => parsePort('content.contactPage', ContactContentSchema, contactContent),
		// slice-27.1 T4: source the generated CMS modules (blog-page.ts /
		// projects-page.ts, emitted from dev Directus by export-fallbacks) instead
		// of inline stubs. Drops the prior placeholder copy that was missing
		// schema-required keys (heading / backToDispatches / backToPersonal) and
		// makes this mirror the directus adapter byte-for-byte.
		blogPage: async (): Promise<BlogPageContent> =>
			parsePort('content.blogPage', BlogPageContentSchema, blogPageContent),
		projectsPage: async (): Promise<ProjectsPageContent> =>
			parsePort('content.projectsPage', ProjectsPageContentSchema, projectsPageContent),
		initialHeroData: async () =>
			parsePort('content.initialHeroData', HeroDataSchema, INITIAL_HERO_DATA),
		metroSvg: async () => metroSvgRaw,
		// slice-28.5 (#120): read the GENERATED $lib/content/morph-shapes module
		// (emitted from the Directus morph_shapes collection by export-fallbacks),
		// matching every other port. Previously this derived shapes from the
		// hardcoded SHAPES const in utils/shapes.ts, so CMS morph_shapes edits
		// regenerated the module but never reached the render. SHAPES survives
		// only as the documented last-resort seed (utils/shapes.ts).
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
