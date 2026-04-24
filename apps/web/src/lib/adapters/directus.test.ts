// Unit tests for the Directus adapter's pure helpers.
//
// Scoped narrowly: `toLocalizedString` is the one runtime function that lands
// in Task 4 scaffolding. The rest of the adapter (ports, client, row mapping)
// is exercised later — once Task 5 redefines the collection schema in Data
// Studio and Task 6 seeds data, a contract test can pull `directusAdapter`
// through `adapter.test.ts` the same way the static adapter does today.

import { describe, it, expect } from 'vitest';
import { toLocalizedString } from './directus';

describe('toLocalizedString', () => {
	it('returns { en: "" } for empty or missing translations', () => {
		expect(toLocalizedString(undefined, 'title')).toEqual({ en: '' });
		expect(toLocalizedString(null, 'title')).toEqual({ en: '' });
		expect(toLocalizedString([], 'title')).toEqual({ en: '' });
	});

	it('composes { en, fr?, es? } from Directus Translations rows', () => {
		const rows = [
			{ languages_code: 'en', title: 'Services' },
			{ languages_code: 'fr', title: 'Services' },
			{ languages_code: 'es', title: 'Servicios' },
		];
		expect(toLocalizedString(rows, 'title')).toEqual({
			en: 'Services',
			fr: 'Services',
			es: 'Servicios',
		});
	});

	it('omits fr/es keys when those locales have no content for the field', () => {
		const rows = [{ languages_code: 'en', title: 'Services' }];
		const result = toLocalizedString(rows, 'title');
		expect(result).toEqual({ en: 'Services' });
		expect('fr' in result).toBe(false);
		expect('es' in result).toBe(false);
	});

	it('treats empty strings as absent (does not set fr/es)', () => {
		const rows = [
			{ languages_code: 'en', title: 'Services' },
			{ languages_code: 'fr', title: '' },
		];
		expect(toLocalizedString(rows, 'title')).toEqual({ en: 'Services' });
	});

	it('reads the requested field, ignoring siblings', () => {
		const rows = [
			{ languages_code: 'en', title: 'Services', subtitle: '& Optimization' },
		];
		expect(toLocalizedString(rows, 'subtitle')).toEqual({ en: '& Optimization' });
	});

	it('falls back to the configured fallback locale when en is missing', () => {
		const rows = [{ languages_code: 'fr', title: 'Bonjour' }];
		// fallback defaults to 'en' — with no 'en' row and no match for fallback,
		// result is empty; sanity-check that explicit fallback='fr' synthesises en.
		expect(toLocalizedString(rows, 'title').en).toBe('');
		expect(toLocalizedString(rows, 'title', 'fr').en).toBe('Bonjour');
	});

	it('skips rows where the field is non-string (null, number, object)', () => {
		const rows = [
			{ languages_code: 'en', title: 'Services' },
			{ languages_code: 'fr', title: null },
			{ languages_code: 'es', title: 42 },
		];
		expect(toLocalizedString(rows, 'title')).toEqual({ en: 'Services' });
	});
});
