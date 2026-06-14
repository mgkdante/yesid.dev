// Services detail page mobile-flow spec — slice-19 Phase 4 Task 26.
// Runs on every Playwright project (desktop-chrome + 3 mobile profiles).

import { test, expect, type Page } from '@playwright/test';

/** Navigate to the listing page, grab the first service slug, and open it.
 *  Calls test.skip when no slug is found so the caller can simply return.
 *
 *  Note: each service renders TWO detail anchors — a `.desktop-only` and a
 *  `.mobile-only` CTA — and exactly one is display:none per viewport. So we
 *  read the href off the DOM node directly (getAttribute works on a hidden
 *  element) rather than asserting visibility on `.first()`, which would land on
 *  the viewport-hidden anchor. The shared gotoFirstDetail helper can't be used
 *  here because its visibility assertion fails on the mobile projects. */
async function navigateToFirstService(page: Page) {
	await page.goto('/services');

	// Deterministic wait: the listing's service links are present in the DOM
	// (one per service, regardless of viewport) — replaces networkidle.
	const firstServiceLink = page.locator('a[href^="/services/"]').first();
	await firstServiceLink.waitFor({ state: 'attached' });

	const firstServiceHref = await firstServiceLink.getAttribute('href');
	if (!firstServiceHref) {
		test.skip(true, 'No service slug available on /services listing');
		return;
	}

	await page.goto(firstServiceHref);
	// Deterministic wait: the detail landmark is visible — replaces networkidle.
	await expect(page.locator('[data-testid="service-detail-page"]')).toBeVisible();
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
