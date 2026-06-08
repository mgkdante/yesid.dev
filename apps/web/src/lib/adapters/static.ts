// Static adapter — reads from $lib/content directly.
// This is the ONLY module that imports from $lib/content (outside of content/
// internals). Every other layer goes through a repository, which goes through
// `adapter` re-exported from ./index.
//
// Each method is a thin async wrapper around a content-layer export. No
// transformation, no validation (Zod lands in Slice 17c between adapter and
// repository). Missing a method is a compile error via the `: ContentAdapter`
// annotation at the bottom.

import { projects } from '$lib/content/projects';
import {
	getProjectBySlug,
	getFeaturedProjects,
	getPublicProjects,
	getProjectsByService,
	getAllTags,
	getAllStackItems,
	getServiceIdsForProjects,
} from '$lib/content/projects.companion';
import { services } from '$lib/content/services';
import {
	getServiceById,
	getVisibleServices,
	getAdjacentServices,
} from '$lib/content/services.companion';
import { blogPosts } from '$lib/content/blog';
// Slice-27.1: blog.html + blog.bodyBySlug now mirror the directus adapter —
// `bodyBySlug` reads the CMS-derived Block Editor doc from blog-bodies.ts and
// `html` is `serializeBlocksToHtml(body)`, byte-identical to directus. This
// replaced the legacy markdown→Shiki `getPostHtml` bridge (blog.html-cache.ts),
// whose `<h1>`-prefixed / id-less serialization diverged from the runtime path.
import { blogBodies } from '$lib/content/blog-bodies';
import {
	getPostBySlug,
	getPostsByCategory,
	getPostsByTag,
	getTagsForCategory,
	getLanguagesForCategory,
	getLatestPosts,
	getSvgContent,
	getSvgContentsForPosts,
	resolveSvgFallbackName,
	resolveAnimation,
} from '$lib/content/blog.companion';
import { siteMeta } from '$lib/content/site-meta';
import { STATIC_SITE_SEO_DEFAULTS } from '$lib/content/site-seo-defaults';
import { codeRouteSeoDefaults } from './route-seo-defaults';
import {
	routeSeoFactories,
	errorSeoFallback,
} from './route-seo-factories';
import { composePageSeo } from './compose-page-seo';
import type { SiteSeoDefaults } from '$lib/types';
import { PageSeoSchema, type PageSeo } from '$lib/schemas/seo';
import { z } from 'zod';
import {
	parsePort,
	ProjectSchema,
	ServiceSchema,
	BlogPostSchema,
	BlogAnimationSchema,
	SiteMetaSchema,
	TechStackItemSchema,
	NavLinkSchema,
	MenuItemSchema,
	ErrorPageContentSchema,
	AboutContentSchema,
	ContactContentSchema,
	TechStackPageContentSchema,
	HeroDataSchema,
} from '$lib/schemas';
import {
	BlogPageContentSchema,
	ProjectsPageContentSchema,
	type BlogPageContent,
	type ProjectsPageContent,
} from '@repo/shared/schemas';
import type { Locale } from '$lib/types';
import { techStackItems, techStackPageContent } from '$lib/content/tech-stack';
import { serializeBlocksToHtml, BlockEditorDocSchema } from '@repo/shared';
import {
	heroContent,
	heroAnimContent,
	manifestoContent,
	proofReelContent,
	servicesGridContent,
	aboutContent,
	ctaContent,
	closerContent,
} from '$lib/content/site-content';
import { navLinks, menuItems, footerLinks, mobileLinks, errorPageContent } from '$lib/content/nav';
import { aboutPageContent } from '$lib/content/about-page';
import { contactContent } from '$lib/content/contact-page';
import { blogPageContent } from '$lib/content/blog-page';
import { projectsPageContent } from '$lib/content/projects-page';
import { generateHeroData, INITIAL_HERO_DATA } from '$lib/content/hero-data';
// Slice 18d Phase 8: static fallback for content.metroSvg — keeps the legacy
// build-time `?raw` source available for unit tests (which override
// directusAdapter with staticAdapter via setup.data.ts) and for future
// no-network test scenarios. The Directus path lives in directus.ts.
import metroSvgRaw from '../../../static/images/montreal-metro.svg?raw';
import { assetIdForOrUndefined } from '@repo/shared';
import type { Project } from '$lib/types';

