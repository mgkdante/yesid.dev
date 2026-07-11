// Shared e2e helpers — DRY the patterns that recur across the Playwright suite.
//
// Not a *.spec.ts file, so Playwright's testMatch ('**/*.spec.ts') never collects
// it as a test; it is still type-checked by svelte-check.
//
// Design rule for this suite: NEVER use page.waitForLoadState('networkidle').
// Against the deployed Vercel preview the contact info-terminal fires a live
// fetch('/api/weather') and a DOM clock interval, so "network idle" is racy and
// slow. Always wait on a deterministic signal instead — a landmark testid via
// expect(locator).toBeVisible(), or page.waitForURL(...) for navigation.

import { type Page, type Locator, expect } from '@playwright/test';

/** Web3Forms submit endpoint — intercepted so contact tests never touch the network. */
export const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

/**
 * Stub the Web3Forms POST. Must be called BEFORE the submit click.
 * Returns `submittedEmails` — the e-mail of every request that reached the route,
 * so a test can prove valid input was NOT blocked by client-side validation.
 */
export async function mockWeb3Forms(
	page: Page,
	opts: { success?: boolean } = {}
): Promise<{ submittedEmails: string[] }> {
	const success = opts.success ?? true;
	const submittedEmails: string[] = [];
	await page.route(WEB3FORMS_URL, async (route) => {
		try {
			const body = route.request().postDataJSON?.();
			if (body?.email) submittedEmails.push(body.email);
		} catch {
			/* non-JSON body — ignore */
		}
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success })
		});
	});
	return { submittedEmails };
}

/**
 * The contact form is rendered TWICE (desktop + mobile terminal snippets); only
 * one is visible per viewport. Scope locators to the visible terminal to avoid
 * Playwright strict-mode "resolved to 2 elements" errors.
 */
export function visibleContactTerminal(page: Page): Locator {
	return page.getByTestId('contact-form-terminal').filter({ visible: true }).first();
}

/** First real project detail link on the /projects listing (excludes the listing itself). */
export const projectDetailLinks = (page: Page): Locator => page.locator('a[href^="/projects/"]');

/** First real service detail link on the /services listing. */
export const serviceDetailLinks = (page: Page): Locator => page.locator('a[href^="/services/"]');

/**
 * First real blog post link on the /blog listing. Scoped to blog-row anchors so
 * the /blog/personal corner link (sidebar-only) is intrinsically excluded.
 */
export const blogPostLinks = (page: Page): Locator =>
	// The blog-row anchor IS the link — it carries data-testid="blog-row" AND the
	// locale-aware /[fr|es]/blog/<slug> href itself (BlogRow.svelte), there is no
	// nested <a>. Match the anchor directly (a descendant combinator would resolve
	// to zero); data-testid excludes the /blog/personal corner link.
	page.locator('a[data-testid="blog-row"][href*="/blog/"]');

/**
 * Navigate to the first real detail page under a listing and return its href.
 * Asserts a link exists (no silent vacuous pass) and waits for the detail
 * landmark instead of networkidle.
 *
 *   const href = await gotoFirstDetail(page, '/projects', projectDetailLinks, 'project-detail-page');
 */
export async function gotoFirstDetail(
	page: Page,
	listingPath: string,
	links: (page: Page) => Locator,
	detailTestId: string
): Promise<string> {
	await page.goto(listingPath);
	const link = links(page).first();
	await expect(link, `expected at least one detail link under ${listingPath}`).toBeVisible();
	const href = await link.getAttribute('href');
	expect(href, `detail link under ${listingPath} must have an href`).toBeTruthy();
	await page.goto(href!);
	await expect(page.getByTestId(detailTestId)).toBeVisible();
	return href!;
}
