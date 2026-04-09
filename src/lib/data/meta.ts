import type { SiteMeta } from './types.js';

// Single source of truth for site-level metadata consumed by layouts and SEO.
// name is never localised — "yesid." is the brand name in all languages.
// The dot is always orange; that's a CSS concern, not a data concern.
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
