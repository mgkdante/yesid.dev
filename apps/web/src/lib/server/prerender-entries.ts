// Prerender entry builders — consolidation-deploy-honesty slice.
//
// The site is 100% build-time content, so every page route prerenders
// (prerender = true at the root layout). SvelteKit only auto-expands routes
// whose params are all optional to their UNPREFIXED form ('*' entries strip
// `[[lang=locale]]`), so each route exports explicit entries for every locale
// and each content slug. Explicit > crawl-discovered: an orphan page (not
// linked from nav/listings) would otherwise silently fall back to the lambda.
//
// Locale model (slice-28.6): EN is never prefixed (lang: ''), while FR and ES
// resolve as path prefixes. `resolve_route` drops an optional param whose value
// is '' — `{ lang: '' }` yields '/about', `{ lang: 'fr' }` '/fr/about'.
// PREFIX_LOCALES is the routing lever for every entry list here.
//
// Slug sources are the GENERATED content modules (CMS is truth, .ts is the
// build-time cache) — the same arrays the sitemap builder enumerates, so
// prerender coverage and sitemap coverage stay in lockstep.

import { blogPosts } from '#lib/content/blog';
import { projects } from '#lib/content/projects';
import { services } from '#lib/content/services';
import { legalPages } from '#lib/content/legal-pages';
import { sitePages } from '#lib/content/site-pages';
import { isPathPublished } from '#lib/utils/page-registry.js';
import { PREFIX_LOCALES } from '#lib/utils/locale-routing.js';
import { BLOG_TRANSLATION_LOCALES, groupBlogTranslations } from '#lib/blog/translations.js';
import type { BlogPost, Project, Service, SitePage } from '#lib/types.js';

/** `lang` param values: '' (EN, unprefixed) plus each prefix locale. */
const LANG_PARAM_VALUES: readonly string[] = ['', ...PREFIX_LOCALES];

/** Map a content locale to its `lang` route param ('en' → '', 'fr' → 'fr'). */
function langParamFor(locale: string): string {
	return (PREFIX_LOCALES as readonly string[]).includes(locale) ? locale : '';
}

function isAvailableProject(project: Project): boolean {
	return project.status !== 'private';
}

function groupedBlogRows(posts: readonly BlogPost[], pages: readonly SitePage[]) {
	return groupBlogTranslations(posts.filter((post) => isPathPublished(`/blog/${post.slug}`, pages))).flatMap((group) =>
		BLOG_TRANSLATION_LOCALES.map((locale) => ({
			locale,
			slug: group.posts[locale].slug,
		})),
	);
}

/** Entries for a static page: one unprefixed EN plus every prefix locale. */
export function localeEntries(path = '/', pages: readonly SitePage[] = sitePages): Array<{ lang: string }> {
	return isPathPublished(path, pages) ? LANG_PARAM_VALUES.map((lang) => ({ lang })) : [];
}

/** Blog detail entries for complete EN/FR/ES translation groups. Each row
 * prerenders at its own locale-specific slug; grouping makes an incomplete
 * publication fail the build instead of silently omitting a counterpart. */
export function blogEntriesFor(posts: readonly BlogPost[], pages: readonly SitePage[] = sitePages): Array<{ lang: string; slug: string }> {
	return groupedBlogRows(posts, pages).map(({ locale, slug }) => ({
		lang: langParamFor(locale),
		slug,
	}));
}

export function blogEntries(): Array<{ lang: string; slug: string }> {
	return blogEntriesFor(blogPosts);
}

export function ogBlogRows(pages: readonly SitePage[] = sitePages) {
	return groupedBlogRows(blogPosts, pages);
}

export function ogProjectSlugs(rows: readonly Project[] = projects, pages: readonly SitePage[] = sitePages): string[] {
	return rows.filter((project) => isAvailableProject(project) && isPathPublished(`/projects/${project.slug}`, pages)).map((project) => project.slug);
}

/** Project detail entries: every public project × every published locale. */
export function projectEntries(pages: readonly SitePage[] = sitePages): Array<{ lang: string; slug: string }> {
	return projects
		.filter((project) => isAvailableProject(project) && isPathPublished(`/projects/${project.slug}`, pages))
		.flatMap((project) => LANG_PARAM_VALUES.map((lang) => ({ lang, slug: project.slug })));
}

/** Service detail entries: every visible service × every published locale. */
export function serviceEntries(pages: readonly SitePage[] = sitePages, rows: readonly Service[] = services): Array<{ lang: string; id: string }> {
	return rows
		.filter((service) => service.visible !== false && isPathPublished(`/services/${service.id}`, pages))
		.flatMap((service) => LANG_PARAM_VALUES.map((lang) => ({ lang, id: service.id })));
}

/** Legal page entries (OPS1): every legal page × every published locale. */
export function legalEntries(pages: readonly SitePage[] = sitePages): Array<{ lang: string; slug: string }> {
	return legalPages.filter((page) => isPathPublished(`/legal/${page.slug}`, pages)).flatMap((page) => LANG_PARAM_VALUES.map((lang) => ({ lang, slug: page.slug })));
}
