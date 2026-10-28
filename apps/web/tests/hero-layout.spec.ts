import { test, expect } from '@playwright/test';

const screens = [[320, 640], [360, 780], [390, 844], [540, 720], [720, 540], [768, 1024], [840, 956], [912, 768], [1024, 768], [1280, 600], [1440, 900]];

for (const [width, height] of screens) {
	for (const theme of ['light', 'dark']) {
		for (const locale of ['en', 'fr', 'es']) {
			test(`${width}x${height} ${theme} ${locale}: hero content and annotation remain clear`, async ({ page }, testInfo) => {
				await page.setViewportSize({ width, height });
				await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
				await page.goto(locale === 'en' ? '/' : `/${locale}`);
				await expect(page.getByTestId('hero-dot-replay')).toBeEnabled();
				await page.evaluate(() => document.fonts.ready);
				await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
				await expect(page.getByTestId('hero-dot-annotation')).toBeVisible();
				await page.getByTestId('hero-dot-annotation').evaluate(async svg => {
					await Promise.allSettled(svg.getAnimations({ subtree: true }).map(animation => animation.finished));
				});
				const geometry = await page.evaluate(() => {
					const get = (id: string) => document.querySelector(`[data-testid="${id}"]`)!;
					const rect = (id: string) => get(id).getBoundingClientRect();
					const label = rect('hero-annotation-label');
					const dot = rect('hero-dot');
					const lastWord = rect('hero-line2-last');
					const path = get('hero-annotation-arrow') as SVGPathElement;
					const matrix = path.getScreenCTM()!;
					const length = path.getTotalLength();
					const tip = path.getPointAtLength(length).matrixTransform(matrix);
					const obstacles: DOMRect[] = ['hero-line1', 'hero-line2'].flatMap((id) => {
						const range = document.createRange();
						const ink = document.createElement('canvas').getContext('2d')!;
						const nodes = document.createTreeWalker(get(id), NodeFilter.SHOW_TEXT);
						const rectangles: DOMRect[] = [];
						while (nodes.nextNode()) {
							if (!nodes.currentNode.textContent?.trim()) continue;
							range.selectNodeContents(nodes.currentNode);
							const style = getComputedStyle(nodes.currentNode.parentElement!);
							ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
							const metrics = ink.measureText(nodes.currentNode.textContent!);
							for (const box of range.getClientRects()) {
								const baseline = box.top + metrics.fontBoundingBoxAscent;
								rectangles.push(new DOMRect(box.left, baseline - metrics.actualBoundingBoxAscent, box.width,
									metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent));
							}
						}
						return rectangles;
					});
					for (const id of ['nav-pill', 'hero-metrics', 'hero-metrics-desktop', 'hero-subheadline', 'hero-subtitle', 'hero-cta-projects', 'hero-cta-contact']) {
						const element = get(id);
						if (element.checkVisibility()) obstacles.push(element.getBoundingClientRect());
					}
					const overlaps = (r: DOMRect) => label.left < r.right && label.right > r.left && label.top < r.bottom && label.bottom > r.top;
					let arrowHits = 0;
					let letteringHits = 0;
					const glyphs = Array.from(get('hero-annotation-label').querySelectorAll<SVGPathElement>('path'));
					const joinAllowance = Math.max(1, parseFloat(getComputedStyle(path).strokeWidth) * 3);
					for (let distance = joinAllowance; distance <= length; distance++) {
						const point = path.getPointAtLength(distance).matrixTransform(matrix);
						if (glyphs.some(glyph => glyph.isPointInStroke(point.matrixTransform(glyph.getScreenCTM()!.inverse())))) letteringHits++;
					}
					const wrappedValues = Array.from(document.querySelectorAll('.hero-viewport-text .metric-value')).filter(el => el.checkVisibility()).filter(el => {
						const range = document.createRange();
						range.selectNodeContents(el);
						const tops = Array.from(range.getClientRects(), box => box.top);
						return Math.max(...tops) - Math.min(...tops) > 1 || el.scrollWidth > el.clientWidth + 1;
					}).length;
					for (let i = 0; i <= 100; i++) {
						const p = path.getPointAtLength(length * i / 100).matrixTransform(matrix);
						if (obstacles.some(r => p.x > r.left - 1 && p.x < r.right + 1 && p.y > r.top - 1 && p.y < r.bottom + 1)) arrowHits++;
					}
					return {
						overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - innerWidth,
						dotOnWordLine: dot.top + dot.height / 2 >= lastWord.top && dot.top + dot.height / 2 <= lastWord.bottom,
						labelInside: label.left >= 0 && label.right <= innerWidth && label.top >= rect('nav-pill').bottom,
						headlineClearsNav: rect('hero-line1').top >= rect('nav-pill').bottom,
						labelHits: obstacles.filter(overlaps).length,
						arrowHits,
						letteringHits,
						wrappedValues,
						arrow: path.getAttribute('d'),
						obstacles: obstacles.map(r => r.toJSON()),
						tipDistance: Math.hypot(tip.x - (dot.left + dot.width / 2), tip.y - (dot.top + dot.height / 2)),
						dotWidth: dot.width,
						textBottom: document.querySelector('.hero-viewport-text')!.getBoundingClientRect().bottom,
						sqlTop: rect('hero-mobile-sql').top,
					};
				});
				await page.screenshot({ path: testInfo.outputPath('hero.png') });
				expect(geometry.overflow).toBeLessThanOrEqual(1);
				expect(geometry.dotOnWordLine).toBe(true);
				expect(geometry.headlineClearsNav).toBe(true);
				expect(geometry.labelInside).toBe(true);
				expect(geometry.labelHits, JSON.stringify(geometry)).toBe(0);
				expect(geometry.arrowHits, JSON.stringify(geometry)).toBe(0);
				expect(geometry.letteringHits, 'the arrow must not strike through the annotation lettering').toBe(0);
				expect(geometry.wrappedValues, JSON.stringify(geometry)).toBe(0);
				expect(geometry.tipDistance, 'the arrow must point to the punctuation dot').toBeLessThan(Math.max(24, geometry.dotWidth * 2));
				if (width < 1024) expect(geometry.sqlTop).toBeGreaterThanOrEqual(geometry.textBottom);
				for (const id of ['hero-cta-projects', 'hero-cta-contact']) {
					await page.getByTestId(id).scrollIntoViewIfNeeded();
					await expect(page.getByTestId(id)).toBeInViewport();
				}
			});
		}
	}
}

