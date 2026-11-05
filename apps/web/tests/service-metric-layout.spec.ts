import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';
import { installMetricProofFixture, navigateWithMetricFixture, namedSources, proofUrl } from './_support/metric-proof-fixture';

for (const locale of ['en', 'fr', 'es'] as const) {
	const prefix = locale === 'en' ? '' : `/${locale}`;
	test(`${locale} four named sources fit on every metric surface`, async ({ page }, testInfo) => {
		if (testInfo.project.name === 'phone') await page.setViewportSize({ width: 412, height: 915 });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await installMetricProofFixture(page, false, true);
		for (const path of ['/', '/services', '/services/web-development', '/projects/transit-data-pipeline']) {
			await navigateWithMetricFixture(page, `${prefix}${path}`);
			const proof = page.getByTestId('metric-proof').filter({ visible: true }).filter({ has: page.locator('a[href="https://vitreva.ca"]') }).first();
			const button = proof.getByRole('button');
			await button.scrollIntoViewIfNeeded();
			if (testInfo.project.use.hasTouch) await button.tap();
			else { await button.focus(); await page.keyboard.press('Enter'); }
			const panel = proof.locator('[popover]');
			await expect(panel).toBeVisible();
			await expect(panel.getByRole('link')).toHaveCount(4);
			for (const source of namedSources) {
				const link = panel.getByRole('link', { name: new RegExp(`^${source.label}:`) });
				await expect(link).toHaveAttribute('href', source.url);
				await page.keyboard.press('Tab');
				await expect(link).toBeFocused();
			}
			await expectPanelInViewport(page, panel);
			const bounds = await panel.boundingBox();
			expect(bounds!.width).toBeLessThanOrEqual(320);
			expect(bounds!.height).toBeLessThanOrEqual(288);
			await testInfo.attach(`${locale}-${path.replaceAll('/', '-')}-four-sources`, { body: await page.screenshot(), contentType: 'image/png' });
			await page.keyboard.press('Escape');
			await expect(button).toBeFocused();
		}
	});
	test(`${locale} home cards fit content and contain their proof`, async ({ page }, testInfo) => {
		if (testInfo.project.name === 'phone') await page.setViewportSize({ width: 412, height: 915 });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		const assertFixture = await installMetricProofFixture(page);
		await navigateWithMetricFixture(page, `${prefix}/`);
		const cards = page.locator('.services-card');
		await expect(cards).toHaveCount(4);
		assertFixture();
		await expect(cards.nth(0).getByTestId('services-metric')).toHaveCount(0);
		await expect(cards.nth(1).getByTestId('services-metric')).toHaveCount(0);
		await expect(cards.nth(2).getByTestId('metric-proof')).toHaveCount(1);
		await expect(cards.nth(3).getByTestId('metric-proof')).toHaveCount(1);
		for (const card of await cards.all()) {
			await card.scrollIntoViewIfNeeded();
			const geometry = await card.evaluate(el => {
				const content = el.querySelector('.services-content')!;
				const last = content.lastElementChild!;
				const metric = el.querySelector('[data-testid="services-metric"]');
				const bounds = el.getBoundingClientRect();
				return {
					blank: (metric?.getBoundingClientRect().top ?? bounds.bottom) - last.getBoundingClientRect().bottom,
					height: bounds.height,
					proofInside: [...el.querySelectorAll('[data-testid="metric-proof"]')].every(proof => {
						const box = proof.getBoundingClientRect();
						return box.top >= bounds.top && box.bottom <= bounds.bottom && box.left >= bounds.left && box.right <= bounds.right;
					}),
				};
			});
			if (page.viewportSize()!.width < 1024) expect(geometry.blank, 'only normal content padding remains').toBeLessThan(40);
			expect(geometry.proofInside).toBe(true);
		}
		if (page.viewportSize()!.width >= 1024) {
			const heights = await cards.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
			expect(Math.abs(heights[0] - heights[1])).toBeLessThan(1);
			expect(Math.abs(heights[2] - heights[3])).toBeLessThan(1);
		}
		if (page.viewportSize()!.width <= 412) {
			const longMetric = cards.nth(3).getByTestId('services-metric');
			const value = await longMetric.locator('.services-metric-value').boundingBox();
			const label = await longMetric.locator('.services-metric-label').boundingBox();
			expect(label!.y, 'long labels use a full line below the value').toBeGreaterThanOrEqual(value!.y + value!.height - 1);
			const lineHeight = await longMetric.locator('.services-metric-value').evaluate(el => parseFloat(getComputedStyle(el).lineHeight));
			expect(value!.height, 'the long value fits on one phone line').toBeLessThanOrEqual(lineHeight + 1);
		}
		await expectProofLinks(page, locale, Boolean(testInfo.project.use.hasTouch));
		await expectNoHorizontalOverflow(page, ['.services-card', '.services-footer', '[data-testid="metric-proof"]']);
		await cards.nth(3).scrollIntoViewIfNeeded();
		await cards.nth(3).getByTestId('metric-proof').getByRole('button').focus();
		await page.keyboard.press('Enter');
		await testInfo.attach(`${locale}-home-metric`, { body: await page.screenshot(), contentType: 'image/png' });
	});

	for (const path of ['/services', '/services/database-engineering', '/projects/transit-data-pipeline']) {
		test(`${locale} ${path} keeps metric proof readable`, async ({ page }, testInfo) => {
			if (testInfo.project.name === 'phone') await page.setViewportSize({ width: 412, height: 915 });
			await page.emulateMedia({ reducedMotion: 'reduce' });
			const assertFixture = await installMetricProofFixture(page);
			await navigateWithMetricFixture(page, `${prefix}${path}`);
			await expect(page.getByTestId('metric-proof').filter({ visible: true }).first()).toBeVisible();
			assertFixture();
			await expectProofLinks(page, locale, Boolean(testInfo.project.use.hasTouch));
			if (path.startsWith('/projects/')) {
				const panel = page.getByTestId('project-impact-card').filter({ visible: true });
				await expect(panel.getByTestId('metric-proof')).toHaveCount(1);
			}
			if (path === '/services/database-engineering' && page.viewportSize()!.width >= 1024) {
				const value = page.locator('.impact-value');
				const lines = await value.evaluate(el => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
				expect(lines, 'the rail reads a long value in at most two lines').toBeLessThanOrEqual(2.1);
			}
			await expectNoHorizontalOverflow(page, ['.metric-inline', '.impact-metric', '[data-testid="project-impact-card"]', '[data-testid="metric-proof"]']);
			if (path.startsWith('/projects/')) {
				await page.route(proofUrl, route => route.fulfill({ contentType: 'text/html', body: 'Evidence destination' }));
				const proof = page.getByTestId('metric-proof').filter({ visible: true }).first();
				if (testInfo.project.use.hasTouch) await proof.getByRole('button').tap();
				else await proof.getByRole('button').hover();
				await proof.getByRole('link').click();
				await expect(page).toHaveURL(proofUrl);
			}
		});
	}

	test(`${locale} partial proof, one open panel and native no-JavaScript access`, async ({ page, browser }, testInfo) => {
		if (testInfo.project.name === 'phone') await page.setViewportSize({ width: 412, height: 915 });
		await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
		await installMetricProofFixture(page, true);
		await navigateWithMetricFixture(page, `${prefix}/projects/transit-data-pipeline`);
		const card = page.getByTestId('project-impact-card').filter({ visible: true });
		const proofs = card.getByTestId('metric-proof');
		await expect(proofs).toHaveCount(3);
		// Save untouched native markup before JavaScript adds panel positioning.
		const html = await page.content();
		await proofs.nth(0).getByRole('button').focus();
		await page.keyboard.press('Enter');
		await expect(proofs.nth(0).locator('[popover]')).toBeVisible();
		await proofs.nth(1).getByRole('button').focus();
		await page.keyboard.press('Enter');
		await expect(proofs.nth(0).locator('[popover]')).toBeHidden();
		await expect(proofs.nth(1).getByRole('link')).toHaveAttribute('href', proofUrl);
		await expect(proofs.nth(1).locator('time')).toHaveCount(0);
		await expectPanelInViewport(page, proofs.nth(1).locator('[popover]'));
		await page.keyboard.press('Escape');
		await proofs.nth(2).getByRole('button').focus();
		await page.keyboard.press('Space');
		await expect(proofs.nth(2).getByRole('link')).toHaveCount(0);
		await expect(proofs.nth(2).locator('time')).toHaveText(dates[locale]);
		await expectPanelInViewport(page, proofs.nth(2).locator('[popover]'));
		await testInfo.attach(`${locale}-project-forced-colors`, { body: await page.screenshot(), contentType: 'image/png' });
		await expectNoHorizontalOverflow(page, ['[data-testid="project-impact-card"]']);

		// Replay the native component markup with scripting disabled. The server
		// rendering itself is covered by metric-proof-ssr.test.ts; content stays uncited.
		const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! });
		try {
			const native = await context.newPage();
			await native.route(page.url(), route => route.fulfill({ contentType: 'text/html', body: html }));
			await native.goto(page.url());
			const proof = native.getByTestId('project-impact-card').filter({ visible: true }).getByTestId('metric-proof').first();
			await proof.getByRole('button').click();
			await expect(proof.getByRole('link')).toBeVisible();
			await expect(proof.getByRole('link')).toHaveAttribute('href', proofUrl);
			await native.keyboard.press('Tab');
			await expect(proof.getByRole('link')).toBeFocused();
		} finally { await context.close(); }
	});
}

