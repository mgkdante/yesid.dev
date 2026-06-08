// DORMANT (slice-27.2): build/test-only. NOT in the runtime SSR data path as
// of slice-27.2 — index.ts binds all read-ports to staticAdapter. This module
// is kept in-tree solely as the RUN_PARITY regression oracle for the slice-26
// Directus v12 upgrade. (Historical: began as the Slice 18 adapter scaffold;
// the "wired in Slice 18 Task 7" note is obsolete — reverted in 27.2.)
//
// Q6 locale strategy (spec D1/D2/D3 context): we target the native Directus
// Translations field type — each domain collection exposes a `translations`
// alias that expands to rows keyed by `languages_code`. `toLocalizedString`
// composes a LocalizedString at the adapter boundary so consumer code stays
// unchanged.
//
// DEPRECATION HABIT (slice-27.2): there is no items.delete rebuild path. To
// retire content, set status = "archived" — export-fallbacks and the static
// companions already filter archived rows out, so the next deploy-hook rebuild
// drops it from the SSR layer. Do NOT add a new Directus Flow for deletes.
//
// Only the `services` port has a real implementation — the remaining five
// ports throw a clear "TODO Task 5+" error if called. The ContentAdapter
// annotation at the bottom is the compile-time gate that Task 4 must clear.

import { createDirectus, rest, readItems, readSingleton } from '@directus/sdk';
import { env as publicEnv } from '$env/dynamic/public';
import { z } from 'zod';

import type { ContentAdapter } from './types';
import type {
	AboutContent,
	AboutIntroContent,
	BlockEditorDoc,
	BlogAnimation,
	BlogCategory,
	BlogPost,
	CloserContent,
	ContactContent,
	CtaContent,
	HeroAnimContent,
	HeroContent,
	ImpactMetric,
	Locale,
	LocalizedBlockEditorDoc,
	LocalizedString,
	ManifestoContent,
	MorphShape,
	PageSeo,
	PreviewContext,
	Project,
	ProjectSection,
	ProofReelContent,
	RouteSeoOverride,
	Service,
	ServiceSection,
	ServicesGridContent,
	SiteLinks,
	SiteMeta,
	SiteOwner,
	SiteSeoDefaults,
	TechStackItem,
} from '$lib/types';
import type { TechStackPageContent, BlogPageContent, ProjectsPageContent } from '@repo/shared';
import { createQueuedFetch } from './directus-queue';
import { parsePort } from '$lib/schemas/parse';
import { ProjectSchema } from '$lib/schemas/project';
import { ServiceSchema } from '$lib/schemas/service';
import { BlogPostSchema } from '$lib/schemas/blog';
import { LocaleSchema } from '$lib/schemas/shared';
import { MorphShapeSchema } from '$lib/schemas/morph-shape';
import { NavLinkSchema, ErrorPageContentSchema } from '$lib/schemas/nav';
import { TechStackItemSchema } from '$lib/schemas/tech-stack';
import { SiteMetaSchema } from '$lib/schemas/meta';
import { SiteSeoDefaultsSchema } from '$lib/schemas/site-seo-defaults';
import { RouteSeoOverrideSchema } from '$lib/schemas/route-seo';
import { assetIdFor, BlockEditorDocSchema, serializeBlocksToHtml, PageSchema, type PageData } from '@repo/shared';
import { HeroDataSchema } from '$lib/schemas/hero-data';
import { generateHeroData, INITIAL_HERO_DATA } from '$lib/content/hero-data';
import { codeRouteSeoDefaults } from './route-seo-defaults';
import {
	errorSeoFallback,
	routeSeoFactories,
	type FactoryArgs,
} from './route-seo-factories';
import { composePageSeo } from './compose-page-seo';

// ---------------------------------------------------------------------------
// Directus schema — mirrors yesid.dev-cms PR #5 + #6 as applied at cms.yesid.dev.
// Field names + types match the Translations pattern (spec Q6 Approach A):
// each row in a *_translations collection has `languages_code` + parent FK.
// ---------------------------------------------------------------------------

export interface DirectusServiceTranslation {
	languages_code: string;
	title?: string | null;
	subtitle?: string | null;
	description?: string | null;
	long_description?: string | null;
	value_proposition?: string | null;
	benefit_headline?: string | null;
	impact_metric_value?: string | null;
	impact_metric_label?: string | null;
}

export interface DirectusServiceDeliverableTranslation {
	languages_code: string;
	label?: string | null;
}

export interface DirectusServiceDeliverable {
	id: number;
	sort: number | null;
	translations?: DirectusServiceDeliverableTranslation[];
}

export interface DirectusServiceSectionTranslation {
	languages_code: string;
	title?: string | null;
	content?: string | null;
}

export interface DirectusServiceSectionRow {
	id: number;
	sort: number | null;
	translations?: DirectusServiceSectionTranslation[];
}

export interface DirectusService {
	id: string;
	station: number;
	icon?: string | null;
	svg?: string | null;
	visible?: boolean | null;
	stack?: string[] | null;
	translations?: DirectusServiceTranslation[];
	deliverables?: DirectusServiceDeliverable[];
	sections?: DirectusServiceSectionRow[];
}

// ---------------------------------------------------------------------------
// Project row shapes — match the Directus collection layout authored in 18e.
// Translations + sections + impact_metrics + services (M2M junction) follow
// the same pattern as services: each child collection exposes a typed row +
// translations alias that this adapter flattens into the LocalizedString
// shape consumer code expects.
// ---------------------------------------------------------------------------

export interface DirectusProjectTranslation {
	languages_code: string;
	title?: string | null;
	one_liner?: string | null;
	/** Block Editor JSON per locale (#41). Live CMS stores BlockEditorDoc here. */
	description?: BlockEditorDoc | null;
}

export interface DirectusProjectSectionTranslation {
	languages_code: string;
	title?: string | null;
	/** Block Editor JSON per locale (#41). Live CMS stores BlockEditorDoc here. */
	content?: BlockEditorDoc | null;
}

export interface DirectusProjectSectionRow {
	id: number;
	sort: number | null;
	translations?: DirectusProjectSectionTranslation[];
}

export interface DirectusProjectImpactMetricTranslation {
	languages_code: string;
	label?: string | null;
}

export interface DirectusProjectImpactMetricRow {
	id: number;
	sort: number | null;
	value: string;
	before: string | null;
	translations?: DirectusProjectImpactMetricTranslation[];
}

export interface DirectusProjectsServicesRow {
	id: number;
	project_id: string;
	service_id: string;
}

export interface DirectusProject {
	id: string;
	status: 'draft' | 'published' | 'archived';
	date_published: string | null;
	sort: number | null;
	featured: boolean;
	hero_image: string | null;
	repo_url: string | null;
	live_url: string | null;
	readme_url: string | null;
	location: string | null;
	environment: string | null;
	version: string | null;
	stack: string[];
	tags: string[];
	translations?: DirectusProjectTranslation[];
	sections?: DirectusProjectSectionRow[];
	impact_metrics?: DirectusProjectImpactMetricRow[];
	services?: DirectusProjectsServicesRow[];
}

// ---------------------------------------------------------------------------
// Blog row shapes + mapping (slice-18 18f, AM2.5 — flat title+excerpt, no
// blog_posts_translations junction). The parent row carries `lang` (the i18n
// primitive — blog is mono-language end-to-end) and exposes `title` + `excerpt`
// as plain strings.
// ---------------------------------------------------------------------------

export interface DirectusBlogPostRow {
	id: string;
	status: 'draft' | 'published' | 'archived';
	date_published: string | null;
	sort: number | null;
	lang: 'en' | 'fr' | 'es';
	category: 'professional' | 'personal';
	tags: readonly string[] | null;
	external: boolean;
	url: string | null;
	cover_image: { id: string } | string | null;
	svg_illustration: { id: string; label?: string; category?: string; file?: { id: string } } | string | null;
	animation: 'draw' | 'morph' | 'draw-fill';
	title: string;       // AM2.5: flat field on parent
	excerpt: string;     // AM2.5: flat field on parent
	body: BlockEditorDoc | null;
}

export interface DirectusIllustrationRow {
	id: string;
	label?: string;
	category?: string;
	sort?: number | null;
	file: { id: string } | string;
}

// ---------------------------------------------------------------------------
// Nav links row shapes — slice-18i Phase 5 Task 5.1.
//
// Flat collection with placement enum. Each row has a translations alias
// for label + subtitle, and an icon M2O FK to the icons collection.
// ---------------------------------------------------------------------------

interface DirectusNavLinkTranslation {
	languages_code: string;
	label?: string | null;
	subtitle?: string | null;
}

interface DirectusNavLinkIconRow {
	name?: string | null;
}

interface DirectusNavLinkRow {
	id: string;
	status: 'draft' | 'published' | 'archived';
	placement: 'header' | 'footer' | 'mobile' | 'menu';
	href: string;
	priority: number;
	icon?: DirectusNavLinkIconRow | string | null;
	translations?: DirectusNavLinkTranslation[];
}

const navRowsMemo = new WeakMap<object, Promise<DirectusNavLinkRow[]>>();

async function fetchAllNavRows(ctx: PreviewContext): Promise<DirectusNavLinkRow[]> {
	const cached = navRowsMemo.get(ctx as object);
	if (cached) return cached;

	const promise = client().request(
		readItems('nav_links', {
			filter: {
				status: { _eq: 'published' },
			} as unknown as Record<string, unknown>,
			fields: ['*', 'translations.*', 'icon.*'] as unknown as (keyof DirectusNavLinkRow)[],
			sort: ['priority'],
		}),
	) as Promise<DirectusNavLinkRow[]>;

	navRowsMemo.set(ctx as object, promise);
	return promise;
}

// ---------------------------------------------------------------------------
// Error pages row shapes — slice-18i Phase 5 Task 5.3.
//
// Flat collection keyed by status_code (UNIQUE). status_code=0 is the
// generic fallback. Each row has a translations alias for label, heading,
// description, terminal_line, and a per-locale suggestions JSON column.
// ---------------------------------------------------------------------------

interface DirectusErrorPageTranslation {
	languages_code: string;
	label?: string | null;
	heading?: string | null;
	description?: string | null;
	terminal_line?: string | null;
	suggestions?: Array<{ label: string; href: string }> | null;
}

interface DirectusErrorPageRow {
	id: string;
	status: 'draft' | 'published' | 'archived';
	status_code: number;
	sort?: number | null;
	translations?: DirectusErrorPageTranslation[];
}

interface Schema {
	services: DirectusService[];
	projects: DirectusProject[];
	// Projects-family child collections — declared so the @directus/sdk
	// `readItems('projects', { fields: [{ translations: [...] }] })` typed
	// nested-fields helper recognizes each child as a relational alias. The
	// SDK matches via structural type equality between Item field type and
	// any Schema collection's element type.
	projects_translations: DirectusProjectTranslation[];
	projects_sections: DirectusProjectSectionRow[];
	projects_impact_metrics: DirectusProjectImpactMetricRow[];
	projects_services: DirectusProjectsServicesRow[];
	// Blog + morph-shapes collections (slice-18 18f).
	blog_posts: DirectusBlogPostRow[];
	illustrations: DirectusIllustrationRow[];
	morph_shapes: MorphShape[];
	// Tech-stack collection (slice-18 18g).
	tech_stack: DirectusTechStackRow[];
	// Site meta singleton + per-route SEO overrides (slice-18 18h).
	site_meta: DirectusSiteMetaRow;
	route_seo: DirectusRouteSeoRow[];
	// Pages collection — M2A junction-backed page builder (slice-18i).
	pages: PageData[];
	// Nav links + error pages — slice-18i Phase 5.
	nav_links: DirectusNavLinkRow[];
	error_pages: DirectusErrorPageRow[];
}

// ---------------------------------------------------------------------------
// Page query constants & loadPage (slice-18i Phase 3)
// ---------------------------------------------------------------------------

/**
 * Maps SvelteKit route paths to their corresponding `pages.slug` values in
 * Directus. Used by +page.server.ts load functions to resolve the slug for
 * the current route without hardcoding it in every route file.
 */
export const ROUTE_TO_SLUG: Readonly<Record<string, string>> = {
	'/': 'home',
	'/about': 'about',
	'/contact': 'contact',
	'/services': 'services',
	'/projects': 'projects',
	'/tech-stack': 'tech-stack',
	'/blog': 'blog',
} as const;

/**
 * All 12 block_* M2A collection names used in `pages.blocks`.
 * `block_journey_panel` is intentionally absent — dropped in slice-18i Task 1.0a.
 */
export const ALL_BLOCK_COLLECTIONS = [
	'block_hero',
	'block_manifesto',
	'block_proof_reel',
	'block_services_grid',
	'block_cta',
	'block_closer',
	'block_about_intro',
	'block_about_content',
	'block_contact_content',
	'block_tech_stack_page_content',
	'block_blog_page_content',
	'block_projects_page_content',
] as const;

/**
 * Deep-fields array for the `pages` readItems query.
 * Expands translations + every block_* collection item + its translations
 * in a single request. Probe P10 measured this at 1156 bytes — well under
 * Directus's limit; single-query approach is locked (Phase 1 decision).
 */
export const PAGE_FIELDS: string[] = [
	'*',
	'translations.*',
	'blocks.*',
	...ALL_BLOCK_COLLECTIONS.flatMap((c) => [
		`blocks.item:${c}.*`,
		`blocks.item:${c}.translations.*`,
	]),
];

/**
 * Per-route data loader for slice-18i.
 *
 * Makes ONE Directus query per (slug × request), fetching the `pages` row
 * plus all 12 block_* collection items via deep `fields` expansion. Results
 * are memoized on `ctx.pageCache` so multiple `content.*` calls within the
 * same HTTP request resolve from cache after the first fetch.
 *
 * Cache stores the Promise (not the resolved value) so concurrent callers
 * sharing the same ctx deduplicate into a single in-flight request.
 *
 * Fails fast: throws with the slug name in the message when the page is not
 * found, and throws via parsePort with 'pages.bySlug' label when the raw
 * shape fails PageSchema validation.
 */
