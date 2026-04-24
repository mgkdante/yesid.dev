import type { SiteMeta, PageSeo, Locale } from '$lib/types';
import { SITE_HOST } from '$lib/utils/seo-defaults';
import {
	buildPersonNode,
	buildWebSiteNode,
	buildProfilePageNode,
	buildBreadcrumbListNode,
	buildCollectionPageNode,
	buildBlogPostingNode,
	buildServiceNode,
	buildCreativeWorkNode,
} from '$lib/adapters/jsonld';

// Single source of truth for site-level metadata consumed by layouts and SEO.
// name is never localised — "yesid." is the brand name in all languages.
// The dot is always orange; that's a CSS concern, not a data concern.
export const siteMeta: SiteMeta = {
	name: 'yesid.',
	tagline: {
		// French and Spanish taglines to be added once copy is signed off
		en: 'Digital infrastructure that moves.'
	},
	description: {
		// Used for <meta name="description"> — keep under 160 characters for SEO
		en: 'Freelance SQL developer and digital infrastructure consultant based in Montreal. PostgreSQL, dbt, Power BI, and Python.'
	},
	links: {
		email: 'contact@yesid.dev',
		github: 'https://github.com/mgkdante',
		linkedin: 'https://www.linkedin.com/in/otaloray/',
		upwork: 'https://www.upwork.com/freelancers/~011ba4ec420b4cdd82'
	},
	owner: {
		name: 'Yesid O.',
		jobTitle: {
			en: 'Digital Infrastructure Consultant',
			fr: 'Consultant en infrastructure numérique',
			es: 'Consultor de infraestructura digital'
		},
		address: {
			locality: 'Montreal',
			region: 'QC',
			country: 'CA'
		},
		knowsAbout: [
			'PostgreSQL', 'dbt', 'Power BI', 'Python',
			'Digital Infrastructure', 'ETL', 'Data Warehousing',
			'SvelteKit', 'TypeScript'
		]
	}
};

// Per-route SEO metadata. Keyed by SvelteKit route id (event.route.id).
// Dynamic routes use the file-system pattern (e.g., '/blog/[slug]') and the
// adapter resolves per-slug SEO from the blog/projects/services adapters.
//
// Static routes land here as fully-specified entries. Dynamic routes land as
// FACTORIES — functions that receive params and return a PageSeo.
// This keeps the whole site's SEO surface visible in one file at a glance.

type StaticSeo = Omit<PageSeo, 'canonical'> & { canonical: string };
type DynamicSeoFactory = (params: Record<string, string>, locale: Locale) => Promise<PageSeo>;

// Reusable fallback description when a data-layer field is missing or too short
// for SEO's 50–200 char band. Site-wide, non-specific by design.
const FALLBACK_DESCRIPTION = {
	en: 'yesid. — freelance data infrastructure consultant in Montreal. PostgreSQL, dbt, Power BI, Python. Real-time pipelines, analytics, dashboards for growing teams.',
};

// If a LocalizedString description falls outside the SEO band, substitute
// the fallback. Keeps the Zod contract honest without forcing copy rewrites.
function fitDescriptionForSeo(desc: { en: string; fr?: string; es?: string } | undefined) {
	if (!desc) return FALLBACK_DESCRIPTION;
	const len = desc.en.length;
	if (len < 50 || len > 200) return FALLBACK_DESCRIPTION;
	return desc;
}

