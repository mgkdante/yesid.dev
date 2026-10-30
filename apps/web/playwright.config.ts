import { defineConfig } from '@playwright/test';
import { yesidProjects } from '@yesid/config/playwright';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Specs import ignored content modules during collection, before globalSetup or
// webServer runs. Emit them here so fresh local runs and --list work too.
if (process.env.TEST_WORKER_INDEX === undefined) {
	execFileSync('bun', ['run', '--cwd', fileURLToPath(new URL('../cms', import.meta.url)), 'export:fallbacks'], {
		env: { ...process.env, EXPORT_FALLBACKS_SOURCE: 'fixture' },
		stdio: 'inherit'
	});
}

// PLAYWRIGHT_BASE_URL runs the suite against a deployed preview instead of the local build.
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? 'http://localhost:4173';

// --shard splits tests by count in project order. Desktop and theme tests take several times longer than phone and
// tablet tests, so this order evens out the CI shards' run time. Unlisted projects run last.
const shardOrder = ['phone', 'reduced-motion', 'desktop', 'tablet', 'light', 'dark'];
const rank = ({ name = '' }: { name?: string }) => shardOrder.indexOf(name) + 1 || shardOrder.length + 1;

export default defineConfig({
	// A deployed preview scales out; one local preview server only slows down under parallel load.
	fullyParallel: Boolean(externalBaseURL),
	workers: externalBaseURL ? Number(process.env.PLAYWRIGHT_WORKERS ?? 8) : process.env.CI ? 1 : undefined,
	retries: 0,
	timeout: process.env.CI ? 45_000 : 30_000,
	expect: { timeout: process.env.CI ? 10_000 : 5_000 },
	use: {
		baseURL,
		// Vercel previews sit behind Deployment Protection; the bypass header gets the suite past it.
		...(externalBaseURL && process.env.VERCEL_AUTOMATION_BYPASS_SECRET
			? {
					extraHTTPHeaders: {
						'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
						'x-vercel-set-bypass-cookie': 'true'
					}
				}
			: {})
	},
	...(externalBaseURL
		? {}
		: {
				webServer: {
					// CI builds once through turbo, so E2E_PREBUILT only previews.
					command: process.env.E2E_PREBUILT ? 'bun run preview' : 'bun run build && bun run preview',
					port: 4173,
					reuseExistingServer: !process.env.CI,
					timeout: 180_000,
					env: { EXPORT_FALLBACKS_SOURCE: 'fixture', PUBLIC_PLAUSIBLE_DOMAIN: 'yesid.dev' }
				}
			}),
	testDir: 'tests',
	testMatch: '**/*.spec.ts',
	projects: yesidProjects(baseURL).sort((a, b) => rank(a) - rank(b))
});
