import { test, expect } from '@playwright/test';
import { mockWeb3Forms, visibleContactTerminal } from './_support/helpers';

// Ground truth (src/lib/components/contact/ContactPage.svelte + content/contact-page.ts):
//   - Errors render as `✗ {message}` inside the visible form terminal.
//   - required:     "required, {field} cannot be empty"  → "✗ required, name cannot be empty"
//   - invalidEmail: "invalid, enter a valid email address"
//   - errorSummary: "{count} errors, fix and retry"
//   - The email <input type="email"> runs NATIVE constraint validation first. A
//     value with no "@" (e.g. "not-an-email") is blocked by the browser before
//     the Svelte onsubmit handler runs, so the app's custom error never renders.
//     To exercise the app's *own* regex (/^[^\s@]+@[^\s@]+\.[^\s@]+$/, which
//     additionally requires a dot in the domain) we use a value that is valid to
//     the native check but invalid to the app: "john@nodomain".
//   - The form terminal (data-testid="contact-form-terminal") is rendered TWICE
//     (desktop + mobile snippets); only one is visible per viewport. The <form>
//     lives inside that terminal, so we scope every assertion to the visible
//     terminal via visibleContactTerminal(page).
//
// No networkidle: the contact info-terminal fires a one-shot fetch('/api/weather')
// + a DOM clock interval against the live preview, so 'networkidle' is racy/slow.
// We wait on the deterministic landmark — the visible form terminal becoming
// visible — before reading text or clicking.

test.describe('Contact form validation', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/contact');
		// Deterministic readiness signal: the visible form terminal is mounted.
		await expect(visibleContactTerminal(page)).toBeVisible();
	});

	test('contact form shows validation errors on empty submit', async ({ page }) => {
		const form = visibleContactTerminal(page);
		const submitBtn = form.getByTestId('contact-submit');

		await submitBtn.click();

		// Each required field renders its own error, scoped to the visible form.
		await expect(form.getByText('✗ required, name cannot be empty')).toBeVisible();
		await expect(form.getByText('✗ required, email cannot be empty')).toBeVisible();
		await expect(form.getByText('✗ required, message cannot be empty')).toBeVisible();

		// Three field-level required errors (name, email, message).
		const requiredErrs = form.getByText(/✗ required,.*cannot be empty/);
		expect(await requiredErrs.count()).toBe(3);

		// Error summary reflects the count.
		await expect(form.getByText('✗ 3 errors, fix and retry')).toBeVisible();
	});

	test('contact form shows invalid email error', async ({ page }) => {
		const form = visibleContactTerminal(page);

		await form.locator('#contact-name').fill('John Doe');
		// Valid to <input type="email"> (has "@"), invalid to the app regex
		// (domain has no dot) — so the app's own validation runs and reports it.
		await form.locator('#contact-email').fill('john@nodomain');
		await form.locator('#contact-message').fill('Test message');

		await form.getByTestId('contact-submit').click();

		await expect(form.getByText('✗ invalid, enter a valid email address')).toBeVisible();
	});

	test('contact form does not submit when email is invalid', async ({ page }) => {
		// Intercept the Web3Forms endpoint BEFORE the action so we can prove it is
		// never called when client-side validation rejects the email.
		const { submittedEmails } = await mockWeb3Forms(page, { success: true });

		const form = visibleContactTerminal(page);
		await form.locator('#contact-name').fill('John Doe');
		await form.locator('#contact-email').fill('john@nodomain');
		await form.locator('#contact-message').fill('Test message');

		await form.getByTestId('contact-submit').click();

		// The invalid-email error must show (handler ran, validation rejected).
		await expect(form.getByText('✗ invalid, enter a valid email address')).toBeVisible();
		// Give any (erroneous) network call time to fire before asserting absence.
		await page.waitForTimeout(500);
		expect(submittedEmails).toEqual([]);
	});

	test('contact form shows required field error for empty name', async ({ page }) => {
		const form = visibleContactTerminal(page);

		await form.locator('#contact-email').fill('test@example.com');
		await form.locator('#contact-message').fill('Test message');

		await form.getByTestId('contact-submit').click();

		await expect(form.getByText('✗ required, name cannot be empty')).toBeVisible();
	});

	test('contact form shows required field error for empty email', async ({ page }) => {
		const form = visibleContactTerminal(page);

		await form.locator('#contact-name').fill('John Doe');
		await form.locator('#contact-message').fill('Test message');

		await form.getByTestId('contact-submit').click();

		await expect(form.getByText('✗ required, email cannot be empty')).toBeVisible();
	});

	test('contact form shows required field error for empty message', async ({ page }) => {
		const form = visibleContactTerminal(page);

		await form.locator('#contact-name').fill('John Doe');
		await form.locator('#contact-email').fill('test@example.com');

		await form.getByTestId('contact-submit').click();

		await expect(form.getByText('✗ required, message cannot be empty')).toBeVisible();
	});

	test('contact form accepts valid email formats', async ({ page }) => {
		// Stub Web3Forms so a passing submission is deterministic. The intent: valid
		// emails must NOT be blocked by client validation — the handler should reach
		// the fetch and the success sequence should render (no ✗ errors at all).
		const { submittedEmails } = await mockWeb3Forms(page, { success: true });

		const validEmails = ['user@example.com', 'john.doe@company.co.uk', 'test+tag@domain.org'];

		for (const email of validEmails) {
			await page.goto('/contact');
			// Deterministic readiness signal instead of networkidle.
			await expect(visibleContactTerminal(page)).toBeVisible();

			const form = visibleContactTerminal(page);
			await form.locator('#contact-name').fill('Test User');
			await form.locator('#contact-email').fill(email);
			await form.locator('#contact-message').fill('Test message');

			await form.getByTestId('contact-submit').click();

			// On success the <form> is swapped for the success terminal, so scope to
			// the visible form terminal (which persists). Valid input ⇒ success
			// animation renders, proving validation never blocked the submission.
			const terminal = visibleContactTerminal(page);
			await expect(terminal.getByTestId('contact-success')).toBeVisible();
			// No validation error survived (the form is gone entirely).
			await expect(page.getByText('✗ invalid, enter a valid email address')).toHaveCount(0);
		}

		// Every valid email reached the Web3Forms call (validation never blocked it).
		expect(submittedEmails).toEqual(validEmails);
	});
});
