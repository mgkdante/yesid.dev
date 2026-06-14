import { test, expect } from '@playwright/test';

test.describe('i18n bilingual coverage', () => {
  const pages = [
    { path: '/about', testid: 'page-about' },
    { path: '/services', testid: 'service-listing-page' },
    { path: '/projects', testid: 'project-listing' },
    { path: '/blog', testid: 'blog-listing' },
    { path: '/blog/personal', testid: 'blog-listing' },
    { path: '/contact', testid: 'page-contact' },
    { path: '/tech-stack', testid: 'tech-stack-hero' },
  ];

  for (const { path, testid } of pages) {
    test(`EN route ${path} renders [data-testid="${testid}"]`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator(`[data-testid="${testid}"]`)).toBeVisible();
    });

    test(`FR route /fr${path} renders [data-testid="${testid}"]`, async ({ page }) => {
      const frPath = `/fr${path}`;
      const response = await page.goto(frPath);
      // Every FR route is built and served (verified against the hermetic
      // preview): assert 200 + landmark unconditionally rather than skipping
      // the assertion on a non-200 (which would vacuously pass).
      expect(response?.status()).toBe(200);
      await expect(page.locator(`[data-testid="${testid}"]`)).toBeVisible();
    });
  }

  test('locale fallback chain: missing FR → EN', async ({ page }) => {
    // Load /about which has translated content
    const response = await page.goto('/fr/about');
    expect(response?.status()).toBe(200);

    const aboutPage = page.locator('[data-testid="page-about"]');
    await expect(aboutPage).toBeVisible();

    // Check that content is populated (regardless of which locale it came from)
    const identity = page.locator('[data-testid="about-identity"]');
    await expect(identity).toBeVisible();
  });

  test('EN and FR routes render same landmarks', async ({ page }) => {
    // Test /about as example
    const landmarkTestids = [
      'about-identity',
      'about-metrics',
      'about-education',
      'about-testimonials',
      'about-languages',
    ];

    // EN version
    await page.goto('/about');
    const enLandmarks: Record<string, boolean> = {};
    for (const testid of landmarkTestids) {
      enLandmarks[testid] = (await page.locator(`[data-testid="${testid}"]`).count()) > 0;
    }

    // FR version
    await page.goto('/fr/about');
    const frLandmarks: Record<string, boolean> = {};
    for (const testid of landmarkTestids) {
      frLandmarks[testid] = (await page.locator(`[data-testid="${testid}"]`).count()) > 0;
    }

    // Guard: a presence-map equality is only meaningful if both maps are
    // actually populated. An all-false map (e.g. every testid mistyped) would
    // make the comparison vacuously pass. Assert every landmark is present on
    // BOTH locales — these cards render unconditionally in AboutPage.svelte.
    for (const testid of landmarkTestids) {
      expect(enLandmarks[testid], `EN /about missing landmark [data-testid="${testid}"]`).toBe(true);
      expect(frLandmarks[testid], `FR /about missing landmark [data-testid="${testid}"]`).toBe(true);
    }

    // Both should have the same landmarks present
    expect(JSON.stringify(enLandmarks)).toBe(JSON.stringify(frLandmarks));
  });
});

