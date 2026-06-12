// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Site-wide brand identity (name, tagline, description, links, owner).
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { SiteMeta } from '$lib/types';

export const siteMeta: SiteMeta = {
	description: {
		en: 'Freelance digital infrastructure engineer in Montreal. Databases, pipelines, dashboards, and the websites they power — PostgreSQL, dbt, Power BI, SvelteKit.',
	},
	links: {
		email: 'contact@yesid.dev',
		github: 'https://github.com/mgkdante',
		linkedin: 'https://www.linkedin.com/in/otaloray/',
		upwork: 'https://www.upwork.com/freelancers/~011ba4ec420b4cdd82',
	},
	name: 'yesid.',
	owner: {
		address: { country: 'CA', locality: 'Montreal', region: 'QC' },
		jobTitle: {
			en: 'Freelance Digital Infrastructure Engineer',
			es: 'Ingeniero independiente en infraestructura digital',
			fr: 'Ingénieur indépendant en infrastructure numérique',
		},
		knowsAbout: [
			'PostgreSQL',
			'dbt',
			'Power BI',
			'Python',
			'Digital Infrastructure',
			'ETL',
			'Data Warehousing',
			'SvelteKit',
			'TypeScript',
		],
		name: 'Yesid O.',
	},
	tagline: { en: 'Digital infrastructure that moves.' },
};
