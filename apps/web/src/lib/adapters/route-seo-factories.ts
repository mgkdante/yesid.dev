// Dynamic-route SEO factories — extracted from apps/web/src/lib/content/meta.ts
// in slice-18 18h Phase 4 Task 11.
//
// Each factory consumes (params, locale, ctx, adapter, siteMeta, siteSeoDefaults)
// and returns a PageSeo. The caller — staticAdapter.meta.forRoute() since the
// dormant directus adapter was removed at slice-26 close — supplies both site
// shapes and threads them through here; factories never re-fetch, never
// import the adapter directly.
//
// `errorSeoFallback` is synchronous and serves as the last-resort SEO when
// any other route's resolution throws (per +layout.ts try/catch chain).

import type {
	Locale,
	PageSeo,
	PreviewContext,
	SiteMeta,
	SiteSeoDefaults,
} from '$lib/types';
import type { ContentAdapter } from '$lib/adapters/types';
import { extractText } from '@repo/shared';
import { SITE_HOST, canonicalFor, DEFAULT_LOCALE } from '$lib/utils/seo-defaults';
import { resolveLocale } from '$lib/utils/locale';
import { resolveSitePage } from '$lib/utils/page-registry';
import { appendBrandPerLocale } from '$lib/adapters/compose-page-seo';
import { asset } from '$lib/directus/assets';
import {
	buildBlogPostingNode,
	buildBreadcrumbListNode,
	buildCreativeWorkNode,
	buildServiceNode,
} from '$lib/adapters/jsonld';

/** Breadcrumb display name from the trilingual site_pages registry; code fallback otherwise. */
export function crumbName(path: string, locale: Locale, fallback: string): string {
	const page = resolveSitePage(path);
	return page ? resolveLocale(page.title, locale) : fallback;
}

export interface FactoryArgs {
	params: Record<string, string>;
	locale: Locale;
	ctx?: PreviewContext;
	adapter: ContentAdapter;
	siteMeta: SiteMeta;
	siteSeoDefaults: SiteSeoDefaults;
}

/**
 * If a LocalizedString description falls outside the SEO band (50–200), return
 * `siteSeoDefaults.defaultDescription` instead. Keeps the Zod contract honest
 * without forcing copy rewrites at the data-layer.
 */
function fitDescriptionForSeo(
	desc: { en: string; fr?: string; es?: string } | undefined,
	fallback: { en: string; fr?: string; es?: string },
): { en: string; fr?: string; es?: string } {
	if (!desc) return fallback;
	const len = desc.en.length;
	if (len < 50 || len > 200) return fallback;
	return desc;
}

