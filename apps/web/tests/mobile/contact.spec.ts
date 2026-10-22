// Contact page mobile-flow spec — slice-19 Phase 4 Task 26.
// Runs on every Playwright project (desktop-chrome + 3 mobile profiles).

import { test, expect } from '@playwright/test';
import { visibleContactTerminal } from '../_support/helpers';

for (const [path, labels] of [
	['/contact', ['name', 'email', 'message']],
	['/fr/contact', ['nom', 'courriel', 'message']],
	['/es/contact', ['nombre', 'correo', 'mensaje']],
] as const) {
	test(`contact labels focus tappable fields and keyboard order is preserved: ${path}`, async ({ page }) => {
		await page.goto(path);
		const terminal = visibleContactTerminal(page);
		await expect(terminal.getByTestId('contact-submit')).toBeEnabled();
		for (const label of labels) {
			const input = terminal.getByLabel(`${label}:`, { exact: true });
			await terminal.getByText(`${label}:`, { exact: true }).click();
			await expect(input).toBeFocused();
			const box = await input.boundingBox();
			expect(box).not.toBeNull();
			expect(box!.height).toBeGreaterThanOrEqual(44);
		}
		await terminal.getByLabel(`${labels[0]}:`, { exact: true }).focus();
		for (const label of labels.slice(1)) {
			await page.keyboard.press('Tab');
			await expect(terminal.getByLabel(`${label}:`, { exact: true })).toBeFocused();
		}
		await page.keyboard.press('Tab');
		await expect(terminal.getByTestId('contact-submit')).toBeFocused();
	});
}

test('contact submit button has touch-friendly size', async ({ page }) => {
	await page.goto('/contact');

	// Deterministic load gate (was networkidle): the contact page container is the
	// landmark the old wait implicitly guarded. This web-first expect auto-retries.
	await expect(page.locator('[data-testid="page-contact"]')).toBeVisible();

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
