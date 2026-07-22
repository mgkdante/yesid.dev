import { describe, expect, test } from 'bun:test';
import * as locale from './locale';
import { emitValue } from './emitters/format';

type Translation = { languages_code: string } & Record<string, unknown>;
type FieldMap = readonly (
	| string
	| readonly [output: string, source: string]
	| readonly [output: string, source: string, mode: 'optional' | 'nullable']
)[];

const interpret = locale.toLocalizedFields as unknown as (
	rows: readonly Translation[],
	fields: FieldMap,
) => Record<string, unknown>;

describe('typed localized field-map interpreter', () => {
	test('exposes one field-map interpreter at the localization boundary', () => {
		expect((locale as Record<string, unknown>).toLocalizedFields).toBeFunction();
	});

	test('preserves declared output-key order and sparse locale order', () => {
		const rows: Translation[] = [
			{
				languages_code: 'fr',
				headline: 'Titre',
				description: '',
				cta_label: 'Parler',
			},
			{
				languages_code: 'en',
				headline: 'Title',
				description: 'Description',
				cta_label: 'Talk',
			},
			{
				languages_code: 'es',
				headline: 'Titulo',
				description: 'Descripcion',
				cta_label: '',
			},
		];

		const actual = interpret(rows, [
			['title', 'headline'],
			'description',
			['ctaLabel', 'cta_label'],
		]);

		expect(Object.keys(actual)).toEqual(['title', 'description', 'ctaLabel']);
		expect(JSON.stringify(actual)).toBe(
			'{"title":{"en":"Title","fr":"Titre","es":"Titulo"},"description":{"en":"Description","es":"Descripcion"},"ctaLabel":{"en":"Talk","fr":"Parler"}}',
		);
	});

	test('omits optional fields, retains explicit nulls, and does not disturb later keys', () => {
		const rows: Translation[] = [
			{ languages_code: 'en', required: 'Required', optional: '', nullable: null },
		];

		const actual = interpret(rows, [
			['first', 'required'],
			['optionalValue', 'optional', 'optional'],
			['nullableValue', 'nullable', 'nullable'],
			['last', 'required'],
		]);

		expect(Object.keys(actual)).toEqual(['first', 'nullableValue', 'last']);
		expect(actual).toEqual({
			first: { en: 'Required' },
			nullableValue: null,
			last: { en: 'Required' },
		});
	});

	test('serializes exactly like the legacy explicit conversion object', () => {
		const rows: Translation[] = [
			{ languages_code: 'en', meta_title: "Yesid's work", meta_description: 'Fast\\napps' },
			{ languages_code: 'fr', meta_title: 'Travail', meta_description: '' },
		];
		const legacy = {
			title: locale.toLocalizedString(rows, 'meta_title'),
			description: locale.toLocalizedString(rows, 'meta_description'),
			missing: locale.toLocalizedStringNullable(rows, 'missing'),
		};
		const actual = interpret(rows, [
			['title', 'meta_title'],
			['description', 'meta_description'],
			['missing', 'missing', 'nullable'],
		]);

		expect(emitValue(actual)).toBe(emitValue(legacy));
	});
});
