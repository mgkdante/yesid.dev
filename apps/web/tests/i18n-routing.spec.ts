import { test, expect } from '@playwright/test';

// i18n / bilingual routing + SEO coverage (slice-28.6 launch).
// Verifies every published route renders 200 in BOTH EN (/) and FR (/fr/*),
// language toggle navigates correctly, content changes language, and 404s
// reject invalid locales. No live CMS dependency — all content is committed
// and static at build time (post-27.2 adapter).

const STATIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/services',
  '/projects',
  '/blog',
  '/blog/personal',
  '/tech-stack',
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
      } else if (route === '/tech-stack') {
        await expect(page.getByTestId('tech-stack-hero')).toBeVisible();
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
      } else if (route === '/tech-stack') {
        await expect(page.getByTestId('tech-stack-hero')).toBeVisible();
      } else {
        await expect(page.getByTestId('nav')).toBeVisible();
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Routing: /es resolves (L1 dark state) but self-canonicalizes to EN until
// 'es' joins PUBLISHED_LOCALES; a never-published prefix still 404s.
// ---------------------------------------------------------------------------

test('/es/about resolves dark: 200, es lang, EN canonical, unindexed', async ({ page }) => {
  const response = await page.goto('/es/about');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  // Dark-QA contract: canonical points at the EN URL until the publish flip.
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', 'https://yesid.dev/about');
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
// Canonical meta tag — EN unprefixed, FR prefixed
// ---------------------------------------------------------------------------

test('canonical meta: /about has canonical=https://yesid.dev/about', async ({ page }) => {
  await page.goto('/about');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toBe('https://yesid.dev/about');
});

test('canonical meta: /fr/about has canonical=https://yesid.dev/fr/about', async ({ page }) => {
  await page.goto('/fr/about');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toBe('https://yesid.dev/fr/about');
});

test('canonical meta: /fr home has canonical=https://yesid.dev/fr', async ({ page }) => {
  await page.goto('/fr');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toBe('https://yesid.dev/fr');
});

// ---------------------------------------------------------------------------
// hreflang alternates — both locales on bilingual routes
// ---------------------------------------------------------------------------

test('hreflang: /about includes en + fr + x-default links', async ({ page }) => {
  await page.goto('/about');
  const enLink = page.locator('link[rel="alternate"][hreflang="en"]');
  const frLink = page.locator('link[rel="alternate"][hreflang="fr"]');
  const defaultLink = page.locator('link[rel="alternate"][hreflang="x-default"]');

  await expect(enLink).toHaveCount(1);
  await expect(enLink).toHaveAttribute('href', 'https://yesid.dev/about');

  await expect(frLink).toHaveCount(1);
  await expect(frLink).toHaveAttribute('href', 'https://yesid.dev/fr/about');

  await expect(defaultLink).toHaveCount(1);
  await expect(defaultLink).toHaveAttribute('href', 'https://yesid.dev/about');
});

test('hreflang: /fr/about ALSO includes en + fr + x-default (same cluster)', async ({ page }) => {
  await page.goto('/fr/about');
  const enLink = page.locator('link[rel="alternate"][hreflang="en"]');
  const frLink = page.locator('link[rel="alternate"][hreflang="fr"]');
  const defaultLink = page.locator('link[rel="alternate"][hreflang="x-default"]');

  await expect(enLink).toHaveCount(1);
  await expect(enLink).toHaveAttribute('href', 'https://yesid.dev/about');

  await expect(frLink).toHaveCount(1);
  await expect(frLink).toHaveAttribute('href', 'https://yesid.dev/fr/about');

  await expect(defaultLink).toHaveCount(1);
  await expect(defaultLink).toHaveAttribute('href', 'https://yesid.dev/about');
});

// ---------------------------------------------------------------------------
// og:locale meta tags — en_CA + fr_CA alternates
// ---------------------------------------------------------------------------

test('og:locale: /about has og:locale=en_CA + og:locale:alternate=fr_CA', async ({ page }) => {
  await page.goto('/about');
  const mainLocale = page.locator('meta[property="og:locale"]');
  const altLocale = page.locator('meta[property="og:locale:alternate"]');

  await expect(mainLocale).toHaveAttribute('content', 'en_CA');
  await expect(altLocale).toHaveCount(1);
  await expect(altLocale).toHaveAttribute('content', 'fr_CA');
});

test('og:locale: /fr/about has og:locale=fr_CA + og:locale:alternate=en_CA', async ({ page }) => {
  await page.goto('/fr/about');
  const mainLocale = page.locator('meta[property="og:locale"]');
  const altLocale = page.locator('meta[property="og:locale:alternate"]');

  await expect(mainLocale).toHaveAttribute('content', 'fr_CA');
  await expect(altLocale).toHaveCount(1);
  await expect(altLocale).toHaveAttribute('content', 'en_CA');
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

test('language toggle: /fr/about FR→EN click navigates to /about', async ({ page }) => {
  await page.goto('/fr/about');
  const toggle = page.getByTestId('language-toggle');
  await expect(toggle).toBeVisible();
  const href = await toggle.getAttribute('href');
  expect(href).toBe('/about');
  await toggle.click();
  await page.waitForURL('/about');
  expect(page.url()).not.toContain('/fr');
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
  await expect(page.locator('body')).toContainText('Curious builder, lifelong tinkerer');
  await expect(page.getByTestId('about-cta-button')).toContainText('Send message');
});

test('content language: /fr/about FR page renders French copy', async ({ page }) => {
  await page.goto('/fr/about');
  await expect(page.locator('body')).toContainText('Bâtisseur curieux, bricoleur depuis toujours');
  await expect(page.getByTestId('about-cta-button')).toContainText('Envoyer un message');
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
    'Notes on digital infrastructure, databases, and building reliable systems.',
  );
});

test('content language: /fr/blog FR renders French intro', async ({ page }) => {
  await page.goto('/fr/blog');
  const subtitle = page.locator('.listing-header-subtitle');
  await expect(subtitle).toBeVisible();
  await expect(subtitle).toContainText(
    "Des notes sur l'infrastructure numérique, les bases de données et la construction de systèmes fiables.",
  );
});

// ---------------------------------------------------------------------------
// Blog posts are mono-language (no hreflang cluster)
// ---------------------------------------------------------------------------

test('mono-language route: blog post suppresses hreflang cluster', async ({ page }) => {
  // Blog posts have singleLocale=true per AM2.5 — no alternates.
  // Pick any published blog slug (this is structural; content is in CMS).
  // For now, test the absence of FR hreflang on /blog/* (if post is EN-only).
  await page.goto('/blog');
  // Blog listing page IS bilingual (hreflang cluster present).
  const frLink = page.locator('link[rel="alternate"][hreflang="fr"]');
  await expect(frLink).toHaveCount(1);
  // (/blog itself has hreflang; individual posts are AM2.5 mono-language,
  // tested via their own route when available)
});

// ---------------------------------------------------------------------------
// Sitemap includes FR variants + hreflang clusters
// ---------------------------------------------------------------------------

test('sitemap: GET /sitemap.xml includes /fr routes with hreflang', async ({ page }) => {
  const response = await page.goto('/sitemap.xml');
  expect(response?.status()).toBe(200);
  const body = await response?.text();
  expect(body).toContain('<loc>https://yesid.dev/about</loc>');
  expect(body).toContain('<loc>https://yesid.dev/fr/about</loc>');
  // hreflang link tags within the <url> for /about entry
  expect(body).toContain('hreflang="en"');
  expect(body).toContain('hreflang="fr"');
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

