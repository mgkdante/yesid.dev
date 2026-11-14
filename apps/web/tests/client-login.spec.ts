import { expect, test } from '@playwright/test';
import { expectAccessible } from '@yesid/config/playwright';
import { localeCopy } from '../src/lib/locales';
import { menuItems } from '../src/lib/content/nav';
import { resolveLocale } from '../src/lib/utils/locale';

for (const width of [390, 1440]) for (const theme of ['dark', 'light']) for (const locale of ['en', 'fr', 'es'] as const) {
	test(`${locale} ${width} ${theme}: CMS login link is accessible and preserves language`, async ({ page }, testInfo) => {
		await page.setViewportSize({ width, height: 900 });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.addInitScript((theme) => localStorage.setItem('theme', theme), theme);
		await page.route(/web3forms|cal\.com|plausible|\/relay\//, route => route.abort());
		await page.route('https://login.yesid.dev/**', route => route.fulfill({ body: '<title>Login destination</title>', contentType: 'text/html' }));
		await page.goto(locale === 'en' ? '/' : `/${locale}/`);
		await expect(page.locator('html')).toHaveAttribute('data-hydrated', '');
		await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
		const chrome = localeCopy[locale].navChrome.shared;
		const entry = menuItems.find(item => item.href === 'https://login.yesid.dev')!;
		await expect(page.getByTestId('nav-pill').getByRole('link', { name: /login|client|clientes/i })).toHaveCount(0);
		await page.getByRole('button', { name: chrome.openMenuAria }).click();
		const menu = page.getByRole('navigation', { name: chrome.menuOverlayAria });
		const link = menu.getByRole('link', { name: `${resolveLocale(entry.label, locale)} ${resolveLocale(entry.subtitle!, locale)}`, exact: true });
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute('href', `https://login.yesid.dev/?lang=${locale}`);
		await expect(link).not.toHaveAttribute('target', '_blank');
		await expect(menu.getByText(resolveLocale(entry.subtitle!, locale), { exact: true })).toBeVisible();
		const box = (await link.boundingBox())!;
		expect(box.width).toBeGreaterThanOrEqual(44);
		expect(box.height).toBeGreaterThanOrEqual(44);
		for (let tab = 0; tab < 20 && !(await link.evaluate(el => el === document.activeElement)); tab++) await page.keyboard.press('Tab');
		await expect(link).toBeFocused();
		await expectAccessible(page, { include: '[role="dialog"]' });
		const screenshot = testInfo.outputPath('menu.png');
		await page.screenshot({ path: screenshot });
		await testInfo.attach('menu', { path: screenshot, contentType: 'image/png' });
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(`https://login.yesid.dev/?lang=${locale}`);
	});
}
