// Types are the contract between data and UI.
// Every component that renders text goes through these interfaces.
// Define once here; change here if requirements evolve.
//
// This file originally lived at apps/web/src/lib/types.ts; extracted to
// @repo/shared in slice-18 18c Task 14 so apps/web (SvelteKit consumer)
// and apps/cms (Directus seed scripts) can share one source of truth.
//
// Per D14: packages/shared is type-only + Zod. No runtime helpers, no
// app-specific imports (no $lib aliases; those stay in apps/web).

import type { BlockEditorDoc } from './blocks';

// Supported locale codes. English is always required; French and Spanish are optional.
// Adding a new locale means adding it here first, then the data files and resolver.
export type Locale = 'en' | 'fr' | 'es';

// The core i18n primitive. English is guaranteed; other locales are filled in over time.
// Components never read localizedString.en directly — they call resolveLocale() so fallback
// logic is centralised in one place rather than scattered across the UI.
export interface LocalizedString {
	en: string;
	fr?: string;
	es?: string;
}

// A localized Block Editor document. Mirrors LocalizedString's locale shape
// but each value is a BlockEditorDoc (Editor.js JSON) instead of a plain string.
// English is required; French and Spanish are filled in over time.
// Introduced in slice-18 18f Phase 11 Task 78 (#41) for Project.description
// and ProjectSection.content — the first fields to migrate from plain text
// to rich Block Editor content per locale.
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
	/** Block Editor JSON per locale (#41). Migrated from LocalizedString in Task 78. */
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
	/** Numeric display, e.g. "30s", "99.9%" — bare string: numbers + units are locale-universal. */
	value: string;
	/** Human copy, e.g. "Real-time refresh cycles" — upgraded to LocalizedString in Task 17b-6. */
	label: LocalizedString;
	/** Before-value comparison, e.g. "2 days". Bare string — same rationale as `value`. */
	before?: string;
}

export interface Project {
	// slug is URL-safe, globally unique, and never localised — it's part of the URL
	slug: string;
	title: LocalizedString;
	// oneLiner is the one-sentence pitch shown in cards and listings
	oneLiner: LocalizedString;
	/** Block Editor JSON per locale (#41). Migrated from LocalizedString in Task 78. */
	description: LocalizedBlockEditorDoc;
	// stack and tags are not localised — technology names are universal
	stack: string[];
	tags: string[];
	status: ProjectStatus;
	featured: boolean;
	repoUrl?: string;
	liveUrl?: string;
	// Directus file UUID for the project thumbnail/hero image (hero_image on
	// the CMS row). Consumers build the URL via asset(image, '<preset>')
	// against PUBLIC_DIRECTUS_URL — the one live runtime CMS seam.
	// If omitted, cards show a gradient placeholder. Detail pages show no hero image.
	image?: string;
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

	// --- Detail page fields (all optional for backward compat) ---
	// Optional qualifier shown below title (e.g., "& Optimization")
	subtitle?: LocalizedString;
	// 2-3 paragraph deep dive for the detail page
	longDescription?: LocalizedString;
	// "How this helps you" — client-facing value proposition
	valueProposition?: LocalizedString;
	// Typical deliverables list
	deliverables?: LocalizedString[];
	// Tools/technologies used in this service (not localized — tech names are universal)
	stack?: string[];
	// Custom collapsible content blocks for the detail page
	sections?: ServiceSection[];

	// --- Home page Services Grid fields (Slice 13g) ---
	// Visitor-facing outcome displayed above the service title on the home grid.
	// Carnegie principle: lead with what the visitor gets, not what you do.
	benefitHeadline?: LocalizedString;
	// One proof point per service for the home grid.
	// value: display string ("3x faster"), label: context ("avg query improvement").
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
	address: SiteAddress;
	knowsAbout: readonly string[];
}

export interface SiteMeta {
	// name is always "yesid." — brand name is not translated
	name: string;
	tagline: LocalizedString;
	// description is used for the HTML <meta name="description"> tag
	description: LocalizedString;
	links: SiteLinks;
	owner: SiteOwner;
}

// Site-wide SEO defaults (slice-18 18h Q9 — separate port from SiteMeta).
// Backed by the same Directus `site_meta` singleton row at runtime, but exposed
// as a distinct shape so SEO consumers (SeoHead, route composer) and brand
// consumers (jsonLd factories, Footer, About) stay decoupled.
export interface SiteSeoDefaults {
	/** Directus file UUID for the site-wide fallback OG image, or null if none seeded. */
	defaultOgImage: string | null;
	/** Hex color shipped into <meta name="theme-color">. Default '#141414'. */
	themeColor: string;
	/** SEO fallback <meta name="description"> when route + data-layer fields are empty / out-of-band. */
	defaultDescription: LocalizedString;
}

