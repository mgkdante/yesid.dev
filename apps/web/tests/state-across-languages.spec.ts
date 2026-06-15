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

// slice-34.5 — Selections & carousels. Session-scoped survival: the active
// polaroid index on /about is a locale-free integer registered with the
// locale-handoff orchestrator (persisted('about-polaroid', 0)). The {#key
// pathname} page remount on a switch destroys every rune, and the orchestrator
// restores the carried index after paint — so the SAME photo is showing before
// and after the EN⇄FR toggle, with no URL param involved. Mirrors the toggle
// click flow in tests/i18n-language-toggle.spec.ts.
test.describe('State across languages — slice-34.5 (carousel selection survives the switch)', () => {
	// The polaroid TOTAL ("/N") is CMS-content-driven, so the counter's denominator
	// is read from the DOM (`/N`) rather than hardcoded — only the carried POSITION
	// (the "M" in "M/N") is the assertion. Guard: at least 3 polaroids so the
	// advance-twice flow has somewhere to go.
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
		await expect(counter).toHaveText(`1/${total}`); // cold load = first polaroid

		// Advance to the 3rd polaroid.
		const next = page.getByTestId('about-polaroid-next');
		await next.click();
		await next.click();
		await expect(counter).toHaveText(`3/${total}`);

		// Switch EN → FR. The page remounts; the orchestrator restores the index.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/about');

		// Same polaroid is showing on the FR page (the index carried).
		await expect(page.getByTestId('about-polaroid-counter')).toHaveText(`3/${total}`);
	});

	test('the /about polaroid index survives FR→EN too', async ({ page }) => {
		await page.goto('/fr/about');
		const counter = page.getByTestId('about-polaroid-counter');
		await expect(counter).toBeVisible();
		const total = await polaroidTotal(counter);

		// Advance once → 2nd polaroid.
		await page.getByTestId('about-polaroid-next').click();
		await expect(counter).toHaveText(`2/${total}`);

		// Switch FR → EN.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL((url) => url.pathname === '/about');

		await expect(page.getByTestId('about-polaroid-counter')).toHaveText(`2/${total}`);
	});
});
