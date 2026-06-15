import { test, expect } from '@playwright/test';
import { mockWeb3Forms, visibleContactTerminal } from './_support/helpers';

// State across languages (slice-34 foundation) — the language switch must CARRY
// in-progress URL state (filters ?service=…, ?station=…, the engine seed) across
// EN⇄FR instead of silently dropping it (localizeHref was pathname-only). The
// query is preserved verbatim, so these assertions don't depend on real filter
// ids. Session-scope survival (search text, scroll, collapsibles) is proven
// per-family in the child slices.
test.describe('State across languages — foundation (URL state survives the switch)', () => {
	test('the toggle href carries the query string EN→FR', async ({ page }) => {
		await page.goto('/projects?service=web-development&tag=svelte');
		await expect(page.getByTestId('language-toggle')).toHaveAttribute(
			'href',
			'/fr/projects?service=web-development&tag=svelte',
		);
	});

	test('clicking the toggle lands on the FR URL with the query intact', async ({ page }) => {
		await page.goto('/projects?service=web-development&tag=svelte');
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/projects?service=web-development&tag=svelte');
		expect(page.url()).toContain('/fr/projects?service=web-development&tag=svelte');
	});

	test('the query survives the FR→EN direction too', async ({ page }) => {
		await page.goto('/fr/projects?tag=svelte');
		await expect(page.getByTestId('language-toggle')).toHaveAttribute('href', '/projects?tag=svelte');
	});

	test('a hash fragment is carried across the switch', async ({ page }) => {
		await page.goto('/about#contact');
		await expect(page.getByTestId('language-toggle')).toHaveAttribute('href', '/fr/about#contact');
	});
});

// slice-34.3 — the FLAGSHIP contact surface. A half-typed message must SURVIVE a
// locale switch (the page subtree remounts under {#key $page.url.pathname}, so the
// only thing bridging the gap is the locale-handoff orchestrator). And a SENT
// message must NOT resurrect after the switch. These drive the real
// beforeNavigate/afterNavigate hooks (the component unit tests can't).
test.describe('State across languages — contact form (session survives the switch)', () => {
	test('a half-typed message survives EN→FR', async ({ page }) => {
		await page.goto('/contact');
		const terminal = visibleContactTerminal(page);
		await expect(terminal).toBeVisible();

		const draft = 'I would like to discuss a SvelteKit dashboard project.';
		const messageEN = terminal.locator('#contact-message');
		await messageEN.fill(draft);
		await expect(messageEN).toHaveValue(draft);

		// Switch language — the {#key} remount destroys every in-memory rune; only
		// the orchestrator's sessionStorage snapshot can bring the draft back.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/contact');

		// The draft is restored into the FR-locale form (re-derived after paint).
		const messageFR = visibleContactTerminal(page).locator('#contact-message');
		await expect(messageFR).toHaveValue(draft);
	});

	test('name + email also survive, and the FR→EN direction works', async ({ page }) => {
		await page.goto('/fr/contact');
		const terminal = visibleContactTerminal(page);
		await expect(terminal).toBeVisible();

		await terminal.locator('#contact-name').fill('Ada Lovelace');
		await terminal.locator('#contact-email').fill('ada@example.com');
		await terminal.locator('#contact-message').fill('Bonjour, parlons projet.');

		await page.getByTestId('language-toggle').click();
		await page.waitForURL((url) => url.pathname === '/contact');

		const after = visibleContactTerminal(page);
		await expect(after.locator('#contact-name')).toHaveValue('Ada Lovelace');
		await expect(after.locator('#contact-email')).toHaveValue('ada@example.com');
		await expect(after.locator('#contact-message')).toHaveValue('Bonjour, parlons projet.');
	});

	test('a SENT message does not resurrect after the switch', async ({ page }) => {
		await mockWeb3Forms(page, { success: true });
		await page.goto('/contact');
		const terminal = visibleContactTerminal(page);
		await expect(terminal).toBeVisible();

		await terminal.locator('#contact-name').fill('John Doe');
		await terminal.locator('#contact-email').fill('john@example.com');
		await terminal.locator('#contact-message').fill('Please reply, this is sent.');
		await terminal.getByTestId('contact-submit').click();

		// Success screen replaces the form (the draft is cleared on submit).
		await expect(terminal.getByTestId('contact-success')).toBeVisible({ timeout: 5000 });

		// Switch language. The success state is locale-free (wasSuccessful) so it
		// re-renders in FR; the sent text must NOT come back into the form.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/contact');

		const after = visibleContactTerminal(page);
		// Still on the success screen (re-derived in FR) — the form did not reappear
		// with the sent message resurrected.
		await expect(after.getByTestId('contact-success')).toBeVisible({ timeout: 5000 });
		await expect(after.getByText('Please reply, this is sent.')).toHaveCount(0);
		await expect(after.locator('#contact-message')).toHaveCount(0);
	});
});
