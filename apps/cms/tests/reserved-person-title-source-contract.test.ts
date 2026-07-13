import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';

const REPO_ROOT = join(import.meta.dir, '..', '..', '..');
const RECONCILER = join(import.meta.dir, '..', 'scripts', 'reconcile-reserved-person-titles.ts');

const ACTIVE_TITLE_SOURCES = [
	'apps/cms/scripts/go2-message-pass.ts',
	'apps/cms/fixtures/singletons/site-meta.json',
	'apps/cms/fixtures/collections/route-seo.json',
	'apps/cms/fixtures/content/about-page.json',
	'apps/cms/fixtures/content/site-content.json',
	'apps/cms/fixtures/assets-manifest.json',
	'apps/cms/directus/collections/settings.json',
	'apps/web/src/lib/server/llms.ts',
	'apps/web/scripts/generate-og-cards.ts',
] as const;

const APPROVED_TITLES = {
	en: 'Freelance SQL and Digital Infrastructure Developer',
	fr: 'Développeur SQL et en infrastructure numérique, à la pige',
	es: 'Desarrollador freelance SQL y de infraestructura digital',
} as const;

const RESERVED_PERSON_TITLE_PATTERNS = [
	/Digital Infrastructure Engineer/i,
	/ingénieur(?: pigiste)?(?: d'| en )infrastructure numérique/i,
	/ingeniero(?: freelance| independiente)? de infraestructura digital/i,
	/data \+ web engineer/i,
] as const;

function source(path: string): string {
	return readFileSync(join(REPO_ROOT, path), 'utf8');
}

describe('reserved person-title source contract', () => {
	test('guarded CMS reconciler exists', () => {
		expect(existsSync(RECONCILER)).toBe(true);
	});

	test('active title sources contain no reserved person-title wording', () => {
		const violations = ACTIVE_TITLE_SOURCES.flatMap((path) =>
			RESERVED_PERSON_TITLE_PATTERNS.flatMap((pattern) =>
				pattern.test(source(path)) ? [`${path}: ${pattern.source}`] : [],
			),
		);
		expect(violations).toEqual([]);
	});

	test('approved title trio is anchored in active source truth', () => {
		const activeSource = ACTIVE_TITLE_SOURCES.map(source).join('\n');
		for (const title of Object.values(APPROVED_TITLES)) {
			expect(activeSource).toContain(title);
		}
	});
});
