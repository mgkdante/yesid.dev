import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { TITLE_BY_LOCALE } from '../fixtures/content/outcome-first-positioning';

const REPO_ROOT = join(import.meta.dir, '..', '..', '..');
const TITLES = TITLE_BY_LOCALE;

type Locale = keyof typeof TITLES;

const SQL_FIRST_PATTERNS = [
	/Freelance SQL(?: developer| and)/i,
	/Développeur SQL/i,
	/Desarrollador(?: freelance )?SQL/i,
	/Desarrollador SQL freelance/i,
	/SQL \+ digital infrastructure developer/i,
] as const;

const RESERVED_PERSON_TITLE_PATTERN = /\b(?:engineer|ingénieur|ingeniero)\b/i;

function source(path: string): string {
	return readFileSync(join(REPO_ROOT, path), 'utf8');
}

function json(path: string): any {
	return JSON.parse(source(path));
}

function expectNotSqlFirst(label: string, values: readonly string[]): void {
	const violations = values.flatMap((value) =>
		SQL_FIRST_PATTERNS.flatMap((pattern) =>
			pattern.test(value) ? [`${label}: ${pattern.source} in ${JSON.stringify(value)}`] : [],
		),
	);
	expect(violations).toEqual([]);
}

function arrayCopy(block: string, locale: Locale): string {
	const match = block.match(new RegExp(`${locale}:\\s*\\[([\\s\\S]*?)\\]`));
	expect(match, `missing ${locale} array`).not.toBeNull();
	return [...match![1].matchAll(/["']([^"']*)["']/g)].map((part) => part[1]).join(' ');
}

describe('outcome-first positioning source contract', () => {

	test('current fetcher fixtures cannot restore reserved titles', () => {
		const fetcherTest = source('apps/cms/scripts/lib/fetchers/site-meta.test.ts');
		for (const title of Object.values(TITLES)) expect(fetcherTest).toContain(title);
		expect(fetcherTest).not.toMatch(RESERVED_PERSON_TITLE_PATTERN);
		expectNotSqlFirst('site-meta fetcher fixture', [fetcherTest]);
	});

	test('llms and Directus editorial prompts use the umbrella identity without ranking SQL first', () => {
		const llms = source('apps/web/src/lib/server/llms.ts');
		expect(llms).toContain(TITLES.en);
		expect(llms).toContain(TITLES.es);
		expectNotSqlFirst('llms.ts', [llms]);

		const [settings] = json('apps/cms/directus/collections/settings.json');
		for (const field of ['mcp_system_prompt', 'ai_system_prompt'] as const) {
			expect(settings[field]).toContain(`Yesid Otalora (${TITLES.en})`);
			expectNotSqlFirst(`settings.${field}`, [settings[field]]);
		}
	});

	test('default and route OG generators carry the outcome-first identity in every locale', () => {

		const routeOg = source('apps/web/scripts/generate-og-cards.ts');
		for (const copy of [
			'DIGITAL SOLUTIONS · MONTRÉAL',
			'SOLUTIONS NUMÉRIQUES · MONTRÉAL',
			'SOLUCIONES DIGITALES · MONTRÉAL',
		]) {
			expect(routeOg).toContain(copy);
		}
		const aboutBlock = routeOg.match(
			/about:\s*\{[\s\S]*?subtitle:\s*\{([\s\S]*?)\}\s*satisfies LL/,
		)?.[1];
		expect(aboutBlock).toBeDefined();
		for (const locale of Object.keys(TITLES) as Locale[]) {
			expect(arrayCopy(aboutBlock!, locale)).toBe(TITLES[locale]);
		}
		expect(routeOg).toContain('fitSize([SITE[loc].tagline], WIDTH - 2 * MARGIN');
		expect(routeOg).toContain('font-size="${siteTaglineSize}"');
		expectNotSqlFirst('generate-og-cards.ts', [routeOg]);
	});
});
