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

import { createDirectus, rest, readItems } from '@directus/sdk';
import { env as publicEnv } from '$env/dynamic/public';
import { z } from 'zod';

import type { ContentAdapter } from './types';
import type { Locale, LocalizedString, Service, ServiceSection } from '$lib/types';
import { createQueuedFetch } from './directus-queue';
import { parsePort } from '$lib/schemas/parse';
import { ServiceSchema } from '$lib/schemas/service';

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
	lottie_reverse?: boolean | null;
	visible?: boolean | null;
	related_projects?: string[] | null;
	stack?: string[] | null;
	translations?: DirectusServiceTranslation[];
	deliverables?: DirectusServiceDeliverable[];
	sections?: DirectusServiceSectionRow[];
}

interface Schema {
	services: DirectusService[];
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
		relatedProjects: row.related_projects ?? [],
	};
	if (row.icon) service.icon = row.icon;
	if (row.svg) service.svg = row.svg;
	if (row.lottie_reverse !== null && row.lottie_reverse !== undefined) {
		service.lottieReverse = row.lottie_reverse;
	}
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
// Ports
// ---------------------------------------------------------------------------

async function fetchServices(filter?: Record<string, unknown>): Promise<Service[]> {
	const rows = await client().request(
		readItems('services', {
			fields: [
				'*',
				{ translations: ['*'] },
				{ deliverables: ['id', 'sort', { translations: ['*'] }] },
				{ sections: ['id', 'sort', { translations: ['*'] }] },
			],
			limit: -1,
			...(filter ? { filter } : {}),
		}),
	);
	return (rows as unknown as DirectusService[]).map(toService);
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

// Shared adjacent schema — same shape as static adapter's services.adjacent
// parsePort call. Extracted so both ports parse through identical gates.
const AdjacentServiceSchema = z.object({
	prev: ServiceSchema.optional(),
	next: ServiceSchema.optional(),
});

export const directusAdapter: ContentAdapter = {
	services: {
		all: async () =>
			parsePort('services.all', z.array(ServiceSchema), await fetchServices()),
		byId: async (id) => {
			const rows = await fetchServices({ id: { _eq: id } });
			return parsePort('services.byId', ServiceSchema.optional(), rows[0]);
		},
		visible: async () =>
			parsePort(
				'services.visible',
				z.array(ServiceSchema),
				await fetchServices({ visible: { _neq: false } }),
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
					: await fetchServices({ id: { _in: neighbourIds } });
			const byId = new Map(neighbours.map((s) => [s.id, s]));

			return parsePort('services.adjacent', AdjacentServiceSchema, {
				prev: prevId ? byId.get(prevId) : undefined,
				next: nextId ? byId.get(nextId) : undefined,
			});
		},
	},

	projects: {
		all: async () => todo('projects.all'),
		bySlug: async () => todo('projects.bySlug'),
		featured: async () => todo('projects.featured'),
		public: async () => todo('projects.public'),
		byService: async () => todo('projects.byService'),
		allTags: async () => todo('projects.allTags'),
		allStackItems: async () => todo('projects.allStackItems'),
		serviceIdsForProjects: async () => todo('projects.serviceIdsForProjects'),
	},

	blog: {
		all: async () => todo('blog.all'),
		bySlug: async () => todo('blog.bySlug'),
		html: async () => todo('blog.html'),
		byCategory: async () => todo('blog.byCategory'),
		byTag: async () => todo('blog.byTag'),
		tagsForCategory: async () => todo('blog.tagsForCategory'),
		languagesForCategory: async () => todo('blog.languagesForCategory'),
		latest: async () => todo('blog.latest'),
		svgContent: async () => todo('blog.svgContent'),
		svgContentsForPosts: async () => todo('blog.svgContentsForPosts'),
		resolveSvgFallbackName: async () => todo('blog.resolveSvgFallbackName'),
		resolveAnimation: async () => todo('blog.resolveAnimation'),
	},

	meta: {
		site: async () => todo('meta.site'),
		forRoute: async () => todo('meta.forRoute'),
	},

	techStack: {
		all: async () => todo('techStack.all'),
		byId: async () => todo('techStack.byId'),
		byLayer: async () => todo('techStack.byLayer'),
		byDomain: async () => todo('techStack.byDomain'),
		connections: async () => todo('techStack.connections'),
		incomingConnections: async () => todo('techStack.incomingConnections'),
		outgoingRelations: async () => todo('techStack.outgoingRelations'),
		incomingRelations: async () => todo('techStack.incomingRelations'),
		content: async () => todo('techStack.content'),
		allScenarios: async () => todo('techStack.allScenarios'),
		scenarioForDomains: async () => todo('techStack.scenarioForDomains'),
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
	},
};
