import { test, expect, type Page } from '@playwright/test';

test.skip(({ viewport }) => viewport!.width < 1024, 'Desktop composition or viewport-independent.');

async function expectIdleHero(page: Page) {
	await expect(page.getByTestId('hero-banner')).toHaveClass(/hero-intro-done/);
	await expect(page.locator('.hero-metro-wrapper')).toBeHidden();
	await expect(page.getByTestId('hero-line1')).toBeVisible();
	await expect(page.locator('.hero-pin').locator('..')).not.toHaveClass(/pin-spacer/);
	await expect(page.locator('html')).not.toHaveAttribute('data-hero-intro-done');
}

test('server-rendered hero is collapsed before JavaScript runs', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	const page = await context.newPage();
	try {
		await page.goto('/');
		await expectIdleHero(page);
	} finally {
		await context.close();
	}
});

for (const storage of ['fresh', 'today', 'yesterday', 'corrupt', 'denied']) {
	test(`${storage} storage: initial load and reload never start the metro`, async ({ page }) => {
		await page.clock.setFixedTime(new Date('2026-06-15T12:00:00'));
		await page.addInitScript((state) => {
			if (state === 'denied') {
				Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } });
				return;
			}
			const now = new Date();
			if (state === 'yesterday') now.setDate(now.getDate() - 1);
			const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
			if (state === 'fresh') localStorage.removeItem('yesid:hero-intro-day');
			else localStorage.setItem('yesid:hero-intro-day', state === 'corrupt' ? 'invalid' : day);
		}, storage);
		await page.goto('/');
		await expectIdleHero(page);
		await page.reload();
		await expectIdleHero(page);
		await expect(page.getByTestId('hero-dot-replay')).toBeEnabled();
	});
}

test('reload during a visitor-started intro returns to the idle hero', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('hero-dot-replay').click();
	await expect(page.locator('.hero-pin').locator('..')).toHaveClass(/pin-spacer/);
	await page.reload();
	await expectIdleHero(page);
});

test('Back and Forward return to the idle hero without starting an intro', async ({ page }) => {
	await page.goto('/');
	// The URL changes before the view transition swaps the page in; going Back earlier races that swap.
	await page.getByTestId('hero-cta-projects').click();
	await expect(page.getByTestId('project-listing')).toBeVisible();
	await page.goBack();
	await expectIdleHero(page);
	await page.goForward();
	await expect(page.getByTestId('project-listing')).toBeVisible();
	await page.goBack();
	await expectIdleHero(page);
	await expect(page.getByTestId('hero-dot-replay')).toBeEnabled();
});
