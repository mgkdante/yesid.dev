// Hero intro replay — go2/w5 deliverable 4. Runs on every Playwright project
// (desktop-chrome + mobile profiles → both breakpoints).
//
//   1. First visit of the day: the scroll intro plays as today; scrolling it
//      through persists the localStorage day-key and arms the pulsing dot.
//   2. Same-day reload: intro SKIPPED — land in the completed state (hero
//      text visible, no metro art, no giant scroll reserve); the orange dot
//      after "DON'T BREAK" pulses, is clickable (aria "Replay intro"), and
//      clicking re-arms the intro + scrolls back up.

import { test, expect } from '@playwright/test';

const KEY = 'yesid:hero-intro-day';

/** Local-timezone YYYY-MM-DD — must match heroIntroDayKey(). */
function localDayKeyScript(storageKey: string): string {
	return `(() => {
		const now = new Date();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		try { window.localStorage.setItem('${storageKey}', now.getFullYear() + '-' + m + '-' + d); } catch {}
	})()`;
}

test('first visit plays the intro; scrolling through persists + arms the dot', async ({
	page,
}) => {
	await page.goto('/');

	// Fresh storage → intro state: no completed-state class, metro art present.
	await expect(page.locator('[data-testid="hero-banner"]')).toBeVisible();
	expect(
		await page
			.locator('[data-testid="hero-banner"]')
			.evaluate((el) => el.classList.contains('hero-intro-done')),
	).toBe(false);
	await expect(page.locator('[data-testid="metro-network-container"]')).toBeVisible();

	// Dot exists but is dormant until the intro completes.
	await expect(page.locator('[data-testid="hero-dot-replay"]')).toBeDisabled();

	// Wait for the scroll-scrub to mount (GSAP wraps the pin in .pin-spacer).
	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBeGreaterThan(0);

	// Scroll the intro through (straight past the pin end).
	await page.evaluate(() => {
		window.scrollTo(0, document.body.scrollHeight);
	});

	// Day-key persisted…
	await expect
		.poll(() => page.evaluate((k) => window.localStorage.getItem(k), KEY), { timeout: 15_000 })
		.toMatch(/^\d{4}-\d{2}-\d{2}$/);

	// …and the dot is armed: enabled, labelled, pulsing.
	const dot = page.locator('[data-testid="hero-dot-replay"]');
	await expect(dot).toBeEnabled();
	await expect(dot).toHaveAttribute('aria-label', 'Replay intro');
	expect(
		await dot
			.locator('[data-testid="hero-dot"]')
			.evaluate((el) => getComputedStyle(el).animationName),
	).toMatch(/hero-dot-pulse/); // Svelte scopes @keyframes names
});

test('same-day reload lands completed; pulsing dot replays the intro', async ({ page }) => {
	// Seed today's day-key BEFORE the app boots.
	await page.addInitScript(localDayKeyScript(KEY));
	await page.goto('/');

	// Completed state: collapse class on, metro art hidden, hero text visible.
	const banner = page.locator('[data-testid="hero-banner"]');
	await expect(banner).toHaveClass(/hero-intro-done/);
	await expect(page.locator('[data-testid="metro-network-container"]')).toBeHidden();
	await expect(page.locator('[data-testid="hero-text-container"]')).toBeVisible();
	await expect(page.locator('[data-testid="hero-line1"]')).toBeVisible();

	// No 600/900svh reservation — the hero is roughly one viewport tall.
	const viewport = page.viewportSize()!;
	const bannerHeight = await banner.evaluate((el) => el.getBoundingClientRect().height);
	expect(bannerHeight).toBeLessThan(viewport.height * 3);

	// The dot pulses (opacity keyframes), reads as clickable, aria-labelled.
	const dot = page.locator('[data-testid="hero-dot-replay"]');
	await expect(dot).toBeEnabled();
	await expect(dot).toHaveAttribute('aria-label', 'Replay intro');
	expect(await dot.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer');
	expect(
		await dot
			.locator('[data-testid="hero-dot"]')
			.evaluate((el) => getComputedStyle(el).animationName),
	).toMatch(/hero-dot-pulse/); // Svelte scopes @keyframes names

	// Click = re-arm + replay: collapse class drops, metro art returns, the
	// scroll-scrub pin rebuilds, and we ride back to the top.
	await dot.click();
	await expect(banner).not.toHaveClass(/hero-intro-done/, { timeout: 15_000 });
	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBeGreaterThan(0);
	await expect(page.locator('[data-testid="metro-network-container"]')).toBeVisible();
	await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15_000 }).toBeLessThan(8);
});