for (const forcedColors of ['none', 'active'] as const) {
	for (const index of [0, 3]) {
		test(`home card ${index} keyboard outlines remain inside the clip, forced colors ${forcedColors}`, async ({ page }, testInfo) => {
			await page.emulateMedia({ reducedMotion: 'reduce', forcedColors });
			await installMetricProofFixture(page);
			await navigateWithMetricFixture(page, '/');
			const card = page.locator('.services-card').nth(index);
			const link = card.getByTestId('services-card');
			await link.scrollIntoViewIfNeeded();
			await link.focus();
			await page.keyboard.press('Shift+Tab');
			await page.keyboard.press('Tab');
			await expect(link).toBeFocused();
			const ring = await link.evaluate((el, forcedColors) => {
				const overlay = getComputedStyle(el, '::after');
				const style = overlay.content !== 'none' ? overlay : getComputedStyle(el);
				const width = parseFloat(style.outlineWidth);
				const outset = width + parseFloat(style.outlineOffset);
				const box = el.getBoundingClientRect();
				const card = el.parentElement!;
				const clip = card.getBoundingClientRect();
				const probe = document.createElement('span');
				probe.style.color = forcedColors === 'active' ? 'CanvasText' : 'var(--primary)';
				el.append(probe);
				const expectedColor = getComputedStyle(probe).color;
				probe.remove();
				return {
					keyboardVisible: el.matches(':focus-visible'),
					style: style.outlineStyle, width, color: style.outlineColor, expectedColor,
					clippedEdges: [
						box.left - outset < clip.left + card.clientLeft,
						box.top - outset < clip.top + card.clientTop,
						box.right + outset > clip.left + card.clientLeft + card.clientWidth,
						box.bottom + outset > clip.top + card.clientTop + card.clientHeight,
					].filter(Boolean).length,
				};
			}, forcedColors);
			await testInfo.attach(`card-${index}-focus-${forcedColors}`, { body: await card.screenshot(), contentType: 'image/png' });
			expect(ring.keyboardVisible).toBe(true);
			expect(ring.style).toBe('solid');
			expect(ring.width).toBeGreaterThanOrEqual(2);
			expect(ring.color).toBe(ring.expectedColor);
			expect(ring.clippedEdges, `card ${index} has its full keyboard outline inside the overflow clip`).toBe(0);
		});
	}
}

