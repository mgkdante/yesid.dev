import { describe, expect, it } from 'vitest';
import { CLIENT_LOGIN_URL, menuHref, visibleMenuItems } from '#lib/navigation/menu.ts';

const item = { href: CLIENT_LOGIN_URL, priority: 2 as const, label: { en: 'Client login', fr: '', es: 'Acceso de clientes' } };
describe('CMS menu destinations', () => {
	it('passes only the locale hint to the login root', () => {
		for (const locale of ['en', 'fr', 'es'] as const) {
			expect(menuHref(CLIENT_LOGIN_URL, locale)).toBe(`${CLIENT_LOGIN_URL}/?lang=${locale}`);
		}
		expect(menuHref('/services', 'fr')).toBe('/fr/services');
		expect(menuHref('https://example.com', 'fr')).toBe('https://example.com');
	});
	it('hides untranslated and empty entries without a placeholder', () => {
		expect(visibleMenuItems([item], 'fr')).toEqual([]);
		expect(visibleMenuItems([{ ...item, href: '' }], 'en')).toEqual([]);
		expect(visibleMenuItems([item], 'en')).toEqual([item]);
	});
});
