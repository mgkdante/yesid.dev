// directus-sync CLI config. See: https://github.com/tractr/directus-sync
//
// Usage:
//   cd apps/cms
//   export DIRECTUS_ADMIN_TOKEN=$(op read op://yesid-dev/cms-admin/token)
//   bun run sync:diff       # preview changes (local ↔ remote)
//   bun run sync:pull       # overwrite local with remote state
//   bun run sync:push       # overwrite remote with local state (prod — gated)
//
// dumpPath is relative to this config file (apps/cms/). Files land at
// apps/cms/directus/**/*.json per 18c plan target layout (D3 amendment).

/** @type {import('directus-sync').Config} */
export default {
	// Connection. CLI's own env parsing reads DIRECTUS_URL + DIRECTUS_TOKEN;
	// we also accept DIRECTUS_ADMIN_TOKEN as an alias so seed scripts + sync
	// CLI share one token env across ops.
	directusUrl: process.env.DIRECTUS_URL || 'https://cms.yesid.dev',
	directusToken:
		process.env.DIRECTUS_ADMIN_TOKEN || process.env.DIRECTUS_TOKEN,

	// Dump layout
	dumpPath: './directus',
	collectionsPath: 'collections',
	snapshotPath: 'snapshot',
	specsPath: 'specs',

	// Features — all enabled; directus-sync tracks schema + roles +
	// permissions + policies + flows + operations + settings + translations
	// + presets + panels + dashboards by default. We leave webhooks off
	// (deprecated in favor of flows per Directus 11).
	flows: { enabled: true, path: 'flows' },
	operations: { enabled: true, path: 'operations' },
	permissions: { enabled: true, path: 'permissions' },
	presets: { enabled: true, path: 'presets' },
	panels: { enabled: true, path: 'panels' },
	dashboards: { enabled: true, path: 'dashboards' },
	policies: { enabled: true, path: 'policies' },
	roles: { enabled: true, path: 'roles' },
	settings: { enabled: true, path: 'settings' },
	translations: { enabled: true, path: 'translations' },
	webhooks: { enabled: false },

	// Less noise on CI; enable locally via DEBUG=1 bun run sync:pull.
	debug: Boolean(process.env.DEBUG),
};
