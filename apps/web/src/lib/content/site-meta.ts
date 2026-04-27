// Brand identity static fixture (slice-18 18h Q2 amendment 2026-04-27).
//
// Extracted from apps/web/src/lib/content/meta.ts as part of the migration to
// the CMS-backed `site_meta` singleton. The directus adapter is the canonical
// runtime source; this const survives ONLY as:
//   1. A test fixture / fallback for the static adapter mode (used in
//      apps/web/src/tests/setup.data.ts mocks).
//   2. A reference for the brand identity values seeded into the singleton.
//
// 18k will retire the static adapter and delete this file.

import type { SiteMeta } from '$lib/types';

export const siteMeta: SiteMeta = {
	name: 'yesid.',
	tagline: {
		// French and Spanish taglines to be added once copy is signed off
		en: 'Digital infrastructure that moves.'
	},
	description: {
		// Used for <meta name="description"> — keep under 160 characters for SEO
		en: 'Freelance SQL developer and digital infrastructure consultant based in Montreal. PostgreSQL, dbt, Power BI, and Python.'
	},
	links: {
		email: 'contact@yesid.dev',
		github: 'https://github.com/mgkdante',
		linkedin: 'https://www.linkedin.com/in/otaloray/',
		upwork: 'https://www.upwork.com/freelancers/~011ba4ec420b4cdd82'
	},
	owner: {
		name: 'Yesid O.',
		jobTitle: {
			en: 'Digital Infrastructure Consultant',
			fr: 'Consultant en infrastructure numérique',
			es: 'Consultor de infraestructura digital'
		},
		address: {
			locality: 'Montreal',
			region: 'QC',
			country: 'CA'
		},
		knowsAbout: [
			'PostgreSQL', 'dbt', 'Power BI', 'Python',
			'Digital Infrastructure', 'ETL', 'Data Warehousing',
			'SvelteKit', 'TypeScript'
		]
	}
};
