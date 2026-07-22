// Code-side per-route technical SEO defaults.
//
// Editorial SEO for static routes is CMS-owned in route_seo and emitted to
// $lib/content/route-seo.ts. This file only keeps technical behavior that
// should not be authored in CMS: ogType, noIndex, title composition strategy,
// and JSON-LD factories.
//
// Kept tightly scoped: 8 static routes (`/`, `/about`, `/contact`, `/services`,
// `/projects`, `/blog`, `/blog/personal`, `/tech-stack`). Dynamic routes
// (`/services/[id]`, `/projects/[slug]`, `/blog/[slug]`) have their own
// factories in `route-seo-factories.ts`.
//
// `composedTitleStrategy` lets the home route keep its full CMS title
// verbatim, while other static routes append the brand suffix.

import type { Locale, LocalizedString, PageSeo, SchemaOrgNode, SiteMeta } from '$lib/types';
import {
	buildPersonNode,
	buildProfessionalServiceNode,
	buildProfilePageNode,
	buildWebSiteNode,
} from '$lib/adapters/jsonld';
import {
	buildCollectionRouteNodes,
	buildRouteBreadcrumbNode,
} from '$lib/adapters/route-jsonld';
import { resolveLocale } from '$lib/utils/locale';
import { canonicalFor } from '$lib/utils/seo-defaults';

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
	/** Per-route jsonLd factory; consumes CMS-composed SEO copy plus SiteMeta. */
	jsonLdFactory: (
		siteMeta: SiteMeta,
		locale: Locale,
		seoCopy: { titleBody: LocalizedString; description: LocalizedString },
	) => SchemaOrgNode[];
}

export const codeRouteSeoDefaults: Record<string, CodeRouteSeoDefaults> = {
	'/': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'yesid. | Digital Infrastructure that Moves.' },
		composedTitleStrategy: 'verbatim',
		jsonLdFactory: (sm, locale) => [
			buildPersonNode(sm, locale),
			buildProfessionalServiceNode(sm, locale),
			buildWebSiteNode(sm, locale),
			buildProfilePageNode(canonicalFor('/', locale)),
		],
	},
	'/about': {
		ogType: 'profile',
		noIndex: false,
		fallbackTitle: { en: 'About Yesid' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (sm, locale) => [
			buildPersonNode(sm, locale),
			buildProfilePageNode(canonicalFor('/about', locale)),
			buildRouteBreadcrumbNode('/about', locale, [
				['/about', 'About'],
			]),
		],
	},
	'/contact': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Contact' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (_sm, locale) => [
			buildRouteBreadcrumbNode('/contact', locale, [
				['/contact', 'Contact'],
			]),
		],
	},
	'/services': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Services' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (_sm, locale, seoCopy) =>
			buildCollectionRouteNodes({
				path: '/services',
				locale,
				nameFallback: 'Services',
				description: resolveLocale(seoCopy.description, locale),
			}),
	},
	'/projects': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Projects' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (_sm, locale, seoCopy) =>
			buildCollectionRouteNodes({
				path: '/projects',
				locale,
				nameFallback: 'Projects',
				description: resolveLocale(seoCopy.description, locale),
			}),
	},
	'/blog': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Blog' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (_sm, locale, seoCopy) =>
			buildCollectionRouteNodes({
				path: '/blog',
				locale,
				nameFallback: 'Blog',
				description: resolveLocale(seoCopy.description, locale),
			}),
	},
	'/blog/personal': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Personal Blog', fr: 'Blogue perso' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (_sm, locale, seoCopy) =>
			buildCollectionRouteNodes({
				path: '/blog/personal',
				locale,
				nameFallback: 'Personal Blog',
				description: resolveLocale(seoCopy.description, locale),
				crumbs: [
					['/blog', 'Blog'],
					['/blog/personal', 'Personal'],
				],
			}),
	},
	'/tech-stack': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Tech Stack' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (_sm, locale) => [
			buildRouteBreadcrumbNode('/tech-stack', locale, [
				['/tech-stack', 'Tech Stack'],
			]),
		],
	},
};