import type { ContentAdapter } from './types';

// ---------------------------------------------------------------------------
// Static adapter — slice-18m note: Project.image is now a UUID (CMS-derived)
// and description/sections.content are LocalizedBlockEditorDoc (slice-18 #41
// migration complete). The legacy `RawProject → Project` wrapper +
// `withImageUuid(filename → UUID)` shims are gone; the static array IS the
// runtime shape now.
// ---------------------------------------------------------------------------

export const staticAdapter: ContentAdapter = {
	projects: {
		all: async () => parsePort('projects.all', z.array(ProjectSchema), projects),
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
		// Utility ports — return primitives/strings, no schema needed (spec D2).
		allTags: async () => getAllTags(),
		allStackItems: async () => getAllStackItems(),
		serviceIdsForProjects: async () => getServiceIdsForProjects(),
	},
	services: {
		all: async () => parsePort('services.all', z.array(ServiceSchema), services),
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
		byTag: async (category, tag) =>
			parsePort('blog.byTag', z.array(BlogPostSchema), getPostsByTag(category, tag)),
		latest: async (count, category) =>
			parsePort('blog.latest', z.array(BlogPostSchema), getLatestPosts(count, category)),
		resolveAnimation: async (slug, explicit) =>
			parsePort('blog.resolveAnimation', BlogAnimationSchema, resolveAnimation(slug, explicit)),
		// Utility ports — return strings/records, no schema needed (spec D2).
		// Mirror directusAdapter.blog.html: serialize the Block Editor body to HTML
		// (same wrapper + heading ids), or '' when the post has no body.
		html: async (slug) => {
			// Mirror directusAdapter.blog.html: validate the body through the same
			// parsePort gate as bodyBySlug, then serialize (byte-identical wrapper +
			// heading ids), or '' when the post has no body.
			const raw = blogBodies[slug];
			if (!raw) return '';
			return serializeBlocksToHtml(parsePort('blog.bodyBySlug', BlockEditorDocSchema, raw));
		},
		tagsForCategory: async (category) => getTagsForCategory(category),
		languagesForCategory: async (category) => getLanguagesForCategory(category),
		svgContent: async (post) => getSvgContent(post),
		svgContentsForPosts: async (posts) => getSvgContentsForPosts(posts),
		resolveSvgFallbackName: async (slug, category) => resolveSvgFallbackName(slug, category),
	},
	meta: {
		site: async () => parsePort('meta.site', SiteMetaSchema, siteMeta),
		// slice-18 18h Q9: SEO defaults shape sourced from the static fallback.
		// The directus adapter sources from CMS singleton; this static fallback
		// keeps the adapter contract uniform for tests and static-mode scenarios.
		siteSeoDefaults: async () => STATIC_SITE_SEO_DEFAULTS,
		// Static adapter has no per-route overrides — composer falls through to
		// code-side defaults. Returning undefined matches the directus shape
		// when no row matches the path.
		routeSeo: {
			byPath: async () => undefined,
		},
		// slice-18 18h Phase 5 Task 15: forRoute now uses the same composer pattern
		// as the directus adapter (compose-page-seo + route-seo-factories +
		// route-seo-defaults). Replaces the legacy `routeSeoEntries` lookup that
		// got deleted with `apps/web/src/lib/content/meta.ts`.
		forRoute: async (
			routeId: string,
			locale: Locale,
			params?: Record<string, string>,
		): Promise<PageSeo> => {
			const { adapter } = await import('$lib/adapters');
			const dynamicFactory = routeSeoFactories[routeId];
			if (dynamicFactory) {
				return dynamicFactory({
					params: params ?? {},
					locale,
					adapter,
					siteMeta,
					siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
				});
			}
			if (routeId === '/__error') {
				return errorSeoFallback({
					locale,
					siteMeta,
					siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
				});
			}
			const codeDefaults = codeRouteSeoDefaults[routeId];
			if (!codeDefaults) {
				throw new Error(
					`[adapter.meta.forRoute] Unknown route id: ${routeId}. Add an entry in route-seo-defaults.ts.`,
				);
			}
			return composePageSeo({
				routeId,
				locale,
				siteMeta,
				siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
				routeOverride: undefined,
				codeDefaults,
			});
		},
	},
	techStack: {
		// slice-18m follow-up (GH #63/#64): tech-stack data sourced from the
		// CMS-derived `techStackItems` array (generated by export-fallbacks)
		// rather than the legacy MD-glob parser. `content(id)` serializes the
		// 3 BlockEditorDoc fields (what_it_is + what_i_use_it_for +
		// why_i_use_it_instead) for the English locale — mirrors the runtime
		// adapter pattern at directus.ts:2817.
		all: async () =>
			parsePort('techStack.all', z.array(TechStackItemSchema), techStackItems),
		byId: async (id) =>
			parsePort(
				'techStack.byId',
				TechStackItemSchema.optional(),
				techStackItems.find((it) => it.id === id),
			),
		content: async (id) => {
			const item = techStackItems.find((it) => it.id === id);
			if (!item) return '';
			return [
				serializeBlocksToHtml(item.what_it_is.en),
				serializeBlocksToHtml(item.what_i_use_it_for.en),
				serializeBlocksToHtml(item.why_i_use_it_instead.en),
			].join('\n');
		},
	},
	content: {
		// Site-chrome literals — kept as `typeof import` shape via ContentPort,
		// not wrapped (spec D2 non-goal). These are page chrome, not CMS-managed
		// content; re-encoding as Zod adds maintenance cost with no CMS benefit.
		hero: async () => heroContent,
		heroAnim: async () => heroAnimContent,
		manifesto: async () => manifestoContent,
		proofReel: async () => proofReelContent,
		servicesGrid: async () => servicesGridContent,
		about: async () => aboutContent,
		cta: async () => ctaContent,
		closer: async () => closerContent,
		// Schema-validated content ports.
		navLinks: async () => parsePort('content.navLinks', z.array(NavLinkSchema), navLinks),
		menuItems: async () => parsePort('content.menuItems', z.array(MenuItemSchema), menuItems),
		// statusCode accepted for ContentPort parity with the Directus adapter
		// (Task 5.3 signature change). Static fallback always returns the same
		// hardcoded content regardless of status code — it is the revert recipe.
		errorPage: async (_statusCode?: number) =>
			parsePort('content.errorPage', ErrorPageContentSchema, errorPageContent),
		aboutPage: async () => parsePort('content.aboutPage', AboutContentSchema, aboutPageContent),
		contactPage: async () => parsePort('content.contactPage', ContactContentSchema, contactContent),
		techStackPage: async () =>
			parsePort('content.techStackPage', TechStackPageContentSchema, techStackPageContent),
		// slice-27.1 T4: source the generated CMS modules (blog-page.ts /
		// projects-page.ts, emitted from dev Directus by export-fallbacks) instead
		// of inline stubs. Drops the prior placeholder copy that was missing
		// schema-required keys (heading / backToDispatches / backToPersonal) and
		// makes this mirror the directus adapter byte-for-byte.
		blogPage: async (): Promise<BlogPageContent> =>
			parsePort('content.blogPage', BlogPageContentSchema, blogPageContent),
		projectsPage: async (): Promise<ProjectsPageContent> =>
			parsePort('content.projectsPage', ProjectsPageContentSchema, projectsPageContent),
		heroMock: async () => parsePort('content.heroMock', HeroDataSchema, generateHeroData()),
		initialHeroData: async () =>
			parsePort('content.initialHeroData', HeroDataSchema, INITIAL_HERO_DATA),
		metroSvg: async () => metroSvgRaw,
		morphShapes: async () => {
			// Static fallback: derive 4 hardcoded shapes from utils/shapes.ts.
			const { SHAPES } = await import('$lib/utils/shapes');
			return Object.entries(SHAPES).map(([id, path], idx) => ({
				id,
				label: id.charAt(0).toUpperCase() + id.slice(1),
				path,
				viewbox: '0 0 48 48',
				sort: idx + 1,
			}));
		},
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
};
