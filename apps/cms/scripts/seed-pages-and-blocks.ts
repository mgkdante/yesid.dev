#!/usr/bin/env bun
/**
 * Seed Directus with pages, block_* content rows, nav_links, and error_pages.
 *
 * Slice 18i Task 2.1. Reads static content from fixtures/content/ (frozen
 * snapshots of apps/web/src/lib/content/ — NOT imported directly per D12:
 * apps/cms must not depend on apps/web at runtime; $lib/types alias won't
 * resolve outside the SvelteKit bundler context anyway).
 *
 * ## What it seeds
 *
 * 1. 7 `pages` rows — one per route slug:
 *    home, about, contact, services, projects, tech-stack, blog.
 *    Each status: 'published', sort assigned 1–7.
 *
 * 2. ~12 `block_*` rows with translations (1 per locale per block):
 *    home: block_hero, block_manifesto, block_proof_reel, block_services_grid,
 *          block_about_intro, block_cta, block_closer  (7 blocks)
 *    about: block_about_content                        (1 block)
 *    contact: block_contact_content                   (1 block)
 *    tech-stack: block_tech_stack_page_content         (1 block)
 *    projects: block_projects_page_content             (1 block)
 *    blog: block_blog_page_content                     (1 block)
 *    services: 0 blocks (renders from services collection)
 *
 * 3. pages_blocks M2A junction rows — in --dry-run, prints shape; in live
 *    run (post-merge), assumes junction has been materialized (Path B deferral
 *    per docs/ai-memory/slice-18i/phase-1-schema-inventory.md).
 *
 * 4. ~14 `nav_links` rows split across placements:
 *    header (3), footer (3), mobile (4), menu (6)
 *
 * 5. 3 `error_pages` rows — status_code 404, 500, 0 (generic fallback).
 *
 * ## Idempotency keys
 *
 * - pages: slug
 * - block_*: editor_label
 * - pages_blocks: (pages_id, item_collection, item_id) — live run only
 * - nav_links: (href, placement)
 * - error_pages: status_code
 *
 * ## Flags
 *
 * --dry-run   Validate payloads via Zod + print counts/samples, no Directus writes.
 * --reset     Delete all target rows then recreate (FK CASCADE clears translations).
 * --verbose   Print each row shape during dry-run.
 * --help      Print this message.
 *
 * ## Live execution deferred
 *
 * Live execution deferred to post-merge per feedback_serial_cms_pushes constraint
 * (incidents #79, #81) and pages_blocks M2A junction deferral (Path B).
 * Task 7.x close-out: push schema → wait for pages_blocks auto-materialization
 * → run this script live → pull snapshot → commit.
 *
 * Run from REPO ROOT:
 *   bun run apps/cms/scripts/seed-pages-and-blocks.ts -- --dry-run
 *   bun run apps/cms/scripts/seed-pages-and-blocks.ts -- --dry-run --verbose
 *   bun run apps/cms/scripts/seed-pages-and-blocks.ts -- --reset   (post-merge only)
 */

import { createItem, deleteItem, readItems } from '@directus/sdk';
import { z } from 'zod';
import {
	HeroContentSchema,
	HeroAnimContentSchema,
	ManifestoContentSchema,
	ProofReelContentSchema,
	ServicesGridContentSchema,
	CtaContentSchema,
	CloserContentSchema,
	AboutIntroContentSchema,
	AboutContentSchema,
	ContactContentSchema,
	TechStackPageContentSchema,
	BlogPageContentSchema,
	ProjectsPageContentSchema,
} from '@repo/shared';
import siteContentFixture from '../fixtures/content/site-content.json' with { type: 'json' };
import aboutPageFixture from '../fixtures/content/about-page.json' with { type: 'json' };
import contactPageFixture from '../fixtures/content/contact-page.json' with { type: 'json' };
import navFixture from '../fixtures/content/nav.json' with { type: 'json' };
import techStackPageFixture from '../fixtures/content/tech-stack-page.json' with { type: 'json' };
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Locale = 'en' | 'fr' | 'es';
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'fr', 'es'] as const;

export type PublicationStatus = 'draft' | 'published';

export type NavPlacement = 'header' | 'footer' | 'mobile' | 'menu';
export const NAV_PLACEMENTS: readonly NavPlacement[] = ['header', 'footer', 'mobile', 'menu'] as const;

// --- Page row ----------------------------------------------------------------

export interface DirectusPageRow {
	slug: string;
	status: PublicationStatus;
	sort: number;
}

// --- Block parent rows -------------------------------------------------------

export interface DirectusBlockParentRow {
	editor_label: string;
	status: PublicationStatus;
	sort: number;
}

// --- Block translation row (generic) ----------------------------------------

export interface DirectusBlockTranslationRow {
	languages_code: Locale;
	[field: string]: unknown;
}

// --- nav_links rows ----------------------------------------------------------

export interface DirectusNavLinkRow {
	href: string;
	placement: NavPlacement;
	priority: 1 | 2;
	status: PublicationStatus;
	translations: ReadonlyArray<DirectusNavLinkTranslationRow>;
}

export interface DirectusNavLinkTranslationRow {
	languages_code: Locale;
	label: string;
	subtitle?: string;
}

// --- error_pages rows -------------------------------------------------------

export interface DirectusErrorPageRow {
	status_code: number;
	status: PublicationStatus;
	translations: ReadonlyArray<DirectusErrorPageTranslationRow>;
}

export interface DirectusErrorPageTranslationRow {
	languages_code: Locale;
	label: string;
	heading: string;
	description: string;
	terminal_line: string;
	suggestions: ReadonlyArray<{ label: string; href: string }>;
}

// --- M2A junction shape (dry-run only) ---------------------------------------

