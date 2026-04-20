// JSON-LD factories. Each factory is a pure function mapping a domain object
// to a Zod-parsed SchemaOrgNode. Factories have no I/O, no adapter imports,
// and no runtime side effects. Every factory ends with
// `SchemaOrgNodeSchema.parse(built)` — malformed nodes never leave the module.
//
// PERSON_ID and WEBSITE_ID are the only globally-referenced @ids. Every other
// node's @id derives from its canonical URL + a hash fragment (e.g.,
// /about#breadcrumb, /blog/foo#post). Google's crawler resolves the reference
// once per indexing pass.
//
// Factories that take a locale apply `resolveLocale(localizedString, locale)`
// on their text fields — the produced node is already locale-resolved.

import { SchemaOrgNodeSchema } from '$lib/schemas/jsonld';
import type {
	Person,
	WebSite,
} from '$lib/schemas/jsonld';
import type { SiteMeta } from '$lib/types';
import { SITE_HOST } from '$lib/utils/seo-defaults';

export const PERSON_ID = `${SITE_HOST}/#person`;
export const WEBSITE_ID = `${SITE_HOST}/#website`;

export function buildPersonNode(meta: SiteMeta): Person {
	const sameAs: string[] = [];
	if (meta.links.github) sameAs.push(meta.links.github);
	if (meta.links.linkedin) sameAs.push(meta.links.linkedin);
	if (meta.links.upwork) sameAs.push(meta.links.upwork);

	const built = {
		'@type': 'Person' as const,
		'@id': PERSON_ID,
		name: meta.owner.name,
		jobTitle: meta.owner.jobTitle.en,
		url: SITE_HOST,
		email: meta.links.email,
		sameAs,
		knowsAbout: [...meta.owner.knowsAbout],
		address: {
			'@type': 'PostalAddress' as const,
			addressLocality: meta.owner.address.locality,
			addressRegion: meta.owner.address.region,
			addressCountry: meta.owner.address.country,
		},
	};

	return SchemaOrgNodeSchema.parse(built) as Person;
}

export function buildWebSiteNode(meta: SiteMeta): WebSite {
	const built = {
		'@type': 'WebSite' as const,
		'@id': WEBSITE_ID,
		name: meta.name,
		url: SITE_HOST,
		description: meta.description.en,
		publisher: { '@id': PERSON_ID },
	};

	return SchemaOrgNodeSchema.parse(built) as WebSite;
}
