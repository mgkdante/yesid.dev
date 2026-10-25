// Adapter contract. Defines every read the app makes against the content layer.
// Any backend (Directus, Keystatic, mock, static files) implements this
// interface; the single `as adapter` re-export in index.ts picks the active one.
//
// Signature rules codified in Slice 17b:
//   - Every method is async (`Promise<T>`) — CMS-ready from day one.
//   - Collections return `readonly T[]` — adapters don't promise mutability.
//   - Not-found returns `undefined`, never `null` — matches TypeScript idiom.
//
// Typing strategy for the ContentPort (18c Task 42 — F4):
//   Every home-page block has a named interface in @repo/shared/types
//   (HeroContent, ManifestoContent, ProofReelContent, etc.) so the port
//   contract is self-describing and reviewable as a list of types instead of
//   an implicit tuple hidden inside typeof import() calls.
//
//   Static adapter's `as const` objects structurally widen to these interfaces;
//   Directus adapter parses inbound M2A block rows through the matching Zod
//   schema (post-18i). The `: ContentAdapter` annotation on the composite
//   export in adapters/index.ts is the compile-time gate.

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
	CtaContent,
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
	/** Nav sub-port — reads nav_links by placement slot. Added in slice-18i Phase 5. */
	nav: NavPort;
	/** Legal-pages sub-port (OPS1 launch Phase 1). */
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
	/**
	 * Brand identity (slice-18 18h Q9 amendment): name, tagline, description,
	 * links, owner. CMS-backed via `site_meta` singleton (directus adapter)
	 * with the same TS shape as before — pre-existing consumers (jsonLd
	 * factories, Footer, About) are unaffected.
	 */
	site(): Promise<SiteMeta>;

	/**
	 * Site-wide SEO defaults (slice-18 18h Q9): defaultOgImage UUID, themeColor
	 * hex, defaultDescription. Backed by the same `site_meta` singleton row
	 * via shared internal `fetchSingletonRow()` helper + WeakMap memo on the
	 * raw row — calling both `site()` and `siteSeoDefaults()` in the same
	 * request triggers ONE CMS round-trip.
	 */
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
	cta(): Promise<CtaContent>;
	closer(): Promise<CloserContent>;
	errorPage(statusCode: number): Promise<ErrorPageContent>;
	/** Full /about page content — distinct from the home-page about teaser. */
	aboutPage(): Promise<AboutContent>;
	contactPage(): Promise<ContactContent>;
	initialHeroData(): Promise<HeroData>;
	/** /blog page chrome — block_blog_page_content (added slice-18i Phase 7). */
	blogPage(): Promise<BlogPageContent>;
	/** /projects page chrome — block_projects_page_content (added slice-18i Phase 7). */
	projectsPage(): Promise<ProjectsPageContent>;
	/**
	 * Inlined SVG markup for the Montreal-metro hero animation.
	 *
	 * Slice 18d Phase 8: source flipped from a Vite `?raw` build-time import
	 * to a Directus-fetched asset (`/assets/<uuid>`) via the assets id-map.
	 * The result is consumed by MetroNetwork.svelte through SSR `+page.server.ts`
	 * load and inlined as raw HTML so it remains a valid LCP candidate.
	 */
	metroSvg(): Promise<string>;
	/**
	 * The geometric morph-target library (CMS-managed via the
	 * morph_shapes collection). Replaces the hardcoded SHAPES const
	 * in apps/web/src/lib/utils/shapes.ts.
	 */
	morphShapes(): Promise<readonly MorphShape[]>;
}
