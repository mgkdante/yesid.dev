import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
	test(`${width}px replay zoom advances continuously and returns control to scrolling`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.route(/plausible|google-analytics|web3forms|cal\.com|\/api\/(?:contact|event)/, route => route.abort());
		await page.goto('/');
		const dot = page.getByTestId('hero-dot-replay');
		await expect(dot).toBeEnabled();
		await expect.poll(() => page.getByTestId('hero-annotation-tip').evaluate(el => parseFloat(getComputedStyle(el).strokeDashoffset))).toBe(0);
		await page.clock.install();
		await page.clock.pauseAt(new Date(Date.now() + 100));
		await dot.click();
		await expect(page.locator('.pin-spacer')).toHaveCount(1);
		const scales: number[] = [];
		for (let time = 0; time < 3600; time += 50) {
			await page.clock.runFor(50);
			if (time === 50) {
				const glyph = await page.getByTestId('hero-dot').boundingBox();
				expect(glyph!.width * glyph!.height / (width * 900), 'the first 100ms cannot cover the viewport in orange').toBeLessThan(.2);
			}
			scales.push(await page.getByTestId('hero-text-container').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).a));
		}
		const maximum = Math.max(...scales);
		expect(maximum, 'the dot must actually zoom').toBeGreaterThan(20);
		// Limit a 50ms step to 10% of the full zoom range. The first 100ms stays a small accent.
		expect(Math.max(...scales.slice(1).map((scale, i) => Math.abs(scale - scales[i]) / maximum))).toBeLessThan(.1);
		expect(scales[1] / maximum).toBeLessThan(.15);
		await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(8);
		await expect(page.getByTestId('hero-text-container')).toHaveCSS('opacity', '0');
		await expect(page.getByTestId('hero-still-metro')).toHaveCount(0);
		await expect(dot).not.toHaveAttribute('aria-expanded');
		await expect(dot).not.toHaveAttribute('aria-controls');
		await page.clock.resume();
		// The existing scroll timeline must regain ownership after the rewind.
		await page.evaluate(() => window.scrollTo({ top: innerHeight, behavior: 'instant' }));
		await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
		await expect(page.locator('.pin-spacer')).toHaveCount(1);
	});
}
