import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import JsonLd from './JsonLd.svelte';
import type { SchemaOrgNode } from '$lib/schemas/seo';

const PERSON_NODE: SchemaOrgNode = {
	'@type': 'Person',
	'@id': 'https://yesid.dev/#person',
	name: 'Yesid O.',
	jobTitle: 'Digital Infrastructure Consultant',
	image: 'https://yesid.dev/images/about/headshot.webp',
	url: 'https://yesid.dev',
	email: 'contact@yesid.dev',
	sameAs: ['https://github.com/mgkdante'],
	knowsAbout: ['PostgreSQL'],
	knowsLanguage: ['en', 'fr', 'es'],
	address: {
		'@type': 'PostalAddress',
		addressLocality: 'Montreal',
		addressRegion: 'QC',
		addressCountry: 'CA',
	},
};

const BREADCRUMB_NODE: SchemaOrgNode = {
	'@type': 'BreadcrumbList',
	'@id': 'https://yesid.dev/about#breadcrumb',
	itemListElement: [
		{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://yesid.dev' },
		{ '@type': 'ListItem', position: 2, name: 'About', item: 'https://yesid.dev/about' },
	],
};

function scriptTags(): HTMLScriptElement[] {
	return Array.from(
		document.head.querySelectorAll('script[type="application/ld+json"]'),
	) as HTMLScriptElement[];
}

describe('JsonLd.svelte', () => {
	afterEach(() => {
		// Clean <script> tags between tests — Svelte writes to document.head
		// and vitest doesn't reset head between renders.
		document.head.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove());
	});

	it('emits zero <script> tags when nodes is empty', () => {
		render(JsonLd, { props: { nodes: [] } });
		expect(scriptTags()).toHaveLength(0);
	});

	it('emits exactly one <script type="application/ld+json"> when nodes non-empty', () => {
		render(JsonLd, { props: { nodes: [PERSON_NODE, BREADCRUMB_NODE] } });
		expect(scriptTags()).toHaveLength(1);
	});

	it('wraps nodes in @graph with @context', () => {
		render(JsonLd, { props: { nodes: [PERSON_NODE] } });
		const parsed = JSON.parse(scriptTags()[0].textContent!);
		expect(parsed['@context']).toBe('https://schema.org');
		expect(parsed['@graph']).toHaveLength(1);
		expect(parsed['@graph'][0]['@type']).toBe('Person');
	});

	it('round-trip parses every node unchanged', () => {
		render(JsonLd, { props: { nodes: [PERSON_NODE, BREADCRUMB_NODE] } });
		const parsed = JSON.parse(scriptTags()[0].textContent!);
		expect(parsed['@graph']).toEqual([PERSON_NODE, BREADCRUMB_NODE]);
	});

	it('escapes < inside field values (XSS regression guard)', () => {
		const tricky: SchemaOrgNode = {
			...PERSON_NODE,
			name: 'Yesid </script><script>alert(1)</script>',
		};
		render(JsonLd, { props: { nodes: [tricky] } });
		const content = scriptTags()[0].textContent!;
		// Raw `<` should never appear in the script body; escaped form required
		expect(content).not.toMatch(/<\/script>/i);
		expect(content).toContain('\\u003c');
		// JSON still parses cleanly
		expect(() => JSON.parse(content)).not.toThrow();
	});
});
