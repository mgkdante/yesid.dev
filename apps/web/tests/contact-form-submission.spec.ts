import { test, expect, type Locator, type Page } from '@playwright/test';

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

// The contact page renders the form snippet twice (desktop + mobile terminals);
// only one is visible per viewport. Scope every interaction to the visible
// terminal so strict-mode locators resolve to a single element.
function visibleFormTerminal(page: Page): Locator {
	return page.getByTestId('contact-form-terminal').filter({ visible: true }).first();
}

// Mock the Web3Forms endpoint. The submit handler treats `!result.success`
// (and any thrown/aborted fetch) as a failure, so success === { success:true }.
async function mockWeb3Forms(page: Page, success: boolean) {
	await page.route(WEB3FORMS_URL, (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success }),
		}),
	);
}

test.describe('Contact form submission', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/contact');
		await page.waitForLoadState('networkidle');
	});

	test('contact form shows success state after valid submit', async ({ page }) => {
		await mockWeb3Forms(page, true);

		const terminal = visibleFormTerminal(page);
		await terminal.locator('#contact-name').fill('John Doe');
		await terminal.locator('#contact-email').fill('john@example.com');
		await terminal.locator('#contact-message').fill('I would like to discuss a project.');

		await terminal.getByTestId('contact-submit').click();

		// Form is replaced by the typed success sequence.
		const success = terminal.getByTestId('contact-success');
		await expect(success).toBeVisible({ timeout: 5000 });

		// Assert the real success copy renders (animation reveals lines over time):
		// the "send --message" command line and the "Message sent successfully!"
		// confirmation (contactContent.success.sent).
		await expect(success.getByText('~ $ send --message')).toBeVisible({ timeout: 5000 });
		await expect(success.getByText('Message sent successfully!')).toBeVisible({ timeout: 5000 });

		// The input form is gone.
		await expect(terminal.locator('#contact-name')).toHaveCount(0);
	});

	test('contact form keeps the form (no success) when the API reports failure', async ({ page }) => {
		await mockWeb3Forms(page, false);

		const terminal = visibleFormTerminal(page);
		await terminal.locator('#contact-name').fill('John Doe');
		await terminal.locator('#contact-email').fill('john@example.com');
		await terminal.locator('#contact-message').fill('Test message');

		await terminal.getByTestId('contact-submit').click();

		// No success state — the form stays mounted.
		await expect(terminal.getByTestId('contact-success')).toHaveCount(0);
		await expect(terminal.locator('#contact-name')).toBeVisible();

		// The form-level send error is shown (contactContent.sendErrorMessage),
		// rendered with the ✗ marker.
		const formError = terminal.getByText('Failed to send message. Please try again.');
		await expect(formError).toBeVisible();
		await expect(formError).toContainText('✗');
	});

	test('contact form reset button clears the form and returns to input state', async ({ page }) => {
		await mockWeb3Forms(page, true);

		const terminal = visibleFormTerminal(page);
		const nameInput = terminal.locator('#contact-name');
		const emailInput = terminal.locator('#contact-email');
		const messageInput = terminal.locator('#contact-message');

		await nameInput.fill('John Doe');
		await emailInput.fill('john@example.com');
		await messageInput.fill('Test message');
		await terminal.getByTestId('contact-submit').click();

		const success = terminal.getByTestId('contact-success');
		await expect(success).toBeVisible({ timeout: 5000 });

		// Reset control inside the success block (contactContent.success.resetLabel).
		await success.getByRole('button', { name: 'reset --form' }).click();

		// Back to the input state, fields cleared.
		await expect(nameInput).toBeVisible();
		await expect(emailInput).toBeVisible();
		await expect(messageInput).toBeVisible();
		await expect(terminal.getByTestId('contact-success')).toHaveCount(0);

		expect(await nameInput.inputValue()).toBe('');
		expect(await emailInput.inputValue()).toBe('');
		expect(await messageInput.inputValue()).toBe('');
	});
});
