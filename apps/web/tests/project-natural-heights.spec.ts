import { test, expect } from '@playwright/test';

for (const path of ['/projects', '/']) {
	test(`${path} cards use natural phone rows and align at multi-column widths after resizing`, async ({ page }, testInfo) => {
		await page.route(/web3forms|cal\.com|plausible|\/api\/event/, route => route.abort());
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto(path);
		const cards = page.getByTestId(path === '/' ? 'proof-card' : 'project-card');
		await expect(cards.first()).toBeVisible();
		for (const theme of ['dark', 'light']) {
			await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
			for (const width of [1440, 390, 800, 1440]) {
				await page.setViewportSize({ width, height: 900 });
				await cards.first().scrollIntoViewIfNeeded();
				await page.evaluate(() => document.fonts.ready);
				try {
					await expect.poll(async () => cards.evaluateAll((nodes, singleColumn) => {
						const ids = ['project-card-title', 'proof-card-title', 'project-card-excerpt', 'proof-excerpt', 'project-card-services', 'project-card-links', 'proof-card-links'];
						return ids.every(id => {
							const rows = nodes.flatMap(node => [...node.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`)]);
							if (!rows.length) return true; // Each placement supplies its own title, excerpt and link IDs.
							const heights = rows.map(row => row.getBoundingClientRect().height);
							if (!singleColumn) return Math.max(...heights) - Math.min(...heights) <= 1;
							return rows.every((row, index) => {
								const minimum = row.style.minHeight;
								row.style.minHeight = '0px';
								const natural = row.getBoundingClientRect().height;
								row.style.minHeight = minimum;
								return Math.abs(heights[index] - natural) <= 1;
							});
						});
					}, width === 390 || (path === '/projects' && width === 800))).toBe(true);
				} finally {
					await page.screenshot({ path: testInfo.outputPath(`${theme}-${width}.png`) });
				}
				if (width === 390 && path === '/') {
					const heights = await cards.evaluateAll(nodes => nodes.map(node => Math.round(node.getBoundingClientRect().height)));
					expect(new Set(heights).size, 'single-card carousel slides retain different natural heights').toBeGreaterThan(1);
				}
			}
		}
	});
}
