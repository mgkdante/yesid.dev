// pages.spec.ts — E2E Playwright tests for the 7 public routes + 404 error page.
//
// slice-18i Phase 6 Task 6.4 (updated in Phase 6 review fix-up)
//
// These tests run against the built + previewed app (playwright.config.ts:
// webServer builds then starts `vite preview` on port 4173).
//
// CMS_LIVE env gate:
//   Routes that require live Directus data (/about, /tech-stack) are skipped
//   when CMS_LIVE !== 'true'. Set CMS_LIVE=true in your environment to run the
//   full suite against a live CMS deployment.
//
//   Example:
//     CMS_LIVE=true bun run test:e2e
//
//   When CMS_LIVE is not set (default in CI and local dev without live Directus):
//   - The 5 non-CMS routes are asserted to return HTTP 200 + page-specific content.
//   - /about and /tech-stack are explicitly skipped (not tolerated as 500s).
//   - The 404 route is always asserted.
//
// Route strategy:
//   - /           → 200, data-testid="hero-banner" always; "PIPELINES THAT"
//                   CMS_LIVE=true only (home now fetches from Directus M2A)
//   - /services   → 200, nav visible (static adapter, no CMS dependency)
//   - /projects   → 200, nav visible (static adapter)
//   - /blog       → 200, "Dispatches" hardcoded in +page.svelte
//   - /blog/personal → 200, data-testid="blog-listing" (Personal Corner)
//   - /contact    → 200, data-testid="contact-info-terminal" (static fallback)
//   - /about      → 200 + CMS content (CMS_LIVE=true only) — SKIPPED otherwise
//   - /tech-stack → 200 + CMS content (CMS_LIVE=true only) — SKIPPED otherwise
//   - unknown     → 404, error page heading visible

import { test, expect } from '@playwright/test';

const CMS_LIVE = process.env.CMS_LIVE === 'true';

// ---------------------------------------------------------------------------
// Routes with stable static content (no CMS dependency or static fallback)
// ---------------------------------------------------------------------------

test('route / (home) renders hero banner', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	// hero-banner testid is always present regardless of content source
	await expect(page.locator('[data-testid="hero-banner"]')).toBeVisible();
});

test('route / (home) renders hero headline from CMS', async ({ page }) => {
	// slice-18i Phase 7: home route fetches all blocks from Directus M2A.
	// We assert the data chain works (testid present + non-empty content)
	// rather than specific copy — Directus owns the words, not the test.
	test.skip(!CMS_LIVE, 'Requires live CMS — set CMS_LIVE=true to run');
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	const heroLine1 = page.getByTestId('hero-line1');
	await expect(heroLine1).toBeVisible();
	expect((await heroLine1.textContent())?.trim()).toBeTruthy();
});

test('route /services renders without crash', async ({ page }) => {
	const response = await page.goto('/services');
	expect(response?.status()).toBe(200);
	await expect(page.locator('[data-testid="nav"]')).toBeVisible();
});

test('route /projects renders without crash', async ({ page }) => {
	const response = await page.goto('/projects');
	expect(response?.status()).toBe(200);
	await expect(page.locator('[data-testid="nav"]')).toBeVisible();
});

test('route /blog renders listing container', async ({ page }) => {
	const response = await page.goto('/blog');
	expect(response?.status()).toBe(200);
	// Asserts the blog listing component mounted. The page heading copy comes
	// from Directus (blog-page.ts: heading.en — "Dispatches" today, anything
	// tomorrow) and is not the engineering concern. Structural testid only.
	await expect(page.locator('[data-testid="blog-listing"]')).toBeVisible();
});

test('route /blog/personal renders listing container', async ({ page }) => {
	// slice-28.1 (audit #29): /blog/personal was the only public page route
	// missing from this spec. Same structural assertion as /blog — the
	// Personal Corner listing reuses BlogListingPage (data-testid="blog-listing").
	const response = await page.goto('/blog/personal');
	expect(response?.status()).toBe(200);
	await expect(page.locator('[data-testid="blog-listing"]')).toBeVisible();
});

test('route /contact renders contact terminals', async ({ page }) => {
	// slice-19 Phase 1 Task 1: ContactPage renders the contact-info-terminal
	// snippet inside BOTH a .desktop-terminals (resizable split) and a
	// .mobile-terminals (stacked) container, with display:none toggled at the
	// 1024px breakpoint. The .first() selector picks the .desktop-terminals
	// instance, which is hidden below 1024px. Gate to desktop-chrome only;
	// mobile coverage of contact-info-terminal visibility can be added in a
	// later mobile-flow spec using a layout-aware selector.
	test.skip(test.info().project.name !== 'desktop-chrome', 'desktop-only assertion');
	const response = await page.goto('/contact');
	expect(response?.status()).toBe(200);
	// data-testid="contact-info-terminal" is rendered by ContactPage regardless
	// of whether it uses the static fallback or CMS-sourced content
	// (there are two instances — info + form; use .first() to avoid strict-mode error)
	await expect(page.locator('[data-testid="contact-info-terminal"]').first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// Routes that require live CMS data — skipped when CMS_LIVE !== 'true'
//
// To run these tests: set CMS_LIVE=true in your environment before invoking
// the E2E runner (e.g. CMS_LIVE=true bun run test:e2e).
// ---------------------------------------------------------------------------

test('route /about returns 200 and renders nav + main content', async ({ page }) => {
	test.skip(!CMS_LIVE, 'Requires live CMS — set CMS_LIVE=true to run');
	const response = await page.goto('/about');
	expect(response?.status()).toBe(200);
	await expect(page.locator('[data-testid="nav"]')).toBeVisible();
	// Structural rendering check — about page chrome (nav + a non-empty <main>)
	// proves the CMS routing worked without coupling to specific copy.
	await expect(page.locator('main')).toBeVisible();
	expect((await page.locator('main').textContent())?.trim().length ?? 0).toBeGreaterThan(0);
});

test('route /tech-stack returns 200 and renders CMS content', async ({ page }) => {
	test.skip(!CMS_LIVE, 'Requires live CMS — set CMS_LIVE=true to run');
	const response = await page.goto('/tech-stack');
	expect(response?.status()).toBe(200);
	await expect(page.locator('[data-testid="nav"]')).toBeVisible();
	// Hero section is the page-level structural anchor — present iff the
	// CMS-routed block_tech_stack_page_content rendered without throwing.
	await expect(page.locator('[data-testid="tech-stack-hero"]')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 404 route — unknown path activates +error.svelte
// ---------------------------------------------------------------------------

test('unknown route renders the 404 error page', async ({ page }) => {
	const response = await page.goto('/this-route-does-not-exist-at-all');
	// SvelteKit returns 404 for unknown routes
	expect(response?.status()).toBe(404);
	// +error.svelte renders structural testids regardless of copy. Asserting
	// on testids rather than the heading text lets the brand copy evolve
	// without breaking the test.
	await expect(page.locator('[data-testid="error-label"]')).toBeVisible();
});
