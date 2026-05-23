// morphShapeFactory — test data for MorphShape.
//
// Mirrors MorphShapeSchema in $lib/schemas/morph-shape.

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { MorphShape } from '$lib/types';

export const morphShapeFactory = new Factory<MorphShape>(() => ({
	id: faker.lorem.slug(),
	label: faker.lorem.words(2),
	path: 'M 10 10 L 20 20 Z',
	viewbox: '0 0 100 100',
	sort: faker.number.int({ min: 1, max: 100 }),
}));
