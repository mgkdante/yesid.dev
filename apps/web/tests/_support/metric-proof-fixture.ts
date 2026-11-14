import { expect, type Page } from '@playwright/test';

export const proofUrl = 'https://example.org/metric-layout-evidence';

// Exercise the real pages with a live-shaped test case. The committed content
// fixture has four metrics and no proof. Only intercepted SvelteKit navigation
// data changes; CMS, build content and the deployed site remain untouched.
export async function installMetricProofFixture(page: Page) {
	let replacements = 0;
	await page.route('**/__data.json*', async route => {
		const response = await route.fetch();
		const payload = await response.json();
		for (const node of payload.nodes ?? []) {
			// SvelteKit's JSON transport is a flat reference table. Append test
			// strings without changing existing references or shared translations.
			const data: unknown[] = node?.data;
			if (!Array.isArray(data)) continue;
			const ref = (value: unknown) => data.push(value) - 1;
			for (const item of [...data]) {
				if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
				const row = item as Record<string, number>;
				const id = data[row.id];
				if (id === 'web-development' || id === 'data-pipeline') delete row.impactMetric;
				if (id === 'analytics-reporting' || id === 'database-engineering') {
					const metric = data[row.impactMetric] as Record<string, number>;
					if (!metric) continue;
					metric.sourceUrl = ref(proofUrl);
					metric.asOf = ref('2026-11-04');
					if (id === 'database-engineering') {
						metric.value = ref({ en: ref('$50–60/mo → $0'), fr: ref('50–60 $/mois → 0 $'), es: ref('$50–60/mes → $0') });
						metric.label = ref({ en: ref('Managed database and worker hosting, moved to a free VM'), fr: ref('Hébergement de la base de données et du worker, déplacés vers une VM gratuite'), es: ref('Alojamiento de base de datos y worker, trasladados a una VM gratuita') });
					}
					replacements++;
				}
				if (row.impactMetrics !== undefined) {
					const metrics = data[row.impactMetrics] as number[];
					const metric = data[metrics?.[0]] as Record<string, number>;
					if (metric) {
						metric.sourceUrl = ref(proofUrl);
						metric.asOf = ref('2026-11-04');
						replacements++;
					}
				}
			}
		}
		await route.fulfill({ response, json: payload });
	});
	return () => expect(replacements, 'the real page received synthetic metric proof').toBeGreaterThan(0);
}

export async function navigateWithMetricFixture(page: Page, path: string) {
	await page.goto('/contact', { waitUntil: 'domcontentloaded' });
	// Kit attaches its link router after onMount; a full document load bypasses the fixture.
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', '');
	// A normal same-origin link uses SvelteKit navigation and the intercepted data.
	await page.evaluate(path => {
		const link = document.createElement('a');
		link.href = path;
		link.textContent = 'Metric layout test destination';
		link.dataset.testid = 'metric-layout-destination';
		link.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647';
		document.body.append(link);
	}, path);
	await page.getByTestId('metric-layout-destination').click();
	await page.waitForURL(url => url.pathname.replace(/\/$/, '') === path.replace(/\/$/, ''), { waitUntil: 'domcontentloaded' });
	await expect(page.getByTestId('page-contact')).toHaveCount(0);
	await page.getByTestId('metric-layout-destination').evaluate(el => el.remove());
	await page.evaluate(() => document.fonts.ready);
}
