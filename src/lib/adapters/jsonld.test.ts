import { describe, expect, it } from 'vitest';
import { siteMeta } from '$lib/content/meta';
import {
	PERSON_ID,
	WEBSITE_ID,
	buildPersonNode,
	buildWebSiteNode,
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
