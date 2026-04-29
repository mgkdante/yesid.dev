import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
	await page.goto('/');
	// No <title> is set in slice 01 — checking the app root renders instead.
	// Title will be added when real page content is built (slice 05+).
	await expect(page.getByTestId('app-root')).toBeVisible();
});

test('hero section is visible with CMS-routed static fallback content', async ({ page }) => {
	await page.goto('/');
	// Component shell assertion — the hero banner section is always rendered.
	await expect(page.getByTestId('hero-banner')).toBeVisible();
	// Data-flow assertion: the static adapter supplies heroContent.headline.line1
	// ("PIPELINES THAT") which flows through staticAdapter.content.hero →
	// +page.svelte → DOM. This verifies the full data chain is intact, not just
	// that the component shell rendered.
	await expect(page.getByText('PIPELINES THAT', { exact: false })).toBeVisible();
});

test('wordmark is visible', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
