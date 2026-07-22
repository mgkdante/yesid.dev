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
	'/tech-stack',
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
			'en:/': { bytes: 1972, sha256: 'd5b78ad6f606b4bb7653bf96effbc8309b015a01fe9d8f97cbf706a93796afc6' },
			'fr:/': { bytes: 2021, sha256: 'd51605eeb1a95d8c8fd43b7e160d1ab6ed4e2a28ca38446af826d2e1a8790788' },
			'es:/': { bytes: 1990, sha256: 'df9bcc22c50a662b4a1d6dc718be432cd287174b9fa1e58d320f752099f9e966' },
			'en:/about': { bytes: 1050, sha256: '9ddcc965a733870f1117f85201a717331ec92461fc68436941fbfe70f48a70ab' },
			'fr:/about': { bytes: 1083, sha256: 'ba593b6790d451407bc72182aa10b15d46df6a432f400079388d49dcdfd1363e' },
			'es:/about': { bytes: 1081, sha256: 'a3f3757c0bda2c6b190879a9a52ece9ab5d79f708eabb647c41f5cf15d7d3d39' },
			'en:/contact': { bytes: 305, sha256: '7ea24a7a80be512cb882174050831feeeed6f660ce0a0945e14df1af7c607057' },
			'fr:/contact': { bytes: 320, sha256: '2d8bb14348614f59710bb59144af132962770d7f9f5f93fd22544b13fe939627' },
			'es:/contact': { bytes: 320, sha256: '7b5a348bf560455b9d928034491dfb9f1e1e2ca74d11dc7636637373a8a16aa3' },
			'en:/services': { bytes: 610, sha256: 'fa57b094e4283a4eac538dbc4137c7bb8f53811bdf0999ac2fc51d9ffc9f0620' },
			'fr:/services': { bytes: 641, sha256: '24acd1233b6096d282800f8aa1f319f4d20639997bf9c98d1fdbf72dd0dbd847' },
			'es:/services': { bytes: 638, sha256: 'ead8779ddd313c8b5d14273690a85edf01b5ced7c8eab6d54391cba9884d2400' },
			'en:/projects': { bytes: 610, sha256: 'b90314a5ed51618fe41ea6520821d20a3fb5ddb962fbe65c1a47e9346563d669' },
			'fr:/projects': { bytes: 639, sha256: 'b1e65cb437d327bbe41e9b325c5dc5222c0ada4797c4ed8029a46b72ff6e091c' },
			'es:/projects': { bytes: 638, sha256: '6e1692603913140d0caf3382379341e6c373cee3bac72a61c407cb7d5ddb9a3d' },
			'en:/blog': { bytes: 582, sha256: 'baf39ed9f371660e11419fbf82180e12d2c58f0e0d395616bd302b741169e33b' },
			'fr:/blog': { bytes: 613, sha256: '740f3c6e0cbddae33b0bc952ab8468efb16596feacb27875eda3992ee89723a3' },
			'es:/blog': { bytes: 608, sha256: 'b0e07d61ea0348bf677f523881d226dce3fac2fa1aa57b4f14cd5fde35957a06' },
			'en:/blog/personal': { bytes: 729, sha256: '136894e58ea4807c415c0870a8192f390581d94460748b3c868636ae589a81a4' },
			'fr:/blog/personal': { bytes: 753, sha256: 'ab5d4120c7dcbd423cacf1e895221af2ca4e3f707d3ec5c922014b63d85d8166' },
			'es:/blog/personal': { bytes: 760, sha256: 'b3e1a3cdb302a98fc9bbb3998e9d919c978cc5e2334e575ec18eeaf2e0bc6b8b' },
			'en:/tech-stack': { bytes: 317, sha256: 'cb6735fc1520f656dd27e31d8fa9b428bdd9f3646b4f971d61b5ee937820bc46' },
			'fr:/tech-stack': { bytes: 337, sha256: '51e61e07000e2e5a964f66de616a3923bb37333d9b43a4dc1d7696f0c13aab00' },
			'es:/tech-stack': { bytes: 339, sha256: '3814a2d824750d6f5d3d446169a973123ff7bc25dbed9ca2794b6fb31e60b890' },
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
			'en:/services/[id]': { bytes: 776, sha256: '058dd521ad5ba038d0022e3d3f04113906ff911bc80eb06f2231d2bb81f42e1a' },
			'en:/projects/[slug]': { bytes: 768, sha256: '8a0103c05e3d8019d52999875ec518b9023d86095c51e0a47b0bb754af167a69' },
			'en:/blog/[slug]': { bytes: 878, sha256: '5eac3bd9ec3ebaac63ee4f77981dac4fd5a675b0b67585825751e652975d6e4d' },
			'en:/legal/[slug]': { bytes: 322, sha256: '84ad8722d08f48317664d038fc43be7e76aaf3770696daa6c56ec9d05a26d9d8' },
			'fr:/services/[id]': { bytes: 818, sha256: 'cf1e44fe89537a673fe623e9f0b0dc9b914aec45e332b3d14a5d26e8baabc692' },
			'fr:/projects/[slug]': { bytes: 830, sha256: '9544848aadf9e7b75837d8846b481e0bbfa879ba5c5b03d24a7f27056c953062' },
			'fr:/blog/[slug]': { bytes: 888, sha256: '410c94ede62b8d30c090bbe7573fecc3ee638a99c5d53108e812cb57ced35f84' },
			'fr:/legal/[slug]': { bytes: 351, sha256: '1c1c8076a216289d8d55c0073f348d6ca35d41fa06b0f730a45869a8b02ea4c6' },
			'es:/services/[id]': { bytes: 807, sha256: '383a3cc2eaa1fa3e11f1f8cf2e534969107d29617f5c3276d56328d474a27dc9' },
			'es:/projects/[slug]': { bytes: 828, sha256: 'c50151697fc50f4745f5b232256b0e647c82e2db01e7f625e0e6b0c2c6663873' },
			'es:/blog/[slug]': { bytes: 908, sha256: '3756e3c5f014ea06bdcd253c90c819fc86b7d8e6fca4077f0def715a0d055bf6' },
			'es:/legal/[slug]': { bytes: 342, sha256: '1c9a17cab3842a6e1bebe1f3b76f3aa6813c1532f581f12ede6216e93bcc8504' },
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
