import type { Locale } from '#lib/types.ts';

export const BLOG_TRANSLATION_LOCALES = ['en', 'fr', 'es'] as const satisfies readonly Locale[];

export interface BlogTranslationVariant {
	translationKey: string;
	lang: Locale;
}

/** One post and the languages it is available in. Unavailable languages stay absent. */
export interface BlogTranslationGroup<T extends BlogTranslationVariant> {
	translationKey: string;
	posts: Readonly<Partial<Record<Locale, T>>>;
}

export function getBlogPostsForLocale<T extends Pick<BlogTranslationVariant, 'lang'>>(
	posts: readonly T[],
	locale: Locale,
): readonly T[] {
	return posts.filter((post) => post.lang === locale);
}

/** Available rows for one translation key. Missing locales stay absent. */
export function findBlogTranslationVariants<T extends BlogTranslationVariant>(
	posts: readonly T[],
	translationKey: string,
): Partial<Record<Locale, T>> {
	return groupBlogTranslations(posts.filter((post) => post.translationKey === translationKey))[0]?.posts ?? {};
}

export function groupBlogTranslations<T extends BlogTranslationVariant>(
	posts: readonly T[],
): readonly BlogTranslationGroup<T>[] {
	const grouped = new Map<string, Partial<Record<Locale, T>>>();

	for (const post of posts) {
		const variants = grouped.get(post.translationKey) ?? {};
		if (variants[post.lang]) {
			throw new Error(`Duplicate blog translation for ${post.translationKey} (${post.lang})`);
		}
		variants[post.lang] = post;
		grouped.set(post.translationKey, variants);
	}

	return [...grouped].map(([translationKey, posts]) => ({ translationKey, posts }));
}

/** The languages a post is available in, in site language order. */
export function availableLocales<T extends BlogTranslationVariant>(
	group: BlogTranslationGroup<T>,
): Array<{ locale: Locale; post: T }> {
	return BLOG_TRANSLATION_LOCALES.flatMap((locale) => {
		const post = group.posts[locale];
		return post ? [{ locale, post }] : [];
	});
}
