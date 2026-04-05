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
	// Slugs of projects to show at this station. Must exist in the projects array.
	relatedProjects: string[];
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
