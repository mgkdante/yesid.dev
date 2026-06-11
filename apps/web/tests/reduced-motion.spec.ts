// GO-w2t5 — reduced-motion contract, e2e tier. Asserts the retier decisions
// that unit tests can't reach: Lenis mounting, canvas pixels, computed CSS.
// Runs on desktop-chrome + mobile projects (Lenis tests skip on mobile —
// Lenis is desktop-wheel only by design).

import { test, expect } from '@playwright/test';

test.describe('reduced-motion retier (GO-w2t5)', () => {
	test('no-preference desktop: Lenis mounts (root carries .lenis)', async ({
		page,
		isMobile,
	}) => {
		test.skip(Boolean(isMobile), 'Lenis is desktop-wheel only');
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto('/');
		await expect
			.poll(() => page.evaluate(() => document.documentElement.classList.contains('lenis')))
			.toBe(true);
	});

	test('reduce desktop: Lenis does NOT mount — native scroll', async ({ page, isMobile }) => {
		test.skip(Boolean(isMobile), 'Lenis is desktop-wheel only');
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		expect(
			await page.evaluate(() => document.documentElement.classList.contains('lenis')),
		).toBe(false);
	});

	test('reduce: about train canvas draws a static frame (not blank)', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/about');
		const canvas = page.locator('[data-testid="about-train"] canvas');
		await expect(canvas).toBeVisible();
		const hasInk = await canvas.evaluate((el) => {
			const c = el as HTMLCanvasElement;
			const ctx = c.getContext('2d');
			if (!ctx) return false;
			const { data } = ctx.getImageData(0, 0, c.width, c.height);
			for (let i = 3; i < data.length; i += 4) {
				if (data[i] > 0) return true;
			}
			return false;
		});
		expect(hasInk).toBe(true);
	});

	test('reduce: weather particles are parked (animation none)', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/about');
		await expect(page.locator('[data-testid="about-weather"]')).toBeVisible();
		// Particle set depends on live weather; whatever rendered must be parked.
		const particles = page.locator('[data-testid="about-weather"] [class*="weather-"]');
		const count = await particles.count();
		test.skip(count === 0, 'no particles for current live weather condition');
		for (let i = 0; i < count; i++) {
			expect(
				await particles.nth(i).evaluate((el) => getComputedStyle(el).animationName),
			).toBe('none');
		}
	});

	test('reduce: engine renders final blueprint state; signal dashes stay parked', async ({
		page,
	}) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/tech-stack');
		await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();
		await page.locator('[data-testid="archetype-card-data-dashboard"]').click();

		const canvas = page.locator('[data-testid="blueprint-canvas"]');
		await expect(canvas).toBeVisible();

		// animate=false branch gsap.set()s final states: rows fully visible.
		const rowOpacity = await canvas
			.locator('.bp-row')
			.first()
			.evaluate((el) => getComputedStyle(el).opacity);
		expect(Number(rowOpacity)).toBe(1);

		// Fun-pass stays dark for reduce users: signals rest at CSS opacity 0.
		const signals = canvas.locator('.bp-signal');
		expect(await signals.count()).toBeGreaterThan(0);
		expect(await signals.first().evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
	});
});
