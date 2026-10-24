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
				"bytes": 1660,
				"sha256": "78e0019893f168c5a0952d20111a402977ef73166192d00899f51608c8935d6f"
			},
			"fr:/": {
				"bytes": 1677,
				"sha256": "5e8c314f4d4fa2bd48ee138d74eb9e0a678f4ab99b1352d4d2213f2ddcf27cdb"
			},
			"es:/": {
				"bytes": 1676,
				"sha256": "4e21ade1b1ae8c0fd20ea81f73b10eb60f45fc2941b87d1c70bb38d327604645"
			},
			"en:/about": {
				"bytes": 1067,
				"sha256": "21332c5c509fb33d9ce07fbbafd9793cd78f9f05d5f0be033fab2946442b73c8"
			},
			"fr:/about": {
				"bytes": 1093,
				"sha256": "0cd0ebda5ea5ba24752559198a47c393d14c33237c4bbaabaf37e601bfe24a77"
			},
			"es:/about": {
				"bytes": 1092,
				"sha256": "da1addcf7fb11f26486188876e44bee2ebd89f7181c61269cda273c5ddaccf36"
			},
			"en:/contact": {
				"bytes": 320,
				"sha256": "396ee2f8fde3b14a22ffba11e96f03b4ef9fa3040b61e423e2e3f7f4955b1858"
			},
			"fr:/contact": {
				"bytes": 332,
				"sha256": "aebcd8325ebc63cb0e865b9f8c7c96dab9ec3353e71d427ff2dce02164fb0363"
			},
			"es:/contact": {
				"bytes": 332,
				"sha256": "2da527e1d773ed37c9483acc3706fc3dfb1ce863a8c34b22a9c2c1522d68abc5"
			},
			"en:/services": {
				"bytes": 629,
				"sha256": "931a1e8e5dfba51ff1f202d1981f4060030325c24ce65d9b8779dab3b75e6d8b"
			},
			"fr:/services": {
				"bytes": 657,
				"sha256": "c23d5ea97eaf3a9878e76e2b32e8c7e5186e59d91194a62380d032b56b3761f7"
			},
			"es:/services": {
				"bytes": 653,
				"sha256": "64e1e05fc252d228f7ec357ca0daa4d44da3e42adad75357b36e3c2b591d2ed3"
			},
			"en:/projects": {
				"bytes": 629,
				"sha256": "73325a23ec8ac955c157a60909844291d8c0ee85ddde6ce83751788f1ff63c4b"
			},
			"fr:/projects": {
				"bytes": 657,
				"sha256": "1a06435a6be272515ea9f4e1279df1470bd3e10dab3d2b8d9fe000531bbd36d2"
			},
			"es:/projects": {
				"bytes": 653,
				"sha256": "8cf0d8a6da5799649585cede946b9438a291bbfc791d8c58e350176255771bc9"
			},
			"en:/blog": {
				"bytes": 609,
				"sha256": "0b08a38e40447a558dc0c5b6804efba413665b35ed611d79df7e5a2b999f26de"
			},
			"fr:/blog": {
				"bytes": 637,
				"sha256": "868b7f8008df389bcd4fa0589ef3cee753450c7a6e31bd5f85179dd1f6034842"
			},
			"es:/blog": {
				"bytes": 633,
				"sha256": "84ddc55ef77d3b9e1a4f48327c475b962b9433d14ef423f4c6714a9bf6362ba3"
			},
			"en:/blog/personal": {
				"bytes": 743,
				"sha256": "9f04852fdd9cdd90de544317e268fec6acc2e4643552039aca81206226cf7b55"
			},
			"fr:/blog/personal": {
				"bytes": 774,
				"sha256": "9608bddab4aca03350df09a34664baf91bde85ade24988ef76d997c094bd89fd"
			},
			"es:/blog/personal": {
				"bytes": 770,
				"sha256": "7b8f5423920991fd677e0c997ba1a56ba7342962b011c18dd1a6b0d52450f959"
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
				"bytes": 790,
				"sha256": "349f26b0d24ee088ccc1e39961826faf282d2ac3b439bd12241ce9119aac95f2"
			},
			"en:/projects/[slug]": {
				"bytes": 782,
				"sha256": "c6a609fbe133ffa8c5bfdebccb77a0d96f16106df1343f24f0b7bfeeafe275aa"
			},
			"en:/blog/[slug]": {
				"bytes": 896,
				"sha256": "f445d80139359bad5ac15b04ee59924618346e51aa1d1f1e08d1cb83fc80bc60"
			},
			"en:/legal/[slug]": {
				"bytes": 331,
				"sha256": "d1c2e07cfdc5400f8af6625fd3d1ee4cfcc5784e165fcbb68f71d4408a27028b"
			},
			"fr:/services/[id]": {
				"bytes": 829,
				"sha256": "9f34ec38a3264f13695e763f225628ce23550ae91ec759df9246951fcdd9f868"
			},
			"fr:/projects/[slug]": {
				"bytes": 842,
				"sha256": "3199ad264abae3b2bfe901b93933686dd22dba5bad49f2430a17a956625eeb94"
			},
			"fr:/blog/[slug]": {
				"bytes": 903,
				"sha256": "ef92ba78a5108353a83395e48294d06655cb5d045c6e7891b1caad9519bcddbf"
			},
			"fr:/legal/[slug]": {
				"bytes": 357,
				"sha256": "cd996fce07157236c1980eb6606e315c2b5993e687328e1ac05c74c1a3f218f8"
			},
			"es:/services/[id]": {
				"bytes": 818,
				"sha256": "a9117ed35b77f1401947bb0f4448fd71e526e679b7e94b80455ed9b907c91acc"
			},
			"es:/projects/[slug]": {
				"bytes": 839,
				"sha256": "3308ae1a1c13caddb7f4811dfbd473c9a785e6c0bd33fcc8254c8d307c46509b"
			},
			"es:/blog/[slug]": {
				"bytes": 924,
				"sha256": "05a3d57ec4ad3b675bf2f1a056794a7389ea4dcde817dff938d75728a4812752"
			},
			"es:/legal/[slug]": {
				"bytes": 349,
				"sha256": "93fc99f77507d1c61c80a0fb52033f07293997210f70490292e1118afdbc69c6"
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
