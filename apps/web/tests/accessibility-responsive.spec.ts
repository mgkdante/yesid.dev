import { expectAccessible } from './_support/accessibility';
import { expect, test, type Page } from '@playwright/test';
import { localeCopy } from '../src/lib/locales';
import type { Locale } from '../src/lib/types';
import { DEFAULT_LOCALE } from '../src/lib/utils/locale';
import { PUBLISHED_LOCALES } from '../src/lib/utils/published-locales';
import { fixturePost, fixtureProject, fixtureService } from './_support/content-fixtures';
import { visibleContactTerminal } from './_support/helpers';

type PageCase = { template: string; path: string; landmark: string; status: 200 | 404; diagram?: boolean };
const localized = (path: string, locale: Locale) =>
	locale === DEFAULT_LOCALE ? path : `/${locale}${path === '/' ? '' : path}`;

function pageCases(locale: Locale): PageCase[] {
	return [
		{ template: 'home', path: '/', landmark: 'hero-banner', status: 200 },
		{ template: 'services listing', path: '/services', landmark: 'service-listing-page', status: 200 },
		{ template: 'projects listing', path: '/projects', landmark: 'project-listing', status: 200 },
		{ template: 'professional blog listing', path: '/blog', landmark: 'blog-listing', status: 200 },
		{ template: 'personal blog listing', path: '/blog/personal', landmark: 'blog-listing', status: 200 },
		{ template: 'about', path: '/about', landmark: 'page-about', status: 200 },
		{ template: 'contact', path: '/contact', landmark: 'page-contact', status: 200 },
		{ template: 'legal document', path: '/legal/privacy', landmark: 'page-legal', status: 200 },
		{ template: 'project detail', path: `/projects/${fixtureProject.slug}`, landmark: 'project-detail-page', status: 200 },
		{ template: 'blog detail', path: `/blog/${fixturePost(locale).slug}`, landmark: 'blog-detail-page', status: 200, diagram: true },
		{ template: 'service detail', path: `/services/${fixtureService.id}`, landmark: 'service-detail-page', status: 200 },
		{ template: 'not found', path: '/no-such-responsive-axe-page', landmark: 'error-label', status: 404 },
	];
}

async function open(page: Page, path: string, status = 200) {
	const response = await page.goto(path);
	expect(response?.status(), path).toBe(status);
	await expect.poll(() => page.evaluate(() => performance.getEntriesByName('responsive-app-mounted').length)).toBe(1);
	await expect(page.getByRole('main')).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	for (const diagram of await page.getByTestId('mermaid-diagram').all()) {
		await expect(diagram).toHaveAttribute('data-rendering', 'false');
	}
}

test.describe('responsive axe', () => {
	test.beforeEach(async ({ page }) => {
		// SiteRoot emits themechange during mount, after client handlers are attached.
		await page.addInitScript(() => {
			document.addEventListener('themechange', () => performance.mark('responsive-app-mounted'), { once: true });
		});
	});

	for (const locale of PUBLISHED_LOCALES) {
		for (const entry of pageCases(locale)) {
			test(`${locale}: ${entry.template} has no serious or critical axe violations`, async ({ page }) => {
				await open(page, localized(entry.path, locale), entry.status);
				await expect(page.getByTestId(entry.landmark)).toBeVisible();
				if (entry.diagram) await expect(page.getByTestId('mermaid-diagram').getByRole('button').first()).toBeVisible();
				await expectAccessible(page);
			});
		}

		test(`${locale}: light diagram action has no serious or critical axe violations`, async ({ page }) => {
			await page.addInitScript(() => localStorage.setItem('theme', 'light'));
			await open(page, localized(`/blog/${fixturePost(locale).slug}`, locale));
			await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
			await expect(page.getByTestId('mermaid-diagram').getByRole('button').first()).toBeVisible();
			await expectAccessible(page);
		});

		test(`${locale}: open menu has no serious or critical axe violations`, async ({ page }) => {
			await open(page, localized('/', locale));
			const chrome = localeCopy[locale].navChrome.shared;
			await page.getByRole('button', { name: chrome.openMenuAria, exact: true }).click();
			await expect(page.getByRole('dialog', { name: chrome.menuOverlayAria, exact: true })).toBeVisible();
			await expectAccessible(page, { include: '[role="dialog"]' });
		});

		test(`${locale}: invalid contact form has no serious or critical axe violations`, async ({ page }) => {
			await open(page, localized('/contact', locale));
			const form = visibleContactTerminal(page);
			await form.getByTestId('contact-submit').click();
			await expect(form.getByTestId('contact-error-summary')).toBeVisible();
			for (const key of ['name', 'email', 'message']) {
				const field = form.getByRole('textbox').and(form.locator(`[name="${key}"]`));
				await expect(field).toHaveAttribute('aria-invalid', 'true');
			}
			await expectAccessible(page);
		});
	}
});
