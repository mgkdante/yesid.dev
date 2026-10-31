// errorPageFactory — test data for ErrorPageContent.
//
// Mirrors ErrorPageContentSchema in $lib/schemas/nav. `suggestions` is a
// readonly array — `as const` preserves the tuple/readonly marker so the
// drift detector compiles.

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { ErrorPageContent } from '#lib/navigation/types.ts';

const localizedString = () => ({
	en: faker.lorem.sentence(),
	fr: faker.lorem.sentence(),
	es: faker.lorem.sentence(),
});

export const errorPageFactory = new Factory<ErrorPageContent>(() => ({
	label: localizedString(),
	heading: localizedString(),
	description: localizedString(),
	suggestions: [
		{ label: localizedString(), href: '/' },
		{ label: localizedString(), href: '/work' },
	] as const,
}));
