import { extractText } from '@repo/shared';
import type { Locale, Project, LocalizedString } from '#lib/types.ts';
import { resolveLocale } from '#lib/utils/locale.ts';
import { SHARE_CTA, withShareCta } from './share-copy';

const normalize = (text: string) => text.replace(/\s+/gu, ' ').trim();
const inBounds = (text: string) => text.length >= 50 && text.length <= 200;

/**
 * Conservative sentence boundaries for EN/FR/ES, including closing quotes and ¿/¡.
 * Keep common titles, e.g./i.e./p.ex., initials and decimal periods inside sentences.
 * Unknown abbreviations follow normal punctuation rules; unfinished tails are ignored.
 */
function leadingSentences(text: string): string {
	const endings = text.matchAll(/[.!?…]+(?:\s*[»”"’')\]])*(?=\s|$)/gu);
	let result = '';
	let start = 0;
	for (const ending of endings) {
		const end = ending.index + ending[0].length;
		const sentence = text.slice(start, end).trim();
		if (/(?:\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Sra|Srta|Mme|Mlle|M|St|vs|etc)|\b[A-Z]|e\.g|i\.e|p\.ex)\.$/u.test(sentence)) continue;
		const candidate = normalize(`${result} ${sentence}`);
		if (candidate.length > 200) break;
		result = candidate;
		start = end;
	}
	return result;
}

/** Independent card line (A) and whole-sentence metadata (B); CMS remains the source. */
export function projectCopy(project: Project, locale: Locale, fallback: LocalizedString): { line: string; description: string } {
	const oneLiner = normalize(resolveLocale(project.oneLiner, locale));
	const doc = resolveLocale(project.description, locale);
	// Only overview paragraphs feed share copy; headings, lists and code are not prose.
	const overview = extractText({ ...doc, blocks: doc.blocks.filter((block) => block.type === 'paragraph') });
	const leading = leadingSentences(normalize(overview));
	const siteDefault = normalize(resolveLocale(fallback, locale));
	const line = oneLiner || leading || siteDefault;
	const cta = SHARE_CTA.project.label[locale];
	for (const candidate of [oneLiner && withShareCta(oneLiner, cta), oneLiner, leading && withShareCta(leading, cta)]) {
		if (candidate && inBounds(candidate)) return { line, description: candidate };
	}
	return { line, description: siteDefault };
}
