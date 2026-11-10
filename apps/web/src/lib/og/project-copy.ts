import { extractText } from '@repo/shared';
import type { Locale, Project, LocalizedString } from '#lib/types.ts';
import { resolveLocale } from '#lib/utils/locale.ts';
import { SHARE_CTA, withShareCta } from './share-copy';

/** Select whole CMS copy once for search descriptions and generated card text. */
export function projectCopy(project: Project, locale: Locale, fallback: LocalizedString): { line: string; description: string } {
	const candidates = [
		resolveLocale(project.oneLiner, locale),
		extractText(resolveLocale(project.description, locale)),
	];
	for (const text of candidates) {
		if (!text.trim()) continue;
		const description = withShareCta(text, SHARE_CTA.project.label[locale]);
		if (description.length >= 50 && description.length <= 200) return { line: text.trim(), description };
	}
	const description = resolveLocale(fallback, locale);
	return { line: description, description };
}
