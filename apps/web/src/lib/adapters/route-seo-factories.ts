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
import { SITE_HOST } from '$lib/utils/seo-defaults';
import {
	buildBlogPostingNode,
	buildBreadcrumbListNode,
	buildCreativeWorkNode,
	buildServiceNode,
} from '$lib/adapters/jsonld';

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

/** /services/[id] — pulls service from collection adapter; brand suffix from siteMeta. */
export async function servicesIdSeoFactory(args: FactoryArgs): Promise<PageSeo> {
	const { params, locale, ctx, adapter, siteMeta, siteSeoDefaults } = args;
	const service = await adapter.services.byId(params.id, ctx);
	if (!service) throw new Error(`Unknown service id: ${params.id}`);
	const canonicalUrl = `${SITE_HOST}/services/${service.id}`;
	return {
		title: { en: `${service.title.en} | ${siteMeta.name}` },
		description: fitDescriptionForSeo(service.description, siteSeoDefaults.defaultDescription),
		canonical: canonicalUrl,
		ogType: 'article',
		noIndex: false,
		jsonLd: [
			buildServiceNode(service, locale),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Services', url: `${SITE_HOST}/services` },
					{ name: service.title.en, url: canonicalUrl },
				],
				canonicalUrl,
			),
		],
	};
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
	const canonicalUrl = `${SITE_HOST}/projects/${project.slug}`;
	const seo: PageSeo = {
		title: { en: `${project.title.en} | ${siteMeta.name}` },
		description: desc,
		canonical: canonicalUrl,
		ogType: 'article',
		noIndex: false,
		jsonLd: [
			buildCreativeWorkNode(project, locale),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Projects', url: `${SITE_HOST}/projects` },
					{ name: project.title.en, url: canonicalUrl },
				],
				canonicalUrl,
			),
		],
	};

	// OG image wiring (slice-15c). Only set when title.en is non-empty so
	// SeoHead falls through to defaultOgImageFor(locale) on empty title.
	if (project.title?.en && project.title.en.length > 0) {
		seo.ogImage = {
			url: `/og/project/${project.slug}.png`,
			alt: { en: `${project.title.en} — yesid.` },
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
	const canonicalUrl = `${SITE_HOST}/blog/${post.slug}`;
	const seo: PageSeo = {
		title: { en: `${post.title} | ${siteMeta.name}` },
		description: fitDescriptionForSeo({ en: post.excerpt }, siteSeoDefaults.defaultDescription),
		canonical: canonicalUrl,
		ogType: 'article',
		noIndex: false,
		jsonLd: [
			buildBlogPostingNode(post, locale),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Blog', url: `${SITE_HOST}/blog` },
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
			url: `/og/blog/${post.slug}.png`,
			alt: { en: `${post.title} — yesid.` },
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
