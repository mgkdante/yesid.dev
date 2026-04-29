import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
	await page.goto('/');
	// No <title> is set in slice 01 — checking the app root renders instead.
	// Title will be added when real page content is built (slice 05+).
	await expect(page.getByTestId('app-root')).toBeVisible();
});

test('hero section is visible', async ({ page }) => {
	await page.goto('/');
	// "Digital infrastructure that moves." was a static string in slice 01.
	// As of slice-18i it is CMS-sourced (subheadline field on block_hero).
	// Assert the hero banner section is visible instead — it is always rendered.
	await expect(page.getByTestId('hero-banner')).toBeVisible();
});

test('wordmark is visible', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
