import { headerLanguageLink, openHeaderMenu } from './_support/header-controls';
import { expect, test, type Page } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });
const project = '/projects/transit-data-pipeline';
const action = (page: Page) => page.getByTestId('sections-toggle').filter({ visible: true });
// Seeds a remembered Collapse all; a later bulk choice still wins.
const startCollapsed = (page: Page) =>
	page.addInitScript(() => {
		if (localStorage.getItem('sections-choice') === null) localStorage.setItem('sections-choice', 'collapsed');
	});
const section = (page: Page, index: number) => page.locator(`.sections-column [data-section-index="${index}"]`);
const trigger = (page: Page, index: number) => section(page, index).locator('[data-section-trigger]').first();

test('fresh content is expanded and the bulk choice survives another page and reload', async ({ page }) => {
	await page.goto(project);
	await expect(action(page)).toHaveAccessibleName('Collapse all');
	await expect(trigger(page, 0)).toHaveAttribute('aria-expanded', 'true');
	expect(await page.evaluate(() => localStorage.getItem('sections-choice'))).toBeNull();
	await action(page).click();
	await expect(trigger(page, 0)).toHaveAttribute('aria-expanded', 'false');
	expect(await page.evaluate(() => localStorage.getItem('sections-choice'))).toBe('collapsed');
	await page.goto('/services/database-engineering');
	await expect(action(page)).toHaveAccessibleName('Expand all');
	await action(page).click();
	await page.reload();
	await expect(action(page)).toHaveAccessibleName('Collapse all');
	expect(await page.evaluate(() => localStorage.getItem('sections-choice'))).toBe('expanded');
});

test('a direct project fragment reveals its section without changing the collapsed choice', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('sections-choice', 'collapsed'));
	await page.goto(project + '#section-1');
	await expect(trigger(page, 1)).toHaveAttribute('aria-expanded', 'true');
	await expect(trigger(page, 0)).toHaveAttribute('aria-expanded', 'false');
	expect(await page.evaluate(() => localStorage.getItem('sections-choice'))).toBe('collapsed');
});

test('locale reading restoration reveals the individual reading target and Back keeps its position', async ({ page }) => {
	await startCollapsed(page);
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto(project);
	await action(page).click();
	await action(page).click();
	await trigger(page, 1).click();
	await expect(trigger(page, 1)).toHaveAttribute('aria-expanded', 'true');
	await section(page, 1).evaluate(node => {
		const body = node.querySelector<HTMLElement>('[data-slot="collapsible-content"]')!;
		const box = body.getBoundingClientRect();
		scrollTo(0, scrollY + box.top + box.height / 2 - innerHeight / 4);
	});
	await expect.poll(() => section(page, 1).evaluate(node => {
		const box = node.querySelector<HTMLElement>('[data-slot="collapsible-content"]')!.getBoundingClientRect();
		return box.top < innerHeight / 4 && box.bottom > innerHeight / 4;
	})).toBe(true);
	await (await headerLanguageLink(page)).click();
	await expect(page).toHaveURL(/\/fr\/projects\//);
	await expect(trigger(page, 1)).toHaveAttribute('aria-expanded', 'true');
	expect(await page.evaluate(() => localStorage.getItem('sections-choice'))).toBe('collapsed');
	await expect.poll(() => readingProgress(page)).toBeCloseTo(0.5, 1);
	const before = await readingProgress(page);
	await openHeaderMenu(page);
	await page.getByRole('dialog').locator('a.menu-item[href="/fr/services"]').click();
	await expect(page).toHaveURL(/\/fr\/services$/);
	await expect(page.locator('main a[href="/fr/services/database-engineering"]').filter({ visible: true }).first()).toBeVisible();
	await page.goBack();
	await expect(page).toHaveURL(/\/fr\/projects\//);
	await expect(trigger(page, 1)).toHaveAttribute('aria-expanded', 'true');
	await expect.poll(() => readingProgress(page)).toBeCloseTo(before, 1);
	await expect(trigger(page, 0)).toHaveAttribute('aria-expanded', 'false');
	expect(await page.evaluate(() => localStorage.getItem('sections-choice'))).toBe('collapsed');
});

async function readingProgress(page: Page) {
	return section(page, 1).evaluate(node => {
		const box = node.querySelector<HTMLElement>('[data-slot="collapsible-content"]')!.getBoundingClientRect();
		return (innerHeight / 4 - box.top) / box.height;
	});
}

for (const locale of ['', '/fr']) {
	for (const rapid of [false, true]) {
		test(`${locale || 'EN'} Back restores only the reading target and position${rapid ? ' immediately after departure' : ''}`, async ({ page }) => {
			await startCollapsed(page);
			await page.emulateMedia({ reducedMotion: rapid ? 'no-preference' : 'reduce' });
			await page.goto(locale + project);
			await action(page).click();
			await action(page).click();
			await trigger(page, 0).click(); // Other individual choices are deliberately not restored.
			await trigger(page, 1).click();
			await section(page, 1).evaluate(async node => {
				await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})));
			});
			await section(page, 1).evaluate(node => {
				const box = node.querySelector<HTMLElement>('[data-slot="collapsible-content"]')!.getBoundingClientRect();
				scrollTo(0, scrollY + box.top + box.height / 2 - innerHeight / 4);
			});
			await expect.poll(() => readingProgress(page)).toBeCloseTo(0.5, 1);
			const before = await readingProgress(page);
			// Activate a real route link without auto-scrolling away from the reading line.
			await page.evaluate(href => {
                const link = document.createElement('a');
                link.href = href;
                document.body.append(link);
                link.click();
            }, locale + '/services');
			await expect(page).toHaveURL(locale + '/services');
			if (!rapid) await expect(page.locator(`main a[href="${locale}/services/database-engineering"]`).filter({ visible: true }).first()).toBeVisible();
			await page.goBack();
			await expect(page).toHaveURL(locale + project);
			await expect(trigger(page, 1)).toHaveAttribute('aria-expanded', 'true');
			await expect.poll(() => readingProgress(page)).toBeCloseTo(before, 1);
			await expect(trigger(page, 0)).toHaveAttribute('aria-expanded', 'false');
			expect(await page.evaluate(() => localStorage.getItem('sections-choice'))).toBe('collapsed');
		});
	}
}
