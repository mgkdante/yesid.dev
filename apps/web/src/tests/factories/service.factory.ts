// serviceFactory — test data for Service.
//
// Mirrors ServiceSchema in $lib/schemas/service. Only required fields are
// populated by default; optional detail-page fields (subtitle, longDescription,
// sections, etc.) are omitted — pass overrides if a test needs them.

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { Service } from '$lib/types';

const localizedString = () => ({
	en: faker.lorem.words(3),
	fr: faker.lorem.words(3),
	es: faker.lorem.words(3),
});

export const serviceFactory = new Factory<Service>(() => ({
	id: faker.string.alphanumeric(8),
	title: localizedString(),
	description: localizedString(),
	station: faker.number.int({ min: 1, max: 10 }),
	relatedProjects: [],
}));
