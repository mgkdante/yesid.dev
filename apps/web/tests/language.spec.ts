import { aboutPageContent } from '../src/lib/content/about-page';
import { contactContent } from '../src/lib/content/contact-page';
import { siteLabels } from '../src/lib/content/site-labels';

import { test, expect, type Page, type Locator } from '@playwright/test';
import { mockWeb3Forms, visibleContactTerminal } from './_support/helpers';

test.skip(({ viewport }) => viewport!.width < 1024, 'Desktop composition or viewport-independent.');

const FIRST_ARTICLE = {
  en: '/blog/the-two-hour-internet-slot',
  fr: '/fr/blog/le-creneau-internet-de-deux-heures',
  es: '/es/blog/el-turno-de-dos-horas-para-usar-internet',
} as const;

test.describe('Language toggle — click navigation + content change', () => {

  test('language toggle preserves path across all routes (en → fr → es → en cycle)', async ({ page }) => {
    const testPaths = [
      { en: '/services', fr: '/fr/services', es: '/es/services' },
      { en: '/projects', fr: '/fr/projects', es: '/es/projects' },
      { en: '/blog', fr: '/fr/blog', es: '/es/blog' },
    ];

    for (const { en, fr, es } of testPaths) {
      // EN → FR
      await page.goto(en);
      const toggle = page.getByTestId('language-toggle');
      const href = await toggle.getAttribute('href');
      expect(href).toBe(fr);

      // FR → ES
      await page.goto(fr);
      const toggleEs = page.getByTestId('language-toggle');
      const hrefEs = await toggleEs.getAttribute('href');
      expect(hrefEs).toBe(es);

      // ES → EN (cycle closes, no prefix)
      await page.goto(es);
      const toggleBack = page.getByTestId('language-toggle');
      const hrefBack = await toggleBack.getAttribute('href');
      expect(hrefBack).toBe(en);
    }
  });

  test('blog detail cycles through exact translated slugs and returns to English', async ({ page }) => {
    await page.goto(FIRST_ARTICLE.en);
    let toggle = page.getByTestId('language-toggle');
    await expect(toggle).toHaveAttribute('href', FIRST_ARTICLE.fr);
    await toggle.click();
    await page.waitForURL(FIRST_ARTICLE.fr);

    toggle = page.getByTestId('language-toggle');
    await expect(toggle).toHaveAttribute('href', FIRST_ARTICLE.es);
    await toggle.click();
    await page.waitForURL(FIRST_ARTICLE.es);

    toggle = page.getByTestId('language-toggle');
    await expect(toggle).toHaveAttribute('href', FIRST_ARTICLE.en);
  });

});

test.describe('State across languages — foundation (URL state survives the switch)', () => {

	test('the query survives the FR→ES and ES→EN directions too (3-locale cycle)', async ({ page }) => {
		// en → fr → es → en: FR now points at ES; ES closes the cycle back to EN.
		await page.goto('/fr/projects?tag=svelte');
		await expect(page.getByTestId('language-toggle')).toHaveAttribute('href', '/es/projects?tag=svelte');
		await page.goto('/es/projects?tag=svelte');
		await expect(page.getByTestId('language-toggle')).toHaveAttribute('href', '/projects?tag=svelte');
	});

	test('a hash fragment is carried across the switch', async ({ page }) => {
		await page.goto('/about#contact');
		await expect(page.getByTestId('language-toggle')).toHaveAttribute('href', '/fr/about#contact');
	});
});

