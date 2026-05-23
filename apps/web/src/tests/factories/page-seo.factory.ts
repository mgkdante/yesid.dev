// pageSeoFactory — test data for PageSeo.
//
// Mirrors PageSeoSchema in $lib/schemas/seo. title has a refinement
// (≤70 chars per locale); description has a refinement (50–200 chars per
// locale). Defaults sized to satisfy both refinements. jsonLd is optional
// and omitted — pass via overrides if a test exercises structured data.

import { Factory } from 'interface-forge';
import { faker } from '@faker-js/faker';
import type { PageSeo } from '$lib/schemas/seo';

// 60-ish char description per locale: faker.lorem.paragraph(1) returns
// ~50-80 chars depending on word lengths. We pad with a stable suffix to
// ensure the lower bound (50) is always met.
function description(): { en: string; fr: string; es: string } {
	const pad = (s: string) => (s.length >= 50 ? s : s + ' '.repeat(50 - s.length) + 'pad.').slice(0, 200);
	return {
		en: pad(faker.lorem.sentence({ min: 8, max: 14 })),
		fr: pad(faker.lorem.sentence({ min: 8, max: 14 })),
		es: pad(faker.lorem.sentence({ min: 8, max: 14 })),
	};
}

function title(): { en: string; fr: string; es: string } {
	const t = (n: number) => faker.lorem.sentence({ min: 3, max: 6 }).slice(0, n);
	return { en: t(60), fr: t(60), es: t(60) };
}

export const pageSeoFactory = new Factory<PageSeo>(() => ({
	title: title(),
	description: description(),
	canonical: faker.internet.url(),
	ogType: 'website',
	noIndex: false,
}));
