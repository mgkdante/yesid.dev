import { test, expect } from '@playwright/test';
import { installMetricProofFixture, navigateWithMetricFixture, proofUrl } from './_support/metric-proof-fixture';

for (const locale of ['en', 'fr', 'es'] as const) {
	const prefix = locale === 'en' ? '' : `/${locale}`;
	for (const [surface, path, selector] of [
		['home', '/', '.services-metric-value'],
		['services', '/services', '.metric-value'],
		['service', '/services/database-engineering', '.impact-value, .metric-inline-value'],
		['project', '/projects/transit-data-pipeline', '[data-testid="project-impact-card"] .metric-value'],
	]) {
		for (const theme of ['light', 'dark'] as const) {
			test(`${locale} ${surface} ${theme} keeps metrics without supplied proof`, async ({ page }, testInfo) => {
				await page.emulateMedia({ reducedMotion: 'reduce' });
				await page.addInitScript(value => localStorage.setItem('theme', value), theme);
				const assertFixture = await installMetricProofFixture(page);
				await navigateWithMetricFixture(page, `${prefix}${path}`);
				assertFixture();
				await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
				await expect(page.locator(selector).filter({ visible: true }).first()).toBeVisible();
				await expect(page.getByTestId('metric-proof')).toHaveCount(0);
				await expect(page.locator(`a[href="${proofUrl}"]`)).toHaveCount(0);
				await expect(page.locator('time[datetime="2026-11-04"]')).toHaveCount(0);
				if (surface === 'project') {
					const panel = page.getByTestId('project-impact-card').filter({ visible: true });
					await panel.scrollIntoViewIfNeeded();
					await testInfo.attach(`${locale}-${theme}-metrics`, { body: await panel.screenshot(), contentType: 'image/png' });
				}
			});
		}
	}
}
