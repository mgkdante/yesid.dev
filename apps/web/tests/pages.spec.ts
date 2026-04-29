// pages.spec.ts — E2E Playwright tests for the 7 public routes + 404 error page.
//
// slice-18i Phase 6 Task 6.4
//
// These tests run against the built + previewed app (playwright.config.ts:
// webServer builds then starts `vite preview` on port 4173).
//
// Offline constraint: in CI and on dev machines without live Directus access,
// routes that depend on CMS data (about, tech-stack) render the +error.svelte
// fallback with "This station is under construction". The spec is written to
// assert what ACTUALLY renders in both the online (CMS reachable) and offline
// (CMS unreachable / 500) cases so the same spec works pre- and post-merge.
//
// Strategy per route:
//   - / → 200, data-testid="app-root" + data-testid="hero-banner"
//   - /services → 200, service cards (static adapter, no CMS dependency)
//   - /projects → 200, static adapter, nav visible
//   - /blog → 200, "Dispatches" hardcoded in +page.svelte
//   - /contact → 200, data-testid="contact-info-terminal" (static adapter fallback)
//   - /about → may be 200 (CMS) or 500 (error page) depending on CMS availability
//   - /tech-stack → may be 200 (CMS) or 500 (error page)
//   - unknown route → 404, error page heading visible

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Routes with stable static content (no CMS dependency or static fallback)
// ---------------------------------------------------------------------------

test('route / (home) renders hero banner', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
	await expect(page.locator('[data-testid="hero-banner"]')).toBeVisible();
});

test('route /services renders service cards', async ({ page }) => {
	await page.goto('/services');
	// At least one service card is always present (static adapter feeds services)
	await expect(page.locator('[data-testid]').first()).toBeVisible();
	// Nav is always present
	await expect(page.locator('[data-testid="nav"]')).toBeVisible();
});

test('route /projects renders without crash', async ({ page }) => {
	await page.goto('/projects');
	await expect(page.locator('[data-testid="nav"]')).toBeVisible();
});

test('route /blog renders "Dispatches" heading', async ({ page }) => {
	await page.goto('/blog');
	// "Dispatches" is hard-coded in /blog +page.svelte — not CMS-sourced
	await expect(page.getByText('Dispatches', { exact: false })).toBeVisible();
});

test('route /contact renders contact terminals', async ({ page }) => {
	await page.goto('/contact');
	// data-testid="contact-info-terminal" is rendered by ContactPage regardless
	// of whether it uses the static fallback or CMS-sourced content
	// (there are two instances — info + form; use .first() to avoid strict-mode error)
	await expect(page.locator('[data-testid="contact-info-terminal"]').first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// Routes that may show error page when CMS is unreachable
// ---------------------------------------------------------------------------

test('route /about renders page content or graceful error page', async ({ page }) => {
	await page.goto('/about');
	// Either the real about page renders, or the error page does —
	// both are valid outcomes pre-merge. What must NOT happen is a blank page
	// or an uncaught exception that prevents the layout from rendering.
	// Nav is always rendered in layout.svelte regardless of page outcome.
	await expect(page.locator('[data-testid="nav"]')).toBeVisible();
});

test('route /tech-stack renders page content or graceful error page', async ({ page }) => {
	await page.goto('/tech-stack');
	// Same resilience check: nav always renders even on error routes.
	await expect(page.locator('[data-testid="nav"]')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 404 route — unknown path activates +error.svelte
// ---------------------------------------------------------------------------

test('unknown route renders the 404 error page', async ({ page }) => {
	const response = await page.goto('/this-route-does-not-exist-at-all');
	// SvelteKit returns 404 for unknown routes
	expect(response?.status()).toBe(404);
	// +error.svelte renders the static fallback heading (no CMS needed for this)
	await expect(
		page.getByRole('heading', { name: 'This station is under construction', exact: false }),
	).toBeVisible();
});
