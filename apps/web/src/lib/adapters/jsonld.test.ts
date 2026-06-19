import { describe, expect, it } from 'vitest';
import { siteMeta } from '$lib/content/site-meta';
import { adapter } from './index';
import {
	PERSON_ID,
	WEBSITE_ID,
	buildPersonNode,
	buildWebSiteNode,
	buildProfilePageNode,
	buildBreadcrumbListNode,
	buildCollectionPageNode,
	buildBlogPostingNode,
	buildServiceNode,
	buildCreativeWorkNode,
} from './jsonld';
import type { BlogPost } from '$lib/types';

describe('PERSON_ID / WEBSITE_ID constants', () => {
	it('PERSON_ID resolves against SITE_HOST with #person fragment', () => {
		expect(PERSON_ID).toBe('https://yesid.dev/#person');
	});

	it('WEBSITE_ID resolves against SITE_HOST with #website fragment', () => {
		expect(WEBSITE_ID).toBe('https://yesid.dev/#website');
	});
});

describe('buildPersonNode', () => {
	it('produces a Zod-parseable Person', () => {
		const node = buildPersonNode(siteMeta);
		expect(node['@type']).toBe('Person');
		expect(node['@id']).toBe(PERSON_ID);
	});

	it('maps owner.name verbatim', () => {
		const node = buildPersonNode(siteMeta);
		expect(node.name).toBe(siteMeta.owner.name);
	});

	it('resolves jobTitle from owner.jobTitle.en', () => {
		const node = buildPersonNode(siteMeta);
		expect(node.jobTitle).toBe(siteMeta.owner.jobTitle.en);
	});

	it('includes GitHub + LinkedIn in sameAs when present', () => {
		const node = buildPersonNode(siteMeta);
		expect(node.sameAs).toContain(siteMeta.links.github);
		expect(node.sameAs).toContain(siteMeta.links.linkedin);
	});

	it('maps owner.address to PostalAddress', () => {
		const node = buildPersonNode(siteMeta);
		expect(node.address).toEqual({
			'@type': 'PostalAddress',
			addressLocality: siteMeta.owner.address.locality,
			addressRegion: siteMeta.owner.address.region,
			addressCountry: siteMeta.owner.address.country,
		});
	});
});

describe('buildWebSiteNode', () => {
	it('produces a Zod-parseable WebSite', () => {
		const node = buildWebSiteNode(siteMeta);
		expect(node['@type']).toBe('WebSite');
		expect(node['@id']).toBe(WEBSITE_ID);
	});

	it('references Person via publisher @id', () => {
		const node = buildWebSiteNode(siteMeta);
		expect(node.publisher).toEqual({ '@id': PERSON_ID });
	});

	it('uses siteMeta.description.en as description', () => {
		const node = buildWebSiteNode(siteMeta);
		expect(node.description).toBe(siteMeta.description.en);
	});
});

describe('buildProfilePageNode', () => {
	it('produces a Zod-parseable ProfilePage', () => {
		const node = buildProfilePageNode('https://yesid.dev/about');
		expect(node['@type']).toBe('ProfilePage');
		expect(node['@id']).toBe('https://yesid.dev/about#profilepage');
	});

	it('references Person via mainEntity @id', () => {
		const node = buildProfilePageNode('https://yesid.dev/about');
		expect(node.mainEntity).toEqual({ '@id': PERSON_ID });
	});
});

