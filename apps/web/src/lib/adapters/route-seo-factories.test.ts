import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ContentAdapter } from './types';
import { blogSlugSeoFactory } from './route-seo-factories';
import type { BlogPost, SiteMeta, SiteSeoDefaults } from '$lib/types';

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
		jobTitle: { en: 'Digital Infrastructure Engineer' },
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

function adapterFor(post: BlogPost): ContentAdapter {
	return {
		blog: {
			bySlug: async () => post,
		},
	} as unknown as ContentAdapter;
}

describe('blogSlugSeoFactory', () => {
	it('uses CMS-backed post SEO fields for title, description, OG image, and JSON-LD', async () => {
		const seoDescription =
			'Why raw SQL can beat ORM abstractions for PostgreSQL work when control, performance, and readable query behavior matter.';
		const post = {
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

		const seo = await blogSlugSeoFactory({
			params: { slug: post.slug },
			locale: 'en',
			adapter: adapterFor(post),
			siteMeta,
			siteSeoDefaults,
		});

		expect(seo.title.en).toBe('Raw SQL for PostgreSQL Control | yesid.');
		expect(seo.description.en).toBe(seoDescription);
		expect(seo.canonical).toBe('https://yesid.dev/blog/raw-sql-control');
		expect(seo.singleLocale).toBe(true);
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

		const seo = await blogSlugSeoFactory({
			params: { slug: post.slug },
			locale: 'en',
			adapter: adapterFor(post),
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
});
