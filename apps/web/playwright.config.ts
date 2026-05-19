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

export default defineConfig({
	webServer: {
		command: 'bun run build && bun run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	testDir: 'tests',
	testMatch: '**/*.spec.ts',
	projects: [
		{ name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
		{
			name: 'iphone-12',
			use: { ...devices['iPhone 12'], defaultBrowserType: 'chromium' }
		},
		{ name: 'pixel-7', use: { ...devices['Pixel 7'] } },
		{
			name: 'ipad-mini',
			use: { ...devices['iPad Mini'], defaultBrowserType: 'chromium' }
		}
	]
});
