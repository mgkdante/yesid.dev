import { describe, it, expect } from 'vitest';
import { buildPersonSchema } from './json-ld.js';
import { siteMeta } from '$lib/content/meta';

describe('buildPersonSchema', () => {
	const schema = buildPersonSchema(siteMeta);
	const parsed = JSON.parse(schema);

	it('produces valid JSON', () => {
		expect(() => JSON.parse(schema)).not.toThrow();
	});

	it('sets @context to schema.org', () => {
		expect(parsed['@context']).toBe('https://schema.org');
	});

	it('sets @type to Person', () => {
		expect(parsed['@type']).toBe('Person');
	});

	it('includes owner name', () => {
		expect(parsed.name).toBe('Yesid O.');
	});

	it('includes jobTitle from English locale', () => {
		expect(parsed.jobTitle).toBe('Digital Infrastructure Consultant');
	});

	it('includes url', () => {
		expect(parsed.url).toBe('https://yesid.dev');
	});

	it('includes address with locality, region, country', () => {
		expect(parsed.address).toEqual({
			'@type': 'PostalAddress',
			addressLocality: 'Montreal',
			addressRegion: 'QC',
			addressCountry: 'CA'
		});
	});

	it('includes sameAs array with social links', () => {
		expect(parsed.sameAs).toContain('https://github.com/mgkdante');
		expect(parsed.sameAs).toContain('https://www.linkedin.com/in/otaloray/');
	});

	it('includes knowsAbout array', () => {
		expect(parsed.knowsAbout).toContain('PostgreSQL');
		expect(parsed.knowsAbout).toContain('dbt');
	});

	it('includes email', () => {
		expect(parsed.email).toBe('contact@yesid.dev');
	});
});