// Per-route SEO override authored in CMS (slice-18 18h). title/description are
// nullable: null = no override, fall back to code-side default or
// SiteSeoDefaults.defaultDescription. Code-side composer handles canonical,
// ogType, noIndex, jsonLd factories.
export interface RouteSeoOverride {
	/** SvelteKit route path, e.g. '/', '/about', '/blog/personal'. Always starts with `/`. */
	path: string;
	/** Per-route OG image UUID, or null. Falls back to SiteSeoDefaults.defaultOgImage when null. */
	ogImage: string | null;
	/** Per-route title body (no brand suffix); composer appends ' | yesid.' per locale. null = use code-side fallbackTitle. */
	title: LocalizedString | null;
	/** Per-route description override; null = fall back to SiteSeoDefaults.defaultDescription. */
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
	slug: string;
	// AM2.5: title is a flat string — blog posts are mono-language end-to-end.
	// The `lang` field on the parent row IS the i18n primitive; no translations junction.
	title: string;
	// AM2.5: excerpt is a flat string — same rationale as title (mono-language per AM2.5).
	excerpt: string;
	// ISO date string (YYYY-MM-DD)
	date: string;
	// Language this post was written in — no translation, just native language
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

// An interest displayed as a diagonal strip with background image.
// image is B&W by default, turns color on hover via CSS filter.
export interface AboutInterest {
	id: string;
	label: LocalizedString;
	image: string; // path to background image (static/images/about/interests/)
}

// About page EDUCATION list — repurposes the former `stack` stop.
// school/program are localized; icon selects the brand SVG mark
// (static/images/about/edu-{champlain,bishops}.svg).
export interface AboutEducationItem {
	school: LocalizedString;
	program: LocalizedString;
	icon: 'champlain' | 'bishops';
}

// Central tech stack source of truth. Categories relate to services.
// When cloud layer arrives (Slice 14), this cascades to services/projects.
export type TechCategory = 'databases' | 'languages' | 'tools' | 'frameworks';

// Legacy tech stack item — used by About page bento dashboard only.
// Slice 18g expanded TechStackItem supersedes this for /tech-stack
// (data-only ship; Block Editor body fields land here; layer/domain graph removed).
export interface AboutTechItem {
	name: string;
	category: TechCategory;
	relatedServices: readonly string[];
}

// --- Tech Stack Page types (Slice 10) ---

// InfraLayer / DomainCluster / Proficiency — deleted in slice-28.3 (#79).
// The Control Room layer/domain/proficiency graph was dropped in slice-18g
// and the consuming /tech-stack components no longer exist.

// A resolved icon record from the `icons` Directus collection (slice-18h-ii Phase 2+3).
// The `id` is a kebab-slug PK matching the legacy tech_stack.icon strings.
// Render priority: svg_override (Directus file UUID) > iconify_id > placeholder.
export interface IconRecord {
	id: string;
	name: string;
	iconify_id: string | null;
	svg_override: string | null; // directus_files UUID
}

// Expanded tech stack item for /tech-stack — 18g shape.
// Block Editor body fields replace the legacy layer/domain/proficiency graph
// that was removed in slice-18g (decisions Q1, Q2, Q5).
// slice-18h-ii Phase 5: icon changed from string to IconRecord | null.
export interface TechStackItem {
	id: string;
	name: string;
	icon: IconRecord | null;
	what_it_is: LocalizedBlockEditorDoc;
	what_i_use_it_for: LocalizedBlockEditorDoc;
	why_i_use_it_instead: LocalizedBlockEditorDoc;
	relatedServices: string[];
	relatedProjects: string[];
	/**
	 * slice-29 Tech Stack Engine: default blueprint layer (mirrors the
	 * STACK_LAYERS order in schemas/stack-archetypes). Optional — omitted
	 * until the CMS row is layered; per-archetype links may override.
	 */
	layer?: 'interface' | 'logic' | 'data' | 'infra';
	/** slice-29: one sentence — what this tech enables (preview-slot caption). */
	enables?: LocalizedString;
}

// TechRelation and StackScenario dropped in slice-18g (decisions Q1+Q2);
// their consumers (lib/components/stack/*.svelte) are gone as of slice-28.3.

// A client logo for the trust strip.
export interface AboutClientLogo {
	name: string;
	src: string;
	url?: string;
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
	availability: LocalizedString;
	socials: readonly { label: string; href: string; icon: string }[];
}

/** Metro stop labels for the 10 bento cards on /about. Added in Task 17b-7g;
 *  single source of truth replaces per-child `label = 'XXX'` defaults. */
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

/** Misc chrome labels used inside about-family components (arias + counter copy).
 *  Added in Task 17b-7g. Template placeholders are noted per field. */
export interface AboutLabels {
	/** MetricDisplay label under the client counter on AboutLogos. */
	clientsServed: LocalizedString;
	polaroidPrevAria: LocalizedString;
	polaroidNextAria: LocalizedString;
	testimonialsCarouselAria: LocalizedString;
	testimonialsTabNavAria: LocalizedString;
	/** Template: placeholders {index} + {total}. */
	testimonialSlideAria: LocalizedString;
	/** Template: placeholder {index}. */
	showTestimonialAria: LocalizedString;
}

/** Per-page HTML `<title>` + `<meta name="description">` copy. Added in 17b-7k. */
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
	languages: readonly string[]; // spoken languages, locale-invariant (LANGUAGES stop)
	education: readonly AboutEducationItem[]; // schools + programs (EDUCATION stop)
	techStack: readonly AboutTechItem[];
	interests: readonly AboutInterest[];
	weather: AboutWeatherConfig;
	clientLogos: readonly AboutClientLogo[];
	clientCount: number; // "10+" displayed in counter
	cta: AboutCta;
	stopLabels: AboutStopLabels;
	labels: AboutLabels;
	meta: PageMeta;
}

