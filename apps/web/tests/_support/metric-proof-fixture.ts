import { expect, type Page } from '@playwright/test';

export const proofUrl = 'https://example.org/metric-layout-evidence';
export const namedSources = [
	{ label: 'yesid.dev', url: 'https://yesid.dev' },
	{ label: 'Transit', url: 'https://transit.yesid.dev' },
	{ label: 'Café Arona', url: 'https://cafearona.com' },
	{ label: 'Vitreva', url: 'https://vitreva.ca' },
];

// Exercise the real pages with a live-shaped test case. The committed content
// fixture has four metrics and no proof. Only intercepted SvelteKit navigation
// data changes; CMS, build content and the deployed site remain untouched.
export async function installMetricProofFixture(page: Page, variants = false, multiple = false) {
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
				if ((id === 'web-development' && !multiple) || id === 'data-pipeline') delete row.impactMetric;
				if (multiple && id === 'web-development') {
					const metric = data[row.impactMetric] as Record<string, number>;
					metric.sources = ref(namedSources.map(source => ref({ label: ref(source.label), url: ref(source.url) })));
					replacements++;
				}
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
						if (multiple) {
							delete metric.sourceUrl;
							metric.sources = ref(namedSources.map(source => ref({ label: ref(source.label), url: ref(source.url) })));
						}
						if (variants) {
							// Keep the existing claims; add isolated source-only/date-only cases.
							const sourceOnly: Record<string, number> = { ...metric, label: ref({ en: ref('Source only'), fr: ref('Source seule'), es: ref('Solo fuente') }) };
							delete sourceOnly.asOf;
							const dateOnly: Record<string, number> = { ...metric, label: ref({ en: ref('Date only'), fr: ref('Date seule'), es: ref('Solo fecha') }) };
							delete dateOnly.sourceUrl;
							row.impactMetrics = ref([...metrics, ref(sourceOnly), ref(dateOnly)]);
						}
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
	// Contact's submit stays disabled until onMount, unlike SSR-visible links.
	await expect(page.locator('button[type="submit"]').filter({ visible: true })).toBeEnabled();
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