export async function loadPage(slug: string, ctx?: PreviewContext): Promise<PageData> {
	const cache = ctx?.pageCache as Map<string, Promise<PageData>> | undefined;

	if (cache?.has(slug)) {
		return cache.get(slug)!;
	}

	const promise: Promise<PageData> = client()
		.request(
			readItems('pages', {
				filter: { slug: { _eq: slug }, status: { _eq: 'published' } },
				fields: PAGE_FIELDS as unknown as (keyof PageData)[],
				limit: 1,
			}),
		)
		.then((raw) => {
			if (!raw || raw.length === 0) {
				throw new Error(`loadPage: page not found for slug='${slug}'`);
			}
			// Translation-merge layer: walks per-locale translation rows from
			// Directus and produces LocalizedString-shaped output that PageSchema
			// expects. See transformPageRow / toLocalizedJSON / transformBlock<X>.
			const transformed = transformPageRow(raw[0] as unknown);
			return parsePort('pages.bySlug', PageSchema, transformed);
		});

	cache?.set(slug, promise);

	return promise;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Compose a LocalizedString from a Directus Translations array.
 * Pure — no network, no env. Falls back to `fallback` (default `en`) when the
 * requested locale's field value is missing or empty; emits `{ en: '' }` when
 * nothing is available, matching the static-adapter contract that callers
 * downstream validate via Zod at the port boundary.
 *
 * Generic over the row type so each collection's typed translation shape
 * (e.g. `DirectusServiceTranslation`) is accepted directly without a cast.
 */
export function toLocalizedString<T extends { languages_code: string }>(
	translations: ReadonlyArray<T> | null | undefined,
	field: string,
	fallback: Locale = 'en',
): LocalizedString {
	const rows = translations ?? [];
	const byLocale = new Map<string, string>();
	for (const row of rows) {
		const value = (row as Record<string, unknown>)[field];
		if (typeof value === 'string' && value.length > 0) {
			byLocale.set(row.languages_code, value);
		}
	}
	const en = byLocale.get('en') ?? byLocale.get(fallback) ?? '';
	const result: LocalizedString = { en };
	const fr = byLocale.get('fr');
	if (fr) result.fr = fr;
	const es = byLocale.get('es');
	if (es) result.es = es;
	return result;
}

/** LocalizedString or undefined — use for optional fields. */
function toLocalizedStringOrUndef<T extends { languages_code: string }>(
	translations: ReadonlyArray<T>,
	field: string,
): LocalizedString | undefined {
	const hasAny = translations.some((t) => {
		const v = (t as Record<string, unknown>)[field];
		return typeof v === 'string' && v.length > 0;
	});
	return hasAny ? toLocalizedString(translations, field) : undefined;
}

/**
 * LocalizedString or null — for fields whose CMS schema is "nullable on the
 * row but `null` carries 'no override' semantics" (slice-18 18h `route_seo`
 * `title` and `description`). Returns null when EVERY translation row's value
 * is null/empty; otherwise composes a LocalizedString. Used by
 * `toRouteSeoOverride` so the composer can distinguish "editor cleared the
 * field" (null → use fallback) from "editor populated EN but not FR/ES".
 */
function toLocalizedStringNullable<T extends { languages_code: string }>(
	translations: ReadonlyArray<T> | null | undefined,
	field: string,
): LocalizedString | null {
	const rows = translations ?? [];
	const hasAny = rows.some((t) => {
		const v = (t as Record<string, unknown>)[field];
		return typeof v === 'string' && v.length > 0;
	});
	return hasAny ? toLocalizedString(rows, field) : null;
}

/**
 * Compose a LocalizedBlockEditorDoc from a Directus Translations array.
 * Each translation row's `field` value must be a BlockEditorDoc object
 * ({ time, blocks, version }). Rows with missing/invalid shapes are skipped.
 * Falls back to an empty single-paragraph doc for the required `en` locale.
 *
 * Used for Project.description and ProjectSection.content (#41).
 */
function toLocalizedBlockEditorDoc<T extends { languages_code: string }>(
	translations: ReadonlyArray<T> | null | undefined,
	field: string,
): LocalizedBlockEditorDoc {
	const rows = translations ?? [];
	const out: { en?: BlockEditorDoc; fr?: BlockEditorDoc; es?: BlockEditorDoc } = {};
	for (const row of rows) {
		const value = (row as Record<string, unknown>)[field];
		if (value !== null && typeof value === 'object' && 'blocks' in (value as object)) {
			const code = row.languages_code as 'en' | 'fr' | 'es';
			out[code] = value as BlockEditorDoc;
		}
	}
	if (!out.en) {
		// Fallback: empty single-paragraph doc to satisfy the required `en` field.
		out.en = { time: 0, version: '2.31.2', blocks: [{ id: 'p1', type: 'paragraph', data: { text: '' } }] };
	}
	return out as LocalizedBlockEditorDoc;
}

// ---------------------------------------------------------------------------
// toLocalizedJSON — per-locale JSON column → LocalizedString-leaved object
//
// Slice-18i Task 4.0: supports JSON columns authored per Task 1.3 pattern
// (nested objects with LocalizedString leaves stored as per-locale JSON).
//
// Each translation row's `field` value is expected to be a JSON object with
// string leaves (e.g. `{ line1: "Hello", line2: "World" }`). This helper
// walks every leaf across all locale rows and merges them into a nested
// object where each string leaf becomes a LocalizedString.
//
// Non-string primitives (numbers, booleans) are passed through from the `en`
// row unchanged — LocalizedString only models strings, so e.g. a hex color
// constant is not "translated" per locale.
// ---------------------------------------------------------------------------

/**
 * Merge a per-locale JSON column into a LocalizedString-leaved nested object.
 * Each translation row's `field` value is a JSON object with bare strings;
 * this walks every leaf and produces a LocalizedString-keyed equivalent.
 *
 * Slice-18i Task 4.0 — supports JSON columns authored per Task 1.3 pattern
 * (nested objects with LocalizedString leaves stored as per-locale JSON).
 */
export function toLocalizedJSON<T extends { languages_code: string }>(
	translations: ReadonlyArray<T> | null | undefined,
	field: string,
): unknown {
	const rows = translations ?? [];
	// Collect per-locale JSON values for this field.
	const byLocale = new Map<string, unknown>();
	for (const row of rows) {
		const value = (row as Record<string, unknown>)[field];
		if (value !== null && value !== undefined) {
			byLocale.set(row.languages_code, value);
		}
	}
	const enVal = byLocale.get('en') ?? byLocale.values().next().value;
	if (enVal === undefined || enVal === null) {
		return {};
	}
	// Recursively walk the `en` value as the structural template.
	// For each leaf, collect the same path from every locale.
	return mergeJsonLocales(enVal, byLocale);
}

/**
 * Recursively walk an object/array/primitive template (from the `en` locale)
 * and collect matching values from every locale map entry, producing a
 * LocalizedString at each string leaf and passing through non-string
 * primitives from the en row.
 */
function mergeJsonLocales(
	enTemplate: unknown,
	byLocale: Map<string, unknown>,
): unknown {
	if (typeof enTemplate === 'string') {
		// String leaf → build LocalizedString across all locales.
		const result: LocalizedString = { en: enTemplate };
		const fr = byLocale.get('fr');
		if (fr !== undefined && fr !== null && typeof fr === 'string' && fr.length > 0) {
			result.fr = fr;
		}
		const es = byLocale.get('es');
		if (es !== undefined && es !== null && typeof es === 'string' && es.length > 0) {
			result.es = es;
		}
		return result;
	}

	if (typeof enTemplate === 'number' || typeof enTemplate === 'boolean') {
		// Non-string primitive — pass through from the en row unchanged.
		return enTemplate;
	}

	if (Array.isArray(enTemplate)) {
		// Array — walk each element; collect matching locale arrays by index.
		return enTemplate.map((enItem, idx) => {
			const localeMap = new Map<string, unknown>();
			for (const [locale, localeVal] of byLocale) {
				if (Array.isArray(localeVal) && localeVal[idx] !== undefined) {
					localeMap.set(locale, localeVal[idx]);
				} else {
					localeMap.set(locale, undefined);
				}
			}
			return mergeJsonLocales(enItem, localeMap);
		});
	}

	if (enTemplate !== null && typeof enTemplate === 'object') {
		// Object — recurse into each key.
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(enTemplate as Record<string, unknown>)) {
			const localeMap = new Map<string, unknown>();
			for (const [locale, localeVal] of byLocale) {
				if (localeVal !== null && typeof localeVal === 'object' && !Array.isArray(localeVal)) {
					localeMap.set(locale, (localeVal as Record<string, unknown>)[key]);
				} else {
					localeMap.set(locale, undefined);
				}
			}
			out[key] = mergeJsonLocales(
				(enTemplate as Record<string, unknown>)[key],
				localeMap,
			);
		}
		return out;
	}

	// null or unrecognized — pass through.
	return enTemplate;
}

// ---------------------------------------------------------------------------
// Per-block transform functions — Slice-18i Task 4.0
//
// Each function accepts the raw Directus item for a block_* collection (with
// a `translations` array of per-locale rows) and returns the typed content
// interface expected by the matching Zod schema. These run BEFORE parsePort
// so the schema only sees pre-merged LocalizedString shapes.
//
// Naming: transformBlock<CamelCasedCollectionName>
// ---------------------------------------------------------------------------

/** Raw Directus per-block item shape before transform. */
interface RawBlockItem {
	translations?: ReadonlyArray<Record<string, unknown>>;
	[key: string]: unknown;
}

function toLS(
	translations: ReadonlyArray<Record<string, unknown>>,
	field: string,
): LocalizedString {
	// Cast needed: toLocalizedString is generic over { languages_code: string };
	// RawBlockItem translations are typed as Record<string,unknown> for generality.
	return toLocalizedString(
		translations as ReadonlyArray<{ languages_code: string }>,
		field,
	);
}

function toLSJSON(
	translations: ReadonlyArray<Record<string, unknown>>,
	field: string,
): unknown {
	// Cast: toLocalizedJSON is generic over { languages_code: string }.
	return toLocalizedJSON(
		translations as ReadonlyArray<{ languages_code: string }>,
		field,
	);
}

/**
 * Transform raw `block_hero` Directus item into HeroContent (including heroAnim).
 *
 * The `headline` and `sqlPanel` fields are JSON columns (per Task 1.3 pattern):
 * each locale row stores the full nested structure as JSON. `subheadline`,
 * `subtitle`, `ctaWork`, `ctaContact` are flat scalar columns handled via
 * `toLocalizedString`. The `refreshButton` is also a JSON column.
 *
 * `heroAnim` is merged from the `hero_anim` JSON column in block_hero_translations
 * and carried through typed PageData — no separate module-level cache needed.
 */
export function transformBlockHero(raw: RawBlockItem): HeroContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	const headline = toLSJSON(tr, 'headline') as HeroContent['headline'];
	const sqlPanel = toLSJSON(tr, 'sql_panel') as HeroContent['sqlPanel'];
	const refreshButton = toLSJSON(tr, 'refresh_button') as HeroContent['refreshButton'];
	// hero_anim is a JSON column; scrollDown inside it may be a bare string (per-locale)
	// or already a LocalizedString (if the seeder pre-merged it). Normalise to LocalizedString.
	const heroAnimRaw = toLSJSON(tr, 'hero_anim') as { scrollDown?: LocalizedString | string } | null;
	const scrollDownRaw = heroAnimRaw && typeof heroAnimRaw === 'object' && 'scrollDown' in heroAnimRaw
		? heroAnimRaw.scrollDown
		: undefined;
	// scrollDownRaw is either a LocalizedString (object with .en) or a plain string
	// that toLocalizedJSON already merged across locales, or undefined.
	// toLocalizedJSON wraps string leaves as LocalizedStrings, so scrollDownRaw
	// should already be a LocalizedString when the column is a JSON object leaf.
	const scrollDown: HeroAnimContent['scrollDown'] =
		scrollDownRaw && typeof scrollDownRaw === 'object' && 'en' in scrollDownRaw
			? (scrollDownRaw as LocalizedString)
			: toLS(tr, 'scroll_down');
	return {
		headline,
		subheadline: toLS(tr, 'subheadline'),
		subtitle: toLS(tr, 'subtitle'),
		ctaWork: toLS(tr, 'cta_work'),
		ctaContact: toLS(tr, 'cta_contact'),
		sqlPanel,
		refreshButton,
		heroAnim: { scrollDown },
	};
}

/**
 * Transform raw `block_manifesto` Directus item into ManifestoContent.
 *
 * `ticks` is a non-translatable string array on the parent row.
 *
 * `pills` is a per-locale JSON column. Each element has `label` (LocalizedString)
 * and `serviceId` (plain string — a stable identifier, NOT translatable).
 * toLocalizedJSON would wrap `serviceId` as a LocalizedString, which is wrong.
 * Instead we merge pills manually: `label` from each locale row, `serviceId`
 * from the en row (same value in every locale — it is a content-model ID).
 *
 * `hidden_transit_lines` is stored under `block_manifesto_translations` (per the
 * Phase 1 schema). Each locale row has the same array value but `name` is the
 * translatable leaf (LocalizedString) while `color` is a plain hex string.
 * We merge across locales: `name` becomes a LocalizedString, `color` reads
 * from the en row as a bare string.
 */
export function transformBlockManifesto(raw: RawBlockItem): ManifestoContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	const statement = toLSJSON(tr, 'statement') as ManifestoContent['statement'];
	const terminal = toLSJSON(tr, 'terminal') as ManifestoContent['terminal'];
	const edgeLeft = toLSJSON(tr, 'edge_left') as ManifestoContent['edgeLeft'];
	const edgeRight = toLSJSON(tr, 'edge_right') as ManifestoContent['edgeRight'];
	const edgeBottom = toLSJSON(tr, 'edge_bottom') as ManifestoContent['edgeBottom'];
	const transit = toLSJSON(tr, 'transit') as ManifestoContent['transit'];
	const ticks = Array.isArray(raw.ticks) ? (raw.ticks as string[]) : [];

	// --- pills: mixed-content JSON column ---
	// Collect per-locale pill arrays. serviceId is plain (same across locales);
	// label is the translatable leaf.
	const pillsByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const rawPills = row.pills;
		if (Array.isArray(rawPills)) {
			pillsByLocale.set(code, rawPills as Array<Record<string, unknown>>);
		}
	}
	const enPills = pillsByLocale.get('en') ?? [];
	const pills: ManifestoContent['pills'] = enPills.map((enPill, idx) => {
		const labelLS: LocalizedString = { en: typeof enPill.label === 'string' ? enPill.label : '' };
		const frPill = pillsByLocale.get('fr')?.[idx];
		if (frPill && typeof frPill.label === 'string' && frPill.label.length > 0) {
			labelLS.fr = frPill.label;
		}
		const esPill = pillsByLocale.get('es')?.[idx];
		if (esPill && typeof esPill.label === 'string' && esPill.label.length > 0) {
			labelLS.es = esPill.label;
		}
		return {
			label: labelLS,
			serviceId: typeof enPill.serviceId === 'string' ? enPill.serviceId : '',
		};
	});

	// --- hidden_transit_lines: per-locale JSON column (translations side) ---
	// `name` is translatable; `color` is a plain hex string (same across locales).
	const htlByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const rawLines = row.hidden_transit_lines;
		if (Array.isArray(rawLines)) {
			htlByLocale.set(code, rawLines as Array<Record<string, unknown>>);
		}
	}
	// Fall back to parent row if no translations carry it (backwards compat).
	const enLines = htlByLocale.get('en')
		?? (Array.isArray(raw.hidden_transit_lines) ? (raw.hidden_transit_lines as Array<Record<string, unknown>>) : []);
	const hiddenTransitLines: ManifestoContent['hiddenTransitLines'] = enLines.map((enLine, idx) => {
		const nameLS: LocalizedString = { en: typeof enLine.name === 'string' ? enLine.name : '' };
		const frLine = htlByLocale.get('fr')?.[idx];
		if (frLine && typeof frLine.name === 'string' && frLine.name.length > 0) {
			nameLS.fr = frLine.name;
		}
		const esLine = htlByLocale.get('es')?.[idx];
		if (esLine && typeof esLine.name === 'string' && esLine.name.length > 0) {
			nameLS.es = esLine.name;
		}
		// color: plain hex — read from en row
		const color = typeof enLine.color === 'string' ? enLine.color : '';
		return { name: nameLS, color };
	});

	return { statement, terminal, pills, edgeLeft, edgeRight, edgeBottom, transit, ticks, hiddenTransitLines };
}

