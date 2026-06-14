import { test, expect } from '@playwright/test';

// Ground truth (src/lib/components/layout/ThemeToggle.svelte + src/lib/stores/theme.svelte.ts + src/app.html):
//   - toggle control: data-testid="theme-toggle", role="switch", aria-checked={isDark}
//   - localStorage key: 'theme', values 'dark' | 'light'
//   - theme reflected on <html data-theme="...">; pre-paint script always writes 'dark' or 'light' (never null); dark is default
//   - meta[name="theme-color"] SSR'd '#141414' (dark surface); toggle to light => '#F7F2E9'

test.describe('Theme toggle persistence', () => {
	test('page loads in dark theme by default', async ({ page }) => {
		await page.goto('/');

		// The pre-paint inline script in app.html resolves data-theme synchronously
		// to 'light'/'dark' (never null). With no stored preference it must be dark.
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

		// Toggle reflects the dark default via aria-checked.
		const toggle = page.getByTestId('theme-toggle');
		await expect(toggle).toBeVisible();
		await expect(toggle).toHaveAttribute('role', 'switch');
		await expect(toggle).toHaveAttribute('aria-checked', 'true');
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
		await expect(toggle).toHaveAttribute('aria-checked', 'false');

		// Clicking again flips back to dark (real toggle behaviour).
		await toggle.click();
		await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
		await expect(toggle).toHaveAttribute('aria-checked', 'true');
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
		await expect(page.getByTestId('theme-toggle')).toHaveAttribute('aria-checked', 'false');

		const storageRestored = await page.evaluate(() => localStorage.getItem('theme'));
		expect(storageRestored).toBe('light');
	});

	test('theme-color meta tag updates with theme', async ({ page }) => {
		await page.goto('/');

		// SSR'd dark surface. The toHaveAttribute assertion below auto-waits, so no networkidle needed.
		const themeMeta = page.locator('meta[name="theme-color"]');
		await expect(themeMeta).toHaveAttribute('content', '#141414');

		const toggle = page.getByTestId('theme-toggle');
		await expect(toggle).toBeVisible();

		// Toggle to light -> store rewrites the meta to the light surface.
		await toggle.click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
		await expect(themeMeta).toHaveAttribute('content', '#F7F2E9');

		const newColor = await themeMeta.getAttribute('content');
		expect(newColor).toMatch(/^#[0-9A-F]{6}$/i);
	});
});
