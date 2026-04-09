import type { SiteMeta } from './types.js';

/**
 * Builds a JSON-LD Person schema string from site metadata.
 * Output goes into a <script type="application/ld+json"> tag.
 */
export function buildPersonSchema(meta: SiteMeta): string {
	const sameAs: string[] = [];
	if (meta.links.github) sameAs.push(meta.links.github);
	if (meta.links.linkedin) sameAs.push(meta.links.linkedin);
	if (meta.links.upwork) sameAs.push(meta.links.upwork);

	return JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: meta.owner.name,
		jobTitle: meta.owner.jobTitle.en,
		url: 'https://yesid.dev',
		address: {
			'@type': 'PostalAddress',
			addressLocality: meta.owner.address.locality,
			addressRegion: meta.owner.address.region,
			addressCountry: meta.owner.address.country
		},
		sameAs,
		knowsAbout: [...meta.owner.knowsAbout],
		email: meta.links.email
	});
}
