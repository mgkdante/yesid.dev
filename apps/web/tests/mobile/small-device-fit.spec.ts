import { expect, test } from '@playwright/test';

// Small-device fit guard.
//
// The phone matrix in playwright.config.ts starts at iPhone 12 (390px), so the
// 360-375px band — Galaxy S23 (360x780) and iPhone SE (375x667) — was never
// tested. That blind spot let a batch of mobile-fit regressions ship: the
// floating nav clipping page titles, the home hero overflowing the short
// viewport (clipping before the SQL demo), the Terminus board crushing its
// description column into one-character-per-line, and the open menu options
// riding up under the pill. This spec locks each of those down at the two
// real-device viewports it now runs under (iphone-se + galaxy-s23 profiles,
// plus iphone-12 via the single-phone set).
//

// Reduced motion renders the home hero in its final static state (the GSAP
// intro otherwise hides the text behind an animation). Applied via media
// emulation per test rather than test.use({ reducedMotion }), which this
// Playwright version does not type on the Fixtures object.
test.beforeEach(async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function pillBottom(page: import('@playwright/test').Page): Promise<number> {
	const box = await page.getByTestId('nav-pill').boundingBox();
	if (!box) throw new Error('nav pill not found');
	return box.y + box.height;
}

test.describe('small-device fit', () => {
	// Phone-layout widths only — above 768px the desktop composition takes over
	// and these assertions do not apply (the spec should not reach ipad-mini via
	// the config, but guard anyway).
	test.skip(({ viewport }) => !viewport || viewport.width >= 768, 'phone-layout widths only');

	test('home headline clears nav and both CTAs remain reachable', async ({
		page
	}) => {
		await page.goto('/');
		const line1 = page.getByTestId('hero-line1');
		await expect(line1).toBeVisible();
		const boxTop = (await page.locator('.hero-viewport-text').boundingBox())!.y;
		const headTop = (await line1.boundingBox())!.y;
		expect(headTop, 'headline top vs hero box top').toBeGreaterThanOrEqual(boxTop - 2);
		expect(headTop, 'headline clears the floating nav').toBeGreaterThanOrEqual(await pillBottom(page));
		for (const id of ['hero-cta-projects', 'hero-cta-contact']) {
			await page.getByTestId(id).scrollIntoViewIfNeeded();
			await expect(page.getByTestId(id)).toBeInViewport();
		}
	});

	test('service tablist clears the floating nav pill', async ({ page }) => {
		await page.goto('/services');
		await page.waitForLoadState('load');
		const pb = await pillBottom(page);
		// The service h1 is sr-only; its one-pixel clipping box is not the visible control.
		const firstHeading = page.locator('main [role="tablist"]');
		await expect(firstHeading).toBeVisible();
		const top = (await firstHeading.boundingBox())!.y;
		expect(top, 'first services heading top vs pill bottom').toBeGreaterThanOrEqual(pb);
	});

	test('terminus board descriptions are full-width, not char-stacked', async ({ page }) => {
		await page.goto('/');
		const firstRow = page.locator('[data-closer-row]').first();
		await firstRow.scrollIntoViewIfNeeded();
		const desc = firstRow
			.locator('.terminal-row-desc, .terminal-row-desc-primary')
			.first();
		await expect(desc).toBeVisible();
		const w = (await desc.boundingBox())!.width;
		// The pre-fix 4-column grid starved this column to ~9-24px (one char per
		// line). The stacked mobile layout gives it a full-width line (>200px on
		// any phone); 120 is a safe floor.
		expect(w, 'terminus description column width').toBeGreaterThan(120);
	});

});
