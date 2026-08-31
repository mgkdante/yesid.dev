import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	toLocalizedJSON,
	toLocalizedString,
	toLocalizedStringNullable,
	toLocalizedStringOrUndef,
} from './locale';

describe('ordered extra-locale loop', () => {
	test('uses one ordered locale registry in both localized emitters', () => {
		const source = readFileSync(join(import.meta.dir, 'locale.ts'), 'utf8');
		expect(source.match(/const EXTRA_LOCALES = \['fr', 'es'\] as const;/g) ?? []).toHaveLength(1);
		expect(source.match(/for \(const locale of EXTRA_LOCALES\)/g) ?? []).toHaveLength(2);
	});

	test('keeps en -> fr -> es order and sparse omission independent of row order', () => {
		const rows = [
			{ languages_code: 'es', label: 'Hola', missing: '' },
			{ languages_code: 'fr', label: '', missing: null },
			{ languages_code: 'en', label: 'Hello', missing: '' },
		];

		expect(JSON.stringify(toLocalizedString(rows, 'label'))).toBe('{"en":"Hello","es":"Hola"}');
		expect(toLocalizedStringOrUndef(rows, 'missing')).toBeUndefined();
		expect(toLocalizedStringNullable(rows, 'missing')).toBeNull();
	});

	test('keeps ordered sparse string leaves through localized JSON recursion', () => {
		const rows = [
			{ languages_code: 'es', content: { title: '', nested: { body: 'Cuerpo' } } },
			{ languages_code: 'fr', content: { title: 'Titre', nested: { body: '' } } },
			{ languages_code: 'en', content: { title: 'Title', nested: { body: 'Body' } } },
		];

		expect(JSON.stringify(toLocalizedJSON(rows, 'content'))).toBe(
			'{"title":{"en":"Title","fr":"Titre"},"nested":{"body":{"en":"Body","es":"Cuerpo"}}}',
		);
	});

	test('ignores unsupported locale rows while preserving the en-fr-es contract', () => {
		const rows = [
			{ languages_code: 'de', label: 'Hallo' },
			{ languages_code: 'es', label: 'Hola' },
			{ languages_code: 'fr', label: 'Bonjour' },
			{ languages_code: 'en', label: 'Hello' },
		];

		expect(toLocalizedString(rows, 'label')).toEqual({
			en: 'Hello',
			fr: 'Bonjour',
			es: 'Hola',
		});
	});
});
