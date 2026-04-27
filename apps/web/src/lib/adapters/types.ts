// Adapter contract. Defines every read the app makes against the content layer.
// Any backend (Directus, Keystatic, mock, static files) implements this
// interface; the single `as adapter` re-export in index.ts picks the active one.
//
// Signature rules codified in Slice 17b (see ARCHITECTURE.md once it lands):
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
	HeroContent,
	HeroAnimContent,
	ManifestoContent,
	ProofReelContent,
	ServicesGridContent,
	AboutIntroContent,
	CtaContent,
	CloserContent,
	SkillsJourneyCtaContent,
	PreviewContext,
	BlockEditorDoc,
	MorphShape,
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

// Every port method accepts an optional trailing `ctx?: PreviewContext` so
// preview routes (D6, post-Slice-18) can thread share tokens through the
// adapter boundary. TS allows implementations to omit trailing optional
// params, so the static adapter keeps its current arrow-function signatures.

export interface ProjectPort {
	all(ctx?: PreviewContext): Promise<readonly Project[]>;
	bySlug(slug: string, ctx?: PreviewContext): Promise<Project | undefined>;
	featured(ctx?: PreviewContext): Promise<readonly Project[]>;
	public(ctx?: PreviewContext): Promise<readonly Project[]>;
	byService(serviceId: string, ctx?: PreviewContext): Promise<readonly Project[]>;
	allTags(ctx?: PreviewContext): Promise<readonly string[]>;
	allStackItems(ctx?: PreviewContext): Promise<readonly string[]>;
	serviceIdsForProjects(ctx?: PreviewContext): Promise<readonly string[]>;
}

export interface ServicePort {
	all(ctx?: PreviewContext): Promise<readonly Service[]>;
	byId(id: string, ctx?: PreviewContext): Promise<Service | undefined>;
	visible(ctx?: PreviewContext): Promise<readonly Service[]>;
	adjacent(id: string, ctx?: PreviewContext): Promise<{ prev?: Service; next?: Service }>;
}

export interface BlogPort {
	all(ctx?: PreviewContext): Promise<readonly BlogPost[]>;
	bySlug(slug: string, ctx?: PreviewContext): Promise<BlogPost | undefined>;
	html(slug: string, ctx?: PreviewContext): Promise<string>;
	bodyBySlug(slug: string, ctx?: PreviewContext): Promise<BlockEditorDoc | null>;
	byCategory(category: BlogCategory, ctx?: PreviewContext): Promise<readonly BlogPost[]>;
	byTag(
		category: BlogCategory,
		tag: string,
		ctx?: PreviewContext,
	): Promise<readonly BlogPost[]>;
	tagsForCategory(category: BlogCategory, ctx?: PreviewContext): Promise<readonly string[]>;
	languagesForCategory(category: BlogCategory, ctx?: PreviewContext): Promise<readonly Locale[]>;
	latest(
		count: number,
		category?: BlogCategory,
		ctx?: PreviewContext,
	): Promise<readonly BlogPost[]>;
	svgContent(post: BlogPost, ctx?: PreviewContext): Promise<string>;
	svgContentsForPosts(
		posts: readonly BlogPost[],
		ctx?: PreviewContext,
	): Promise<Record<string, string>>;
	resolveSvgFallbackName(
		slug: string,
		category: BlogCategory,
		ctx?: PreviewContext,
	): Promise<string>;
	resolveAnimation(
		slug: string,
		explicit: string | undefined,
		ctx?: PreviewContext,
	): Promise<BlogAnimation>;
}

export interface MetaPort {
	site(ctx?: PreviewContext): Promise<SiteMeta>;
	/**
	 * Resolve PageSeo for a route + locale + optional dynamic params.
	 *
	 * Route id is the SvelteKit route pattern from event.route.id
	 * (e.g. '/', '/about', '/blog/[slug]'). Params come from event.params
	 * for dynamic routes. Unknown routes throw — unknown routes are a bug
	 * (a route added without a content/meta.ts entry), not an expected state.
	 *
	 * Returned shape is parsed through PageSeoSchema at the adapter boundary,
	 * so any adapter (static, Directus, mock) can only emit valid SEO.
	 */
	forRoute(
		routeId: string,
		locale: Locale,
		params?: Record<string, string>,
		ctx?: PreviewContext,
	): Promise<PageSeo>;
}