export interface M2AJunctionShape {
	pages_id: string;
	collection: string;
	item_editor_label: string;
}

// ---------------------------------------------------------------------------
// Zod schemas for fixture validation
// ---------------------------------------------------------------------------

const LocalizedStringFixtureSchema = z.object({
	en: z.string().min(1),
	fr: z.string().optional(),
	es: z.string().optional(),
});

const NavLinkFixtureSchema = z.object({
	label: LocalizedStringFixtureSchema,
	href: z.string().min(1),
	priority: z.union([z.literal(1), z.literal(2)]),
});

const MenuItemFixtureSchema = z.object({
	label: LocalizedStringFixtureSchema,
	href: z.string().min(1),
	subtitle: LocalizedStringFixtureSchema,
});

const ErrorPageSuggestionSchema = z.object({
	label: LocalizedStringFixtureSchema,
	href: z.string().min(1),
});

const ErrorPageContentFixtureSchema = z.object({
	label: LocalizedStringFixtureSchema,
	heading: LocalizedStringFixtureSchema,
	description: LocalizedStringFixtureSchema,
	terminalLine: z.string().min(1),
	suggestions: z.array(ErrorPageSuggestionSchema).readonly(),
});

const NavFixtureSchema = z.object({
	navLinks: z.array(NavLinkFixtureSchema).min(1).readonly(),
	menuItems: z.array(MenuItemFixtureSchema).min(1).readonly(),
	errorPageContent: ErrorPageContentFixtureSchema,
});

// ---------------------------------------------------------------------------
// Pure transformation helpers  (all exported for unit tests)
// ---------------------------------------------------------------------------

/** Build the 7 page rows. */
export function toPageRows(): readonly DirectusPageRow[] {
	return [
		{ slug: 'home',       status: 'published', sort: 1 },
		{ slug: 'about',      status: 'published', sort: 2 },
		{ slug: 'contact',    status: 'published', sort: 3 },
		{ slug: 'services',   status: 'published', sort: 4 },
		{ slug: 'projects',   status: 'published', sort: 5 },
		{ slug: 'tech-stack', status: 'published', sort: 6 },
		{ slug: 'blog',       status: 'published', sort: 7 },
	];
}

/** Generic helper — split a LocalizedString object into per-locale bare strings. */
export function splitLocalized(
	obj: Record<string, string | undefined>,
): ReadonlyArray<{ locale: Locale; value: string }> {
	return SUPPORTED_LOCALES.flatMap((locale) => {
		const v = obj[locale];
		return v ? [{ locale, value: v }] : [];
	});
}

// --- block_hero + translations ----------------------------------------------

export function toBlockHeroRow(sort = 1): DirectusBlockParentRow {
	return { editor_label: 'Home Hero', status: 'published', sort };
}

export function toBlockHeroTranslationRows(
	raw: typeof siteContentFixture,
): ReadonlyArray<DirectusBlockTranslationRow> {
	const { heroContent, heroAnimContent } = raw;
	// Only 'en' is populated in the fixture; emit one row.
	return [
		{
			languages_code: 'en' as Locale,
			headline: {
				line1: heroContent.headline.line1.en,
				line2: heroContent.headline.line2.en,
				ariaSuffix: heroContent.headline.ariaSuffix.en,
			},
			subheadline: heroContent.subheadline.en,
			subtitle: heroContent.subtitle.en,
			cta_work: heroContent.ctaWork.en,
			cta_contact: heroContent.ctaContact.en,
			sql_panel: {
				prompt: heroContent.sqlPanel.prompt.en,
				liveLabel: heroContent.sqlPanel.liveLabel.en,
				columns: {
					route: heroContent.sqlPanel.columns.route.en,
					avgDelayS: heroContent.sqlPanel.columns.avgDelayS.en,
					vehicles: heroContent.sqlPanel.columns.vehicles.en,
				},
				metaTemplate: heroContent.sqlPanel.metaTemplate.en,
			},
			refresh_button: {
				label: heroContent.refreshButton.label.en,
				helper: heroContent.refreshButton.helper.en,
			},
			hero_anim: {
				scrollDown: heroAnimContent.scrollDown.en,
			},
		},
	];
}

// --- block_manifesto + translations -----------------------------------------

export function toBlockManifestoRow(
	raw: typeof siteContentFixture,
	sort = 2,
): DirectusBlockParentRow {
	return {
		editor_label: 'Home Manifesto',
		status: 'published',
		sort,
		// Non-translatable JSON column on the parent: ManifestoContent.ticks is
		// readonly string[] (transit ticks), no LocalizedString leaves.
		ticks: raw.manifestoContent.ticks,
	};
}

