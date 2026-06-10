// Unit tests for the DORMANT Directus adapter's pure helpers.
//
// Post-27.2 the adapter is out of the runtime data path (see the DORMANT
// banner in directus.ts) but stays in-tree as the slice-26 RUN_PARITY oracle.
// These tests keep its pure transform helpers (toLocalizedString et al.)
// honest without any network; the live-network port coverage lives in
// directus.integration.test.ts, opt-in via RUN_DIRECTUS_INTEGRATION=1
// (CI: contract-test.yml against an ephemeral Directus).

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