/**
 * Transform raw `block_proof_reel` Directus item into ProofReelContent.
 * `slugs` and `images` are non-translatable fields on the parent row.
 */
export function transformBlockProofReel(raw: RawBlockItem): ProofReelContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	const slugs = Array.isArray(raw.slugs) ? (raw.slugs as string[]) : [];
	const images = (raw.images !== null && typeof raw.images === 'object' && !Array.isArray(raw.images))
		? (raw.images as Record<string, string>)
		: {};
	return {
		heading: toLS(tr, 'heading'),
		headingDot: toLS(tr, 'heading_dot'),
		subheading: toLS(tr, 'subheading'),
		sectionLabel: toLS(tr, 'section_label'),
		viewAllLabel: toLS(tr, 'view_all_label'),
		viewAllHref: typeof raw.view_all_href === 'string' ? raw.view_all_href : '/work',
		toggleColorAria: toLS(tr, 'toggle_color_aria'),
		slugs,
		images,
	};
}

/**
 * Transform raw `block_services_grid` Directus item into ServicesGridContent.
 */
export function transformBlockServicesGrid(raw: RawBlockItem): ServicesGridContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	return {
		heading: toLS(tr, 'heading'),
		headingDot: toLS(tr, 'heading_dot'),
		subheading: toLS(tr, 'subheading'),
		viewIllustrationAria: toLS(tr, 'view_illustration_aria'),
		viewAllLink: toLS(tr, 'view_all_link'),
	};
}

/**
 * Transform raw `block_cta` Directus item into CtaContent.
 */
export function transformBlockCta(raw: RawBlockItem): CtaContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	return {
		heading: toLS(tr, 'heading'),
		subtitle: toLS(tr, 'subtitle'),
		ctaContact: toLS(tr, 'cta_contact'),
		ctaGithub: toLS(tr, 'cta_github'),
	};
}

/**
 * Transform raw `block_closer` Directus item into CloserContent.
 * `cta.href` and `attribution.url` are non-translatable string fields on the
 * parent row. The rest are JSON columns with nested LocalizedString leaves.
 */
export function transformBlockCloser(raw: RawBlockItem): CloserContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	const ctaJson = toLSJSON(tr, 'cta') as { label?: LocalizedString; href?: string } | null;
	const rowsJson = toLSJSON(tr, 'rows') as CloserContent['rows'] | null;
	const attributionJson = toLSJSON(tr, 'attribution') as { text?: LocalizedString; url?: string } | null;
	const terminalJson = toLSJSON(tr, 'terminal') as CloserContent['terminal'] | null;
	return {
		heading: toLS(tr, 'heading'),
		headingDot: toLS(tr, 'heading_dot'),
		subheading: toLS(tr, 'subheading'),
		cta: {
			label: ctaJson?.label ?? { en: '' },
			href: typeof raw.cta_href === 'string'
				? raw.cta_href
				: (ctaJson?.href ?? '/contact'),
		},
		rows: rowsJson ?? {
			contact: { label: { en: '' }, description: { en: '' }, action: { en: '' } },
			connect: { label: { en: '' }, description: { en: '' }, action: { en: '' } },
			read: { label: { en: '' }, action: { en: '' } },
			about: { label: { en: '' }, description: { en: '' }, action: { en: '' } },
		},
		attribution: {
			text: attributionJson?.text ?? { en: '' },
			url: typeof raw.attribution_url === 'string'
				? raw.attribution_url
				: (attributionJson?.url ?? ''),
		},
		terminal: terminalJson ?? {
			title: { en: '' },
			city: { en: '' },
			encoding: { en: '' },
			destinationsLabel: { en: '' },
			prompt: { en: '' },
		},
	};
}

/**
 * Transform raw `block_about_intro` Directus item into AboutIntroContent.
 * `stackItems` is a non-translatable string array on the parent row.
 * `location` is a JSON column with nested LocalizedString leaves.
 */
export function transformBlockAboutIntro(raw: RawBlockItem): AboutIntroContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	const locationJson = toLSJSON(tr, 'location') as AboutIntroContent['location'] | null;
	const stackItems = Array.isArray(raw.stack_items) ? (raw.stack_items as string[]) : [];
	return {
		name: toLS(tr, 'name'),
		title: toLS(tr, 'title'),
		bio: toLS(tr, 'bio'),
		moreLink: toLS(tr, 'more_link'),
		stackLabel: toLS(tr, 'stack_label'),
		stackItems,
		locationLabel: toLS(tr, 'location_label'),
		location: locationJson ?? { city: { en: '' }, region: { en: '' } },
		interestsLabel: toLS(tr, 'interests_label'),
		interests: toLS(tr, 'interests'),
	};
}

/**
 * Transform raw `block_about_content` Directus item into AboutContent.
 *
 * Field-aware transforms distinguish LocalizedString leaves from plain string
 * leaves per the Zod schema (AboutContentSchema). toLocalizedJSON would wrap
 * EVERY string leaf as a LocalizedString which breaks plain-string fields.
 *
 * Plain string fields (read from en row, same value across locales):
 *   identity.headshot, polaroids[].src, polaroids[].rotate (number),
 *   metrics[].value, metrics[].icon?,
 *   methodology[].id, methodology[].station (number),
 *   testimonials[].author, testimonials[].company, testimonials[].logo?,
 *   techStack[].name, techStack[].category, techStack[].relatedServices[],
 *   interests[].id, interests[].image,
 *   weather.enabled (boolean),
 *   cta.command, cta.buttonHref, cta.lines[].text, cta.lines[].color,
 *   cta.socials[].label, cta.socials[].href, cta.socials[].icon,
 *   clientLogos[].name, clientLogos[].src, clientLogos[].url?
 *
 * tech_stack and client_logos live on the parent row (moved by Phase 1 fix-up
 * commit 377401c) — NOT in translations.
 *
 * All other leaves are LocalizedString and use toLS().
 */
export function transformBlockAboutContent(raw: RawBlockItem): AboutContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	const clientCount = typeof raw.client_count === 'number' ? raw.client_count : 0;

	// Helper: get a field value from the en-locale row as a plain value
	function enVal<T>(field: string, fallback: T): T {
		const enRow = tr.find((r) => r.languages_code === 'en') ?? tr[0];
		if (!enRow) return fallback;
		const v = (enRow as Record<string, unknown>)[field];
		return (v !== undefined && v !== null ? v : fallback) as T;
	}

	// --- identity ---
	const rawIdentity = enVal<Record<string, unknown>>('identity', {});
	const rawPolaroids = Array.isArray(rawIdentity.polaroids)
		? (rawIdentity.polaroids as Array<Record<string, unknown>>)
		: [];

	// Build per-locale identity maps for LocalizedString merging
	const identityByLocale = new Map<string, Record<string, unknown>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const id = row.identity;
		if (id && typeof id === 'object' && !Array.isArray(id)) {
			identityByLocale.set(code, id as Record<string, unknown>);
		}
	}
	function identityLS(field: string): LocalizedString {
		const result: LocalizedString = { en: '' };
		for (const [locale, id] of identityByLocale) {
			const v = (id as Record<string, unknown>)[field];
			if (typeof v === 'string' && v.length > 0) {
				if (locale === 'en') result.en = v;
				else if (locale === 'fr') result.fr = v;
				else if (locale === 'es') result.es = v;
			}
		}
		return result;
	}

	// polaroids: src (plain), alt (LocalizedString), caption (LocalizedString), rotate (number)
	const polaroidsByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const [locale, id] of identityByLocale) {
		const pols = (id as Record<string, unknown>).polaroids;
		if (Array.isArray(pols)) {
			polaroidsByLocale.set(locale, pols as Array<Record<string, unknown>>);
		}
	}
	const polaroids = rawPolaroids.map((enPol, idx) => {
		const altLS: LocalizedString = { en: typeof enPol.alt === 'string' ? enPol.alt : '' };
		const captionLS: LocalizedString = { en: typeof enPol.caption === 'string' ? enPol.caption : '' };
		for (const [locale, polList] of polaroidsByLocale) {
			if (locale === 'en') continue;
			const pol = polList[idx];
			if (!pol) continue;
			if (typeof pol.alt === 'string' && pol.alt.length > 0) {
				if (locale === 'fr') altLS.fr = pol.alt;
				else if (locale === 'es') altLS.es = pol.alt;
			}
			if (typeof pol.caption === 'string' && pol.caption.length > 0) {
				if (locale === 'fr') captionLS.fr = pol.caption;
				else if (locale === 'es') captionLS.es = pol.caption;
			}
		}
		return {
			src: typeof enPol.src === 'string' ? enPol.src : '',
			alt: altLS,
			caption: captionLS,
			rotate: typeof enPol.rotate === 'number' ? enPol.rotate : 0,
		};
	});

	const identity: AboutContent['identity'] = {
		name: identityLS('name'),
		title: identityLS('title'),
		valueProp: identityLS('valueProp'),
		headshot: typeof rawIdentity.headshot === 'string' ? rawIdentity.headshot : '',
		polaroids,
	};

	// --- metrics: value (plain), label (LocalizedString), icon? (plain) ---
	const metricsByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		if (Array.isArray(row.metrics)) {
			metricsByLocale.set(code, row.metrics as Array<Record<string, unknown>>);
		}
	}
	const enMetrics = metricsByLocale.get('en') ?? [];
	const metrics: AboutContent['metrics'] = enMetrics.map((enM, idx) => {
		const labelLS: LocalizedString = { en: typeof enM.label === 'string' ? enM.label : '' };
		for (const [locale, mList] of metricsByLocale) {
			if (locale === 'en') continue;
			const m = mList[idx];
			if (!m) continue;
			if (typeof m.label === 'string' && m.label.length > 0) {
				if (locale === 'fr') labelLS.fr = m.label;
				else if (locale === 'es') labelLS.es = m.label;
			}
		}
		const metric: AboutContent['metrics'][number] = {
			value: typeof enM.value === 'string' ? enM.value : '',
			label: labelLS,
		};
		if (typeof enM.icon === 'string' && enM.icon.length > 0) metric.icon = enM.icon;
		return metric;
	});

	// --- methodology: id (plain), station (number plain), label (LS), description (LS) ---
	const methodByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		if (Array.isArray(row.methodology)) {
			methodByLocale.set(code, row.methodology as Array<Record<string, unknown>>);
		}
	}
	const enMethod = methodByLocale.get('en') ?? [];
	const methodology: AboutContent['methodology'] = enMethod.map((enS, idx) => {
		const labelLS: LocalizedString = { en: typeof enS.label === 'string' ? enS.label : '' };
		const descLS: LocalizedString = { en: typeof enS.description === 'string' ? enS.description : '' };
		for (const [locale, sList] of methodByLocale) {
			if (locale === 'en') continue;
			const s = sList[idx];
			if (!s) continue;
			if (typeof s.label === 'string' && s.label.length > 0) {
				if (locale === 'fr') labelLS.fr = s.label;
				else if (locale === 'es') labelLS.es = s.label;
			}
			if (typeof s.description === 'string' && s.description.length > 0) {
				if (locale === 'fr') descLS.fr = s.description;
				else if (locale === 'es') descLS.es = s.description;
			}
		}
		return {
			id: typeof enS.id === 'string' ? enS.id : '',
			label: labelLS,
			description: descLS,
			station: typeof enS.station === 'number' ? enS.station : 0,
		};
	});

	// --- testimonials: author (plain), company (plain), logo? (plain), quote (LS), role (LS) ---
	const testimonialsByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		if (Array.isArray(row.testimonials)) {
			testimonialsByLocale.set(code, row.testimonials as Array<Record<string, unknown>>);
		}
	}
	const enTestimonials = testimonialsByLocale.get('en') ?? [];
	const testimonials: AboutContent['testimonials'] = enTestimonials.map((enT, idx) => {
		const quoteLS: LocalizedString = { en: typeof enT.quote === 'string' ? enT.quote : '' };
		const roleLS: LocalizedString = { en: typeof enT.role === 'string' ? enT.role : '' };
		for (const [locale, tList] of testimonialsByLocale) {
			if (locale === 'en') continue;
			const t = tList[idx];
			if (!t) continue;
			if (typeof t.quote === 'string' && t.quote.length > 0) {
				if (locale === 'fr') quoteLS.fr = t.quote;
				else if (locale === 'es') quoteLS.es = t.quote;
			}
			if (typeof t.role === 'string' && t.role.length > 0) {
				if (locale === 'fr') roleLS.fr = t.role;
				else if (locale === 'es') roleLS.es = t.role;
			}
		}
		const testimonial: AboutContent['testimonials'][number] = {
			quote: quoteLS,
			author: typeof enT.author === 'string' ? enT.author : '',
			role: roleLS,
			company: typeof enT.company === 'string' ? enT.company : '',
		};
		if (typeof enT.logo === 'string' && enT.logo.length > 0) testimonial.logo = enT.logo;
		return testimonial;
	});

	// --- techStack: read from parent row (moved by Phase 1 fix-up 377401c) ---
	// All fields are plain (name: string, category: TechCategory, relatedServices: string[])
	const rawTechStack = Array.isArray(raw.tech_stack)
		? (raw.tech_stack as Array<Record<string, unknown>>)
		: [];
	const techStack: AboutContent['techStack'] = rawTechStack.map((item) => ({
		name: typeof item.name === 'string' ? item.name : '',
		category: (item.category as AboutContent['techStack'][number]['category']) ?? 'tools',
		relatedServices: Array.isArray(item.relatedServices)
			? (item.relatedServices as string[])
			: [],
	}));

	// --- interests: id (plain), image (plain), label (LS) ---
	const interestsByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		if (Array.isArray(row.interests)) {
			interestsByLocale.set(code, row.interests as Array<Record<string, unknown>>);
		}
	}
	const enInterests = interestsByLocale.get('en') ?? [];
	const interests: AboutContent['interests'] = enInterests.map((enI, idx) => {
		const labelLS: LocalizedString = { en: typeof enI.label === 'string' ? enI.label : '' };
		for (const [locale, iList] of interestsByLocale) {
			if (locale === 'en') continue;
			const i = iList[idx];
			if (!i) continue;
			if (typeof i.label === 'string' && i.label.length > 0) {
				if (locale === 'fr') labelLS.fr = i.label;
				else if (locale === 'es') labelLS.es = i.label;
			}
		}
		return {
			id: typeof enI.id === 'string' ? enI.id : '',
			label: labelLS,
			image: typeof enI.image === 'string' ? enI.image : '',
		};
	});

	// --- weather: city (LS), hook (LS), enabled (boolean plain) ---
	const weatherByLocale = new Map<string, Record<string, unknown>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const w = row.weather;
		if (w && typeof w === 'object' && !Array.isArray(w)) {
			weatherByLocale.set(code, w as Record<string, unknown>);
		}
	}
	const enWeather = weatherByLocale.get('en') ?? {};
	const cityLS: LocalizedString = { en: typeof enWeather.city === 'string' ? enWeather.city : '' };
	const hookLS: LocalizedString = { en: typeof enWeather.hook === 'string' ? enWeather.hook : '' };
	for (const [locale, w] of weatherByLocale) {
		if (locale === 'en') continue;
		if (typeof w.city === 'string' && w.city.length > 0) {
			if (locale === 'fr') cityLS.fr = w.city;
			else if (locale === 'es') cityLS.es = w.city;
		}
		if (typeof w.hook === 'string' && w.hook.length > 0) {
			if (locale === 'fr') hookLS.fr = w.hook;
			else if (locale === 'es') hookLS.es = w.hook;
		}
	}
	const weather: AboutContent['weather'] = {
		city: cityLS,
		hook: hookLS,
		enabled: typeof enWeather.enabled === 'boolean' ? enWeather.enabled : false,
	};

	// --- clientLogos: read from parent row (moved by Phase 1 fix-up 377401c) ---
	// All fields plain: name (string), src (string), url? (string)
	const rawClientLogos = Array.isArray(raw.client_logos)
		? (raw.client_logos as Array<Record<string, unknown>>)
		: [];
	const clientLogos: AboutContent['clientLogos'] = rawClientLogos.map((logo) => {
		const cl: AboutContent['clientLogos'][number] = {
			name: typeof logo.name === 'string' ? logo.name : '',
			src: typeof logo.src === 'string' ? logo.src : '',
		};
		if (typeof logo.url === 'string' && logo.url.length > 0) cl.url = logo.url;
		return cl;
	});

	// --- cta: command (plain), buttonHref (plain), buttonLabel (LS), availability (LS),
	//          lines[].text (plain), lines[].color (plain), socials[].label/href/icon (all plain) ---
	const ctaByLocale = new Map<string, Record<string, unknown>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const c = row.cta;
		if (c && typeof c === 'object' && !Array.isArray(c)) {
			ctaByLocale.set(code, c as Record<string, unknown>);
		}
	}
	const enCta = ctaByLocale.get('en') ?? {};
	const buttonLabelLS: LocalizedString = { en: typeof enCta.buttonLabel === 'string' ? enCta.buttonLabel : '' };
	const availabilityLS: LocalizedString = { en: typeof enCta.availability === 'string' ? enCta.availability : '' };
	for (const [locale, c] of ctaByLocale) {
		if (locale === 'en') continue;
		if (typeof c.buttonLabel === 'string' && c.buttonLabel.length > 0) {
			if (locale === 'fr') buttonLabelLS.fr = c.buttonLabel;
			else if (locale === 'es') buttonLabelLS.es = c.buttonLabel;
		}
		if (typeof c.availability === 'string' && c.availability.length > 0) {
			if (locale === 'fr') availabilityLS.fr = c.availability;
			else if (locale === 'es') availabilityLS.es = c.availability;
		}
	}
	const rawCtaLines = Array.isArray(enCta.lines)
		? (enCta.lines as Array<Record<string, unknown>>)
		: [];
	const ctaLines = rawCtaLines.map((l) => ({
		text: typeof l.text === 'string' ? l.text : '',
		color: (l.color as 'orange' | 'muted' | 'accent') ?? 'muted',
	}));
	const rawCtaSocials = Array.isArray(enCta.socials)
		? (enCta.socials as Array<Record<string, unknown>>)
		: [];
	const ctaSocials = rawCtaSocials.map((s) => ({
		label: typeof s.label === 'string' ? s.label : '',
		href: typeof s.href === 'string' ? s.href : '',
		icon: typeof s.icon === 'string' ? s.icon : '',
	}));
	const cta: AboutContent['cta'] = {
		command: typeof enCta.command === 'string' ? enCta.command : '',
		lines: ctaLines,
		buttonLabel: buttonLabelLS,
		buttonHref: typeof enCta.buttonHref === 'string' ? enCta.buttonHref : '',
		availability: availabilityLS,
		socials: ctaSocials,
	};

	// --- stopLabels: all LocalizedString ---
	const stopLabels = toLSJSON(tr, 'stop_labels') as AboutContent['stopLabels'];

	// --- labels: all LocalizedString ---
	const labels = toLSJSON(tr, 'labels') as AboutContent['labels'];

	// --- meta: title (LS), description (LS) ---
	const meta = toLSJSON(tr, 'meta') as AboutContent['meta'];

	return {
		identity,
		metrics,
		methodology,
		testimonials,
		techStack,
		interests,
		weather,
		clientLogos,
		clientCount,
		cta,
		stopLabels,
		labels,
		meta,
	};
}

