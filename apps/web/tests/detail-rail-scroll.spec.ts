import { expect, test, type Locator, type Page } from '@playwright/test';

// A short laptop window: detail rails must stay inside it and scroll on their own, as in Transit.
const SHORT_LAPTOP = { width: 1280, height: 600 };
const PAGES = ['/projects/transit-data-pipeline', '/services/database-engineering'];
const RAILS = '[data-slot="detail-shell-left"], [data-slot="detail-shell-right"]';

async function visibleRails(page: Page): Promise<Locator[]> {
	const rails: Locator[] = [];
	for (const rail of await page.locator(RAILS).all()) if (await rail.isVisible()) rails.push(rail);
	return rails;
}

for (const path of PAGES) {
	test(`${path} rails fit a short laptop window and scroll on their own`, async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'Detail rails show from 1024px; one desktop run covers them');
		await page.setViewportSize(SHORT_LAPTOP);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto(path);
		const rails = await visibleRails(page);
		expect(rails.length, 'the page shows at least one detail rail').toBeGreaterThan(0);

		for (const rail of rails) {
			// Scroll the page past the rail's own start so it is parked at its sticky top.
			await rail.evaluate((node) => window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY));
			const geometry = await rail.evaluate((node) => {
				node.scrollTop = node.scrollHeight;
				const last = node.lastElementChild ?? node;
				return {
					railBottom: node.getBoundingClientRect().bottom,
					lastBottom: last.getBoundingClientRect().bottom,
					viewport: window.innerHeight,
				};
			});
			expect(geometry.railBottom, 'the rail stays inside the window').toBeLessThanOrEqual(geometry.viewport + 1);
			expect(geometry.lastBottom, 'the end of the rail is reachable').toBeLessThanOrEqual(geometry.viewport + 1);
		}
	});
}
