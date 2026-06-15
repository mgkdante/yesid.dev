import { test, expect } from '@playwright/test';

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

// slice-34.1 (Filters & search) — free-text search has no URL representation
// (the listing keeps the URL clean), so it cannot ride localizeUrl like the
// tag/service filters do. Instead it is SESSION-scoped via the locale-handoff
// orchestrator: persisted('projects-q' / 'blog-q'). The {#key pathname} subtree
// remounts on a switch, wiping the in-memory rune, and the orchestrator restores
// the typed text onto the remounted page. These specs prove the round-trip end
// to end (the unit/component layer proves the bind chain in isolation).
//
// Desktop-only (see DESKTOP_ONLY_SPECS in playwright.config.ts): the assertions
// drive the sidebar search input, which is the lg+ surface. The mobile surface
// uses the same persisted() key, so the handoff path is identical.
test.describe('State across languages — search survives a locale switch (session-scoped)', () => {
	test('projects: typed search text persists EN→FR', async ({ page }) => {
		await page.goto('/projects');
		// The sidebar search is the lg+ surface; wait on its landmark before typing.
		const search = page.getByTestId('project-search-sidebar');
		await expect(search).toBeVisible();
		await search.fill('railway');
		await expect(search).toHaveValue('railway');

		// Switch language — the page subtree remounts, so this is the real test of
		// the orchestrator restore (not just a URL carry).
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/projects');

		// The typed text is locale-free, so it comes back verbatim on the FR page.
		const searchFr = page.getByTestId('project-search-sidebar');
		await expect(searchFr).toHaveValue('railway');
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
