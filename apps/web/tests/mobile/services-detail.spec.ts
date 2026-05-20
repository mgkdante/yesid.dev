// Services detail page mobile-flow spec — slice-19 Phase 4 Task 26.
// Runs on every Playwright project (desktop-chrome + 3 mobile profiles).

import { test, expect, type Page } from '@playwright/test';

/** Navigate to the listing page, grab the first service slug, and open it.
 *  Calls test.skip when no slug is found so the caller can simply return. */
async function navigateToFirstService(page: Page) {
	await page.goto('/services');
	await page.waitForLoadState('networkidle');

	const firstServiceHref = await page.locator('a[href^="/services/"]').first().getAttribute('href');
	if (!firstServiceHref) {
		test.skip(true, 'No service slug available on /services listing');
		return;
	}

	await page.goto(firstServiceHref);
	await page.waitForLoadState('networkidle');
}

test('services detail page loads with back link', async ({ page }) => {
	await navigateToFirstService(page);

	// Detail page container
	await expect(page.locator('[data-testid="service-detail-page"]')).toBeVisible();

	// Back link to /services — Task 24 ensured min-height 44px (2.75rem) touch target
	const backLink = page.locator('a[href="/services"]').first();
	await expect(backLink).toBeVisible();
});

test('services detail back link meets 44px touch target height', async ({ page }) => {
	await navigateToFirstService(page);

	const backLink = page.locator('a[href="/services"]').first();
	await expect(backLink).toBeVisible();

	const box = await backLink.boundingBox();
	expect(box).not.toBeNull();
	if (box) {
		expect(box.height).toBeGreaterThanOrEqual(44);
	}
});