describe('buildBreadcrumbListNode', () => {
	const items = [
		{ name: 'Home', url: 'https://yesid.dev' },
		{ name: 'Blog', url: 'https://yesid.dev/blog' },
		{ name: 'My Post', url: 'https://yesid.dev/blog/my-post' },
	];

	it('produces a Zod-parseable BreadcrumbList', () => {
		const node = buildBreadcrumbListNode(items, 'https://yesid.dev/blog/my-post');
		expect(node['@type']).toBe('BreadcrumbList');
		expect(node['@id']).toBe('https://yesid.dev/blog/my-post#breadcrumb');
	});

	it('emits items with sequential position starting at 1', () => {
		const node = buildBreadcrumbListNode(items, 'https://yesid.dev/blog/my-post');
		expect(node.itemListElement).toHaveLength(3);
		expect(node.itemListElement[0].position).toBe(1);
		expect(node.itemListElement[1].position).toBe(2);
		expect(node.itemListElement[2].position).toBe(3);
	});

	it('copies name + item from input', () => {
		const node = buildBreadcrumbListNode(items, 'https://yesid.dev/blog/my-post');
		expect(node.itemListElement[2].name).toBe('My Post');
		expect(node.itemListElement[2].item).toBe('https://yesid.dev/blog/my-post');
	});
});

describe('buildCollectionPageNode', () => {
	it('produces a Zod-parseable CollectionPage', () => {
		const node = buildCollectionPageNode({
			name: 'Blog',
			description: 'Notes on data infrastructure.',
			url: 'https://yesid.dev/blog',
		});
		expect(node['@type']).toBe('CollectionPage');
		expect(node['@id']).toBe('https://yesid.dev/blog#collectionpage');
		expect(node.name).toBe('Blog');
	});
});

describe('buildBlogPostingNode', () => {
	it('produces a Zod-parseable BlogPosting from a real post', async () => {
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const post = posts[0];
		const node = buildBlogPostingNode(post, 'en');
		expect(node['@type']).toBe('BlogPosting');
		expect(node['@id']).toBe(`https://yesid.dev/blog/${post.slug}`);
	});

	it('@id keys on post.lang, not the render locale (mono-language AM2.5)', () => {
		const enPost = {
			slug: 'raw-sql-control',
			title: 'Raw SQL Control',
			excerpt: 'Short listing excerpt.',
			date: '2026-04-14',
			lang: 'en',
			category: 'professional',
			tags: ['sql'],
			animation: 'draw',
			svg: 'pro-code',
			url: '/blog/raw-sql-control',
			external: false,
		} satisfies BlogPost;
		// An EN-language post rendered under /fr keeps its EN canonical @id.
		expect(buildBlogPostingNode(enPost, 'fr')['@id']).toBe('https://yesid.dev/blog/raw-sql-control');
		// An FR-language post gets the /fr canonical regardless of render locale.
		const frPost = { ...enPost, slug: 'controle-sql', lang: 'fr' } satisfies BlogPost;
		expect(buildBlogPostingNode(frPost, 'en')['@id']).toBe('https://yesid.dev/fr/blog/controle-sql');
	});

	it('copies inLanguage from post.lang', async () => {
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const post = posts[0];
		const node = buildBlogPostingNode(post, 'en');
		expect(node.inLanguage).toBe(post.lang);
	});

	it('references Person via author + publisher @ids (Q6-A: same @id)', async () => {
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const node = buildBlogPostingNode(posts[0], 'en');
		expect(node.author).toEqual({ '@id': PERSON_ID });
		expect(node.publisher).toEqual({ '@id': PERSON_ID });
	});

	it('uses post.date as datePublished', async () => {
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const post = posts[0];
		const node = buildBlogPostingNode(post, 'en');
		expect(node.datePublished).toBe(post.date);
	});

	it('uses CMS-backed SEO fields for BlogPosting description, keywords, modified date, and image', () => {
		const post = {
			slug: 'raw-sql-control',
			title: 'Raw SQL Control',
			excerpt: 'Short listing excerpt.',
			seoDescription:
				'Why raw SQL can beat ORM abstractions for PostgreSQL work when control, performance, and readable query behavior matter.',
			date: '2026-04-14',
			dateModified: '2026-04-20',
			lang: 'en',
			category: 'professional',
			tags: ['sql', 'postgresql'],
			animation: 'draw',
			svg: 'pro-code',
			url: '/blog/raw-sql-control',
			external: false,
		} satisfies BlogPost;

		const node = buildBlogPostingNode(post, 'en', {
			imageUrl: 'https://cms.example.com/assets/11111111-1111-4111-8111-111111111111?key=og-1200',
		});

		expect(node.description).toBe(post.seoDescription);
		expect(node.dateModified).toBe('2026-04-20');
		expect(node.keywords).toEqual(['sql', 'postgresql']);
		expect(node.image).toBe(
			'https://cms.example.com/assets/11111111-1111-4111-8111-111111111111?key=og-1200',
		);
	});
});