export function toBlockManifestoTranslationRows(
	raw: typeof siteContentFixture,
): ReadonlyArray<DirectusBlockTranslationRow> {
	const { manifestoContent } = raw;
	return [
		{
			languages_code: 'en' as Locale,
			statement: {
				line1: manifestoContent.statement.line1.en,
				lineHuge: manifestoContent.statement.lineHuge.en,
				line3Part1: manifestoContent.statement.line3Part1.en,
				line3Highlight: manifestoContent.statement.line3Highlight.en,
				line3Part2: manifestoContent.statement.line3Part2.en,
			},
			terminal: {
				user: manifestoContent.terminal.user.en,
				command: manifestoContent.terminal.command.en,
			},
			pills: manifestoContent.pills.map((p) => ({ label: p.label.en, serviceId: p.serviceId })),
			edge_left: {
				sectionNumber: manifestoContent.edgeLeft.sectionNumber.en,
				sectionName: manifestoContent.edgeLeft.sectionName.en,
				location: manifestoContent.edgeLeft.location.en,
			},
			edge_right: {
				lat: manifestoContent.edgeRight.lat.en,
				lng: manifestoContent.edgeRight.lng.en,
				src: manifestoContent.edgeRight.src.en,
				via: manifestoContent.edgeRight.via.en,
				dst: manifestoContent.edgeRight.dst.en,
				node: manifestoContent.edgeRight.node.en,
				status: manifestoContent.edgeRight.status.en,
			},
			edge_bottom: {
				connected: manifestoContent.edgeBottom.connected.en,
				line: manifestoContent.edgeBottom.line.en,
				url: manifestoContent.edgeBottom.url.en,
				version: manifestoContent.edgeBottom.version.en,
				scrollHint: manifestoContent.edgeBottom.scrollHint.en,
			},
			transit: {
				arrivalLabel: manifestoContent.transit.arrivalLabel.en,
				platformBadge: manifestoContent.transit.platformBadge.en,
				directionBadge: manifestoContent.transit.directionBadge.en,
			},
			hidden_transit_lines: manifestoContent.hiddenTransitLines.map((l) => ({
				name: l.name.en,
				color: l.color,
			})),
		},
	];
}

// --- block_proof_reel + translations ----------------------------------------

export function toBlockProofReelRow(
	raw: typeof siteContentFixture,
	sort = 3,
): DirectusBlockParentRow {
	return {
		editor_label: 'Home Proof Reel',
		status: 'published',
		sort,
		// Non-translatable JSON columns on the parent. ProofReelContent.slugs is
		// readonly string[] (project slugs to render); .images is
		// Readonly<Record<slug, string>> (slug → image URL). Neither has
		// LocalizedString leaves.
		view_all_href: raw.proofReelContent.viewAllHref,
		slugs: raw.proofReelContent.slugs,
		images: raw.proofReelContent.images,
	};
}

export function toBlockProofReelTranslationRows(
	raw: typeof siteContentFixture,
): ReadonlyArray<DirectusBlockTranslationRow> {
	const { proofReelContent } = raw;
	return [
		{
			languages_code: 'en' as Locale,
			heading: proofReelContent.heading.en,
			heading_dot: proofReelContent.headingDot.en,
			subheading: proofReelContent.subheading.en,
			section_label: proofReelContent.sectionLabel.en,
			view_all_label: proofReelContent.viewAllLabel.en,
			toggle_color_aria: proofReelContent.toggleColorAria.en,
		},
	];
}

// --- block_services_grid + translations ------------------------------------

export function toBlockServicesGridRow(sort = 4): DirectusBlockParentRow {
	return { editor_label: 'Home Services Grid', status: 'published', sort };
}

export function toBlockServicesGridTranslationRows(
	raw: typeof siteContentFixture,
): ReadonlyArray<DirectusBlockTranslationRow> {
	const { servicesGridContent } = raw;
	return [
		{
			languages_code: 'en' as Locale,
			heading: servicesGridContent.heading.en,
			heading_dot: servicesGridContent.headingDot.en,
			subheading: servicesGridContent.subheading.en,
			view_illustration_aria: servicesGridContent.viewIllustrationAria.en,
			view_all_link: servicesGridContent.viewAllLink.en,
		},
	];
}

// --- block_about_intro + translations --------------------------------------

export function toBlockAboutIntroRow(sort = 5): DirectusBlockParentRow {
	return { editor_label: 'Home About Intro', status: 'published', sort };
}

export function toBlockAboutIntroTranslationRows(
	raw: typeof siteContentFixture,
): ReadonlyArray<DirectusBlockTranslationRow> {
	const { aboutIntroContent } = raw;
	return [
		{
			languages_code: 'en' as Locale,
			name: aboutIntroContent.name.en,
			title: aboutIntroContent.title.en,
			bio: aboutIntroContent.bio.en,
			more_link: aboutIntroContent.moreLink.en,
			stack_label: aboutIntroContent.stackLabel.en,
			location_label: aboutIntroContent.locationLabel.en,
			location: {
				city: aboutIntroContent.location.city.en,
				region: aboutIntroContent.location.region.en,
			},
			interests_label: aboutIntroContent.interestsLabel.en,
			interests: aboutIntroContent.interests.en,
		},
	];
}

// --- block_cta + translations -----------------------------------------------

export function toBlockCtaRow(sort = 6): DirectusBlockParentRow {
	return { editor_label: 'Home CTA', status: 'published', sort };
}

export function toBlockCtaTranslationRows(
	raw: typeof siteContentFixture,
): ReadonlyArray<DirectusBlockTranslationRow> {
	const { ctaContent } = raw;
	return [
		{
			languages_code: 'en' as Locale,
			heading: ctaContent.heading.en,
			subtitle: ctaContent.subtitle.en,
			cta_contact: ctaContent.ctaContact.en,
			cta_github: ctaContent.ctaGithub.en,
		},
	];
}

// --- block_closer + translations -------------------------------------------

export function toBlockCloserRow(sort = 7): DirectusBlockParentRow {
	return { editor_label: 'Home Closer', status: 'published', sort };
}

