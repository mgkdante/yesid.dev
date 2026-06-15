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
		// Pretend the intro was scrolled through TODAY, BEFORE any page script runs,
		// AND install a witness for the frame-0 bridge. The <head> pre-paint script
		// sets html[data-hero-intro-done] before first paint; HeroBanner.onMount then
		// hands the collapsed geometry to the .hero-intro-done CLASS and CLEARS the
		// attribute (it is a bridge, never a persistent state — a stuck attribute
		// would later block the dot-replay re-enlarge). So we cannot assert the
		// attribute still exists post-load; instead a MutationObserver, installed
		// before the page's own scripts run, records a sticky marker the instant the
		// bridge attribute is first set — proving it WAS present at frame 0.
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
			// Observe the DOCUMENT (always present at document_start; documentElement
			// can still be null this early) for the <head> pre-paint script setting
			// html[data-hero-intro-done]. Record a sticky marker the instant it
			// appears — before HeroBanner.onMount hands off to the class and clears it.
			const obs = new MutationObserver(() => {
				const html = document.documentElement;
				if (html && html.hasAttribute('data-hero-intro-done')) {
					html.setAttribute('data-hero-bridge-seen', '1');
					obs.disconnect();
				}
			});
			obs.observe(document, {
				subtree: true,
				attributes: true,
				attributeFilter: ['data-hero-intro-done'],
			});
		});

		await page.goto('/');

		// Frame-0 bridge fired: the pre-paint script set the attribute before paint.
		await expect(page.locator('html')).toHaveAttribute('data-hero-bridge-seen', '1');
		// Collapsed geometry held (now by the .hero-intro-done class): the metro
		// intro art is hidden and the completed hero text is shown — no 900svh flash.
		await expect(page.locator('.hero-metro-wrapper')).toBeHidden();
		await expect(page.getByTestId('hero-text-container')).toBeVisible();
		// The bridge handed off and CLEARED — the attribute's permanent global
		// collapse no longer pins the section, so the dot replay can re-enlarge the
		// track (regression guard: a stuck attribute killed reload→replay).
		await expect(page.locator('html')).not.toHaveAttribute('data-hero-intro-done', '1');
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
