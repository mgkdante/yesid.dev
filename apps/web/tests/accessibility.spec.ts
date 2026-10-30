import { expect, test, type Page } from '@playwright/test';
import { expectAccessible } from '@yesid/config/playwright';

import { contactContent } from '../src/lib/content/contact-page';
import { menuItems } from '../src/lib/content/nav';
import { siteLabels } from '../src/lib/content/site-labels';
import { sitePages } from '../src/lib/content/site-pages';
import type { Locale } from '../src/lib/types';
import { DEFAULT_LOCALE, resolveLocale } from '../src/lib/utils/locale';
import { PUBLISHED_LOCALES } from '../src/lib/utils/published-locales';
import { visibleContactTerminal } from './_support/helpers';

const chrome = siteLabels.navChrome.shared;
const localized = (path: string, locale: Locale) =>
	locale === DEFAULT_LOCALE ? path : `/${locale}${path === '/' ? '' : path}`;
// Failing today; C10 fixes each one and deletes it here.
const KNOWN: string[] = [
	'[data-testid="project-card-info"] .data-flow-diagram.scrollable',
	'[data-theme="light"] .proof-count-total',
	'[data-theme="light"] .project-card-tag',
	'[data-theme="light"] .blog-topic-tag',
	'[data-theme="light"] .belief-badge',
	'[data-theme="light"] .belief-title',
	'[data-testid="contact-submit"] > .opacity-60',
	'[data-testid="contact-booking-link"] > .opacity-60',
	'[data-theme="light"] [data-testid="contact-error-summary"]',
];

async function openMenu(page: Page, locale: Locale) {
	const menu = page.getByRole('navigation', { name: resolveLocale(chrome.menuOverlayAria, locale) });
	await expect(async () => {
		if (!(await menu.isVisible()))
			await page.getByRole('button', { name: resolveLocale(chrome.openMenuAria, locale) }).click();
		await expect(menu).toBeVisible({ timeout: 1000 });
	}).toPass();
}

test.describe('accessibility', { tag: '@theme' }, () => {
	for (const { path } of sitePages) {
		for (const locale of PUBLISHED_LOCALES) {
			const url = localized(path, locale);
			test(`${url} has no serious or critical axe violations`, async ({ page }) => {
				await page.goto(url);
				await page.evaluate(() => document.fonts.ready);
				// A window splitter reports its position once the page hydrates.
				for (const splitter of await page.getByRole('separator').all()) {
					await expect(splitter).toHaveAttribute('aria-valuenow', /\d/);
				}
				await expectAccessible(page, { exclude: KNOWN });
			});
		}
	}

	for (const locale of PUBLISHED_LOCALES) {
		test(`${locale}: the open menu has no serious or critical axe violations`, async ({ page }) => {
			await page.goto(localized(menuItems[0].href, locale));
			await openMenu(page, locale);
			await expectAccessible(page, { include: '[role="dialog"]', exclude: KNOWN });
		});
	}

	test('the contact form stays accessible while it shows its errors', async ({ page }) => {
		await page.goto('/contact');
		const form = visibleContactTerminal(page);
		await form.getByTestId('contact-submit').click();
		await expect(form.getByText('✗ ' + contactContent.validation.required.en.replace('{field}', contactContent.formTerminal.fields.name.label.en))).toBeVisible();
		await expectAccessible(page, { exclude: KNOWN });
	});
});
