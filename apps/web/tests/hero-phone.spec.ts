import { devices, test, expect } from '@playwright/test';

// Include expanded/collapsed browser chrome and a shorter Android viewport.
const phones = [[384, 660], [412, 744], [412, 820]];

for (const [width, height] of phones) {
	for (const locale of ['en', 'fr', 'es']) {
		test(`${width}x${height} ${locale}: phone headline retains visual hierarchy`, async ({ browser, baseURL }, testInfo) => {
			const context = await browser.newContext({ ...devices['Pixel 7'], baseURL, viewport: { width, height } });
			const page = await context.newPage();
			try {
				// A fractional layout/window mismatch must not collapse the title.
				await page.addInitScript(() => Object.defineProperty(window, 'innerHeight', {
					configurable: true, get: () => document.documentElement.clientHeight - 0.5,
				}));
				await page.goto(locale === 'en' ? '/' : `/${locale}`);
				await page.evaluate(() => document.fonts.ready);
				await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
				await expect(page.getByTestId('hero-dot-annotation')).toBeVisible();
				await expect.poll(() => page.getByTestId('hero-dot-annotation').evaluate(svg =>
					svg.getAnimations({ subtree: true }).every(animation => animation.playState !== 'running'))).toBe(true);
				const geometry = await page.evaluate(() => {
					const firstWord = (element: Element) => {
						const nodes = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
						while (nodes.nextNode()) {
							const match = nodes.currentNode.textContent?.match(/\S+/);
							if (!match) continue;
							const range = document.createRange();
							range.setStart(nodes.currentNode, match.index!);
							range.setEnd(nodes.currentNode, match.index! + match[0].length);
							return range.getBoundingClientRect();
						}
						throw new Error('Expected readable text in the hero');
					};
					const headline = firstWord(document.querySelector('h1')!);
					const supporting = firstWord(document.querySelector('[data-testid="hero-subtitle"]')!);
					return {
						prominence: headline.height / supporting.height,
						navClearance: headline.top - document.querySelector('[data-testid="nav-pill"]')!.getBoundingClientRect().bottom,
						overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth,
					};
				});
				await page.screenshot({ path: testInfo.outputPath('phone.png') });
				expect(geometry.prominence, 'the title should remain visually dominant over supporting copy').toBeGreaterThan(2);
				expect(geometry.navClearance).toBeGreaterThanOrEqual(0);
				expect(geometry.overflow).toBeLessThanOrEqual(1);
				for (const id of ['hero-cta-projects', 'hero-cta-contact']) {
					await page.getByTestId(id).scrollIntoViewIfNeeded();
					await expect(page.getByTestId(id)).toBeInViewport();
				}
			} finally { await context.close(); }
		});
	}
}