export function toBlockCloserTranslationRows(
	raw: typeof siteContentFixture,
): ReadonlyArray<DirectusBlockTranslationRow> {
	const { closerContent } = raw;
	return [
		{
			languages_code: 'en' as Locale,
			heading: closerContent.heading.en,
			heading_dot: closerContent.headingDot.en,
			subheading: closerContent.subheading.en,
			cta: {
				label: closerContent.cta.label.en,
				href: closerContent.cta.href,
			},
			rows: {
				contact: {
					label: closerContent.rows.contact.label.en,
					description: closerContent.rows.contact.description.en,
					action: closerContent.rows.contact.action.en,
				},
				connect: {
					label: closerContent.rows.connect.label.en,
					description: closerContent.rows.connect.description.en,
					action: closerContent.rows.connect.action.en,
				},
				read: {
					label: closerContent.rows.read.label.en,
					action: closerContent.rows.read.action.en,
				},
				about: {
					label: closerContent.rows.about.label.en,
					description: closerContent.rows.about.description.en,
					action: closerContent.rows.about.action.en,
				},
			},
			attribution: {
				text: closerContent.attribution.text.en,
				url: closerContent.attribution.url,
			},
			terminal: {
				title: closerContent.terminal.title.en,
				city: closerContent.terminal.city.en,
				encoding: closerContent.terminal.encoding.en,
				destinationsLabel: closerContent.terminal.destinationsLabel.en,
				prompt: closerContent.terminal.prompt.en,
			},
		},
	];
}

// --- block_about_content (non-translatable fields on parent) ----------------

export function toBlockAboutContentRow(
	raw: typeof aboutPageFixture,
	sort = 1,
): DirectusBlockParentRow & { tech_stack: unknown; client_logos: unknown; client_count: number } {
	return {
		editor_label: 'About Content',
		status: 'published',
		sort,
		tech_stack: raw.techStack,
		client_logos: raw.clientLogos,
		client_count: raw.clientCount,
	};
}

export function toBlockAboutContentTranslationRows(
	raw: typeof aboutPageFixture,
): ReadonlyArray<DirectusBlockTranslationRow> {
	return [
		{
			languages_code: 'en' as Locale,
			identity: {
				name: raw.identity.name.en,
				title: raw.identity.title.en,
				valueProp: raw.identity.valueProp.en,
				headshot: raw.identity.headshot,
				polaroids: raw.identity.polaroids.map((p) => ({
					src: p.src,
					alt: p.alt.en,
					caption: p.caption.en,
					rotate: p.rotate,
				})),
			},
			metrics: raw.metrics.map((m) => ({
				value: m.value,
				label: m.label.en,
			})),
			methodology: raw.methodology.map((s) => ({
				id: s.id,
				station: s.station,
				label: s.label.en,
				description: s.description.en,
			})),
			testimonials: raw.testimonials.map((t) => ({
				quote: t.quote.en,
				author: t.author,
				role: t.role.en,
				company: t.company,
			})),
			interests: raw.interests.map((i) => ({
				id: i.id,
				label: i.label.en,
				image: i.image,
			})),
			weather: {
				city: raw.weather.city.en,
				hook: raw.weather.hook.en,
				enabled: raw.weather.enabled,
			},
			cta: {
				command: raw.cta.command,
				lines: raw.cta.lines,
				buttonLabel: raw.cta.buttonLabel.en,
				buttonHref: raw.cta.buttonHref,
				availability: raw.cta.availability.en,
				socials: raw.cta.socials,
			},
			stop_labels: {
				identity: raw.stopLabels.identity.en,
				metrics: raw.stopLabels.metrics.en,
				testimonials: raw.stopLabels.testimonials.en,
				process: raw.stopLabels.process.en,
				stack: raw.stopLabels.stack.en,
				clients: raw.stopLabels.clients.en,
				interests: raw.stopLabels.interests.en,
				snapshots: raw.stopLabels.snapshots.en,
				location: raw.stopLabels.location.en,
				next: raw.stopLabels.next.en,
			},
			labels: {
				clientsServed: raw.labels.clientsServed.en,
				polaroidPrevAria: raw.labels.polaroidPrevAria.en,
				polaroidNextAria: raw.labels.polaroidNextAria.en,
				testimonialsCarouselAria: raw.labels.testimonialsCarouselAria.en,
				testimonialsTabNavAria: raw.labels.testimonialsTabNavAria.en,
				testimonialSlideAria: raw.labels.testimonialSlideAria.en,
				showTestimonialAria: raw.labels.showTestimonialAria.en,
			},
			meta: {
				title: raw.meta.title.en,
				description: raw.meta.description.en,
			},
		},
	];
}

// --- block_contact_content + translations -----------------------------------

export function toBlockContactContentRow(
	raw: typeof contactPageFixture,
	sort = 1,
): DirectusBlockParentRow {
	return {
		editor_label: 'Contact Content',
		status: 'published',
		sort,
		// Non-translatable parent column: web3formsKey is a public client-safe
		// form-submission key (not a server secret), used by the contact form
		// on the client side.
		web3forms_key: raw.web3formsKey,
	};
}

export function toBlockContactContentTranslationRows(
	raw: typeof contactPageFixture,
): ReadonlyArray<DirectusBlockTranslationRow> {
	return [
		{
			languages_code: 'en' as Locale,
			page_title: raw.pageTitle.en,
			station_label: raw.stationLabel.en,
			send_error_message: raw.sendErrorMessage.en,
			meta: {
				title: raw.meta.title.en,
				description: raw.meta.description.en,
			},
			info_terminal: {
				title: raw.infoTerminal.title,
				command: raw.infoTerminal.command,
				location: raw.infoTerminal.location.en,
				responseTime: raw.infoTerminal.responseTime.en,
				sectionLabels: {
					location: raw.infoTerminal.sectionLabels.location.en,
					connect: raw.infoTerminal.sectionLabels.connect.en,
				},
			},
			form_terminal: {
				title: raw.formTerminal.title,
				command: raw.formTerminal.command,
				commandOutput: raw.formTerminal.commandOutput.en,
				fields: {
					name: { label: raw.formTerminal.fields.name.label, placeholder: raw.formTerminal.fields.name.placeholder.en },
					email: { label: raw.formTerminal.fields.email.label, placeholder: raw.formTerminal.fields.email.placeholder.en },
					message: { label: raw.formTerminal.fields.message.label, placeholder: raw.formTerminal.fields.message.placeholder.en },
				},
				submitLabel: raw.formTerminal.submitLabel.en,
			},
			validation: {
				required: raw.validation.required.en,
				invalidEmail: raw.validation.invalidEmail.en,
				errorSummary: raw.validation.errorSummary.en,
			},
			success: {
				validating: raw.success.validating.en,
				sending: raw.success.sending.en,
				sent: raw.success.sent.en,
				responseTime: raw.success.responseTime.en,
				meanwhile: raw.success.meanwhile.en,
				resetLabel: raw.success.resetLabel.en,
				fieldOk: raw.success.fieldOk.en,
			},
			socials: raw.socials,
		},
	];
}

