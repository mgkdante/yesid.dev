import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import contract from '../../../contracts/kpis-v1.examples.json' with { type: 'json' };

for (const rowCount of [4, 1]) {
	test(`live hero renders ${rowCount} usable routes without overflow`, async ({ page }, testInfo) => {
		test.skip(!['desktop', 'phone'].includes(testInfo.project.name), 'Desktop and mobile contract coverage.');
		// Opt this test alone into the real polling path, with a local response.
		// All other suites retain the production webdriver bypass.
		await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
		await page.emulateMedia({ reducedMotion: 'reduce' });
		const body = structuredClone(contract.examples[1].body);
		if ('topRoutes' in body && body.topRoutes) {
			body.topRoutes = body.topRoutes.map((row, index) => ({ ...row, avgDelayS: index < rowCount ? row.avgDelayS : null }));
		}
		await page.route('https://transit.yesid.dev/api/v1/kpis', route => route.fulfill({ json: body }));
		await page.goto('/');
		if (testInfo.project.name === 'phone') {
			await page.getByTestId('hero-mobile-sql').getByRole('button', { expanded: false }).click();
		}
		const panel = page.getByTestId('sql-panel').filter({ visible: true });
		await expect(panel.getByTestId('sql-live')).toHaveText('LIVE');
		await expect(panel.getByTestId('sql-result-row')).toHaveCount(rowCount);
		await expect(panel.getByTestId('sql-meta')).toContainText(`${rowCount} rows`);
		await expect(panel.getByTestId('sql-result-row').first()).toContainText('180');
		await page.evaluate(() => document.fonts.ready);
		const geometry = await panel.evaluate(el => {
			const box = el.getBoundingClientRect();
			const rows = [...el.querySelectorAll('[data-testid="sql-result-row"]')].map(row => {
				const rect = row.getBoundingClientRect();
				return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
			});
			return { width: innerWidth, left: box.left, right: box.right, bottom: box.bottom, rows,
				overflow: document.documentElement.scrollWidth - innerWidth };
		});
		expect(geometry.overflow).toBeLessThanOrEqual(1);
		expect(geometry.left).toBeGreaterThanOrEqual(0);
		expect(geometry.right).toBeLessThanOrEqual(geometry.width);
		for (const row of geometry.rows) {
			expect(row.bottom).toBeLessThan(geometry.bottom);
			expect(row.left).toBeGreaterThanOrEqual(geometry.left);
			expect(row.right).toBeLessThanOrEqual(geometry.right);
		}
		const measurementsPath = testInfo.outputPath('live-route-layout.json');
		await writeFile(measurementsPath, JSON.stringify(geometry, null, 2));
		await testInfo.attach('live-route-layout', { path: measurementsPath, contentType: 'application/json' });
		await panel.screenshot({ path: testInfo.outputPath('live-routes.png') }).then(body =>
			testInfo.attach('live-routes', { body, contentType: 'image/png' }));
	});
}
