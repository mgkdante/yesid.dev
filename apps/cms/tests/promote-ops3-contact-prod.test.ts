import { describe, expect, it } from 'bun:test';
import drafts from '../ops/legal/legal-pages-2026-07-09.json' with { type: 'json' };
import {
	PROD_URL,
	assertProductionTarget,
	isApplyRequested,
	legalPagePlan,
} from '../scripts/promote-ops3-contact-prod';

type DraftBlock = { text?: string; items?: string[] };

function localeText(locale: 'en' | 'fr' | 'es'): string {
	return drafts.pages
		.flatMap((page) => page[locale].blocks as DraftBlock[])
		.flatMap((block) => [block.text ?? '', ...(block.items ?? [])])
		.join('\n');
}

function page(slug: string) {
	const match = drafts.pages.find((candidate) => candidate.slug === slug);
	if (!match) throw new Error(`missing legal page: ${slug}`);
	return match;
}

describe('OPS3 legal draft', () => {
	it.each([
		['en', 'Last updated: 2026-07-11'],
		['fr', 'Dernière mise à jour : 2026-07-11'],
		['es', 'Última actualización: 2026-07-11'],
	] as const)('dates the revised privacy copy in %s', (locale, expected) => {
		expect(localeText(locale)).toContain(expected);
	});

	it.each([
		['cookies', 'en', 'Last updated: 2026-07-11'],
		['cookies', 'fr', 'Dernière mise à jour : 2026-07-11'],
		['cookies', 'es', 'Última actualización: 2026-07-11'],
		['notice', 'en', 'Last updated: 2026-07-11'],
		['notice', 'fr', 'Dernière mise à jour : 2026-07-11'],
		['notice', 'es', 'Última actualización: 2026-07-11'],
	] as const)('dates the revised %s copy in %s', (slug, locale, expected) => {
		const blocks = page(slug)[locale].blocks as DraftBlock[];
		const text = blocks.flatMap((block) => [block.text ?? '', ...(block.items ?? [])]).join('\n');
		expect(text).toContain(expected);
	});

	it.each(['en', 'fr', 'es'] as const)(
		'names the final contact processors and removes Web3Forms in %s',
		(locale) => {
			const text = localeText(locale);
			expect(text).toContain('Vercel');
			expect(text).toContain('Resend');
			expect(text).not.toContain('Web3Forms');
		},
	);

	it.each([
		['en', 'Licensed legal review is still pending', 'Before relying on each provider, I assessed'],
		['fr', "L'examen par un conseiller juridique autorisé reste à faire", "Avant de retenir chaque fournisseur, j'ai évalué"],
		['es', 'La revisión de un profesional jurídico autorizado sigue pendiente', 'Antes de apoyarme en cada proveedor, evalué'],
	] as const)(
		'discloses the unfinished outside-Quebec assessment in %s',
		(locale, required, prohibited) => {
			const text = localeText(locale);
			expect(text).toContain(required);
			expect(text).not.toContain(prohibited);
		},
	);

	it('does not claim that an unsent contact draft is persisted in localStorage', () => {
		const text = localeText('en');
		expect(text).not.toMatch(/draft of your (?:contact )?form message[^.]*localStorage/i);
	});

	it.each(['privacy', 'cookies', 'notice'] as const)(
		'keeps the %s advisor evidence aligned with the planned transport',
		(slug) => {
			const notes = page(slug).advisorNotes;
			expect(notes).toContain('OPS3 CURRENT STATE 2026-07-11');
			expect(notes).not.toContain('Web3Forms');
			expect(notes).not.toMatch(/assessment .* (?:was performed|is done)/i);
			expect(notes).not.toMatch(/unsent (?:form|contact) draft[^.]*localStorage/i);
			expect(notes).not.toMatch(/site is fully prerendered|no runtime endpoint/i);
		},
	);
});

describe('OPS3 production promoter', () => {
	it('is dry-run unless both production confirmation flags are present', () => {
		expect(isApplyRequested([])).toBe(false);
		expect(isApplyRequested(['--apply'])).toBe(false);
		expect(isApplyRequested(['--confirm-ops3'])).toBe(false);
		expect(isApplyRequested(['--apply', '--confirm-ops3'])).toBe(true);
	});

	it('selects exactly the five legal pages and no non-legal content', () => {
		const plan = legalPagePlan();
		expect(plan.map((page) => page.slug)).toEqual([
			'privacy',
			'terms',
			'cookies',
			'accessibility',
			'notice',
		]);
		expect(plan.every((page) => page.locales.join(',') === 'en,fr,es')).toBe(true);
	});

	it('refuses any non-production apply target', () => {
		expect(() => assertProductionTarget('https://cms.dev.yesid.dev')).toThrow(/PROD only/);
		expect(() => assertProductionTarget(PROD_URL)).not.toThrow();
	});
});
