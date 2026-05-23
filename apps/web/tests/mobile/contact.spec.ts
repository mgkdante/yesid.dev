// Contact page mobile-flow spec — slice-19 Phase 4 Task 26.
// Runs on every Playwright project (desktop-chrome + 3 mobile profiles).

import { test, expect } from '@playwright/test';

test('contact form is interactive and inputs are tappable', async ({ page }) => {
	await page.goto('/contact');
	await page.waitForLoadState('networkidle');

	// Contact page container
	await expect(page.locator('[data-testid="page-contact"]')).toBeVisible();

	// ContactPage renders the form in both a mobile-stacked and a desktop-resizable
	// container — both are in the DOM. Filter to the visible instance.
	// Named inputs from ContactPage.svelte: id="contact-name", "contact-email", "contact-message"
	const nameInput = page.locator('#contact-name').filter({ visible: true }).first();
	await expect(nameInput).toBeVisible();
	await nameInput.focus();

	const box = await nameInput.boundingBox();
	expect(box).not.toBeNull();
	// All form fields have min-h-11 (44px); verify the rendered height
	if (box) {
		expect(box.height).toBeGreaterThanOrEqual(44);
	}
});

test('contact submit button has touch-friendly size', async ({ page }) => {
	await page.goto('/contact');
	await page.waitForLoadState('networkidle');

	// Button component renders as <button type="submit"> inside the form.
	// Both mobile-stacked and desktop-resizable containers render a submit button;
	// filter to the visible one.
	const submitButton = page.locator('button[type="submit"]').filter({ visible: true }).first();
	await expect(submitButton).toBeVisible();

	const box = await submitButton.boundingBox();
	expect(box).not.toBeNull();
	if (box) {
		expect(box.width).toBeGreaterThanOrEqual(44);
		expect(box.height).toBeGreaterThanOrEqual(44);
	}
});
