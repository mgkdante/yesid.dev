import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';
import { installMetricProofFixture, navigateWithMetricFixture, proofUrl } from './_support/metric-proof-fixture';

for (const locale of ['en', 'fr', 'es']) {
	const prefix = locale === 'en' ? '' : `/${locale}`;
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
		await expectProofLinks(page);
		await expectNoHorizontalOverflow(page, ['.services-card', '.services-footer', '[data-testid="metric-proof"]']);
		await cards.nth(3).scrollIntoViewIfNeeded();
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
			await expectProofLinks(page);
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
		});
	}
}

async function expectProofLinks(page: import('@playwright/test').Page) {
	for (const proof of await page.getByTestId('metric-proof').filter({ visible: true }).all()) {
		const link = proof.getByRole('link');
		await proof.scrollIntoViewIfNeeded();
		await expect(link).toHaveAttribute('href', proofUrl);
		await expect(link).toHaveAccessibleName(/(?:Source|Fuente): .+/);
		await link.focus();
		await page.keyboard.press('Shift+Tab');
		await page.keyboard.press('Tab');
		await expect(link).toBeFocused();
		expect(await link.evaluate(el => el.parentElement?.closest('a'))).toBeNull();
	}
}
