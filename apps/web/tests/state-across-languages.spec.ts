import { test, expect } from '@playwright/test';
import { mockWeb3Forms, visibleContactTerminal } from './_support/helpers';

// State across languages (slice-34 foundation) — the language switch must CARRY
// in-progress URL state (filters ?service=…, ?station=…, the engine seed) across
// EN⇄FR instead of silently dropping it (localizeHref was pathname-only). The
// query is preserved verbatim, so these assertions don't depend on real filter
// ids. Session-scope survival (search text, contact draft, carousel) is proven
// per-family below.
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

// slice-34.1 (Filters & search) — free-text search has no URL representation, so
// it is SESSION-scoped via the locale-handoff orchestrator (persisted). The
// {#key pathname} subtree remounts on a switch, wiping the rune; the orchestrator
// restores the typed text onto the remounted page. Desktop-only (drives the lg+
// sidebar search — see DESKTOP_ONLY_SPECS in playwright.config.ts).
test.describe('State across languages — search survives a locale switch (session-scoped)', () => {
	test('projects: typed search text persists EN→FR', async ({ page }) => {
		await page.goto('/projects');
		const search = page.getByTestId('project-search-sidebar');
		await expect(search).toBeVisible();
		await search.fill('railway');
		await expect(search).toHaveValue('railway');
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/projects');
		await expect(page.getByTestId('project-search-sidebar')).toHaveValue('railway');
	});

	test('projects: search persists FR→EN too', async ({ page }) => {
		await page.goto('/fr/projects');
		const search = page.getByTestId('project-search-sidebar');
		await expect(search).toBeVisible();
		await search.fill('sveltekit');
		await expect(search).toHaveValue('sveltekit');
		await page.getByTestId('language-toggle').click();
		await page.waitForURL((url) => url.pathname === '/projects');
		await expect(page.getByTestId('project-search-sidebar')).toHaveValue('sveltekit');
	});

	test('blog: typed search text persists EN→FR', async ({ page }) => {
		await page.goto('/blog');
		const search = page.getByTestId('blog-search-sidebar');
		await expect(search).toBeVisible();
		await search.fill('infrastructure');
		await expect(search).toHaveValue('infrastructure');
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/blog');
		await expect(page.getByTestId('blog-search-sidebar')).toHaveValue('infrastructure');
	});
});

// slice-34.3 — the FLAGSHIP contact surface. A half-typed message must SURVIVE a
// locale switch (the page subtree remounts under {#key $page.url.pathname}; only the
// locale-handoff orchestrator bridges the gap). And a SENT message must NOT
// resurrect. These drive the real beforeNavigate/afterNavigate hooks.
test.describe('State across languages — contact form (session survives the switch)', () => {
	test('a half-typed message survives EN→FR', async ({ page }) => {
		await page.goto('/contact');
		const terminal = visibleContactTerminal(page);
		await expect(terminal).toBeVisible();
		const draft = 'I would like to discuss a SvelteKit dashboard project.';
		const messageEN = terminal.locator('#contact-message');
		await messageEN.fill(draft);
		await expect(messageEN).toHaveValue(draft);
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/contact');
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
		await expect(terminal.getByTestId('contact-success')).toBeVisible({ timeout: 5000 });
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/contact');
		const after = visibleContactTerminal(page);
		await expect(after.getByTestId('contact-success')).toBeVisible({ timeout: 5000 });
		await expect(after.getByText('Please reply, this is sent.')).toHaveCount(0);
		await expect(after.locator('#contact-message')).toHaveCount(0);
	});
});

// slice-34.5 — Selections & carousels. The active /about polaroid index is a
// locale-free integer registered with the orchestrator (persisted('about-polaroid',
// 0)). The {#key pathname} remount destroys the rune; the orchestrator restores the
// carried index after paint — the same photo shows before and after the toggle,
// with no URL param involved.
test.describe('State across languages — selections (carousel survives the switch)', () => {
	// The polaroid TOTAL ("/N") is CMS-content-driven, so the denominator is read
	// from the DOM; only the carried POSITION (the "M" in "M/N") is asserted.
	async function polaroidTotal(counter: import('@playwright/test').Locator): Promise<string> {
		const text = (await counter.textContent()) ?? '';
		const total = text.split('/')[1]?.trim() ?? '';
		expect(Number(total)).toBeGreaterThanOrEqual(3);
		return total;
	}

	test('the /about polaroid index survives EN→FR', async ({ page }) => {
		await page.goto('/about');
		const counter = page.getByTestId('about-polaroid-counter');
		await expect(counter).toBeVisible();
		const total = await polaroidTotal(counter);
		await expect(counter).toHaveText(`1/${total}`);
		const next = page.getByTestId('about-polaroid-next');
		await next.click();
		await next.click();
		await expect(counter).toHaveText(`3/${total}`);
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/about');
		await expect(page.getByTestId('about-polaroid-counter')).toHaveText(`3/${total}`);
	});

	test('the /about polaroid index survives FR→EN too', async ({ page }) => {
		await page.goto('/fr/about');
		const counter = page.getByTestId('about-polaroid-counter');
		await expect(counter).toBeVisible();
		const total = await polaroidTotal(counter);
		await page.getByTestId('about-polaroid-next').click();
		await expect(counter).toHaveText(`2/${total}`);
		await page.getByTestId('language-toggle').click();
		await page.waitForURL((url) => url.pathname === '/about');
		await expect(page.getByTestId('about-polaroid-counter')).toHaveText(`2/${total}`);
	});
});
