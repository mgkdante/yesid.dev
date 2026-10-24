import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { ContentAdapter } from './types';
import { composePageSeo } from './compose-page-seo';
import { codeRouteSeoDefaults } from './route-seo-defaults';
import {
	blogSlugSeoFactory,
	legalSlugSeoFactory,
	projectsSlugSeoFactory,
	servicesIdSeoFactory,
} from './route-seo-factories';
import { siteMeta } from '$lib/content/site-meta';
import { STATIC_SITE_SEO_DEFAULTS } from '$lib/content/site-seo-defaults';
import { blogPostFactory, projectFactory, serviceFactory } from '../../tests/factories';
import type { BlogPost, LegalPage, Locale, Project, Service } from '$lib/types';

vi.mock('$env/static/public', () => ({
	PUBLIC_DIRECTUS_URL: 'https://cms.yesid.dev',
}));

const LOCALES = ['en', 'fr', 'es'] as const satisfies readonly Locale[];
const STATIC_ROUTES = [
	'/',
	'/about',
	'/contact',
	'/services',
	'/projects',
	'/blog',
	'/blog/personal',
] as const;

function fingerprint(value: unknown) {
	const bytes = JSON.stringify(value);
	return {
		bytes: Buffer.byteLength(bytes),
		sha256: createHash('sha256').update(bytes).digest('hex'),
	};
}

function seoFingerprint(seo: { canonical: string; jsonLd?: unknown }) {
	return fingerprint({ canonical: seo.canonical, jsonLd: seo.jsonLd });
}

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

