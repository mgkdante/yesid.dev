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

for (const locale of ['', '/fr', '/es'])
	test(`long stations track forward and reverse without rewriting the URL: ${locale || 'en'}`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1366, height: 600 });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto(`${locale}/services?fixture=retained`);
		await expect(page.locator('[data-testid="service-listing-page"]')).toBeVisible();
		const ids = await page.locator('.service-viewport').evaluateAll((cards) =>
			cards.map((card) => {
				(card as HTMLElement).style.minHeight = '1800px';
				return card.id.slice('service-'.length);
			}),
		);
		expect(ids.length).toBeGreaterThan(1);
		for (let cycle = 0; cycle < 3; cycle++)
			for (const id of [...ids, ...ids.slice().reverse()]) {
				await page
					.locator(`#service-${id}`)
					.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 160));
				await expect(page.getByTestId(`station-tab-${id}`)).toHaveAttribute(
					'aria-selected',
					'true',
				);
				const title = (await page.locator(`#service-${id} .service-title`).innerText()).replace(
					/\.$/,
					'',
				);
				await expect(page.getByTestId('projects-strip').locator('.strip-label')).toContainText(
					title,
				);
				expect(new URL(page.url()).search).toBe('?fixture=retained');
			}
	});

for (const width of [1024, 1366])
	test(`long service content remains inside its station at ${width}x600`, async ({ page }) => {
		await page.setViewportSize({ width, height: 600 });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/fr/services');
		const card = page.locator('.service-viewport').first();
		await expect(card.locator('.service-description')).toBeVisible();
		await card.locator('.service-description').evaluate((el) => {
			el.textContent =
				'Un service avec une description détaillée et des exigences variables. '.repeat(24);
		});
		const bounds = await card.evaluate((el) => {
			const card = el.getBoundingClientRect(),
				inner = el.querySelector('.viewport-inner')!.getBoundingClientRect();
			return {
				cardBottom: card.bottom,
				innerBottom: inner.bottom,
				cardTop: card.top,
				innerTop: inner.top,
			};
		});
		expect(
			bounds.innerBottom,
			'content must not overlap the following station',
		).toBeLessThanOrEqual(bounds.cardBottom + 1);
		expect(bounds.innerTop).toBeGreaterThanOrEqual(bounds.cardTop);
	});

test('station activation follows a short viewport resize and cleared deep link', async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.setViewportSize({ width: 1366, height: 600 });
	await page.goto('/services');
	const tabs = page.locator('[data-testid^="station-tab-"]');
	await expect(tabs.first()).toBeVisible();
	const id = (await tabs.nth(1).getAttribute('data-testid'))!.slice('station-tab-'.length);
	await page.setViewportSize({ width: 683, height: 300 });
	await expect(async () => {
		await tabs.nth(1).press('Enter');
		await expect(page).toHaveURL(new RegExp(`station=${id}`), {
			timeout: 1000,
		});
	}).toPass();
	await expect(page.getByTestId(`station-tab-${id}`)).toHaveAttribute('aria-selected', 'true');
	await page.reload();
	await expect(page.getByTestId(`station-tab-${id}`)).toHaveAttribute('aria-selected', 'true');
	await page.setViewportSize({ width: 1024, height: 600 });
	await page
		.locator(`#service-${id}`)
		.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY));
	await expect(page.getByTestId(`station-tab-${id}`)).toHaveAttribute('aria-selected', 'true');
});
