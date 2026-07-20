import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import type { ContentAdapter } from './types';
import {
	blogSlugSeoFactory,
	legalSlugSeoFactory,
	servicesIdSeoFactory,
} from './route-seo-factories';
import { serviceFactory } from '../../tests/factories';
import type { BlogPost, LegalPage, Service, SiteMeta, SiteSeoDefaults } from '$lib/types';

// Mutable mock state so a single test can exercise the production behaviour
// where asset() resolves to a RELATIVE mirrored path instead of an absolute URL.
const assetMock = vi.hoisted(() => ({ relative: false }));
vi.mock('$lib/directus/assets', () => ({
	asset: (id: string, preset?: string) =>
		assetMock.relative
			? `/images/work/${id}.png`
			: `https://cms.example.com/assets/${id}${preset ? `?key=${preset}` : ''}`,
}));

afterEach(() => {
	assetMock.relative = false;
});

const siteMeta = {
	name: 'yesid.',
	tagline: { en: 'Digital infrastructure that moves.' },
	description: { en: 'A portfolio and freelance practice.' },
	links: {
		email: 'contact@yesid.dev',
		github: 'https://github.com/mgkdante',
		linkedin: 'https://www.linkedin.com/in/otaloray/',
	},
	owner: {
		name: 'Yesid Otalora',
		jobTitle: { en: 'Freelance Digital Solutions Developer' },
		knowsAbout: ['PostgreSQL', 'SvelteKit'],
		address: {
			locality: 'Montreal',
			region: 'QC',
			country: 'CA',
		},
	},
} satisfies SiteMeta;

const siteSeoDefaults = {
	defaultOgImage: null,
	themeColor: '#141414',
	defaultDescription: {
		en: 'Fallback description long enough to satisfy the SEO schema contract when post copy is missing or too short.',
	},
} satisfies SiteSeoDefaults;

function adapterFor(post: BlogPost, posts: readonly BlogPost[] = [post]): ContentAdapter {
	return {
		blog: {
			all: async () => posts,
			bySlug: async () => post,
		},
	} as unknown as ContentAdapter;
}

function translatedVariant(
	post: BlogPost,
	lang: BlogPost['lang'],
	slug: string,
): BlogPost {
	return {
		...post,
		lang,
		slug,
		title: `${lang.toUpperCase()} ${post.title}`,
		url: `${lang === 'en' ? '' : `/${lang}`}/blog/${slug}`,
	};
}

