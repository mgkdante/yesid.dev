import { expect, test } from '@playwright/test';
import { siteLabels } from '../src/lib/content/site-labels';

test('touch buttons shrink once across hero, CTA band and contact form', async ({ page, isMobile }) => {
	test.skip(!isMobile, 'Touch press behavior');
	await page.emulateMedia({ reducedMotion: 'reduce' });
	for (const [path, ids] of [
		['/', ['hero-cta-projects', 'hero-cta-contact', 'home-cta-band-contact', 'home-cta-band-github']],
		['/contact', ['contact-submit']],
	] as const) {
		await page.goto(path, { waitUntil: 'domcontentloaded' });
		for (const id of ids) {
			const button = page.getByTestId(id).filter({ visible: true }).first();
			await button.scrollIntoViewIfNeeded();
			await expect(button).toBeEnabled();
			await page.evaluate(() => document.fonts.ready);
			const width = (await button.boundingBox())!.width;
			await button.dispatchEvent('pointerdown', { pointerType: 'touch', bubbles: true });
			await expect.poll(async () => (await button.boundingBox())!.width / width).toBeCloseTo(0.94, 2);
			await button.dispatchEvent('pointercancel', { pointerType: 'touch', bubbles: true });
			await expect.poll(async () => (await button.boundingBox())!.width / width).toBeCloseTo(1, 2);
		}
	}
});

test('date disclosure waits for its handler before accepting keyboard activation', async ({ page, viewport }, testInfo) => {
	test.skip(viewport!.width < 1024, 'Desktop filter rail');
	let releaseBootstrap!: () => void;
	const bootstrap = new Promise<void>((resolve) => { releaseBootstrap = resolve; });
	await page.route('**/_app/immutable/entry/start.*.js', async (route) => {
		await bootstrap;
		await route.continue();
	});
	try {
		await page.goto('/blog', { waitUntil: 'domcontentloaded' });
		const sidebar = page.locator('.listing-filter-column [data-testid="blog-filter-sidebar"]');
		const toggle = sidebar.getByRole('button', { name: siteLabels.blogChrome.listing.filters.dateRange.en });
		await expect(toggle).toBeDisabled();
		await sidebar.screenshot({ path: testInfo.outputPath('date-before-hydration.png'), timeout: 10_000 });
		releaseBootstrap();
		await expect(toggle).toBeEnabled();
		await toggle.focus();
		await page.keyboard.press('Enter');
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await page.keyboard.press('Tab');
		await expect(sidebar.locator('input[type="date"]').first()).not.toBeFocused();
		await expect(sidebar.locator('input[type="date"]').last()).not.toBeFocused();
		await sidebar.screenshot({ path: testInfo.outputPath('date-closed-after-hydration.png'), timeout: 10_000 });
	} finally {
		releaseBootstrap();
	}
});

test('closed date filter skips its inputs during keyboard navigation', async ({ page, viewport }) => {
	test.skip(viewport!.width < 1024, 'Desktop filter rail');
	await page.goto('/blog', { waitUntil: 'domcontentloaded' });
	const sidebar = page.locator('.listing-filter-column [data-testid="blog-filter-sidebar"]');
	const toggle = sidebar.getByRole('button', { name: siteLabels.blogChrome.listing.filters.dateRange.en });
	await expect(toggle).toBeEnabled();
	await toggle.focus();
	await page.keyboard.press('Enter');
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await page.keyboard.press('Tab');
	await expect(sidebar.locator('input[type="date"]').first()).not.toBeFocused();
	await expect(sidebar.locator('input[type="date"]').last()).not.toBeFocused();
	await toggle.focus();
	await page.keyboard.press('Space');
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('Tab');
	await expect(sidebar.locator('input[type="date"]').first()).toBeFocused();
});

for (const locale of ['en', 'fr', 'es'] as const) {
	const prefix = locale === 'en' ? '' : `/${locale}`;
	test(`${locale} controls keep their notice and manifesto in both themes @theme`, async ({ page }) => {
		await page.goto(prefix || '/', { waitUntil: 'domcontentloaded' });
		const word = page.getByTestId('manifesto-line-huge');
		await word.scrollIntoViewIfNeeded();
		await page.evaluate(() => document.fonts.ready);
		expect(await word.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
		for (const section of ['projects', 'blog']) {
			await page.goto(`${prefix}/${section}`, { waitUntil: 'domcontentloaded' });
			await page.getByTestId(section === 'projects' ? 'project-search-sidebar' : 'blog-search-sidebar').fill('zzzznomatchterm');
			await expect(page.locator('[data-slot="state-notice"][role="status"]')).toBeVisible();
		}
	});
	test(`${locale} manifesto word fits its box`, async ({ page }) => {
		await page.goto(prefix || '/', { waitUntil: 'domcontentloaded' });
		const word = page.locator('.manifesto__line-huge');
		await word.scrollIntoViewIfNeeded();
		await page.evaluate(() => document.fonts.ready);
		expect(await word.evaluate(element => {
			const range = document.createRange();
			range.selectNodeContents(element);
			const text = range.getBoundingClientRect();
			const box = element.getBoundingClientRect();
			return text.left >= box.left - 1 && text.right <= box.right + 1;
		})).toBe(true);
	});

	for (const section of ['projects', 'blog']) {
		test(`${locale} ${section} empty results use the shared status notice`, async ({ page }) => {
			await page.goto(`${prefix}/${section}`, { waitUntil: 'domcontentloaded' });
			await page.getByTestId(section === 'projects' ? 'project-search-sidebar' : 'blog-search-sidebar').filter({ visible: true }).fill('zzzznomatchterm');
			await expect(page.locator('[data-slot="state-notice"][role="status"]')).toBeVisible();
		});
	}
}
