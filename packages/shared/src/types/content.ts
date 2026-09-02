import type { BlockEditorDoc } from './blocks';

// Shared type-only contract: this package must not import app-level `$lib` modules.
export type Locale = 'en' | 'fr' | 'es';

// English is required; optional French and Spanish use the centralized locale fallback.
export interface LocalizedString {
	en: string;
	fr?: string;
	es?: string;
}

export interface LocalizedBlockEditorDoc {
	en: BlockEditorDoc;
	fr?: BlockEditorDoc;
	es?: BlockEditorDoc;
}

// A content block inside a service's detail page.
// Same pattern as ProjectSection — separating sections from the main description
// allows rich detail pages without bloating the listing-level fields.
export interface ServiceSection {
	title: LocalizedString;
	content: LocalizedString;
}

// A single content block inside a project's detail page.
// Separating sections from the main description allows long-form case studies
// without bloating the Project summary fields used in listings.
export interface ProjectSection {
	title: LocalizedString;
	content: LocalizedBlockEditorDoc;
}

// Visibility controls which projects surface on the site.
// 'public'  — visible in listings and detail pages
// 'private' — exists in data but never rendered (client work under NDA, etc.)
// 'wip'     — visible but flagged as work-in-progress
export type ProjectStatus = 'public' | 'private' | 'wip';

// Structured impact metric for project cards and the Proof Reel section.
// value is a display string ("30s", "500 GB"), label gives context.
// before is optional — when present, cards show a before→after contrast.
export interface ImpactMetric {
	/** Locale-neutral display value including its unit, such as `30s` or `99.9%`. */
	value: string;
	/** Localized context for the value. */
	label: LocalizedString;
	/** Optional locale-neutral baseline for before-and-after comparisons. */
	before?: string;
}

export interface Project {
	// slug is URL-safe, globally unique, and never localised — it's part of the URL
	slug: string;
	title: LocalizedString;
	// oneLiner is the one-sentence pitch shown in cards and listings
	oneLiner: LocalizedString;
	description: LocalizedBlockEditorDoc;
	// stack and tags are not localised — technology names are universal
	stack: string[];
	tags: string[];
	status: ProjectStatus;
	featured: boolean;
	repoUrl?: string;
	// Detail pages render a
	// non-link "private repo" state instead of a dead 404 link.
	repoPrivate?: boolean;
	liveUrl?: string;
	// Directus file UUID for the primary project thumbnail/hero image
	// (hero_image on the CMS row). Consumers build the URL via asset(image,
	// '<preset>') against PUBLIC_DIRECTUS_URL. Optional light and secondary
	// fields let cards render theme-aware desktop/mobile-style splits without
	// inferring hero meaning from article gallery order.
	image?: string;
	imageLight?: string;
	imageSecondary?: string;
	imageSecondaryLight?: string;
	// Service IDs this project is associated with. SVGs cascade from services.
	// A project can link to 1+ services. IDs must match existing service.id values.
	relatedServices: string[];
	// GitHub raw README URL for auto-import as the last content section.
	// Fetched in SvelteKit load(). Omit if no README should be shown.
	readmeUrl?: string;
	sections: ProjectSection[];
	// Structured impact metric for proof reel / project cards.
	// Optional — not all projects have quantifiable impact yet.
	impactMetric?: ImpactMetric;
	// Multiple impact metrics for the glanceable panel on project detail pages.
	// Falls back to wrapping the single impactMetric if not set.
	impactMetrics?: ImpactMetric[];
	// Hero metadata fields (optional, with sensible defaults).
	// Auto-displayed in the manifesto-style hero edge metadata.
	location?: string;
	environment?: string;
	version?: string;
}

export interface Service {
	// Unique kebab-case identifier for this service. Used as a stable key across
	// components and for linking from projects back to their station.
	id: string;
	title: LocalizedString;
	description: LocalizedString;
	// Sequential position in the train journey (1, 2, 3, ..., N).
	// NOT capped — grows with services.length. No code should assume a maximum.
	// Adding a service means adding one object to services.ts; zero component changes.
	station: number;
	// SVG illustration filename for work page cards and detail pages.
	// Each service gets one SVG that cascades to all linked projects.
	svg?: string;
	// When false, this service is hidden from listings and filters.
	// Allows toggling services on/off without deleting data. Defaults to true.
	visible?: boolean;
	// Slugs of projects to show at this station. Must exist in the projects array.
	relatedProjects: string[];

