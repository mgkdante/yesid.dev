// Services listing page mobile-flow spec — slice-19 Phase 4 Task 26.
// Runs on every Playwright project (desktop-chrome + 3 mobile profiles).

import { test, expect } from '@playwright/test';

test('services page loads + service card is visible', async ({ page }) => {
	await page.goto('/services');

	// Service listing page container — web-first expect auto-waits for it to
	// attach + render, which is exactly what networkidle was implicitly guarding.
	await expect(page.locator('[data-testid="service-listing-page"]')).toBeVisible();

	// ServiceCard renders both .desktop-only and .mobile-only CTAs in the DOM;
	// filter to the first that is actually visible in the current viewport.
	const firstServiceLink = page.locator('a[href^="/services/"]').filter({ visible: true }).first();
	await expect(firstServiceLink).toBeVisible();
});

test('services page deep-dive CTA meets 44px touch target height', async ({ page }) => {
	await page.goto('/services');

	// Grab the first visible service link and measure its rendered height. The
	// web-first expect below auto-waits for the link to be visible, which is what
	// networkidle was implicitly guarding before the boundingBox() read.
	const firstServiceLink = page.locator('a[href^="/services/"]').filter({ visible: true }).first();
	await expect(firstServiceLink).toBeVisible();

	const box = await firstServiceLink.boundingBox();
	expect(box).not.toBeNull();
	if (box) {
		expect(box.height).toBeGreaterThanOrEqual(44);
	}
});
