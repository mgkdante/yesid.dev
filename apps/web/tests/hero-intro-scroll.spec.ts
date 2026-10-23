import { test, expect } from '@playwright/test';

for (const [width, height, touch] of [[390, 844, true], [840, 956, true], [1440, 900, false]] as const) {
	test(`${width}px: replay pins immediately and completes after its visual scrub`, async ({ browser, baseURL }, testInfo) => {
		const context = await browser.newContext({ baseURL, viewport: { width, height }, hasTouch: touch, isMobile: touch });
		const page = await context.newPage();
		try {
			await page.goto('/');
			await page.getByTestId('hero-dot-replay').click();
			await expect(page.locator('.hero-pin').locator('..')).toHaveClass(/pin-spacer/);
			await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15_000 }).toBeLessThan(1);
			await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'instant' }));
			await expect.poll(() => page.locator('.hero-pin').evaluate(el => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(1);
			await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
			await expect.poll(() => page.getByTestId('hero-text-container').evaluate(el => getComputedStyle(el).opacity)).toBe('0');
			// The last 160px must still move the scene, rather than hold a finished
			// hero with a dormant dot and invisible annotation.
			await page.evaluate(() => {
				const spacer = document.querySelector('.hero-pin')!.parentElement!;
				window.scrollTo({ top: parseFloat(getComputedStyle(spacer).paddingBottom) - 160, behavior: 'instant' });
			});
			await page.waitForTimeout(800); // allow the touch scrub buffer to settle
			expect(await page.getByTestId('hero-text-container').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).a)).toBeGreaterThan(1.01);
			await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
			await expect.poll(() => page.getByTestId('hero-text-container').evaluate(el => getComputedStyle(el).opacity)).toBe('0');
			const landing = await page.evaluate(async () => {
				const text = document.querySelector('[data-testid="hero-text-container"]')!;
				const headline = document.querySelector('[data-testid="hero-line1"]')!;
				const pin = document.querySelector('.hero-pin')!;
				const spacer = pin.parentElement!;
				const distance = parseFloat(getComputedStyle(spacer).paddingBottom);
				const frames: { pinned: boolean; scale: number; opacity: number; top: number; y: number }[] = [];
				for (let frame = 0; frame < 100; frame++) {
					await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
					const style = getComputedStyle(text);
					const pinned = pin.parentElement!.classList.contains('pin-spacer');
					frames.push({ pinned, scale: new DOMMatrixReadOnly(style.transform).a, opacity: Number(style.opacity), top: headline.getBoundingClientRect().top, y: scrollY });
					if (frame === 0) window.scrollTo({ top: distance + 1, behavior: 'instant' });
					if (!pinned && frame > 0) break;
				}
				return { lastPinned: frames.filter(frame => frame.pinned).at(-1), settled: frames.at(-1) };
			});
			expect(landing.settled?.pinned, JSON.stringify(landing)).toBe(false);
			expect(landing.lastPinned?.opacity, JSON.stringify(landing)).toBeGreaterThanOrEqual(0.99);
			expect(landing.lastPinned?.scale, JSON.stringify(landing)).toBeLessThanOrEqual(1.01);
			expect(Math.abs(landing.lastPinned!.top - landing.settled!.top), JSON.stringify(landing)).toBeLessThanOrEqual(1);
			await expect(page.getByTestId('hero-line1')).toBeVisible();
			await expect(page.getByTestId('hero-dot-annotation')).toBeVisible();
			await expect.poll(() => page.getByTestId('hero-annotation-letter').first().evaluate(el => {
				const offset = parseFloat(getComputedStyle(el).strokeDashoffset);
				return offset > 0 && offset < 1;
			}), { intervals: [16, 16, 16, 16] }).toBe(true);
			await page.screenshot({ path: testInfo.outputPath('redraw-start.png') });
			await expect.poll(() => page.getByTestId('hero-dot').evaluate(el => getComputedStyle(el).animationName)).toContain('hero-dot-pulse');
			await expect.poll(() => page.getByTestId('hero-annotation-tip').evaluate(el => parseFloat(getComputedStyle(el).strokeDashoffset))).toBe(0);
			await page.screenshot({ path: testInfo.outputPath('redraw-complete.png') });
		} finally {
			await context.close();
		}
	});
}
