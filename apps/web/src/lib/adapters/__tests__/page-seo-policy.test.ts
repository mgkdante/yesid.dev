import { describe, expect, it, vi } from 'vitest';
import { catalog, createContentCatalog } from '#lib/catalog/index.ts';
import { resolvePageSeo } from '../page-seo';
import { seoHeadProps } from '#lib/utils/seo-defaults.ts';
import { appendBrandPerLocale } from '../compose-page-seo';

vi.mock('$app/env/public', () => ({ PUBLIC_DIRECTUS_URL: 'https://cms.yesid.dev' }));

const locales = ['en', 'fr', 'es'] as const;
const longTitle = {
	en: 'Reliable digital infrastructure for multilingual teams with many services and carefully reviewed releases',
	fr: 'Une infrastructure numérique fiable pour les équipes multilingues et leurs nombreux services et publications',
	es: 'Infraestructura digital fiable para equipos multilingües con muchos servicios y publicaciones revisadas',
};

describe('page SEO policy through resolvePageSeo', () => {
	it.each(locales)('fits static and home titles without changing authored copy in %s', async (locale) => {
		for (const route of ['/', '/contact']) {
			const title = route === '/'
				? Object.fromEntries(locales.map(lang => [lang, `yesid. | ${longTitle[lang]}`]))
				: longTitle;
			const override = { path: route, title: { en: title.en!, fr: title.fr!, es: title.es! }, description: null, ogImage: null };
			const content = { ...catalog, meta: { ...catalog.meta, routeOverrides: () => [override] } };
			const original = structuredClone(override);
			const seo = await resolvePageSeo(route, locale, {}, { catalog: content });
			for (const lang of locales) {
				expect(seo.title[lang]!.length).toBeLessThanOrEqual(70);
				expect(seo.title[lang]).toContain('…');
				if (route !== '/') expect(seo.title[lang]).toMatch(/ \| yesid\.$/);
				else expect(seo.title[lang]).toMatch(/^yesid\. \| /);
			}
			expect(override).toEqual(original);
		}
	});

	it.each(locales)('fits service and legal titles before schema validation in %s', async (locale) => {
		const service = { ...catalog.services.available()[0]!, title: longTitle };
		const legal = { ...catalog.legal.all()[0]!, title: longTitle };
		const content = createContentCatalog({ services: [service], legalPages: [legal] });
		for (const [route, params] of [
			['/services/[id]', { id: service.id }],
			['/legal/[slug]', { slug: legal.slug }],
		] as const) {
			const seo = await resolvePageSeo(route, locale, params, { catalog: content });
			for (const lang of locales) {
				expect(seo.title[lang]!.length).toBeLessThanOrEqual(70);
				expect(seo.title[lang]).toMatch(/… \| yesid\.$/);
			}
		}
	});

	it.each(locales)('uses one alt format for explicit and fallback share images in %s', async (locale) => {
		const service = catalog.services.available(locale)[0]!;
		const project = catalog.projects.available(locale)[0]!;
		const post = catalog.blog.all().find(row => row.lang === locale)!;
		const legal = catalog.legal.all()[0]!;
		for (const [route, params] of [
			['/', {}], ['/about', {}], ['/blog', {}], ['/blog/personal', {}],
			['/services/[id]', { id: service.id }],
			['/projects/[slug]', { slug: project.slug }],
			['/blog/[slug]', { slug: post.slug }],
			['/legal/[slug]', { slug: legal.slug }],
		] as const) {
			const seo = await resolvePageSeo(route, locale, params);
			const alt = seoHeadProps(seo, locale).image!.alt!;
			expect(alt, route).toMatch(/^.+ \| yesid\.$/);
			expect(alt, route).not.toMatch(/^yesid\. [|·]/);
			expect(alt, route).not.toContain(' | yesid. | yesid.');
		}
	});

	it('normalizes an explicit static image alt without clipping the image description', async () => {
		const content = { ...catalog, meta: { ...catalog.meta, routeOverrides: () => [{
			path: '/contact', title: longTitle, description: null, ogImage: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
		}] } };
		const seo = await resolvePageSeo('/contact', 'en', {}, { catalog: content });
		expect(seo.ogImage?.alt).toEqual(Object.fromEntries(locales.map(lang => [lang, `${longTitle[lang]} | yesid.`])));
	});

	it('keeps the existing blog preference for a fitting article title over an overlong SEO title', async () => {
		const post = { ...catalog.blog.all()[0]!, title: 'Short article title', seoTitle: longTitle.en };
		const content = createContentCatalog({ posts: [post] });
		const seo = await resolvePageSeo('/blog/[slug]', post.lang, { slug: post.slug }, { catalog: content });
		expect(seo.title.en).toBe('Short article title | yesid.');
	});
});

describe('title boundaries', () => {
	it('preserves a 70-character title and clips only after the limit, including unbroken text', () => {
		const suffix = ' | yesid.';
		const body = 'x'.repeat(70 - suffix.length);
		expect(appendBrandPerLocale({ en: body }, 'yesid.')).toEqual({ en: body + suffix });
		const clipped = appendBrandPerLocale({ en: body + 'x' }, 'yesid.');
		expect(clipped.en).toBe('x'.repeat(body.length - 1) + '…' + suffix);
		expect(clipped.fr).toBeUndefined();
	});
});
