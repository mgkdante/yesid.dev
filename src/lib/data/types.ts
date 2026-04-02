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
	title: LocalizedString;
	description: LocalizedString;
	// icon is a string identifier resolved by whatever icon library slice 03 picks.
	// Keeping it as a string here avoids a hard coupling to any specific icon set.
	icon?: string;
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
