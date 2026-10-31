// SvelteKit expands '*' only to unprefixed routes, so explicit entries cover every locale and orphan slug.

import { blogPosts } from '#lib/content/blog.ts';
import { projects } from '#lib/content/projects.ts';
import { services } from '#lib/content/services.ts';
import { legalPages } from '#lib/content/legal-pages.ts';
import { sitePages } from '#lib/content/site-pages.ts';
import { isPathPublished } from '#lib/utils/page-registry.ts';
import { PREFIX_LOCALES } from '#lib/utils/locale-routing.ts';
import { availableLocales, groupBlogTranslations } from '#lib/blog/translations.ts';
import type { BlogPost, Project, Service, SitePage } from '#lib/types.ts';

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
		availableLocales(group).map(({ locale, post }) => ({ locale, slug: post.slug })),
	);
}

/** Entries for a static page: one unprefixed EN plus every prefix locale. */
export function localeEntries(path = '/', pages: readonly SitePage[] = sitePages): Array<{ lang: string }> {
	return isPathPublished(path, pages) ? LANG_PARAM_VALUES.map((lang) => ({ lang })) : [];
}

/** Blog detail entries: every language a post is available in prerenders at
 * its own locale-specific slug. Languages that are not on the site are skipped. */
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
