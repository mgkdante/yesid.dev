// siteMetaFactory — test data for SiteMeta.
//
// Mirrors SiteMetaSchema in $lib/schemas/meta. SiteMeta nests SiteLinks
// (email/github/linkedin/upwork), SiteAddress, and SiteOwner. knowsAbout
// is readonly — `as const` preserves the marker.

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { SiteMeta } from '$lib/types';

const localizedString = () => ({
	en: faker.lorem.sentence(),
	fr: faker.lorem.sentence(),
	es: faker.lorem.sentence(),
});

export const siteMetaFactory = new Factory<SiteMeta>(() => ({
	name: faker.person.fullName(),
	tagline: localizedString(),
	description: localizedString(),
	links: {
		email: faker.internet.email(),
		github: 'https://github.com/' + faker.internet.username(),
	},
	owner: {
		name: faker.person.fullName(),
		jobTitle: localizedString(),
		address: {
			locality: faker.location.city(),
			region: faker.location.state(),
			country: faker.location.country(),
		},
		knowsAbout: ['TypeScript', 'SvelteKit', 'SQL'] as const,
	},
}));
