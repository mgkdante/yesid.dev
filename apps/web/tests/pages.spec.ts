import { expect, test } from '@playwright/test';

import { sitePages } from '../src/lib/content/site-pages';
import { DEFAULT_LOCALE } from '../src/lib/utils/locale';
import { PUBLISHED_LOCALES } from '../src/lib/utils/published-locales';

test.skip(({ viewport }) => viewport!.width < 1024, 'Viewport-independent.');

const localized = (path: string, locale: string) =>
	locale === DEFAULT_LOCALE ? path : `/${locale}${path === '/' ? '' : path}`;

for (const { path } of sitePages) {
	for (const locale of PUBLISHED_LOCALES) {
		const url = localized(path, locale);
		test(`${url} renders one main landmark in its language without console errors`, async ({ page }) => {
			const errors: string[] = [];
			page.on('console', (message) => {
				if (message.type() === 'error') errors.push(message.text());
			});
			page.on('pageerror', (error) => errors.push(error.message));

			const response = await page.goto(url, { waitUntil: 'load' });
			expect(response?.status()).toBe(200);
			await expect(page.locator('html')).toHaveAttribute('lang', locale);
			await expect(page.getByRole('main')).toHaveCount(1);
			await expect(page.getByTestId('footer')).toBeVisible();
			expect(errors).toEqual([]);
		});
	}
}

for (const [path, location] of [
	['/tech-stack', '/services'],
	['/fr/tech-stack', '/fr/services'],
]) {
	test(`${path} permanently redirects to ${location}`, async ({ request }) => {
		const response = await request.get(path, { maxRedirects: 0 });
		expect(response.status()).toBe(301);
		expect(response.headers()['location']).toBe(location);
	});
}

test('never-published locale prefix /de/* returns 404', async ({ page }) => {
  const response = await page.goto('/de/about');
  expect(response?.status()).toBe(404);
  // Error page testids are always present.
  await expect(page.getByTestId('error-label')).toBeVisible();
});

test('unknown route under published prefix /fr/nonexistent returns 404', async ({ page }) => {
  const response = await page.goto('/fr/nonexistent-route-at-all');
  expect(response?.status()).toBe(404);
  await expect(page.getByTestId('error-label')).toBeVisible();
});

test('404 page respects EN context (unprefixed /nonexistent)', async ({ page }) => {
  const response = await page.goto('/nonexistent-route-xyz');
  expect(response?.status()).toBe(404);
  // html lang should be 'en' (unprefixed path)
  const lang = await page.locator('html').evaluate((el) => el.getAttribute('lang'));
  expect(lang).toBe('en');
  // Error page canonical should be EN
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toContain('https://yesid.dev');
  expect(canonical).not.toContain('/fr');
});

test('404 page respects FR context (/fr/nonexistent)', async ({ page }) => {
  const response = await page.goto('/fr/nonexistent-route-xyz');
  expect(response?.status()).toBe(404);
  const lang = await page.locator('html').evaluate((el) => el.getAttribute('lang'));
  expect(lang).toBe('fr');
  // 404 pages emit a base canonical (they are noindex; the lang context above is
  // the meaningful FR signal). Just assert a well-formed canonical is present.
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toContain('https://yesid.dev');
});