test.describe('State across languages — search survives a locale switch (session-scoped)', () => {

	test('projects: search persists FR→ES→EN (click-twice cycle)', async ({ page }) => {
		await page.goto('/fr/projects');
		const search = page.getByTestId('project-search-sidebar');
		await expect(search).toBeVisible();
		await search.fill('sveltekit');
		await expect(search).toHaveValue('sveltekit');
		// Click 1: FR → ES — the draft survives the first remount.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/es/projects');
		await expect(page.getByTestId('project-search-sidebar')).toHaveValue('sveltekit');
		// Click 2: ES → EN — and the second one.
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

test.describe('State across languages — contact form (session survives the switch)', () => {

	test('name + email also survive, and FR reaches EN via ES (click-twice)', async ({ page }) => {
		await page.goto('/fr/contact');
		const terminal = visibleContactTerminal(page);
		await expect(terminal).toBeVisible();
		await terminal.getByLabel(new RegExp(`^(?:${Object.values(contactContent.formTerminal.fields.name.label).join('|')}):$`, 'i')).fill('Ada Lovelace');
		await terminal.getByLabel(new RegExp(`^(?:${Object.values(contactContent.formTerminal.fields.email.label).join('|')}):$`, 'i')).fill('ada@example.com');
		await terminal.getByLabel(new RegExp(`^(?:${Object.values(contactContent.formTerminal.fields.message.label).join('|')}):$`, 'i')).fill('Bonjour, parlons projet.');
		// Click 1: FR → ES — the draft survives the first remount.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/es/contact');
		await expect(visibleContactTerminal(page).getByLabel(new RegExp(`^(?:${Object.values(contactContent.formTerminal.fields.message.label).join('|')}):$`, 'i'))).toHaveValue(
			'Bonjour, parlons projet.',
		);
		// Click 2: ES → EN — and the second one, all three fields intact.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL((url) => url.pathname === '/contact');
		const after = visibleContactTerminal(page);
		await expect(after.getByLabel(new RegExp(`^(?:${Object.values(contactContent.formTerminal.fields.name.label).join('|')}):$`, 'i'))).toHaveValue('Ada Lovelace');
		await expect(after.getByLabel(new RegExp(`^(?:${Object.values(contactContent.formTerminal.fields.email.label).join('|')}):$`, 'i'))).toHaveValue('ada@example.com');
		await expect(after.getByLabel(new RegExp(`^(?:${Object.values(contactContent.formTerminal.fields.message.label).join('|')}):$`, 'i'))).toHaveValue('Bonjour, parlons projet.');
	});

	test('a SENT message does not resurrect after the switch', async ({ page }) => {
		await mockWeb3Forms(page, { success: true });
		await page.goto('/contact');
		const terminal = visibleContactTerminal(page);
		await expect(terminal).toBeVisible();
		await terminal.getByLabel(new RegExp(`^(?:${Object.values(contactContent.formTerminal.fields.name.label).join('|')}):$`, 'i')).fill('John Doe');
		await terminal.getByLabel(new RegExp(`^(?:${Object.values(contactContent.formTerminal.fields.email.label).join('|')}):$`, 'i')).fill('john@example.com');
		await terminal.getByLabel(new RegExp(`^(?:${Object.values(contactContent.formTerminal.fields.message.label).join('|')}):$`, 'i')).fill('Please reply, this is sent.');
		await terminal.getByTestId('contact-submit').click();
		await expect(terminal.getByTestId('contact-success')).toBeVisible({ timeout: 5000 });
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/contact');
		const after = visibleContactTerminal(page);
		await expect(after.getByTestId('contact-success')).toBeVisible({ timeout: 5000 });
		await expect(after.getByText('Please reply, this is sent.')).toHaveCount(0);
		await expect(after.getByLabel(new RegExp(`^(?:${Object.values(contactContent.formTerminal.fields.message.label).join('|')}):$`, 'i'))).toHaveCount(0);
	});
});

	async function polaroidTotal(counter: import('@playwright/test').Locator): Promise<string> {
		const text = (await counter.textContent()) ?? '';
		const total = text.split('/')[1]?.trim() ?? '';
		expect(Number(total)).toBe(aboutPageContent.identity.polaroids.length);
		return total;
	}

	test('the /about polaroid index survives FR→ES→EN (click-twice cycle)', async ({ page }) => {
		await page.goto('/fr/about');
		const counter = page.getByTestId('about-polaroid-counter');
		await expect(counter).toBeVisible();
		const total = await polaroidTotal(counter);
		await page.getByTestId('about-polaroid-next').click();
		await expect(counter).toHaveText(`2/${total}`);
		// Click 1: FR → ES — the index survives the first remount.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/es/about');
		await expect(page.getByTestId('about-polaroid-counter')).toHaveText(`2/${total}`);
		// Click 2: ES → EN — and the second one.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL((url) => url.pathname === '/about');
		await expect(page.getByTestId('about-polaroid-counter')).toHaveText(`2/${total}`);
	});

function firstVisibleSectionTrigger(page: Page): Locator {
	return page
		.locator('[data-slot="card"] button[aria-expanded]')
		.filter({ visible: true })
		.first();
}

	test('the collapse survives FR→ES→EN (click-twice cycle)', async ({ page }) => {
		await page.goto('/fr/projects');
		const firstCard = page.getByTestId('project-card').first();
		await expect(firstCard).toBeVisible();
		await firstCard.click();
		await expect(page.getByTestId('project-detail-page')).toBeVisible();

		const trigger = firstVisibleSectionTrigger(page);
		await expect(trigger).toBeVisible();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await trigger.click();
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');

		// Click 1: FR → ES — the collapse survives the first remount.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/es/projects/**');
		await expect(page.getByTestId('project-detail-page')).toBeVisible();
		const esTrigger = firstVisibleSectionTrigger(page);
		await expect(esTrigger).toBeVisible();
		await expect(esTrigger).toHaveAttribute('aria-expanded', 'false');

		// Click 2: ES → EN — and the second one.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL((url) => /^\/projects\//.test(url.pathname));
		await expect(page.getByTestId('project-detail-page')).toBeVisible();

		const enTrigger = firstVisibleSectionTrigger(page);
		await expect(enTrigger).toBeVisible();
		await expect(enTrigger).toHaveAttribute('aria-expanded', 'false');
	});

const PROJECTS_URL = '/projects';
const SCROLL_TO = 450; // a few hundred px down — clear of the top, within the listing
const TOLERANCE = 200; // loose: Lenis settle + FR/EN height drift, anti-flake

async function waitForHydration(page: Page): Promise<void> {
	await expect
		.poll(() => page.evaluate(() => document.documentElement.classList.contains('lenis')))
		.toBe(true);
}

	test('listing: /projects scroll position is preserved across EN→FR toggle', async ({
		page,
	}) => {
		// Lenis (and the fragile-on-touch synthetic scroll) is desktop-only; the
		// default restore still runs on mobile via native window.scrollTo, but the
		// deterministic `lenis` hydration signal is desktop-only, so scope the
		// assertion to desktop where the Lenis path is the one under test.
		await page.emulateMedia({ reducedMotion: 'no-preference' });

		await page.goto(PROJECTS_URL);
		await expect(page.getByTestId('project-listing')).toBeVisible();
		await waitForHydration(page);

		// Scroll down a few hundred px and let Lenis settle.
		await page.evaluate((y) => window.scrollTo(0, y), SCROLL_TO);
		await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(
			SCROLL_TO - TOLERANCE,
		);

		// Toggle the locale (the fingerpost preserves path+query+hash and sets
		// data-sveltekit-reset="false", so the orchestrator owns scroll restore).
		const toggle = page.getByTestId('language-toggle');
		await expect(toggle).toBeVisible();
		await toggle.click();

		// The remounted FR page paints, then the orchestrator restores scroll.
		await expect(page).toHaveURL(/\/fr\/projects/);
		await expect(page.getByTestId('project-listing')).toBeVisible();
		await waitForHydration(page);

		// The position must be RESTORED — near where we left it, NOT reset to ~0.
		// Loose bounds: only assert "still meaningfully scrolled", anti-flake.
		await expect
			.poll(() => page.evaluate(() => Math.round(window.scrollY)), {
				message: 'scroll should be restored, not reset to the top',
				timeout: 4000,
			})
			.toBeGreaterThan(SCROLL_TO - TOLERANCE);

		const restored = await page.evaluate(() => Math.round(window.scrollY));
		expect(restored, 'restored position must be in the captured neighborhood').toBeLessThan(
			SCROLL_TO + TOLERANCE,
		);
	});

test('route /fr/blog language filter contains only the active locale', async ({ page }) => {
    await page.goto('/fr/blog');

    // (networkidle removed: the very next assertion is a web-first toBeVisible()
    // that auto-waits for the filter sidebar — the wait was redundant.)
    // The sidebar lives in the listing grid's filter column (.listing-filter-column),
    // which ListingFrame always shows at desktop width.
    const langFilter = page
      .getByTestId('blog-filter-sidebar').filter({ visible: true })
      .first();
    await expect(langFilter).toBeVisible();

    // The Language FilterGroup renders whenever ≥1 language exists; it surfaces
    // the localized section label "Langue" plus per-language buttons.
    await expect(langFilter).toContainText(siteLabels.blogChrome.listing.filters.language.fr!);

    // The server narrows the listing before deriving facets. The only language
    // option on the French route is therefore French; persisted EN/ES filters
    // cannot hide the active-locale posts after a locale switch.
    const options = langFilter.getByRole('radio');
    expect(await options.count()).toBeGreaterThan(0);
    await expect(langFilter.getByRole('radio', { name: siteLabels.ui.languageNames.fr.fr! })).toBeVisible();
    await expect(langFilter.getByRole('radio', { name: siteLabels.ui.languageNames.en.fr! })).toHaveCount(0);
    await expect(langFilter.getByRole('radio', { name: siteLabels.ui.languageNames.es.fr! })).toHaveCount(0);
  });
