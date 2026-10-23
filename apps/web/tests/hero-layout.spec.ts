import { test, expect } from '@playwright/test';

const screens = [[320, 640], [360, 780], [390, 844], [540, 720], [720, 540], [768, 1024], [840, 956], [912, 768], [1024, 768], [1280, 600], [1440, 900]];

for (const [width, height] of screens) {
	for (const theme of ['light', 'dark']) {
		for (const [locale, label] of [['en', 'click me'], ['fr', 'clique ici'], ['es', 'haz clic']]) {
			test(`${width}x${height} ${theme} ${locale}: hero density and annotation geometry`, async ({ page }, testInfo) => {
				await page.setViewportSize({ width, height });
				await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
				await page.goto(locale === 'en' ? '/' : `/${locale}`);
				await expect(page.getByTestId('hero-dot-replay')).toBeEnabled();
				await page.evaluate(() => document.fonts.ready);
				await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
				await expect(page.getByTestId('hero-kicker')).toHaveCount(0);
				await expect(page.getByTestId('hero-annotation-label')).toHaveText(label);
				await expect(page.getByTestId('hero-dot-annotation')).toBeVisible();
				await expect.poll(() => page.getByTestId('hero-annotation-tip').evaluate(el => parseFloat(getComputedStyle(el).strokeDashoffset))).toBe(0);
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
					const start = path.getPointAtLength(0).matrixTransform(matrix);
					const lettering = Array.from(document.querySelectorAll('[data-testid="hero-annotation-letter"]')).at(-1) as SVGPathElement;
					const letterEnd = lettering.getPointAtLength(lettering.getTotalLength()).matrixTransform(lettering.getScreenCTM()!);
					const arrowTip = get('hero-annotation-tip') as SVGPathElement;
					const tipJoin = arrowTip.getPointAtLength(arrowTip.getTotalLength() / 2).matrixTransform(arrowTip.getScreenCTM()!);
					const labelMatrix = (get('hero-annotation-label') as SVGGElement).getScreenCTM()!;
					const labelLeft = new DOMPoint(0, 16).matrixTransform(labelMatrix);
					const labelRight = new DOMPoint(80, 16).matrixTransform(labelMatrix);
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
					const glyphs = Array.from(document.querySelectorAll<SVGPathElement>('[data-testid="hero-annotation-letter"]'));
					for (let distance = 5; distance <= length; distance++) {
						const point = path.getPointAtLength(distance).matrixTransform(matrix);
						if (glyphs.some(glyph => glyph.isPointInStroke(point.matrixTransform(glyph.getScreenCTM()!.inverse())))) letteringHits++;
					}
					const wrappedValues = Array.from(document.querySelectorAll('.metric-value')).filter(el => el.checkVisibility()).filter(el => {
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
						labelInside: label.left >= 0 && label.right <= innerWidth && label.top >= rect('nav-pill').bottom + 8,
						labelHits: obstacles.filter(overlaps).length,
						arrowHits,
						letteringHits,
						wrappedValues,
						arrow: path.getAttribute('d'),
						obstacles: obstacles.map(r => r.toJSON()),
						letterGap: Math.hypot(start.x - letterEnd.x, start.y - letterEnd.y),
						tipJoinGap: Math.hypot(tip.x - tipJoin.x, tip.y - tipJoin.y),
						lineGap: Math.abs(new DOMPoint(0, 16).matrixTransform((get('hero-annotation-label') as SVGGElement).getScreenCTM()!).y - document.querySelector('.annotation-slot')!.getBoundingClientRect().top),
						tiltRise: labelLeft.y - labelRight.y,
						labelsLeft: Array.from(document.querySelectorAll('.metric-label')).filter(el => el.checkVisibility()).every(el => getComputedStyle(el).justifyContent === 'start'),
						tipDistance: Math.hypot(tip.x - (dot.left + dot.width / 2), tip.y - (dot.top + dot.height / 2)),
						textBottom: document.querySelector('.hero-viewport-text')!.getBoundingClientRect().bottom,
						headlineSize: parseFloat(getComputedStyle(get('hero-line1')).fontSize),
						subtitleSize: getComputedStyle(get('hero-subtitle')).fontSize,
						panelHeight: document.querySelector('.hero-pin')!.getBoundingClientRect().height,
						sqlTop: rect('hero-mobile-sql').top,
						mobileMetrics: Array.from(get('metric-card-mobile').querySelectorAll('[data-slot="metric-display"]')).map(el => el.getBoundingClientRect().toJSON()),
					};
				});
				await page.screenshot({ path: testInfo.outputPath('hero.png') });
				expect(geometry.overflow).toBeLessThanOrEqual(1);
				expect(geometry.dotOnWordLine).toBe(true);
				expect(geometry.labelInside).toBe(true);
				expect(geometry.labelHits, JSON.stringify(geometry)).toBe(0);
				expect(geometry.arrowHits, JSON.stringify(geometry)).toBe(0);
				expect(geometry.letteringHits, JSON.stringify(geometry)).toBe(0);
				expect(geometry.wrappedValues, JSON.stringify(geometry)).toBe(0);
				expect(geometry.letterGap).toBeLessThan(5);
				expect(geometry.tipJoinGap).toBeLessThan(0.1);
				expect(geometry.tiltRise).toBeGreaterThan(3);
				expect(geometry.tiltRise).toBeLessThan(16);
				expect(geometry.labelsLeft).toBe(true);
				expect(geometry.tipDistance).toBeGreaterThan(4);
				expect(geometry.tipDistance).toBeLessThan(36);
				expect(geometry.subtitleSize).toBe('16px');
				if (width >= 768 && width < 1024 && height >= 768) expect(geometry.headlineSize).toBeGreaterThanOrEqual(56);
				if (width < 1024) {
					expect(geometry.lineGap).toBeLessThan(1);
					expect(geometry.sqlTop).toBeGreaterThanOrEqual(geometry.textBottom);
					expect(geometry.panelHeight).toBeGreaterThanOrEqual(height - 1);
					if (height >= 640) expect(geometry.panelHeight).toBeLessThanOrEqual(height + 1);
				}
				if (width < 480) {
					expect(geometry.mobileMetrics[1].top).toBeGreaterThanOrEqual(geometry.mobileMetrics[0].bottom);
					expect(geometry.mobileMetrics[2].top).toBeGreaterThanOrEqual(geometry.mobileMetrics[1].bottom);
				}
			});
		}
	}
}

test('each metric and SQL info link opens Transit in a new tab', async ({ page, context }) => {
	await context.route('https://transit.yesid.dev/**', route => route.fulfill({ body: '<title>Transit</title>' }));
	await page.goto('/');
	const links = page.getByTestId('transit-info-link').filter({ visible: true });
	await expect(links).toHaveCount(4);
	for (const link of await links.all()) {
		await expect(link).toHaveAttribute('title', /Transit/);
		await expect(link).toHaveAttribute('rel', /noopener/);
		const popup = page.waitForEvent('popup');
		await link.click();
		const opened = await popup;
		await expect(opened).toHaveURL('https://transit.yesid.dev/');
		await opened.close();
	}
});

for (const locale of ['en', 'fr', 'es']) {
	test(`${locale}: punctuation stays with the final word through a resize sweep`, async ({ page }) => {
		test.setTimeout(90_000);
		await page.goto(locale === 'en' ? '/' : `/${locale}`);
		await page.evaluate(() => document.fonts.ready);
		for (let width = 240; width <= 1632; width += 32) {
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
