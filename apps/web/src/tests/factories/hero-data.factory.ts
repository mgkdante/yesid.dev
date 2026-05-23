// heroDataFactory — test data for HeroData.
//
// Mirrors HeroDataSchema in $lib/schemas/hero-data. HeroMetric.key is the
// `'vehicles' | 'delay' | 'routes'` enum.

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { HeroData } from '$lib/content/hero-data';

export const heroDataFactory = new Factory<HeroData>(() => ({
	metrics: [
		{ label: 'vehicles', value: 42, sub: 'live', key: 'vehicles' as const },
		{ label: 'avg delay', value: 12, unit: 's', sub: 'past 5m', key: 'delay' as const },
		{ label: 'routes', value: 23, sub: 'active', key: 'routes' as const },
	],
	queryRows: [
		{
			route: faker.helpers.arrayElement(['747', '15', '105']),
			avgDelayS: faker.number.float({ min: 0, max: 60 }),
			vehicles: faker.number.int({ min: 1, max: 10 }),
		},
	],
	queryTime: faker.number.int({ min: 5, max: 50 }),
}));
