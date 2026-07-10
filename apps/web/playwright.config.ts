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

// Specs that run ONLY on desktop-chrome — excluded from the phone matrix.
// Two reasons, both: (a) viewport-INDEPENDENT assertions (status codes, meta
// tags, sitemap XML, canonical/hreflang, theme tokens, form-validation copy)
// gain nothing from re-running on three phones — verify once; (b) they assert a
// DESKTOP composition (the service hero's `.svg-desktop` panel, the project/blog
// `.toc-column`, the projects filter sidebar, the stack-engine shape grid) that
// is display:none / restructured below 768px. Mobile UX has its own coverage
// under tests/mobile/. (Pattern set by i18n-routing; extended for the slice-30
// e2e expansion — the page-content/, contact-form, theme, filter and locale
// specs were authored + validated against the desktop composition.)
const DESKTOP_ONLY_SPECS = [
	// console-scan = viewport-independent console.error/pageerror scan; weather-scenes
	// = API->scene mapping + fallback logic whose screenshot rig is desktop-only by
	// design. Both run identical assertions on all 4 projects, so pin to desktop-chrome.
	'**/audits/console-scan.spec.ts',
	'**/weather-scenes.spec.ts',
	'**/audits/light-mode.spec.ts',
	'**/stack-engine.spec.ts',
	'**/i18n-routing.spec.ts',
	'**/i18n-language-toggle.spec.ts',
	'**/state-across-languages.spec.ts',
	'**/state-lang-engine.spec.ts',
	'**/state-lang-scroll.spec.ts',
	'**/state-lang-layout.spec.ts',
	'**/hero-intro-reload.spec.ts',
	// Replay mechanics (scroll-pinned GSAP completion + day-key write) are tested
	// once on desktop-chrome — the same as hero-intro-reload. The mobile profiles
	// add an iPad-Mini scroll-geometry edge case (the intro completion does not
	// register from an instant scrollTo under DPR 2) without proportional value.
	'**/hero-intro-replay.spec.ts',
	'**/i18n-sitemap-coverage.spec.ts',
	'**/locale-coverage-fr.spec.ts',
	'**/analytics.spec.ts',
	'**/interactive-filters.spec.ts',
	'**/contact-form-submission.spec.ts',
	'**/contact-form-validation.spec.ts',
	// Fold containment asserts the >=1024px viewport equation (100dvh main,
	// footer below the fold, terminal-body internal scroll) — desktop-only.
	'**/contact-fold.spec.ts',
	'**/theme-persistence.spec.ts',
	'**/page-content/**'
];

// Specs that need only ONE phone profile, not all three. A single touch-target /
// responsive-geometry / overflow check, or a viewport-agnostic smoke, gains nothing
// from re-running on iphone-12 AND pixel-7 AND ipad-mini. Keep them on iphone-12
// (+ desktop-chrome where they assert it) and drop them off the two extra phones.
const ONE_PHONE_SPECS = [
	'**/smoke.spec.ts',
	'**/mobile/services.spec.ts',
	'**/mobile/services-detail.spec.ts',
	'**/mobile/home.spec.ts',
	'**/home-cards.spec.ts',
	'**/pages.spec.ts',
	// Phone-layout fit guard — meaningless above 768px and redundant at 412px,
	// so it rides the single-phone set: runs on iphone-12 + the iphone-se /
	// galaxy-s23 profiles, skipped on pixel-7 / ipad-mini.
	'**/mobile/small-device-fit.spec.ts'
];

