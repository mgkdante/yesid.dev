// Adapter contract. Defines every read the app makes against the content layer.
// Any new backend (Payload, Keystatic, mock) implements this interface; the
// single `as adapter` re-export in index.ts picks the active one.
//
// Signature rules codified in Slice 17b (see ARCHITECTURE.md once it lands):
//   - Every method is async (`Promise<T>`) — Payload-ready from day one.
//   - Collections return `readonly T[]` — adapters don't promise mutability.
//   - Not-found returns `undefined`, never `null` — matches TypeScript idiom.
//
// Typing strategy for the ContentPort:
//   The site-content fields are plain object literals whose shapes would be
//   tedious to duplicate here. `typeof import('...').x` binds the port type
//   directly to the content file — when a field is added to heroContent, the
//   port signature follows automatically. Future adapters must return the
//   same shape, enforced by TypeScript at the `: ContentAdapter` annotation.

import type {
	Project,
	Service,
	BlogPost,
	BlogCategory,
	BlogAnimation,
	SiteMeta,
	TechStackItem,
	InfraLayer,
	DomainCluster,
	StackScenario,
	TechRelation,
	Locale,
	AboutContent,
	ContactContent,
	JourneyPanel,
} from '$lib/types';
import type { ErrorPageContent, NavLink, MenuItem, MetroBookends } from '$lib/content/nav';
import type { HeroData } from '$lib/content/hero-data';
import type { PageSeo } from '$lib/schemas/seo';
import type { TechStackPageContent } from '$lib/schemas/tech-stack-page';

export interface ContentAdapter {
	projects: ProjectPort;
	services: ServicePort;
	blog: BlogPort;
	meta: MetaPort;
	techStack: TechStackPort;
	content: ContentPort;
}

export interface ProjectPort {
	all(): Promise<readonly Project[]>;
	bySlug(slug: string): Promise<Project | undefined>;
	featured(): Promise<readonly Project[]>;
	public(): Promise<readonly Project[]>;
	byService(serviceId: string): Promise<readonly Project[]>;
	allTags(): Promise<readonly string[]>;
	allStackItems(): Promise<readonly string[]>;
	serviceIdsForProjects(): Promise<readonly string[]>;
}

export interface ServicePort {
	all(): Promise<readonly Service[]>;
	byId(id: string): Promise<Service | undefined>;
	visible(): Promise<readonly Service[]>;
	adjacent(id: string): Promise<{ prev?: Service; next?: Service }>;
}

export interface BlogPort {
	all(): Promise<readonly BlogPost[]>;
	bySlug(slug: string): Promise<BlogPost | undefined>;
	html(slug: string): Promise<string>;
	byCategory(category: BlogCategory): Promise<readonly BlogPost[]>;
	byTag(category: BlogCategory, tag: string): Promise<readonly BlogPost[]>;
	tagsForCategory(category: BlogCategory): Promise<readonly string[]>;
	languagesForCategory(category: BlogCategory): Promise<readonly Locale[]>;
	latest(count: number, category?: BlogCategory): Promise<readonly BlogPost[]>;
	svgContent(post: BlogPost): Promise<string>;
	svgContentsForPosts(posts: readonly BlogPost[]): Promise<Record<string, string>>;
	resolveSvgFallbackName(slug: string, category: BlogCategory): Promise<string>;
	resolveAnimation(slug: string, explicit: string | undefined): Promise<BlogAnimation>;
}

export interface MetaPort {
	site(): Promise<SiteMeta>;
	/**
	 * Resolve PageSeo for a route + locale + optional dynamic params.
	 *
	 * Route id is the SvelteKit route pattern from event.route.id
	 * (e.g. '/', '/about', '/blog/[slug]'). Params come from event.params
	 * for dynamic routes. Unknown routes throw — unknown routes are a bug
	 * (a route added without a content/meta.ts entry), not an expected state.
	 *
	 * Returned shape is parsed through PageSeoSchema at the adapter boundary,
	 * so any adapter (static, Payload, mock) can only emit valid SEO.
	 */
	forRoute(routeId: string, locale: Locale, params?: Record<string, string>): Promise<PageSeo>;
}

export interface TechStackPort {
	all(): Promise<readonly TechStackItem[]>;
	byId(id: string): Promise<TechStackItem | undefined>;
	byLayer(layer: InfraLayer): Promise<readonly TechStackItem[]>;
	byDomain(domain: DomainCluster): Promise<readonly TechStackItem[]>;
	connections(id: string): Promise<readonly string[]>;
	incomingConnections(id: string): Promise<readonly string[]>;
	outgoingRelations(id: string): Promise<readonly TechRelation[]>;
	incomingRelations(id: string): Promise<readonly TechRelation[]>;
	content(id: string): Promise<string>;
	allScenarios(): Promise<readonly StackScenario[]>;
	scenarioForDomains(domains: DomainCluster[]): Promise<StackScenario | undefined>;
}

export interface ContentPort {
	hero(): Promise<typeof import('$lib/content/site-content').heroContent>;
	heroAnim(): Promise<typeof import('$lib/content/site-content').heroAnimContent>;
	manifesto(): Promise<typeof import('$lib/content/site-content').manifestoContent>;
	proofReel(): Promise<typeof import('$lib/content/site-content').proofReelContent>;
	servicesGrid(): Promise<typeof import('$lib/content/site-content').servicesGridContent>;
	about(): Promise<typeof import('$lib/content/site-content').aboutContent>;
	cta(): Promise<typeof import('$lib/content/site-content').ctaContent>;
	closer(): Promise<typeof import('$lib/content/site-content').closerContent>;
	skillsJourneyPanels(): Promise<readonly JourneyPanel[]>;
	skillsJourneyCta(): Promise<typeof import('$lib/content/site-content').skillsJourneyCta>;
	navLinks(): Promise<readonly NavLink[]>;
	menuItems(): Promise<readonly MenuItem[]>;
	metroBookends(): Promise<MetroBookends>;
	errorPage(): Promise<ErrorPageContent>;
	aboutPage(): Promise<AboutContent>;
	contactPage(): Promise<ContactContent>;
	techStackPage(): Promise<TechStackPageContent>;
	heroMock(): Promise<HeroData>;
	initialHeroData(): Promise<HeroData>;
}