const names = { en: 'Metric information', fr: 'Informations sur la mesure', es: 'Información sobre la métrica' };
const dates = { en: 'As of November 4, 2026', fr: 'En date du 4 novembre 2026', es: 'Al 4 de noviembre de 2026' };

async function expectProofLinks(page: import('@playwright/test').Page, locale: string, touch: boolean) {
	for (const proof of await page.getByTestId('metric-proof').filter({ visible: true }).all()) {
		const button = proof.getByRole('button');
		const panel = proof.locator('[popover]');
		const link = proof.locator('a');
		await proof.scrollIntoViewIfNeeded();
		await expect(button).toHaveAccessibleName(new RegExp(`^${names[locale as keyof typeof names]}: .+`));
		const target = await button.boundingBox();
		expect(target!.width).toBeGreaterThanOrEqual(44);
		expect(target!.height).toBeGreaterThanOrEqual(44);
		await expect(panel).toBeHidden();
		await button.focus();
		await page.keyboard.press('Enter');
		await expect(panel).toBeVisible();
		const after = await button.boundingBox();
		expect(after, 'opening a panel leaves the metric in place').toEqual(target);
		await expect(link).toHaveAttribute('href', proofUrl);
		await expect(link).toHaveAccessibleName(/(?:Source|Fuente): .+/);
		await expect(panel.locator('time')).toHaveText(dates[locale as keyof typeof dates]);
		await page.keyboard.press('Tab');
		await expect(link).toBeFocused();
		await expectPanelInViewport(page, panel);
		await page.keyboard.press('Escape');
		await expect(panel).toBeHidden();
		await expect(button).toBeFocused();
		await page.keyboard.press('Space');
		await expect(panel).toBeVisible();
		await page.keyboard.press('Escape');
		if (touch) {
			await button.tap();
			await expect(panel).toBeVisible();
			await button.tap();
			await expect(panel).toBeHidden();
			await button.tap();
			await page.touchscreen.tap(2, 2);
			await expect(panel).toBeHidden();
		} else {
			await button.hover();
			await expect(panel).toBeVisible();
			await link.hover();
			await expect(panel).toBeVisible();
			await page.mouse.move(2, 2);
			await expect(panel).toBeHidden();
			await button.hover();
			await expect(panel).toBeVisible();
			// A hover-open panel pins on the first click; the next click closes.
			await button.click();
			await expect(panel).toBeVisible();
			await button.click();
			await expect(panel).toBeHidden();
			await page.mouse.move(2, 2);
		}
		expect(await link.evaluate(el => el.parentElement?.closest('a'))).toBeNull();
	}
}

async function expectPanelInViewport(page: import('@playwright/test').Page, panel: import('@playwright/test').Locator) {
	const box = await panel.boundingBox();
	const viewport = page.viewportSize()!;
	expect(box!.x).toBeGreaterThanOrEqual(0);
	expect(box!.y).toBeGreaterThanOrEqual(0);
	expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
	expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
	expect(await panel.evaluate(el => {
		const box = el.getBoundingClientRect();
		return el.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2));
	}), 'the top-layer panel can be hit outside card and rail clips').toBe(true);
}
