import type { RequestHandler } from './$types';

// Stays on the lambda (edge-cached via s-maxage): explicit even though
// endpoints default to prerender=false — a silently-static sitemap after a
// kit-default change would be a stale-SEO footgun.
export const prerender = false;

import { createContentCatalog } from '#lib/catalog/index.ts';
import { PUBLISHED_LOCALES, canonicalFor, DEFAULT_LOCALE } from '#lib/utils/seo-defaults.ts';
import { STATIC_PAGE_PATHS, type AvailabilityContext } from '#lib/catalog/availability.ts';
import { groupBlogTranslations } from '#lib/blog/translations.ts';
import type { BlogPost, Locale } from '#lib/types.ts';
import {
	emitAlternateSitemapEntries,
	emitSitemapDocument,
} from '@yesid/seo-kit/sitemap';

// No <lastmod>: request-time timestamps would defeat crawler change detection.
// Each locale variant carries the full published alternate cluster.
function urlEntries(path: string, variants: readonly Locale[]): string[] {
	const alternates = Object.fromEntries(
		variants.map((locale) => [locale, canonicalFor(path, locale)]),
	) as Partial<Record<Locale, string>>;
	return _exactUrlEntries(alternates, variants);
}

export function _exactUrlEntries(
	alternates: Partial<Record<Locale, string>>,
	variants: readonly Locale[],
): string[] {
	const sitemapVariants = variants.map((hreflang) => {
		const href = alternates[hreflang];
		if (!href) throw new Error(`Missing sitemap alternate for ${hreflang}`);
		return { hreflang, href };
	});

	return emitAlternateSitemapEntries({
		variants: sitemapVariants,
		...(variants.length > 1
			? { xDefaultHref: alternates[DEFAULT_LOCALE] ?? sitemapVariants[0]!.href }
			: {}),
		emptyElementStyle: 'spaced',
	});
}

/** Exact translated blog clusters over each post's available languages.
 * Different slugs still emit reciprocal alternates. */
export function _blogUrlEntries(posts: readonly BlogPost[], locales: readonly Locale[] = PUBLISHED_LOCALES): string[] {
	return groupBlogTranslations(posts).flatMap((group) => {
		const variants = locales.filter((locale) => group.posts[locale]);
		if (!variants.length) return [];
		const alternates = Object.fromEntries(
			variants.map((locale) => [locale, canonicalFor(`/blog/${group.posts[locale]!.slug}`, locale)]),
		) as Partial<Record<Locale, string>>;
		return _exactUrlEntries(alternates, variants);
	});
}

export { emitSitemapDocument as _emitSitemapDocument };

// Filter every candidate through the route registry so archived pages leave the sitemap on the same rebuild.
export async function _buildSitemapEntries(
	context: AvailabilityContext = {},
): Promise<string[]> {
	const entries: string[] = [];
	const content = createContentCatalog(context);
	const locales = content.locales;
	const pushIfPublished = (path: string, variants: readonly Locale[] = locales) => {
		if (content.isPathPublished(path) && variants.length) entries.push(...urlEntries(path, variants));
	};

	for (const path of STATIC_PAGE_PATHS) {
		pushIfPublished(path);
	}

	for (const project of new Map(locales.flatMap((locale) => content.projects.available(locale).map((project) => [project.slug, project] as const))).values()) {
		pushIfPublished(`/projects/${project.slug}`, locales.filter((locale) => content.isAvailable({ kind: 'project', entity: project }, locale)));
	}

	const services = [...new Map(locales.flatMap((locale) => content.services.available(locale).map((service) => [service.id, service] as const))).values()];
	for (const service of services) {
		pushIfPublished(`/services/${service.id}`, locales.filter((locale) => content.isAvailable({ kind: 'service', entity: service }, locale)));
	}

	// Legal pages (OPS1) — localized like the chrome routes, full alternate
	// cluster per published locale.
	for (const page of content.legal.all()) {
		pushIfPublished(`/legal/${page.slug}`);
	}

	// Each available blog language owns its locale-specific slug. Group by the
	// post key so every variant carries one reciprocal cluster.
	const posts = content.blog.all();
	entries.push(..._blogUrlEntries(posts, locales));

	return entries;
}

export const GET: RequestHandler = async () => {
	const entries = await _buildSitemapEntries();
	const xml = emitSitemapDocument(entries);

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',

			'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
		},
	});
};
