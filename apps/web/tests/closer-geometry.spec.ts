import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Run the explicit locale/viewport matrix once, rather than once per device project.
test.skip(({ viewport }) => viewport?.width !== 1440, 'Explicit geometry matrix runs in desktop.');

const viewports = [
	{ width: 360, height: 640 }, { width: 390, height: 844 },
	{ width: 767, height: 900 }, { width: 768, height: 1024 },
	{ width: 820, height: 1180 }, { width: 1023, height: 900 },
	{ width: 1024, height: 900 }, { width: 1440, height: 900 },
	{ width: 1440, height: 1200 },
];

for (const locale of ['en', 'fr', 'es']) {
	for (const viewport of viewports) {
		test(`${locale} ${viewport.width}x${viewport.height} terminus starts flush and finishes before scroll ends`, async ({ page }, testInfo) => {
			await page.setViewportSize(viewport);
			await page.emulateMedia({ reducedMotion: 'no-preference' });
			await page.goto(locale === 'en' ? '/' : `/${locale}`);
			await expect(page.locator('.home-section').first()).toHaveAttribute('style', /--rotated-title-size:/);
			await page.evaluate(() => document.fonts.ready);
			const section = page.getByTestId('closer-section');
			const board = page.getByTestId('closer-board');
			const props = page.locator('[data-slot="construction-props"]');
			await expect(props).toHaveAttribute('data-state', 'hidden');
			await section.evaluate(el => window.scrollBy(0, el.getBoundingClientRect().top));
			await expect(board).toHaveCSS('opacity', '1');
			await expect.poll(() => board.evaluate(el => getComputedStyle(el).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
			const geometry = await section.evaluate(el => {
				const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
				const content = el.parentElement!;
				const heading = content.parentElement!.querySelector('.home-section-heading-mobile')!;
				return {
					gap: box('[data-closer-board]').top - content.getBoundingClientRect().top,
					wrapperGap: el.getBoundingClientRect().top - content.getBoundingClientRect().top,
					headingGap: getComputedStyle(heading).display === 'none' ? null : box('[data-closer-board]').top - heading.getBoundingClientRect().bottom,
					headingTextGap: getComputedStyle(heading).display === 'none' ? null : box('[data-closer-board]').top - heading.querySelector('.section-heading-text')!.getBoundingClientRect().bottom,
					sectionHeight: el.getBoundingClientRect().height,
				};
			});
			console.log(JSON.stringify({ locale, ...viewport, ...geometry }));
			await testInfo.attach('geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
			expect.soft(Math.abs(geometry.gap), 'board begins at the section content top').toBeLessThanOrEqual(1);
			expect.soft(Math.abs(geometry.wrapperGap), 'wrapper adds no top space').toBeLessThanOrEqual(1);
			if (geometry.headingGap !== null) expect.soft(Math.abs(geometry.headingGap), 'board follows the shared heading padding directly').toBeLessThanOrEqual(1);
			if (process.env.S7_EVIDENCE) {
				await mkdir(process.env.S7_EVIDENCE, { recursive: true });
				await writeFile(join(process.env.S7_EVIDENCE, `${locale}-${viewport.width}x${viewport.height}-gap.json`), JSON.stringify(geometry, null, 2));
				if ([390, 820, 1440].includes(viewport.width) && viewport.height !== 1200) {
					await section.evaluate(el => window.scrollBy(0, el.parentElement!.parentElement!.getBoundingClientRect().top));
					await page.screenshot({ path: join(process.env.S7_EVIDENCE, `${locale}-${viewport.width}x${viewport.height}-terminus-top.png`) });
				}
			}

			await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
			await expect(props).toHaveAttribute('data-progress', '1');
			await expect(props).toHaveAttribute('data-state', 'visible');
			await expect.poll(() => props.locator('[data-construction-prop] > svg').evaluateAll(elements => Math.max(...elements.map(el => Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m42))))).toBeLessThan(0.1);
			await expect.poll(() => page.locator('.construction-extension').evaluate(el => Math.abs(el.getBoundingClientRect().height - (innerWidth < 768 ? 0 : 100)))).toBeLessThan(0.1);
			await expect.poll(() => page.locator('.closer-note path').evaluateAll(paths => paths.every(path => getComputedStyle(path).strokeDashoffset === '0px'))).toBe(true);
			const scene = await section.evaluate(el => {
				const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().toJSON();
				return { board: rect('[data-closer-board]'), cta: rect('[data-testid="closer-cta"]'), note: rect('.closer-note'), lamp: rect('[data-slot="closer-floodlight"] svg'),
					props: [...el.querySelectorAll('[data-construction-prop] > svg')].map(svg => svg.getBoundingClientRect().toJSON()), bottom: el.getBoundingClientRect().bottom };
			});
			const overlaps = (a: typeof scene.board, b: typeof scene.board) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
			for (const art of [scene.note, scene.lamp, ...scene.props]) {
				expect(overlaps(art, scene.board) || overlaps(art, scene.cta), 'ending clears board and CTA').toBe(false);
				expect(art.left).toBeGreaterThanOrEqual(-1);
				expect(art.right).toBeLessThanOrEqual(viewport.width + 1);
				expect(art.bottom).toBeLessThanOrEqual(scene.bottom + 1);
			}
			const floor = [scene.lamp, ...scene.props].sort((a, b) => a.left - b.left);
			floor.slice(1).forEach((art, i) => expect(art.left, 'around-fixture artwork stays distinct').toBeGreaterThanOrEqual(floor[i].right - 1));
			expect(Math.abs(scene.bottom - scene.lamp.bottom), 'no empty band below fixture').toBeLessThanOrEqual(1);
			const propsTop = Math.min(...scene.props.map(art => art.top));
			if (viewport.width >= 768) {
				expect(propsTop - scene.cta.bottom, 'top space is removed, not moved beneath the CTA').toBeLessThanOrEqual(80);
			} else {
				expect(propsTop - scene.note.bottom, 'no new empty band between the stacked note and floor').toBeLessThanOrEqual(16);
			}
			if (process.env.S7_EVIDENCE) {
				await page.screenshot({ path: join(process.env.S7_EVIDENCE, `${locale}-${viewport.width}x${viewport.height}-end.png`) });
				await writeFile(join(process.env.S7_EVIDENCE, `${locale}-${viewport.width}x${viewport.height}-scene.json`), JSON.stringify(scene, null, 2));
				if ([390, 820, 1440].includes(viewport.width) && viewport.height !== 1200) {
					await page.screenshot({ path: join(process.env.S7_EVIDENCE, `${locale}-${viewport.width}x${viewport.height}-full.png`), fullPage: true });
				}
			}

			// Reload with the ending halfway revealed, where scroll restoration must
			// preserve the anchor instead of resetting the scene to hidden or finished.
			await page.locator('.ground-anchor').evaluate(anchor => window.scrollBy(0, anchor.getBoundingClientRect().top - innerHeight * 0.825));
			await expect.poll(async () => Number(await props.getAttribute('data-progress'))).toBeCloseTo(0.5, 2);
			const beforeReload = await page.evaluate(() => scrollY);
			await page.reload();
			await expect.poll(() => page.evaluate(y => Math.abs(scrollY - y), beforeReload)).toBeLessThanOrEqual(2);
			await expect.poll(async () => Number(await props.getAttribute('data-progress'))).toBeCloseTo(0.5, 2);
			await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
			await expect(props).toHaveAttribute('data-progress', '1');
			await expect.poll(() => page.locator('.closer-note path').evaluateAll(paths => paths.every(path => getComputedStyle(path).strokeDashoffset === '0px'))).toBe(true);
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await expect(props).toHaveAttribute('data-progress', '1');
			await expect(page.locator('.closer-note')).toHaveCSS('translate', 'none');
		});
	}
}

for (const width of [390, 820, 1440]) {
	test(`${width}px props ease through scroll steps and reversals instead of jumping`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto('/');
		const props = page.locator('[data-slot="construction-props"]');
		await expect(props).toHaveAttribute('data-state', 'hidden');
		const move = (fraction: number) => page.locator('.ground-anchor').evaluate((anchor, fraction) => {
			window.scrollBy(0, anchor.getBoundingClientRect().top - innerHeight * fraction);
		}, fraction);
		const settled = () => expect.poll(() => props.locator('[data-construction-prop] > svg').evaluateAll(elements => {
			const progress = Number(document.querySelector('[data-slot="construction-props"]')!.getAttribute('data-progress'));
			return Math.max(...elements.map(el => Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m42 - (1 - progress) * el.getBoundingClientRect().height)));
		})).toBeLessThan(0.1);
		await move(0.98);
		await settled();
		for (const [fraction, from, to] of [[0.7, 0, 1], [0.98, 1, 0], [0.7, 0, 1]]) {
			const samples = await page.locator('.ground-anchor').evaluate(async (anchor, fraction) => {
				window.scrollBy(0, anchor.getBoundingClientRect().top - innerHeight * fraction);
				// Deliver the actual new scroll position now, then flush Svelte's
				// microtask before creating and pausing transitions in this task.
				window.dispatchEvent(new Event('scroll'));
				await Promise.resolve();
				const artwork = [...document.querySelectorAll('[data-construction-prop] > svg')];
				artwork.forEach(svg => getComputedStyle(svg).transform);
				const transitions = artwork.flatMap(svg => svg.getAnimations().filter((animation): animation is CSSTransition =>
					animation instanceof CSSTransition && animation.transitionProperty === 'transform'));
				// Pause real browser transitions to sample interpolation independently of
				// runner frame rate. No transition means the old instantaneous jump.
				transitions.forEach(animation => animation.pause());
				const positions = [0, 0.25, 0.5, 0.75, 1].map(fraction => {
					transitions.forEach(animation => { animation.currentTime = Number(animation.effect!.getTiming().duration) * fraction; });
					return artwork.map(svg =>
						1 - new DOMMatrixReadOnly(getComputedStyle(svg).transform).m42 / svg.getBoundingClientRect().height);
				});
				transitions.forEach(animation => animation.finish());
				return { count: transitions.length, positions };
			}, fraction);
			expect(samples.count, 'all four props interpolate actual scroll changes').toBe(4);
			for (let prop = 0; prop < 4; prop++) {
				const positions = samples.positions.map(sample => sample[prop]);
				expect(positions[0]).toBeCloseTo(from, 2);
				expect(positions.at(-1)).toBeCloseTo(to, 2);
				for (let i = 1; i < positions.length - 1; i++) {
					expect(positions[i]).toBeGreaterThan(0);
					expect(positions[i]).toBeLessThan(1);
					expect((positions[i] - positions[i - 1]) * (to - from)).toBeGreaterThan(0);
				}
			}
		}
		await move(0.94);
		await settled();
		const beforeWheel = await page.evaluate(() => scrollY);
		await page.mouse.wheel(0, 120);
		await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(beforeWheel);
		await settled();
		await page.emulateMedia({ reducedMotion: 'reduce' });
		for (const svg of await props.locator('[data-construction-prop] > svg').all()) {
			await expect(svg).toHaveCSS('transform', 'none');
			await expect(svg).toHaveCSS('transition-duration', '0s');
		}
	});
}
