// navLinkFactory — test data for NavLink.
//
// Mirrors NavLinkSchema in $lib/schemas/nav. priority is a 1 | 2 union;
// defaults to 1 (primary nav). subtitle/icon are optional and omitted.

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { NavLink } from '$lib/content/nav';

const localizedString = () => ({
	en: faker.lorem.word(),
	fr: faker.lorem.word(),
	es: faker.lorem.word(),
});

export const navLinkFactory = new Factory<NavLink>(() => ({
	label: localizedString(),
	href: '/' + faker.lorem.slug(),
	priority: 1 as const,
}));