// --- block_tech_stack_page_content + translations ---------------------------

export function toBlockTechStackPageContentRow(sort = 1): DirectusBlockParentRow {
	return { editor_label: 'Tech Stack Page Content', status: 'published', sort };
}

export function toBlockTechStackPageContentTranslationRows(
	raw: typeof techStackPageFixture,
): ReadonlyArray<DirectusBlockTranslationRow> {
	return [
		{
			languages_code: 'en' as Locale,
			meta: {
				title: raw.meta.title.en,
				description: raw.meta.description.en,
			},
			hero: {
				overline: raw.hero.overline.en,
				titleLine1: raw.hero.titleLine1.en,
				titleLine2: raw.hero.titleLine2.en,
				terminalAria: raw.hero.terminalAria.en,
				stats: { technologies: raw.hero.stats.technologies.en },
			},
			actions: {
				getInTouch: raw.actions.getInTouch.en,
				viewServices: raw.actions.viewServices.en,
			},
			cta: {
				headingLine1: raw.cta.headingLine1.en,
				headingLine2: raw.cta.headingLine2.en,
				sub: raw.cta.sub.en,
				availability: raw.cta.availability.en,
			},
		},
	];
}

// --- block_projects_page_content + translations ----------------------------

export function toBlockProjectsPageContentRow(sort = 1): DirectusBlockParentRow {
	return { editor_label: 'Projects Page Content', status: 'published', sort };
}

export function toBlockProjectsPageContentTranslationRows(): ReadonlyArray<DirectusBlockTranslationRow> {
	return [
		{
			languages_code: 'en' as Locale,
			intro: { en: 'A selection of data engineering projects — pipelines, dashboards, and infrastructure that ships.' },
		},
	];
}

// --- block_blog_page_content + translations --------------------------------

export function toBlockBlogPageContentRow(sort = 1): DirectusBlockParentRow {
	return { editor_label: 'Blog Page Content', status: 'published', sort };
}

export function toBlockBlogPageContentTranslationRows(): ReadonlyArray<DirectusBlockTranslationRow> {
	return [
		{
			languages_code: 'en' as Locale,
			intro: { en: 'Notes on data engineering, infrastructure, and building reliable systems.' },
		},
	];
}

// --- M2A junction shapes (dry-run only) -------------------------------------

export function toM2AJunctionShapes(): ReadonlyArray<M2AJunctionShape> {
	return [
		// home page blocks
		{ pages_id: 'home', collection: 'block_hero',          item_editor_label: 'Home Hero' },
		{ pages_id: 'home', collection: 'block_manifesto',     item_editor_label: 'Home Manifesto' },
		{ pages_id: 'home', collection: 'block_proof_reel',    item_editor_label: 'Home Proof Reel' },
		{ pages_id: 'home', collection: 'block_services_grid', item_editor_label: 'Home Services Grid' },
		{ pages_id: 'home', collection: 'block_about_intro',   item_editor_label: 'Home About Intro' },
		{ pages_id: 'home', collection: 'block_cta',           item_editor_label: 'Home CTA' },
		{ pages_id: 'home', collection: 'block_closer',        item_editor_label: 'Home Closer' },
		// per-page blocks
		{ pages_id: 'about',      collection: 'block_about_content',            item_editor_label: 'About Content' },
		{ pages_id: 'contact',    collection: 'block_contact_content',          item_editor_label: 'Contact Content' },
		{ pages_id: 'tech-stack', collection: 'block_tech_stack_page_content',  item_editor_label: 'Tech Stack Page Content' },
		{ pages_id: 'projects',   collection: 'block_projects_page_content',    item_editor_label: 'Projects Page Content' },
		{ pages_id: 'blog',       collection: 'block_blog_page_content',        item_editor_label: 'Blog Page Content' },
	];
}

// --- nav_links rows ---------------------------------------------------------