	subtitle?: LocalizedString;
	longDescription?: LocalizedString;
	valueProposition?: LocalizedString;
	seoDescription?: LocalizedString;
	deliverables?: LocalizedString[];
	stack?: string[];
	sections?: ServiceSection[];

	benefitHeadline?: LocalizedString;
	impactMetric?: { value: LocalizedString; label: LocalizedString };
}

export interface SiteLinks {
	email: string;
	github: string;
	linkedin?: string;
	upwork?: string;
}

export interface SiteAddress {
	locality: string;
	region: string;
	country: string;
}

export interface SiteOwner {
	name: string;
	jobTitle: LocalizedString;
	phone?: string;
	address: SiteAddress;
	knowsAbout: readonly string[];
}

export interface SiteMeta {
	name: string;
	tagline: LocalizedString;
	description: LocalizedString;
	links: SiteLinks;
	owner: SiteOwner;
}

export interface SiteSeoDefaults {
	/** Site-wide OG image fallback when a route has no override. */
	defaultOgImage: string | null;
	/** Value emitted by the theme-color meta tag. */
	themeColor: string;
	/** Description fallback when route and data-layer copy are absent. */
	defaultDescription: LocalizedString;
}

export interface RouteSeoOverride {
	/** Canonical route path beginning with `/`. */
	path: string;
	/** Route image override; null falls back to `SiteSeoDefaults.defaultOgImage`. */
	ogImage: string | null;
	/** Title body without the brand suffix; null uses the code-owned fallback. */
	title: LocalizedString | null;
	/** Null falls back to `SiteSeoDefaults.defaultDescription`. */
	description: LocalizedString | null;
}

// Blog content categories. Professional is the default brand-facing lane.
// Personal is a warmer "off the clock" section with different accent color.
export type BlogCategory = 'professional' | 'personal';

// SVG animation types available for blog post illustrations.
// Each is drawing motion (doctrine-compatible on enter per D266).
// The pure 'stagger' fade-up variant was cut in 17e-5 (D267 F).
export type BlogAnimation = 'draw' | 'morph' | 'draw-fill';

export interface BlogPost {
	// Stable identity shared by every language variant of the same article.
	translationKey: string;
	slug: string;
	// Each blog row owns one language, so title/excerpt stay flat strings.
	title: string;
	excerpt: string;
	// ISO date string (YYYY-MM-DD)
	date: string;
	// Optional last-updated date for Article/BlogPosting structured data.
	dateModified?: string;
	// Language of this row. Translated rows share translationKey.
	lang: Locale;
	// Which content lane this post belongs to
	category: BlogCategory;
	tags: string[];
	// Which GSAP animation plays on this post's SVG illustration
	animation: BlogAnimation;
	// Resolved path to the SVG illustration (custom or fallback)
	svg: string;
	// URL to the full post — internal (/blog/slug) or external (LinkedIn)
	url: string;
	// Whether the post is hosted externally (opens in new tab)
	external: boolean;
	// Optional per-post SEO override fields authored in the CMS.
	// seoTitle is the title body; the site appends the brand suffix.
	seoTitle?: string;
	seoDescription?: string;
	// Optional Directus file UUID for OG/Twitter image output.
	coverImage?: string;
	coverImageAlt?: string;
}

// --- About page types ---
// Full-page bento dashboard for /about. All content is data-driven and
// cloud-ready: swap placeholder values in about-page.ts for real content
// later with zero component changes.

// A polaroid-style photo in the personality section.
// rotate controls the slight tilt angle for the stacked look.
export interface AboutPolaroid {
	src: string;
	alt: LocalizedString;
	caption: LocalizedString;
	rotate: number; // degrees of tilt, -5 to 5
}

// The hero identity block: headshot, name, title, value proposition.
export interface AboutIdentity {
	name: LocalizedString;
	title: LocalizedString;
	valueProp: LocalizedString;
	headshot: string;
	polaroids: readonly AboutPolaroid[];
}

// A single stat counter in the metrics row (e.g. "12+ databases shipped").
// value is a string for flexible formatting ("12+", "3x", "99%").
export interface AboutMetric {
	value: string;
	label: LocalizedString;
	icon?: string;
}

