// slice-28.6 T6 — locale threading through the SEO layer. Pre-flip contract:
// locale 'en' output is byte-identical to before; 'fr' resolves FR strings
// where the trilingual content layer has them, while canonicals stay EN
// (fr ∉ PUBLISHED_LOCALES until the flip).
import { describe, it, expect } from 'vitest';
import { appendBrandPerLocale } from '$lib/adapters/compose-page-seo';
import { staticAdapter } from '$lib/adapters/static';
import { buildPersonNode } from '$lib/adapters/jsonld';
import { siteMeta } from '$lib/content/site-meta';

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
	it('static route SEO for fr keeps the EN canonical while fr is unpublished', async () => {
		const seo = await staticAdapter.meta.forRoute('/about', 'fr');
		expect(seo.canonical).toBe('https://yesid.dev/about');
	});
	it('breadcrumb names come from the trilingual site_pages registry', async () => {
		const seo = await staticAdapter.meta.forRoute('/about', 'fr');
		const crumbs = JSON.stringify(seo.jsonLd ?? []);
		expect(crumbs).toContain('Accueil'); // site-pages '/' title.fr
	});
	it('en output is unchanged (en-invariance)', async () => {
		const seo = await staticAdapter.meta.forRoute('/about', 'en');
		expect(seo.canonical).toBe('https://yesid.dev/about');
		const crumbs = JSON.stringify(seo.jsonLd ?? []);
		expect(crumbs).toContain('Home');
		expect(crumbs).not.toContain('Accueil');
	});
});

describe('techStack.content locale param', () => {
	it('defaults to en and accepts a locale (falls back to en docs when fr absent)', async () => {
		const items = await staticAdapter.techStack.all();
		const id = items[0].id;
		const en = await staticAdapter.techStack.content(id);
		const fr = await staticAdapter.techStack.content(id, 'fr');
		expect(en.length).toBeGreaterThan(0);
		expect(fr).toBe(en); // tech-stack longform is en-only today (deferred surface)
	});
});
