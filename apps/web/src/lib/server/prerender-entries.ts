// Enumerate available catalog rows for SvelteKit and generated OG paths.
import { createContentCatalog } from '#lib/catalog/index.ts';
import type { AvailabilityContext } from '#lib/catalog/availability.ts';
import { availableLocales, groupBlogTranslations } from '#lib/blog/translations.ts';
import type { BlogPost, Locale } from '#lib/types.ts';
const langParamFor = (locale: Locale): string => locale === 'en' ? '' : locale;

export function localeEntries(path = '/', context: AvailabilityContext = {}): Array<{ lang: string }> {
	const content = createContentCatalog(context);
	return content.isPathPublished(path) ? content.locales.map((locale) => ({ lang: langParamFor(locale) })) : [];
}
export function ogBlogRows(context: AvailabilityContext = {}) {
	const content = createContentCatalog(context);
	return groupBlogTranslations(content.blog.all()).flatMap((group) => availableLocales(group).map(({ locale, post }) => ({ locale, slug: post.slug })));
}
export function blogEntriesFor(posts: readonly BlogPost[], context: AvailabilityContext = {}): Array<{ lang: string; slug: string }> {
	return blogEntries({ ...context, posts });
}
export function blogEntries(context: AvailabilityContext = {}): Array<{ lang: string; slug: string }> {
	return ogBlogRows(context).map(({ locale, slug }) => ({ lang: langParamFor(locale), slug }));
}
export function projectEntries(context: AvailabilityContext = {}): Array<{ lang: string; slug: string }> {
	const content = createContentCatalog(context);
	return content.locales.flatMap((locale) => content.projects.available(locale).map((project) => ({ lang: langParamFor(locale), slug: project.slug })));
}
export function ogProjectSlugs(context: AvailabilityContext = {}): string[] {
	return [...new Set(projectEntries(context).map((entry) => entry.slug))];
}
export function serviceEntries(context: AvailabilityContext = {}): Array<{ lang: string; id: string }> {
	const content = createContentCatalog(context);
	return content.locales.flatMap((locale) => content.services.available(locale).map((service) => ({ lang: langParamFor(locale), id: service.id })));
}
export function legalEntries(context: AvailabilityContext = {}): Array<{ lang: string; slug: string }> {
	const content = createContentCatalog(context);
	return content.legal.all().filter((page) => content.isPathPublished(`/legal/${page.slug}`)).flatMap((page) =>
		content.locales.map((locale) => ({ lang: langParamFor(locale), slug: page.slug })),
	);
}
