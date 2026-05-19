// siteSeoDefaultsFactory — test data for SiteSeoDefaults.
//
// Mirrors SiteSeoDefaultsSchema in $lib/schemas/site-seo-defaults.
// themeColor must match /^#[0-9a-fA-F]{6}$/ — hand-roll a 6-char hex.

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { SiteSeoDefaults } from '$lib/types';

const localizedString = () => ({
	en: faker.lorem.sentence(),
	fr: faker.lorem.sentence(),
	es: faker.lorem.sentence(),
});

export const siteSeoDefaultsFactory = new Factory<SiteSeoDefaults>(() => ({
	defaultOgImage: faker.string.uuid(),
	themeColor: '#' + faker.string.hexadecimal({ length: 6, prefix: '', casing: 'lower' }),
	defaultDescription: localizedString(),
}));
