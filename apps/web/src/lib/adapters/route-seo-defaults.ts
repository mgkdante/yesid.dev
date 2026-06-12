// Code-side per-route technical SEO defaults — slice-18 18h Phase 4 Task 11.
//
// CANONICAL SEO OVERRIDE SOURCE (decision, slice-28.5 audit #62): this file
// is where per-route SEO is authored. The Directus route_seo +
// route_seo_translations collections are a DEAD END — they hold zero rows,
// no export-fallbacks fetcher/emitter exists for them (dropped as YAGNI in
// 27.1), and the live static adapter returns `routeSeo.byPath -> undefined`
// unconditionally, so a Data Studio edit there never reaches a rendered
// <title>/<meta>. Decision on record: ARCHIVE those collections rather than
// build the fetcher — the actual archival (CMS schema change, drift-gated)
// is flagged to slice-26; do NOT seed rows into route_seo expecting them to
// render. If per-locale SEO copy needs CMS ownership when French ships,
// revisit by adding a route-seo fetcher + emitter and wiring routeOverride —
// until then, edit THIS file. (The byPath plumbing in static.ts/types.ts
// stays: the RUN_PARITY oracle exercises it — see static.ts.)
//
// The 18h split still applies within the code side: the (now-archived-path)
// CMS was to own editorial copy; code owns technical fields (ogType, noIndex)
// + jsonLd factories that consume the brand SiteMeta. Single file, easy to
// audit, low maintenance cost.
//
// Kept tightly scoped: 8 static routes (`/`, `/about`, `/contact`, `/services`,
// `/projects`, `/blog`, `/blog/personal`, `/tech-stack`). Dynamic routes
// (`/services/[id]`, `/projects/[slug]`, `/blog/[slug]`) have their own
// factories in `route-seo-factories.ts`.
//
// `composedTitleStrategy` (P3 finding 2026-04-27): the home `/` uses
// `'yesid. — X'` brand-first em-dash; every other route uses `'X | yesid.'`
// pipe-suffix. This flag preserves both formats through the composer.

import type { Locale, PageSeo, SchemaOrgNode, SiteMeta } from '$lib/types';
import {
	buildBreadcrumbListNode,
	buildCollectionPageNode,
	buildPersonNode,
	buildProfilePageNode,
	buildWebSiteNode,
} from '$lib/adapters/jsonld';
import { SITE_HOST } from '$lib/utils/seo-defaults';

export interface CodeRouteSeoDefaults {
	/** Per-route OG type — `<meta property="og:type">`. */
	ogType: PageSeo['ogType'];
	/** Per-route `noIndex` — only `/__error` is `true`. */
	noIndex: boolean;
	/** Code-side fallback title body when no `route_seo` row exists yet. */
	fallbackTitle: { en: string; fr?: string; es?: string };
	/**
	 * P3 finding 2026-04-27: home `/` preserves `'yesid. — X'` em-dash format
	 * verbatim; all other routes get `' | ${siteMeta.name}'` appended in the
	 * composer.
	 */
	composedTitleStrategy: 'verbatim' | 'append-brand';
	/** Per-route jsonLd factory; consumes SiteMeta (brand) only. */
	jsonLdFactory: (siteMeta: SiteMeta, locale: Locale) => SchemaOrgNode[];
}

export const codeRouteSeoDefaults: Record<string, CodeRouteSeoDefaults> = {
	'/': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'yesid. — Digital Infrastructure that Moves.' },
		composedTitleStrategy: 'verbatim',
		jsonLdFactory: (sm) => [
			buildPersonNode(sm),
			buildWebSiteNode(sm),
			buildProfilePageNode(SITE_HOST),
		],
	},
	'/about': {
		ogType: 'profile',
		noIndex: false,
		fallbackTitle: { en: 'About Yesid' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (sm) => [
			buildPersonNode(sm),
			buildProfilePageNode(`${SITE_HOST}/about`),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'About', url: `${SITE_HOST}/about` },
				],
				`${SITE_HOST}/about`,
			),
		],
	},
	'/contact': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Contact' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: () => [
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Contact', url: `${SITE_HOST}/contact` },
				],
				`${SITE_HOST}/contact`,
			),
		],
	},
	'/services': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Services' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: () => [
			buildCollectionPageNode({
				name: 'Services',
				description:
					'Digital infrastructure services in four stations: databases & SQL, data pipelines & automation, dashboards & analytics, websites & e-commerce.',
				url: `${SITE_HOST}/services`,
			}),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Services', url: `${SITE_HOST}/services` },
				],
				`${SITE_HOST}/services`,
			),
		],
	},
	'/projects': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Projects' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: () => [
			buildCollectionPageNode({
				name: 'Projects',
				description:
					'Recent freelance and client work: transit pipelines, analytics platforms, dashboards, ETL, and infrastructure projects.',
				url: `${SITE_HOST}/projects`,
			}),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Projects', url: `${SITE_HOST}/projects` },
				],
				`${SITE_HOST}/projects`,
			),
		],
	},
	'/blog': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Blog' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: () => [
			buildCollectionPageNode({
				name: 'Blog',
				description:
					'Notes on data infrastructure, SQL, PostgreSQL, dbt, Power BI, and analytics systems.',
				url: `${SITE_HOST}/blog`,
			}),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Blog', url: `${SITE_HOST}/blog` },
				],
				`${SITE_HOST}/blog`,
			),
		],
	},
	'/blog/personal': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Personal Blog' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: () => [
			buildCollectionPageNode({
				name: 'Personal Blog',
				description:
					'Off-work notes: tools, reading, experiments, and side projects. Longer-form than the professional blog.',
				url: `${SITE_HOST}/blog/personal`,
			}),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Blog', url: `${SITE_HOST}/blog` },
					{ name: 'Personal', url: `${SITE_HOST}/blog/personal` },
				],
				`${SITE_HOST}/blog/personal`,
			),
		],
	},
	'/tech-stack': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Tech Stack' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: () => [
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Tech Stack', url: `${SITE_HOST}/tech-stack` },
				],
				`${SITE_HOST}/tech-stack`,
			),
		],
	},
};
