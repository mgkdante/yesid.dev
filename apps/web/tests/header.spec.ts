import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { menuItems } from '../src/lib/content/nav';
import { siteLabels } from '../src/lib/content/site-labels';
import type { Locale } from '../src/lib/types';
import { DEFAULT_LOCALE, resolveLocale } from '../src/lib/utils/locale';
import { PUBLISHED_LOCALES } from '../src/lib/utils/published-locales';

const chrome = siteLabels.navChrome.shared;
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
			`^(${literal(resolveLocale(chrome.openMenuAria, locale))}|${literal(resolveLocale(chrome.closeMenuAria, locale))})$`,
		),
	});
const menu = (page: Page, locale: Locale) =>
	page.getByRole('navigation', { name: resolveLocale(chrome.menuOverlayAria, locale) });

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
		await page
			.getByRole('link', { name: new RegExp(`^${literal(resolveLocale(chrome.localeSwitcherAria, locale))}:`) })
			.click();

		await expect(page).toHaveURL(samePath(start(next(locale))));
		await expect(page.locator('html')).toHaveAttribute('lang', next(locale));
	});

	test(`${locale}: the header fits the viewport without horizontal overflow`, async ({ page }) => {
		await page.goto(start(locale));
		const width = page.viewportSize()!.width;
		const pill = (await page.getByTestId('nav-pill').boundingBox())!;

		expect(pill.x).toBeGreaterThanOrEqual(0);
		expect(pill.x + pill.width).toBeLessThanOrEqual(width);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
	});
}

test('axe finds no serious issues with the menu open on any destination', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop-chrome', 'axe results do not depend on the viewport');
	for (const locale of PUBLISHED_LOCALES) {
		for (const item of menuItems) {
			await page.goto(localized(item.href, locale));
			await openMenu(page, locale);
			// Scoped to the open menu, the surface this spec covers.
			const { violations } = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
			const blocking = violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
			expect(blocking, `${locale} ${item.href}`).toEqual([]);
		}
	}
});
