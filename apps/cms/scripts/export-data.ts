/**
 * Shared ExportData type re-exported so the emitters under
 * `apps/cms/scripts/lib/emitters/` can import it without a circular dep on
 * the export-fallbacks.ts orchestrator.
 */

import type { BlockEditorDoc, MediaVariantEntry, SitePage } from '@repo/shared';
import type { StackArchetype, SiteLabels } from '@repo/shared/schemas';
import type { RouteSeoOverride } from '@repo/shared';
import type {
	SiteMeta,
	SiteSeoDefaults,
	MorphShape,
	ErrorPageContent,
	BlogPost,
	Service,
	Project,
	TechStackItem,
} from '@repo/shared';
import type {
	BlogPageContent,
	ProjectsPageContent,
	TechStackPageContent,
	ContactContent,
	HeroContent,
	ManifestoContent,
	ProofReelContent,
	ServicesGridContent,
	AboutIntroContent,
	CtaContent,
	CloserContent,
	AboutContent,
} from '@repo/shared';
import type { NavData } from './lib/fetchers/nav';

export interface ExportData {
	siteMeta?: SiteMeta;
	siteSeoDefaults?: SiteSeoDefaults;
	routeSeo?: readonly RouteSeoOverride[];
	morphShapes?: readonly MorphShape[];
	errorPageFallback?: ErrorPageContent;
	/** All published error_pages rows keyed by status_code. Used to emit error-pages.ts. */
	errorPages?: Record<number, ErrorPageContent>;
	nav?: NavData;
	/**
	 * Published site_pages registry rows (slice-26.1). Absence of a path from
	 * this array IS the hidden signal — route gate 404s, sitemap drops it.
	 */
	sitePages?: readonly SitePage[];
	blogPosts?: readonly BlogPost[];
	/** Block Editor `body` per published post, keyed by slug. Powers static blog.bodyBySlug + blog.html. */
	blogBodies?: Record<string, BlockEditorDoc>;
	services?: readonly Service[];
	projects?: readonly Project[];
	techStack?: readonly TechStackItem[];
	/**
	 * Published stack_archetypes rows (slice-29 Tech Stack Engine) — goal
	 * recipes whose layered tech links draw the /tech-stack blueprint.
	 */
	stackArchetypes?: readonly StackArchetype[];
	/**
	 * Global UI microcopy (go2-t1c): aria labels, card markers, edge titles,
	 * email templates from the site_labels singleton.
	 */
	siteLabels?: SiteLabels;
	blogPage?: BlogPageContent;
	projectsPage?: ProjectsPageContent;
	techStackPage?: TechStackPageContent;
	contactPage?: ContactContent;
	hero?: HeroContent;
	manifesto?: ManifestoContent;
	proofReel?: ProofReelContent;
	servicesGrid?: ServicesGridContent;
	aboutIntro?: AboutIntroContent;
	cta?: CtaContent;
	closer?: CloserContent;
	aboutPage?: AboutContent;
	mediaAssets?: Readonly<Record<string, string>>;
	/**
	 * Responsive variants of the mirrored raster assets, keyed by original
	 * static path. Built locally (sharp) alongside the variant files
	 * themselves; see lib/media-variants.ts.
	 */
	mediaVariants?: Readonly<Record<string, MediaVariantEntry>>;
}
