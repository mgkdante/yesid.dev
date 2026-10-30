// Adapter reads are asynchronous; collections are readonly and missing records return undefined.

import type {
	Project,
	Service,
	BlogPost,
	BlogCategory,
	SiteMeta,
	SiteSeoDefaults,
	Locale,
	AboutContent,
	ContactContent,
	HeroContent,
	HeroAnimContent,
	ManifestoContent,
	ProofReelContent,
	ServicesGridContent,
	AboutIntroContent,
	CloserContent,
	BlockEditorDoc,
	MorphShape,
	LegalPage,
} from '#lib/types.ts';
import type { ErrorPageContent, NavLink } from '#lib/navigation/types.ts';
import type { HeroData } from '#lib/live/index.ts';
import type { PageSeo } from '#lib/schemas/seo.ts';
import type { BlogPageContent, ProjectsPageContent } from '@repo/shared/schemas';

export interface NavPort {
	/**
	 * Read nav-link rows for a placement slot.
	 * Returns rows sorted by `priority` ascending (lower = more prominent).
	 * placement: 'header' | 'footer' | 'mobile' | 'menu'
	 */
	byPlacement(
		placement: 'header' | 'footer' | 'mobile' | 'menu',
	): Promise<readonly NavLink[]>;
}

export interface LegalPort {
	/** All published legal pages, sort order (OPS1: /legal/[slug]). */
	all(): Promise<readonly LegalPage[]>;
	bySlug(slug: string): Promise<LegalPage | undefined>;
}

export interface ContentAdapter {
	projects: ProjectPort;
	services: ServicePort;
	blog: BlogPort;
	meta: MetaPort;
	content: ContentPort;

	nav: NavPort;

	legal: LegalPort;
}

export interface ProjectPort {
	bySlug(slug: string): Promise<Project | undefined>;
	featured(): Promise<readonly Project[]>;
	public(): Promise<readonly Project[]>;
	byService(serviceId: string): Promise<readonly Project[]>;
}

export interface ServicePort {
	byId(id: string): Promise<Service | undefined>;
	visible(): Promise<readonly Service[]>;
	adjacent(id: string): Promise<{ prev?: Service; next?: Service }>;
}

export interface BlogPort {
	all(): Promise<readonly BlogPost[]>;
	bySlug(slug: string): Promise<BlogPost | undefined>;
	bodyBySlug(slug: string): Promise<BlockEditorDoc | null>;
	byCategory(category: BlogCategory): Promise<readonly BlogPost[]>;
	svgContent(post: BlogPost): Promise<string>;
	svgContentsForPosts(
		posts: readonly BlogPost[],
	): Promise<Record<string, string>>;
}

export interface MetaPort {

	site(): Promise<SiteMeta>;

	siteSeoDefaults(): Promise<SiteSeoDefaults>;

	/**
	 * Resolve PageSeo for a route + locale + optional dynamic params.
	 *
	 * Route id is the SvelteKit route pattern from event.route.id
	 * (e.g. '/', '/about', '/blog/[slug]'). Params come from event.params
	 * for dynamic routes. Unknown routes throw — unknown routes are a bug
	 * (a route added without a route-seo-defaults.ts entry), not an expected
	 * state.
	 *
	 * Composer pattern: merges siteMeta + siteSeoDefaults with CMS route_seo
	 * overrides and code-side technical defaults via composePageSeo.
	 *
	 * Returned shape is parsed through PageSeoSchema at the adapter boundary,
	 * so any adapter (static, Directus, mock) can only emit valid SEO.
	 */
	forRoute(
		routeId: string,
		locale: Locale,
		params?: Record<string, string>,
	): Promise<PageSeo>;
}

export interface ContentPort {
	hero(): Promise<HeroContent>;
	heroAnim(): Promise<HeroAnimContent>;
	manifesto(): Promise<ManifestoContent>;
	proofReel(): Promise<ProofReelContent>;
	servicesGrid(): Promise<ServicesGridContent>;
	/** Home-page About teaser — distinct from the /about page (aboutPage below). */
	about(): Promise<AboutIntroContent>;
	closer(): Promise<CloserContent>;
	errorPage(statusCode: number): Promise<ErrorPageContent>;
	/** Full /about page content — distinct from the home-page about teaser. */
	aboutPage(): Promise<AboutContent>;
	contactPage(): Promise<ContactContent>;
	initialHeroData(): Promise<HeroData>;

	blogPage(): Promise<BlogPageContent>;

	projectsPage(): Promise<ProjectsPageContent>;
	/* Hero SVG markup is inlined into SSR HTML from the build-time asset. */
	metroSvg(): Promise<string>;
	/**
	 * The geometric morph-target library (CMS-managed via the
	 * morph_shapes collection). Replaces the hardcoded SHAPES const
	 * in apps/web/src/lib/utils/shapes.ts.
	 */
	morphShapes(): Promise<readonly MorphShape[]>;
}
