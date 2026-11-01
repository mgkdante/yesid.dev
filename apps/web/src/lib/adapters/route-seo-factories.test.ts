import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { composePageSeo } from './compose-page-seo';
import { codeRouteSeoDefaults } from './route-seo-defaults';
import { siteMeta as contentSiteMeta } from '#lib/content/site-meta.ts';
import { STATIC_SITE_SEO_DEFAULTS } from '#lib/content/site-seo-defaults.ts';
import { canonicalFor } from '#lib/utils/seo-defaults.ts';
import { PUBLISHED_LOCALES } from '#lib/utils/published-locales.ts';
import type { ContentAdapter } from './types';
import {
	blogSlugSeoFactory,
	legalSlugSeoFactory,
	projectsSlugSeoFactory,
	servicesIdSeoFactory,
} from './route-seo-factories';
import { blogPostFactory, projectFactory, serviceFactory } from '../../tests/factories';
import { PageSeoSchema } from '#lib/schemas/seo.ts';
import type {
	BlogPost,
	LegalPage,
	Locale,
	Project,
	Service,
	SiteMeta,
	SiteSeoDefaults,
} from '#lib/types.ts';

// Mutable mock state so a single test can exercise the production behaviour
// where asset() resolves to a RELATIVE mirrored path instead of an absolute URL.
const assetMock = vi.hoisted(() => ({ relative: false, tall: false }));
vi.mock('#lib/directus/assets.ts', () => ({
	assetImage: (id: string, preset?: string) => ({ src: assetMock.relative ? `/images/work/${id}.png` : `https://cms.example.com/assets/${id}${preset ? `?key=${preset}` : ''}`, ...(assetMock.relative ? {width:1440,height:assetMock.tall ? 6626 : 1000} : {}) }),
	asset: (id: string, preset?: string) =>
		assetMock.relative
			? `/images/work/${id}.png`
			: `https://cms.example.com/assets/${id}${preset ? `?key=${preset}` : ''}`,
}));

