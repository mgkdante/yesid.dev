// pages.spec.ts — E2E Playwright tests for the 7 public routes + 404 error page.
//
// These tests run against the built + previewed app (playwright.config.ts:
// webServer builds then starts `vite preview` on port 4173; set
// PLAYWRIGHT_BASE_URL to target a deployed surface instead).
//
// No live-CMS dependency (slice-28.4, audit #91 + #121): as of slice-27.2 the
// adapter is fully static — every route renders from the committed content
// modules under src/lib/content (regenerated at build time by the
// export-fallbacks prebuild). The old CMS_LIVE env gate predates that revert
// and is gone: /about and /tech-stack are asserted unconditionally like every
// other route. No route needs a reachable Directus to pass.
//
// Route strategy (all 200 from static content modules):
//   - /           → data-testid="hero-banner" + non-empty hero-line1
//   - /services   → nav visible
//   - /projects   → nav visible
//   - /blog       → data-testid="blog-listing" (copy lives in content modules)
//   - /blog/personal → data-testid="blog-listing" (Personal Corner; slice-28.1, audit #29)
//   - /contact    → data-testid="contact-info-terminal"
//   - /about      → nav + non-empty <main>
//   - /tech-stack → data-testid="tech-stack-hero"
//   - unknown     → 404, error page testids visible

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Core routes
// ---------------------------------------------------------------------------

test('route / (home) renders hero banner', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	// hero-banner testid is always present regardless of content source
	await expect(page.locator('[data-testid="hero-banner"]')).toBeVisible();
});

test('route / (home) renders a non-empty hero headline', async ({ page }) => {
	// We assert the data chain works (testid present + non-empty content)
	// rather than specific copy — the content modules own the words, not the
	// test. Content is baked in at build time, so no skip gate is needed.
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
	// from the committed content module (blog-page.ts: heading.en —
	// "Dispatches" today, anything tomorrow after the next export-fallbacks
	// run) and is not the engineering concern. Structural testid only.
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

test('route /about returns 200 and renders nav + main content', async ({ page }) => {
	const response = await page.goto('/about');
	expect(response?.status()).toBe(200);
	await expect(page.locator('[data-testid="nav"]')).toBeVisible();
	// Structural rendering check — about page chrome (nav + a non-empty <main>)
	// proves the content-module routing worked without coupling to specific copy.
	await expect(page.locator('main')).toBeVisible();
	expect((await page.locator('main').textContent())?.trim().length ?? 0).toBeGreaterThan(0);
});

test('route /tech-stack returns 200 and renders page content', async ({ page }) => {
	const response = await page.goto('/tech-stack');
	expect(response?.status()).toBe(200);
	await expect(page.locator('[data-testid="nav"]')).toBeVisible();
	// Hero section is the page-level structural anchor — present iff the
	// tech-stack page content block rendered without throwing.
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
