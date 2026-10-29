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
	// The grid ignores the pointer, and even when made hit-testable it sits under the page shell.
	const covered = await grid.evaluate((layer) => {
		const inert = getComputedStyle(layer).pointerEvents === 'none';
		const previous = layer.style.pointerEvents;
		layer.style.pointerEvents = 'auto';
		const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
		layer.style.pointerEvents = previous;
		return inert && Boolean(hit?.closest('.site-shell'));
	});
	expect(covered).toBe(true);
});

test('section grids hold still with the page grid instead of scrolling over it', async ({ page }) => {
	await page.goto('/');
	const manifesto = page.getByTestId('manifesto-section');
	for (const offset of [0, 200]) {
		await manifesto.evaluate((section, offset) => {
			window.scrollTo({ top: scrollY + section.getBoundingClientRect().top + offset, behavior: 'instant' });
		}, offset);
		expect((await page.locator('.manifesto__circuit-grid').boundingBox())!.y).toBe(0);
	}
	const band = page.getByTestId('home-cta-band');
	await expect(band).toHaveCSS('background-image', 'none');
	await expect(band).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});
