// Services listing page mobile-flow spec — slice-19 Phase 4 Task 26.
// Runs on every Playwright project (desktop-chrome + 3 mobile profiles).

import { test, expect } from '@playwright/test';

test('services page loads + service card is visible', async ({ page }) => {
	await page.goto('/services');
	await page.waitForLoadState('networkidle');

	// Service listing page container
	await expect(page.locator('[data-testid="service-listing-page"]')).toBeVisible();

	// ServiceCard renders both .desktop-only and .mobile-only CTAs in the DOM;
	// filter to the first that is actually visible in the current viewport.
	const firstServiceLink = page.locator('a[href^="/services/"]').filter({ visible: true }).first();
	await expect(firstServiceLink).toBeVisible();
});

test('services page deep-dive CTA meets 44px touch target height', async ({ page }) => {
	await page.goto('/services');
	await page.waitForLoadState('networkidle');

	// Grab the first visible service link and measure its rendered height
	const firstServiceLink = page.locator('a[href^="/services/"]').filter({ visible: true }).first();
	await expect(firstServiceLink).toBeVisible();

	const box = await firstServiceLink.boundingBox();
	expect(box).not.toBeNull();
	if (box) {
		expect(box.height).toBeGreaterThanOrEqual(44);
	}
});
