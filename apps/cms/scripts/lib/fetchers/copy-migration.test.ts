import { expect, it } from 'bun:test';
import { migrationCopy } from './copy-migration';
import values from '../../../fixtures/content/copy-migration.json';
import fixture from '../../../../../packages/shared/fixtures/export-data.json';
import { toHeroContent } from './page-blocks-home';
import { toContactContent } from './page-blocks-medium';
import { toAboutContent } from './page-blocks-about';
import { toSiteLabels } from './site-labels';
import { readFileSync } from 'node:fs';

it('keeps existing localized copy until each CMS translation is populated', () => {
	const copy = migrationCopy([{ languages_code: 'fr', form_required_guidance: 'CMS FR' }, { languages_code: 'es', form_required_guidance: '  ' }], 'block_contact_content_translations', 'form_required_guidance');
	expect(copy.fr).toBe('CMS FR');
	expect(copy.en).toBe('All fields are required.');
	expect(copy.es).toBe('Todos los campos son obligatorios.');
});

it('preserves all migrated fixture values and lets CMS replace every locale independently', () => {
	type Row = Record<string, unknown> & { languages_code: string };
	const targets = {
		block_about_content_translations: (rows: Row[]) => toAboutContent({ id: 1, translations: rows }),
		block_contact_content_translations: (rows: Row[]) => toContactContent({ id: 1, translations: rows }, []).formTerminal,
		block_hero_translations: (rows: Row[]) => toHeroContent({ id: 1, translations: rows }),
		site_labels_translations: (rows: Row[]) => toSiteLabels({ id: '1', translations: rows }),
	};
	const leaves = (obj: unknown): string[] => Object.values(obj && typeof obj === 'object' ? obj : {}).flatMap(value => typeof value === 'string' ? [value] : value && typeof value === 'object' ? leaves(value) : []);
	for (const [collection, fields] of Object.entries(values)) {
		for (const [field, copy] of Object.entries(fields)) {
			const project = targets[collection as keyof typeof targets];
			const defaults = project([]);
			for (const locale of ['en', 'fr', 'es'] as const) {
				expect(leaves(defaults)).toContain(copy[locale]);
				expect(leaves(fixture.data)).toContain(copy[locale]);
				const marker = `CMS ${collection}/${field}/${locale}`;
				expect(leaves(project([{ languages_code: locale, [field]: marker }]))).toContain(marker);
			}
			const snapshot = JSON.parse(readFileSync(new URL(`../../../directus/snapshot/fields/${collection}/${field}.json`, import.meta.url), 'utf8'));
			expect(snapshot.field).toBe(field);
			expect(snapshot.schema.is_nullable).toBe(true);
		}
	}
});