const blogPosts: readonly BlogPost[] = LOCALES.map((lang) => {
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

describe('route JSON-LD extraction contract', () => {
	it('locks canonical and JSON-LD bytes for every static route and locale', () => {
		const actual: Record<string, ReturnType<typeof fingerprint>> = {};
		for (const routeId of STATIC_ROUTES) {
			for (const locale of LOCALES) {
				const codeDefaults = codeRouteSeoDefaults[routeId]!;
				actual[`${locale}:${routeId}`] = seoFingerprint(
					composePageSeo({
						routeId,
						locale,
						siteMeta,
						siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
						routeOverride: undefined,
						codeDefaults,
					}),
				);
			}
		}

		expect(actual).toEqual({
			"en:/": {
				"bytes": 1696,
				"sha256": "c9fbee7af01126017260dcbb6000f4c190dd591862527d1076f40b5ab2b4101c"
			},
			"fr:/": {
				"bytes": 1713,
				"sha256": "e3a704226d976f8f3360530f73432b0304c5041f5e363c3bf72224a454e126e4"
			},
			"es:/": {
				"bytes": 1712,
				"sha256": "44189d95e9e28dc2fcd6d8c421f50e070ee11a94c87bb971f016d6f0d701f8b4"
			},
			"en:/about": {
				"bytes": 1091,
				"sha256": "c4169dcd453cde821fafd3682102d1878958f85b20674f2e8abdb42509c5af9d"
			},
			"fr:/about": {
				"bytes": 1117,
				"sha256": "272b6123843b94ffe70cb02aa5ede2df839c310f7bb7aa37a9fa884e8a7e62f5"
			},
			"es:/about": {
				"bytes": 1116,
				"sha256": "909a390c82bcfd79e90d70a422dcc9c50f2073be4dfebb025e57039d9c824bca"
			},
			"en:/contact": {
				"bytes": 344,
				"sha256": "ffd1708452a6184fcf49c1349785a397c36ab30d88fbbe099dfeacebff597734"
			},
			"fr:/contact": {
				"bytes": 356,
				"sha256": "088f3573356ac890aa9e07c706510383ac100d1e970b803aac5b77dbc7f1ce3c"
			},
			"es:/contact": {
				"bytes": 356,
				"sha256": "f8e22ff1565b16f4bfe6f69b8311ea7380843a7a3137339b5aa8b211352e72d9"
			},
			"en:/services": {
				"bytes": 665,
				"sha256": "7ce0fa6dd5ed3649721194accf91288081a5819c654469e33d65805f4842f53b"
			},
			"fr:/services": {
				"bytes": 693,
				"sha256": "e393124e3ceabd3e9a54a72ea0ff0196a7f34bdbbe4d05388b5c5551eb791472"
			},
			"es:/services": {
				"bytes": 689,
				"sha256": "0ee9f60a7cd9cc5b782038921c88b053a7b024a70ab906a058f0f05539d6dea8"
			},
			"en:/projects": {
				"bytes": 665,
				"sha256": "5670056cfb3ee922ff580dc6843354dad7764ad2baf48c473033b75f7e601852"
			},
			"fr:/projects": {
				"bytes": 693,
				"sha256": "e6a2c19634af65fb9d310773974abcf8715c95eaa49fe8cdecb369ad1fddd016"
			},
			"es:/projects": {
				"bytes": 689,
				"sha256": "4c5e24597bd52c38b188c6d0c85bae480866801561e8dd68ad4b6add005a61bc"
			},
			"en:/blog": {
				"bytes": 645,
				"sha256": "548e1b3c5451e8f85830bf382019c73062f8bb4c2d27bf481e622f5a2eac5e2e"
			},
			"fr:/blog": {
				"bytes": 673,
				"sha256": "0454964227ad3ea12512f9818e0d4f4e453602d09bb7d65e3707b7644ee5cbd1"
			},
			"es:/blog": {
				"bytes": 669,
				"sha256": "c154223d6967e7a2ea1e334abe62254acf87961bb0bd8b3db8d966410e667c44"
			},
			"en:/blog/personal": {
				"bytes": 791,
				"sha256": "15412c22043a852dfee9cf1659f2280fe0642e05d81263f76372239279271291"
			},
			"fr:/blog/personal": {
				"bytes": 822,
				"sha256": "0ca331fa20658582e04327679984d2ff1544797ca6cd0242e7e3404bca14891a"
			},
			"es:/blog/personal": {
				"bytes": 818,
				"sha256": "5b3e1b976cad39970241720992da0daee4b8ad449c58ea01492aa742c8bb846b"
			}
		});
	});

	it('locks canonical and JSON-LD bytes for every dynamic route and locale', async () => {
		const actual: Record<string, ReturnType<typeof fingerprint>> = {};

		for (const locale of LOCALES) {
			const common = { locale, siteMeta, siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS };
			actual[`${locale}:/services/[id]`] = seoFingerprint(
				await servicesIdSeoFactory({
					...common,
					params: { id: service.id },
					adapter: {
						services: { byId: async () => service },
					} as unknown as ContentAdapter,
				}),
			);
			actual[`${locale}:/projects/[slug]`] = seoFingerprint(
				await projectsSlugSeoFactory({
					...common,
					params: { slug: project.slug },
					adapter: {
						projects: { bySlug: async () => project },
					} as unknown as ContentAdapter,
				}),
			);
			const post = blogPosts.find((candidate) => candidate.lang === locale)!;
			actual[`${locale}:/blog/[slug]`] = seoFingerprint(
				await blogSlugSeoFactory({
					...common,
					params: { slug: post.slug },
					adapter: {
						blog: {
							all: async () => blogPosts,
							bySlug: async () => post,
						},
					} as unknown as ContentAdapter,
				}),
			);
			actual[`${locale}:/legal/[slug]`] = seoFingerprint(
				await legalSlugSeoFactory({
					...common,
					params: { slug: legalPage.slug },
					adapter: {
						legal: { bySlug: async () => legalPage },
					} as unknown as ContentAdapter,
				}),
			);
		}

		expect(actual).toEqual({
			"en:/services/[id]": {
				"bytes": 814,
				"sha256": "6f8a987a219ba8e4de336ebdc84e8cad4f419c55d1051067436fa15d6d1bea68"
			},
			"en:/projects/[slug]": {
				"bytes": 806,
				"sha256": "063b8158a5db7c58b6c9e3ba277bef902f9f98097f8bdcdc1d002279c04b72a8"
			},
			"en:/blog/[slug]": {
				"bytes": 920,
				"sha256": "a1c377eb9adcc5d4c122771fb45b2dadd893e8217fbde527913c38644a555754"
			},
			"en:/legal/[slug]": {
				"bytes": 343,
				"sha256": "0a0c2ad3b03cec676f294096c37d0f9ca9cf0492a16313475dbce1335851f932"
			},
			"fr:/services/[id]": {
				"bytes": 853,
				"sha256": "903b83b8e125ef79fb66a321540c995a418b6e29f754fd4029199bf697b85631"
			},
			"fr:/projects/[slug]": {
				"bytes": 866,
				"sha256": "974d528de22efa6a4cfd3a325d51895b98b06d64b776ab1c3956a426ca97a543"
			},
			"fr:/blog/[slug]": {
				"bytes": 927,
				"sha256": "ecc2f4539d37602cf1be959530ceee400962ac76fa504e2d51f3113d2d9579d0"
			},
			"fr:/legal/[slug]": {
				"bytes": 369,
				"sha256": "401d4b1034b86587d968347c8652342013cd96906e627fb5e0fd0c98d0c63889"
			},
			"es:/services/[id]": {
				"bytes": 842,
				"sha256": "d33f5fd6eb1a10173b476018237f6ee6eeae3edc06544809c43147fc259fb0a0"
			},
			"es:/projects/[slug]": {
				"bytes": 863,
				"sha256": "14f2421d22ea2d03a04f0169cd9e4ea5f0ed1bc1a2eef4616c6f0ea808dd9a4c"
			},
			"es:/blog/[slug]": {
				"bytes": 948,
				"sha256": "c0c954340dd32f745a28d50f6f34c79c4801cf28ac59badbb205ce6d84e74125"
			},
			"es:/legal/[slug]": {
				"bytes": 361,
				"sha256": "bdcbb08db2c9ca6557142bb9db08a1e82d8c4f38f19acc2ceae4be34db88b842"
			}
		});
	});

	it('gives static and dynamic factories one neutral route JSON-LD dependency', () => {
		const defaultsSource = readFileSync(new URL('./route-seo-defaults.ts', import.meta.url), 'utf8');
		const factoriesSource = readFileSync(new URL('./route-seo-factories.ts', import.meta.url), 'utf8');

		expect(defaultsSource).not.toContain("from '$lib/adapters/route-seo-factories'");
		expect(defaultsSource).toContain("from '$lib/adapters/route-jsonld'");
		expect(factoriesSource).toContain("from '$lib/adapters/route-jsonld'");
		expect(defaultsSource.match(/buildBreadcrumbListNode\(/g) ?? []).toHaveLength(0);
		expect(factoriesSource.match(/buildBreadcrumbListNode\(/g) ?? []).toHaveLength(0);
	});
});