/**
 * Transform raw `block_contact_content` Directus item into ContactContent.
 *
 * Field-aware transforms distinguish LocalizedString from plain string leaves
 * per ContactContentSchema. toLocalizedJSON would wrap EVERY string leaf.
 *
 * Plain string fields:
 *   infoTerminal.title, infoTerminal.command,
 *   formTerminal.title, formTerminal.command,
 *   formTerminal.fields.{name,email,message}.label,
 *   socials[].label, socials[].href, socials[].icon,
 *   web3formsKey (parent row, not translations)
 *
 * `web3formsKey` is a non-translatable scalar field on the parent row.
 */
export function transformBlockContactContent(raw: RawBlockItem): ContactContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;

	// --- infoTerminal: title/command plain; location/responseTime/sectionLabels LS ---
	const infoByLocale = new Map<string, Record<string, unknown>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const it = row.info_terminal;
		if (it && typeof it === 'object' && !Array.isArray(it)) {
			infoByLocale.set(code, it as Record<string, unknown>);
		}
	}
	const enInfo = infoByLocale.get('en') ?? {};
	const locationLS: LocalizedString = { en: typeof enInfo.location === 'string' ? enInfo.location : '' };
	const responseTimeLS: LocalizedString = { en: typeof enInfo.responseTime === 'string' ? enInfo.responseTime : '' };
	const sectionLabelLocationLS: LocalizedString = { en: '' };
	const sectionLabelConnectLS: LocalizedString = { en: '' };
	const enSectionLabels = (enInfo.sectionLabels && typeof enInfo.sectionLabels === 'object' && !Array.isArray(enInfo.sectionLabels))
		? (enInfo.sectionLabels as Record<string, unknown>)
		: {};
	sectionLabelLocationLS.en = typeof enSectionLabels.location === 'string' ? enSectionLabels.location : '';
	sectionLabelConnectLS.en = typeof enSectionLabels.connect === 'string' ? enSectionLabels.connect : '';
	for (const [locale, it] of infoByLocale) {
		if (locale === 'en') continue;
		if (typeof it.location === 'string' && it.location.length > 0) {
			if (locale === 'fr') locationLS.fr = it.location;
			else if (locale === 'es') locationLS.es = it.location;
		}
		if (typeof it.responseTime === 'string' && it.responseTime.length > 0) {
			if (locale === 'fr') responseTimeLS.fr = it.responseTime;
			else if (locale === 'es') responseTimeLS.es = it.responseTime;
		}
		const sl = (it.sectionLabels && typeof it.sectionLabels === 'object' && !Array.isArray(it.sectionLabels))
			? (it.sectionLabels as Record<string, unknown>)
			: {};
		if (typeof sl.location === 'string' && sl.location.length > 0) {
			if (locale === 'fr') sectionLabelLocationLS.fr = sl.location;
			else if (locale === 'es') sectionLabelLocationLS.es = sl.location;
		}
		if (typeof sl.connect === 'string' && sl.connect.length > 0) {
			if (locale === 'fr') sectionLabelConnectLS.fr = sl.connect;
			else if (locale === 'es') sectionLabelConnectLS.es = sl.connect;
		}
	}
	const infoTerminal: ContactContent['infoTerminal'] = {
		title: typeof enInfo.title === 'string' ? enInfo.title : '',
		command: typeof enInfo.command === 'string' ? enInfo.command : '',
		location: locationLS,
		responseTime: responseTimeLS,
		sectionLabels: {
			location: sectionLabelLocationLS,
			connect: sectionLabelConnectLS,
		},
	};

	// --- formTerminal: title/command plain; commandOutput/submitLabel LS; fields.*.label plain, fields.*.placeholder LS ---
	const formByLocale = new Map<string, Record<string, unknown>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const ft = row.form_terminal;
		if (ft && typeof ft === 'object' && !Array.isArray(ft)) {
			formByLocale.set(code, ft as Record<string, unknown>);
		}
	}
	const enForm = formByLocale.get('en') ?? {};
	const commandOutputLS: LocalizedString = { en: typeof enForm.commandOutput === 'string' ? enForm.commandOutput : '' };
	const submitLabelLS: LocalizedString = { en: typeof enForm.submitLabel === 'string' ? enForm.submitLabel : '' };
	for (const [locale, ft] of formByLocale) {
		if (locale === 'en') continue;
		if (typeof ft.commandOutput === 'string' && ft.commandOutput.length > 0) {
			if (locale === 'fr') commandOutputLS.fr = ft.commandOutput;
			else if (locale === 'es') commandOutputLS.es = ft.commandOutput;
		}
		if (typeof ft.submitLabel === 'string' && ft.submitLabel.length > 0) {
			if (locale === 'fr') submitLabelLS.fr = ft.submitLabel;
			else if (locale === 'es') submitLabelLS.es = ft.submitLabel;
		}
	}

	// Build per-field placeholder LocalizedStrings
	function buildTerminalField(fieldName: string): ContactContent['formTerminal']['fields']['name'] {
		const enFields = (enForm.fields && typeof enForm.fields === 'object' && !Array.isArray(enForm.fields))
			? (enForm.fields as Record<string, unknown>)
			: {};
		const enField = (enFields[fieldName] && typeof enFields[fieldName] === 'object')
			? (enFields[fieldName] as Record<string, unknown>)
			: {};
		const label = typeof enField.label === 'string' ? enField.label : '';
		const placeholderLS: LocalizedString = { en: typeof enField.placeholder === 'string' ? enField.placeholder : '' };
		for (const [locale, ft] of formByLocale) {
			if (locale === 'en') continue;
			const ftFields = (ft.fields && typeof ft.fields === 'object' && !Array.isArray(ft.fields))
				? (ft.fields as Record<string, unknown>)
				: {};
			const ftField = (ftFields[fieldName] && typeof ftFields[fieldName] === 'object')
				? (ftFields[fieldName] as Record<string, unknown>)
				: {};
			if (typeof ftField.placeholder === 'string' && ftField.placeholder.length > 0) {
				if (locale === 'fr') placeholderLS.fr = ftField.placeholder;
				else if (locale === 'es') placeholderLS.es = ftField.placeholder;
			}
		}
		return { label, placeholder: placeholderLS };
	}

	const formTerminal: ContactContent['formTerminal'] = {
		title: typeof enForm.title === 'string' ? enForm.title : '',
		command: typeof enForm.command === 'string' ? enForm.command : '',
		commandOutput: commandOutputLS,
		fields: {
			name: buildTerminalField('name'),
			email: buildTerminalField('email'),
			message: buildTerminalField('message'),
		},
		submitLabel: submitLabelLS,
	};

	// --- validation: all LocalizedString ---
	const validation = toLSJSON(tr, 'validation') as ContactContent['validation'];

	// --- success: all LocalizedString ---
	const success = toLSJSON(tr, 'success') as ContactContent['success'];

	// --- socials: all plain strings (label, href, icon) — read from en row ---
	const enRow = tr.find((r) => r.languages_code === 'en') ?? tr[0];
	const rawSocials = (enRow && Array.isArray(enRow.socials))
		? (enRow.socials as Array<Record<string, unknown>>)
		: [];
	const socials: ContactContent['socials'] = rawSocials.map((s) => ({
		label: typeof s.label === 'string' ? s.label : '',
		href: typeof s.href === 'string' ? s.href : '',
		icon: typeof s.icon === 'string' ? s.icon : '',
	}));

	// --- meta: title (LS), description (LS) ---
	const meta = toLSJSON(tr, 'meta') as ContactContent['meta'];

	return {
		pageTitle: toLS(tr, 'page_title'),
		stationLabel: toLS(tr, 'station_label'),
		sendErrorMessage: toLS(tr, 'send_error_message'),
		meta,
		infoTerminal,
		formTerminal,
		validation,
		success,
		socials,
		web3formsKey: typeof raw.web3forms_key === 'string' ? raw.web3forms_key : '',
	};
}

/**
 * Transform raw `block_tech_stack_page_content` Directus item into TechStackPageContent.
 * All fields are JSON columns with nested LocalizedString leaves.
 */
