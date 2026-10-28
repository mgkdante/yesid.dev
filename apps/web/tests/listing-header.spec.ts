import { expect, test } from '@playwright/test';

import { menuItems } from '../src/lib/content/nav';

// Every menu page that renders the package listing header.
test('listing headers draw at the package ink and rest their copy on the band floor', async ({ page }) => {
	let listings = 0;
	for (const { href } of menuItems) {
		await page.goto(href);
		const header = page.locator('[data-slot="blueprint-listing-header"]');
		if (!(await header.count())) continue;
		listings += 1;
		await page.evaluate(() => document.fonts.ready);
		for (const theme of ['dark', 'light'] as const) {
			const { ink, drawings, gap } = await header.evaluate((band, theme) => {
				document.documentElement.dataset.theme = theme;
				const art = band.querySelector('[data-slot="blueprint-listing-art"]')!;
				// What a drawing shows: its own opacity times its wrappers' inside the art slot.
				const rendered = (drawing: Element) => {
					let opacity = 1;
					for (let node: Element | null = drawing; node && node !== art; node = node.parentElement) {
						opacity *= Number(getComputedStyle(node).opacity);
					}
					return opacity;
				};
				const content = band.querySelector('[data-slot="blueprint-listing-content"]')!;
				const copy = [content.firstElementChild!.lastElementChild!, ...[...content.children].slice(1)];
				const lowest = Math.max(...copy.map((element) => element.getBoundingClientRect().bottom));
				return {
					ink: Number(getComputedStyle(art).getPropertyValue('--blueprint-ink')),
					drawings: [...art.querySelectorAll('svg')].map(rendered),
					gap: band.getBoundingClientRect().bottom - parseFloat(getComputedStyle(content).paddingBottom) - lowest,
				};
			}, theme);
			expect(ink, `${href} ${theme}`).toBeGreaterThan(0);
			expect(drawings.length, `${href} ${theme}`).toBeGreaterThan(1);
			for (const opacity of drawings) expect(opacity, `${href} ${theme}`).toBeCloseTo(ink, 3);
			expect(Math.abs(gap), `${href} ${theme}`).toBeLessThanOrEqual(1);
		}
	}
	expect(listings).toBeGreaterThan(0);
});