describe('blogSlugSeoFactory', () => {
	it('uses CMS-backed post SEO fields for title, description, OG image, and JSON-LD', async () => {
		const seoDescription =
			'Why raw SQL can beat ORM abstractions for PostgreSQL work when control, performance, and readable query behavior matter.';
		const post = {
			translationKey: 'raw-sql-control',
			slug: 'raw-sql-control',
			title: 'Raw SQL Control',
			excerpt: 'Short listing excerpt.',
			seoTitle: 'Raw SQL for PostgreSQL Control',
			seoDescription,
			date: '2026-04-14',
			dateModified: '2026-04-20',
			lang: 'en',
			category: 'professional',
			tags: ['sql', 'postgresql'],
			animation: 'draw',
			svg: 'pro-code',
			coverImage: '11111111-1111-4111-8111-111111111111',
			coverImageAlt: 'PostgreSQL query plan screenshot in the CMS.',
			url: '/blog/raw-sql-control',
			external: false,
		} as BlogPost;

		const translations = [
			post,
			translatedVariant(post, 'fr', 'controle-sql-brut'),
			translatedVariant(post, 'es', 'control-sql-directo'),
		];
		const seo = await blogSlugSeoFactory({
			params: { slug: post.slug },
			locale: 'en',
			adapter: adapterFor(post, translations),
			siteMeta,
			siteSeoDefaults,
		});

		expect(seo.title.en).toBe('Raw SQL for PostgreSQL Control | yesid.');
		expect(seo.description.en).toBe(seoDescription);
		expect(seo.canonical).toBe('https://yesid.dev/blog/raw-sql-control');
		expect(seo.singleLocale).toBeUndefined();
		expect(seo.localeAlternates).toEqual({
			en: 'https://yesid.dev/blog/raw-sql-control',
			fr: 'https://yesid.dev/fr/blog/controle-sql-brut',
			es: 'https://yesid.dev/es/blog/control-sql-directo',
		});
		expect(seo.localeHandoffId).toBe('blog:raw-sql-control');
		expect(seo.ogImage).toEqual({
			url: 'https://cms.example.com/assets/11111111-1111-4111-8111-111111111111?key=og-1200',
			alt: { en: 'PostgreSQL query plan screenshot in the CMS.' },
			width: 1200,
			height: 630,
		});

		const blogPosting = seo.jsonLd?.find((node) => node['@type'] === 'BlogPosting');
		expect(blogPosting).toMatchObject({
			'@type': 'BlogPosting',
			headline: 'Raw SQL Control',
			description: seoDescription,
			dateModified: '2026-04-20',
			keywords: ['sql', 'postgresql'],
			image: 'https://cms.example.com/assets/11111111-1111-4111-8111-111111111111?key=og-1200',
		});
	});

	it('absolutizes a relative mirrored cover image so BlogPosting JSON-LD does not throw', async () => {
		// Production binding: asset() resolves through the local media mirror to a
		// relative '/images/...' path. JSON-LD `image` is validated as an absolute
		// URL, so without absolutization the factory throws and the post silently
		// loses all structured data. This locks the SITE_HOST prefixing.
		assetMock.relative = true;
		const post = {
			translationKey: 'mirrored-cover',
			slug: 'mirrored-cover',
			title: 'Mirrored Cover',
			excerpt: 'Short listing excerpt.',
			seoTitle: 'Mirrored Cover Post',
			seoDescription:
				'A blog post whose cover image resolves through the local media mirror to a relative static path rather than an absolute CMS URL.',
			date: '2026-05-01',
			dateModified: '2026-05-02',
			lang: 'en',
			category: 'professional',
			tags: ['mirror'],
			animation: 'draw',
			svg: 'pro-code',
			coverImage: '22222222-2222-4222-8222-222222222222',
			coverImageAlt: 'Cover served from the local mirror.',
			url: '/blog/mirrored-cover',
			external: false,
		} as BlogPost;
		const translations = [
			post,
			translatedVariant(post, 'fr', 'couverture-miroir'),
			translatedVariant(post, 'es', 'portada-reflejada'),
		];

		const seo = await blogSlugSeoFactory({
			params: { slug: post.slug },
			locale: 'en',
			adapter: adapterFor(post, translations),
			siteMeta,
			siteSeoDefaults,
		});

		const blogPosting = seo.jsonLd?.find((node) => node['@type'] === 'BlogPosting');
		expect(blogPosting?.image).toBe(
			'https://yesid.dev/images/work/22222222-2222-4222-8222-222222222222.png',
		);
		// ogImage uses the same absolutized URL.
		expect(seo.ogImage?.url).toBe(
			'https://yesid.dev/images/work/22222222-2222-4222-8222-222222222222.png',
		);
	});

	it('keeps available exact alternates when a target translation is not published yet', async () => {
		const post = {
			translationKey: 'staged-article',
			slug: 'staged-article',
			title: 'Staged Article',
			excerpt: 'Short listing excerpt.',
			seoDescription:
				'A staged multilingual article keeps safe alternate metadata while one translated row is still unavailable for publication.',
			date: '2026-07-11',
			lang: 'en',
			category: 'professional',
			tags: ['staged'],
			animation: 'draw',
			svg: 'pro-code',
			url: '/blog/staged-article',
			external: false,
		} as BlogPost;
		const posts = [post, translatedVariant(post, 'fr', 'article-en-preparation')];

		const seo = await blogSlugSeoFactory({
			params: { slug: post.slug },
			locale: 'en',
			adapter: adapterFor(post, posts),
			siteMeta,
			siteSeoDefaults,
		});

		expect(seo.localeAlternates).toEqual({
			en: 'https://yesid.dev/blog/staged-article',
			fr: 'https://yesid.dev/fr/blog/article-en-preparation',
		});
	});

	it('rejects an English slug requested under the French route', async () => {
		const post = {
			translationKey: 'english-only-route',
			slug: 'english-only-route',
			title: 'English-only route',
			excerpt:
				'An English article must not provide indexable article metadata for a matched French URL that the page loader rejects with a 404.',
			date: '2026-07-11',
			lang: 'en',
			category: 'professional',
			tags: ['routing'],
			animation: 'draw',
			svg: 'pro-code',
			url: '/blog/english-only-route',
			external: false,
		} as BlogPost;

		await expect(
			blogSlugSeoFactory({
				params: { slug: post.slug },
				locale: 'fr',
				adapter: adapterFor(post),
				siteMeta,
				siteSeoDefaults,
			}),
		).rejects.toThrow('does not belong to locale fr');
	});
});

