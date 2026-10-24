import { test, expect } from '@playwright/test';
import { legalPages } from '../../src/lib/content/legal-pages';

for (const locale of ['en', 'fr', 'es'] as const) {
  const prefix = locale === 'en' ? '' : '/' + locale;
  for (const content of legalPages) {
    test(locale + ' /legal/' + content.slug + ' renders its title and complete paragraph structure', async ({ page }) => {
      const response = await page.goto(prefix + '/legal/' + content.slug);
      expect(response?.status()).toBe(200);
      await expect(page.getByTestId('page-legal')).toBeVisible();
      await expect(page.locator('h1')).toHaveText(content.title[locale] ?? content.title.en);
      const htmlParagraphs = (content.body[locale] ?? content.body.en)!.blocks
        .filter(block => block.type === 'paragraph')
        .map(block => String(block.data.text));
      const expected = await page.evaluate((paragraphs) => paragraphs.map((html) => {
        const template = document.createElement('template');
        template.innerHTML = html;
        return template.content.textContent ?? '';
      }), htmlParagraphs);
      const paragraphs = page.getByTestId('legal-body').locator('p');
      await expect(paragraphs).toHaveText(expected);
      await expect(page.getByTestId('legal-body')).toContainText('contact@yesid.dev');
      await expect(page.getByTestId('legal-body')).not.toContainText('admin@yesid.dev');
    });
  }

  test(locale + ' notice keeps private location details out of the rendered body', async ({ page }) => {
    await page.goto(prefix + '/legal/notice');
    const text = await page.getByTestId('legal-body').innerText();
    expect(text).not.toMatch(/\bGatineau\b/i);
    expect(text).not.toMatch(/\b[A-Z]\d[A-Z][ -]?\d[A-Z]\d\b/i);
  });
}

test('footer links to the legal pages', async ({ page }) => {
  await page.goto('/');
  const privacyLink = page.locator('footer a[href="/legal/privacy"]');
  await expect(privacyLink).toBeVisible();
  await privacyLink.click();
  await page.waitForURL('/legal/privacy');
  await expect(page.getByTestId('page-legal')).toBeVisible();
});

test('unknown legal slug 404s', async ({ page }) => {
  const response = await page.goto('/legal/nope');
  expect(response?.status()).toBe(404);
});
