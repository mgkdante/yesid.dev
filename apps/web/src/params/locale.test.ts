import { describe, it, expect } from 'vitest';
import { match } from './locale';

describe('locale param matcher', () => {
	it('accepts every PREFIX_LOCALE (fr today)', () => {
		expect(match('fr')).toBe(true);
	});
	it('rejects en (the default locale is never prefixed)', () => {
		expect(match('en')).toBe(false);
	});
	it('rejects es until Spanish routing opens', () => {
		expect(match('es')).toBe(false);
	});
	it('rejects arbitrary segments so static pages keep matching with lang absent', () => {
		expect(match('about')).toBe(false);
		expect(match('FR')).toBe(false);
		expect(match('')).toBe(false);
		expect(match('france')).toBe(false);
	});
});
