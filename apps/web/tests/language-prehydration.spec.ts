import { test, expect } from '@playwright/test';

for (const detail of [
	{ name: 'project', path: '/projects/transit-data-pipeline', selector: '.sections-column [data-section-index="0"]' },
	{ name: 'service', path: '/services/web-development', selector: '.sections.article-body [data-toc="svc-deliverables"]' },
	{ name: 'blog', path: '/blog/four-projects-four-stacks', selector: '[data-testid="blog-sections"] > .blog-section-block' },
]) {
	test(`${detail.name} preserves reading position when language changes before hydration`, async ({ page }) => {
		let release!: () => void;
		const bundle = new Promise<void>((resolve) => { release = resolve; });
		await page.route('**/_app/immutable/**/*.js', async (route) => {
			await bundle;
			await route.continue();
		});
		try {
			await page.goto(detail.path, { waitUntil: 'commit' });
			const section = page.locator(detail.selector).first();
			await expect(section).toBeVisible();
			await page.evaluate(() => document.fonts.ready);
			await expect(page.locator('html')).not.toHaveAttribute('data-hydrated');
			await section.evaluate((el) => {
				const box = el.getBoundingClientRect();
				window.scrollTo(0, scrollY + box.top + box.height * 0.5 - innerHeight * 0.25);
			});
			const progress = () => section.evaluate((el) => {
				const box = el.getBoundingClientRect();
				return (innerHeight * 0.25 - box.top) / box.height;
			});
			await expect.poll(progress).toBeCloseTo(0.5, 1);
			const headerWidth = await page.getByTestId('nav').evaluate((el) =>
				el.getBoundingClientRect().width - parseFloat(getComputedStyle(el).paddingInlineEnd),
			);
			if (headerWidth < 600) {
				await page.getByTestId('nav-menu-toggle').click();
				const nativeControls = page.locator('[popover]:popover-open');
				await expect(nativeControls).toBeVisible();
				await expect(nativeControls.getByTestId('language-toggle')).toBeVisible();
				await expect(page.locator('html')).not.toHaveAttribute('data-hydrated');
			}
			const language = page.getByTestId('language-toggle');
			const href = await language.getAttribute('href');
			await language.click({ noWaitAfter: true });
			release();
			await expect(page).toHaveURL(href!);
			await expect(page.locator('html')).toHaveAttribute('data-hydrated', '');
			await page.evaluate(() => document.fonts.ready);
			await expect(section.locator('.mermaid-diagram__fallback')).toHaveCount(0);
			await expect.poll(progress).toBeCloseTo(0.5, 1);
		} finally {
			release();
			await page.unrouteAll({ behavior: 'wait' });
		}
	});
}
