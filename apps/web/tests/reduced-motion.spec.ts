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
		// Deterministic substitute for the deleted networkidle: wait until the
		// homepage root is hydrated (app-root visible + scripts loaded) so onMount
		// → initLenis() has definitely run, THEN assert Lenis never attached.
		await page.waitForLoadState('load');
		await expect(page.getByTestId('app-root')).toBeVisible();
		expect(
			await page.evaluate(() => document.documentElement.classList.contains('lenis')),
		).toBe(false);
	});

	test('reduce: about train↔rocket renders the train, idle bob gated off', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/about');
		// SVG morph widget paints the train at rest (paths present, not blank).
		const widget = page.locator('[data-testid="about-train-button"]');
		await expect(widget).toBeVisible();
		const paths = widget.locator('svg path');
		expect(await paths.count()).toBeGreaterThan(5);
		// The ceaseless idle bob must be suppressed under reduced motion.
		const bob = await widget.evaluate((el) => getComputedStyle(el).animationName);
		expect(bob).toBe('none');
	});

	test('reduce: weather scene is a static composition (parked, never blank)', async ({
		page,
	}) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/about');
		await expect(page.locator('[data-testid="about-weather"]')).toBeVisible();
		// GO Wave 4 scene system: the scene root + skyline always render
		// (whatever the live condition — offline included), so reduce must show
		// a composed still, not an empty card.
		const scene = page.locator('[data-testid="about-weather"] .weather-scene');
		await expect(scene).toHaveCount(1);
		await expect(scene.locator('.weather-sky')).toHaveCount(1);
		await expect(scene.locator('.weather-skyline')).toBeVisible();
		// Every scene element (animated or not) must compute animation none.
		const particles = page.locator('[data-testid="about-weather"] [class*="weather-"]');
		const count = await particles.count();
		expect(count).toBeGreaterThan(0);
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
