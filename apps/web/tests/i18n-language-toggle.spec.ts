import { test, expect } from '@playwright/test';

// i18n language toggle E2E — verifies click navigation, content language
// changes, and state across route changes. Complement to unit tests which
// mock the component props.

test.describe('Language toggle — click navigation + content change', () => {
  test('language toggle visible on all pages (2+ locales published)', async ({ page }) => {
    // LanguageToggle renders when len(PUBLISHED_LOCALES) >= 2.
    // Test on each route.
    const routes = ['/', '/about', '/services', '/projects', '/blog', '/contact'];
    for (const route of routes) {
      await page.goto(route);
      const toggle = page.getByTestId('language-toggle');
      await expect(toggle).toBeVisible();
    }
  });

  test('clicking language toggle on EN page navigates to FR + content updates', async ({ page }) => {
    // Start on EN /about
    await page.goto('/about');
    const toggle = page.getByTestId('language-toggle');
    await expect(toggle).toBeVisible();

    // /about has no contact form — assert a stable EN copy marker instead.
    // about-page.ts CTA buttonLabel: { en: 'Send message →', fr: 'Envoyer un message →' }.
    await expect(page.locator('body')).toContainText('Send message');

    // Click toggle → should navigate to /fr/about
    await toggle.click();
    await page.waitForURL('/fr/about');
    expect(page.url()).toContain('/fr/about');

    // Verify FR page renders the French copy marker.
    await expect(page.locator('body')).toContainText('Envoyer un message');
    // And the EN marker is gone (genuine language change).
    await expect(page.locator('body')).not.toContainText('Send message');
  });

  test('clicking language toggle on FR page navigates to EN + content updates', async ({ page }) => {
    // Start on FR /about
    await page.goto('/fr/about');
    const toggle = page.getByTestId('language-toggle');
    await expect(toggle).toBeVisible();

    // Assert the stable FR copy marker (CTA buttonLabel).
    await expect(page.locator('body')).toContainText('Envoyer un message');

    // Click toggle → should navigate to /about (no prefix)
    await toggle.click();
    await page.waitForURL('/about');
    expect(page.url()).not.toContain('/fr');

    // Verify EN page copy is back and the FR marker is gone.
    await expect(page.locator('body')).toContainText('Send message');
    await expect(page.locator('body')).not.toContainText('Envoyer un message');
  });

  test('language toggle preserves path across all routes', async ({ page }) => {
    const testPaths = [
      { en: '/services', fr: '/fr/services' },
      { en: '/projects', fr: '/fr/projects' },
      { en: '/blog', fr: '/fr/blog' },
      { en: '/tech-stack', fr: '/fr/tech-stack' },
    ];

    for (const { en, fr } of testPaths) {
      // EN → FR
      await page.goto(en);
      const toggle = page.getByTestId('language-toggle');
      const href = await toggle.getAttribute('href');
      expect(href).toBe(fr);

      // FR → EN
      await page.goto(fr);
      const toggleBack = page.getByTestId('language-toggle');
      const hrefBack = await toggleBack.getAttribute('href');
      expect(hrefBack).toBe(en);
    }
  });

  test('language toggle href attribute updates on each route', async ({ page }) => {
    // Visit EN /projects, toggle should link to /fr/projects
    await page.goto('/projects');
    let toggle = page.getByTestId('language-toggle');
    let href = await toggle.getAttribute('href');
    expect(href).toBe('/fr/projects');

    // Navigate to EN /blog, toggle should link to /fr/blog (updated)
    await page.goto('/blog');
    toggle = page.getByTestId('language-toggle');
    href = await toggle.getAttribute('href');
    expect(href).toBe('/fr/blog');
  });

  test('blog page: EN /blog shows "Dispatches", FR /fr/blog shows "Dépêches"', async ({ page }) => {
    // The blog heading ("Dispatches"/"Dépêches", blog-page.ts heading) renders in
    // a mobile-only <h1> (display:none on desktop), so assert it's in the body
    // text rather than visible. The language flip is the real assertion.
    // EN
    await page.goto('/blog');
    await expect(page.locator('body')).toContainText('Dispatches');

    // FR
    await page.goto('/fr/blog');
    await expect(page.locator('body')).toContainText('Dépêches');
  });

  test('language toggle animation/motion respects prefers-reduced-motion', async ({ page }) => {
    // Set reduced-motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/about');

    const toggle = page.getByTestId('language-toggle');
    // Verify animation is off (no animation property on .boards or .board)
    const boards = page.locator('.boards');
    const computedStyle = await boards.evaluate((el) => getComputedStyle(el).animation);
    // Under prefers-reduced-motion, animation should be 'none'
    expect(computedStyle).toContain('none');
  });

  test('nav aria-label updates to current language', async ({ page }) => {
    // EN: aria-label should contain 'English'
    await page.goto('/about');
    let toggle = page.getByTestId('language-toggle');
    let ariaLabel = await toggle.getAttribute('aria-label');
    expect(ariaLabel?.toLowerCase()).toContain('english');

    // FR: aria-label should contain 'Français'
    await page.goto('/fr/about');
    toggle = page.getByTestId('language-toggle');
    ariaLabel = await toggle.getAttribute('aria-label');
    expect(ariaLabel?.toLowerCase()).toContain('français');
  });
});