describe('buildServiceNode', () => {
	it('produces a Zod-parseable Service from a real service', async () => {
		const services = await adapter.services.visible();
		if (services.length === 0) return;
		const service = services[0];
		const node = buildServiceNode(service, 'en');
		expect(node['@type']).toBe('Service');
		expect(node['@id']).toBe(`https://yesid.dev/services/${service.id}`);
	});

	it('@id is locale-aware: an fr render uses the /fr canonical', async () => {
		const services = await adapter.services.visible();
		if (services.length === 0) return;
		const service = services[0];
		const node = buildServiceNode(service, 'fr');
		expect(node['@id']).toBe(`https://yesid.dev/fr/services/${service.id}`);
	});

	it('references Person via provider @id', async () => {
		const services = await adapter.services.visible();
		if (services.length === 0) return;
		const node = buildServiceNode(services[0], 'en');
		expect(node.provider).toEqual({ '@id': PERSON_ID });
	});

	it('does not emit availableLanguage (dropped to resolve validator.schema.org warning)', async () => {
		// Schema.org defines availableLanguage on ContactPoint / ServiceChannel /
		// Place — not directly on Service. Dropped during 15b Codex-review
		// iteration. When fr/es ship, locale info re-enters via a nested
		// ServiceChannel (Service.availableChannel → ServiceChannel.availableLanguage).
		const services = await adapter.services.visible();
		if (services.length === 0) return;
		const node = buildServiceNode(services[0], 'en');
		expect((node as Record<string, unknown>).availableLanguage).toBeUndefined();
	});
});

describe('buildCreativeWorkNode', () => {
	it('produces a Zod-parseable CreativeWork from a real project', async () => {
		const projects = await adapter.projects.public();
		if (projects.length === 0) return;
		const project = projects[0];
		const node = buildCreativeWorkNode(project, 'en');
		expect(node['@type']).toBe('CreativeWork');
		expect(node['@id']).toBe(`https://yesid.dev/projects/${project.slug}`);
	});

	it('@id is locale-aware: an fr render uses the /fr canonical', async () => {
		const projects = await adapter.projects.public();
		if (projects.length === 0) return;
		const project = projects[0];
		const node = buildCreativeWorkNode(project, 'fr');
		expect(node['@id']).toBe(`https://yesid.dev/fr/projects/${project.slug}`);
	});

	it('references Person via author + creator @ids', async () => {
		const projects = await adapter.projects.public();
		if (projects.length === 0) return;
		const node = buildCreativeWorkNode(projects[0], 'en');
		expect(node.author).toEqual({ '@id': PERSON_ID });
		expect(node.creator).toEqual({ '@id': PERSON_ID });
	});

	it('copies project.tags into keywords + project.stack into about', async () => {
		const projects = await adapter.projects.public();
		if (projects.length === 0) return;
		const project = projects[0];
		const node = buildCreativeWorkNode(project, 'en');
		expect(node.keywords).toEqual(project.tags);
		expect(node.about).toEqual(project.stack);
	});

	it('omits dates per Q5-A decision — Project has no date field', async () => {
		const projects = await adapter.projects.public();
		if (projects.length === 0) return;
		const node = buildCreativeWorkNode(projects[0], 'en');
		// CreativeWorkSchema doesn't declare datePublished; emitting one would
		// fail the Zod parse. Assert absence to guard against regression.
		expect((node as Record<string, unknown>).datePublished).toBeUndefined();
		expect((node as Record<string, unknown>).dateModified).toBeUndefined();
	});
});