test('visible metric and SQL info links open Transit in a new tab', async ({ page, context }) => {
	await context.route('https://transit.yesid.dev/**', route => route.fulfill({ body: '<title>Transit</title>' }));
	await page.goto('/');
	const sources = page.locator('.hero-viewport-text [data-slot="metric-display"], [data-testid="sql-panel"]').filter({ visible: true });
	expect(await sources.count()).toBeGreaterThan(0);
	for (const source of await sources.all()) {
		await expect(source.getByTestId('transit-info-link')).toHaveCount(1);
	}
	const links = page.getByTestId('transit-info-link').filter({ visible: true });
	expect(await links.count()).toBeGreaterThan(0);
	for (const link of await links.all()) {
		await expect(link).toHaveAttribute('title', /\S/);
		await expect(link).toHaveAttribute('rel', /noopener/);
		const popup = page.waitForEvent('popup');
		await link.click();
		const opened = await popup;
		await expect(opened).toHaveURL('https://transit.yesid.dev/');
		await opened.close();
	}
});

for (const locale of ['en', 'fr', 'es']) {
	test(`${locale}: punctuation stays with the final word when layout changes`, async ({ page }) => {
		await page.goto(locale === 'en' ? '/' : `/${locale}`);
		await page.evaluate(() => document.fonts.ready);
		for (const width of [390, 767, 768, 1023, 1024, 1440, 360]) {
			await page.setViewportSize({ width, height: 900 });
			await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
			const together = await page.evaluate(() => {
				const word = document.querySelector('[data-testid="hero-line2-last"]')!.getBoundingClientRect();
				const dot = document.querySelector('[data-testid="hero-dot"]')!.getBoundingClientRect();
				return dot.top + dot.height / 2 >= word.top && dot.top + dot.height / 2 <= word.bottom;
			});
			expect(together, `${width}px punctuation must share the final word's line`).toBe(true);
		}
	});
}

test('below 1024px the SQL example opens from its tab and folds back to it', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	const region = page.getByTestId('hero-mobile-sql');
	// The opener comes first; it stays the same element as its state changes.
	const show = region.getByRole('button').first();
	await expect(show).toHaveAttribute('aria-expanded', 'false');
	await expect(show).toHaveAttribute('aria-controls', /\S/);
	const example = page.locator(`#${await show.getAttribute('aria-controls')}`);
	await expect(example).toHaveAttribute('aria-hidden', 'true');

	await show.click();
	await expect(show).toHaveAttribute('aria-expanded', 'true');
	await expect(example).not.toHaveAttribute('aria-hidden');
	await expect(example.getByTestId('sql-panel')).toBeVisible();

	// The fold-up tab is the example's last control; closing hands focus back to the opener.
	await example.getByRole('button').last().click();
	await expect(show).toHaveAttribute('aria-expanded', 'false');
	await expect(show).toBeFocused();
	await expect(example).toHaveAttribute('aria-hidden', 'true');

	await page.setViewportSize({ width: 1280, height: 800 });
	await expect(region).toBeHidden();
	await expect(page.getByTestId('sql-panel').filter({ visible: true })).toHaveCount(1);
});
