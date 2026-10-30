import { expect, test, type Page } from '@playwright/test';

const bands = [
	['/', 'home-cta-band'],
	['/services/database-engineering', 'service-cta-band'],
	['/projects/yesid-dev', 'project-cta-band'],
] as const;

async function expectBand(page: Page, prefix: string) {
	const band = page.getByTestId(prefix);
	const art = band.getByTestId('cta-blueprint-background');
	await expect(band).toBeVisible();
	await expect
		.poll(async () => {
			const [outer, inner] = await Promise.all([band.boundingBox(), art.boundingBox()]);
			if (!outer || !inner) return Number.POSITIVE_INFINITY;
			return Math.max(
				Math.abs(inner.x - outer.x),
				Math.abs(inner.y - outer.y),
				Math.abs(inner.width - outer.width),
				Math.abs(inner.height - outer.height),
			);
		}, { message: `${prefix} art fills the band` })
		.toBeLessThanOrEqual(1);

	const box = (await art.boundingBox())!;
	const heading = (await band.getByRole('heading', { level: 2 }).boundingBox())!;
	const centre = { x: heading.x + heading.width / 2, y: heading.y + heading.height / 2 };
	expect(centre.x).toBeGreaterThanOrEqual(box.x);
	expect(centre.x).toBeLessThanOrEqual(box.x + box.width);
	expect(centre.y).toBeGreaterThanOrEqual(box.y);
	expect(centre.y).toBeLessThanOrEqual(box.y + box.height);

	await expect(art).toHaveAttribute('aria-hidden', 'true');
	await expect(art.locator('a, button, input, select, textarea, [tabindex]')).toHaveCount(0);
	for (const suffix of ['contact', 'github']) {
		const action = page.getByTestId(`${prefix}-${suffix}`);
		await expect(action).toBeVisible();
		const target = (await action.boundingBox())!;
		expect(target.width).toBeGreaterThanOrEqual(44);
		expect(target.height).toBeGreaterThanOrEqual(44);
		await action.focus();
		await expect(action).toBeFocused();
	}
	expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}

for (const [path, prefix] of bands) {
	test(`${path}: the blueprint band fills its section behind a reachable call to action`, async ({ page }) => {
		await page.goto(path);
		await expectBand(page, prefix);
	});
}

test('the band art holds still under reduced motion', { tag: '@motion' }, async ({ page }) => {
	await page.goto('/');
	const art = page.getByTestId('cta-blueprint-background');
	await expect(art).toBeVisible();
	expect(await art.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
});