export interface TechStackPort {
	all(ctx?: PreviewContext): Promise<readonly TechStackItem[]>;
	byId(id: string, ctx?: PreviewContext): Promise<TechStackItem | undefined>;
	byLayer(layer: InfraLayer, ctx?: PreviewContext): Promise<readonly TechStackItem[]>;
	byDomain(domain: DomainCluster, ctx?: PreviewContext): Promise<readonly TechStackItem[]>;
	connections(id: string, ctx?: PreviewContext): Promise<readonly string[]>;
	incomingConnections(id: string, ctx?: PreviewContext): Promise<readonly string[]>;
	outgoingRelations(id: string, ctx?: PreviewContext): Promise<readonly TechRelation[]>;
	incomingRelations(id: string, ctx?: PreviewContext): Promise<readonly TechRelation[]>;
	content(id: string, ctx?: PreviewContext): Promise<string>;
	allScenarios(ctx?: PreviewContext): Promise<readonly StackScenario[]>;
	scenarioForDomains(
		domains: DomainCluster[],
		ctx?: PreviewContext,
	): Promise<StackScenario | undefined>;
}

export interface ContentPort {
	hero(ctx?: PreviewContext): Promise<HeroContent>;
	heroAnim(ctx?: PreviewContext): Promise<HeroAnimContent>;
	manifesto(ctx?: PreviewContext): Promise<ManifestoContent>;
	proofReel(ctx?: PreviewContext): Promise<ProofReelContent>;
	servicesGrid(ctx?: PreviewContext): Promise<ServicesGridContent>;
	/** Home-page About teaser — distinct from the /about page (aboutPage below). */
	about(ctx?: PreviewContext): Promise<AboutIntroContent>;
	cta(ctx?: PreviewContext): Promise<CtaContent>;
	closer(ctx?: PreviewContext): Promise<CloserContent>;
	skillsJourneyPanels(ctx?: PreviewContext): Promise<readonly JourneyPanel[]>;
	skillsJourneyCta(ctx?: PreviewContext): Promise<SkillsJourneyCtaContent>;
	navLinks(ctx?: PreviewContext): Promise<readonly NavLink[]>;
	menuItems(ctx?: PreviewContext): Promise<readonly MenuItem[]>;
	metroBookends(ctx?: PreviewContext): Promise<MetroBookends>;
	errorPage(ctx?: PreviewContext): Promise<ErrorPageContent>;
	/** Full /about page content — distinct from the home-page about teaser. */
	aboutPage(ctx?: PreviewContext): Promise<AboutContent>;
	contactPage(ctx?: PreviewContext): Promise<ContactContent>;
	techStackPage(ctx?: PreviewContext): Promise<TechStackPageContent>;
	heroMock(ctx?: PreviewContext): Promise<HeroData>;
	initialHeroData(ctx?: PreviewContext): Promise<HeroData>;
	/**
	 * Inlined SVG markup for the Montreal-metro hero animation.
	 *
	 * Slice 18d Phase 8: source flipped from a Vite `?raw` build-time import
	 * to a Directus-fetched asset (`/assets/<uuid>`) via the assets id-map.
	 * The result is consumed by MetroNetwork.svelte through SSR `+page.server.ts`
	 * load and inlined via `{@html}` so it remains a valid LCP candidate.
	 */
	metroSvg(ctx?: PreviewContext): Promise<string>;
	/**
	 * The geometric morph-target library (CMS-managed via the
	 * morph_shapes collection). Replaces the hardcoded SHAPES const
	 * in apps/web/src/lib/utils/shapes.ts.
	 */
	morphShapes(ctx?: PreviewContext): Promise<readonly MorphShape[]>;
}
