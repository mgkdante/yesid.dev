import { defineConfig, devices } from '@playwright/test';

// slice-19 Phase 1 Task 1: mobile device matrix for permanent mobile UX coverage.
//
// Browser-engine note: Playwright's iPhone 12 / iPad Mini descriptors default to
// WebKit. WebKit on Linux requires system libraries that aren't available in this
// repo's sandbox (and CI) without sudo (libevent-2.1-7t64, libgstreamer-plugins-
// bad1.0-0, libflite1, libavif16, libwoff1, gstreamer1.0-libav). We override the
// iOS profiles to run their viewport / userAgent / isMobile / hasTouch / DPR
// shape under Chromium — which is the mobile-shape surface area we actually care
// about for this audit (visual layout, hover semantics, touch targets). If a
// future task needs real WebKit (e.g. for Safari-specific bugs), gate it
// behind a separate project that runs only where webkit deps are installed.

// slice-16 verify pass: PLAYWRIGHT_BASE_URL points the suite at an external
// URL (e.g. https://dev.yesid.dev). When set, we skip the local webServer
// spawn — there's nothing to build because the deployed surface is the target.
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
	// Parallelism pays off ONLY against an external, horizontally-scalable surface
	// (the deployed Vercel preview via PLAYWRIGHT_BASE_URL): then each worker hits
	// the CDN/edge independently. Against the single local hermetic preview server
	// fullyParallel + many workers CONTEND and run SLOWER (measured 188s vs 150s,
	// worst on the screenshot-heavy weather specs) — so keep the hermetic path
	// lean (1 worker in CI), and crank parallelism only when external.
	fullyParallel: Boolean(externalBaseURL),
	workers: externalBaseURL ? undefined : process.env.CI ? 1 : undefined,
	use: { baseURL: externalBaseURL ?? 'http://localhost:4173' },
	...(externalBaseURL
		? {}
		: {
				webServer: {
					command: 'bun run build && bun run preview',
					port: 4173,
					reuseExistingServer: !process.env.CI,
					// CI cold-build (vite build + check:sitemap) can exceed the
					// default 60s before the preview answers on :4173.
					timeout: 180_000
				}
			}),
	testDir: 'tests',
	testMatch: '**/*.spec.ts',
	// Desktop-layout audits assert a desktop composition (e.g. the service hero's
	// `.svg-desktop` panel is display:none below 768px; the stack-engine shape
	// grid is a desktop arrangement). They are meaningless on the phone matrix —
	// run them on desktop-chrome only. Mobile UX has its own coverage under
	// tests/mobile/, and the viewport-agnostic specs (smoke, pages, console-scan,
	// reduced-motion, …) still run everywhere.
	projects: [
		{ name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
		{
			name: 'iphone-12',
			use: { ...devices['iPhone 12'], defaultBrowserType: 'chromium' },
			testIgnore: [
				'**/audits/light-mode.spec.ts',
				'**/stack-engine.spec.ts',
				// Routing/SEO assertions (status codes, meta tags) are viewport-
				// independent — run once on desktop-chrome, not the phone matrix.
				'**/i18n-routing.spec.ts'
			]
		},
		{
			name: 'pixel-7',
			use: { ...devices['Pixel 7'] },
			testIgnore: [
				'**/audits/light-mode.spec.ts',
				'**/stack-engine.spec.ts',
				// Routing/SEO assertions (status codes, meta tags) are viewport-
				// independent — run once on desktop-chrome, not the phone matrix.
				'**/i18n-routing.spec.ts'
			]
		},
		{
			name: 'ipad-mini',
			use: { ...devices['iPad Mini'], defaultBrowserType: 'chromium' },
			testIgnore: [
				'**/audits/light-mode.spec.ts',
				'**/stack-engine.spec.ts',
				// Routing/SEO assertions (status codes, meta tags) are viewport-
				// independent — run once on desktop-chrome, not the phone matrix.
				'**/i18n-routing.spec.ts'
			]
		}
	]
});
