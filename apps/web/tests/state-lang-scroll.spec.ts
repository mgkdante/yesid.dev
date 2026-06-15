// slice-34.4 — reading position survives a language switch.
//
// A locale switch (/projects → /fr/projects) changes the pathname, +layout
// wraps <main> in {#key url.pathname}, so the whole page subtree REMOUNTS and
// every in-memory rune is destroyed. The locale-handoff orchestrator snapshots
// the scroll position before the switch and restores it after the remounted page
// paints. The default restore is Lenis-aware (slice-34.4 foundation tweak): a
// bare window.scrollTo fights the site-wide Lenis engine, so the default routes
// through lenis.resize() + an immediate forced scrollTo.
//
// This spec guards the LISTING case (the default offset ScrollContext): scroll
// /projects down, toggle the locale, and assert the position is roughly
// preserved — NOT reset to ~0. A LOOSE tolerance keeps it non-flaky: FR/EN
// listing heights differ slightly and Lenis easing settles within a few px, so
// we only assert "still scrolled near where we left off", not pixel parity.
//
// The home-pin restore (HomePage normalized-fraction ScrollContext) is far more
// fragile to assert in e2e — the GSAP pin rewrites document height after a
// deferred refresh — so it is intentionally NOT covered here (see the slice
// report's risk notes). This spec lives in its own file and does not touch
// playwright.config.ts.

import { test, expect, type Page } from '@playwright/test';

const PROJECTS_URL = '/projects';
const SCROLL_TO = 450; // a few hundred px down — clear of the top, within the listing
const TOLERANCE = 200; // loose: Lenis settle + FR/EN height drift, anti-flake

/** Wait for client hydration — the deterministic "page JS is live" signal. */
async function waitForHydration(page: Page): Promise<void> {
	await expect
		.poll(() => page.evaluate(() => document.documentElement.classList.contains('lenis')))
		.toBe(true);
}

test.describe('reading position survives a locale switch (slice-34.4)', () => {
	test('listing: /projects scroll position is preserved across EN→FR toggle', async ({
		page,
		isMobile,
	}) => {
		// Lenis (and the fragile-on-touch synthetic scroll) is desktop-only; the
		// default restore still runs on mobile via native window.scrollTo, but the
		// deterministic `lenis` hydration signal is desktop-only, so scope the
		// assertion to desktop where the Lenis path is the one under test.
		test.skip(Boolean(isMobile), 'Lenis-aware restore path is desktop-wheel only');
		await page.emulateMedia({ reducedMotion: 'no-preference' });

		await page.goto(PROJECTS_URL);
		await expect(page.getByTestId('project-listing')).toBeVisible();
		await waitForHydration(page);

		// Scroll down a few hundred px and let Lenis settle.
		await page.evaluate((y) => window.scrollTo(0, y), SCROLL_TO);
		await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(
			SCROLL_TO - TOLERANCE,
		);

		// Toggle the locale (the fingerpost preserves path+query+hash and sets
		// data-sveltekit-noscroll, so the orchestrator owns scroll restore).
		const toggle = page.getByTestId('language-toggle');
		await expect(toggle).toBeVisible();
		await toggle.click();

		// The remounted FR page paints, then the orchestrator restores scroll.
		await expect(page).toHaveURL(/\/fr\/projects/);
		await expect(page.getByTestId('project-listing')).toBeVisible();
		await waitForHydration(page);

		// The position must be RESTORED — near where we left it, NOT reset to ~0.
		// Loose bounds: only assert "still meaningfully scrolled", anti-flake.
		await expect
			.poll(() => page.evaluate(() => Math.round(window.scrollY)), {
				message: 'scroll should be restored, not reset to the top',
				timeout: 4000,
			})
			.toBeGreaterThan(SCROLL_TO - TOLERANCE);

		const restored = await page.evaluate(() => Math.round(window.scrollY));
		expect(restored, 'restored position must be in the captured neighborhood').toBeLessThan(
			SCROLL_TO + TOLERANCE,
		);
	});
});
