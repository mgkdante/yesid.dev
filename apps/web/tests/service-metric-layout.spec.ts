import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';
import { installMetricProofFixture, navigateWithMetricFixture, proofUrl } from './_support/metric-proof-fixture';

for (const locale of ['en', 'fr', 'es']) {
	const prefix = locale === 'en' ? '' : `/${locale}`;
	test(`${locale} home metric cards stay compact without source or date proof`, async ({ page }, testInfo) => {
		if (testInfo.project.name === 'phone') await page.setViewportSize({ width: 412, height: 915 });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		const assertFixture = await installMetricProofFixture(page);
		await navigateWithMetricFixture(page, `${prefix}/`);
		const cards = page.locator('.services-card');
		await expect(cards).toHaveCount(4);
		assertFixture();
		await expect(cards.nth(0).getByTestId('services-metric')).toHaveCount(0);
		await expect(cards.nth(1).getByTestId('services-metric')).toHaveCount(0);
		await expect(cards.nth(2).getByTestId('services-metric')).toBeVisible();
		await expect(cards.nth(3).getByTestId('services-metric')).toBeVisible();
		await expectNoMetricProof(page);
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
				};
			});
			if (page.viewportSize()!.width < 1024) expect(geometry.blank, 'only normal content padding remains').toBeLessThan(40);
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
		await expectNoMetricProof(page);
		await expectNoHorizontalOverflow(page, ['.services-card', '.services-footer', '[data-testid="metric-proof"]']);
		await cards.nth(3).scrollIntoViewIfNeeded();
		await testInfo.attach(`${locale}-home-metric`, { body: await page.screenshot(), contentType: 'image/png' });
	});

	for (const path of ['/services', '/services/database-engineering', '/projects/transit-data-pipeline']) {
		test(`${locale} ${path} keeps metrics readable without proof`, async ({ page }, testInfo) => {
			if (testInfo.project.name === 'phone') await page.setViewportSize({ width: 412, height: 915 });
			await page.emulateMedia({ reducedMotion: 'reduce' });
			const assertFixture = await installMetricProofFixture(page);
			await navigateWithMetricFixture(page, `${prefix}${path}`);
			assertFixture();
			await expectNoMetricProof(page);
			if (path.startsWith('/projects/')) {
				const panel = page.getByTestId('project-impact-card').filter({ visible: true });
				await expect(panel.locator('.metric-value').first()).toBeVisible();
			}
			if (path === '/services/database-engineering' && page.viewportSize()!.width >= 1024) {
				const value = page.locator('.impact-value');
				const lines = await value.evaluate(el => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
				expect(lines, 'the rail reads a long value in at most two lines').toBeLessThanOrEqual(2.1);
			}
			await expectNoHorizontalOverflow(page, ['.metric-inline', '.impact-metric', '[data-testid="project-impact-card"]', '[data-testid="metric-proof"]']);
		});
	}
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

async function expectNoMetricProof(page: import('@playwright/test').Page) {
	await expect(page.getByTestId('metric-proof')).toHaveCount(0);
	await expect(page.locator(`a[href="${proofUrl}"]`)).toHaveCount(0);
	await expect(page.locator('time[datetime="2026-11-04"]')).toHaveCount(0);
}
