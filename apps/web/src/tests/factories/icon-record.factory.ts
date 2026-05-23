// iconRecordFactory — test data for IconRecord.
//
// Mirrors IconRecordSchema in $lib/schemas/icon. iconify_id has a .transform()
// that warns + coerces to null if the value doesn't match
// /^[a-z][a-z0-9-]*:[a-z0-9-]+$/. Default produces a valid id so factories
// don't trigger the console.warn in test runs. svg_override is a UUID|null.

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';

// Local type alias matches z.infer<typeof IconRecordSchema> output shape.
// (IconRecord is also exported from @repo/shared but the local schema's
// transform produces this shape from runtime input — kept narrow here.)
export interface IconRecord {
	id: string;
	name: string;
	iconify_id: string | null;
	svg_override: string | null;
}

export const iconRecordFactory = new Factory<IconRecord>(() => ({
	id: faker.string.alphanumeric(8),
	name: faker.lorem.word(),
	iconify_id: 'lucide:' + faker.lorem.slug(1),
	svg_override: null,
}));
