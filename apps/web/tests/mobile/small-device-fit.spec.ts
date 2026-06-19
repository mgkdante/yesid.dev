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
// intro otherwise hides the text behind an animation).
test.use({ reducedMotion: 'reduce' });

const ROUTES = ['/', '/services', '/projects', '/blog', '/contact', '/tech-stack', '/about'];

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

	for (const path of ROUTES) {
		test(`no horizontal overflow: ${path}`, async ({ page }) => {
			await page.goto(path);
			await page.waitForLoadState('load');
			const overflow = await page.evaluate(
				() =>
					Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) -
					window.innerWidth
			);
			expect(overflow, `${path} horizontal overflow (px)`).toBeLessThanOrEqual(1);
		});
	}

	test('home hero fits one viewport (headline clears nav, both CTAs visible)', async ({
		page
	}) => {
		await page.goto('/');
		const line1 = page.getByTestId('hero-line1');
		const cta = page.getByTestId('hero-cta-contact');
		await expect(line1).toBeVisible();
		const boxTop = (await page.locator('.hero-viewport-text').boundingBox())!.y;
		const headTop = (await line1.boundingBox())!.y;
		const ctaBox = (await cta.boundingBox())!;
		const innerH = await page.evaluate(() => window.innerHeight);
		// Headline starts inside its box (i.e. below the nav, not clipped above).
		expect(headTop, 'headline top vs hero box top').toBeGreaterThanOrEqual(boxTop - 2);
		// The lower (contact) CTA is fully on screen — the hero stops clipping
		// before the SQL demo.
		expect(ctaBox.y + ctaBox.height, 'contact CTA bottom vs viewport bottom').toBeLessThanOrEqual(
			innerH + 1
		);
	});

	test('service tablist clears the floating nav pill', async ({ page }) => {
		await page.goto('/services');
		await page.waitForLoadState('load');
		const pb = await pillBottom(page);
		const firstHeading = page.locator('main [role="tablist"], main h1').first();
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

	test('open menu options clear the nav pill', async ({ page }) => {
		// A light page (no full-viewport hero pin) so the toggle settles quickly.
		// The nav + menu are global chrome, identical on every page.
		await page.goto('/about');
		const toggle = page.getByTestId('nav-menu-toggle');
		const firstItem = page.locator('[data-menu-item]').first();
		await expect(toggle).toBeVisible();
		// The toggle's click handler attaches on hydration, so the very first
		// click can land before it is wired. Retry the open (only while still
		// closed) until the options render — a deterministic poll, not a sleep.
		await expect(async () => {
			if (!(await firstItem.isVisible().catch(() => false))) {
				await toggle.click();
			}
			await expect(firstItem).toBeVisible({ timeout: 1500 });
		}).toPass({ timeout: 10_000 });
		// Poll the gap so a transitional frame right after open (the pill compacts
		// on a CSS transition) cannot flake the measurement.
		await expect
			.poll(async () => (await firstItem.boundingBox())!.y - (await pillBottom(page)), {
				message: 'first menu item top vs pill bottom (px gap)'
			})
			.toBeGreaterThanOrEqual(0);
	});
});