// --- Contact page types ---

export interface ContactTerminalField {
	label: string;
	placeholder: LocalizedString;
}

export interface ContactInfoTerminal {
	title: string;
	command: string;
	location: LocalizedString;
	responseTime: LocalizedString;
	sectionLabels: {
		location: LocalizedString;
		connect: LocalizedString;
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
}

export interface ContactContent {
	/** Page title — renders twice (desktop edge title + mobile h1). Typography
	 *  dot is decorative and stays as a template literal in the component. */
	pageTitle: LocalizedString;
	/** User-visible subtitle under the title ("NEXT STOP: YOU"). */
	stationLabel: LocalizedString;
	/** Error message shown when the contact-form POST to web3forms fails. */
	sendErrorMessage: LocalizedString;
	/** HTML `<title>` + `<meta description>` for the `/contact` route — distinct
	 *  from `pageTitle` (which is the visible page chrome). */
	meta: PageMeta;
	infoTerminal: ContactInfoTerminal;
	formTerminal: ContactFormTerminal;
	validation: ContactValidation;
	success: ContactSuccess;
	socials: readonly { label: string; href: string; icon: string }[];
	web3formsKey: string; // Public access key — safe to expose client-side
}

// NOTE: `PageSeo` and `SchemaOrgNode` are defined in apps/web/src/lib/schemas/seo.ts
// via Zod and stay there (apps/web specific). They are re-exported from
// apps/web/src/lib/types.ts alongside these shared types so consumer code keeps
// a single import surface.

// ---------------------------------------------------------------------------
// PreviewContext — per-request adapter context (historically a preview signal)
// ---------------------------------------------------------------------------
//
// Optional, last-param on every ContentAdapter port method.
//
// Name is historical: this began as the carrier for the Directus /shares
// share-token preview design (F5 + D6 — 18c Task 43), which was NEVER wired —
// no /preview route ever shipped, and post-27.2 (static content layer at
// runtime) the design is moot. slice-28.3 (#83) deleted the `shareToken`
// field. The type itself stays live: pageCache threading is real in every
// +page.server.ts load.

export interface PreviewContext {
	/**
	 * Locale override. Absent → fall back to the normal locale resolver
	 * chain. (Originally for share-link-pinned preview locales; kept as a
	 * generic override hook for when FR/ES ship.)
	 */
	locale?: Locale;

