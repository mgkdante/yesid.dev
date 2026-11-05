import { expect, test, type Page } from '@playwright/test';
import boot from '@yesid/ui/boot.json' with { type: 'json' };

test.use({ storageState: { cookies: [], origins: [] } });

const action = (page: Page) => page.getByTestId('sections-toggle').filter({ visible: true });
const contentTriggers = (page: Page) => page.locator('main .section-header:visible').filter({ hasNot: page.locator('h2', { hasText: 'On this page' }) });

test('bulk choice is remembered while TOC reveal affects only the current target', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/projects/transit-data-pipeline');
	await expect(action(page)).toHaveCount(1);
	await expect(action(page)).toHaveText('Expand all');
	await action(page).click();
	await expect(action(page)).toHaveText('Collapse all');
	await action(page).click();
	await expect(action(page)).toHaveText('Expand all');
	const first = page.locator('[data-section-index="0"] .section-header');
	const second = page.locator('[data-section-index="1"] .section-header');
	await expect(first).toHaveAttribute('aria-expanded', 'false');
	await expect(second).toHaveAttribute('aria-expanded', 'false');
	if (page.viewportSize()!.width < 1024) await page.getByTestId('toc-pill').click();
	const toc = page.viewportSize()!.width < 1024 ? page.getByTestId('toc-pill').getByRole('navigation') : page.locator('.toc-column nav');
	await toc.getByRole('button', { name: 'The gate decides what ships', exact: true }).click();
	await expect(second).toHaveAttribute('aria-expanded', 'true');
	await expect(first).toHaveAttribute('aria-expanded', 'false');
	await expect(action(page)).toHaveText('Collapse all');
	// Mixed state collapses everything, then the next action opens everything.
	await action(page).click();
	await expect(second).toHaveAttribute('aria-expanded', 'false');
	await action(page).click();
	await expect(first).toHaveAttribute('aria-expanded', 'true');
	await expect(second).toHaveAttribute('aria-expanded', 'true');
	await action(page).click();
	await page.reload();
	await expect(first).toHaveAttribute('aria-expanded', 'false');
	await expect(action(page)).toHaveText('Expand all');
	expect(await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content')).toContain(boot.hash);
	expect(errors).toEqual([]);
});

test('a different service applies the remembered collapsed choice', async ({ page }) => {
	await page.goto('/services/database-engineering');
	await expect(action(page)).toHaveText('Expand all');
	await action(page).click();
	await action(page).click();
	await expect(action(page)).toHaveText('Expand all');
	await page.getByTestId('service-nav-prev').click();
	await expect(page).toHaveURL(/\/services\/analytics-reporting$/);
	await expect(action(page)).toHaveText('Expand all');
	await expect(contentTriggers(page).first()).toHaveAttribute('aria-expanded', 'false');
});


test('pages with no content disclosures have no bulk action', async ({ page }) => {
	await page.goto('/about');
	await expect(page.getByTestId('nav-menu-toggle')).toBeVisible();
	await expect(page.getByTestId('sections-toggle')).toHaveCount(0);
});