export function toNavLinkRows(raw: typeof navFixture): ReadonlyArray<DirectusNavLinkRow> {
	const rows: DirectusNavLinkRow[] = [];

	// header: navLinks (Services, Projects, Stack)
	for (const link of raw.navLinks) {
		const translations: DirectusNavLinkTranslationRow[] = SUPPORTED_LOCALES.flatMap((locale) => {
			const label = (link.label as Record<string, string | undefined>)[locale];
			return label ? [{ languages_code: locale, label }] : [];
		});
		rows.push({
			href: link.href,
			placement: 'header',
			priority: link.priority as 1 | 2,
			status: 'published',
			translations,
		});
	}

	// footer: Contact, About, Blog
	const footerLinks = raw.menuItems.filter((m) =>
		['/contact', '/about', '/blog'].includes(m.href),
	);
	for (const link of footerLinks) {
		const translations: DirectusNavLinkTranslationRow[] = SUPPORTED_LOCALES.flatMap((locale) => {
			const label = (link.label as Record<string, string | undefined>)[locale];
			return label ? [{ languages_code: locale, label }] : [];
		});
		rows.push({
			href: link.href,
			placement: 'footer',
			priority: 1,
			status: 'published',
			translations,
		});
	}

	// mobile: same links as header (full-screen overlay, same priority semantics)
	for (const link of raw.navLinks) {
		const translations: DirectusNavLinkTranslationRow[] = SUPPORTED_LOCALES.flatMap((locale) => {
			const label = (link.label as Record<string, string | undefined>)[locale];
			return label ? [{ languages_code: locale, label }] : [];
		});
		rows.push({
			href: link.href,
			placement: 'mobile',
			priority: link.priority as 1 | 2,
			status: 'published',
			translations,
		});
	}

	// menu: all menuItems (renders subtitle column)
	for (const item of raw.menuItems) {
		const translations: DirectusNavLinkTranslationRow[] = SUPPORTED_LOCALES.flatMap((locale) => {
			const label = (item.label as Record<string, string | undefined>)[locale];
			const subtitle = (item.subtitle as Record<string, string | undefined>)[locale];
			if (!label) return [];
			const row: DirectusNavLinkTranslationRow = { languages_code: locale, label };
			if (subtitle) row.subtitle = subtitle;
			return [row];
		});
		rows.push({
			href: item.href,
			placement: 'menu',
			priority: 1,
			status: 'published',
			translations,
		});
	}

	return rows;
}

// --- error_pages rows -------------------------------------------------------

export function toErrorPageRows(raw: typeof navFixture): ReadonlyArray<DirectusErrorPageRow> {
	const { errorPageContent } = raw;

	const base404Translations: DirectusErrorPageTranslationRow[] = SUPPORTED_LOCALES.flatMap((locale) => {
		const label = (errorPageContent.label as Record<string, string | undefined>)[locale];
		const heading = (errorPageContent.heading as Record<string, string | undefined>)[locale];
		const description = (errorPageContent.description as Record<string, string | undefined>)[locale];
		if (!label || !heading || !description) return [];
		return [{
			languages_code: locale,
			label,
			heading,
			description,
			terminal_line: errorPageContent.terminalLine,
			suggestions: errorPageContent.suggestions.map((s) => ({
				label: (s.label as Record<string, string | undefined>)[locale] ?? s.label.en,
				href: s.href,
			})),
		}];
	});

	return [
		{
			status_code: 404,
			status: 'published',
			translations: base404Translations,
		},
		{
			status_code: 500,
			status: 'published',
			translations: [
				{
					languages_code: 'en',
					label: 'SYSTEM ERROR',
					heading: 'Something went wrong',
					description: 'The server encountered an unexpected error. Please try again later.',
					terminal_line: '$ route --status 500 // internal server error',
					suggestions: [
						{ label: 'Home', href: '/' },
						{ label: 'Contact', href: '/contact' },
					],
				},
			],
		},
		{
			status_code: 0,
			status: 'published',
			translations: [
				{
					languages_code: 'en',
					label: 'PAGE NOT FOUND',
					heading: 'This station is offline',
					description: 'The page you were looking for could not be found.',
					terminal_line: '$ route --status 0 // generic fallback',
					suggestions: [
						{ label: 'Home', href: '/' },
						{ label: 'Services', href: '/services' },
					],
				},
			],
		},
	];
}

// ---------------------------------------------------------------------------
// Validation helpers (run in --dry-run; re-use shared Zod schemas)
// ---------------------------------------------------------------------------

export function validateAllFixtures(): void {
	// Validate heroContent + heroAnimContent via shared schemas
	HeroContentSchema.parse(siteContentFixture.heroContent);
	HeroAnimContentSchema.parse(siteContentFixture.heroAnimContent);
	ManifestoContentSchema.parse(siteContentFixture.manifestoContent);
	ProofReelContentSchema.parse(siteContentFixture.proofReelContent);
	ServicesGridContentSchema.parse(siteContentFixture.servicesGridContent);
	// aboutIntroContent uses AboutIntroContentSchema
	AboutIntroContentSchema.parse(siteContentFixture.aboutIntroContent);
	CtaContentSchema.parse(siteContentFixture.ctaContent);
	CloserContentSchema.parse(siteContentFixture.closerContent);

	// About page
	AboutContentSchema.parse(aboutPageFixture);

	// Contact page
	ContactContentSchema.parse(contactPageFixture);

	// Tech stack page
	TechStackPageContentSchema.parse(techStackPageFixture);

	// Blog + projects page stubs (just locale string)
	BlogPageContentSchema.parse({ intro: { en: 'Notes on data engineering, infrastructure, and building reliable systems.' } });
	ProjectsPageContentSchema.parse({ intro: { en: 'A selection of data engineering projects — pipelines, dashboards, and infrastructure that ships.' } });

	// Nav fixture (our own schema)
	NavFixtureSchema.parse(navFixture);
}

// ---------------------------------------------------------------------------
// Seed orchestration
// ---------------------------------------------------------------------------

export interface SeedRunOptions {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
	reset?: boolean;
	verbose?: boolean;
}

// Collection names for the --reset path (FK CASCADE clears translations)
const BLOCK_COLLECTIONS = [
	'block_hero',
	'block_manifesto',
	'block_proof_reel',
	'block_services_grid',
	'block_about_intro',
	'block_cta',
	'block_closer',
	'block_about_content',
	'block_contact_content',
	'block_tech_stack_page_content',
	'block_projects_page_content',
	'block_blog_page_content',
] as const;

const log = createLogger('seed-pages-and-blocks');

