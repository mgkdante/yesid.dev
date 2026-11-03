import { projects } from '#lib/content/projects.ts';
import { services } from '#lib/content/services.ts';
import { blogPosts } from '#lib/content/blog.ts';
import { blogBodies } from '#lib/content/blog-bodies.ts';
import { legalPages } from '#lib/content/legal-pages.ts';
import { sitePages } from '#lib/content/site-pages.ts';
import { routeSeoOverrides } from '#lib/content/route-seo.ts';
import { errorPagesById } from '#lib/content/error-pages.ts';
import { aboutPageContent } from '#lib/content/about-page.ts';
import { contactContent } from '#lib/content/contact-page.ts';
import { blogPageContent } from '#lib/content/blog-page.ts';
import { projectsPageContent } from '#lib/content/projects-page.ts';
import { heroContent, heroAnimContent, manifestoContent, proofReelContent, servicesGridContent, aboutContent, closerContent } from '#lib/content/site-content.ts';
import { siteMeta, STATIC_SITE_SEO_DEFAULTS, navLinks, menuItems, footerLinks, errorPageContent, morphShapes } from './chrome';
import { INITIAL_HERO_DATA } from '#lib/live/index.ts';
import metroSvg from '../../../static/images/montreal-metro.svg?raw';
import { ProjectSummarySchema } from '@repo/shared';
import { orderServices } from '#lib/utils/station.ts';
import { PUBLISHED_LOCALES } from '#lib/utils/published-locales.ts';
import { isEntityAvailable, isPathPublished, isLocaleAvailable, type AvailabilityContext, type ContentEntity } from './availability';
import type { BlogCategory, BlogPost, BlockEditorDoc, LegalPage, Locale } from '#lib/types.ts';
import type { ErrorPageContent } from '#lib/navigation/types.ts';

export interface CatalogSource extends AvailabilityContext {
	bodies?: Readonly<Record<string, BlockEditorDoc>>;
	legalPages?: readonly LegalPage[];
	errorPages?: Readonly<Record<number, ErrorPageContent>>;
}

const svgFiles = import.meta.glob('/src/lib/assets/blog-fallbacks/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const svgByName = new Map(Object.entries(svgFiles).map(([path, svg]) => [path.split('/').pop()!.replace(/\.svg$/, ''), svg]));
const svgContent = (post: BlogPost): string => svgByName.get(post.svg) ?? '';

/** Generated content is validated before export. Listings additionally project away case-study bodies. */
export function createContentCatalog(source: CatalogSource = {}) {
	const projectRows = source.projects ?? projects;
	const serviceRows = source.services ?? services;
	const posts = source.posts ?? blogPosts;
	const bodies = source.bodies ?? blogBodies;
	const legal = source.legalPages ?? legalPages;
	const errors = source.errorPages ?? errorPagesById;
	const context = { pages: source.pages ?? sitePages, locales: source.locales ?? PUBLISHED_LOCALES };
	const available = (entity: ContentEntity, locale: Locale = 'en') => isEntityAvailable(entity, locale, context);
	const availableProjects = (locale: Locale) => projectRows.filter((project) => available({ kind: 'project', entity: project }, locale));
	const availableServices = (locale: Locale) => serviceRows.filter((service) => available({ kind: 'service', entity: service }, locale));
	const availablePosts = () => posts.filter((post) => available({ kind: 'post', entity: post }, post.lang));
	const summaries = (rows: typeof projectRows) => rows.map((project) => ProjectSummarySchema.parse(project));

	return {
		locales: context.locales,
		isAvailable: available,
		isPathPublished: (path: string) => isPathPublished(path, context.pages),
		isLocaleAvailable: (locale: string) => isLocaleAvailable(locale, context.locales),
		projects: {
			bySlug: (slug: string) => projectRows.find((project) => project.slug === slug),
			available: (locale: Locale = 'en') => summaries(availableProjects(locale)),
			featured: (locale: Locale = 'en') => summaries(availableProjects(locale).filter((project) => project.featured)),
			byService: (id: string, locale: Locale = 'en') => summaries(availableProjects(locale).filter((project) => project.relatedServices.includes(id))),
		},
		services: {
			byId: (id: string) => serviceRows.find((service) => service.id === id),
			available: (locale: Locale = 'en') => availableServices(locale),
			adjacent: (id: string, locale: Locale = 'en') => {
				const rows = orderServices(availableServices(locale));
				const index = rows.findIndex((service) => service.id === id);
				return index < 0 ? {} : { prev: rows[index - 1], next: rows[index + 1] };
			},
		},
		blog: {
			all: availablePosts,
			bySlug: (slug: string) => posts.find((post) => post.slug === slug),
			bodyBySlug: (slug: string) => bodies[slug] ?? null,
			byCategory: (category: BlogCategory) => availablePosts().filter((post) => post.category === category).sort((a, b) => b.date.localeCompare(a.date)),
			svgContent,
			svgContentsForPosts: (rows: readonly BlogPost[]) => Object.fromEntries(rows.map((post) => [post.slug, svgContent(post)])),
		},
		legal: {
			all: () => legal,
			bySlug: (slug: string) => legal.find((page) => page.slug === slug),
		},
		meta: {
			site: () => siteMeta,
			siteSeoDefaults: () => STATIC_SITE_SEO_DEFAULTS,
			routeOverrides: () => routeSeoOverrides,
		},
		nav: {
			byPlacement: (placement: 'header' | 'footer' | 'menu') => ({ header: navLinks, footer: footerLinks, menu: menuItems })[placement] ?? [],
		},
		content: {
			hero: () => heroContent,
			heroAnim: () => heroAnimContent,
			manifesto: () => manifestoContent,
			proofReel: () => proofReelContent,
			servicesGrid: () => servicesGridContent,
			about: () => aboutContent,
			closer: () => closerContent,
			errorPage: (status = 0) => errors[status] ?? errors[0] ?? errorPageContent,
			aboutPage: () => aboutPageContent,
			contactPage: () => contactContent,
			blogPage: () => blogPageContent,
			projectsPage: () => projectsPageContent,
			initialHeroData: () => INITIAL_HERO_DATA,
			metroSvg: () => metroSvg,
			morphShapes: () => morphShapes,
		},
	};
}

export type ContentCatalog = ReturnType<typeof createContentCatalog>;
export const catalog = createContentCatalog();
export const resolveErrorPage = catalog.content.errorPage;
// Existing component tests read these collections synchronously.
export const getFeaturedProjects = (locale: Locale = 'en') => catalog.projects.featured(locale).map((project) => catalog.projects.bySlug(project.slug)!);
export const getVisibleServices = catalog.services.available;
