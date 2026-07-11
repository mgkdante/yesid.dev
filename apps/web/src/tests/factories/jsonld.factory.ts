// jsonldFactory — test data for SchemaOrgNode (Person variant).
//
// Mirrors PersonSchema from $lib/schemas/jsonld. SchemaOrgNodeSchema is a
// discriminated union over multiple `@type` variants; we hand-roll a Person
// node as the default since that's the most common one. Add per-variant
// factories (websiteFactory, blogPostingFactory, etc.) only when tests need
// them — YAGNI.

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { z } from 'zod';
import type { PersonSchema } from '$lib/schemas/jsonld';

type Person = z.infer<typeof PersonSchema>;

export const jsonldFactory = new Factory<Person>(() => ({
	'@type': 'Person' as const,
	'@id': faker.internet.url() + '#person',
	name: faker.person.fullName(),
	jobTitle: faker.person.jobTitle(),
	image: faker.image.url(),
	url: faker.internet.url(),
	sameAs: [faker.internet.url(), faker.internet.url()],
	knowsAbout: ['TypeScript', 'SvelteKit', 'SQL'],
	knowsLanguage: ['en', 'fr', 'es'],
	address: {
		'@type': 'PostalAddress' as const,
		addressLocality: faker.location.city(),
		addressRegion: faker.location.state(),
		addressCountry: faker.location.country(),
	},
}));
