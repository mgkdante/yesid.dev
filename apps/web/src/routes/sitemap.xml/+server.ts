import type { RequestHandler } from './$types';

// Stays on the lambda (edge-cached via s-maxage): explicit even though
// endpoints default to prerender=false — a silently-static sitemap after a
// kit-default change would be a stale-SEO footgun.
export const prerender = false;

import { adapter } from '#lib/adapters/index.ts';
import { PUBLISHED_LOCALES, canonicalFor, DEFAULT_LOCALE } from '#lib/utils/seo-defaults.ts';
import { isPathPublished, STATIC_PAGE_PATHS } from '#lib/utils/page-registry.ts';
import { sitePages } from '#lib/content/site-pages.ts';
import { groupBlogTranslations } from '#lib/blog/translations.ts';
import type { BlogPost, Locale, SitePage } from '#lib/types.ts';
import {
	emitAlternateSitemapEntries,
	emitSitemapDocument,
} from '@yesid/seo-kit/sitemap';

// Route ids that are always present in the router. Keep this list in sync
// with the static-route set in $lib/adapters/route-seo-defaults.ts when
// adding a new static route. The build-time coverage script (Task 11)
// asserts parity.
// `_` prefix required — SvelteKit rejects any non-reserved named exports from
// +server routes. Underscore-prefixed names are allowed. Imported by the build-
// time coverage script (Task 11) so expected routes stay in one place.
export const _STATIC_ROUTES = STATIC_PAGE_PATHS;

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

/** Exact translated blog clusters. Different slugs still emit reciprocal alternates. */
export function _blogUrlEntries(posts: readonly BlogPost[]): string[] {
	return groupBlogTranslations(posts).flatMap((group) => {
		const alternates = Object.fromEntries(
			PUBLISHED_LOCALES.map((locale) => {
				const variant = group.posts[locale];
				return [locale, canonicalFor(`/blog/${variant.slug}`, locale)];
			}),
		) as Partial<Record<Locale, string>>;
		return _exactUrlEntries(alternates, PUBLISHED_LOCALES);
	});
}

export function _emitSitemapDocument(entries: readonly string[]): string {
	return emitSitemapDocument(entries);
}

// Filter every candidate through the route registry so archived pages leave the sitemap on the same rebuild.
export async function _buildSitemapEntries(
	pages: readonly SitePage[] = sitePages,
): Promise<string[]> {
	const entries: string[] = [];
	const pushIfPublished = (path: string, variants: readonly Locale[] = PUBLISHED_LOCALES) => {
		if (isPathPublished(path, pages)) entries.push(...urlEntries(path, variants));
	};

	for (const path of _STATIC_ROUTES) {
		pushIfPublished(path);
	}

	const projects = await adapter.projects.public();
	for (const project of projects) {
		pushIfPublished(`/projects/${project.slug}`);
	}

	const services = await adapter.services.visible();
	for (const service of services) {
		pushIfPublished(`/services/${service.id}`);
	}

	// Legal pages (OPS1) — localized like the chrome routes, full alternate
	// cluster per published locale.
	const legal = await adapter.legal.all();
	for (const page of legal) {
		pushIfPublished(`/legal/${page.slug}`);
	}

	// Each translated blog row owns its locale-specific slug. Group by the
	// required translation key so every variant carries one reciprocal cluster.
	const posts = (await adapter.blog.all()).filter((post) =>
		isPathPublished(`/blog/${post.slug}`, pages),
	);
	entries.push(..._blogUrlEntries(posts));

	return entries;
}

export const GET: RequestHandler = async () => {
	const entries = await _buildSitemapEntries();
	const xml = _emitSitemapDocument(entries);

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',

			'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
		},
	});
};
