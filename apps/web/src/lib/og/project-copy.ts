import { extractText } from '@repo/shared';
import type { Locale, Project, LocalizedString } from '#lib/types.ts';
import { resolveLocale } from '#lib/utils/locale.ts';
import { SHARE_CTA, withShareCta } from './share-copy';

const normalize = (text: string) => text.normalize('NFC').replace(/\s+/gu, ' ').trim();
const inBounds = (text: string) => text.length >= 50 && text.length <= 200;

// Only name/title/address prefixes, initials and example introducers (e.g., i.e.,
// p. ex., p. ej.) require a following word. Keep U.S. protected too, so
// U.S. Department cannot produce a misleading tail.
const prefix = /(?:^|[^\p{L}\p{M}])(?:Dr|Dre|Dra|Pr|Prof|M|Mme|Mmes|Mlle|Mr|Mrs|Ms|Sr|Sra|Sres|Srta|St|Ste|No|Nº|núm|boul|av|ave|blvd|ch|pág|p|vol|fig|Lic|Ing|U\.S|e\.g|i\.e|p\.\s?ex|p\.\s?ej|\p{Lu}\p{M}*)$/u;

// Curly quotes, guillemets and brackets only: straight quotes and ’ double as
// apostrophes, so they cannot tell an opening from a closing mark.
const spans: [string, string][] = [['“', '”'], ['«', '»'], ['(', ')'], ['[', ']'], ['{', '}']];
const insideOpenSpan = (sentence: string) =>
	spans.some(([open, close]) => sentence.split(open).length > sentence.split(close).length);

/** Leading complete sentences only; unfinished and over-budget tails are ignored. */
function leadingSentences(text: string): string {
	// Punctuation + closers closes only at EOF or before whitespace and an
	// uppercase letter/opening mark. Lowercase words and digits always continue.
	const endings = text.matchAll(/[.!?…]+(?:\s*[»”"’')\]}])*(?=$|\s+[\p{Lu}¿¡«"“‘(\[])/gu);
	let result = '';
	let start = 0;
	for (const ending of endings) {
		const end = ending.index + ending[0].length;
		const sentence = text.slice(start, end).trim();
		if (ending[0].startsWith('.') && end < text.length && prefix.test(text.slice(0, ending.index))) continue;
		// A question or exclamation inside an open quotation or bracket is not a sentence end.
		if (end < text.length && insideOpenSpan(text.slice(start, end))) continue;
		// Other suffixes follow the same rule: "Acme Inc. Montréal office..."
		// may split at Inc.; this accepted ambiguity keeps a complete-looking sentence.
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
