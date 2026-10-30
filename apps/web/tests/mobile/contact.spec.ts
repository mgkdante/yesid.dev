// Contact page mobile-flow spec — slice-19 Phase 4 Task 26.
// Runs on every Playwright project (desktop-chrome + 3 mobile profiles).

import { test, expect } from '@playwright/test';
import { visibleContactTerminal } from '../_support/helpers';

for (const [path, labels] of [
	['/contact', ['name', 'email', 'message']],
	['/fr/contact', ['nom', 'courriel', 'message']],
	['/es/contact', ['nombre', 'correo', 'mensaje']],
] as const) {
	test(`contact labels focus their fields and keyboard order is preserved: ${path}`, async ({ page }) => {
		await page.goto(path);
		const terminal = visibleContactTerminal(page);
		await expect(terminal.getByTestId('contact-submit')).toBeEnabled();
		for (const label of labels) {
			const input = terminal.getByLabel(`${label}:`, { exact: true });
			await terminal.getByText(`${label}:`, { exact: true }).click();
			await expect(input).toBeFocused();
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
