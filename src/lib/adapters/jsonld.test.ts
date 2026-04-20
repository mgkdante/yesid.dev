import { describe, expect, it } from 'vitest';
import { siteMeta } from '$lib/content/meta';
import {
	PERSON_ID,
	WEBSITE_ID,
	buildPersonNode,
	buildWebSiteNode,
	buildProfilePageNode,
	buildBreadcrumbListNode,
	buildCollectionPageNode,
} from './jsonld';

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
