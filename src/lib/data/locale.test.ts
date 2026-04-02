import { describe, it, expect } from 'vitest';
import { resolveLocale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locale.js';
import type { LocalizedString } from './types.js';

describe('resolveLocale', () => {
	const full: LocalizedString = {
		en: 'Hello',
		fr: 'Bonjour',
		es: 'Hola'
	};

	it('returns the English string when locale is en', () => {
		expect(resolveLocale(full, 'en')).toBe('Hello');
	});

	it('returns the French string when locale is fr and fr is present', () => {
		expect(resolveLocale(full, 'fr')).toBe('Bonjour');
	});

	it('returns the Spanish string when locale is es and es is present', () => {
		expect(resolveLocale(full, 'es')).toBe('Hola');
	});

	it('falls back to English when the requested locale is missing', () => {
		// Spanish is not filled in — should get English, not undefined or French
		const enFrOnly: LocalizedString = { en: 'Hello', fr: 'Bonjour' };
		expect(resolveLocale(enFrOnly, 'es')).toBe('Hello');
	});

	it('falls back to English when the requested locale field is an empty string', () => {
		// An empty string means "not translated yet", not "intentionally blank"
		const withEmpty: LocalizedString = { en: 'Hello', fr: '' };
		expect(resolveLocale(withEmpty, 'fr')).toBe('Hello');
	});

	it('falls back to English when the requested locale field is whitespace only', () => {
		const withWhitespace: LocalizedString = { en: 'Hello', fr: '   ' };
		expect(resolveLocale(withWhitespace, 'fr')).toBe('Hello');
	});

	it('works correctly with only the required English field', () => {
		const enOnly: LocalizedString = { en: 'English only' };
		expect(resolveLocale(enOnly, 'en')).toBe('English only');
		expect(resolveLocale(enOnly, 'fr')).toBe('English only');
		expect(resolveLocale(enOnly, 'es')).toBe('English only');
	});

	it('does not fall through to French when Spanish is missing — direct fallback to English', () => {
		// The fallback chain is: requested → en. No intermediate step.
		const enFrOnly: LocalizedString = { en: 'English', fr: 'French' };
		expect(resolveLocale(enFrOnly, 'es')).toBe('English');
	});
});

describe('locale constants', () => {
	it('DEFAULT_LOCALE is en', () => {
		expect(DEFAULT_LOCALE).toBe('en');
	});

	it('SUPPORTED_LOCALES contains en, fr, and es', () => {
		expect(SUPPORTED_LOCALES).toContain('en');
		expect(SUPPORTED_LOCALES).toContain('fr');
		expect(SUPPORTED_LOCALES).toContain('es');
		expect(SUPPORTED_LOCALES).toHaveLength(3);
	});
});