// One step in the named methodology (Audit → Optimize → Document → Handoff).
// station ties into the metro visual language.
export interface AboutMethodStep {
	id: string;
	label: LocalizedString;
	description: LocalizedString;
	station: number;
}

// A client testimonial with specific outcome.
export interface AboutTestimonial {
	quote: LocalizedString;
	author: string;
	role: LocalizedString;
	company: string;
	logo?: string;
}

export interface AboutLanguage {
	id: 'quebec' | 'canada' | 'colombia' | string;
	label: LocalizedString;
	image: string;
}

// An interest displayed as a diagonal strip with background image.
// image is B&W by default, turns color on hover via CSS filter.
export interface AboutInterest {
	id: string;
	label: LocalizedString;
	image: string; // path to background image (static/images/about/interests/)
}

export interface AboutEducationItem {
	school: LocalizedString;
	program: LocalizedString;
	icon: 'champlain' | 'bishops';
}

/** Icon render priority is `svg_override`, then `iconify_id`, then the placeholder. */
export interface IconRecord {
	id: string;
	name: string;
	iconify_id: string | null;
	svg_override: string | null; // directus_files UUID
}

export interface TechStackItem {
	id: string;
	name: string;
	icon: IconRecord | null;
	what_it_is: LocalizedBlockEditorDoc;
	what_i_use_it_for: LocalizedBlockEditorDoc;
	why_i_use_it_instead: LocalizedBlockEditorDoc;
	relatedServices: string[];
	relatedProjects: string[];
	layer?: 'interface' | 'logic' | 'data' | 'infra';
	enables?: LocalizedString;
}

// Weather + location widget. The weather reveals the location.
// Wordplay header leads the visitor to discover where you're based.
export interface AboutWeatherConfig {
	city: LocalizedString;
	hook: LocalizedString; // wordplay: "Where am I?" / "Home Base"
	enabled: boolean;
}

// CTA block — terminal style.
export interface AboutCta {
	command: string; // "$ yesid --contact"
	lines: readonly { text: string; color: 'orange' | 'muted' | 'accent' }[];
	buttonLabel: LocalizedString;
	buttonHref: string;
	socials: readonly { label: string; href: string; icon: string }[];
}

export interface AboutStopLabels {
	identity: LocalizedString;
	metrics: LocalizedString;
	testimonials: LocalizedString;
	process: LocalizedString;
	stack: LocalizedString;
	clients: LocalizedString;
	interests: LocalizedString;
	snapshots: LocalizedString;
	location: LocalizedString;
	next: LocalizedString;
}

export interface AboutLabels {
	polaroidPrevAria: LocalizedString;
	polaroidNextAria: LocalizedString;
	testimonialsCarouselAria: LocalizedString;
	testimonialsTabNavAria: LocalizedString;
	testimonialsPrevAria: LocalizedString;
	testimonialsNextAria: LocalizedString;
	/** Template: placeholders {index} + {total}. */
	testimonialSlideAria: LocalizedString;
	/** Template: placeholder {index}. */
	showTestimonialAria: LocalizedString;
}

export interface PageMeta {
	title: LocalizedString;
	description: LocalizedString;
}

// Top-level container for all About page content.
// Components receive this via props — they never import content directly.
export interface AboutContent {
	identity: AboutIdentity;
	metrics: readonly AboutMetric[];
	methodology: readonly AboutMethodStep[];
	testimonials: readonly AboutTestimonial[];
	languages: readonly AboutLanguage[];
	education: readonly AboutEducationItem[];
	interests: readonly AboutInterest[];
	weather: AboutWeatherConfig;
	cta: AboutCta;
	stopLabels: AboutStopLabels;
	labels: AboutLabels;
	meta: PageMeta;
}

// --- Contact page types ---

export interface ContactTerminalField {
	label: LocalizedString;
	placeholder: LocalizedString;
}

export interface ContactInfoTerminal {
	title: string;
	command: string;
	location: LocalizedString;
	responseTime: LocalizedString;
	languages: LocalizedString;
	bestFit?: readonly LocalizedString[];
	sectionLabels: {
		location: LocalizedString;
		connect: LocalizedString;
		languages: LocalizedString;
		bestFit?: LocalizedString;
	};
}

export interface ContactFormTerminal {
	title: string;
	command: string;
	commandOutput: LocalizedString;
	fields: {
		name: ContactTerminalField;
		email: ContactTerminalField;
		message: ContactTerminalField;
	};
	submitLabel: LocalizedString;
	bookingPrompt: LocalizedString;
	bookingButtonLabel: LocalizedString;
}

