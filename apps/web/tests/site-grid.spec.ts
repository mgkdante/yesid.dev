import { expect, test } from '@playwright/test';

test('the page grid stays put behind the content while the page scrolls', async ({ page }) => {
	await page.goto('/');
	const grid = page.getByTestId('site-grid');
	const height = page.viewportSize()!.height;
	const before = await grid.boundingBox();
	await page.evaluate(() => window.scrollTo({ top: innerHeight * 2, behavior: 'instant' }));
	await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(height);
	const after = await grid.boundingBox();
	for (const box of [before!, after!]) {
		expect(box.y).toBe(0);
		expect(box.height).toBeGreaterThanOrEqual(height);
	}
	// Made hit-testable, the grid still sits under the page content at the viewport centre.
	const covered = await grid.evaluate((layer) => {
		layer.style.pointerEvents = 'auto';
		const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
		layer.style.pointerEvents = '';
		return hit !== null && hit !== layer;
	});
	expect(covered).toBe(true);
});
