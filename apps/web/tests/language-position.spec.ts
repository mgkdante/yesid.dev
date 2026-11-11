import { test, expect, type Locator, type Page } from '@playwright/test';

// Read at the same line as the detail TOC, without depending on its active-ID observer.
async function progress(section: Locator): Promise<number> {
	return section.evaluate((el) => {
		const box = el.getBoundingClientRect();
		return (window.innerHeight * 0.25 - box.top) / box.height;
	});
}

async function readMiddle(page: Page, section: Locator): Promise<void> {
	// A click before Kit's router starts is a full page load, which never hands off.
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', '');
	await expect(page.getByTestId('sections-toggle').filter({ visible: true }).first()).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await expect(section.locator('.mermaid-diagram__fallback')).toHaveCount(0);
	await section.evaluate((el) => {
		const box = el.getBoundingClientRect();
		window.scrollTo(0, window.scrollY + box.top + box.height * 0.5 - window.innerHeight * 0.25);
	});
	await expect.poll(() => progress(section)).toBeCloseTo(0.5, 1);
}


// A matching position can briefly exist before afterNavigate restores. Wait for
// the transient handoff to be consumed before asserting or switching again.
async function handoffFinished(page: Page): Promise<void> {
	await expect.poll(() => page.evaluate(() =>
		Object.keys(sessionStorage).some((key) => key.startsWith('yesid:lstate:')),
	)).toBe(false);
}

async function expectReadingProgress(page: Page, section: Locator, expected: number): Promise<void> {
	await page.evaluate(() => document.fonts.ready);
	await expect(section.locator('.mermaid-diagram__fallback')).toHaveCount(0);
	await expect.poll(() => progress(section)).toBeCloseTo(expected, 1);
}

test('project language switch keeps progress inside the long first section', async ({ page }) => {
	await page.goto('/projects/transit-data-pipeline', { waitUntil: 'domcontentloaded' });
	const section = page.locator('.sections-column [data-section-index="0"]');
	await expect(section).toBeVisible();
	await readMiddle(page, section);
	const before = await progress(section);
	await page.getByTestId('language-toggle').click();
	await expect(page).toHaveURL(/\/fr\/projects\/transit-data-pipeline$/);
	await handoffFinished(page);
	await expectReadingProgress(page, section, before);
});

test('project language switch does not open a closed target section', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('sections-choice', 'collapsed'));
	await page.goto('/projects/transit-data-pipeline', { waitUntil: 'domcontentloaded' });
	const closed = page.locator('.sections-column [data-section-index="1"]');
	const trigger = closed.locator('[data-section-trigger]');
	if (await trigger.getAttribute('aria-expanded') === 'true') await trigger.click();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	await expect.poll(() => closed.locator('[data-slot="collapsible-content"]').evaluate(el => el.getBoundingClientRect().height)).toBe(0);
	await readMiddle(page, closed);
	if (page.viewportSize()!.width >= 1024) {
		await expect(page.locator('nav.toc-nav > .toc-item').nth(1)).toHaveAttribute('aria-current', 'location');
	}
	await page.getByTestId('language-toggle').click();
	await expect(page).toHaveURL(/\/fr\/projects\/transit-data-pipeline$/);
	await handoffFinished(page);
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

for (const detail of [
	{ name: 'service', path: '/services/web-development', selector: '.sections.article-body [data-toc="svc-deliverables"]' },
	{ name: 'blog', path: '/blog/four-projects-four-stacks', selector: '[data-testid="blog-sections"] > .blog-section-block' },
]) {
	test(`${detail.name} keeps section progress through EN, FR, ES and back`, async ({ page }) => {
		await page.goto(detail.path, { waitUntil: 'domcontentloaded' });
		const section = page.locator(detail.selector).first();
		await expect(section).toBeVisible();
		await readMiddle(page, section);
		const before = await progress(section);
		for (const locale of ['fr', 'es', 'en']) {
			const toggle = page.getByTestId('language-toggle');
			const href = await toggle.getAttribute('href');
			expect(href).toBeTruthy();
			await toggle.click();
			await expect(page).toHaveURL(href!);
			await expect(page.locator('html')).toHaveAttribute('lang', locale);
			await handoffFinished(page);
			await expectReadingProgress(page, section, before);
		}
	});
}

test('project keeps reading progress with reduced motion @motion', async ({ page }) => {
	await page.goto('/projects/transit-data-pipeline', { waitUntil: 'domcontentloaded' });
	const section = page.locator('.sections-column [data-section-index="0"]');
	await expect(section).toBeVisible();
	await readMiddle(page, section);
	await page.getByTestId('language-toggle').click();
	await expect(page).toHaveURL(/\/fr\/projects\/transit-data-pipeline$/);
	await handoffFinished(page);
	await expectReadingProgress(page, section, 0.5);
});

