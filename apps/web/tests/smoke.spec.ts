import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
	await page.goto('/');
	// No <title> is set in slice 01 — checking the app root renders instead.
	// Title will be added when real page content is built (slice 05+).
	await expect(page.getByTestId('app-root')).toBeVisible();
});

test('hero section data chain renders a non-empty headline', async ({ page }) => {
	await page.goto('/');
	// Component shell assertion — the hero banner section is always rendered.
	await expect(page.getByTestId('hero-banner')).toBeVisible();
	// Data-flow assertion: the headline element is present and non-empty.
	// Verifies the static adapter / CMS adapter → +page.svelte → DOM chain
	// without coupling to specific copy (which lives in Directus and changes
	// independently of engineering). If the chain breaks, hero-line1 is missing
	// or empty; we don't care what the words are.
	const heroLine1 = page.getByTestId('hero-line1');
	await expect(heroLine1).toBeVisible();
	expect((await heroLine1.textContent())?.trim()).toBeTruthy();
});

test('wordmark is visible', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
