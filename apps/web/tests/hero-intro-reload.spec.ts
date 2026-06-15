import { test, expect } from '@playwright/test';

// go2/w5 — a same-day reload (the intro was already scrolled through TODAY) must
// render the hero COLLAPSED from first paint, not flash the ~900svh metro intro
// before onMount collapses it. The app.html pre-paint script reads the
// 'yesid:hero-intro-day' day-key and marks html[data-hero-intro-done] BEFORE CSSOM;
// the HeroBanner CSS collapses on that attribute. Desktop-only (the pinned intro is
// a desktop surface; mobile/reduced-motion already loads collapsed).
test.describe('Hero intro — same-day reload renders collapsed (no flash)', () => {
	test('completed-today: the pre-paint script collapses the hero from first paint', async ({
		page,
	}) => {
		// Pretend the intro was scrolled through TODAY, BEFORE any page script runs.
		await page.addInitScript(() => {
			const n = new Date();
			const today =
				n.getFullYear() +
				'-' +
				String(n.getMonth() + 1).padStart(2, '0') +
				'-' +
				String(n.getDate()).padStart(2, '0');
			try {
				localStorage.setItem('yesid:hero-intro-day', today);
			} catch {
				/* ignore */
			}
		});

		await page.goto('/');

		// Marked before first paint by the pre-paint script.
		await expect(page.locator('html')).toHaveAttribute('data-hero-intro-done', '1');
		// Collapsed geometry: the metro intro art is hidden (display:none via the attr),
		// and the completed hero text is shown — no 900svh intro flashed.
		await expect(page.locator('.hero-metro-wrapper')).toBeHidden();
		await expect(page.getByTestId('hero-text-container')).toBeVisible();
	});

	test('first visit of the day: no day-key → the document is NOT pre-marked', async ({ page }) => {
		await page.addInitScript(() => {
			try {
				localStorage.removeItem('yesid:hero-intro-day');
			} catch {
				/* ignore */
			}
		});

		await page.goto('/');
		await expect(page.locator('html')).not.toHaveAttribute('data-hero-intro-done', '1');
	});
});
