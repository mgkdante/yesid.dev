import { sitePages } from '#lib/content/site-pages.ts';
// slice-28.6 T6 — locale threading through the SEO layer. Pre-flip contract:
// locale 'en' output is byte-identical to before; 'fr' resolves FR strings
// where the trilingual content layer has them, while canonicals stay EN
// (fr ∉ PUBLISHED_LOCALES until the flip).
import { describe, it, expect } from 'vitest';
import { appendBrandPerLocale } from '#lib/adapters/compose-page-seo.ts';
import { staticAdapter } from '#lib/adapters/static.ts';
import { buildPersonNode } from '#lib/adapters/jsonld.ts';
import { siteMeta } from '#lib/content/site-meta.ts';

describe('appendBrandPerLocale', () => {
	it('suffixes every provided locale, skips absent ones', () => {
		expect(appendBrandPerLocale({ en: 'About', fr: 'À propos' }, 'yesid.')).toEqual({
			en: 'About | yesid.',
			fr: 'À propos | yesid.',
		});
		expect(appendBrandPerLocale({ en: 'About' }, 'yesid.')).toEqual({ en: 'About | yesid.' });
	});
});

describe('buildPersonNode locale', () => {
	it('resolves jobTitle for fr (trilingual in site-meta)', () => {
		const node = buildPersonNode(siteMeta, 'fr') as { jobTitle?: string };
		expect(node.jobTitle).toBe(siteMeta.owner.jobTitle.fr ?? siteMeta.owner.jobTitle.en);
	});
});

describe('meta.forRoute locale threading', () => {
	it('static route SEO for fr canonicalizes to the /fr URL (fr published)', async () => {
		const seo = await staticAdapter.meta.forRoute('/about', 'fr');
		expect(seo.canonical).toBe('https://yesid.dev/fr/about');
	});
	it('breadcrumb names come from the trilingual site_pages registry', async () => {
		const seo = await staticAdapter.meta.forRoute('/about', 'fr');
		const crumbs = JSON.stringify(seo.jsonLd ?? []);
		expect(crumbs).toContain(sitePages.find(page => page.path === '/')!.title.fr!); // site-pages '/' title.fr
	});
	it('en output is unchanged (en-invariance)', async () => {
		const seo = await staticAdapter.meta.forRoute('/about', 'en');
		expect(seo.canonical).toBe('https://yesid.dev/about');
		const crumbs = JSON.stringify(seo.jsonLd ?? []);
		expect(crumbs).toContain(sitePages.find(page => page.path === '/')!.title.en);
	});
});
