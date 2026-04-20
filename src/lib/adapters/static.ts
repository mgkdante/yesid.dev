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
		all: async () => projects,
		bySlug: async (slug) => getProjectBySlug(slug),
		featured: async () => getFeaturedProjects(),
		public: async () => getPublicProjects(),
		byService: async (serviceId) => getProjectsByService(serviceId),
		allTags: async () => getAllTags(),
		allStackItems: async () => getAllStackItems(),
		serviceIdsForProjects: async () => getServiceIdsForProjects(),
	},
	services: {
		all: async () => services,
		byId: async (id) => getServiceById(id),
		visible: async () => getVisibleServices(),
		adjacent: async (id) => getAdjacentServices(id),
	},
	blog: {
		all: async () => blogPosts,
		bySlug: async (slug) => getPostBySlug(slug),
		html: async (slug) => getPostHtml(slug),
		byCategory: async (category) => getPostsByCategory(category),
		byTag: async (category, tag) => getPostsByTag(category, tag),
		tagsForCategory: async (category) => getTagsForCategory(category),
		languagesForCategory: async (category) => getLanguagesForCategory(category),
		latest: async (count, category) => getLatestPosts(count, category),
		svgContent: async (post) => getSvgContent(post),
		svgContentsForPosts: async (posts) => getSvgContentsForPosts(posts),
		resolveSvgFallbackName: async (slug, category) => resolveSvgFallbackName(slug, category),
		resolveAnimation: async (slug, explicit) => resolveAnimation(slug, explicit),
	},
	meta: {
		site: async () => siteMeta,
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
		all: async () => getAllTechItems(),
		byId: async (id) => getTechItemById(id),
		byLayer: async (layer) => getTechItemsByLayer(layer),
		byDomain: async (domain) => getTechItemsByDomain(domain),
		connections: async (id) => getConnections(id),
		incomingConnections: async (id) => getIncomingConnections(id),
		outgoingRelations: async (id) => getOutgoingRelations(id),
		incomingRelations: async (id) => getIncomingRelations(id),
		content: async (id) => getTechItemContent(id),
		allScenarios: async () => getAllScenarios(),
		scenarioForDomains: async (domains) => getScenarioForDomains(domains),
	},
	content: {
		hero: async () => heroContent,
		heroAnim: async () => heroAnimContent,
		manifesto: async () => manifestoContent,
		proofReel: async () => proofReelContent,
		servicesGrid: async () => servicesGridContent,
		about: async () => aboutContent,
		cta: async () => ctaContent,
		closer: async () => closerContent,
		skillsJourneyPanels: async () => skillsJourneyPanels,
		skillsJourneyCta: async () => skillsJourneyCta,
		navLinks: async () => navLinks,
		menuItems: async () => menuItems,
		metroBookends: async () => metroBookends,
		errorPage: async () => errorPageContent,
		aboutPage: async () => aboutPageContent,
		contactPage: async () => contactContent,
		heroMock: async () => generateHeroData(),
		initialHeroData: async () => INITIAL_HERO_DATA,
	},
};
