import { siteLabels } from '../src/lib/content/site-labels';
import { contactContent } from '../src/lib/content/contact-page';
import { test, expect } from '@playwright/test';
import { visibleContactTerminal } from './_support/helpers';

test.describe('French locale coverage', () => {
  test('route /fr/contact renders with French chrome', async ({ page }) => {
    const response = await page.goto('/fr/contact');
    expect(response?.status()).toBe(200);

    // Verify contact terminals are visible
    await expect(page.locator('[data-testid="contact-info-terminal"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="contact-form-terminal"]').first()).toBeVisible();

    // Get visible form
    const form = page.locator('form').filter({ visible: true }).first();

    // The terminal-style field labels (name:/email:/message:) are intentionally
    // English keys in both locales, so we assert the FR chrome that IS localized:
    // the info terminal renders French section headers (EMPLACEMENT / CONNEXION).
    const infoTerminal = page.locator('[data-testid="contact-info-terminal"]').first();
    await expect(infoTerminal).toContainText(contactContent.infoTerminal.sectionLabels.location.fr!);
    await expect(infoTerminal).toContainText(contactContent.infoTerminal.sectionLabels.connect.fr!);

    // Soft check: the form exposes its three terminal field labels.
    const labelTexts = await form.locator('label').allTextContents();
    expect(labelTexts.length).toBeGreaterThanOrEqual(3);
  });

  test('route /fr/contact form validation errors in French', async ({ page }) => {
    await page.goto('/fr/contact');

    // Wait on the deterministic landmark the networkidle was implicitly guarding:
    // the visible contact form terminal must be present before we interact with it.
    const terminal = visibleContactTerminal(page);
    await expect(terminal).toBeVisible();

    // Get visible form (scoped to the visible terminal) and submit empty
    const form = terminal.locator('form').filter({ visible: true }).first();
    const submitBtn = form.locator('button[type="submit"]').filter({ visible: true });

    await submitBtn.click();

    // Verify error messages appear and are rendered in French.
    // Empty-submit yields "✗ requis, <field> ne peut pas être vide" (contact-page.ts validation.required.fr).
    const errorMsg = page.locator('text=/✗/').first();
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(contactContent.validation.required.fr!.replace('{field}', contactContent.formTerminal.fields.name.label.fr!));
  });

  test('route /fr/projects renders French content', async ({ page }) => {
    const response = await page.goto('/fr/projects');
    expect(response?.status()).toBe(200);

    // Verify listing page rendered
    await expect(page.locator('[data-testid="project-listing"]')).toBeVisible();

    // Verify nav is visible
    await expect(page.locator('[data-testid="nav"]')).toBeVisible();
  });

  test('route /fr/blog renders French listing', async ({ page }) => {
    const response = await page.goto('/fr/blog');
    expect(response?.status()).toBe(200);

    // Verify blog listing rendered
    await expect(page.locator('[data-testid="blog-listing"]')).toBeVisible();

    // Verify nav is visible
    await expect(page.locator('[data-testid="nav"]')).toBeVisible();

    // The desktop filter sidebar carries the localized search placeholder.
    const search = page.locator('[data-testid="blog-search-sidebar"]');
    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute('placeholder', siteLabels.blogChrome.listing.searchPlaceholder.fr!);
  });

  test('route /fr/blog language filter contains only the active locale', async ({ page }) => {
    await page.goto('/fr/blog');

    // (networkidle removed: the very next assertion is a web-first toBeVisible()
    // that auto-waits for the filter sidebar — the wait was redundant.)
    // The sidebar lives in the listing grid's filter column (.listing-filter-column),
    // which ListingFrame always shows at desktop width.
    const langFilter = page
      .locator('.listing-grid [data-testid="blog-filter-sidebar"]')
      .first();
    await expect(langFilter).toBeVisible();

    // The Language FilterGroup renders whenever ≥1 language exists; it surfaces
    // the localized section label "Langue" plus per-language buttons.
    await expect(langFilter).toContainText(siteLabels.blogChrome.listing.filters.language.fr!);

    // The server narrows the listing before deriving facets. The only language
    // option on the French route is therefore French; persisted EN/ES filters
    // cannot hide the active-locale posts after a locale switch.
    const buttons = langFilter.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
    await expect(langFilter.locator('button', { hasText: siteLabels.ui.languageNames.fr.fr! })).toBeVisible();
    await expect(langFilter.locator('button', { hasText: siteLabels.ui.languageNames.en.fr! })).toHaveCount(0);
    await expect(langFilter.locator('button', { hasText: siteLabels.ui.languageNames.es.fr! })).toHaveCount(0);
  });

  test('English route /contact is distinct from /fr/contact', async ({ page }) => {
    // Load EN version. (No networkidle wait: the info terminal carries a live
    // weather/clock fetch that keeps the network busy past load.)
    const enResponse = await page.goto('/contact');
    expect(enResponse?.status()).toBe(200);

    const enInfoTerminal = page.locator('[data-testid="contact-info-terminal"]').first();
    await expect(enInfoTerminal).toContainText(contactContent.infoTerminal.sectionLabels.location.en);
    const enForm = page.locator('form').filter({ visible: true }).first();
    const enLabels = await enForm.locator('label').allTextContents();
    const enInfo = await enInfoTerminal.textContent();

    // Load FR version
    const frResponse = await page.goto('/fr/contact');
    expect(frResponse?.status()).toBe(200);

    const frInfoTerminal = page.locator('[data-testid="contact-info-terminal"]').first();
    await expect(frInfoTerminal).toContainText(contactContent.infoTerminal.sectionLabels.location.fr!);
    const frForm = page.locator('form').filter({ visible: true }).first();
    const frLabels = await frForm.locator('label').allTextContents();
    const frInfo = await frInfoTerminal.textContent();

    // Both routes render the three terminal field labels.
    expect(enLabels.length).toBeGreaterThanOrEqual(3);
    expect(frLabels.length).toBeGreaterThanOrEqual(3);

    // The two routes are genuinely distinct: the info terminal localizes its
    // section headers (LOCATION on EN, EMPLACEMENT on FR — contact-page.ts).
    expect(enInfo).toContain(contactContent.infoTerminal.sectionLabels.location.en);
    expect(frInfo).toContain(contactContent.infoTerminal.sectionLabels.location.fr!);
    expect(frInfo).not.toContain(contactContent.infoTerminal.sectionLabels.location.en);
  });

  test('route /fr/services renders and navigates correctly', async ({ page }) => {
    const response = await page.goto('/fr/services');
    expect(response?.status()).toBe(200);

    // Verify nav is visible
    await expect(page.locator('[data-testid="nav"]')).toBeVisible();

    // Verify page content loads
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});
