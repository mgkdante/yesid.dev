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
	buildBreadcrumbListNode,
	buildCollectionPageNode,
	buildPersonNode,
	buildProfessionalServiceNode,
	buildProfilePageNode,
	buildWebSiteNode,
} from '$lib/adapters/jsonld';
import { crumbName } from '$lib/adapters/route-seo-factories';
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
			buildBreadcrumbListNode(
				[
					{ name: crumbName('/', locale, 'Home'), url: canonicalFor('/', locale) },
					{ name: crumbName('/about', locale, 'About'), url: canonicalFor('/about', locale) },
				],
				canonicalFor('/about', locale),
			),
		],
	},
	'/contact': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Contact' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (_sm, locale) => [
			buildBreadcrumbListNode(
				[
					{ name: crumbName('/', locale, 'Home'), url: canonicalFor('/', locale) },
					{ name: crumbName('/contact', locale, 'Contact'), url: canonicalFor('/contact', locale) },
				],
				canonicalFor('/contact', locale),
			),
		],
	},
	'/services': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Services' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (_sm, locale, seoCopy) => [
			buildCollectionPageNode({
				name: crumbName('/services', locale, 'Services'),
				description: resolveLocale(seoCopy.description, locale),
				url: canonicalFor('/services', locale),
			}),
			buildBreadcrumbListNode(
				[
					{ name: crumbName('/', locale, 'Home'), url: canonicalFor('/', locale) },
					{ name: crumbName('/services', locale, 'Services'), url: canonicalFor('/services', locale) },
				],
				canonicalFor('/services', locale),
			),
		],
	},
	'/projects': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Projects' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (_sm, locale, seoCopy) => [
			buildCollectionPageNode({
				name: crumbName('/projects', locale, 'Projects'),
				description: resolveLocale(seoCopy.description, locale),
				url: canonicalFor('/projects', locale),
			}),
			buildBreadcrumbListNode(
				[
					{ name: crumbName('/', locale, 'Home'), url: canonicalFor('/', locale) },
					{ name: crumbName('/projects', locale, 'Projects'), url: canonicalFor('/projects', locale) },
				],
				canonicalFor('/projects', locale),
			),
		],
	},
	'/blog': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Blog' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (_sm, locale, seoCopy) => [
			buildCollectionPageNode({
				name: crumbName('/blog', locale, 'Blog'),
				description: resolveLocale(seoCopy.description, locale),
				url: canonicalFor('/blog', locale),
			}),
			buildBreadcrumbListNode(
				[
					{ name: crumbName('/', locale, 'Home'), url: canonicalFor('/', locale) },
					{ name: crumbName('/blog', locale, 'Blog'), url: canonicalFor('/blog', locale) },
				],
				canonicalFor('/blog', locale),
			),
		],
	},
	'/blog/personal': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Personal Blog', fr: 'Blogue perso' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (_sm, locale, seoCopy) => [
			buildCollectionPageNode({
				name: crumbName('/blog/personal', locale, 'Personal Blog'),
				description: resolveLocale(seoCopy.description, locale),
				url: canonicalFor('/blog/personal', locale),
			}),
			buildBreadcrumbListNode(
				[
					{ name: crumbName('/', locale, 'Home'), url: canonicalFor('/', locale) },
					{ name: crumbName('/blog', locale, 'Blog'), url: canonicalFor('/blog', locale) },
					{ name: crumbName('/blog/personal', locale, 'Personal'), url: canonicalFor('/blog/personal', locale) },
				],
				canonicalFor('/blog/personal', locale),
			),
		],
	},
	'/tech-stack': {
		ogType: 'website',
		noIndex: false,
		fallbackTitle: { en: 'Tech Stack' },
		composedTitleStrategy: 'append-brand',
		jsonLdFactory: (_sm, locale) => [
			buildBreadcrumbListNode(
				[
					{ name: crumbName('/', locale, 'Home'), url: canonicalFor('/', locale) },
					{ name: crumbName('/tech-stack', locale, 'Tech Stack'), url: canonicalFor('/tech-stack', locale) },
				],
				canonicalFor('/tech-stack', locale),
			),
		],
	},
};
