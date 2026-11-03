// SvelteKit expands '*' only to unprefixed routes; enumerate every available locale and slug.
import { blogPosts } from '#lib/content/blog.ts';
import { projects } from '#lib/content/projects.ts';
import { services } from '#lib/content/services.ts';
import { legalPages } from '#lib/content/legal-pages.ts';
import { isEntityAvailable, isPathPublished, type AvailabilityContext } from '#lib/utils/content-availability.ts';
import { PUBLISHED_LOCALES } from '#lib/utils/published-locales.ts';
import { availableLocales, groupBlogTranslations } from '#lib/blog/translations.ts';
import type { BlogPost, Locale } from '#lib/types.ts';

const langParamFor = (locale: Locale): string => locale === 'en' ? '' : locale;

function groupedBlogRows(posts: readonly BlogPost[], context: AvailabilityContext) {
	return groupBlogTranslations(posts.filter((post) => isEntityAvailable({ kind: 'post', entity: post }, post.lang, context))).flatMap((group) =>
		availableLocales(group).map(({ locale, post }) => ({ locale, slug: post.slug })),
	);
}

export function localeEntries(path = '/', context: AvailabilityContext = {}): Array<{ lang: string }> {
	return isPathPublished(path, context.pages) ? (context.locales ?? PUBLISHED_LOCALES).map((locale) => ({ lang: langParamFor(locale) })) : [];
}

export function blogEntriesFor(posts: readonly BlogPost[], context: AvailabilityContext = {}): Array<{ lang: string; slug: string }> {
	return groupedBlogRows(posts, context).map(({ locale, slug }) => ({ lang: langParamFor(locale), slug }));
}

export function blogEntries(context: AvailabilityContext = {}): Array<{ lang: string; slug: string }> {
	return blogEntriesFor(context.posts ?? blogPosts, context);
}

export function ogBlogRows(context: AvailabilityContext = {}) {
	return groupedBlogRows(context.posts ?? blogPosts, context);
}

export function ogProjectSlugs(context: AvailabilityContext = {}): string[] {
	return (context.projects ?? projects).filter((project) =>
		(context.locales ?? PUBLISHED_LOCALES).some((locale) => isEntityAvailable({ kind: 'project', entity: project }, locale, context)),
	).map((project) => project.slug);
}

export function projectEntries(context: AvailabilityContext = {}): Array<{ lang: string; slug: string }> {
	return (context.projects ?? projects).flatMap((project) => (context.locales ?? PUBLISHED_LOCALES)
		.filter((locale) => isEntityAvailable({ kind: 'project', entity: project }, locale, context))
		.map((locale) => ({ lang: langParamFor(locale), slug: project.slug })));
}

export function serviceEntries(context: AvailabilityContext = {}): Array<{ lang: string; id: string }> {
	return (context.services ?? services).flatMap((service) => (context.locales ?? PUBLISHED_LOCALES)
		.filter((locale) => isEntityAvailable({ kind: 'service', entity: service }, locale, context))
		.map((locale) => ({ lang: langParamFor(locale), id: service.id })));
}

export function legalEntries(context: AvailabilityContext = {}): Array<{ lang: string; slug: string }> {
	return legalPages.filter((page) => isPathPublished(`/legal/${page.slug}`, context.pages)).flatMap((page) =>
		(context.locales ?? PUBLISHED_LOCALES).map((locale) => ({ lang: langParamFor(locale), slug: page.slug })),
	);
}
