// Baseline mobile-flow spec — slice-19 Phase 1 Task 2.
// Runs on every Playwright project (desktop-chrome + 3 mobile profiles).
// Failures on mobile profiles surface real UX gaps that Phase 2 audit logs
// to slice-19-plan and Phase 4 fixes.

import { test, expect } from '@playwright/test';

test('home page renders hero on every device profile', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('[data-testid="hero-banner"]')).toBeVisible();
});

test('viewport meta tag is mobile-shaped', async ({ page }) => {
	await page.goto('/');
	const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
	expect(viewportMeta).toContain('width=device-width');
	expect(viewportMeta).toContain('initial-scale=1');
	expect(viewportMeta).toContain('viewport-fit=cover');
});

test('home page has no horizontal scroll at any viewport', async ({ page }) => {
	await page.goto('/');
	const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
	const viewportWidth = await page.evaluate(() => window.innerWidth);
	expect(documentWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 sub-pixel tolerance
});
