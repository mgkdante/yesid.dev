import { test, expect, type Locator, type Page } from '@playwright/test';

// Read at the same line as the detail TOC, without depending on its active-ID observer.
async function progress(section: Locator): Promise<number> {
	return section.evaluate((el) => {
		const box = el.getBoundingClientRect();
		return (window.innerHeight * 0.25 - box.top) / box.height;
	});
}

async function readMiddle(page: Page, section: Locator): Promise<void> {
	await section.evaluate((el) => {
		const box = el.getBoundingClientRect();
		window.scrollTo(0, window.scrollY + box.top + box.height * 0.5 - window.innerHeight * 0.25);
	});
	await expect.poll(() => progress(section)).toBeCloseTo(0.5, 1);
}

test('project language switch keeps progress inside the long first section', async ({ page }) => {
	await page.goto('/projects/transit-data-pipeline');
	const section = page.locator('.sections-column [data-section-index="0"]');
	await expect(section).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await readMiddle(page, section);
	const before = await progress(section);
	await page.getByTestId('language-toggle').click();
	await expect(page).toHaveURL(/\/fr\/projects\/transit-data-pipeline$/);
	await expect.poll(() => progress(section)).toBeCloseTo(before, 1);
});

test('project language switch does not open a closed target section', async ({ page }) => {
	await page.goto('/projects/transit-data-pipeline');
	const closed = page.locator('.sections-column [data-section-index="1"]');
	const trigger = closed.locator('[data-section-trigger]');
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	await readMiddle(page, closed);
	if (page.viewportSize()!.width >= 1024) {
		await expect(page.locator('nav.toc-nav > .toc-item').nth(1)).toHaveAttribute('aria-current', 'location');
	}
	await page.getByTestId('language-toggle').click();
	await expect(page).toHaveURL(/\/fr\/projects\/transit-data-pipeline$/);
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

for (const detail of [
	{ name: 'service', path: '/services/web-development', selector: '.sections.article-body [data-toc="svc-deliverables"]' },
	{ name: 'blog', path: '/blog/changing-language-should-not-mean-starting-over', selector: '[data-testid="blog-sections"] > .blog-section-block' },
]) {
	test(`${detail.name} keeps section progress through EN, FR, ES and back`, async ({ page }) => {
		await page.goto(detail.path);
		const section = page.locator(detail.selector).first();
		await expect(section).toBeVisible();
		await page.evaluate(() => document.fonts.ready);
		await readMiddle(page, section);
		const before = await progress(section);
		for (const locale of ['fr', 'es', 'en']) {
			const toggle = page.getByTestId('language-toggle');
			const href = await toggle.getAttribute('href');
			expect(href).toBeTruthy();
			await toggle.click();
			await expect(page).toHaveURL(href!);
			await expect(page.locator('html')).toHaveAttribute('lang', locale);
			await expect.poll(() => progress(section)).toBeCloseTo(before, 1);
		}
	});
}

test('project keeps reading progress with reduced motion @motion', async ({ page }) => {
	await page.goto('/projects/transit-data-pipeline');
	const section = page.locator('.sections-column [data-section-index="0"]');
	await expect(section).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await readMiddle(page, section);
	await page.getByTestId('language-toggle').click();
	await expect(page).toHaveURL(/\/fr\/projects\/transit-data-pipeline$/);
	await expect.poll(() => progress(section)).toBeCloseTo(0.5, 1);
});

