import { describe, expect, it } from 'vitest';
import { catalog } from '#lib/catalog/index.ts';
import { load } from './+layout.server';

async function callLoad(routeId: string | null = '/', params: Record<string, string> = {}, pathname = '/') {
	const result = await load({ route: { id: routeId }, params, url: new URL(`https://yesid.dev${pathname}`) } as Parameters<typeof load>[0]);
	if (!result?.seo) throw new Error('Expected layout data and SEO');
	return { ...result, seo: result.seo };
}

describe('generated layout data', () => {
	it('returns each navigation placement, error copy, shapes and SEO from the real catalog', async () => {
		const result = await callLoad();
		expect(result.headerLinks).toEqual(catalog.nav.byPlacement('header'));
		expect(result.footerLinks).toEqual(catalog.nav.byPlacement('footer'));
		expect(result.menuItems).toEqual(catalog.nav.byPlacement('menu'));
		expect(result.errorPage).toEqual(catalog.content.errorPage());
		expect(result.morphShapes).toEqual(catalog.content.morphShapes());
		expect(result.seo.canonical).toBe('https://yesid.dev');
		expect(result.themeColor).toBe(catalog.meta.siteSeoDefaults().themeColor);
	});
	it.each(['', '/fr', '/es'])('rejects an unpublished %s site page', async (prefix) => {
		await expect(callLoad('/[[lang=locale]]/missing', {}, `${prefix}/missing`)).rejects.toMatchObject({ status: 404 });
	});
	it.each(['en', 'fr', 'es'] as const)('threads %s through a published route', async (locale) => {
		const prefix = locale === 'en' ? '' : `/${locale}`;
		const result = await callLoad('/[[lang=locale]]/about', { lang: locale === 'en' ? '' : locale }, `${prefix}/about`);
		expect(result.locale).toBe(locale);
		expect(result.seo.canonical).toBe(`https://yesid.dev${prefix}/about`);
	});
	it.each([
		['/projects/[slug]', { slug: 'missing' }, '/projects/missing'],
		['/services/[id]', { id: 'missing' }, '/services/missing'],
		['/blog/[slug]', { slug: 'missing' }, '/blog/missing'],
	] as const)('keeps missing %s detail URLs at 404 before SEO resolution', async (route, params, path) => {
		await expect(callLoad(route, { ...params }, path)).rejects.toMatchObject({ status: 404 });
	});
	it('can render error SEO for an unmatched URL without rethrowing the registry gate', async () => {
		const result = await callLoad(null, {}, '/fr/missing');
		expect(result.locale).toBe('fr');
		expect(result.seo.noIndex).toBe(true);
	});
	it('surfaces an unknown SEO route instead of masking it as a CMS outage', async () => {
		await expect(callLoad('/unconfigured')).rejects.toThrow('Unknown route id');
	});
});
