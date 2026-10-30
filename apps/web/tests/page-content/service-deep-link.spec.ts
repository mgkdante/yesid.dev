import { test, expect, type Page } from '@playwright/test';

async function expectStation(page: Page, id: string) {
	const card = page.locator(`#service-${id}`);
	let previousTop = Number.NaN;
	let stableSamples = 0;
	await expect
		.poll(
			async () => {
				const { top, margin } = await card.evaluate((element) => ({
					top: element.getBoundingClientRect().top,
					margin: parseFloat(getComputedStyle(element).scrollMarginTop) || 0,
				}));
				stableSamples =
					Math.abs(top - margin) < 2 && Math.abs(top - previousTop) < 0.1
						? stableSamples + 1
						: 0;
				previousTop = top;
				return stableSamples;
			},
			{ intervals: [100], timeout: 10_000 }
		)
		.toBeGreaterThanOrEqual(3);
	await expect(page.getByTestId(`station-tab-${id}`)).toHaveAttribute(
		'aria-selected',
		'true'
	);
	expect(new URL(page.url()).searchParams.get('station')).toBe(id);
	expect(new URL(page.url()).searchParams.get('source')).toBe('deep-link');
}

test('station deep link, reload and history', async ({
	page,
}) => {
	await page.goto('/services?station=data-pipeline&source=deep-link');
	for (const reload of [false, true]) {
		if (reload) await page.reload();
		await expectStation(page, 'data-pipeline');
	}
	const ids = await page
		.locator('[data-testid^="station-tab-"]')
		.evaluateAll((tabs) =>
			tabs.map((tab) =>
				tab.getAttribute('data-testid')!.slice('station-tab-'.length)
			)
		);
	const other = ids[(ids.indexOf('data-pipeline') + 1) % ids.length];
	expect(other).not.toBe('data-pipeline');
	await page.getByTestId(`station-tab-${other}`).press('Enter');
	await expectStation(page, other);
	await page.goto('/about');
	await page.goBack();
	await expectStation(page, other);
	await page.goForward();
	await expect(page).toHaveURL(/\/about$/);
	await page.goBack();
	await expectStation(page, other);
	await page.getByTestId('station-tab-data-pipeline').press('Enter');
	await expectStation(page, 'data-pipeline');
});
