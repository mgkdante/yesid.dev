import { test, expect, type Page } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'Desktop matrix sets both widths and motion preferences.');
});

async function layoutReady(page: Page) {
	await page.evaluate(() => document.activeViewTransition?.finished);
	await page.evaluate(() => document.fonts.ready);
	await expect(page.locator('.mermaid-diagram__fallback')).toHaveCount(0);
	await page.evaluate(() => new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

async function visitListing(page: Page, waitForVisibleListing = true) {
	await page.evaluate(() => {
		const link = document.createElement('a');
		link.href = '/projects';
		link.textContent = 'Fixture visit listing';
		link.style.cssText = 'position:fixed;bottom:100px;right:30px;z-index:200';
		document.body.append(link);
	});
	const before = await page.getByRole('link', { name: 'Fixture visit listing' }).evaluate((link) => {
		const y = window.scrollY;
		(link as HTMLAnchorElement).click();
		return y;
	});
	await expect(page).toHaveURL(/\/projects$/);
	if (waitForVisibleListing) {
		// The URL changes before the old-page snapshot stops covering the listing.
		await layoutReady(page);
		await expect(page.locator('main h1')).toBeVisible();
	}
	return before;
}

for (const width of [1440, 1280]) {
	for (const reducedMotion of ['reduce', 'no-preference'] as const) {
		test.describe(`${width}px, motion=${reducedMotion}`, () => {
			test.use({ viewport: { width, height: 900 }, contextOptions: { reducedMotion } });

			for (const detail of [
				{ path: '/projects/yesid-dev', diagrams: true },
				{ path: '/services/web-development', diagrams: false },
			]) {
				test(`Back keeps the settled offset on ${detail.path}`, async ({ page }) => {
					await page.goto(detail.path);
					await expect(page.getByTestId('sections-toggle').filter({ visible: true }).first()).toBeVisible();
					await layoutReady(page);
					if (detail.diagrams) await expect(page.locator('.mermaid-diagram svg').first()).toBeVisible();
					else await expect(page.locator('.mermaid-diagram')).toHaveCount(0);
					const documentStarted = await page.evaluate(() => performance.timeOrigin);
					await page.evaluate(() => window.scrollTo(0, 1400));
					await layoutReady(page);
					const before = await visitListing(page);
					expect(before).toBeGreaterThan(0);
					await page.goBack();
					await expect(page).toHaveURL(detail.path);
					await layoutReady(page);
					expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStarted);
					await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(before, 0);
				});
			}

			test('normal anchoring resumes after Back when a diagram above the reader grows', async ({ page }) => {
				await page.goto('/projects/yesid-dev');
				await layoutReady(page);
				await visitListing(page);
				await page.goBack();
				await expect(page).toHaveURL('/projects/yesid-dev');
				await layoutReady(page);
				const diagram = page.locator('.mermaid-diagram').first();
				await expect(diagram.locator('svg')).toBeVisible();
				await diagram.evaluate((el) => {
					const reader = document.createElement('p');
					reader.id = 'fixture-reader';
					reader.textContent = 'Keep this line in place while the diagram above changes height.';
					// Put the diagram entirely above the viewport: the reader has moved on.
					const gap = document.createElement('div');
					gap.style.height = '1200px';
					const tail = document.createElement('div');
					tail.style.height = '1800px';
					el.after(gap, reader, tail);
					window.scrollTo(0, window.scrollY + reader.getBoundingClientRect().top - 225);
				});
				await layoutReady(page);
				const reader = page.locator('#fixture-reader');
				const before = (await reader.boundingBox())!.y;
				const scrollBefore = await page.evaluate(() => window.scrollY);
				expect(before).toBeCloseTo(225, 0);
				expect(await diagram.evaluate((el) => el.getBoundingClientRect().bottom)).toBeLessThan(0);
				await diagram.evaluate((el) => {
					const extra = document.createElement('div');
					extra.style.height = '160px';
					el.append(extra);
				});
				await expect.poll(async () => (await reader.boundingBox())!.y).toBeCloseTo(before, 0);
				await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(scrollBefore + 160, 0);
			});
		});
	}
}

test.describe('navigation interrupted before the listing appears', () => {
	test.use({ viewport: { width: 1440, height: 900 }, contextOptions: { reducedMotion: 'no-preference' } });
	// Rapid Back: 1400 to 1484, full document reload via the +layout.svelte guard.
	test.fixme('Back during the outgoing transition reaches the reload guard', async ({ page }) => {
		await page.goto('/projects/yesid-dev');
		await layoutReady(page);
		await page.evaluate(() => window.scrollTo(0, 1400));
		const before = await visitListing(page, false);
		await page.goBack();
		await expect(page).toHaveURL('/projects/yesid-dev');
		await layoutReady(page);
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(before, 0);
	});
});