export interface ContactValidation {
	required: LocalizedString;
	invalidEmail: LocalizedString;
	errorSummary: LocalizedString;
}

export interface ContactSuccess {
	validating: LocalizedString;
	sending: LocalizedString;
	sent: LocalizedString;
	responseTime: LocalizedString;
	meanwhile: LocalizedString;
	resetLabel: LocalizedString;
	fieldOk: LocalizedString; // "OK" — used in "✓ {field}: OK"
	workLinkLabel: LocalizedString;
	blogLinkLabel: LocalizedString;
}

export interface ContactContent {
	pageTitle: LocalizedString;
	stationLabel: LocalizedString;
	sendErrorMessage: LocalizedString;
	meta: PageMeta;
	infoTerminal: ContactInfoTerminal;
	formTerminal: ContactFormTerminal;
	validation: ContactValidation;
	success: ContactSuccess;
	socials: readonly { label: LocalizedString; href: string; icon: string }[];
	web3formsKey: string; // Public access key — safe to expose client-side
}

export interface LegalPage {
	slug: string;
	title: LocalizedString;
	body: LocalizedBlockEditorDoc;
}

// NOTE: `PageSeo` and `SchemaOrgNode` are defined in apps/web/src/lib/schemas/seo.ts
// via Zod and stay there (apps/web specific). They are re-exported from
// apps/web/src/lib/types.ts alongside these shared types so consumer code keeps
// a single import surface.

export interface PreviewContext {
	locale?: Locale;

	/**
	 * Optional request-scoped memo for adapters that support page-fetch deduplication.
	 * Omitting it disables that deduplication.
	 * `unknown` prevents an upward import into schemas that depend on this package.
	 */
	pageCache?: Map<string, Promise<unknown>>;
}

export interface HeroContent {
	headline: {
		line1: LocalizedString;
		line2: LocalizedString;
		/** Completes the animated visual headline for assistive technology. */
		ariaSuffix: LocalizedString;
	};
	subheadline: LocalizedString;
	subtitle: LocalizedString;
	identity: LocalizedString;
	ctaWork: LocalizedString;
	ctaContact: LocalizedString;
	sqlPanel: {
		prompt: LocalizedString;
		liveLabel: LocalizedString;
		liveBadge: LocalizedString;
		columns: {
			route: LocalizedString;
			avgDelayS: LocalizedString;
			vehicles: LocalizedString;
		};
		metaTemplate: LocalizedString;
	};
	refreshButton: {
		label: LocalizedString;
		helper: LocalizedString;
		helperLive: LocalizedString;
	};
	heroAnim: HeroAnimContent;
}

export interface HeroAnimContent {
	scrollDown: LocalizedString;
}

export interface ManifestoContent {
	statement: {
		line1: LocalizedString;
		lineHuge: LocalizedString;
		line3Part1: LocalizedString;
		line3Highlight: LocalizedString;
		line3Part2: LocalizedString;
	};
	terminal: {
		user: LocalizedString;
		command: LocalizedString;
	};
	pills: readonly { label: LocalizedString; serviceId: string }[];
	edgeLeft: {
		sectionNumber: LocalizedString;
		sectionName: LocalizedString;
		location: LocalizedString;
	};
	edgeRight: {
		lat: LocalizedString;
		lng: LocalizedString;
		src: LocalizedString;
		via: LocalizedString;
		dst: LocalizedString;
		node: LocalizedString;
		status: LocalizedString;
	};
	edgeBottom: {
		connected: LocalizedString;
		line: LocalizedString;
		url: LocalizedString;
		version: LocalizedString;
		scrollHint: LocalizedString;
	};
	transit: {
		arrivalLabel: LocalizedString;
		platformBadge: LocalizedString;
		directionBadge: LocalizedString;
	};
	ticks: readonly string[];
	hiddenTransitLines: readonly { name: LocalizedString; color: string }[];
}

export interface ProofReelContent {
	heading: LocalizedString;
	headingDot: LocalizedString;
	subheading: LocalizedString;
	sectionLabel: LocalizedString;
	viewAllLabel: LocalizedString;
	viewAllHref: string;
	/** Aria-label template containing the `{title}` placeholder. */
	toggleColorAria: LocalizedString;
}