export function transformBlockTechStackPageContent(raw: RawBlockItem): TechStackPageContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	const meta = toLSJSON(tr, 'meta') as TechStackPageContent['meta'];
	const hero = toLSJSON(tr, 'hero') as TechStackPageContent['hero'];
	const actions = toLSJSON(tr, 'actions') as TechStackPageContent['actions'];
	const cta = toLSJSON(tr, 'cta') as TechStackPageContent['cta'];
	return { meta, hero, actions, cta };
}

/**
 * Transform raw `block_blog_page_content` Directus item into BlogPageContent.
 */
export function transformBlockBlogPageContent(raw: RawBlockItem): BlogPageContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	return {
		intro: toLS(tr, 'intro'),
		heading: toLS(tr, 'heading'),
		backToDispatches: toLS(tr, 'back_to_dispatches'),
		backToPersonal: toLS(tr, 'back_to_personal'),
	};
}

/**
 * Transform raw `block_projects_page_content` Directus item into ProjectsPageContent.
 */
export function transformBlockProjectsPageContent(raw: RawBlockItem): ProjectsPageContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	return {
		intro: toLS(tr, 'intro'),
	};
}

/**
 * Dispatch table mapping block collection name → transform function.
 * Used by `transformPageRow` to process each block item.
 */
const BLOCK_TRANSFORMS: Record<string, (raw: RawBlockItem) => unknown> = {
	block_hero: transformBlockHero,
	block_manifesto: transformBlockManifesto,
	block_proof_reel: transformBlockProofReel,
	block_services_grid: transformBlockServicesGrid,
	block_cta: transformBlockCta,
	block_closer: transformBlockCloser,
	block_about_intro: transformBlockAboutIntro,
	block_about_content: transformBlockAboutContent,
	block_contact_content: transformBlockContactContent,
	block_tech_stack_page_content: transformBlockTechStackPageContent,
	block_blog_page_content: transformBlockBlogPageContent,
	block_projects_page_content: transformBlockProjectsPageContent,
};

/**
 * Transform a raw Directus `pages` row (with per-locale translation arrays
 * on each block item) into the LocalizedString-shaped structure expected by
 * PageSchema.
 *
 * Closes the gap between Directus's per-locale translation rows and the
 * LocalizedString-shaped Zod schemas. Each block item's `translations[]` array
 * is consumed by the matching `transformBlock*` function; the result replaces
 * the raw item before `parsePort('pages.bySlug', PageSchema, ...)` runs.
 *
 * Critical 1 fix: PageSchema requires `title: z.string()` at the top level,
 * but Directus stores the title in `pages_translations/title` (not on `pages`
 * directly). We extract the en-locale title here before parsePort runs.
 *
 * Slice-18i Task 4.0.
 */
export function transformPageRow(raw: unknown): unknown {
	if (raw === null || typeof raw !== 'object') return raw;
	const page = raw as Record<string, unknown>;

	// Extract page title from translations (pages_translations.title).
	// PageSchema.title is z.string() — just the en locale value.
	let title = typeof page.title === 'string' && page.title.length > 0 ? page.title : '';
	if (!title) {
		const pageTr = Array.isArray(page.translations) ? (page.translations as ReadonlyArray<Record<string, unknown>>) : [];
		const enTr = pageTr.find((r) => r.languages_code === 'en') ?? pageTr[0];
		if (enTr && typeof enTr.title === 'string' && enTr.title.length > 0) {
			title = enTr.title;
		}
	}

	const rawBlocks = Array.isArray(page.blocks) ? page.blocks : [];
	const blocks = rawBlocks.map((rawBlock: unknown) => {
		if (rawBlock === null || typeof rawBlock !== 'object') return rawBlock;
		const block = rawBlock as Record<string, unknown>;
		const collection = block.collection as string;
		const transform = BLOCK_TRANSFORMS[collection];
		if (!transform) {
			// Unknown block collection — pass through (fail in parsePort's discriminated union).
			return block;
		}
		const rawItem = (block.item ?? {}) as RawBlockItem;
		const transformedItem = transform(rawItem);
		return { ...block, item: transformedItem };
	});
	return { ...page, title, blocks };
}

// ---------------------------------------------------------------------------
// Lazy client — module import must not require env (keeps unit tests env-free)
// ---------------------------------------------------------------------------

let cachedClient: ReturnType<typeof buildClient> | null = null;

function buildClient() {
	// Anonymous reads only. The Public policy at cms.yesid.dev grants read on
	// services + services_translations + services_deliverables(+translations) +
	// services_sections(+translations) + languages (granted during Slice 18
	// Task 5). No token needed for the site's public content paths — keeps
	// this module free of `$env/dynamic/private` so the universal +layout.ts
	// chain doesn't pull server-only env into the client bundle.
	//
	// If authenticated reads are ever required (draft/preview mode, private
	// collections), move that usage into a `.server.ts` route + fetch there
	// with a server-only token. Keep this adapter anonymous.
	const url = publicEnv.PUBLIC_DIRECTUS_URL;
	if (!url) {
		throw new Error(
			'[directusAdapter] PUBLIC_DIRECTUS_URL is required. Set it in your environment.',
		);
	}
	// Wrap the native fetch with p-queue + retry so bursty SvelteKit `load()`
	// fan-out + transient 429/5xx don't translate into page failures. Defaults
	// stay under the Directus server RATE_LIMITER_* cap (50 pts / 1s / memory
	// store on Railway). See directus-queue.ts for the full policy.
	const queuedFetch = createQueuedFetch();
	return createDirectus<Schema>(url, { globals: { fetch: queuedFetch } }).with(rest());
}

function client() {
	if (!cachedClient) {
		cachedClient = buildClient();
	}
	return cachedClient;
}

// ---------------------------------------------------------------------------
// Row → domain mapping
// ---------------------------------------------------------------------------

export function toService(row: DirectusService): Service {
	const translations = row.translations ?? [];
	const service: Service = {
		id: row.id,
		station: row.station,
		title: toLocalizedString(translations, 'title'),
		description: toLocalizedString(translations, 'description'),
		relatedProjects: [], // populated by fetchServices via junction
	};
	if (row.svg) service.svg = row.svg;
	if (row.visible !== null && row.visible !== undefined) {
		service.visible = row.visible;
	}
	const subtitle = toLocalizedStringOrUndef(translations, 'subtitle');
	if (subtitle) service.subtitle = subtitle;
	const longDescription = toLocalizedStringOrUndef(translations, 'long_description');
	if (longDescription) service.longDescription = longDescription;
	const valueProposition = toLocalizedStringOrUndef(translations, 'value_proposition');
	if (valueProposition) service.valueProposition = valueProposition;
	const benefitHeadline = toLocalizedStringOrUndef(translations, 'benefit_headline');
	if (benefitHeadline) service.benefitHeadline = benefitHeadline;
	if (row.stack && row.stack.length > 0) service.stack = row.stack;

	// impactMetric: both value + label must be present; otherwise skip the whole block.
	const impactValue = toLocalizedStringOrUndef(translations, 'impact_metric_value');
	const impactLabel = toLocalizedStringOrUndef(translations, 'impact_metric_label');
	if (impactValue && impactLabel) {
		service.impactMetric = { value: impactValue, label: impactLabel };
	}

	// deliverables: O2M from services_deliverables; each row holds a LocalizedString
	// via its own translations junction. Sort by `sort` column; defaults to creation order.
	const deliverables = (row.deliverables ?? [])
		.slice()
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((d): LocalizedString => toLocalizedString(d.translations ?? [], 'label'));
	if (deliverables.length > 0) service.deliverables = deliverables;

	// sections: O2M from services_sections; each row holds title + content LocalizedStrings
	// via its own translations junction. Same sort contract as deliverables.
	const sections = (row.sections ?? [])
		.slice()
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((s): ServiceSection => ({
			title: toLocalizedString(s.translations ?? [], 'title'),
			content: toLocalizedString(s.translations ?? [], 'content'),
		}));
	if (sections.length > 0) service.sections = sections;

	return service;
}

// ---------------------------------------------------------------------------
// Project row → Project domain object
//
// Directus uses the canonical 'draft' | 'published' | 'archived' status enum
// (from the Global Draft pattern set up in 18c). The TS Project interface in
// @repo/shared keeps the legacy 'public' | 'private' | 'wip' triple. The
// adapter is the only place that translates between the two — consumer code
// downstream stays on the legacy enum. Mapping locked in 18e spec § 6:
//   published → public
//   draft     → wip
//   archived  → private
// ---------------------------------------------------------------------------

function statusFromDirectus(s: 'draft' | 'published' | 'archived'): 'public' | 'private' | 'wip' {
	switch (s) {
		case 'published':
			return 'public';
		case 'draft':
			return 'wip';
		case 'archived':
			return 'private';
	}
}

export function toProject(row: DirectusProject): Project {
	const translations = row.translations ?? [];

	const sections: ProjectSection[] = (row.sections ?? [])
		.slice()
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((s) => ({
			title: toLocalizedString(s.translations ?? [], 'title'),
			content: toLocalizedBlockEditorDoc(s.translations ?? [], 'content'),
		}));

	const impactMetrics: ImpactMetric[] = (row.impact_metrics ?? [])
		.slice()
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((m) => {
			const metric: ImpactMetric = {
				value: m.value,
				label: toLocalizedString(m.translations ?? [], 'label'),
			};
			if (m.before) metric.before = m.before;
			return metric;
		});

	const project: Project = {
		slug: row.id,
		title: toLocalizedString(translations, 'title'),
		oneLiner: toLocalizedString(translations, 'one_liner'),
		description: toLocalizedBlockEditorDoc(translations, 'description'),
		stack: row.stack ?? [],
		tags: row.tags ?? [],
		status: statusFromDirectus(row.status),
		featured: row.featured,
		relatedServices: (row.services ?? []).map((j) => j.service_id),
		sections,
	};

	if (row.repo_url) project.repoUrl = row.repo_url;
	if (row.live_url) project.liveUrl = row.live_url;
	if (row.readme_url) project.readmeUrl = row.readme_url;
	if (row.hero_image) project.image = row.hero_image;
	if (row.location) project.location = row.location;
	if (row.environment) project.environment = row.environment;
	if (row.version) project.version = row.version;

	if (impactMetrics.length > 0) {
		project.impactMetrics = impactMetrics;
		project.impactMetric = impactMetrics[0];
	}

	return project;
}

// ---------------------------------------------------------------------------
// Blog row → BlogPost domain object (slice-18 18f Phase 9 — Task 55)
//
// Mirrors the deterministic-fallback policy from $lib/content/blog.ts so
// posts authored without an explicit svg_illustration FK still resolve to
// one of the four bundled fallback illustrations per category. Animation
// resolution follows the same hash-based policy when the row's `animation`
// column is null/undefined.
// ---------------------------------------------------------------------------

const PRO_FALLBACKS = ['pro-database', 'pro-code', 'pro-pipeline', 'pro-chart'] as const;
const PERSONAL_FALLBACKS = [
	'personal-rocket',
	'personal-train',
	'personal-telescope',
	'personal-globe',
] as const;

