import { test, expect } from '@playwright/test';

test.skip(({ viewport }) => viewport!.width < 1024, 'Desktop composition or viewport-independent.');

for (const locale of ['en', 'fr', 'es'] as const) {
  const prefix = locale === 'en' ? '' : '/' + locale;
  test(locale + ' legal page renders its body', async ({ page }) => {
    const response = await page.goto(prefix + '/legal/privacy');
    expect(response?.status()).toBe(200);
    await expect(page.getByTestId('page-legal')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId('legal-body')).toBeVisible();
  });

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
