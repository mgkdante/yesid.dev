import { describe, expect, it } from 'bun:test';
import { toNavLink, type DirectusNavLinkRow } from './nav';
import { NavLinkSchema } from '../schemas/nav';

const HEADER_ROW: DirectusNavLinkRow = {
	id: '1',
	status: 'published',
	placement: 'header',
	href: '/services',
	priority: 1,
	icon: null,
	translations: [
		{ languages_code: 'en', label: 'Services' },
		{ languages_code: 'fr', label: 'Services' },
		{ languages_code: 'es', label: 'Servicios' },
	],
};

const MENU_ROW: DirectusNavLinkRow = {
	id: '2',
	status: 'published',
	placement: 'menu',
	href: '/about',
	priority: 1,
	icon: { name: 'user' },
	translations: [
		{ languages_code: 'en', label: 'About', subtitle: 'the operator' },
		{ languages_code: 'fr', label: 'À propos', subtitle: "l'opérateur" },
		{ languages_code: 'es', label: 'Acerca de', subtitle: 'el operador' },
	],
};

describe('nav fetcher transform', () => {
	it('transforms a Directus nav_links row into NavLink', () => {
		const result = toNavLink(HEADER_ROW);
		expect(result).toEqual({
			label: { en: 'Services', fr: 'Services', es: 'Servicios' },
			href: '/services',
			priority: 1,
		});
	});

	it('resolves icon M2O FK to a string when present', () => {
		const result = toNavLink(MENU_ROW);
		expect(result.icon).toBe('user');
		expect(result.subtitle).toEqual({
			en: 'the operator',
			fr: "l'opérateur",
			es: 'el operador',
		});
	});

	it('omits subtitle when no translations have one', () => {
		const result = toNavLink(HEADER_ROW);
		expect(result.subtitle).toBeUndefined();
	});

	it('coerces unknown priority values to 1 (safe default)', () => {
		const weird: DirectusNavLinkRow = { ...HEADER_ROW, priority: 99 };
		const result = toNavLink(weird);
		expect(result.priority).toBe(1);
	});

	it('handles string icon (already-resolved)', () => {
		const stringIcon: DirectusNavLinkRow = { ...HEADER_ROW, icon: 'home' };
		const result = toNavLink(stringIcon);
		expect(result.icon).toBe('home');
	});

	it('output parses through NavLinkSchema (Zod gate)', () => {
		const result = toNavLink(MENU_ROW);
		expect(() => NavLinkSchema.parse(result)).not.toThrow();
	});
});
