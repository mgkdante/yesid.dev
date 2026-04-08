// Types are the contract between data and UI.
// Every component that renders text goes through these interfaces.
// Define once here; change here if requirements evolve.

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
	content: LocalizedString;
}

// Visibility controls which projects surface on the site.
// 'public'  — visible in listings and detail pages
// 'private' — exists in data but never rendered (client work under NDA, etc.)
// 'wip'     — visible but flagged as work-in-progress
export type ProjectStatus = 'public' | 'private' | 'wip';

export interface Project {
	// slug is URL-safe, globally unique, and never localised — it's part of the URL
	slug: string;
	title: LocalizedString;
	// oneLiner is the one-sentence pitch shown in cards and listings
	oneLiner: LocalizedString;
	description: LocalizedString;
	// stack and tags are not localised — technology names are universal
	stack: string[];
	tags: string[];
	status: ProjectStatus;
	featured: boolean;
	repoUrl?: string;
	liveUrl?: string;
	// Project thumbnail/hero image filename in static/images/work/.
	// If omitted, cards show a gradient placeholder. Detail pages show no hero image.
	image?: string;
	// Service IDs this project is associated with. SVGs cascade from services.
	// A project can link to 1+ services. IDs must match existing service.id values.
	relatedServices: string[];
	// GitHub raw README URL for auto-import as the last content section.
	// Fetched in SvelteKit load(). Omit if no README should be shown.
	readmeUrl?: string;
	sections: ProjectSection[];
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
	// icon is the Lottie JSON filename (without path) for this station's illustration.
	// Keeping it as a string avoids coupling the data layer to any specific renderer.
	icon?: string;
	// When true, the Lottie plays in reverse during scroll scrubbing.
	// Some marketplace Lotties have their "complete" state at frame 0 instead of the last
	// frame. Reversing makes the animation build up as the user scrolls down.
	lottieReverse?: boolean;
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
}

export interface SiteLinks {
	email: string;
	github: string;
	linkedin?: string;
	upwork?: string;
}

export interface SiteMeta {
	// name is always "yesid." — brand name is not translated
	name: string;
	tagline: LocalizedString;
	// description is used for the HTML <meta name="description"> tag
	description: LocalizedString;
	links: SiteLinks;
}

// Blog content categories. Professional is the default brand-facing lane.
// Personal is a warmer "off the clock" section with different accent color.
export type BlogCategory = 'professional' | 'personal';

// SVG animation types available for blog post illustrations.
// Each maps to a different GSAP plugin/technique.
export type BlogAnimation = 'draw' | 'morph' | 'draw-fill' | 'stagger';

export interface BlogPost {
	slug: string;
	title: LocalizedString;
	excerpt: LocalizedString;
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

// Which animation effect highlights a word in the skills journey section.
// 'scale'      — word grows slightly on reveal
// 'gradient'   — word gets a brand color gradient sweep
// 'wave'       — letters wave up sequentially
// 'charReveal' — characters appear one by one
export type HighlightEffect = 'scale' | 'gradient' | 'wave' | 'charReveal';

// Icon identifiers for skills. Kept as a string literal union so the renderer
// can map each id to an SVG/Lottie asset without coupling this data layer to
// any specific icon library.
export type SkillIcon = 'sql' | 'typescript' | 'python' | 'sveltekit' | 'gsap' | 'powerbi' | 'docker';

export interface JourneySkill {
	id: string;
	name: string;
	subtitle?: string;
	icon: SkillIcon;
}

// One "stop" in the horizontal skills journey section.
// highlightWords drives which words inside `text` get the special animation.
// highlightEffect controls which animation variant is used for this panel.
export interface JourneyPanel {
	id: string;
	label: LocalizedString;
	text: LocalizedString;
	highlightWords: string[];
	highlightEffect: HighlightEffect;
	skills: JourneySkill[];
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

// Central tech stack source of truth. Categories relate to services.
// When cloud layer arrives (Slice 14), this cascades to services/projects.
export type TechCategory = 'databases' | 'languages' | 'tools' | 'frameworks';

export interface TechStackItem {
	name: string;
	category: TechCategory;
	relatedServices: readonly string[]; // service IDs — cascade-ready
}

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

// Top-level container for all About page content.
// Components receive this via props — they never import content directly.
export interface AboutContent {
	identity: AboutIdentity;
	metrics: readonly AboutMetric[];
	methodology: readonly AboutMethodStep[];
	testimonials: readonly AboutTestimonial[];
	techStack: readonly TechStackItem[];
	interests: readonly AboutInterest[];
	weather: AboutWeatherConfig;
	clientLogos: readonly AboutClientLogo[];
	clientCount: number; // "10+" displayed in counter
	cta: AboutCta;
}

// --- Contact page types ---

export interface ContactTerminalField {
	label: string;
	placeholder: LocalizedString;
}

export interface ContactInfoTerminal {
	title: string;
	command: string;
	status: LocalizedString;
	availability: LocalizedString;
	location: LocalizedString;
	responseTime: LocalizedString;
	sectionLabels: {
		status: LocalizedString;
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
	stationLabel: LocalizedString;
	infoTerminal: ContactInfoTerminal;
	formTerminal: ContactFormTerminal;
	validation: ContactValidation;
	success: ContactSuccess;
	socials: readonly { label: string; href: string; icon: string }[];
	web3formsKey: string; // Public access key — safe to expose client-side
}
