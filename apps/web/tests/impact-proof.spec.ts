import { test, expect } from '@playwright/test';
import fixture from '../../../packages/shared/fixtures/export-data.json' with { type: 'json' };
import { ProjectSchema, ServiceSchema } from '@repo/shared/schemas';

// The committed fixture remains uncited. A local synthetic proof pass can supply
// sourceUrl/asOf on one metric without publishing a fabricated citation.
type Proof = { sourceUrl?: string; asOf?: string };
const project = fixture.data.projects.map(row => ProjectSchema.parse(row)).find(row => row.impactMetrics?.length)!;
const service = ServiceSchema.parse(fixture.data.services[0]);

for (const locale of ['en', 'fr', 'es'] as const) {
	const prefix = locale === 'en' ? '' : `/${locale}`;
	const dates = { en: 'As of November 4, 2026', fr: 'En date du 4 novembre 2026', es: 'Al 4 de noviembre de 2026' };
	for (const surface of ['project', 'home', 'services', 'service'] as const) {
		for (const theme of ['light', 'dark'] as const) {
		test(`${locale} ${surface} ${theme} preserves cited and uncited metrics`, async ({ page }, testInfo) => {
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.addInitScript(value => localStorage.setItem('theme', value), theme);
			const path = { project: `/projects/${project.slug}`, home: '/', services: '/services', service: `/services/${service.id}` }[surface];
			await page.goto(`${prefix}${path}`, { waitUntil: 'domcontentloaded' });
			await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
			const metric: Proof = surface === 'project' ? project.impactMetrics![0] : service.impactMetric!;
			const proofs = page.getByTestId('metric-proof');
			if (!metric.sourceUrl && !metric.asOf) {
				await expect(proofs).toHaveCount(0);
				if (surface === 'project') {
					await page.getByTestId('project-impact-card').filter({ visible: true }).scrollIntoViewIfNeeded();
					await page.screenshot({ path: testInfo.outputPath(`${locale}-${theme}-uncited.png`), fullPage: false });
				}
				return;
			}
			const visibleProof = proofs.filter({ visible: true }).first();
			await visibleProof.scrollIntoViewIfNeeded();
			await expect(visibleProof).toBeVisible();
			if (metric.sourceUrl) {
				const link = visibleProof.getByRole('link');
				await expect(link).toHaveAttribute('href', metric.sourceUrl);
				await link.focus();
				await page.keyboard.press('Shift+Tab');
				await page.keyboard.press('Tab');
				await expect(link).toBeFocused();
				await expect(link).toHaveAccessibleName(/\S/);
				await expect(page.locator('a a')).toHaveCount(0);
			}
			if (metric.asOf) {
				await expect(visibleProof.locator('time')).toHaveAttribute('datetime', metric.asOf);
				if (metric.asOf === '2026-11-04') await expect(visibleProof.locator('time')).toHaveText(dates[locale]);
			}
			expect(await visibleProof.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
			if (surface === 'project') {
				// Only the supplied claim gets proof; its uncited neighbours remain intact.
				const panel = page.getByTestId('project-impact-card').filter({ visible: true });
				await expect(panel.getByTestId('metric-proof')).toHaveCount(1);
			}
			await page.screenshot({ path: testInfo.outputPath(`${locale}-${surface}-${theme}-proof.png`), fullPage: false });
		});
		}
	}
}
