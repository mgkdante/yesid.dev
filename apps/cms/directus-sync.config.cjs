// directus-sync CLI config. See: https://github.com/tractr/directus-sync
//
// Why .cjs (not .js)?  apps/cms/package.json declares "type": "module", which
// makes .js files ESM. directus-sync's loader doesn't unwrap `.default` from
// ESM imports — an ESM config resolves with all fields as undefined. .cjs
// forces CommonJS regardless of package.json type (verified 2026-04-24
// against directus-sync@3.5.1).
//
// Usage:
//   cd apps/cms
//   $env:DIRECTUS_ADMIN_TOKEN = "<token>"            # PowerShell
//   export DIRECTUS_ADMIN_TOKEN="<token>"            # bash
//   bun run sync:diff                                # preview changes
//   bun run sync:pull                                # overwrite local with remote
//   bun run sync:push                                # overwrite remote with local (prod — gated)
//
// dumpPath is relative to this config file (apps/cms/). Files land at
// apps/cms/directus/**/*.json per 18c plan target layout (D3 amendment).

/** @type {import('directus-sync').Config} */
module.exports = {
	// Connection. The CLI's native env parsing reads DIRECTUS_URL +
	// DIRECTUS_TOKEN; we also accept DIRECTUS_ADMIN_TOKEN as an alias so
	// seed scripts + sync CLI share one token env.
	directusUrl: process.env.DIRECTUS_URL || 'https://cms.yesid.dev',
	directusToken:
		process.env.DIRECTUS_ADMIN_TOKEN || process.env.DIRECTUS_TOKEN,
	// directus-sync@3 requires email/password in its Zod schema alongside
	// token. Both are accepted: token takes precedence at runtime, email+
	// password are the fallback the CLI actually uses for auth.
	directusEmail: process.env.DIRECTUS_ADMIN_EMAIL,
	directusPassword: process.env.DIRECTUS_ADMIN_PASSWORD,

	// Dump layout
	dumpPath: './directus',
	collectionsPath: 'collections',
	snapshotPath: 'snapshot',
	specsPath: 'specs',

	// Features — all enabled; directus-sync tracks schema + roles +
	// permissions + policies + flows + operations + settings + translations
	// + presets + panels + dashboards by default. Webhooks disabled
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

	// Less noise on CI; enable locally via DEBUG=1.
	debug: Boolean(process.env.DEBUG),
};
