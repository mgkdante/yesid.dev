import { expect, test, type Page } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow, expectTapTargets } from '@yesid/config/playwright';

import { projects } from '../src/lib/content/projects';
import { blogPosts } from '../src/lib/content/blog';
import { services } from '../src/lib/content/services';
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
// Each locale's own pages: a post exists in one language only.
const pages = PUBLISHED_LOCALES.flatMap((locale) => {
	const post = blogPosts.find((entry) => entry.lang === locale);
	const postPath = post && `/blog/${post.slug}`;
	return [
		...sitePages.map(({ path }) => path),
		`/projects/${projects[0].slug}`,
		...(postPath ? [postPath] : []),
		`/services/${services[0].id}`,
	].map((path) => ({ locale, url: localized(path, locale), post: path === postPath }));
});

async function open(page: Page, { url, post }: (typeof pages)[number]) {
	const response = await page.goto(url);
	expect(response?.ok(), url).toBe(true);
	if (post) await expect(page.getByTestId('blog-detail-page')).toBeVisible();
}

async function openMenu(page: Page, locale: Locale) {
	const menu = page.getByRole('navigation', { name: resolveLocale(chrome.menuOverlayAria, locale) });
	await expect(async () => {
		if (!(await menu.isVisible()))
			await page.getByRole('button', { name: resolveLocale(chrome.openMenuAria, locale) }).click();
		await expect(menu).toBeVisible({ timeout: 1000 });
	}).toPass();
}

test.describe('accessibility', { tag: '@theme' }, () => {
	for (const entry of pages) {
		test(`${entry.url} has no serious or critical axe violations`, async ({ page }) => {
			await open(page, entry);
			await page.evaluate(() => document.fonts.ready);
			await expectAccessible(page);
		});
	}

	for (const locale of PUBLISHED_LOCALES) {
		test(`${locale}: the open menu has no serious or critical axe violations`, async ({ page }) => {
			await page.goto(localized(menuItems[0].href, locale));
			await openMenu(page, locale);
			await expectAccessible(page, { include: '[role="dialog"]' });
		});
	}

	test('the contact form stays accessible while it shows its errors', async ({ page }) => {
		await page.goto('/contact');
		const form = visibleContactTerminal(page);
		await form.getByTestId('contact-submit').click();
		await expect(form.getByText('✗ ' + contactContent.validation.required.en.replace('{field}', contactContent.formTerminal.fields.name.label.en))).toBeVisible();
		await expectAccessible(page);
	});
});

// Links in CMS body copy are text links (WCAG 2.5.8 inline exception); its other controls are still measured.
const TAP_EXEMPT = ['[data-testid="blog-section-body"] a'];

for (const entry of pages) {
	test(`${entry.url} keeps the page skeleton, fits the viewport and sizes its targets`, async ({ page }) => {
		await open(page, entry);
		await page.keyboard.press('Tab');
		await expect(page.locator(':focus')).toHaveAttribute('href', '#main');
		await expect(page.locator(':focus')).toHaveAccessibleName(resolveLocale(chrome.skipToContentLabel!, entry.locale));
		await expect(page.getByRole('banner')).toHaveCount(1);
		await expect(page.getByRole('main')).toHaveAttribute('id', 'main');
		await expect(page.getByRole('contentinfo')).toHaveCount(1);
		await expectNoHorizontalOverflow(page);
		await expectTapTargets(page, { exclude: TAP_EXEMPT });
	});
}