afterEach(() => {
	assetMock.relative = false;
	assetMock.tall = false;
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
		jobTitle: { en: 'Freelance Digital Infrastructure Developer' },
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

async function projectOgUrls(project: Project): Promise<Record<Locale, string | undefined>> {
	const adapter = {
		projects: {
			bySlug: async () => project,
		},
	} as unknown as ContentAdapter;
	const entries = await Promise.all(
		(['en', 'fr', 'es'] as const).map(async (locale) => {
			const seo = await projectsSlugSeoFactory({
				params: { slug: project.slug },
				locale,
				adapter,
				siteMeta,
				siteSeoDefaults,
			});
			return [locale, seo.ogImage?.url] as const;
		}),
	);
	return Object.fromEntries(entries) as Record<Locale, string | undefined>;
}

describe('blogSlugSeoFactory', () => {
	it.each(['en', 'fr', 'es'] as const)('uses the localized title card instead of shared cover metadata in %s', async (lang) => {
		assetMock.relative = true;
		const titles = { en: 'Component boundaries', fr: 'Limites des composants', es: 'Límites de los componentes' };
		const post = {
			translationKey: 'component-boundaries',
			slug: 'component-boundaries-' + lang,
			title: titles[lang],
			excerpt: 'A practical explanation of why visually similar components can keep separate responsibilities.',
			date: '2026-10-08',
			lang,
			category: 'professional',
			tags: ['architecture'],
			animation: 'draw',
			svg: 'pro-code',
			coverImage: '33333333-3333-4333-8333-333333333333',
			coverImageAlt: 'English image metadata shared by every locale.',
			url: '/blog/component-boundaries-' + lang,
			external: false,
		} as BlogPost;
		const seo = await blogSlugSeoFactory({
			params: { slug: post.slug }, locale: lang, adapter: adapterFor(post), siteMeta, siteSeoDefaults,
		});
		const expected = '/og/blog/' + post.slug + '.png';
		expect(seo.ogImage).toEqual({
			url: expected, alt: { en: titles[lang] + ' | yesid.' }, width: 1200, height: 630,
		});
	});

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
			url: '/og/blog/raw-sql-control.png',
			alt: { en: 'Raw SQL Control | yesid.' },
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
		expect(seo.ogImage?.width).toBe(1200);
		expect(seo.ogImage?.height).toBe(630);
		expect(seo.ogImage?.url).toBe('/og/blog/mirrored-cover.png');
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
		expect(seo.ogImage?.url).toBe('/og/blog/staged-article.png');
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

describe('projectsSlugSeoFactory', () => {
	const project = projectFactory.build({
		slug: 'metro-map',
		title: {
			en: 'Metro Map',
			fr: 'Carte du métro',
			es: 'Mapa del metro',
		},
	});

	it.each(['en', 'fr', 'es'] as const)('bounds long search titles while preserving project identity in %s', async (locale) => {
		const title = {
			en: 'A multilingual portfolio connecting content, software, and reviewed releases',
			fr: 'Un portfolio multilingue qui relie le contenu, les logiciels et les publications vérifiées',
			es: 'Un portafolio multilingüe que conecta contenido, software y publicaciones verificadas',
		};
		const description = {
			time: 1, version: '2.31.2',
			blocks: [{ id: 'description', type: 'paragraph' as const, data: { text: siteSeoDefaults.defaultDescription.en } }],
		};
		const longProject = projectFactory.build({
			slug: 'multilingual-portfolio', title,
			description: { en: description, fr: description, es: description },
		});
		const original = structuredClone(longProject);
		const canonical = `https://yesid.dev${locale === 'en' ? '' : `/${locale}`}/projects/${longProject.slug}`;
		const seo = PageSeoSchema.parse(await projectsSlugSeoFactory({
			params: { slug: longProject.slug },
			locale,
			adapter: { projects: { bySlug: async () => longProject } } as unknown as ContentAdapter,
			siteMeta,
			siteSeoDefaults,
		}));

		for (const lang of ['en', 'fr', 'es'] as const) {
			const searchTitle = seo.title[lang]!;
			const suffix = ` | ${siteMeta.name}`;
			const body = searchTitle.slice(0, -suffix.length);
			expect(searchTitle.length).toBeLessThanOrEqual(70);
			expect(searchTitle.endsWith(suffix)).toBe(true);
			const kept = body.slice(0, -1);
			expect(body.endsWith('…')).toBe(true);
			expect(kept.length).toBeGreaterThan(0);
			expect(title[lang].startsWith(kept)).toBe(true);
			expect(title[lang].charAt(kept.length)).toMatch(/[\s,;:]/);
		}
		expect(seo.canonical).toBe(canonical);
		expect(seo.ogType).toBe('article');
		expect(seo.noIndex).toBe(false);
		expect(seo.jsonLd).toEqual(expect.arrayContaining([
			expect.objectContaining({ '@type': 'CreativeWork', '@id': canonical, url: canonical, name: title[locale] }),
			expect.objectContaining({ '@type': 'BreadcrumbList', itemListElement: expect.arrayContaining([
				expect.objectContaining({ name: title[locale], item: canonical }),
			]) }),
		]));
		expect(longProject).toEqual(original);
	});

	it('keeps project SEO indexable when a translated one-liner is outside the description band', async () => {
		const description = {
			time: 1,
			version: '2.31.2',
			blocks: [{ id: 'long-description', type: 'paragraph' as const, data: { text: 'x'.repeat(201) } }],
		};
		const designProject = projectFactory.build({
			slug: 'yesid-dev-design',
			title: { en: 'yesid.dev-design' },
			description: { en: description, fr: description, es: description },
			oneLiner: {
				en: 'One visual foundation, room for different products',
				fr: 'Une base visuelle commune, une place pour chaque produit',
				es: 'Una base visual común, espacio para cada producto',
			},
		});
		for (const locale of PUBLISHED_LOCALES) {
			const seo = PageSeoSchema.parse(await projectsSlugSeoFactory({
				params: { slug: designProject.slug },
				locale,
				adapter: { projects: { bySlug: async () => designProject } } as unknown as ContentAdapter,
				siteMeta,
				siteSeoDefaults,
			}));
			expect(seo.description).toEqual(siteSeoDefaults.defaultDescription);
			expect(seo.noIndex).toBe(false);
			expect(seo.title.en).toBe('yesid.dev-design | yesid.');
			expect(seo.ogImage?.url).toContain('/og/project/yesid-dev-design');
		}
	});

	it('keeps short localized titles and missing translations unchanged', async () => {
		for (const title of [project.title, { en: project.title.en }]) {
			const seo = await projectsSlugSeoFactory({
				params: { slug: project.slug },
				locale: 'en',
				adapter: { projects: { bySlug: async () => ({ ...project, title }) } } as unknown as ContentAdapter,
				siteMeta,
				siteSeoDefaults,
			});
			expect(seo.title).toEqual(Object.fromEntries(
				Object.entries(title).map(([lang, text]) => [lang, `${text} | ${siteMeta.name}`]),
			));
		}
	});

	it('emits bare EN and path-suffixed FR/ES OG image URLs', async () => {
		expect(await projectOgUrls(project)).toEqual({
			en: '/og/project/metro-map.png',
			fr: '/og/project/metro-map.fr.png',
			es: '/og/project/metro-map.es.png',
		});
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

describe('route SEO composition', () => {
	const STATIC_ROUTES = [
		'/',
		'/about',
		'/contact',
		'/services',
		'/projects',
		'/blog',
		'/blog/personal',
	] as const;

	const paragraph = (id: string, text: string) => ({
		time: 1,
		version: '2.31.2',
		blocks: [{ id, type: 'paragraph' as const, data: { text } }],
	});

	const service = serviceFactory.build({
		id: 'database-engineering',
		title: { en: 'Database Engineering', fr: 'Ingénierie de données', es: 'Ingeniería de datos' },
		description: {
			en: 'Reliable PostgreSQL systems for growing teams.',
			fr: 'Systèmes PostgreSQL fiables pour les équipes en croissance.',
			es: 'Sistemas PostgreSQL fiables para equipos en crecimiento.',
		},
	} satisfies Partial<Service>);

	const project = projectFactory.build({
		slug: 'transit',
		title: { en: 'Transit', fr: 'Transport collectif', es: 'Transporte público' },
		description: {
			en: paragraph('project-en', 'A reliable transit data platform for Montréal.'),
			fr: paragraph('project-fr', 'Une plateforme fiable de données de transport pour Montréal.'),
			es: paragraph('project-es', 'Una plataforma fiable de datos de transporte para Montreal.'),
		},
		tags: ['transit', 'data'],
		stack: ['PostgreSQL', 'SvelteKit'],
	} satisfies Partial<Project>);

	const blogPosts: readonly BlogPost[] = PUBLISHED_LOCALES.map((lang) => {
		const slug = {
			en: 'reliable-sql',
			fr: 'sql-fiable',
			es: 'sql-confiable',
		}[lang];
		return blogPostFactory.build({
			translationKey: 'reliable-sql',
			slug,
			title: {
				en: 'Reliable SQL',
				fr: 'SQL fiable',
				es: 'SQL confiable',
			}[lang],
			excerpt: 'A deterministic route metadata fixture with enough detail for the SEO contract.',
			seoTitle: 'Reliable SQL metadata',
			seoDescription:
				'A deterministic route metadata fixture with enough detail for search and structured data.',
			date: '2026-07-01',
			dateModified: '2026-07-02',
			lang,
			tags: ['sql', 'reliability'],
			coverImage: undefined,
			coverImageAlt: undefined,
			url: `${lang === 'en' ? '' : `/${lang}`}/blog/${slug}`,
		} satisfies Partial<BlogPost>);
	});

	const legalPage: LegalPage = {
		slug: 'terms',
		title: {
			en: 'Terms of Use',
			fr: 'Conditions d’utilisation',
			es: 'Condiciones de uso',
		},
		body: {
			en: paragraph('legal-en', 'These terms explain the rules that apply when using the yesid.dev website and its services.'),
			fr: paragraph('legal-fr', 'Ces conditions expliquent les règles applicables à l’utilisation du site et des services yesid.dev.'),
			es: paragraph('legal-es', 'Estas condiciones explican las reglas aplicables al uso del sitio y los servicios de yesid.dev.'),
		},
	};

	it('every route and published locale gets its canonical URL and valid structured data', async () => {
		for (const locale of PUBLISHED_LOCALES) {
			const common = { locale, siteMeta: contentSiteMeta, siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS };
			const post = blogPosts.find((candidate) => candidate.lang === locale)!;
			const adapter = {
				services: { byId: async () => service },
				projects: { bySlug: async () => project },
				blog: { all: async () => blogPosts, bySlug: async () => post },
				legal: { bySlug: async () => legalPage },
			} as unknown as ContentAdapter;
			const results = [
				...STATIC_ROUTES.map((routeId) => [routeId, composePageSeo({
					...common, routeId, routeOverride: undefined, codeDefaults: codeRouteSeoDefaults[routeId]!,
				})] as const),
				[`/services/${service.id}`, await servicesIdSeoFactory({ ...common, adapter, params: { id: service.id } })],
				[`/projects/${project.slug}`, await projectsSlugSeoFactory({ ...common, adapter, params: { slug: project.slug } })],
				[`/blog/${post.slug}`, await blogSlugSeoFactory({ ...common, adapter, params: { slug: post.slug } })],
				[`/legal/${legalPage.slug}`, await legalSlugSeoFactory({ ...common, adapter, params: { slug: legalPage.slug } })],
			] as const;
			for (const [path, seo] of results) {
				expect(seo.canonical).toBe(canonicalFor(path, locale));
				PageSeoSchema.parse(seo);
				expect(seo.jsonLd?.length).toBeGreaterThan(0);
				for (const node of seo.jsonLd!) expect(node['@type']).toBeTruthy();
			}
		}
	});
});