describe('servicesIdSeoFactory', () => {
	const CARD_IDS = [
		'database-engineering',
		'data-pipeline',
		'analytics-reporting',
		'web-development',
	] as const;

	function argsFor(service: Service) {
		return {
			params: { id: service.id },
			locale: 'en' as const,
			ctx: undefined,
			adapter: { services: { byId: async () => service } } as unknown as ContentAdapter,
			siteMeta,
			siteSeoDefaults,
		};
	}

	it('wires the committed share card for each of the four station services', async () => {
		for (const id of CARD_IDS) {
			const service = serviceFactory.build({ id } as Partial<Service>);
			const seo = await servicesIdSeoFactory(argsFor(service));
			expect(seo.ogImage?.url).toBe(`/og/services/${id}.png`);
			expect(seo.ogImage?.width).toBe(1200);
			expect(seo.ogImage?.height).toBe(630);
			expect(seo.ogImage?.alt?.en).toContain('yesid.dev');
		}
	});

	it('every id in the card set has its PNG committed under static/og/services', () => {
		for (const id of CARD_IDS) {
			expect(existsSync(join(cwd(), `static/og/services/${id}.png`)), id).toBe(true);
		}
	});

	it('services without a card fall through to the locale default (no ogImage)', async () => {
		const service = serviceFactory.build({ id: 'internal-tooling' } as Partial<Service>);
		const seo = await servicesIdSeoFactory(argsFor(service));
		expect(seo.ogImage).toBeUndefined();
	});
});

describe('legalSlugSeoFactory', () => {
	it('uses the first substantive paragraph for each locale after a short revision line', async () => {
		const intro = {
			en: 'These terms explain the rules that apply when you visit and use the yesid.dev portfolio and contact website.',
			fr: 'Ces conditions expliquent les règles qui s’appliquent lorsque vous visitez et utilisez le site portfolio et contact yesid.dev.',
			es: 'Estas condiciones explican las reglas que se aplican cuando visita y utiliza el sitio de portafolio y contacto yesid.dev.',
		};
		const doc = (revision: string, description: string, locale: string) => ({
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: `${locale}-revision`, type: 'paragraph' as const, data: { text: revision } },
				{ id: `${locale}-intro`, type: 'paragraph' as const, data: { text: description } },
			],
		});
		const page: LegalPage = {
			slug: 'terms',
			title: {
				en: 'Terms of Use',
				fr: 'Conditions d’utilisation',
				es: 'Condiciones de uso',
			},
			body: {
				en: doc('Last updated: 2026-07-13', intro.en, 'en'),
				fr: doc('Dernière mise à jour : 2026-07-13', intro.fr, 'fr'),
				es: doc('Última actualización: 2026-07-13', intro.es, 'es'),
			},
		};
		const localizedDefaults: SiteSeoDefaults = {
			defaultOgImage: null,
			themeColor: '#141414',
			defaultDescription: {
				en: 'English homepage fallback description that must not replace legal-page copy.',
				fr: 'Description française de la page d’accueil qui ne doit pas remplacer le texte juridique.',
				es: 'Descripción en español de la página de inicio que no debe reemplazar el texto legal.',
			},
		};

		const seo = await legalSlugSeoFactory({
			params: { slug: page.slug },
			locale: 'en',
			adapter: {
				legal: { bySlug: async () => page },
			} as unknown as ContentAdapter,
			siteMeta,
			siteSeoDefaults: localizedDefaults,
		});

		expect(seo.description).toEqual(intro);
	});
});
