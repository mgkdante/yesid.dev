import { test, expect } from '@playwright/test';

// OPS1 legal framework (launch Phase 1): 5 CMS-backed pages under /legal/,
// EN + FR, linked from the footer, rendered through BlockRenderer.

const LEGAL_SLUGS = ['privacy', 'terms', 'cookies', 'accessibility', 'notice'];

test.describe('/legal pages content', () => {
  test('all five legal pages return 200 with a non-empty body', async ({ page }) => {
    for (const slug of LEGAL_SLUGS) {
      const response = await page.goto(`/legal/${slug}`);
      expect(response?.status(), `/legal/${slug} status`).toBe(200);
      await expect(page.locator('[data-testid="page-legal"]')).toBeVisible();
      const paragraphs = page.locator('[data-testid="legal-body"] p');
      expect(await paragraphs.count(), `/legal/${slug} paragraphs`).toBeGreaterThan(2);
    }
  });

  test('privacy renders EN title and the privacy-officer commitment', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page.locator('h1')).toHaveText('Privacy Policy');
    await expect(page.locator('[data-testid="legal-body"]')).toContainText('Privacy Officer');
    await expect(page.locator('[data-testid="legal-body"]')).toContainText('admin@yesid.dev');
  });

  test('privacy renders FR title and French body under /fr', async ({ page }) => {
    await page.goto('/fr/legal/privacy');
    await expect(page.locator('h1')).toHaveText('Politique de confidentialité');
    await expect(page.locator('[data-testid="legal-body"]')).toContainText(
      'renseignements personnels',
    );
  });

  test('footer links to the legal pages', async ({ page }) => {
    await page.goto('/');
    const privacyLink = page.locator('footer a[href="/legal/privacy"]');
    await expect(privacyLink).toBeVisible();
    await privacyLink.click();
    await page.waitForURL('/legal/privacy');
    await expect(page.locator('[data-testid="page-legal"]')).toBeVisible();
  });

  test('unknown legal slug 404s', async ({ page }) => {
    const response = await page.goto('/legal/nope');
    expect(response?.status()).toBe(404);
  });
});