export default defineConfig({
	// Parallelism pays off ONLY against an external, horizontally-scalable surface
	// (the deployed Vercel preview via PLAYWRIGHT_BASE_URL): each worker hits the
	// CDN/edge independently and the suite is I/O-bound (every nav is a network
	// round-trip), so fan out HARD. Playwright's default (≈ cores/2 → only ~2 on a
	// GitHub runner) leaves it running nearly serially against remote latency —
	// that's the difference between a ~3-min and a ~13-min e2e job. Default to 8,
	// overridable via PLAYWRIGHT_WORKERS. Against the single local hermetic preview
	// server, by contrast, many workers CONTEND and run SLOWER (measured 188s vs
	// 150s, worst on the screenshot-heavy weather specs) — so keep the hermetic CI
	// path lean at 1 worker.
	fullyParallel: Boolean(externalBaseURL),
	workers: externalBaseURL
		? Number(process.env.PLAYWRIGHT_WORKERS ?? 8)
		: process.env.CI
			? 1
			: undefined,
	// Retry in CI only. The suite runs SERIALLY (workers:1) against the single
	// local hermetic preview and CI runners are slower than local dev, so a few
	// GSAP/scroll-timing assertions occasionally tip past their wait window.
	// Retries absorb that transient variance without masking real failures (a
	// genuine break fails all attempts); flaky-on-retry tests surface in the report.
	retries: process.env.CI ? 2 : 0,
	// Headroom for the slower, serial CI runner so timing-sensitive specs do not
	// flake on the clock. This is headroom, NOT masking: a real hang still fails,
	// and fails all retries.
	timeout: process.env.CI ? 45_000 : 30_000,
	expect: { timeout: process.env.CI ? 10_000 : 5_000 },
	use: {
		baseURL: externalBaseURL ?? 'http://localhost:4173',
		// Vercel preview deployments sit behind Deployment Protection (the SSO 401
		// wall), so every request must carry the Protection Bypass for Automation
		// secret or the suite only ever sees the login page. extraHTTPHeaders apply
		// to ALL context requests (navigations, assets, client fetches); the cookie
		// hint keeps the bypass sticky across redirects. Only sent when targeting an
		// external URL with the secret present — local hermetic runs are unaffected.
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
					// E2E_PREBUILT skips the build and only previews — CI builds once
					// via `turbo run build` (cache-eligible / remote-cache shared) so the
					// webServer does not rebuild what the ci job already built. Locally
					// (no flag) it builds + previews for one-command convenience.
					command: process.env.E2E_PREBUILT
						? 'bun run preview'
						: 'bun run build && bun run preview',
					port: 4173,
					reuseExistingServer: !process.env.CI,
					// CI cold-build (vite build + check:sitemap) can exceed the
					// default 60s before the preview answers on :4173.
					timeout: 180_000,
					// Hermetic build: skip the export-fallbacks prebuild so the local
					// e2e build NEVER contacts the live CMS (the committed content
					// modules already ARE the content source). This both honors the
					// "CMS only at build time, never live" contract and keeps the
					// local-preview e2e path fully offline — zero edge requests.
					env: { EXPORT_FALLBACKS_SKIP: '1' }
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
			testIgnore: DESKTOP_ONLY_SPECS
		},
		{
			name: 'pixel-7',
			use: { ...devices['Pixel 7'] },
			// Also drop the ONE_PHONE_SPECS — iphone-12 already covers that single phone case.
			testIgnore: [...DESKTOP_ONLY_SPECS, ...ONE_PHONE_SPECS]
		},
		{
			name: 'ipad-mini',
			use: { ...devices['iPad Mini'], defaultBrowserType: 'chromium' },
			testIgnore: [...DESKTOP_ONLY_SPECS, ...ONE_PHONE_SPECS]
		},
		// Small-device band (Galaxy S23 360x780, iPhone SE 375x667). The phone
		// matrix above starts at iPhone 12 (390px), so the 360-375px band where
		// narrow/short layouts actually break was untested — that gap let the
		// nav-clearance / hero-clip / terminus-crush regressions ship. These two
		// profiles run ONLY the tests/mobile specs (the layout-sensitive ones,
		// incl. small-device-fit) so they cover the dead zone without re-running
		// the viewport-agnostic suites a third time.
		{
			name: 'iphone-se',
			use: {
				viewport: { width: 375, height: 667 },
				deviceScaleFactor: 2,
				isMobile: true,
				hasTouch: true,
				defaultBrowserType: 'chromium'
			},
			testMatch: '**/mobile/**/*.spec.ts'
		},
		{
			name: 'galaxy-s23',
			use: {
				viewport: { width: 360, height: 780 },
				deviceScaleFactor: 3,
				isMobile: true,
				hasTouch: true,
				defaultBrowserType: 'chromium'
			},
			testMatch: '**/mobile/**/*.spec.ts'
		}
	]
});
