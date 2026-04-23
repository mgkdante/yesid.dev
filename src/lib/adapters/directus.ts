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

import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

import type { ContentAdapter } from './types';
import type { Locale, LocalizedString, Service } from '$lib/types';

// ---------------------------------------------------------------------------
// Directus schema (target shape — Task 5 redefines collections to match)
// ---------------------------------------------------------------------------

interface DirectusServiceTranslation {
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

interface DirectusService {
	id: string;
	station: number;
	icon?: string | null;
	svg?: string | null;
	lottie_reverse?: boolean | null;
	visible?: boolean | null;
	related_projects?: string[] | null;
	stack?: string[] | null;
	translations?: DirectusServiceTranslation[];
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
	const url = publicEnv.PUBLIC_DIRECTUS_URL;
	const token = privateEnv.DIRECTUS_READ_TOKEN;
	if (!url) {
		throw new Error(
			'[directusAdapter] PUBLIC_DIRECTUS_URL is required. Set it in your environment.',
		);
	}
	if (!token) {
		throw new Error(
			'[directusAdapter] DIRECTUS_READ_TOKEN is required. Set it in your environment.',
		);
	}
	return createDirectus<Schema>(url, { globals: { fetch } })
		.with(staticToken(token))
		.with(rest());
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

function toService(row: DirectusService): Service {
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
	// impactMetric / deliverables / sections land in Task 5 once the
	// services_deliverables + services_sections related collections are
	// designed in Data Studio.
	return service;
}

// ---------------------------------------------------------------------------
// Ports
// ---------------------------------------------------------------------------

async function fetchServices(filter?: Record<string, unknown>): Promise<Service[]> {
	const rows = await client().request(
		readItems('services', {
			fields: ['*', { translations: ['*'] }],
			...(filter ? { filter } : {}),
		}),
	);
	return (rows as unknown as DirectusService[]).map(toService);
}

const todo = (where: string): never => {
	throw new Error(
		`[directusAdapter] ${where} not implemented yet — lands in Slice 18 Task 5+ once the collection is designed.`,
	);
};

export const directusAdapter: ContentAdapter = {
	services: {
		all: async () => fetchServices(),
		byId: async (id) => {
			const rows = await fetchServices({ id: { _eq: id } });
			return rows[0];
		},
		visible: async () => fetchServices({ visible: { _neq: false } }),
		adjacent: async (id) => {
			const visible = await fetchServices({ visible: { _neq: false } });
			const sorted = [...visible].sort((a, b) => a.station - b.station);
			const index = sorted.findIndex((s) => s.id === id);
			if (index === -1) return {};
			return {
				prev: index > 0 ? sorted[index - 1] : undefined,
				next: index < sorted.length - 1 ? sorted[index + 1] : undefined,
			};
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
