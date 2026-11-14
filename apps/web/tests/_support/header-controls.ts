import { expect, type Page } from '@playwright/test';

export async function openHeaderMenu(page: Page): Promise<void> {
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', '');
	const menu = page.getByTestId('nav-menu-toggle');
	if (await menu.getAttribute('aria-expanded') !== 'true') await menu.click();
	await expect(menu).toHaveAttribute('aria-expanded', 'true');
}

/** Compact headers expose the same signpost inside the open menu. */
export async function headerLanguageLink(page: Page) {
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', '');
	const language = page.getByTestId('language-toggle').filter({ visible: true });
	if (!(await language.isVisible())) await openHeaderMenu(page);
	await expect(language).toBeVisible();
	return language;
}
