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

  test('clicking language toggle on FR page cycles FR → ES → EN (click-twice)', async ({ page }) => {
    // Three published locales: the toggle cycles en → fr → es → en, so FR
    // reaches EN by clicking TWICE, passing through ES (approved approach).
    await page.goto('/fr/about');
    const toggle = page.getByTestId('language-toggle');
    await expect(toggle).toBeVisible();

    // Assert the stable FR copy marker (CTA buttonLabel).
    await expect(page.locator('body')).toContainText('Envoyer un message');

    // Click 1: FR → ES
    await toggle.click();
    await page.waitForURL('/es/about');
    await expect(page.locator('body')).toContainText('Enviar mensaje');
    await expect(page.locator('body')).not.toContainText('Envoyer un message');

    // Click 2: ES → EN (no prefix)
    await toggle.click();
    await page.waitForURL('/about');
    expect(page.url()).not.toContain('/fr');
    expect(page.url()).not.toContain('/es');

    // Verify EN page copy is back and the ES marker is gone.
    await expect(page.locator('body')).toContainText('Send message');
    await expect(page.locator('body')).not.toContainText('Enviar mensaje');
  });

  test('language toggle preserves path across all routes (en → fr → es → en cycle)', async ({ page }) => {
    const testPaths = [
      { en: '/services', fr: '/fr/services', es: '/es/services' },
      { en: '/projects', fr: '/fr/projects', es: '/es/projects' },
      { en: '/blog', fr: '/fr/blog', es: '/es/blog' },
      { en: '/tech-stack', fr: '/fr/tech-stack', es: '/es/tech-stack' },
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

  test('blog page: EN /blog shows "Blog", FR /fr/blog shows "Blogue"', async ({ page }) => {
    // The blog listing heading (siteLabels.blogChrome.listing.mobileHeading,
    // { en: 'Blog', fr: 'Blogue' }) renders in <h1.listing-mobile-heading> with a
    // trailing accent "." span -> textContent is "Blog."/"Blogue.". It is
    // display:none on desktop (>=1024px), so assert its text via toHaveText
    // (visibility-agnostic) rather than visibility. The locale flip is the real
    // assertion. NOTE: a body.toContainText() check no longer distinguishes
    // locales here — the SvelteKit hydration payload serializes the full
    // bilingual blogPage object into the DOM, so every locale string is present
    // in body text on both routes. The visible <div.listing-header-subtitle>
    // (EN/FR intro) is the desktop-visible corroborating marker.
    const heading = page.getByTestId('blog-listing').locator('.listing-mobile-heading');
    const subtitle = page.getByTestId('blog-listing').locator('.listing-header-subtitle');

    // EN
    await page.goto('/blog');
    await expect(heading).toHaveText('Blog.');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toHaveText(
      'Notes on digital infrastructure, databases, and building reliable systems.'
    );

    // FR
    await page.goto('/fr/blog');
    await expect(heading).toHaveText('Blogue.');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toHaveText(
      "Des notes sur l'infrastructure numérique, les bases de données et la construction de systèmes fiables."
    );
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

    // ES: aria-label should contain 'Español'
    await page.goto('/es/about');
    toggle = page.getByTestId('language-toggle');
    ariaLabel = await toggle.getAttribute('aria-label');
    expect(ariaLabel?.toLowerCase()).toContain('español');
  });
});