	/**
	 * Per-request loadPage memo. Threaded from event.locals.pageCache by
	 * +page.server.ts load functions. Optional so legacy code paths and
	 * tests can omit it; loadPage() degrades gracefully (one fetch per call)
	 * when undefined.
	 *
	 * Uses Promise<unknown> rather than Promise<PageData> to avoid pulling
	 * the @repo/shared/schemas PageData import into content.ts — content.ts
	 * is the foundation the schemas depend on, so the direction must not reverse.
	 */
	pageCache?: Map<string, Promise<unknown>>;
}

// ---------------------------------------------------------------------------
// Home-page content block interfaces (F4 — Slice 18 18c Task 42)
// ---------------------------------------------------------------------------
//
// These interfaces replace the `typeof import('$lib/content/site-content').xxx`
// bindings previously used on ContentPort. Extracting named shapes here:
//   - Breaks the cross-app coupling to $lib/content/site-content.ts
//     (apps/cms seed scripts + future adapter clients need the contract too).
//   - Makes the ContentPort surface reviewable as a list of types instead of
//     an implicit tuple hidden inside import() calls.
//   - Lets Directus seed scripts parse inbound M2A block rows through the
//     corresponding Zod schema (post-18i) without hand-rolling types.
//
// Each `as const` export in apps/web/src/lib/content/site-content.ts structurally
// widens to one of these. The TS compiler confirms the fit at the
// `: ContentAdapter` annotation in apps/web/src/lib/adapters/index.ts.

/** Home page — Hero section (top of /). */
export interface HeroContent {
	headline: {
		line1: LocalizedString;
		line2: LocalizedString;
		/** Aria-label suffix appended after the animated line1 so assistive tech
		 *  hears the full headline even though line2 renders as a visual glyph. */
		ariaSuffix: LocalizedString;
	};
	subheadline: LocalizedString;
	subtitle: LocalizedString;
	ctaWork: LocalizedString;
	ctaContact: LocalizedString;
	sqlPanel: {
		prompt: LocalizedString;
		liveLabel: LocalizedString;
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
	};
	/** Hero scroll-hint chrome — merged from hero_anim JSON column in
	 *  block_hero_translations. Carried through the typed PageData so
	 *  content.heroAnim() needs no out-of-band cache. */
	heroAnim: HeroAnimContent;
}

/** Hero scroll-hint chrome (separate block so the hero can render without it). */
export interface HeroAnimContent {
	scrollDown: LocalizedString;
}

/** Home page — Manifesto section (section 2). */
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

/** Home page — Proof Reel (featured projects section). */
export interface ProofReelContent {
	heading: LocalizedString;
	headingDot: LocalizedString;
	subheading: LocalizedString;
	sectionLabel: LocalizedString;
	viewAllLabel: LocalizedString;
	viewAllHref: string;
	/** Aria-label template — brace placeholder `{title}` resolved at render. */
	toggleColorAria: LocalizedString;
	slugs: readonly string[];
	/** Placeholder / real project screenshot URLs keyed by project slug. */
	images: Readonly<Record<string, string>>;
}

/** Home page — Services grid (section 3). */
export interface ServicesGridContent {
	heading: LocalizedString;
	headingDot: LocalizedString;
	subheading: LocalizedString;
	/** Aria-label template — brace placeholder `{title}`. */
	viewIllustrationAria: LocalizedString;
	/** Link at the bottom of the grid back to /services. */
	viewAllLink: LocalizedString;
}

/** Home-page About teaser (NOT the /about page — that's AboutContent above). */
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

/** Home page — CTA block. */
export interface CtaContent {
	heading: LocalizedString;
	subtitle: LocalizedString;
	ctaContact: LocalizedString;
	ctaGithub: LocalizedString;
}

/** Home page — Closer (TERMINUS / end-of-line block). */
export interface CloserContent {
	heading: LocalizedString;
	headingDot: LocalizedString;
	subheading: LocalizedString;
	cta: {
		label: LocalizedString;
		href: string;
	};
	rows: {
		contact: { label: LocalizedString; description: LocalizedString; action: LocalizedString };
		connect: { label: LocalizedString; description: LocalizedString; action: LocalizedString };
		read: { label: LocalizedString; action: LocalizedString };
		about: { label: LocalizedString; description: LocalizedString; action: LocalizedString };
	};
	attribution: {
		text: LocalizedString;
		url: string;
	};
	/** Departure-board terminal chrome copy. */
	terminal: {
		title: LocalizedString;
		city: LocalizedString;
		encoding: LocalizedString;
		/** Footer destinations count label. Brace placeholder `{count}`. */
		destinationsLabel: LocalizedString;
		/** Comment line above the first row. */
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
