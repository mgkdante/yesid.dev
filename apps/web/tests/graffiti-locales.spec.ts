import { expect, test } from '@playwright/test';

const cases = [
	{
		locale: 'en',
		path: '/',
		asset: '/svg/graffiti/the-end.en.svg',
		phrase: 'THE END',
		letters: 'THEEND',
		label: 'THE END graffiti'
	},
	{
		locale: 'fr',
		path: '/fr',
		asset: '/svg/graffiti/the-end.fr.svg',
		phrase: 'LA FIN',
		letters: 'LAFIN',
		label: 'graffiti LA FIN'
	},
	{
		locale: 'es',
		path: '/es',
		asset: '/svg/graffiti/the-end.es.svg',
		phrase: 'FIN',
		letters: 'FIN',
		label: 'grafiti FIN'
	}
] as const;

for (const item of cases) {
	test(`${item.locale} home loads and injects its localized graffiti`, async ({ page }) => {
		const responsePromise = page.waitForResponse((response) =>
			response.url().endsWith(item.asset)
		);

		await page.goto(item.path);
		const response = await responsePromise;
		expect(response.status()).toBe(200);
		expect(await response.text()).toContain(`data-phrase="${item.phrase}"`);

		const graffiti = page.getByTestId('closer-graffiti');
		await expect(graffiti).toHaveAttribute('aria-label', item.label);
		const svg = graffiti.locator('svg');
		await expect(svg).toHaveAttribute('data-phrase', item.phrase);
		expect(
			await svg.locator('g[data-letter]').evaluateAll((groups) =>
				groups.map((group) => group.getAttribute('data-letter')).join('')
			)
		).toBe(item.letters);
		await expect(svg.locator('path[data-part="body"]')).toHaveCount(item.letters.length);
		await expect(svg.locator('path[data-part="drip"]')).toHaveCount(item.letters.length);
	});
}