function cleanText(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

function titleBodyForSeo(primary: string | undefined, fallback: string, brand: string): string {
	const suffix = ` | ${brand}`;
	const candidates = [cleanText(primary), cleanText(fallback)].filter(Boolean) as string[];
	for (const candidate of candidates) {
		if (`${candidate}${suffix}`.length <= 70) return candidate;
	}
	const maxBodyLength = Math.max(1, 70 - suffix.length);
	return (candidates[0] ?? fallback).slice(0, maxBodyLength).trimEnd();
}

/**
 * Services with a committed share card at static/og/services/<id>.png (minted
 * by scripts/generate-og-cards.ts). Both locales share one card per service;
 * ids outside this set (archived services) fall through to the default card.
 */
const SERVICE_OG_CARD_IDS: ReadonlySet<string> = new Set([
	'database-engineering',
	'data-pipeline',
	'analytics-reporting',
	'web-development',
]);

/** /services/[id] — pulls service from collection adapter; brand suffix from siteMeta. */
export async function servicesIdSeoFactory(args: FactoryArgs): Promise<PageSeo> {
	const { params, locale, ctx, adapter, siteMeta, siteSeoDefaults } = args;
	const service = await adapter.services.byId(params.id, ctx);
	if (!service) throw new Error(`Unknown service id: ${params.id}`);
	const canonicalUrl = canonicalFor(`/services/${service.id}`, locale);
	const seo: PageSeo = {
		title: appendBrandPerLocale(service.title, siteMeta.name),
		description: fitDescriptionForSeo(service.description, siteSeoDefaults.defaultDescription),
		canonical: canonicalUrl,
		ogType: 'article',
		noIndex: false,
		jsonLd: [
			buildServiceNode(service, locale),
			buildBreadcrumbListNode(
				[
					{ name: crumbName('/', locale, 'Home'), url: canonicalFor('/', locale) },
					{ name: crumbName('/services', locale, 'Services'), url: canonicalFor('/services', locale) },
					{ name: resolveLocale(service.title, locale), url: canonicalUrl },
				],
				canonicalUrl,
			),
		],
	};

	if (SERVICE_OG_CARD_IDS.has(service.id)) {
		seo.ogImage = {
			url: `/og/services/${service.id}.png`,
			alt: {
				en: `${service.title.en} | yesid.dev`,
				...(service.title.fr && { fr: `${service.title.fr} | yesid.dev` }),
				...(service.title.es && { es: `${service.title.es} | yesid.dev` }),
			},
			width: 1200,
			height: 630,
		};
	}

	return seo;
}

/** /projects/[slug] — pulls project from collection adapter; brand suffix from siteMeta. */
export async function projectsSlugSeoFactory(args: FactoryArgs): Promise<PageSeo> {
	const { params, locale, ctx, adapter, siteMeta, siteSeoDefaults } = args;
	const project = await adapter.projects.bySlug(params.slug, ctx);
	if (!project) throw new Error(`Unknown project slug: ${params.slug}`);
	// Extract plain text from LocalizedBlockEditorDoc before passing to fitDescriptionForSeo.
	const descriptionText: { en: string; fr?: string; es?: string } = {
		en: extractText(project.description.en),
		...(project.description.fr !== undefined && { fr: extractText(project.description.fr) }),
		...(project.description.es !== undefined && { es: extractText(project.description.es) }),
	};
	// Prefer description (fuller); fall back to oneLiner, then site fallback.
	const fallback = siteSeoDefaults.defaultDescription;
	const desc =
		fitDescriptionForSeo(descriptionText, fallback) !== fallback
			? descriptionText
			: fitDescriptionForSeo(project.oneLiner, fallback);
	const canonicalUrl = canonicalFor(`/projects/${project.slug}`, locale);
	const seo: PageSeo = {
		title: appendBrandPerLocale(project.title, siteMeta.name),
		description: desc,
		canonical: canonicalUrl,
		ogType: 'article',
		noIndex: false,
		jsonLd: [
			buildCreativeWorkNode(project, locale),
			buildBreadcrumbListNode(
				[
					{ name: crumbName('/', locale, 'Home'), url: canonicalFor('/', locale) },
					{ name: crumbName('/projects', locale, 'Projects'), url: canonicalFor('/projects', locale) },
					{ name: resolveLocale(project.title, locale), url: canonicalUrl },
				],
				canonicalUrl,
			),
		],
	};

	// OG image wiring (slice-15c). Only set when title.en is non-empty so
	// SeoHead falls through to defaultOgImageFor(locale) on empty title.
	// Non-default locales request the per-locale render via ?locale= (the og
	// endpoint resolves per-locale title with EN fallback).
	if (project.title?.en && project.title.en.length > 0) {
		seo.ogImage = {
			url: `/og/project/${project.slug}.png${locale !== DEFAULT_LOCALE ? `?locale=${locale}` : ''}`,
			alt: {
				en: `${project.title.en} — yesid.`,
				...(project.title.fr && { fr: `${project.title.fr} — yesid.` }),
				...(project.title.es && { es: `${project.title.es} — yesid.` }),
			},
			width: 1200,
			height: 630,
		};
	}

	return seo;
}

/** /blog/[slug] — pulls post from collection adapter; brand suffix from siteMeta. */
export async function blogSlugSeoFactory(args: FactoryArgs): Promise<PageSeo> {
	const { params, locale, ctx, adapter, siteMeta, siteSeoDefaults } = args;
	const post = await adapter.blog.bySlug(params.slug, ctx);
	if (!post) throw new Error(`Unknown blog slug: ${params.slug}`);
	// AM2.5 (slice-28.6): blog posts are mono-language — the canonical points
	// at the BODY-language URL (an EN post under /fr/blog/x canonicals to
	// /blog/x), and singleLocale suppresses the cross-locale hreflang cluster.
	const canonicalUrl = canonicalFor(`/blog/${post.slug}`, post.lang);
	const titleBody = titleBodyForSeo(post.seoTitle, post.title, siteMeta.name);
	const description = fitDescriptionForSeo(
		{ en: post.seoDescription ?? post.excerpt },
		siteSeoDefaults.defaultDescription,
	);
	// asset() resolves to a RELATIVE mirrored path (e.g. /images/work/x.png) in
	// production. JSON-LD `image` is validated as z.string().url() (absolute),
	// so a relative path makes SchemaOrgNodeSchema.parse throw and the post
	// silently falls back to error SEO, dropping all structured data. Absolutize
	// against SITE_HOST; new URL(abs, SITE_HOST) is idempotent when asset()
	// already returned an absolute URL.
	const rawImageUrl = post.coverImage ? asset(post.coverImage, 'og-1200') : undefined;
	const imageUrl = rawImageUrl ? new URL(rawImageUrl, SITE_HOST).href : undefined;
	const seo: PageSeo = {
		title: { en: `${titleBody} | ${siteMeta.name}` },
		description,
		canonical: canonicalUrl,
		ogType: 'article',
		noIndex: false,
		singleLocale: true,
		jsonLd: [
			buildBlogPostingNode(post, locale, { imageUrl }),
			buildBreadcrumbListNode(
				[
					{ name: crumbName('/', locale, 'Home'), url: canonicalFor('/', locale) },
					{ name: crumbName('/blog', locale, 'Blog'), url: canonicalFor('/blog', locale) },
					{ name: post.title, url: canonicalUrl },
				],
				canonicalUrl,
			),
		],
	};

	// New OG image wiring — slice-15c. Only set when title is non-empty so
	// SeoHead falls through to defaultOgImageFor(locale) on empty title.
	if (post.title && post.title.length > 0) {
		seo.ogImage = {
			url: imageUrl ?? `/og/blog/${post.slug}.png`,
			alt: { en: post.coverImageAlt ?? `${post.title} | ${siteMeta.name}` },
			width: 1200,
			height: 630,
		};
	}

	return seo;
}

/**
 * /__error — last-resort SEO. noIndex: true (nothing to crawl). Pulls brand
 * suffix from siteMeta and fallback description from siteSeoDefaults.
 */
export function errorSeoFallback(args: {
	locale: Locale;
	siteMeta: SiteMeta;
	siteSeoDefaults: SiteSeoDefaults;
}): PageSeo {
	const { siteMeta, siteSeoDefaults } = args;
	return {
		title: { en: `Not Found | ${siteMeta.name}` },
		description: siteSeoDefaults.defaultDescription,
		canonical: SITE_HOST,
		ogType: 'website',
		noIndex: true,
		// No jsonLd — route is noIndex, no point in structured data.
	};
}

// Registry for composer dispatch. Maps a SvelteKit route id to its factory.
// '/__error' is handled separately (synchronous, no params/adapter dep).
export const routeSeoFactories: Record<
	string,
	(args: FactoryArgs) => Promise<PageSeo>
> = {
	'/services/[id]': servicesIdSeoFactory,
	'/projects/[slug]': projectsSlugSeoFactory,
	'/blog/[slug]': blogSlugSeoFactory,
};
