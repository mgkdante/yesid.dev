import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
	await page.goto('/');
	// No <title> is set in slice 01 — checking the app root renders instead.
	// Title will be added when real page content is built (slice 05+).
	await expect(page.getByTestId('app-root')).toBeVisible();
});

test('tagline is visible', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Data infrastructure that moves.')).toBeVisible();
});

test('wordmark is visible', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