export interface ServicesGridContent {
	heading: LocalizedString;
	headingDot: LocalizedString;
	subheading: LocalizedString;
	/** Aria-label template containing the `{title}` placeholder. */
	viewIllustrationAria: LocalizedString;
	viewAllLink: LocalizedString;
}

export interface AboutIntroContent {
	name: LocalizedString;
	title: LocalizedString;
	bio: LocalizedString;
	moreLink: LocalizedString;
	stackLabel: LocalizedString;
	stackItems: readonly string[];
	locationLabel: LocalizedString;
	location: {
		city: LocalizedString;
		region: LocalizedString;
	};
	interestsLabel: LocalizedString;
	interests: LocalizedString;
}

export interface CtaContent {
	heading: LocalizedString;
	subtitle: LocalizedString;
	ctaContact: LocalizedString;
	ctaGithub: LocalizedString;
}

export interface CloserContent {
	heading: LocalizedString;
	headingDot: LocalizedString;
	subheading: LocalizedString;
	cta: {
		label: LocalizedString;
		href: string;
	};
	rows: {
		stack: { label: LocalizedString; description: LocalizedString; action: LocalizedString };
		contact: { label: LocalizedString; description: LocalizedString; action: LocalizedString };
		connect: { label: LocalizedString; description: LocalizedString; action: LocalizedString };
		read: { label: LocalizedString; description: LocalizedString; action: LocalizedString };
		about: { label: LocalizedString; description: LocalizedString; action: LocalizedString };
	};
	attribution: {
		text: LocalizedString;
		url: string;
	};
	terminal: {
		title: LocalizedString;
		city: LocalizedString;
		encoding: LocalizedString;
		/** Footer label template containing the `{count}` placeholder. */
		destinationsLabel: LocalizedString;
		prompt: LocalizedString;
	};
}

// ---------------------------------------------------------------------------
// Morph shapes (geometric morph-target library — slice-18 18f)
// ---------------------------------------------------------------------------
//
// Replaces the hardcoded SHAPES const in apps/web/src/lib/utils/shapes.ts.
// Editors add/remove shapes via Data Studio; consumers read from the
// adapter (cached module-level after first fetch).
//
// Schema lives in apps/cms/directus/snapshot/collections/morph_shapes.json
// (Phase 4 work). Used by the Block Editor world's morph-hover animations.

export interface MorphShape {
	id: string;
	label: string;
	path: string;     // SVG path d= attribute, e.g. "M24 8 L40 38 L8 38 Z"
	viewbox: string;  // default "0 0 48 48"
	sort: number;
}

// ---------------------------------------------------------------------------
// Media variants (responsive image pipeline — consolidation-deploy-honesty)
// ---------------------------------------------------------------------------
//
// Width/format variants of the mirrored static media assets, generated at
// export time (apps/cms/scripts/lib/media-variants.ts, sharp) and committed
// alongside the originals. The generated media-variants.ts module maps each
// original static path to its intrinsic dimensions + the webp variant set;
// the web asset helper composes srcset/width/height from it.

/** One generated variant file: rendered width + static path (webp). */
export interface MediaVariantSource {
	width: number;
	path: string;
}

/** Variant record for one mirrored asset, keyed by its original static path. */
export interface MediaVariantEntry {
	/** Intrinsic pixel size of the ORIGINAL asset (for width/height attrs). */
	width: number;
	height: number;
	/** webp variants, ascending width. The original file stays the src fallback. */
	variants: readonly MediaVariantSource[];
}

// ---------------------------------------------------------------------------
// Navigation types (moved from apps/web/src/lib/navigation/types.ts —
// site-hardening-a-plus)
// ---------------------------------------------------------------------------
//
// The nav/menu/error-page shapes are CMS contracts (the cms nav fetcher emits
// them, the web nav components consume them), so they live here with the rest
// of the content contract. apps/web/src/lib/navigation/types.ts re-exports
// them for existing importers.

export interface NavLink {
	label: LocalizedString;
	href: string;
	priority: 1 | 2;
	subtitle?: LocalizedString;
	icon?: string;
}

export type MenuItem = NavLink;

export interface ErrorPageContent {
	label: LocalizedString;
	heading: LocalizedString;
	description: LocalizedString;
	terminalLine: string;
	suggestions: readonly { label: LocalizedString; href: string }[];
}
