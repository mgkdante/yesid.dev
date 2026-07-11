import type { Locale } from '$lib/types';

export const BLOG_TRANSLATION_LOCALES = ['en', 'fr', 'es'] as const satisfies readonly Locale[];

export interface BlogTranslationVariant {
	translationKey: string;
	lang: Locale;
}

export interface BlogTranslationGroup<T extends BlogTranslationVariant> {
	translationKey: string;
	posts: Readonly<Record<Locale, T>>;
}

export function getBlogPostsForLocale<T extends Pick<BlogTranslationVariant, 'lang'>>(
	posts: readonly T[],
	locale: Locale,
): readonly T[] {
	return posts.filter((post) => post.lang === locale);
}

/** Available rows for one translation key. Missing locales stay absent so
 * runtime navigation can fall back safely while build-time grouping remains strict. */
export function findBlogTranslationVariants<T extends BlogTranslationVariant>(
	posts: readonly T[],
	translationKey: string,
): Partial<Record<Locale, T>> {
	const variants: Partial<Record<Locale, T>> = {};
	for (const post of posts) {
		if (post.translationKey !== translationKey) continue;
		if (variants[post.lang]) {
			throw new Error(`Duplicate blog translation for ${translationKey} (${post.lang})`);
		}
		variants[post.lang] = post;
	}
	return variants;
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

	return [...grouped].map(([translationKey, variants]) => {
		for (const locale of BLOG_TRANSLATION_LOCALES) {
			if (!variants[locale]) {
				throw new Error(`Missing blog translation for ${translationKey} (${locale})`);
			}
		}

		return {
			translationKey,
			posts: variants as Record<Locale, T>,
		};
	});
}