interface Schema {
	pages: DirectusPageRow[];
	block_hero: DirectusBlockParentRow[];
	block_manifesto: DirectusBlockParentRow[];
	block_proof_reel: DirectusBlockParentRow[];
	block_services_grid: DirectusBlockParentRow[];
	block_about_intro: DirectusBlockParentRow[];
	block_cta: DirectusBlockParentRow[];
	block_closer: DirectusBlockParentRow[];
	block_about_content: (DirectusBlockParentRow & { tech_stack: unknown; client_logos: unknown; client_count: number })[];
	block_contact_content: DirectusBlockParentRow[];
	block_tech_stack_page_content: DirectusBlockParentRow[];
	block_projects_page_content: DirectusBlockParentRow[];
	block_blog_page_content: DirectusBlockParentRow[];
	nav_links: DirectusNavLinkRow[];
	error_pages: DirectusErrorPageRow[];
}

export async function seedPagesAndBlocks(opts: SeedRunOptions): Promise<void> {
	// --- Compute all payloads (shared between dry-run + live paths) ---
	const pageRows = toPageRows();
	const navLinkRows = toNavLinkRows(navFixture);
	const errorPageRows = toErrorPageRows(navFixture);
	const m2aShapes = toM2AJunctionShapes();

	// Block rows: hero through blog
	const blockDefs = [
		{ name: 'block_hero',                   row: toBlockHeroRow(),                    translations: toBlockHeroTranslationRows(siteContentFixture) },
		{ name: 'block_manifesto',              row: toBlockManifestoRow(siteContentFixture),  translations: toBlockManifestoTranslationRows(siteContentFixture) },
		{ name: 'block_proof_reel',             row: toBlockProofReelRow(siteContentFixture),  translations: toBlockProofReelTranslationRows(siteContentFixture) },
		{ name: 'block_services_grid',          row: toBlockServicesGridRow(),            translations: toBlockServicesGridTranslationRows(siteContentFixture) },
		{ name: 'block_about_intro',            row: toBlockAboutIntroRow(),              translations: toBlockAboutIntroTranslationRows(siteContentFixture) },
		{ name: 'block_cta',                    row: toBlockCtaRow(),                     translations: toBlockCtaTranslationRows(siteContentFixture) },
		{ name: 'block_closer',                 row: toBlockCloserRow(),                  translations: toBlockCloserTranslationRows(siteContentFixture) },
		{ name: 'block_about_content',          row: toBlockAboutContentRow(aboutPageFixture), translations: toBlockAboutContentTranslationRows(aboutPageFixture) },
		{ name: 'block_contact_content',        row: toBlockContactContentRow(contactPageFixture),  translations: toBlockContactContentTranslationRows(contactPageFixture) },
		{ name: 'block_tech_stack_page_content',row: toBlockTechStackPageContentRow(),    translations: toBlockTechStackPageContentTranslationRows(techStackPageFixture) },
		{ name: 'block_projects_page_content',  row: toBlockProjectsPageContentRow(),     translations: toBlockProjectsPageContentTranslationRows() },
		{ name: 'block_blog_page_content',      row: toBlockBlogPageContentRow(),         translations: toBlockBlogPageContentTranslationRows() },
	] as const;

	const totalTranslations = blockDefs.reduce((n, b) => n + b.translations.length, 0);

	// --- Dry-run path --------------------------------------------------------
	if (opts.dryRun) {
		log.info('--- dry-run: validating all fixtures via @repo/shared Zod schemas ---');
		validateAllFixtures();
		log.info('all Zod validations passed');
		log.info('');
		log.info(`Would seed:`);
		log.info(`  ${pageRows.length} pages`);
		log.info(`  ${blockDefs.length} block_* rows (one per block collection)`);
		log.info(`  ${totalTranslations} translation rows × up to 3 locales each`);
		log.info(`  ${m2aShapes.length} pages_blocks M2A junctions (shape only — junction auto-materializes post-merge)`);
		log.info(`  ${navLinkRows.length} nav_links rows`);
		log.info(`  ${errorPageRows.length} error_pages rows`);
		log.info('');

		if (opts.verbose) {
			log.info('--- pages sample ---');
			log.info(JSON.stringify(pageRows[0], null, 2));

			log.info('--- block_hero row sample ---');
			log.info(JSON.stringify(blockDefs[0]!.row, null, 2));

			log.info('--- block_hero translation[0] sample (truncated) ---');
			const heroT = blockDefs[0]!.translations[0];
			const heroSample: Record<string, unknown> = {};
			let i = 0;
			for (const [k, v] of Object.entries(heroT ?? {})) {
				if (i++ >= 5) { heroSample['...'] = '(truncated)'; break; }
				heroSample[k] = v;
			}
			log.info(JSON.stringify(heroSample, null, 2));

			log.info('--- nav_links header sample ---');
			const headerSample = navLinkRows.find((r) => r.placement === 'header');
			log.info(JSON.stringify(headerSample, null, 2));

			log.info('--- error_pages 404 sample ---');
			const ep404 = errorPageRows.find((r) => r.status_code === 404);
			log.info(JSON.stringify({ ...ep404, translations: ep404?.translations.slice(0, 1) }, null, 2));

			log.info('--- pages_blocks M2A junction shapes (first 3) ---');
			log.info(JSON.stringify(m2aShapes.slice(0, 3), null, 2));
		}

		log.info('--- dry-run complete (no writes) ---');
		return;
	}

	// --- Live path (post-merge only) ----------------------------------------
	const client = createClient<Schema>(opts.directusUrl, opts.token);

	if (opts.reset) {
		log.info('--reset: clearing target collections...');

		// Delete pages (FK CASCADE will clear pages_blocks when junction exists).
		// Pattern mirrors seed-tech-stack.ts / seed-services.ts: read IDs, then
		// loop deleteItem(col, id) — Directus SDK v20's deleteItems requires an
		// explicit array of primary keys, not a query object.
		const existingPages = await client.request(
			readItems('pages', { fields: ['id'], limit: -1 }),
		);
		if (existingPages.length > 0) {
			log.info(`  clearing ${existingPages.length} pages rows...`);
			for (const p of existingPages) {
				try {
					await client.request(deleteItem('pages', p.id));
				} catch (err) {
					throw new DirectusError(
						500,
						`Failed to delete pages/${p.id}: ${parseErrors(err).join(' · ')}`,
					);
				}
			}
		}

		// Delete each block collection
		for (const colName of BLOCK_COLLECTIONS) {
			const existing = await client.request(
				readItems(colName, { fields: ['id'], limit: -1 }),
			);
			if (existing.length > 0) {
				log.info(`  clearing ${existing.length} ${colName} rows...`);
				for (const row of existing) {
					try {
						await client.request(deleteItem(colName, row.id));
					} catch (err) {
						throw new DirectusError(
							500,
							`Failed to delete ${colName}/${row.id}: ${parseErrors(err).join(' · ')}`,
						);
					}
				}
			}
		}

		// Delete nav_links and error_pages
		for (const colName of ['nav_links', 'error_pages'] as const) {
			const existing = await client.request(
				readItems(colName, { fields: ['id'], limit: -1 }),
			);
			if (existing.length > 0) {
				log.info(`  clearing ${existing.length} ${colName} rows...`);
				for (const row of existing) {
					try {
						await client.request(deleteItem(colName, row.id));
					} catch (err) {
						throw new DirectusError(
							500,
							`Failed to delete ${colName}/${row.id}: ${parseErrors(err).join(' · ')}`,
						);
					}
				}
			}
		}
	}

	// --- Create pages --------------------------------------------------------
	log.info(`creating ${pageRows.length} pages rows...`);
	for (const row of pageRows) {
		try {
			await client.request(createItem('pages', row as unknown as DirectusPageRow));
			log.info(`  ✓ pages/${row.slug}  sort=${row.sort}`);
		} catch (err) {
			throw new DirectusError(500, `Failed to create page '${row.slug}': ${parseErrors(err).join(' · ')}`);
		}
	}

	// --- Create block rows ---------------------------------------------------
	log.info(`creating ${blockDefs.length} block_* rows...`);
	for (const def of blockDefs) {
		const rowWithTranslations = {
			...def.row,
			translations: def.translations,
		};
		try {
			await client.request(createItem(def.name, rowWithTranslations as unknown as DirectusBlockParentRow));
			log.info(`  ✓ ${def.name}  editor_label="${def.row.editor_label}"  translations=${def.translations.length}`);
		} catch (err) {
			throw new DirectusError(500, `Failed to create ${def.name}: ${parseErrors(err).join(' · ')}`);
		}
	}

	// --- NOTE: pages_blocks M2A junction ---
	// The pages_blocks junction collection auto-materializes on first directus-sync push.
	// Wire the blocks to pages in Data Studio after the push, or extend this script
	// post-merge once the junction collection is confirmed in the snapshot.
	log.info(`NOTE: pages_blocks M2A wiring deferred — wire ${m2aShapes.length} junctions in Data Studio after push.`);

	// --- Create nav_links ----------------------------------------------------
	log.info(`creating ${navLinkRows.length} nav_links rows...`);
	for (const row of navLinkRows) {
		try {
			await client.request(createItem('nav_links', row as unknown as DirectusNavLinkRow));
			log.info(`  ✓ nav_links  ${row.placement.padEnd(7)}  href=${row.href}`);
		} catch (err) {
			throw new DirectusError(500, `Failed to create nav_link ${row.placement}:${row.href}: ${parseErrors(err).join(' · ')}`);
		}
	}

	// --- Create error_pages --------------------------------------------------
	log.info(`creating ${errorPageRows.length} error_pages rows...`);
	for (const row of errorPageRows) {
		try {
			await client.request(createItem('error_pages', row as unknown as DirectusErrorPageRow));
			log.info(`  ✓ error_pages  status_code=${row.status_code}  translations=${row.translations.length}`);
		} catch (err) {
			throw new DirectusError(500, `Failed to create error_page ${row.status_code}: ${parseErrors(err).join(' · ')}`);
		}
	}

	log.info('done.');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseFlags(argv: readonly string[]): {
	dryRun: boolean;
	reset: boolean;
	verbose: boolean;
	help: boolean;
} {
	return {
		dryRun: argv.includes('--dry-run'),
		reset: argv.includes('--reset'),
		verbose: argv.includes('--verbose'),
		help: argv.includes('--help') || argv.includes('-h'),
	};
}

async function main(): Promise<void> {
	const { dryRun, reset, verbose, help } = parseFlags(process.argv.slice(2));

	if (help) {
		console.log(`seed-pages-and-blocks — seed pages, block_*, nav_links, error_pages.

  --dry-run    Validate via Zod + print counts/samples (no Directus writes)
  --reset      Delete all target rows then recreate (post-merge only)
  --verbose    Print sample payloads during --dry-run
  --help       Print this message

  Live execution deferred to post-merge per feedback_serial_cms_pushes.
  Run from REPO ROOT: bun run apps/cms/scripts/seed-pages-and-blocks.ts -- --dry-run`);
		return;
	}

	const directusUrl = defaultDirectusUrl();
	log.info(`target: ${directusUrl}${dryRun ? ' [dry-run]' : reset ? ' [reset]' : ''}`);

	if (dryRun) {
		await seedPagesAndBlocks({ directusUrl, token: '', dryRun: true, verbose });
		return;
	}

	const token = await getAdminToken(directusUrl);
	await seedPagesAndBlocks({ directusUrl, token, reset, verbose });
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed-pages-and-blocks] FAILED:', err);
		process.exit(1);
	});
}
