import type { BlockEditorDoc } from './blocks';

export type { Locale, LocalizedString } from '../schemas/shared';
export type { ServiceSection, Service } from '../schemas/service';
export type { ProjectSection, ProjectStatus, ImpactMetric, Project } from '../schemas/project';
export type { SiteLinks, SiteAddress, SiteOwner, SiteMeta, SiteSeoDefaults } from '../schemas/site-meta';
export type { RouteSeoOverride } from '../schemas/route-seo';
export type { BlogCategory, BlogAnimation, BlogPost } from '../schemas/blog';
export type {
	AboutPolaroid,
	AboutIdentity,
	AboutMetric,
	AboutMethodStep,
	AboutTestimonial,
	AboutLanguage,
	AboutInterest,
	AboutEducationItem,
	AboutWeatherConfig,
	AboutCta,
	AboutStopLabels,
	AboutLabels,
	AboutContent,
} from '../schemas/about-page';
export type {
	ContactTerminalField,
	ContactInfoTerminal,
	ContactFormTerminal,
	ContactValidation,
	ContactSuccess,
	ContactContent,
} from '../schemas/contact-page';
export type { LegalPage } from '../schemas/legal-pages';
export type { HeroContent } from '../schemas/hero';
export type { HeroAnimContent } from '../schemas/hero-anim';
export type { ManifestoContent } from '../schemas/manifesto';
export type { ProofReelContent } from '../schemas/proof-reel';
export type { ServicesGridContent } from '../schemas/services-grid';
export type { AboutIntroContent } from '../schemas/about-intro';
export type { CtaContent } from '../schemas/cta';
export type { CloserContent } from '../schemas/closer';
export type { MorphShape } from '../schemas/morph-shape';
export type { NavLink, MenuItem, ErrorPageContent } from '../schemas/nav';

export interface LocalizedBlockEditorDoc {
	en: BlockEditorDoc;
	fr?: BlockEditorDoc;
	es?: BlockEditorDoc;
}

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
