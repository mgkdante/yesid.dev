#!/usr/bin/env bun
/**
 * content-about-pass.ts
 *
 * Applies the current /about content pass to the dev CMS:
 * - shorter Identity value prop
 * - CMS-backed quote carousel entries
 *
 * DEV-ONLY. Dry-run by default; pass --apply to execute.
 */

import { readItems, readSingleton, updateItem } from '@directus/sdk';
import { runMain } from './lib/cli';
import { getAdminToken } from './lib/auth';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';

type Locale = 'en' | 'fr';

interface TranslationRow {
	id: number;
	languages_code: Locale;
}

interface AboutSingleton {
	id: string;
}

interface LocalizedCopy {
	en: string;
	fr: string;
}

interface TestimonialSpec {
	quote: LocalizedCopy;
	author: string;
	role: LocalizedCopy;
	company: string;
}

interface Schema {
	block_about_content: AboutSingleton;
	block_about_content_translations: TranslationRow[];
}

export const IDENTITY_VALUE_PROP: LocalizedCopy = {
	en: "I'm Yesid a Montréal builder who likes clear systems and plain explanations. When clients work with me, I teach them what things mean so they can be behind the wheel making their own decisions.",
	fr: "Je suis un gars de Montréal qui aime les systèmes clairs et les explications simples. Quand je travaille avec des clients, je leur explique ce que les choses veulent dire pour qu'ils gardent le volant et prennent leurs propres décisions.",
};

export const TESTIMONIALS: readonly TestimonialSpec[] = [
	{
		quote: {
			en: "You have the gift of perseverance, and that's what makes you a genius too.",
			fr: "Tu as le don de la persévérance, et c'est ce qui fait de toi un génie.",
		},
		author: 'Guy Sensei',
		role: { en: 'Sensei', fr: 'Gaï Sensei' },
		company: 'Personal lore',
	},
	{
		quote: {
			en: 'What matters in life is not what happens to you but what you remember and how you remember it.',
			fr: "Ce qui compte dans la vie, ce n'est pas ce qui t'arrive, mais ce dont tu te souviens et la façon dont tu t'en souviens.",
		},
		author: 'Gabriel Garcia Marquez',
		role: { en: 'Writer', fr: 'Écrivain' },
		company: 'Literature',
	},
	{
		quote: {
			en: 'Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.',
			fr: 'Tout ce que nous entendons est une opinion, pas un fait. Tout ce que nous voyons est une perspective, pas la vérité.',
		},
		author: 'Marcus Aurelius',
		role: { en: 'Stoic philosopher', fr: 'Philosophe stoïcien' },
		company: 'Meditations',
	},
];

function testimonialsFor(locale: Locale) {
	return TESTIMONIALS.map((item) => ({
		quote: item.quote[locale],
		author: item.author,
		role: item.role[locale],
		company: item.company,
	}));
}

export async function apply(opts: { directusUrl: string; token: string; dryRun?: boolean }): Promise<string[]> {
	const dryRun = opts.dryRun ?? false;
	const client = createClient<Schema>(opts.directusUrl, opts.token);
	const log: string[] = [];

	const singleton = await client.request(readSingleton('block_about_content', { fields: ['id'] }));
	const parentId = (singleton as AboutSingleton).id;
	if (typeof parentId !== 'string' || parentId.length === 0) {
		throw new Error('block_about_content singleton did not return an id');
	}

	const translations = (await client.request(
		readItems('block_about_content_translations', {
			filter: {
				block_about_content_id: { _eq: parentId },
				languages_code: { _in: ['en', 'fr'] },
			},
			fields: ['id', 'languages_code'],
			limit: -1,
		}),
	)) as TranslationRow[];

	for (const locale of ['en', 'fr'] as const) {
		const row = translations.find((item) => item.languages_code === locale);
		if (!row) {
			log.push(`[warn] missing ${locale} block_about_content translation`);
			continue;
		}
		const patch = {
			identity_value_prop: IDENTITY_VALUE_PROP[locale],
			testimonials: testimonialsFor(locale),
		};
		log.push(`[about] translation ${locale} #${row.id}: identity_value_prop + ${TESTIMONIALS.length} testimonials`);
		if (!dryRun) await client.request(updateItem('block_about_content_translations', row.id, patch));
	}

	return log;
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	const token = await getAdminToken(directusUrl);
	const log = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN' : 'APPLIED'}. ${dryRun ? 'Re-run with --apply.' : 'Regenerate fallbacks next.'}`);
}

runMain(main, import.meta);
