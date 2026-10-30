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
const paths = [
	...sitePages.map(({ path }) => path),
	`/projects/${projects[0].slug}`,
	`/blog/${blogPosts[0].slug}`,
	`/services/${services[0].id}`,
];
// In files C9 is reshaping; C10b's second part fixes each and deletes it here.
const KNOWN: string[] = [
	'[data-testid="project-card-info"] .data-flow-diagram.scrollable',
	'.proof-count-total',
	'a[data-testid="project-card"], a[data-testid="proof-card"]',
	'[data-testid="closer-row"]',
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
	for (const path of paths) {
		for (const locale of PUBLISHED_LOCALES) {
			const url = localized(path, locale);
			test(`${url} has no serious or critical axe violations`, async ({ page }) => {
				await page.goto(url);
				await page.evaluate(() => document.fonts.ready);
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

// Hero, project carousel and manifesto pills are in files C9 is reshaping; C10b's second part fixes and deletes these.
const TAP_KNOWN = ['[data-testid="hero-banner"]', '[data-testid="proof-prev"]', '[data-testid="proof-next"]', '[data-testid="manifesto-pill"]'];
// CMS body copy: its links are text links, under WCAG 2.5.8's inline exception.
const TAP_EXEMPT = ['[data-testid="blog-section-body"]'];

for (const path of paths) {
	for (const locale of PUBLISHED_LOCALES) {
		const url = localized(path, locale);
		test(`${url} keeps the page skeleton, fits the viewport and sizes its targets`, async ({ page }) => {
			await page.goto(url);
			await page.keyboard.press('Tab');
			await expect(page.locator(':focus')).toHaveAttribute('href', '#main');
			await expect(page.getByRole('banner')).toHaveCount(1);
			await expect(page.getByRole('main')).toHaveAttribute('id', 'main');
			await expect(page.getByRole('contentinfo')).toHaveCount(1);
			await expectNoHorizontalOverflow(page);
			await expectTapTargets(page, { exclude: [...TAP_KNOWN, ...TAP_EXEMPT] });
		});
	}
}
