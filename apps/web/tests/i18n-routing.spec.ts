import { blogPageContent } from '../src/lib/content/blog-page';
import { aboutPageContent } from '../src/lib/content/about-page';
import { test, expect } from '@playwright/test';

// i18n / trilingual routing + SEO coverage (slice-28.6 launch).
// Verifies published routes across EN (/), FR (/fr/*), and ES (/es/*),
// language toggle navigates correctly, content changes language, and 404s
// reject invalid locales. No live CMS dependency — content is generated from the shared fixture
// and static at build time (post-27.2 adapter).

const STATIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/services',
  '/projects',
  '/blog',
  '/blog/personal',
];

const LOCALE_PAIRS = ['en', 'fr'];

// ---------------------------------------------------------------------------
// Routing: all published routes 200 in EN + FR
// ---------------------------------------------------------------------------

test.describe('i18n routing — static routes render 200 in EN + FR', () => {
  for (const route of STATIC_ROUTES) {
    test(`EN: GET ${route} returns 200`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      // Structural anchor: the page shell mounted (nav visible by default).
      if (route === '/') {
        await expect(page.getByTestId('hero-banner')).toBeVisible();
      } else {
        await expect(page.getByTestId('nav')).toBeVisible();
      }
    });

    test(`FR: GET /fr${route === '/' ? '' : route} returns 200`, async ({ page }) => {
      const frPath = route === '/' ? '/fr' : `/fr${route}`;
      const response = await page.goto(frPath);
      expect(response?.status()).toBe(200);
      // Same structural anchors, just under /fr prefix.
      if (route === '/') {
        await expect(page.getByTestId('hero-banner')).toBeVisible();
      } else {
        await expect(page.getByTestId('nav')).toBeVisible();
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Routing: /es is PUBLISHED (launch flip) — es canonical, full SEO cluster;
// a never-published prefix still 404s.
// ---------------------------------------------------------------------------

test('/es/about is published: 200, es lang, /es canonical', async ({ page }) => {
  const response = await page.goto('/es/about');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  // Publish-flip contract: es is in PUBLISHED_LOCALES, so /es self-canonicalizes.
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', 'https://yesid.dev/es/about');
});

test('never-published locale prefix /de/* returns 404', async ({ page }) => {
  const response = await page.goto('/de/about');
  expect(response?.status()).toBe(404);
  // Error page testids are always present.
  await expect(page.getByTestId('error-label')).toBeVisible();
});

test('unknown route under published prefix /fr/nonexistent returns 404', async ({ page }) => {
  const response = await page.goto('/fr/nonexistent-route-at-all');
  expect(response?.status()).toBe(404);
  await expect(page.getByTestId('error-label')).toBeVisible();
});

// ---------------------------------------------------------------------------
// HTML lang attribute — set per request from URL path
// ---------------------------------------------------------------------------

test('html lang attribute is en for unprefixed routes', async ({ page }) => {
  await page.goto('/about');
  const lang = await page.locator('html').evaluate((el) => el.getAttribute('lang'));
  expect(lang).toBe('en');
});

test('html lang attribute is fr for /fr-prefixed routes', async ({ page }) => {
  await page.goto('/fr/about');
  const lang = await page.locator('html').evaluate((el) => el.getAttribute('lang'));
  expect(lang).toBe('fr');
});

// ---------------------------------------------------------------------------
// Language toggle — click navigates EN↔FR, preserves path
// ---------------------------------------------------------------------------

test('language toggle: /about EN→FR click navigates to /fr/about', async ({ page }) => {
  await page.goto('/about');
  // LanguageToggle only renders if 2+ locales are published. It's on Nav.
  const toggle = page.getByTestId('language-toggle');
  await expect(toggle).toBeVisible();
  const href = await toggle.getAttribute('href');
  expect(href).toBe('/fr/about');
  // Click it and verify we land on /fr/about
  await toggle.click();
  await page.waitForURL('/fr/about');
  expect(page.url()).toContain('/fr/about');
});

test('language toggle: /fr/about reaches /about by clicking TWICE (via /es/about)', async ({ page }) => {
  // Three published locales: the cycle is en → fr → es → en, so FR reaches
  // EN through ES (approved click-twice approach).
  await page.goto('/fr/about');
  const toggle = page.getByTestId('language-toggle');
  await expect(toggle).toBeVisible();
  const href = await toggle.getAttribute('href');
  expect(href).toBe('/es/about');
  await toggle.click();
  await page.waitForURL('/es/about');
  await toggle.click();
  await page.waitForURL('/about');
  expect(page.url()).not.toContain('/fr');
  expect(page.url()).not.toContain('/es');
});

test('language toggle: navigating preserves path (/services → /fr/services)', async ({ page }) => {
  await page.goto('/services');
  const toggle = page.getByTestId('language-toggle');
  const href = await toggle.getAttribute('href');
  expect(href).toBe('/fr/services');
});

// ---------------------------------------------------------------------------
// Content changes language (DOM text is locale-aware, not cached)
// ---------------------------------------------------------------------------

test('content language: /about EN page renders English copy', async ({ page }) => {
  await page.goto('/about');
  // Identity title is a prominent, locale-specific about-page marker.
  await expect(page.getByTestId('about-identity').getByRole('heading', { level: 1 })).toHaveText(aboutPageContent.identity.title.en);
  await expect(page.getByTestId('about-cta-button')).toContainText(aboutPageContent.cta.buttonLabel.en);
});

test('content language: /fr/about FR page renders French copy', async ({ page }) => {
  await page.goto('/fr/about');
  await expect(page.getByTestId('about-identity').getByRole('heading', { level: 1 })).toHaveText(aboutPageContent.identity.title.fr!);
  await expect(page.getByTestId('about-cta-button')).toContainText(aboutPageContent.cta.buttonLabel.fr!);
});

test('content language: /blog EN renders English intro', async ({ page }) => {
  await page.goto('/blog');
  // Listing header subtitle (blogPage.intro.en) is the locale-specific marker.
  // The .listing-mobile-heading h1 is display:none at >=1024px, so on the
  // desktop viewport the subtitle is the always-visible locale anchor. The
  // intro copy is unambiguously English (unlike the heading "Blog", a substring
  // of FR "Blogue").
  const subtitle = page.locator('.listing-header-subtitle');
  await expect(subtitle).toBeVisible();
  await expect(subtitle).toContainText(
    blogPageContent.intro.en,
  );
});

test('content language: /fr/blog FR renders French intro', async ({ page }) => {
  await page.goto('/fr/blog');
  const subtitle = page.locator('.listing-header-subtitle');
  await expect(subtitle).toBeVisible();
  await expect(subtitle).toContainText(
    blogPageContent.intro.fr!,
  );
});

// ---------------------------------------------------------------------------
// Sitemap includes FR variants + hreflang clusters
// ---------------------------------------------------------------------------

test('sitemap: GET /sitemap.xml includes /fr + /es routes with hreflang', async ({ page }) => {
  const response = await page.goto('/sitemap.xml');
  expect(response?.status()).toBe(200);
  const body = await response?.text();
  expect(body).toContain('<loc>https://yesid.dev/about</loc>');
  expect(body).toContain('<loc>https://yesid.dev/fr/about</loc>');
  expect(body).toContain('<loc>https://yesid.dev/es/about</loc>');
  // hreflang link tags within the <url> for /about entry
  expect(body).toContain('hreflang="en"');
  expect(body).toContain('hreflang="fr"');
  expect(body).toContain('hreflang="es"');
  expect(body).toContain('hreflang="x-default"');
  // /fr variant also carries full cluster
  expect(body).toMatch(/hreflang="en"[\s\S]*hreflang="fr"/);
});

// ---------------------------------------------------------------------------
// Error page (404) respects language context
// ---------------------------------------------------------------------------

test('404 page respects EN context (unprefixed /nonexistent)', async ({ page }) => {
  const response = await page.goto('/nonexistent-route-xyz');
  expect(response?.status()).toBe(404);
  // html lang should be 'en' (unprefixed path)
  const lang = await page.locator('html').evaluate((el) => el.getAttribute('lang'));
  expect(lang).toBe('en');
  // Error page canonical should be EN
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toContain('https://yesid.dev');
  expect(canonical).not.toContain('/fr');
});

test('404 page respects FR context (/fr/nonexistent)', async ({ page }) => {
  const response = await page.goto('/fr/nonexistent-route-xyz');
  expect(response?.status()).toBe(404);
  const lang = await page.locator('html').evaluate((el) => el.getAttribute('lang'));
  expect(lang).toBe('fr');
  // 404 pages emit a base canonical (they are noindex; the lang context above is
  // the meaningful FR signal). Just assert a well-formed canonical is present.
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toContain('https://yesid.dev');
});
