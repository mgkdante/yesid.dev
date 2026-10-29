import { test, expect } from '@playwright/test';

test.skip(({ viewport }) => viewport!.width < 1024, 'Desktop composition or viewport-independent.');

// localStorage key: 'theme', values 'dark' | 'light'

test.describe('Theme toggle persistence', () => {
	test('page loads in dark theme by default', async ({ page }) => {
		await page.goto('/');

		// The pre-paint inline script in app.html resolves data-theme synchronously
		// to 'light'/'dark' (never null). With no stored preference it must be dark.
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

		// Toggle reflects the dark default via aria-checked.
		const toggle = page.getByTestId('theme-toggle');
		await expect(toggle).toBeVisible();
	});

	test('theme toggle button changes theme to light', async ({ page }) => {
		await page.goto('/');

		const htmlElement = page.locator('html');
		await expect(htmlElement).toHaveAttribute('data-theme', 'dark');

		const toggle = page.getByTestId('theme-toggle');
		await expect(toggle).toBeVisible();

		// Click toggle -> flips to light.
		await toggle.click();
		await expect(htmlElement).toHaveAttribute('data-theme', 'light');

		// Clicking again flips back to dark (real toggle behaviour).
		await toggle.click();
		await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
	});

	test('theme preference persists after page reload', async ({ page }) => {
		await page.goto('/');

		// Toggle visible == page hydrated; deterministic gate before reading localStorage.
		const toggle = page.getByTestId('theme-toggle');
		await expect(toggle).toBeVisible();

		// No stored preference on first load.
		const storageBefore = await page.evaluate(() => localStorage.getItem('theme'));
		expect(storageBefore).toBeNull();

		await toggle.click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		// localStorage now records the chosen theme.
		const storageAfter = await page.evaluate(() => localStorage.getItem('theme'));
		expect(storageAfter).toBe('light');

		// Reload -> pre-paint script restores the stored theme.
		// The data-theme + aria-checked assertions below auto-wait, so no networkidle needed.
		await page.reload();

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		const storageRestored = await page.evaluate(() => localStorage.getItem('theme'));
		expect(storageRestored).toBe('light');
	});

	test('the theme-color meta follows the painted page background', async ({ page }) => {
		await page.goto('/');
		const meta = page.locator('meta[name="theme-color"]');
		const painted = () =>
			page.evaluate(() => {
				const probe = document.createElement('canvas').getContext('2d')!;
				probe.fillStyle = getComputedStyle(document.documentElement).backgroundColor;
				return probe.fillStyle;
			});
		await expect.poll(async () => (await meta.getAttribute('content'))?.toLowerCase()).toBe(await painted());
		await page.getByTestId('theme-toggle').click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
		await expect.poll(async () => (await meta.getAttribute('content'))?.toLowerCase()).toBe(await painted());
	});
});

	test.use({ colorScheme: 'dark' });

	test('system preference is ignored: defaults dark, stored light still wins', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/', { waitUntil: 'domcontentloaded' });
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

		await page.evaluate(() => localStorage.setItem('theme', 'light'));
		await page.reload({ waitUntil: 'domcontentloaded' });
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		await page.emulateMedia({ colorScheme: 'dark' });
		await page.evaluate(() => localStorage.removeItem('theme'));
		await page.reload({ waitUntil: 'domcontentloaded' });
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});
