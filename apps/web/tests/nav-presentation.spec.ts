import { test, expect } from '@playwright/test';

for (const width of [375, 768, 1366]) {
	test(`expanded menu centers its content on one continuous surface at ${width}px`, async ({ page }, testInfo) => {
		await page.setViewportSize({ width, height: 667 });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/legal/privacy');
		await page.evaluate(() => document.fonts.ready);
		// A page surface below the closed navbar must never cover its controls.
		await page.evaluate(() => {
			const surface = document.createElement('div');
			surface.id = 'page-surface';
			surface.style.cssText = 'position:fixed;inset:0;z-index:45;background:white';
			document.body.append(surface);
		});
		expect(await page.getByTestId('nav-menu-toggle').evaluate(el => {
			const box = el.getBoundingClientRect();
			return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
		})).toBe(true);
		await page.evaluate(() => document.getElementById('page-surface')!.remove());
		await expect(page.locator('.menu-dialog')).not.toHaveAttribute('aria-modal');
		for (const selector of ['.nav-pill', '.nav-collapsible', '.menu-toggle-line'])
			for (const element of await page.locator(selector).all()) await expect(element).toHaveCSS('transition-duration', '0s');
		await expect(async () => {
			if (!(await page.getByRole('dialog').count())) await page.getByTestId('nav-menu-toggle').press('Enter');
			await expect(page.getByRole('dialog')).toBeVisible();
		}).toPass();
		for (const theme of ['dark', 'light']) {
			await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
			await page.locator('.menu-overlay').evaluate(el => { el.scrollTop = 0; });
			await page.screenshot({ path: testInfo.outputPath(`menu-${width}-${theme}.png`) });
			const geometry = await page.locator('.menu-content').evaluate(el => {
				const box = el.getBoundingClientRect();
				const text = [...el.querySelectorAll('.menu-text')].map(node => node.getBoundingClientRect().right);
				return { left: box.left, right: Math.max(...text), center: innerWidth / 2 };
			});
			expect(Math.abs((geometry.left + geometry.right) / 2 - geometry.center)).toBeLessThanOrEqual(2);
			const surface = await page.getByRole('dialog').evaluate(el => {
				const panel = el.querySelector('.menu-overlay')!;
				return { top: el.getBoundingClientRect().top, height: el.getBoundingClientRect().height,
					background: getComputedStyle(el).backgroundImage,
					panelColor: getComputedStyle(panel).backgroundColor, panelImage: getComputedStyle(panel).backgroundImage };
			});
			expect(surface).toMatchObject({ top: 0, height: 667, panelColor: 'rgba(0, 0, 0, 0)', panelImage: 'none' });
			expect(surface.background).toContain('radial-gradient');
			await page.locator('.menu-overlay').evaluate(el => { el.scrollTop = el.scrollHeight; });
			const footer = await page.locator('.menu-footer').boundingBox();
			expect(footer!.y + footer!.height).toBeLessThanOrEqual(667);
			if (width === 1366) await page.screenshot({ path: testInfo.outputPath(`menu-footer-${theme}.png`) });
		}
	});

	test(`navbar retains its painted elements while shrinking and expanding at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 667 });
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto('/legal/privacy');
		await page.evaluate(() => document.fonts.ready);
		await expect(page.getByTestId('nav-pill')).toBeVisible();
		// Hydration is observable through the first successful menu interaction.
		await expect(async () => {
			if (!(await page.getByRole('dialog').count())) await page.getByTestId('nav-menu-toggle').press('Enter');
			await expect(page.getByRole('dialog')).toBeVisible();
		}).toPass();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await expect.poll(() => page.getByTestId('nav-pill').evaluate(el => el.getAnimations({ subtree: true }).filter(a => a instanceof CSSTransition).length)).toBe(0);
		for (let cycle = 0; cycle < 3; cycle++) {
			const original = await page.getByTestId('nav-pill').elementHandle();
			const sample = await page.getByTestId('nav-pill').evaluate(async (pill) => {
				const toggle = pill.querySelector<HTMLElement>('[data-testid="nav-menu-toggle"]')!;
				const closed = pill.getBoundingClientRect().width;
				toggle.click();
				const widths: number[] = [];
				for (let frame = 0; frame < 30; frame++) {
					await new Promise(requestAnimationFrame);
					widths.push(pill.getBoundingClientRect().width);
				}
				return { same: pill === document.querySelector('[data-testid="nav-pill"]'), closed,
					open: widths.at(-1)!, intermediate: widths.some(value => value < closed - 1 && value > widths.at(-1)! + 1) };
			});
			expect(sample.same).toBe(true);
			expect(sample.closed).toBeGreaterThan(sample.open);
			expect(sample.intermediate).toBe(true);
			await expect(page.getByTestId('nav-menu-toggle')).toBeFocused();
			const growing = original!.evaluate(async pill => {
				const widths: number[] = [];
				for (let frame = 0; frame < 50; frame++) {
					await new Promise(requestAnimationFrame);
					widths.push(pill.getBoundingClientRect().width);
				}
				return { same: pill === document.querySelector('[data-testid="nav-pill"]'), widths };
			});
			await page.keyboard.press('Escape');
			const growth = await growing;
			expect(growth.same).toBe(true);
			expect(growth.widths.some(value => value > sample.open + 1 && value < sample.closed - 1)).toBe(true);
			await original!.dispose();
			await expect(page.getByRole('dialog')).toHaveCount(0);
			await expect(page.getByTestId('nav-menu-toggle')).toBeFocused();
			await expect.poll(() => page.getByTestId('nav-pill').evaluate(el => el.getBoundingClientRect().width)).toBeCloseTo(sample.closed, 0);
		}
		await expect(page.locator('.nav-links')).toHaveCSS('overflow', 'visible');
	});
}

for (const [width, height] of [[320, 568], [375, 667], [768, 1024], [1024, 600], [1280, 600], [1366, 600], [1440, 900]]) {
	for (const reducedMotion of ['reduce', 'no-preference'] as const) {
		test(`menu fit and keyboard at ${width}x${height}, ${reducedMotion}`, async ({ page }) => {
			test.setTimeout(90_000);
			await page.setViewportSize({ width, height });
			await page.emulateMedia({ reducedMotion });
			for (const locale of ['', '/fr', '/es']) {
				await page.goto(`${locale}/legal/privacy`);
				await expect(async () => {
					if (!(await page.getByRole('dialog').count())) await page.getByTestId('nav-menu-toggle').press('Enter');
					await expect(page.getByRole('dialog')).toBeVisible();
				}).toPass();
				for (const theme of ['dark', 'light']) {
					await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
					const pill = await page.getByTestId('nav-pill').boundingBox();
					expect(Math.abs(pill!.x + pill!.width / 2 - width / 2)).toBeLessThanOrEqual(1);
					await expect(page.getByTestId('nav-menu-toggle')).toBeFocused();
					await page.keyboard.press('Tab');
					const items = page.locator('[data-menu-item]');
					await expect(items.first()).toBeFocused();
					await items.last().focus();
					const last = await items.last().boundingBox();
					expect(last!.y).toBeGreaterThanOrEqual(pill!.y + pill!.height);
					// Native focus rounds its scroll offset while item bounds retain fractional CSS pixels.
					expect(last!.y + last!.height).toBeLessThanOrEqual(height + 1);
					expect(last!.x).toBeGreaterThanOrEqual(0);
					expect(last!.x + last!.width).toBeLessThanOrEqual(width);
					await page.getByTestId('nav-menu-toggle').focus();
				}
				await page.keyboard.press('Escape');
				await expect(page.getByRole('dialog')).toHaveCount(0);
				await expect(page.getByTestId('nav-menu-toggle')).toBeFocused();
			}
		});
	}
}