function slugHash(slug: string): number {
	let hash = 0;
	for (let i = 0; i < slug.length; i++) {
		hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

function resolveSvgFallbackNameSync(
	slug: string,
	category: 'professional' | 'personal',
): string {
	const list = category === 'personal' ? PERSONAL_FALLBACKS : PRO_FALLBACKS;
	return list[slugHash(slug) % list.length]!;
}

const ALL_ANIMATIONS = ['draw', 'morph', 'draw-fill'] as const;

function resolveAnimationDeterministic(
	slug: string,
	explicit: string | undefined,
): BlogAnimation {
	if (explicit && (ALL_ANIMATIONS as readonly string[]).includes(explicit)) {
		return explicit as BlogAnimation;
	}
	return ALL_ANIMATIONS[slugHash(slug) % ALL_ANIMATIONS.length]!;
}

export function toBlogPost(row: DirectusBlogPostRow): BlogPost {
	const svgId =
		typeof row.svg_illustration === 'object' && row.svg_illustration !== null
			? row.svg_illustration.id
			: (row.svg_illustration ?? resolveSvgFallbackNameSync(row.id, row.category));
	return {
		slug: row.id,
		title: row.title,                   // AM2.5: direct read
		excerpt: row.excerpt,               // AM2.5: direct read
		date: row.date_published ? row.date_published.split('T')[0]! : '',
		lang: row.lang,
		category: row.category,
		tags: [...(row.tags ?? [])],
		animation: row.animation,
		svg: svgId,
		url: row.external ? (row.url ?? '') : `/blog/${row.id}`,
		external: row.external,
	};
}

// Re-export under the original names for tests (Task 60) + symmetry with
// $lib/content/blog.ts.
export { resolveSvgFallbackNameSync as resolveSvgFallbackName, resolveAnimationDeterministic };

const blogSvgAssetMemo = new Map<string, Promise<string>>();

function fileUuidFromIllustration(row: DirectusIllustrationRow | undefined): string | null {
	if (!row) return null;
	return typeof row.file === 'object' ? row.file.id : row.file;
}

async function fetchIllustrationFileMap(illustrationIds: readonly string[]): Promise<Map<string, string>> {
	const uniqueIds = [...new Set(illustrationIds.filter(Boolean))];
	if (uniqueIds.length === 0) return new Map();

	const rows = (await client().request(
		readItems('illustrations', {
			fields: ['id', { file: ['id'] } as unknown as keyof DirectusIllustrationRow],
			filter: { id: { _in: uniqueIds } },
			limit: -1,
		}),
	)) as unknown as DirectusIllustrationRow[];

	const out = new Map<string, string>();
	for (const row of rows) {
		const fileUuid = fileUuidFromIllustration(row);
		if (fileUuid) out.set(row.id, fileUuid);
	}
	return out;
}

async function fetchBlogSvgAsset(fileUuid: string): Promise<string> {
	const cached = blogSvgAssetMemo.get(fileUuid);
	if (cached) return cached;

	const promise = assetsFetch()(`${assetsBaseUrl()}/assets/${fileUuid}`).then((res) =>
		res.ok ? res.text() : '',
	);
	blogSvgAssetMemo.set(fileUuid, promise);
	return promise;
}

// ---------------------------------------------------------------------------
// Ports
// ---------------------------------------------------------------------------

async function fetchServices(
	filter?: Record<string, unknown>,
	ctx?: object,
): Promise<Service[]> {
	const rows = await client().request(
		readItems('services', {
			fields: [
				'*',
				{ translations: ['*'] } as unknown as keyof DirectusService,
				{ deliverables: ['id', 'sort', { translations: ['*'] }] } as unknown as keyof DirectusService,
				{ sections: ['id', 'sort', { translations: ['*'] }] } as unknown as keyof DirectusService,
			],
			limit: -1,
			...(filter ? { filter } : {}),
		}),
	);
	const services = (rows as unknown as DirectusService[]).map(toService);
	await Promise.all(services.map(async (service) => {
		const ids = await fetchRelatedProjectsViaJunction(service.id, ctx);
		(service as { relatedProjects: string[] }).relatedProjects = [...ids];
	}));
	return services;
}

// F2 — minimal-fields fetch for adjacency. Only `id + station` of visible
// services, sorted. Avoids the ~10x payload of a full-services read (all
// translations + deliverables + sections) just to compute neighbours.
interface AdjacencyEntry {
	readonly id: string;
	readonly station: number;
}

async function fetchAdjacencyList(): Promise<readonly AdjacencyEntry[]> {
	const rows = await client().request(
		readItems('services', {
			fields: ['id', 'station'],
			filter: { visible: { _neq: false } },
			sort: ['station'],
			limit: -1,
		}),
	);
	return rows as unknown as AdjacencyEntry[];
}

// Per-ctx adjacency memo. Keyed by the caller's PreviewContext object — when
// a SvelteKit load() threads the same ctx through multiple adjacency calls in
// a single request, they all hit a single upstream fetch. Without ctx, every
// call re-fetches (no global cache → no staleness risk between requests).
const adjacencyMemo = new WeakMap<object, Promise<readonly AdjacencyEntry[]>>();

async function getAdjacencyList(
	ctx?: object,
): Promise<readonly AdjacencyEntry[]> {
	if (!ctx) return fetchAdjacencyList();
	const cached = adjacencyMemo.get(ctx);
	if (cached) return cached;
	const p = fetchAdjacencyList();
	adjacencyMemo.set(ctx, p);
	return p;
}

const todo = (where: string): never => {
	throw new Error(
		`[directusAdapter] ${where} not implemented yet — lands in Slice 18 Task 5+ once the collection is designed.`,
	);
};

// ---------------------------------------------------------------------------
// transformNavLink — slice-18i Phase 5 Task 5.1
//
// Converts a raw DirectusNavLinkRow into the NavLink shape expected by
// NavLinkSchema. Field-aware:
//   - label, subtitle   → LocalizedString via toLocalizedString (translations)
//   - href, placement, priority  → plain fields on the parent row
//   - icon              → M2O FK to icons collection; resolved to icon name string
// ---------------------------------------------------------------------------

function transformNavLink(raw: DirectusNavLinkRow): import('$lib/content/nav').NavLink {
	const tr = (raw.translations ?? []) as ReadonlyArray<{ languages_code: string }>;
	const priority = raw.priority === 1 || raw.priority === 2 ? (raw.priority as 1 | 2) : 1;

	// Resolve icon M2O FK to icon name string.
	let icon: string | undefined;
	if (raw.icon && typeof raw.icon === 'object' && 'name' in raw.icon) {
		const name = (raw.icon as DirectusNavLinkIconRow).name;
		if (name) icon = name;
	} else if (typeof raw.icon === 'string' && raw.icon.length > 0) {
		icon = raw.icon;
	}

	// subtitle is optional — only present on menu/footer placement rows.
	const subtitleLS = toLocalizedStringOrUndef(
		tr as ReadonlyArray<{ languages_code: string }>,
		'subtitle',
	);

	const result: import('$lib/content/nav').NavLink = {
		label: toLocalizedString(tr, 'label'),
		href: raw.href,
		priority,
	};
	if (subtitleLS !== undefined) result.subtitle = subtitleLS;
	if (icon !== undefined) result.icon = icon;
	return result;
}

// ---------------------------------------------------------------------------
// transformErrorPage — slice-18i Phase 5 Task 5.3
//
// Converts a raw DirectusErrorPageRow into the ErrorPageContent shape.
// Field-aware:
//   - label, heading, description → LocalizedString via toLocalizedString
//   - terminal_line (snake→camel terminalLine) → LocalizedString, then en value
//     — ErrorPageContent.terminalLine is a plain string (en-only, per spec)
//   - suggestions → per-locale JSON array with mixed content:
//       label: LocalizedString (per locale)
//       href:  plain string (from en row, same across locales)
// ---------------------------------------------------------------------------

function transformErrorPage(raw: DirectusErrorPageRow): import('$lib/content/nav').ErrorPageContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<{ languages_code: string }>;

	// terminal_line is a plain string (en-only) per ErrorPageContent interface.
	const terminalLineLS = toLocalizedString(tr, 'terminal_line');
	const terminalLine = terminalLineLS.en;

	// suggestions: per-locale JSON array. label is LocalizedString; href is plain (read from en).
	// Walk each locale's suggestions array and merge by index.
	const rawTr = (raw.translations ?? []) as ReadonlyArray<DirectusErrorPageTranslation>;
	const suggestionsByLocale = new Map<string, Array<{ label: string; href: string }>>();
	for (const row of rawTr) {
		if (Array.isArray(row.suggestions) && row.suggestions.length > 0) {
			suggestionsByLocale.set(row.languages_code, row.suggestions as Array<{ label: string; href: string }>);
		}
	}
	const enSuggestions = suggestionsByLocale.get('en') ?? [];
	const suggestions: readonly { label: LocalizedString; href: string }[] = enSuggestions.map(
		(enSug, idx) => {
			const labelLS: LocalizedString = {
				en: typeof enSug.label === 'string' ? enSug.label : '',
			};
			const frSug = suggestionsByLocale.get('fr')?.[idx];
			if (frSug && typeof frSug.label === 'string' && frSug.label.length > 0) {
				labelLS.fr = frSug.label;
			}
			const esSug = suggestionsByLocale.get('es')?.[idx];
			if (esSug && typeof esSug.label === 'string' && esSug.label.length > 0) {
				labelLS.es = esSug.label;
			}
			return {
				label: labelLS,
				href: typeof enSug.href === 'string' ? enSug.href : '',
			};
		},
	);

	return {
		label: toLocalizedString(tr, 'label'),
		heading: toLocalizedString(tr, 'heading'),
		description: toLocalizedString(tr, 'description'),
		terminalLine,
		suggestions,
	};
}

// ---------------------------------------------------------------------------
// Tech-stack row shapes — slice-18g Phase 4 Task 8.
//
// Mirrors the tech_stack Directus collection: each item has flat scalar fields
// plus a `translations` alias expanding to rows keyed by languages_code.
// Services + projects are M2M junctions (tech_stack_services, tech_stack_projects).
// ---------------------------------------------------------------------------

interface DirectusTechStackTranslation {
	languages_code: 'en' | 'fr' | 'es';
	what_it_is: BlockEditorDoc | null;
	what_i_use_it_for: BlockEditorDoc | null;
	why_i_use_it_instead: BlockEditorDoc | null;
}

interface DirectusTechStackRow {
	id: string;
	name: string;
	/** @deprecated Legacy bare-slug string field. Kept until Phase 4 Task 9 drops it from the DB. */
	icon?: string | null;
	/** M2O FK to icons collection — expanded as a nested record when queried. */
	icon_id?: { id: string; name: string; iconify_id: string | null; svg_override: string | null } | null;
	status: 'draft' | 'published' | 'archived';
	sort: number;
	translations: readonly DirectusTechStackTranslation[];
	services?: ReadonlyArray<{ services_id: string }>;
	projects?: ReadonlyArray<{ projects_id: string }>;
}

export function toTechStackItem(row: DirectusTechStackRow): TechStackItem {
	return {
		id: row.id,
		name: row.name,
		icon: row.icon_id ?? null,
		what_it_is: toLocalizedBlockEditorDoc(row.translations, 'what_it_is'),
		what_i_use_it_for: toLocalizedBlockEditorDoc(row.translations, 'what_i_use_it_for'),
		why_i_use_it_instead: toLocalizedBlockEditorDoc(row.translations, 'why_i_use_it_instead'),
		relatedServices: row.services?.map((s) => s.services_id) ?? [],
		relatedProjects: row.projects?.map((p) => p.projects_id) ?? [],
	};
}

// ---------------------------------------------------------------------------
// Site-meta singleton + route_seo row shapes — slice-18 18h Phase 4 Task 10.
//
// Q9 amendment: TWO adapter methods (meta.site() + meta.siteSeoDefaults())
// share ONE Directus singleton row via internal `fetchSingletonRow()` helper
// + per-request WeakMap memo on the raw row. Brand SiteMeta and
// SiteSeoDefaults are different output shapes from the same source.
// ---------------------------------------------------------------------------

interface DirectusSiteMetaTranslation {
	languages_code: 'en' | 'fr' | 'es';
	tagline: string;
	description: string;
	default_description: string;
	owner_job_title: string;
}

export interface DirectusSiteMetaRow {
	id: number;
	name: string;
	email: string;
	github_url: string;
	linkedin_url: string | null;
	upwork_url: string | null;
	owner_name: string;
	owner_locality: string;
	owner_region: string;
	owner_country: string;
	/** CSV — split + trim + filter at mapper boundary. Nullable: a freshly-
	 *  created singleton row (or one with the field unset in Data Studio)
	 *  reports the field as `undefined`/`null` rather than as an empty array. */
	owner_knows_about: string | readonly string[] | null | undefined; // cast-csv special: REST returns string[], but legacy GraphQL/raw paths may return CSV string
	default_og_image: string | null;
	theme_color: string;
	translations: readonly DirectusSiteMetaTranslation[];
}

interface DirectusRouteSeoTranslation {
	languages_code: 'en' | 'fr' | 'es';
	title: string | null;
	description: string | null;
}

export interface DirectusRouteSeoRow {
	id: number;
	path: string;
	og_image: string | null;
	status: 'draft' | 'published' | 'archived';
	translations: readonly DirectusRouteSeoTranslation[];
}

/**
 * Brand SiteMeta mapper — TS shape unchanged (Q9). Re-uses the row's
 * translations array for the localized fields (tagline, description,
 * jobTitle) and splits the CSV `owner_knows_about` column into a string
 * array.
 */
export function toSiteMeta(row: DirectusSiteMetaRow): SiteMeta {
	const links: SiteLinks = {
		email: row.email,
		github: row.github_url,
		...(row.linkedin_url && { linkedin: row.linkedin_url }),
		...(row.upwork_url && { upwork: row.upwork_url }),
	};
	// owner_knows_about — Directus cast-csv special returns string[] in REST.
	// Tolerate string fallback (raw query / non-SDK paths) by splitting on
	// comma. Defense-in-depth: a wiped or freshly-created singleton row may
	// report the field as null/undefined; treat that as "no entries" rather
	// than letting `.map` blow up the whole site.
	const rawKnowsSource = row.owner_knows_about ?? [];
	const rawKnows: readonly string[] =
		typeof rawKnowsSource === 'string'
			? rawKnowsSource.split(',')
			: rawKnowsSource;
	const knowsAbout = rawKnows.map((s) => s.trim()).filter(Boolean);
	const owner: SiteOwner = {
		name: row.owner_name,
		jobTitle: toLocalizedString(row.translations, 'owner_job_title'),
		address: {
			locality: row.owner_locality,
			region: row.owner_region,
			country: row.owner_country,
		},
		knowsAbout,
	};
	return {
		name: row.name,
		tagline: toLocalizedString(row.translations, 'tagline'),
		description: toLocalizedString(row.translations, 'description'),
		links,
		owner,
	};
}

/**
 * SiteSeoDefaults mapper — new Q9 shape pulled from the SAME singleton row.
 * `defaultOgImage` is the raw UUID (consumer wraps with `asset(uuid, 'og-1200')`).
 */
export function toSiteSeoDefaults(row: DirectusSiteMetaRow): SiteSeoDefaults {
	return {
		defaultOgImage: row.default_og_image,
		themeColor: row.theme_color,
		defaultDescription: toLocalizedString(row.translations, 'default_description'),
	};
}

/**
 * Per-route override mapper. title/description are NULLABLE — null means
 * "no override, fall back" so the composer can distinguish editor intent.
 */
export function toRouteSeoOverride(row: DirectusRouteSeoRow): RouteSeoOverride {
	return {
		path: row.path,
		ogImage: row.og_image,
		title: toLocalizedStringNullable(row.translations, 'title'),
		description: toLocalizedStringNullable(row.translations, 'description'),
	};
}

// Per-request dedupe of the RAW singleton row. Both meta.site() and
// meta.siteSeoDefaults() delegate to `fetchSingletonRow()` so a SvelteKit
// `load()` calling both in a single Promise.all only triggers ONE upstream
// fetch.
//
// Two-tier dedupe:
//   1. Per-ctx WeakMap when the caller threads a PreviewContext (preview
//      tokens etc.) — gc-safe, lifetime bounded by the ctx object.
//   2. In-flight singleton promise for ctx-less callers — survives only
//      until the underlying fetch settles, so concurrent ports inside one
//      Promise.all share one round-trip but the next request re-fetches.
//
// The previous shape used a stable `defaultCtx` sentinel object as the
// WeakMap key for ctx-less callers, which pinned the first fetched row for
// the lifetime of the process. A bad row (e.g., a wiped CMS singleton at
// app boot — incident 2026-04-27) then poisoned every subsequent request,
// because the cache never invalidated. The in-flight pattern preserves the
// dedupe goal while bounding the cache to a single fetch's lifetime.
const siteRowMemo = new WeakMap<object, Promise<DirectusSiteMetaRow>>();
let inFlightSingletonRow: Promise<DirectusSiteMetaRow> | undefined;

async function fetchSingletonRow(ctx?: PreviewContext): Promise<DirectusSiteMetaRow> {
	if (ctx) {
		const cached = siteRowMemo.get(ctx as object);
		if (cached) return cached;
	} else if (inFlightSingletonRow) {
		return inFlightSingletonRow;
	}

	const promise = client()
		.request(
			readSingleton('site_meta', {
				fields: [
					'id',
					'name',
					'email',
					'github_url',
					'linkedin_url',
					'upwork_url',
					'owner_name',
					'owner_locality',
					'owner_region',
					'owner_country',
					'owner_knows_about',
					'default_og_image',
					'theme_color',
					{ translations: ['languages_code', 'tagline', 'description', 'default_description', 'owner_job_title'] } as unknown as keyof DirectusSiteMetaRow,
				],
			}),
		)
		.then((row) => row as unknown as DirectusSiteMetaRow);

	if (ctx) {
		siteRowMemo.set(ctx as object, promise);
	} else {
		inFlightSingletonRow = promise;
		// Clear the slot when the fetch settles (success OR failure) so a
		// transient bad row at boot can't poison the rest of the process.
		promise.finally(() => {
			if (inFlightSingletonRow === promise) inFlightSingletonRow = undefined;
		});
	}
	return promise;
}

// ---------------------------------------------------------------------------
// Assets fetch — direct /assets/<uuid> reads, NOT through @directus/sdk.
//
// Slice 18d Phase 8 (Task 28-33): the metro-svg consumer flip stops inlining
// the SVG via Vite `?raw` and pulls it from Directus instead. The Directus
// `/assets/<id>` endpoint returns the raw asset bytes (no `{ data: ... }`
// envelope), so we go around the SDK and use a queued fetch directly.
//
// Sharing the `createQueuedFetch` factory with the SDK client keeps the
// rate-limit budget (50 pts / 1s server cap) honored across both READ paths
// from a single SvelteKit `load()` fan-out.
// ---------------------------------------------------------------------------

let cachedAssetsFetch: typeof fetch | null = null;

function assetsFetch(): typeof fetch {
	if (!cachedAssetsFetch) {
		cachedAssetsFetch = createQueuedFetch();
	}
	return cachedAssetsFetch;
}

function assetsBaseUrl(): string {
	const url = publicEnv.PUBLIC_DIRECTUS_URL;
	if (!url) {
		throw new Error(
			'[directusAdapter] PUBLIC_DIRECTUS_URL is required. Set it in your environment.',
		);
	}
	return url.replace(/\/+$/, '');
}

const SvgPayloadSchema = z
	.string()
	.min(1)
	.refine((s) => s.includes('<svg'), { message: 'response is not an SVG' });

async function fetchMetroSvg(): Promise<string> {
	const id = assetIdFor('images/montreal-metro.svg');
	const url = `${assetsBaseUrl()}/assets/${id}`;
	const res = await assetsFetch()(url);
	if (!res.ok) {
		throw new Error(
			`[directusAdapter] content.metroSvg: ${res.status} ${res.statusText} fetching ${url}`,
		);
	}
	const text = await res.text();
	return parsePort('content.metroSvg', SvgPayloadSchema, text);
}

// Shared adjacent schema — same shape as static adapter's services.adjacent
// parsePort call. Extracted so both ports parse through identical gates.
const AdjacentServiceSchema = z.object({
	prev: ServiceSchema.optional(),
	next: ServiceSchema.optional(),
});

// ---------------------------------------------------------------------------
// Projects fetch helpers (18e Phase 7 — Task 29)
//
// fetchProjects expands every nested child the toProject mapper reads:
//   - translations (title, one_liner, description)
//   - sections (id + sort + per-row translations)
//   - impact_metrics (id + sort + value + before + per-row translations)
//   - services (M2M junction rows: id + project_id + service_id)
//
// Fields literal is inlined (rather than hoisted to a const) so the Directus
// SDK's strict tuple-typed `fields` parameter accepts it without a cast — the
// same pattern fetchServices follows.
// ---------------------------------------------------------------------------

async function fetchProjects(filter?: Record<string, unknown>): Promise<Project[]> {
	const rows = await client().request(
		readItems('projects', {
			fields: [
				'*',
				{ translations: ['*'] },
				{ sections: ['id', 'sort', { translations: ['*'] }] },
				{ impact_metrics: ['id', 'sort', 'value', 'before', { translations: ['*'] }] },
				{ services: ['id', 'project_id', 'service_id'] },
			],
			limit: -1,
			...(filter ? { filter } : {}),
		}),
	);
	return (rows as unknown as DirectusProject[]).map(toProject);
}

// Two-stage byService: first hit the M2M junction to collect project ids
// associated with a given service, then fetch the matching projects in full.
// Going through projects_services instead of doing a relational filter on
// projects keeps the cascade FK contract symmetrical with the seed-script
// path and matches the live-state read pattern verified in 18e Phase 6.
async function fetchProjectIdsForService(serviceId: string): Promise<readonly string[]> {
	const rows = await client().request(
		readItems('projects_services', {
			fields: ['project_id'],
			filter: { service_id: { _eq: serviceId } },
			limit: -1,
		}),
	);
	return (rows as unknown as Array<{ project_id: string }>).map((r) => r.project_id);
}

// Per-request memoized junction read for services.relatedProjects.
// Mirrors the adjacencyMemo pattern above.
// Without ctx, every call re-fetches (no global cache → no staleness risk).
const relatedProjectsMemo = new WeakMap<object, Map<string, Promise<readonly string[]>>>();

async function fetchRelatedProjectsViaJunction(
	serviceId: string,
	ctx?: object,
): Promise<readonly string[]> {
	if (!ctx) return fetchProjectIdsForService(serviceId);
	let serviceMap = relatedProjectsMemo.get(ctx);
	if (!serviceMap) {
		serviceMap = new Map();
		relatedProjectsMemo.set(ctx, serviceMap);
	}
	const cached = serviceMap.get(serviceId);
	if (cached) return cached;
	const p = fetchProjectIdsForService(serviceId);
	serviceMap.set(serviceId, p);
	return p;
}

export const directusAdapter: ContentAdapter = {
	services: {
		all: async (ctx) =>
			parsePort('services.all', z.array(ServiceSchema), await fetchServices(undefined, ctx)),
		byId: async (id, ctx) => {
			const rows = await fetchServices({ id: { _eq: id } }, ctx);
			return parsePort('services.byId', ServiceSchema.optional(), rows[0]);
		},
		visible: async (ctx) =>
			parsePort(
				'services.visible',
				z.array(ServiceSchema),
				await fetchServices({ visible: { _neq: false } }, ctx),
			),
		adjacent: async (id, ctx) => {
			// Step 1: get a lightweight id/station list (memoized per-ctx).
			const list = await getAdjacencyList(ctx);
			const index = list.findIndex((s) => s.id === id);
			if (index === -1) {
				return parsePort('services.adjacent', AdjacentServiceSchema, {});
			}

			// Step 2: fetch only the neighbour rows (2 max) in full detail.
			const prevId = index > 0 ? list[index - 1].id : undefined;
			const nextId = index < list.length - 1 ? list[index + 1].id : undefined;
			const neighbourIds = [prevId, nextId].filter(
				(v): v is string => typeof v === 'string',
			);
			const neighbours =
				neighbourIds.length === 0
					? []
					: await fetchServices({ id: { _in: neighbourIds } }, ctx);
			const byId = new Map(neighbours.map((s) => [s.id, s]));

			return parsePort('services.adjacent', AdjacentServiceSchema, {
				prev: prevId ? byId.get(prevId) : undefined,
				next: nextId ? byId.get(nextId) : undefined,
			});
		},
	},

	projects: {
		all: async () =>
			parsePort('projects.all', z.array(ProjectSchema), await fetchProjects()),
		bySlug: async (slug) => {
			const rows = await fetchProjects({ id: { _eq: slug } });
			return parsePort('projects.bySlug', ProjectSchema.optional(), rows[0]);
		},
		featured: async () =>
			parsePort(
				'projects.featured',
				z.array(ProjectSchema),
				await fetchProjects({ featured: { _eq: true } }),
			),
		public: async () =>
			parsePort(
				'projects.public',
				z.array(ProjectSchema),
				await fetchProjects({ status: { _eq: 'published' } }),
			),
		byService: async (serviceId) => {
			const ids = await fetchProjectIdsForService(serviceId);
			if (ids.length === 0) {
				return parsePort('projects.byService', z.array(ProjectSchema), []);
			}
			const rows = await fetchProjects({ id: { _in: ids } });
			return parsePort('projects.byService', z.array(ProjectSchema), rows);
		},
		allTags: async () => {
			const rows = await client().request(
				readItems('projects', { fields: ['tags'], limit: -1 }),
			);
			const all = (rows as unknown as Array<{ tags: string[] }>).flatMap(
				(r) => r.tags ?? [],
			);
			return parsePort(
				'projects.allTags',
				z.array(z.string()),
				[...new Set(all)].sort(),
			);
		},
		allStackItems: async () => {
			const rows = await client().request(
				readItems('projects', { fields: ['stack'], limit: -1 }),
			);
			const all = (rows as unknown as Array<{ stack: string[] }>).flatMap(
				(r) => r.stack ?? [],
			);
			return parsePort(
				'projects.allStackItems',
				z.array(z.string()),
				[...new Set(all)].sort(),
			);
		},
		serviceIdsForProjects: async () => {
			const rows = await client().request(
				readItems('projects_services', { fields: ['service_id'], limit: -1 }),
			);
			const all = (rows as unknown as Array<{ service_id: string }>).map(
				(r) => r.service_id,
			);
			return parsePort(
				'projects.serviceIdsForProjects',
				z.array(z.string()),
				[...new Set(all)].sort(),
			);
		},
	},

	blog: {
		all: async () => {
			const rows = (await client().request(
				readItems('blog_posts', {
					fields: [
						'id',
						'status',
						'date_published',
						'sort',
						'lang',
						'category',
						'tags',
						'external',
						'url',
						'animation',
						'title',
						'excerpt',
						{ cover_image: ['id'] } as unknown as keyof DirectusBlogPostRow,
						{
							svg_illustration: ['id', 'label', 'category', { file: ['id'] }],
						} as unknown as keyof DirectusBlogPostRow,
					],
					filter: { status: { _eq: 'published' } },
					sort: ['-date_published'],
					limit: -1,
				}),
			)) as unknown as DirectusBlogPostRow[];
			return parsePort('blog.all', z.array(BlogPostSchema), rows.map(toBlogPost));
		},
		bySlug: async (slug) => {
			const rows = (await client().request(
				readItems('blog_posts', {
					fields: [
						'id',
						'status',
						'date_published',
						'sort',
						'lang',
						'category',
						'tags',
						'external',
						'url',
						'animation',
						'title',
						'excerpt',
						{ cover_image: ['id'] } as unknown as keyof DirectusBlogPostRow,
						{
							svg_illustration: ['id', 'label', 'category', { file: ['id'] }],
						} as unknown as keyof DirectusBlogPostRow,
					],
					filter: { _and: [{ id: { _eq: slug } }, { status: { _eq: 'published' } }] },
					limit: 1,
				}),
			)) as unknown as DirectusBlogPostRow[];
			const post = rows[0] ? toBlogPost(rows[0]) : undefined;
			return parsePort('blog.bySlug', BlogPostSchema.optional(), post);
		},
		html: async (slug, ctx) => {
			const body = await directusAdapter.blog.bodyBySlug(slug, ctx);
			if (!body) return '';
			return serializeBlocksToHtml(body);
		},
		bodyBySlug: async (slug) => {
			const rows = (await client().request(
				readItems('blog_posts', {
					fields: ['body'],
					filter: { _and: [{ id: { _eq: slug } }, { status: { _eq: 'published' } }] },
					limit: 1,
				}),
			)) as unknown as Array<{ body: BlockEditorDoc | null }>;
			if (!rows[0]) return null;
			const body = rows[0].body;
			if (body === null) return null;
			return parsePort('blog.bodyBySlug', BlockEditorDocSchema, body);
		},
		byCategory: async (category, ctx) => {
			const rows = (await client().request(
				readItems('blog_posts', {
					fields: [
						'id',
						'status',
						'date_published',
						'sort',
						'lang',
						'category',
						'tags',
						'external',
						'url',
						'animation',
						'title',
						'excerpt',
						{ svg_illustration: ['id'] } as unknown as keyof DirectusBlogPostRow,
					],
					filter: { _and: [{ category: { _eq: category } }, { status: { _eq: 'published' } }] },
					sort: ['-date_published'],
					limit: -1,
				}),
			)) as unknown as DirectusBlogPostRow[];
			return parsePort('blog.byCategory', z.array(BlogPostSchema), rows.map(toBlogPost));
		},
		byTag: async (category, tag, ctx) => {
			const rows = (await client().request(
				readItems('blog_posts', {
					fields: [
						'id',
						'status',
						'date_published',
						'sort',
						'lang',
						'category',
						'tags',
						'external',
						'url',
						'animation',
						'title',
						'excerpt',
						{ svg_illustration: ['id'] } as unknown as keyof DirectusBlogPostRow,
					],
					filter: {
						_and: [
							{ category: { _eq: category } },
							{ status: { _eq: 'published' } },
							{ tags: { _contains: tag } as unknown as Record<string, unknown> },
						],
					},
					sort: ['-date_published'],
					limit: -1,
				}),
			)) as unknown as DirectusBlogPostRow[];
			return parsePort('blog.byTag', z.array(BlogPostSchema), rows.map(toBlogPost));
		},
		tagsForCategory: async (category, ctx) => {
			const posts = await directusAdapter.blog.byCategory(category, ctx);
			const tags = new Set<string>();
			for (const p of posts) for (const t of p.tags) tags.add(t);
			return parsePort('blog.tagsForCategory', z.array(z.string()), [...tags].sort());
		},
		languagesForCategory: async (category, ctx) => {
			const posts = await directusAdapter.blog.byCategory(category, ctx);
			const langs = new Set<Locale>();
			for (const p of posts) langs.add(p.lang);
			return parsePort('blog.languagesForCategory', z.array(LocaleSchema), [...langs].sort());
		},
		latest: async (count, category, ctx) => {
			const filterCategory = category ?? 'professional';
			const rows = (await client().request(
				readItems('blog_posts', {
					fields: [
						'id',
						'status',
						'date_published',
						'sort',
						'lang',
						'category',
						'tags',
						'external',
						'url',
						'animation',
						'title',
						'excerpt',
						{ svg_illustration: ['id'] } as unknown as keyof DirectusBlogPostRow,
					],
					filter: {
						_and: [
							{ category: { _eq: filterCategory } },
							{ status: { _eq: 'published' } },
						],
					},
					sort: ['-date_published'],
					limit: count,
				}),
			)) as unknown as DirectusBlogPostRow[];
			return parsePort('blog.latest', z.array(BlogPostSchema), rows.map(toBlogPost));
		},
		svgContent: async (post, ctx) => {
			const illustrationId = post.svg || resolveSvgFallbackNameSync(post.slug, post.category);
			const fileMap = await fetchIllustrationFileMap([illustrationId]);
			const fileUuid = fileMap.get(illustrationId);
			if (!fileUuid) return '';
			return fetchBlogSvgAsset(fileUuid);
		},
		svgContentsForPosts: async (posts, ctx) => {
			const illustrationIds = posts.map((post) =>
				post.svg || resolveSvgFallbackNameSync(post.slug, post.category),
			);
			const fileMap = await fetchIllustrationFileMap(illustrationIds);
			const entries = await Promise.all(
				posts.map(async (post, index) => {
					const illustrationId = illustrationIds[index]!;
					const fileUuid = fileMap.get(illustrationId);
					return [post.slug, fileUuid ? await fetchBlogSvgAsset(fileUuid) : ''] as const;
				}),
			);
			return Object.fromEntries(entries);
		},
		resolveSvgFallbackName: async (slug, category) => {
			return resolveSvgFallbackNameSync(slug, category);
		},
		resolveAnimation: async (slug, explicit) => {
			return resolveAnimationDeterministic(slug, explicit);
		},
	},

	meta: {
		site: async (ctx) => {
			const row = await fetchSingletonRow(ctx);
			return parsePort('meta.site', SiteMetaSchema, toSiteMeta(row));
		},

		siteSeoDefaults: async (ctx) => {
			const row = await fetchSingletonRow(ctx);
			return parsePort('meta.siteSeoDefaults', SiteSeoDefaultsSchema, toSiteSeoDefaults(row));
		},

		routeSeo: {
			byPath: async (path, ctx) => {
				const rows = (await client().request(
					readItems('route_seo', {
						filter: {
							_and: [{ path: { _eq: path } }, { status: { _eq: 'published' } }],
						},
						fields: [
							'id',
							'path',
							'og_image',
							'status',
							{ translations: ['languages_code', 'title', 'description'] } as unknown as keyof DirectusRouteSeoRow,
						],
						limit: 1,
					}),
				)) as unknown as DirectusRouteSeoRow[];
				const item = rows[0] ? toRouteSeoOverride(rows[0]) : undefined;
				return parsePort(
					'meta.routeSeo.byPath',
					RouteSeoOverrideSchema.optional(),
					item,
				);
			},
		},

		// Composer (slice-18 18h Phase 4 Task 11). Fetches site + siteSeoDefaults
		// + routeSeo via the meta port (which dedupes through the WeakMap memo
		// on the raw singleton row), then merges with code-side defaults.
		forRoute: async (routeId, locale, params, ctx) => {
			// /__error is handled before any CMS fetch — last-resort fallback path.
			if (routeId === '/__error') {
				const [siteMeta, siteSeoDefaults] = await Promise.all([
					directusAdapter.meta.site(ctx),
					directusAdapter.meta.siteSeoDefaults(ctx),
				]);
				return errorSeoFallback({ locale, siteMeta, siteSeoDefaults });
			}

			// Dynamic factory dispatch (services / projects / blog).
			const dynamicFactory = routeSeoFactories[routeId];
			if (dynamicFactory) {
				const [siteMeta, siteSeoDefaults] = await Promise.all([
					directusAdapter.meta.site(ctx),
					directusAdapter.meta.siteSeoDefaults(ctx),
				]);
				const factoryArgs: FactoryArgs = {
					params: params ?? {},
					locale,
					ctx,
					adapter: directusAdapter,
					siteMeta,
					siteSeoDefaults,
				};
				return dynamicFactory(factoryArgs);
			}

			// Static-route compose (CMS path).
			const codeDefaults = codeRouteSeoDefaults[routeId];
			if (!codeDefaults) {
				throw new Error(
					`[meta.forRoute] Unknown route id: ${routeId}. Add an entry in route-seo-defaults.ts or seed a route_seo row.`,
				);
			}
			const [siteMeta, siteSeoDefaults, routeOverride] = await Promise.all([
				directusAdapter.meta.site(ctx),
				directusAdapter.meta.siteSeoDefaults(ctx),
				directusAdapter.meta.routeSeo.byPath(routeId, ctx),
			]);
			return composePageSeo({
				routeId,
				locale,
				siteMeta,
				siteSeoDefaults,
				routeOverride,
				codeDefaults,
			});
		},
	},

	techStack: {
		all: async () => {
			const rows = (await client().request(
				readItems('tech_stack', {
					fields: [
						'id',
						'name',
						// 'icon' legacy string field no longer read — consumers use icon_id now.
						{ icon_id: ['id', 'name', 'iconify_id', 'svg_override'] } as unknown as keyof DirectusTechStackRow,
						'status',
						'sort',
						{ translations: ['languages_code', 'what_it_is', 'what_i_use_it_for', 'why_i_use_it_instead'] } as unknown as keyof DirectusTechStackRow,
						{ services: ['services_id'] } as unknown as keyof DirectusTechStackRow,
						{ projects: ['projects_id'] } as unknown as keyof DirectusTechStackRow,
					],
					filter: { status: { _eq: 'published' } },
					sort: ['sort'],
					limit: -1,
				}),
			)) as unknown as DirectusTechStackRow[];
			return parsePort('techStack.all', z.array(TechStackItemSchema), rows.map(toTechStackItem));
		},

		byId: async (id) => {
			const rows = (await client().request(
				readItems('tech_stack', {
					fields: [
						'id',
						'name',
						// 'icon' legacy string field no longer read — consumers use icon_id now.
						{ icon_id: ['id', 'name', 'iconify_id', 'svg_override'] } as unknown as keyof DirectusTechStackRow,
						'status',
						'sort',
						{ translations: ['languages_code', 'what_it_is', 'what_i_use_it_for', 'why_i_use_it_instead'] } as unknown as keyof DirectusTechStackRow,
						{ services: ['services_id'] } as unknown as keyof DirectusTechStackRow,
						{ projects: ['projects_id'] } as unknown as keyof DirectusTechStackRow,
					],
					filter: { _and: [{ id: { _eq: id } }, { status: { _eq: 'published' } }] },
					limit: 1,
				}),
			)) as unknown as DirectusTechStackRow[];
			const item = rows[0] ? toTechStackItem(rows[0]) : undefined;
			return parsePort('techStack.byId', TechStackItemSchema.optional(), item);
		},

		content: async (id) => {
			// Fetch the item and concatenate the 3 Block Editor docs as HTML.
			// Uses the English locale (the always-present fallback) for the
			// legacy `content()` callsite that expects a string.
			const rows = (await client().request(
				readItems('tech_stack', {
					fields: [
						'id',
						'status',
						{ translations: ['languages_code', 'what_it_is', 'what_i_use_it_for', 'why_i_use_it_instead'] } as unknown as keyof DirectusTechStackRow,
					],
					filter: { _and: [{ id: { _eq: id } }, { status: { _eq: 'published' } }] },
					limit: 1,
				}),
			)) as unknown as DirectusTechStackRow[];
			if (!rows[0]) return '';
			const item = toTechStackItem(rows[0]);
			return [
				serializeBlocksToHtml(item.what_it_is.en),
				serializeBlocksToHtml(item.what_i_use_it_for.en),
				serializeBlocksToHtml(item.why_i_use_it_instead.en),
			].join('\n');
		},
	},

	content: {
		// -----------------------------------------------------------------------
		// Task 4.1 — Home-page block methods (slice-18i Phase 4).
		//
		// Pattern A: loadPage('home', ctx) fetches + transforms + validates the
		// entire page via PageSchema once per request (memoized on ctx.pageCache).
		// Each method projects a single block_* item from the already-validated
		// PageData. No redundant parsePort calls here — the Zod gate runs inside
		// loadPage.
		//
		// Fail-fast: throws with route + missing block name per spec §3.7.
		// -----------------------------------------------------------------------

		async hero(ctx) {
			const page = await loadPage('home', ctx);
			const block = page.blocks.find((x) => x.collection === 'block_hero');
			if (!block) throw new Error('[content.hero] home page has no block_hero');
			return block.item;
		},

		async heroAnim(ctx) {
			// heroAnim is now part of HeroContent (carried through typed PageData).
			// No out-of-band cache needed — just project block.item.heroAnim.
			const page = await loadPage('home', ctx);
			const block = page.blocks.find((x) => x.collection === 'block_hero');
			if (!block) throw new Error('[content.heroAnim] home page has no block_hero');
			return block.item.heroAnim;
		},

		async manifesto(ctx) {
			const page = await loadPage('home', ctx);
			const block = page.blocks.find((x) => x.collection === 'block_manifesto');
			if (!block) throw new Error('[content.manifesto] home page has no block_manifesto');
			return block.item;
		},

		async proofReel(ctx) {
			const page = await loadPage('home', ctx);
			const block = page.blocks.find((x) => x.collection === 'block_proof_reel');
			if (!block) throw new Error('[content.proofReel] home page has no block_proof_reel');
			return block.item;
		},

		async servicesGrid(ctx) {
			const page = await loadPage('home', ctx);
			const block = page.blocks.find((x) => x.collection === 'block_services_grid');
			if (!block) throw new Error('[content.servicesGrid] home page has no block_services_grid');
			return block.item;
		},

		async about(ctx) {
			const page = await loadPage('home', ctx);
			const block = page.blocks.find((x) => x.collection === 'block_about_intro');
			if (!block) throw new Error('[content.about] home page has no block_about_intro');
			return block.item;
		},

		async cta(ctx) {
			const page = await loadPage('home', ctx);
			const block = page.blocks.find((x) => x.collection === 'block_cta');
			if (!block) throw new Error('[content.cta] home page has no block_cta');
			return block.item;
		},

		async closer(ctx) {
			const page = await loadPage('home', ctx);
			const block = page.blocks.find((x) => x.collection === 'block_closer');
			if (!block) throw new Error('[content.closer] home page has no block_closer');
			return block.item;
		},

		// -----------------------------------------------------------------------
		// Task 4.2 — Detail-page block methods (slice-18i Phase 4).
		// -----------------------------------------------------------------------

		async aboutPage(ctx) {
			const page = await loadPage('about', ctx);
			const block = page.blocks.find((x) => x.collection === 'block_about_content');
			if (!block) throw new Error('[content.aboutPage] about page has no block_about_content');
			return block.item;
		},

		async contactPage(ctx) {
			const page = await loadPage('contact', ctx);
			const block = page.blocks.find((x) => x.collection === 'block_contact_content');
			if (!block) throw new Error('[content.contactPage] contact page has no block_contact_content');
			return block.item;
		},

		async techStackPage(ctx) {
			const page = await loadPage('tech-stack', ctx);
			const block = page.blocks.find((x) => x.collection === 'block_tech_stack_page_content');
			if (!block) throw new Error('[content.techStackPage] tech-stack page has no block_tech_stack_page_content');
			return block.item;
		},

		// -----------------------------------------------------------------------
		// Phase 7 — blog + projects page chrome (slice-18i BLOCKER fix-up).
		// -----------------------------------------------------------------------

		async blogPage(ctx) {
			const page = await loadPage('blog', ctx);
			const block = page.blocks.find((x) => x.collection === 'block_blog_page_content');
			if (!block) throw new Error('[content.blogPage] blog page has no block_blog_page_content');
			return block.item;
		},

		async projectsPage(ctx) {
			const page = await loadPage('projects', ctx);
			const block = page.blocks.find((x) => x.collection === 'block_projects_page_content');
			if (!block) throw new Error('[content.projectsPage] projects page has no block_projects_page_content');
			return block.item;
		},

		// -----------------------------------------------------------------------
		// Task 4.3 — Derived methods (no Directus query — pure local functions).
		// -----------------------------------------------------------------------

		async heroMock() {
			return parsePort('content.heroMock', HeroDataSchema, generateHeroData());
		},

		async initialHeroData() {
			return parsePort('content.initialHeroData', HeroDataSchema, INITIAL_HERO_DATA);
		},

		// -----------------------------------------------------------------------
		// Phase 5 — nav + errorPage (slice-18i Task 5.1 + 5.3).
		// Delegates nav reads to directusAdapter.nav.byPlacement so the sub-port
		// is the single source of truth for nav_links queries.
		// -----------------------------------------------------------------------

		async navLinks(ctx) {
			return directusAdapter.nav.byPlacement('header', ctx);
		},

		async menuItems(ctx) {
			return directusAdapter.nav.byPlacement('menu', ctx);
		},

		async errorPage(statusCode, ctx) {
			// _or filter: cast filter to unknown to satisfy SDK's strict Schema-aware
			// typing (same pattern as tech_stack _and filters with complex shapes).
			const raw = (await client().request(
				readItems('error_pages', {
					filter: {
						_or: [{ status_code: { _eq: statusCode } }, { status_code: { _eq: 0 } }],
						status: { _eq: 'published' },
					} as unknown as Record<string, unknown>,
					fields: ['*', 'translations.*'] as unknown as (keyof DirectusErrorPageRow)[],
					limit: 2,
				}),
			)) as unknown as DirectusErrorPageRow[];

			// Prefer the specific status_code over the fallback (0).
			const exact = raw.find((r) => r.status_code === statusCode);
			const fallback = raw.find((r) => r.status_code === 0);
			const chosen = exact ?? fallback;

			if (!chosen) {
				throw new Error(
					`[content.errorPage] no row for status_code=${statusCode} and no fallback (status_code=0) row exists`,
				);
			}

			const transformed = transformErrorPage(chosen);
			return parsePort('content.errorPage', ErrorPageContentSchema, transformed);
		},

		// -----------------------------------------------------------------------
		// Pre-existing Directus overrides (slice-18d, slice-18f).
		// -----------------------------------------------------------------------

		metroSvg: async () => fetchMetroSvg(),

		morphShapes: async (ctx) => {
			const rows = (await client().request(
				readItems('morph_shapes', {
					fields: ['id', 'label', 'path', 'viewbox', 'sort'],
					sort: ['sort'],
					limit: -1,
				}),
			)) as unknown as MorphShape[];
			return parsePort('content.morphShapes', z.array(MorphShapeSchema), rows);
		},
	},

	// -------------------------------------------------------------------------
	// nav port — slice-18i Phase 5 Task 5.1
	//
	// Reads the nav_links flat collection filtered by placement. Sorted by
	// priority ascending. content.navLinks and content.menuItems delegate here.
	// Footer and mobile overlay consumers call this directly.
	// -------------------------------------------------------------------------

	nav: {
		async byPlacement(placement, ctx?) {
			let raw: DirectusNavLinkRow[];
			if (ctx) {
				raw = (await fetchAllNavRows(ctx)).filter((row) => row.placement === placement);
			} else {
				raw = (await client().request(
					readItems('nav_links', {
						filter: {
							placement: { _eq: placement },
							status: { _eq: 'published' },
						} as unknown as Record<string, unknown>,
						fields: ['*', 'translations.*', 'icon.*'] as unknown as (keyof DirectusNavLinkRow)[],
						sort: ['priority'],
					}),
				)) as unknown as DirectusNavLinkRow[];
			}

			const transformed = raw.map(transformNavLink);
			return parsePort('nav.byPlacement', z.array(NavLinkSchema), transformed);
		},
	},
};
