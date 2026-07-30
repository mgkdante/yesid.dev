// Services listing page mobile-flow spec — slice-19 Phase 4 Task 26.
// Runs on every Playwright project (desktop-chrome + 3 mobile profiles).

import { test, expect } from '@playwright/test';

test('services page loads + service card is visible', async ({ page }) => {
	await page.goto('/services');

	// Service listing page container — web-first expect auto-waits for it to
	// attach + render, which is exactly what networkidle was implicitly guarding.
	await expect(page.locator('[data-testid="service-listing-page"]')).toBeVisible();

	// ServiceCard renders both .desktop-only and .mobile-only CTAs in the DOM;
	// filter to the first that is actually visible in the current viewport.
	const firstServiceLink = page.locator('a[href^="/services/"]').filter({ visible: true }).first();
	await expect(firstServiceLink).toBeVisible();
});

test('services page deep-dive CTA meets 44px touch target height', async ({ page }) => {
	await page.goto('/services');

	// Grab the first visible service link and measure its rendered height. The
	// web-first expect below auto-waits for the link to be visible, which is what
	// networkidle was implicitly guarding before the boundingBox() read.
	const firstServiceLink = page.locator('a[href^="/services/"]').filter({ visible: true }).first();
	await expect(firstServiceLink).toBeVisible();

	const box = await firstServiceLink.boundingBox();
	expect(box).not.toBeNull();
	if (box) {
		expect(box.height).toBeGreaterThanOrEqual(44);
	}
});

test('375px station tab clicks land every service card below the tabs', async ({ page }) => {
	test.skip(test.info().project.name !== 'iphone-se', '375px geometry contract');
	await page.goto('/services');
	await expect(page.locator('[data-testid="service-listing-page"]')).toBeVisible();
	await page.evaluate(async () => {
		await document.fonts.ready;
	});

	const tabsBar = page.locator('[data-testid="service-listing-page"] > .tabs-bar');
	const stripGeometry = await tabsBar.evaluate((element) => ({
		rendered: element.getBoundingClientRect().height,
		target: Number.parseFloat(
			getComputedStyle(document.querySelector<HTMLElement>('.circuit-grid')!)
				.getPropertyValue('--strip-h'),
		),
	}));
	expect(Math.abs(stripGeometry.rendered - stripGeometry.target)).toBeLessThanOrEqual(1);

	const stationIds = await page
		.locator('[data-testid^="station-tab-"]')
		.evaluateAll((tabs) => tabs.map((tab) => tab.getAttribute('data-testid')!.slice('station-tab-'.length)));
	const clickOrder = [...stationIds.slice(1), stationIds[0]!];

	for (const stationId of clickOrder) {
		await page.getByTestId(`station-tab-${stationId}`).click();
		await expect(page).toHaveURL(new RegExp(`[?&]station=${stationId}(?:&|$)`));
		await expect
			.poll(
				() =>
					page.evaluate((id) => {
						const card = document.querySelector<HTMLElement>(`#service-${id}`)!;
						const tabs = document.querySelector<HTMLElement>(
							'[data-testid="service-listing-page"] > .tabs-bar',
						)!;
						const cardTop = card.getBoundingClientRect().top;
						return (
							cardTop >= tabs.getBoundingClientRect().bottom &&
							cardTop <= Number.parseFloat(getComputedStyle(card).scrollMarginTop) + 1
						);
					}, stationId),
				{ timeout: 10_000 },
			)
			.toBe(true);

		await page.evaluate(async (id) => {
			const card = document.querySelector<HTMLElement>(`#service-${id}`)!;
			let previousScrollY = window.scrollY;
			let previousCardTop = card.getBoundingClientRect().top;
			let stableForMs = 0;
			const deadline = performance.now() + 10_000;

			while (stableForMs < 250) {
				await new Promise((resolve) => setTimeout(resolve, 50));
				const scrollY = window.scrollY;
				const cardTop = card.getBoundingClientRect().top;
				if (
					Math.abs(scrollY - previousScrollY) <= 0.1 &&
					Math.abs(cardTop - previousCardTop) <= 0.1
				) {
					stableForMs += 50;
				} else {
					stableForMs = 0;
				}
				previousScrollY = scrollY;
				previousCardTop = cardTop;
				if (performance.now() > deadline) {
					throw new Error(`Scroll did not settle for station ${id}`);
				}
			}
		}, stationId);

		const landing = await page.evaluate((id) => {
			const card = document.querySelector<HTMLElement>(`#service-${id}`)!;
			const tabs = document.querySelector<HTMLElement>(
				'[data-testid="service-listing-page"] > .tabs-bar',
			)!;
			return {
				cardTop: card.getBoundingClientRect().top,
				tabsBottom: tabs.getBoundingClientRect().bottom,
				scrollMarginTop: Number.parseFloat(getComputedStyle(card).scrollMarginTop),
			};
		}, stationId);
		expect(landing.cardTop).toBeGreaterThanOrEqual(landing.tabsBottom);
		expect(landing.cardTop).toBeLessThanOrEqual(landing.scrollMarginTop + 1);
	}
});
