import { headerLanguageLink } from './_support/header-controls';
import { localeCopy } from '../src/lib/locales';
import { expect, test, type Page } from '@playwright/test';

import { menuItems } from '../src/lib/content/nav';
import type { Locale } from '../src/lib/types';
import { DEFAULT_LOCALE, resolveLocale } from '../src/lib/utils/locale';
import { PUBLISHED_LOCALES } from '../src/lib/utils/published-locales';

const chrome = localeCopy;

const literal = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const localized = (href: string, locale: Locale) =>
	locale === DEFAULT_LOCALE ? href : `/${locale}${href === '/' ? '' : href}`;
const start = (locale: Locale) => localized(menuItems[0].href, locale);
const next = (locale: Locale) =>
	PUBLISHED_LOCALES[(PUBLISHED_LOCALES.indexOf(locale) + 1) % PUBLISHED_LOCALES.length];
const samePath = (href: string) => (url: URL) => url.pathname === new URL(href, url).pathname;
const toggle = (page: Page, locale: Locale) =>
	page.getByRole('button', {
		name: new RegExp(
			`^(${literal(chrome[locale].navChrome.shared.openMenuAria)}|${literal(chrome[locale].navChrome.shared.closeMenuAria)})$`,
		),
	});
const menu = (page: Page, locale: Locale) =>
	page.getByRole('navigation', { name: chrome[locale].navChrome.shared.menuOverlayAria });

// SSR shows the toggle before hydration wires it; retry the click until the menu opens.
async function openMenu(page: Page, locale: Locale) {
	await expect(async () => {
		if (!(await menu(page, locale).isVisible())) await toggle(page, locale).click();
		await expect(menu(page, locale)).toBeVisible({ timeout: 1000 });
	}).toPass();
	return menu(page, locale);
}

for (const locale of PUBLISHED_LOCALES) {
	test(`${locale}: the menu lists every destination, holds focus and gives it back on Escape`, async ({ page }) => {
		await page.goto(start(locale));
		const list = await openMenu(page, locale);

		for (const item of menuItems) {
			await expect(list.getByText(resolveLocale(item.label, locale), { exact: true })).toBeVisible();
		}
		await expect(toggle(page, locale)).toBeFocused();
		await page.keyboard.press('Tab');
		await expect(page.getByRole('dialog').locator(':focus')).toHaveCount(1);

		await page.keyboard.press('Escape');
		await expect(list).toBeHidden();
		await expect(toggle(page, locale)).toBeFocused();
	});

	test(`${locale}: a menu destination navigates and closes the menu`, async ({ page }) => {
		const target = menuItems.at(-1)!;
		await page.goto(start(locale));
		const list = await openMenu(page, locale);
		await list.getByText(resolveLocale(target.label, locale), { exact: true }).click();

		await expect(page).toHaveURL(samePath(localized(target.href, locale)));
		await expect(list).toBeHidden();
	});

	test(`${locale}: the language switch goes to the next locale`, async ({ page }) => {
		await page.goto(start(locale));
		await headerLanguageLink(page);
		await page
			.getByRole('link', { name: new RegExp(`^${literal(chrome[locale].navChrome.shared.localeSwitcherAria)}:`) })
			.click();

		await expect(page).toHaveURL(samePath(start(next(locale))));
		await expect(page.locator('html')).toHaveAttribute('lang', next(locale));
	});

	// Links that don't fit move to the menu once the app script measures them, so poll the settled pill.
	test(`${locale}: the header stays inside the viewport`, async ({ page }) => {
		await page.goto(start(locale));
		if (page.viewportSize()!.width < 500) {
			await expect(page.getByTestId('nav-pill').getByRole('link', { name: resolveLocale(menuItems.find(item => item.href === '/contact')!.label, locale), exact: true })).toBeVisible();
		}
		await expect.poll(async () => {
			const pill = (await page.getByTestId('nav-pill').boundingBox())!;
			return pill.x >= 0 && pill.x + pill.width <= page.viewportSize()!.width;
		}).toBe(true);
	});
}

// Kit 3 forwards native events for direct links, but has no accepted-start subscription.
test('an open menu survives direct language links and Escape restores the trigger', async ({ page }) => {
	await page.goto('/services');
	await openMenu(page, 'en');
	await page.getByTestId('language-toggle').click();
	await expect(page).toHaveURL(samePath('/fr/services'));
	await expect(menu(page, 'fr')).toBeVisible();
	await expect(page.getByTestId('language-toggle')).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(menu(page, 'fr')).toBeHidden();
	await expect(toggle(page, 'fr')).toBeFocused();
});

test('a language link landing on a router redirect closes the menu with the Kit 3 fallback', async ({ page }) => {
	// Emulate an editorial redirect in Kit's data response, preserving a real native click and router hooks.
	await page.route('**/fr/services/__data.json*', route => route.fulfill({
		contentType: 'application/json',
		body: JSON.stringify({ type: 'redirect', location: '/fr/projects' }),
	}));
	await page.goto('/services');
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', '');
	await openMenu(page, 'en');
	await page.getByTestId('language-toggle').click();
	await expect(page).toHaveURL(samePath('/fr/projects'));
	await expect(menu(page, 'fr')).toBeHidden();
	await expect(page.locator('[data-testid="language-toggle"]:focus')).toHaveCount(0);
});
