// Static fallback for SiteSeoDefaults — used by the static adapter and as
// the last-resort fallback in `+layout.ts` when the CMS singleton is
// unreachable or wiped. Mirrors the canonical values seeded into the live
// `site_meta` row by `apps/cms/scripts/seed-site-meta.ts`.

import type { SiteSeoDefaults } from '$lib/types';

export const STATIC_SITE_SEO_DEFAULTS: SiteSeoDefaults = {
	defaultOgImage: null,
	themeColor: '#141414',
	defaultDescription: {
		en: 'yesid. — freelance data infrastructure consultant in Montreal. PostgreSQL, dbt, Power BI, Python. Real-time pipelines, analytics, dashboards for growing teams.',
	},
};
