import { test, expect } from '@playwright/test';

for (const locale of ['en', 'fr', 'es'] as const) {
	test(`${locale}: localized destinations, topics, weather absence and HTTP 404`, async ({ page }, testInfo) => {
		await page.route(/web3forms|cal\.com|plausible|\/api\/event/, route => route.abort());
		await page.route('**/api/weather*', route => route.fulfill({ status: 503, body: 'null' }));
		await page.emulateMedia({ reducedMotion: 'reduce' });
		const prefix = locale === 'en' ? '' : `/${locale}`;
		for (const width of [390, 1440]) for (const theme of ['dark', 'light']) {
			await page.setViewportSize({ width, height: 900 });
			await page.addInitScript(theme => localStorage.setItem('theme', theme), theme);
			await page.goto(`${prefix}/about`);
			const cta = page.getByTestId('about-cta');
			await expect(page.getByTestId('about-cta-button')).toHaveAttribute('href', `${prefix}/contact`);
			await expect(page.getByTestId('about-weather').getByText('-', { exact: true })).toHaveCount(0);
			await cta.scrollIntoViewIfNeeded();
			await page.screenshot({ path: testInfo.outputPath(`about-${width}-${theme}.png`) });
		}
		await page.goto(`${prefix}/blog`);
		if (locale !== 'en') await expect(page.getByTestId('blog-topic-tags').first()).not.toContainText(/systems-thinking|ai-assisted-development|personal-story/);
		const response = await page.goto(`${prefix}/missing-dev-4-check`);
		expect(response?.status()).toBe(404);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText({ en: 'Page not found', fr: 'Page introuvable', es: 'Página no encontrada' }[locale]);
		for (const link of await page.getByTestId('error-suggestion-link').all()) await expect(link).toHaveAttribute('href', new RegExp(`^${prefix}/`));
	});
	test(`${locale}: diagram load failure keeps a localized explanation`, async ({ page }) => {
		await page.route(/web3forms|cal\.com|plausible|\/api\/event/, route => route.abort());
		const pendingChunks = new Set<Promise<void>>();
		await page.route('**/_app/immutable/chunks/*.js', route => {
			const pending = (async () => {
				const response = await route.fetch();
				if ((await response.text()).includes('mermaidAPI')) await route.abort();
				else await route.fulfill({ response });
			})();
			pendingChunks.add(pending);
			return pending.finally(() => { pendingChunks.delete(pending); });
		});
		try {
			const prefix = locale === 'en' ? '' : `/${locale}`;
			await page.goto(`${prefix}/projects/transit-data-pipeline`);
			const diagram = page.getByTestId('mermaid-diagram').first();
			await diagram.scrollIntoViewIfNeeded();
			await expect(diagram.locator('figcaption')).toContainText({ en: 'The diagram could not be displayed.', fr: "Le diagramme n'a pas pu s'afficher.", es: 'No se pudo mostrar el diagrama.' }[locale]);
		} finally {
			// Keep interception installed until every fetch/fulfill callback has settled.
			while (pendingChunks.size) await Promise.all(pendingChunks);
			await page.unrouteAll({ behavior: 'wait' });
		}
	});
}