export const routeSeoEntries: Record<string, StaticSeo | DynamicSeoFactory> = {
	'/': {
		title: { en: 'yesid. — Digital Infrastructure that Moves.' },
		description: {
			en: 'Freelance SQL developer and digital infrastructure consultant in Montreal. PostgreSQL, dbt, Power BI, and Python. Real-time pipelines, analytics, dashboards.',
		},
		canonical: SITE_HOST,
		ogType: 'website',
		noIndex: false,
		jsonLd: [
			buildPersonNode(siteMeta),
			buildWebSiteNode(siteMeta),
			buildProfilePageNode(SITE_HOST),
		],
	},
	'/about': {
		title: { en: 'About Yesid | yesid.' },
		description: {
			en: 'Montreal-based digital infrastructure consultant. Background in SQL, data warehousing, and real-time analytics. Available for freelance and consulting work.',
		},
		canonical: `${SITE_HOST}/about`,
		ogType: 'profile',
		noIndex: false,
		jsonLd: [
			buildPersonNode(siteMeta),
			buildProfilePageNode(`${SITE_HOST}/about`),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'About', url: `${SITE_HOST}/about` },
				],
				`${SITE_HOST}/about`,
			),
		],
	},
	'/contact': {
		title: { en: 'Contact | yesid.' },
		description: {
			en: 'Get in touch for freelance SQL, PostgreSQL, dbt, Power BI, or data infrastructure work. Based in Montreal; available across Canada and for remote engagements.',
		},
		canonical: `${SITE_HOST}/contact`,
		ogType: 'website',
		noIndex: false,
		jsonLd: [
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Contact', url: `${SITE_HOST}/contact` },
				],
				`${SITE_HOST}/contact`,
			),
		],
	},
	'/services': {
		title: { en: 'Services | yesid.' },
		description: {
			en: 'Digital infrastructure services: SQL and PostgreSQL consulting, dbt pipelines, Power BI analytics, Python ETL, and real-time data platforms for growing teams.',
		},
		canonical: `${SITE_HOST}/services`,
		ogType: 'website',
		noIndex: false,
		jsonLd: [
			buildCollectionPageNode({
				name: 'Services',
				description:
					'Digital infrastructure services: SQL and PostgreSQL consulting, dbt pipelines, Power BI analytics, Python ETL, and real-time data platforms.',
				url: `${SITE_HOST}/services`,
			}),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Services', url: `${SITE_HOST}/services` },
				],
				`${SITE_HOST}/services`,
			),
		],
	},
	'/services/[id]': async (params, locale) => {
		const { adapter } = await import('$lib/adapters');
		const service = await adapter.services.byId(params.id);
		if (!service) throw new Error(`Unknown service id: ${params.id}`);
		const canonicalUrl = `${SITE_HOST}/services/${service.id}`;
		return {
			title: { en: `${service.title.en} | yesid.` },
			description: fitDescriptionForSeo(service.description),
			canonical: canonicalUrl,
			ogType: 'article',
			noIndex: false,
			jsonLd: [
				buildServiceNode(service, locale),
				buildBreadcrumbListNode(
					[
						{ name: 'Home', url: SITE_HOST },
						{ name: 'Services', url: `${SITE_HOST}/services` },
						{ name: service.title.en, url: canonicalUrl },
					],
					canonicalUrl,
				),
			],
		};
	},
	'/projects': {
		title: { en: 'Projects | yesid.' },
		description: {
			en: 'Recent freelance and client work: real-time transit pipelines, analytics platforms, dashboards, ETL, and infrastructure projects for teams in Montreal and Canada.',
		},
		canonical: `${SITE_HOST}/projects`,
		ogType: 'website',
		noIndex: false,
		jsonLd: [
			buildCollectionPageNode({
				name: 'Projects',
				description:
					'Recent freelance and client work: transit pipelines, analytics platforms, dashboards, ETL, and infrastructure projects.',
				url: `${SITE_HOST}/projects`,
			}),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Projects', url: `${SITE_HOST}/projects` },
				],
				`${SITE_HOST}/projects`,
			),
		],
	},
	'/projects/[slug]': async (params, locale) => {
		const { adapter } = await import('$lib/adapters');
		const project = await adapter.projects.bySlug(params.slug);
		if (!project) throw new Error(`Unknown project slug: ${params.slug}`);
		// Prefer description (fuller); fall back to oneLiner, then site fallback.
		const desc =
			fitDescriptionForSeo(project.description) !== FALLBACK_DESCRIPTION
				? project.description
				: fitDescriptionForSeo(project.oneLiner);
		const canonicalUrl = `${SITE_HOST}/projects/${project.slug}`;
		return {
			title: { en: `${project.title.en} | yesid.` },
			description: desc,
			canonical: canonicalUrl,
			ogType: 'article',
			noIndex: false,
			jsonLd: [
				buildCreativeWorkNode(project, locale),
				buildBreadcrumbListNode(
					[
						{ name: 'Home', url: SITE_HOST },
						{ name: 'Projects', url: `${SITE_HOST}/projects` },
						{ name: project.title.en, url: canonicalUrl },
					],
					canonicalUrl,
				),
			],
		};
	},
	'/blog': {
		title: { en: 'Blog | yesid.' },
		description: {
			en: 'Notes on data infrastructure, SQL, PostgreSQL, dbt, Power BI, and building analytics systems for growing teams. Montreal-based freelance consultant.',
		},
		canonical: `${SITE_HOST}/blog`,
		ogType: 'website',
		noIndex: false,
		jsonLd: [
			buildCollectionPageNode({
				name: 'Blog',
				description:
					'Notes on data infrastructure, SQL, PostgreSQL, dbt, Power BI, and analytics systems.',
				url: `${SITE_HOST}/blog`,
			}),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Blog', url: `${SITE_HOST}/blog` },
				],
				`${SITE_HOST}/blog`,
			),
		],
	},
	'/blog/personal': {
		title: { en: 'Personal Blog | yesid.' },
		description: {
			en: 'Off-work notes: tools, reading, experiments, and side projects. Longer-form than the professional blog, still fundamentally about building things well.',
		},
		canonical: `${SITE_HOST}/blog/personal`,
		ogType: 'website',
		noIndex: false,
		jsonLd: [
			buildCollectionPageNode({
				name: 'Personal Blog',
				description:
					'Off-work notes: tools, reading, experiments, and side projects. Longer-form than the professional blog.',
				url: `${SITE_HOST}/blog/personal`,
			}),
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Blog', url: `${SITE_HOST}/blog` },
					{ name: 'Personal', url: `${SITE_HOST}/blog/personal` },
				],
				`${SITE_HOST}/blog/personal`,
			),
		],
	},
	'/blog/[slug]': async (params, locale) => {
		const { adapter } = await import('$lib/adapters');
		const post = await adapter.blog.bySlug(params.slug);
		if (!post) throw new Error(`Unknown blog slug: ${params.slug}`);
		const canonicalUrl = `${SITE_HOST}/blog/${post.slug}`;
		return {
			title: { en: `${post.title.en} | yesid.` },
			description: fitDescriptionForSeo(post.excerpt),
			canonical: canonicalUrl,
			ogType: 'article',
			noIndex: false,
			jsonLd: [
				buildBlogPostingNode(post, locale),
				buildBreadcrumbListNode(
					[
						{ name: 'Home', url: SITE_HOST },
						{ name: 'Blog', url: `${SITE_HOST}/blog` },
						{ name: post.title.en, url: canonicalUrl },
					],
					canonicalUrl,
				),
			],
		};
	},
	'/tech-stack': {
		title: { en: 'Tech Stack | yesid.' },
		description: {
			en: 'The tools, languages, and platforms yesid. works with daily: PostgreSQL, dbt, Power BI, Python, SvelteKit, TypeScript, and the glue that holds them together.',
		},
		canonical: `${SITE_HOST}/tech-stack`,
		ogType: 'website',
		noIndex: false,
		jsonLd: [
			buildBreadcrumbListNode(
				[
					{ name: 'Home', url: SITE_HOST },
					{ name: 'Tech Stack', url: `${SITE_HOST}/tech-stack` },
				],
				`${SITE_HOST}/tech-stack`,
			),
		],
	},
	'/__error': {
		title: { en: 'Not Found | yesid.' },
		description: {
			en: 'This page does not exist. Head back to yesid.dev to find data infrastructure projects, blog posts, and freelance services from a Montreal-based consultant.',
		},
		canonical: SITE_HOST,
		ogType: 'website',
		noIndex: true,
		// No jsonLd — route is noIndex, no point in structured data.
	},
};
