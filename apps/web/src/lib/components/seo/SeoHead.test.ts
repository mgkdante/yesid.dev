import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SeoHead from './SeoHead.svelte';
import type { PageSeo } from '$lib/schemas/seo';

const validSeo: PageSeo = {
	title: { en: 'Test Page | yesid.' },
	description: { en: 'A'.repeat(155) },
	canonical: 'https://yesid.dev/test',
	ogType: 'website',
	noIndex: false,
};

function getMeta(attr: string, value: string): HTMLMetaElement | null {
	return document.head.querySelector(`meta[${attr}="${value}"]`);
}

function getLink(rel: string, extraAttr?: { name: string; value: string }): HTMLLinkElement | null {
	const selector = extraAttr
		? `link[rel="${rel}"][${extraAttr.name}="${extraAttr.value}"]`
		: `link[rel="${rel}"]`;
	return document.head.querySelector(selector);
}

describe('SeoHead — tag emission', () => {
	beforeEach(() => {
		document.head.innerHTML = '';
	});

	it('emits <title>', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		expect(document.title).toBe('Test Page | yesid.');
	});

	it('emits <meta name="description">', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		expect(getMeta('name', 'description')?.content).toBe(validSeo.description.en);
	});

	it('emits <link rel="canonical">', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		expect(getLink('canonical')?.href).toBe('https://yesid.dev/test');
	});

	it('emits the full OG tag set', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		for (const prop of [
			'og:title',
			'og:description',
			'og:image',
			'og:url',
			'og:type',
			'og:site_name',
			'og:locale',
		]) {
			expect(getMeta('property', prop), `missing OG tag ${prop}`).not.toBeNull();
		}
	});

	it('emits twitter:card=summary_large_image and the core Twitter set', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		expect(getMeta('name', 'twitter:card')?.content).toBe('summary_large_image');
		for (const prop of ['twitter:title', 'twitter:description', 'twitter:image']) {
			expect(getMeta('name', prop), `missing Twitter tag ${prop}`).not.toBeNull();
		}
	});

	it('emits hreflang for every published locale + x-default', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		expect(getLink('alternate', { name: 'hreflang', value: 'en' })).not.toBeNull();
		expect(getLink('alternate', { name: 'hreflang', value: 'x-default' })).not.toBeNull();
	});

	it('falls back to locale-specific default OG image when ogImage is omitted', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		const ogImage = getMeta('property', 'og:image');
		expect(ogImage?.content).toMatch(/\/og\/default\.en\.png$/);
	});

	it('falls back to EN default OG image for unpublished locale', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'fr' } });
		const ogImage = getMeta('property', 'og:image');
		// fr is not yet in PUBLISHED_LOCALES — falls back to EN
		expect(ogImage?.content).toMatch(/\/og\/default\.en\.png$/);
	});

	it('emits noindex,nofollow robots meta when seo.noIndex is true', () => {
		render(SeoHead, { props: { seo: { ...validSeo, noIndex: true }, locale: 'en' } });
		expect(getMeta('name', 'robots')?.content).toBe('noindex,nofollow');
	});

	it('emits theme-color and color-scheme meta', () => {
		render(SeoHead, { props: { seo: validSeo, locale: 'en' } });
		expect(getMeta('name', 'theme-color')?.content).toBe('#141414');
		expect(getMeta('name', 'color-scheme')?.content).toBe('dark');
	});

	it('resolves og:image to absolute URL when url is relative', () => {
		render(SeoHead, {
			props: {
				seo: { ...validSeo, ogImage: { url: '/og/custom.png', alt: { en: 'Alt' }, width: 1200, height: 630 } },
				locale: 'en',
			},
		});
		expect(getMeta('property', 'og:image')?.content).toBe('https://yesid.dev/og/custom.png');
	});

	it('keeps og:image absolute when url already has a host', () => {
		render(SeoHead, {
			props: {
				seo: {
					...validSeo,
					ogImage: { url: 'https://cdn.example.com/img.png', alt: { en: 'Alt' }, width: 1200, height: 630 },
				},
				locale: 'en',
			},
		});
		expect(getMeta('property', 'og:image')?.content).toBe('https://cdn.example.com/img.png');
	});

	it('emits og:image pointing at /og/blog/{slug}.png when seo.ogImage.url is the OG endpoint', () => {
		render(SeoHead, {
			props: {
				seo: {
					...validSeo,
					ogImage: {
						url: '/og/blog/postgres-vacuum-tuning.png',
						alt: { en: 'Postgres Vacuum Tuning — yesid.' },
						width: 1200,
						height: 630,
					},
				},
				locale: 'en',
			},
		});
		expect(getMeta('property', 'og:image')?.content).toBe(
			'https://yesid.dev/og/blog/postgres-vacuum-tuning.png',
		);
	});
});

describe('SeoHead — dev warnings', () => {
	let warnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		document.head.innerHTML = '';
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		warnSpy.mockRestore();
	});

	it('warns when description is outside 150–160 in dev', () => {
		const shortDesc: PageSeo = { ...validSeo, description: { en: 'A'.repeat(80) } };
		render(SeoHead, { props: { seo: shortDesc, locale: 'en', dev: true } });
		expect(warnSpy).toHaveBeenCalled();
	});

	it('warns when title > 60 chars in dev', () => {
		const longTitle: PageSeo = { ...validSeo, title: { en: 'A'.repeat(65) } };
		render(SeoHead, { props: { seo: longTitle, locale: 'en', dev: true } });
		expect(warnSpy).toHaveBeenCalled();
	});

	it('does not warn in production mode', () => {
		const longTitle: PageSeo = { ...validSeo, title: { en: 'A'.repeat(65) } };
		render(SeoHead, { props: { seo: longTitle, locale: 'en', dev: false } });
		expect(warnSpy).not.toHaveBeenCalled();
	});
});

describe('JsonLd integration (Slice 15b)', () => {
	const baseSeo: PageSeo = {
		title: { en: 'Test' },
		description: { en: 'A'.repeat(120) },
		canonical: 'https://yesid.dev/test',
		ogType: 'website' as const,
		noIndex: false,
	};

	afterEach(() => {
		document.head
			.querySelectorAll('script[type="application/ld+json"]')
			.forEach((el) => el.remove());
	});

	it('does NOT mount <script> when seo.jsonLd is undefined', () => {
		render(SeoHead, { props: { seo: baseSeo, locale: 'en' } });
		const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
		expect(scripts).toHaveLength(0);
	});

	it('does NOT mount <script> when seo.jsonLd is empty', () => {
		render(SeoHead, { props: { seo: { ...baseSeo, jsonLd: [] }, locale: 'en' } });
		const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
		expect(scripts).toHaveLength(0);
	});

	it('mounts one <script> when seo.jsonLd has nodes', () => {
		const breadcrumb = {
			'@type': 'BreadcrumbList' as const,
			'@id': 'https://yesid.dev/test#breadcrumb',
			itemListElement: [
				{ '@type': 'ListItem' as const, position: 1, name: 'Home', item: 'https://yesid.dev' },
				{
					'@type': 'ListItem' as const,
					position: 2,
					name: 'Test',
					item: 'https://yesid.dev/test',
				},
			],
		};
		render(SeoHead, { props: { seo: { ...baseSeo, jsonLd: [breadcrumb] }, locale: 'en' } });
		const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
		expect(scripts).toHaveLength(1);
		const parsed = JSON.parse(scripts[0].textContent!);
		expect(parsed['@graph']).toHaveLength(1);
		expect(parsed['@graph'][0]['@type']).toBe('BreadcrumbList');
	});
});
