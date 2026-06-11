import { describe, expect, it } from 'bun:test';
import { SitePageSchema } from '@repo/shared';
import { orderSitePageRows, toSitePage, type DirectusSitePageRow } from './site-pages';

const HOME_ROW: DirectusSitePageRow = {
	id: 'a1',
	status: 'published',
	path: '/',
	type: 'system',
	sort: 1,
	translations: [
		{ languages_code: 'en', title: 'Home' },
		{ languages_code: 'fr', title: 'Accueil' },
		{ languages_code: 'es', title: 'Inicio' },
	],
};

const SERVICES_ROW: DirectusSitePageRow = {
	id: 'b2',
	status: 'published',
	path: '/services',
	type: 'listing',
	sort: 2,
	translations: [
		{ languages_code: 'en', title: 'Services' },
		{ languages_code: 'fr', title: 'Services' },
		{ languages_code: 'es', title: 'Servicios' },
	],
};

describe('site-pages fetcher transform', () => {
	it('transforms a Directus site_pages row into SitePage', () => {
		expect(toSitePage(HOME_ROW)).toEqual({
			path: '/',
			type: 'system',
			title: { en: 'Home', fr: 'Accueil', es: 'Inicio' },
		});
	});

	it('keeps the listing type for section pages', () => {
		expect(toSitePage(SERVICES_ROW).type).toBe('listing');
	});

	it('drops empty/missing locale titles (en stays required)', () => {
		const sparse: DirectusSitePageRow = {
			...SERVICES_ROW,
			translations: [
				{ languages_code: 'en', title: 'Services' },
				{ languages_code: 'fr', title: '' },
			],
		};
		expect(toSitePage(sparse).title).toEqual({ en: 'Services' });
	});

	it('output parses through SitePageSchema (Zod gate)', () => {
		expect(() => SitePageSchema.parse(toSitePage(HOME_ROW))).not.toThrow();
		expect(() => SitePageSchema.parse(toSitePage(SERVICES_ROW))).not.toThrow();
	});

	it('rejects a malformed path through SitePageSchema', () => {
		const bad = toSitePage({ ...SERVICES_ROW, path: 'services/' });
		expect(() => SitePageSchema.parse(bad)).toThrow();
	});
});

describe('site-pages ordering', () => {
	it('orders by sort ascending', () => {
		const out = orderSitePageRows([SERVICES_ROW, HOME_ROW]);
		expect(out.map((r) => r.path)).toEqual(['/', '/services']);
	});

	it('null sort goes last; equal sorts tiebreak by path (deterministic)', () => {
		const noSort: DirectusSitePageRow = { ...SERVICES_ROW, id: 'c3', path: '/zzz', sort: null };
		const dupB: DirectusSitePageRow = { ...SERVICES_ROW, id: 'd4', path: '/about', sort: 2 };
		const out = orderSitePageRows([noSort, SERVICES_ROW, dupB, HOME_ROW]);
		expect(out.map((r) => r.path)).toEqual(['/', '/about', '/services', '/zzz']);
	});

	it('does not mutate its input', () => {
		const input = [SERVICES_ROW, HOME_ROW];
		orderSitePageRows(input);
		expect(input.map((r) => r.path)).toEqual(['/services', '/']);
	});
});
