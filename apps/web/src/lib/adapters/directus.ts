// Directus adapter — scaffold for Slice 18 Task 4.
//
// NOT yet wired: `src/lib/adapters/index.ts` still re-exports the static
// adapter. The flip happens in Slice 18 Task 7 after Tasks 5 (real collection
// design in Data Studio) and 6 (seed + full port impls) land.
//
// Q6 locale strategy (spec D1/D2/D3 context): we target the native Directus
// Translations field type — each domain collection exposes a `translations`
// alias that expands to rows keyed by `languages_code`. `toLocalizedString`
// composes a LocalizedString at the adapter boundary so consumer code stays
// unchanged.
//
// Only the `services` port has a real implementation — the remaining five
// ports throw a clear "TODO Task 5+" error if called. The ContentAdapter
// annotation at the bottom is the compile-time gate that Task 4 must clear.

import { createDirectus, rest, readItems, readSingleton } from '@directus/sdk';
import { env as publicEnv } from '$env/dynamic/public';
import { z } from 'zod';

import type { ContentAdapter } from './types';
import type {
	BlockEditorDoc,
	BlogAnimation,
	BlogCategory,
	BlogPost,
	ImpactMetric,
	Locale,
	LocalizedBlockEditorDoc,
	LocalizedString,
	MorphShape,
	PageSeo,
	PreviewContext,
	Project,
	ProjectSection,
	RouteSeoOverride,
	Service,
	ServiceSection,
	SiteLinks,
	SiteMeta,
	SiteOwner,
	SiteSeoDefaults,
	TechStackItem,
} from '$lib/types';
import { createQueuedFetch } from './directus-queue';
import { parsePort } from '$lib/schemas/parse';
import { ProjectSchema } from '$lib/schemas/project';
import { ServiceSchema } from '$lib/schemas/service';
import { BlogPostSchema } from '$lib/schemas/blog';
import { LocaleSchema } from '$lib/schemas/shared';
import { MorphShapeSchema } from '$lib/schemas/morph-shape';
import { TechStackItemSchema } from '$lib/schemas/tech-stack';
import { SiteMetaSchema } from '$lib/schemas/meta';
import { SiteSeoDefaultsSchema } from '$lib/schemas/site-seo-defaults';
import { RouteSeoOverrideSchema } from '$lib/schemas/route-seo';
import { assetIdFor, BlockEditorDocSchema, serializeBlocksToHtml } from '@repo/shared';
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
	for (const service of services) {
		const ids = await fetchRelatedProjectsViaJunction(service.id, ctx);
		(service as { relatedProjects: string[] }).relatedProjects = [...ids];
	}
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
			// Step 1: resolve svg_illustration id for this post.
			const rows = (await client().request(
				readItems('blog_posts', {
					fields: [
						{ svg_illustration: ['id', { file: ['id'] }] } as unknown as keyof DirectusBlogPostRow,
					],
					filter: { id: { _eq: post.slug } },
					limit: 1,
				}),
			)) as unknown as Array<{ svg_illustration: { id: string; file?: { id: string } } | string | null }>;
			let illustrationId: string | null = null;
			if (rows[0]) {
				const ill = rows[0].svg_illustration;
				illustrationId = typeof ill === 'object' && ill !== null ? ill.id : ill;
			}
			if (!illustrationId) {
				illustrationId = resolveSvgFallbackNameSync(post.slug, post.category);
			}
			// Step 2: look up the file UUID from the illustrations collection.
			const illRow = (await client().request(
				readItems('illustrations', {
					fields: [{ file: ['id'] } as unknown as 'file'],
					filter: { id: { _eq: illustrationId } },
					limit: 1,
				}),
			)) as unknown as Array<{ file: { id: string } | string }>;
			const fileUuid = illRow[0]
				? typeof illRow[0].file === 'object'
					? illRow[0].file.id
					: illRow[0].file
				: null;
			if (!fileUuid) return '';
			// Step 3: fetch raw SVG bytes using the SSR-safe queued fetch.
			const url = `${assetsBaseUrl()}/assets/${fileUuid}`;
			const res = await assetsFetch()(url);
			return res.ok ? await res.text() : '';
		},
		svgContentsForPosts: async (posts, ctx) => {
			const out: Record<string, string> = {};
			const tasks = posts.map(async (p) => {
				out[p.slug] = await directusAdapter.blog.svgContent(p, ctx);
			});
			await Promise.all(tasks);
			return out;
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
		hero: async () => todo('content.hero'),
		heroAnim: async () => todo('content.heroAnim'),
		manifesto: async () => todo('content.manifesto'),
		proofReel: async () => todo('content.proofReel'),
		servicesGrid: async () => todo('content.servicesGrid'),
		about: async () => todo('content.about'),
		cta: async () => todo('content.cta'),
		closer: async () => todo('content.closer'),
		skillsJourneyPanels: async () => todo('content.skillsJourneyPanels'),
		skillsJourneyCta: async () => todo('content.skillsJourneyCta'),
		navLinks: async () => todo('content.navLinks'),
		menuItems: async () => todo('content.menuItems'),
		metroBookends: async () => todo('content.metroBookends'),
		errorPage: async () => todo('content.errorPage'),
		aboutPage: async () => todo('content.aboutPage'),
		contactPage: async () => todo('content.contactPage'),
		techStackPage: async () => todo('content.techStackPage'),
		heroMock: async () => todo('content.heroMock'),
		initialHeroData: async () => todo('content.initialHeroData'),
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
};
