/** Live editorial contracts ported verbatim from the served legal-truth tests. */
import type { ExportData } from '../../export-data';
import { PageSeoSchema } from '../../../../web/src/lib/schemas/seo';

type Locale = 'en' | 'fr' | 'es';

const PRIVACY_PROFILE_TRUTH: Record<Locale, string> = {
	en: 'No advertising profile and no automated decision-making.',
	fr: 'Aucun profil publicitaire et aucune décision automatisée.',
	es: 'Ningún perfil publicitario ni decisión automatizada.',
};

const COOKIE_PROFILE_TRUTH: Record<Locale, string> = {
	en: 'There is no advertising technology, advertising profile, or automated decision-making.',
	fr: "Il n'y a aucune technologie publicitaire, aucun profil publicitaire ni aucune décision automatisée.",
	es: 'No hay tecnología publicitaria, perfiles publicitarios ni decisiones automatizadas.',
};

const FORBIDDEN_ANALYTICS_OVERCLAIMS: Record<Locale, readonly string[]> = {
	en: [
		'there is no advertising technology, no cross-site tracking, and no profiling.',
		'fully anonymous',
		'creates no persistent identifier.',
		'does no cross-site tracking',
		'no ip processing',
		'no profiling and',
	],
	fr: [
		"il n'y a ni technologie publicitaire, ni suivi entre les sites, ni profilage.",
		'entièrement anonyme',
		'ne crée aucun identifiant persistant.',
		"n'effectue aucun suivi entre les sites",
		"aucun traitement de l'adresse ip",
		'aucun profilage,',
	],
	es: [
		'no hay tecnología publicitaria, ni rastreo entre sitios, ni elaboración de perfiles.',
		'completamente anónimo',
		'no crea identificadores persistentes.',
		'no hace seguimiento entre sitios',
		'sin tratamiento de la dirección ip',
		'sin perfilado y',
	],
};


/** Wording sources shared with synthetic validator tests. */
export const legalTruth = {
	privacyProfile: PRIVACY_PROFILE_TRUTH, cookieProfile: COOKIE_PROFILE_TRUTH,
	forbidden: FORBIDDEN_ANALYTICS_OVERCLAIMS,
};

function requireTruth(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error('Live content validation failed: ' + message);
}

export function validateLegalTruth(data: ExportData): void {
	const pages = data.legalPages;
	requireTruth(pages, 'missing legal pages');
	requireTruth(JSON.stringify(pages.map(page => page.slug)) === JSON.stringify([
		'privacy', 'terms', 'cookies', 'accessibility', 'notice',
	]), 'legal page registry');
	for (const locale of ['en', 'fr', 'es'] as const) {
		for (const page of pages) {
			const content = JSON.stringify({ title: page.title[locale], body: page.body[locale] });
			const body = JSON.stringify(page.body[locale]);
			requireTruth(!/\bGatineau\b/i.test(content) && !/\b[A-Z]\d[A-Z][ -]?\d[A-Z]\d\b/i.test(content), locale + ' private location');
			requireTruth(body?.includes('contact@yesid.dev') && !body.includes('admin@yesid.dev') && !/umami/i.test(body), locale + ' legal contact: ' + page.slug);
			if (page.slug !== 'privacy' && page.slug !== 'cookies') continue;
			requireTruth(body.includes(page.slug === 'privacy' ? PRIVACY_PROFILE_TRUTH[locale] : COOKIE_PROFILE_TRUTH[locale]), locale + ' profiling claim: ' + page.slug);
			for (const overclaim of FORBIDDEN_ANALYTICS_OVERCLAIMS[locale]) requireTruth(!body.toLowerCase().includes(overclaim), locale + ' processing overclaim: ' + page.slug);
		}
	}
}

/** Validate explicit SEO description fields using the route boundary's schema. */
export function validateSeoDescriptions(data: ExportData): void {
	const schema = PageSeoSchema.shape.description;
	const check = (label: string, value: unknown): void => {
		requireTruth(schema.safeParse(value).success, label + ' SEO description');
	};
	check('site defaults', data.siteSeoDefaults?.defaultDescription);
	for (const row of data.routeSeo ?? []) if (row.description !== null) check(row.path, row.description);
	for (const service of data.services ?? []) if (service.seoDescription !== undefined) check(service.id, service.seoDescription);
	for (const post of data.blogPosts ?? []) if (post.seoDescription !== undefined) check(post.slug, { en: post.seoDescription });
}

export function validateLiveExport(data: ExportData): void {
	validateLegalTruth(data);
	validateSeoDescriptions(data);
	validateDemoFeedDisclosure(data);
}

/** cafc9f02 HeroMetrics: demo dashboard copy must not claim a live STM feed. */
export const demoFeedDisclosures = { en: 'DEMO · STM-STYLE', fr: 'DÉMO · STYLE STM' } as const;

export function validateDemoFeedDisclosure(data: ExportData): void {
	for (const locale of ['en', 'fr'] as const) {
		requireTruth(data.siteLabels?.heroDashboard?.vehiclesSub[locale] === demoFeedDisclosures[locale], locale + ' demo-feed disclosure');
	}
}
