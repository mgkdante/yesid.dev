// Static adapter — reads from $lib/content directly.
// This is the ONLY module that imports from $lib/content (outside of content/
// internals). Every other layer goes through a repository, which goes through
// `adapter` re-exported from ./index.
//
// Each method is a thin async wrapper around a content-layer export. No
// transformation, no validation (Zod lands in Slice 17c between adapter and
// repository). Missing a method is a compile error via the `: ContentAdapter`
// annotation at the bottom.

import {
	projects,
	getProjectBySlug,
	getFeaturedProjects,
	getPublicProjects,
	getProjectsByService,
	getAllTags,
	getAllStackItems,
	getServiceIdsForProjects,
} from '$lib/content/projects';
import {
	services,
	getServiceById,
	getVisibleServices,
	getAdjacentServices,
} from '$lib/content/services';
import {
	blogPosts,
	getPostBySlug,
	getPostHtml,
	getPostsByCategory,
	getPostsByTag,
	getTagsForCategory,
	getLanguagesForCategory,
	getLatestPosts,
	getSvgContent,
	getSvgContentsForPosts,
	resolveSvgFallbackName,
	resolveAnimation,
} from '$lib/content/blog';
import { routeSeoEntries, siteMeta } from '$lib/content/meta';
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
	TechRelationSchema,
	StackScenarioSchema,
	JourneyPanelSchema,
	NavLinkSchema,
	MenuItemSchema,
	MetroBookendsSchema,
	ErrorPageContentSchema,
	AboutContentSchema,
	ContactContentSchema,
	TechStackPageContentSchema,
	HeroDataSchema,
} from '$lib/schemas';
import type { Locale } from '$lib/types';
import {
	getAllTechItems,
	getTechItemById,
	getTechItemsByLayer,
	getTechItemsByDomain,
	getConnections,
	getIncomingConnections,
	getOutgoingRelations,
	getIncomingRelations,
	getTechItemContent,
	getAllScenarios,
	getScenarioForDomains,
	techStackPageContent,
} from '$lib/content/tech-stack';
import {
	heroContent,
	heroAnimContent,
	manifestoContent,
	proofReelContent,
	servicesGridContent,
	aboutContent,
	ctaContent,
	closerContent,
	skillsJourneyPanels,
	skillsJourneyCta,
} from '$lib/content/site-content';
import { navLinks, menuItems, errorPageContent, metroBookends } from '$lib/content/nav';
import { aboutPageContent } from '$lib/content/about-page';
import { contactContent } from '$lib/content/contact-page';
import { generateHeroData, INITIAL_HERO_DATA } from '$lib/content/hero-data';

import type { ContentAdapter } from './types';

export const staticAdapter: ContentAdapter = {
	projects: {
		all: async () => parsePort('projects.all', z.array(ProjectSchema), projects),
		bySlug: async (slug) =>
			parsePort('projects.bySlug', ProjectSchema.optional(), getProjectBySlug(slug)),
		featured: async () =>
			parsePort('projects.featured', z.array(ProjectSchema), getFeaturedProjects()),
		public: async () => parsePort('projects.public', z.array(ProjectSchema), getPublicProjects()),
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
		byCategory: async (category) =>
			parsePort('blog.byCategory', z.array(BlogPostSchema), getPostsByCategory(category)),
		byTag: async (category, tag) =>
			parsePort('blog.byTag', z.array(BlogPostSchema), getPostsByTag(category, tag)),
		latest: async (count, category) =>
			parsePort('blog.latest', z.array(BlogPostSchema), getLatestPosts(count, category)),
		resolveAnimation: async (slug, explicit) =>
			parsePort('blog.resolveAnimation', BlogAnimationSchema, resolveAnimation(slug, explicit)),
		// Utility ports — return strings/records, no schema needed (spec D2).
		html: async (slug) => getPostHtml(slug),
		tagsForCategory: async (category) => getTagsForCategory(category),
		languagesForCategory: async (category) => getLanguagesForCategory(category),
		svgContent: async (post) => getSvgContent(post),
		svgContentsForPosts: async (posts) => getSvgContentsForPosts(posts),
		resolveSvgFallbackName: async (slug, category) => resolveSvgFallbackName(slug, category),
	},
	meta: {
		site: async () => parsePort('meta.site', SiteMetaSchema, siteMeta),
		forRoute: async (
			routeId: string,
			locale: Locale,
			params?: Record<string, string>,
		): Promise<PageSeo> => {
			const entry = routeSeoEntries[routeId];
			if (!entry) {
				throw new Error(
					`[adapter.meta.forRoute] Unknown route id: ${routeId}. Add an entry in src/lib/content/meta.ts.`,
				);
			}
			const raw = typeof entry === 'function' ? await entry(params ?? {}, locale) : entry;
			return PageSeoSchema.parse(raw);
		},
	},
	techStack: {
		all: async () => parsePort('techStack.all', z.array(TechStackItemSchema), getAllTechItems()),
		byId: async (id) =>
			parsePort('techStack.byId', TechStackItemSchema.optional(), getTechItemById(id)),
		byLayer: async (layer) =>
			parsePort('techStack.byLayer', z.array(TechStackItemSchema), getTechItemsByLayer(layer)),
		byDomain: async (domain) =>
			parsePort('techStack.byDomain', z.array(TechStackItemSchema), getTechItemsByDomain(domain)),
		outgoingRelations: async (id) =>
			parsePort(
				'techStack.outgoingRelations',
				z.array(TechRelationSchema),
				getOutgoingRelations(id),
			),
		incomingRelations: async (id) =>
			parsePort(
				'techStack.incomingRelations',
				z.array(TechRelationSchema),
				getIncomingRelations(id),
			),
		allScenarios: async () =>
			parsePort('techStack.allScenarios', z.array(StackScenarioSchema), getAllScenarios()),
		scenarioForDomains: async (domains) =>
			parsePort(
				'techStack.scenarioForDomains',
				StackScenarioSchema.optional(),
				getScenarioForDomains(domains),
			),
		// Utility ports — return string[]/string, no schema needed (spec D2).
		connections: async (id) => getConnections(id),
		incomingConnections: async (id) => getIncomingConnections(id),
		content: async (id) => getTechItemContent(id),
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
		skillsJourneyCta: async () => skillsJourneyCta,
		// Schema-validated content ports.
		skillsJourneyPanels: async () =>
			parsePort('content.skillsJourneyPanels', z.array(JourneyPanelSchema), skillsJourneyPanels),
		navLinks: async () => parsePort('content.navLinks', z.array(NavLinkSchema), navLinks),
		menuItems: async () => parsePort('content.menuItems', z.array(MenuItemSchema), menuItems),
		metroBookends: async () =>
			parsePort('content.metroBookends', MetroBookendsSchema, metroBookends),
		errorPage: async () => parsePort('content.errorPage', ErrorPageContentSchema, errorPageContent),
		aboutPage: async () => parsePort('content.aboutPage', AboutContentSchema, aboutPageContent),
		contactPage: async () => parsePort('content.contactPage', ContactContentSchema, contactContent),
		techStackPage: async () =>
			parsePort('content.techStackPage', TechStackPageContentSchema, techStackPageContent),
		heroMock: async () => parsePort('content.heroMock', HeroDataSchema, generateHeroData()),
		initialHeroData: async () =>
			parsePort('content.initialHeroData', HeroDataSchema, INITIAL_HERO_DATA),
	},
};
