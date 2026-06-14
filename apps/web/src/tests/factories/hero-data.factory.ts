// heroDataFactory — test data for HeroData.
//
// Mirrors HeroDataSchema in $lib/schemas/hero-data. HeroMetric.key is the
// `'vehicles' | 'delay' | 'routes'` enum.

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { HeroData } from '$lib/content/hero-data';

export const heroDataFactory = new Factory<HeroData>(() => ({
	metrics: [
		{ value: 42, key: 'vehicles' as const },
		{ value: 12, unit: 's', key: 'delay' as const, coverage: 87.6 },
		{ value: 23, key: 'routes' as const, total: 203 },
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
