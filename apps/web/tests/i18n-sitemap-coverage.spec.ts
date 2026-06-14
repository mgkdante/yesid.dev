import { test, expect } from '@playwright/test';

// i18n sitemap.xml coverage — verifies all published routes appear in
// the sitemap with correct FR variants + hreflang clusters.
//
// Unit tests (sitemap.xml/server.test.ts) verify the _buildSitemapEntries
// logic. This e2e test verifies the actual /sitemap.xml response from a
// running server, ensuring the XML is well-formed and complete.

test.describe('Sitemap.xml i18n coverage', () => {
  test('GET /sitemap.xml returns 200 with application/xml content-type', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('application/xml');
  });

  test('sitemap includes all static EN routes (unprefixed)', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    const xml = await response?.text();
    expect(xml).toContain('<loc>https://yesid.dev</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/about</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/contact</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/services</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/projects</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/blog</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/blog/personal</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/tech-stack</loc>');
  });

  test('sitemap includes all static FR routes (/fr-prefixed)', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    const xml = await response?.text();
    expect(xml).toContain('<loc>https://yesid.dev/fr</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/fr/about</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/fr/contact</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/fr/services</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/fr/projects</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/fr/blog</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/fr/blog/personal</loc>');
    expect(xml).toContain('<loc>https://yesid.dev/fr/tech-stack</loc>');
  });

  test('sitemap: each route entry has hreflang cluster (en + fr + x-default)', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    const xml = await response?.text();
    // Every bilingual route should have the full cluster in its <url> entry.
    // Check for the pattern: <url>...<xhtml:link rel="alternate" hreflang="en"
    // This is a regex that matches a <url> block with hreflang links.
    const urlPattern = /<url>\s*<loc>https:\/\/yesid\.dev\/about<\/loc>.*?<xhtml:link[^>]*hreflang="en"[^>]*>.*?<xhtml:link[^>]*hreflang="fr"[^>]*>.*?<xhtml:link[^>]*hreflang="x-default"[^>]*>/s;
    expect(xml).toMatch(urlPattern);
  });

  test('sitemap: /fr variant entries ALSO carry hreflang cluster', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    const xml = await response?.text();
    // The /fr/about entry should also have the en/fr/x-default cluster.
    const frUrlPattern = /<url>\s*<loc>https:\/\/yesid\.dev\/fr\/about<\/loc>.*?<xhtml:link[^>]*hreflang="en"[^>]*>.*?<xhtml:link[^>]*hreflang="fr"[^>]*>.*?<xhtml:link[^>]*hreflang="x-default"[^>]*>/s;
    expect(xml).toMatch(frUrlPattern);
  });

  test('sitemap: hreflang links point to correct canonicals', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    const xml = await response?.text();
    // Within /about entry, hreflang="en" should link to unprefixed
    expect(xml).toContain('hreflang="en" href="https://yesid.dev/about"');
    // hreflang="fr" should link to /fr-prefixed
    expect(xml).toContain('hreflang="fr" href="https://yesid.dev/fr/about"');
    // x-default points to EN
    expect(xml).toContain('hreflang="x-default" href="https://yesid.dev/about"');
  });

  test('sitemap: home route (/) and /fr both present with hreflang', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    const xml = await response?.text();
    // Root entry has hreflang cluster pointing to / and /fr.
    // canonicalFor('/', 'en') emits the host with NO trailing slash
    // (seo-defaults.ts: base === '/' ? '') so <loc> is https://yesid.dev exactly.
    const homePattern = /<url>\s*<loc>https:\/\/yesid\.dev<\/loc>.*?hreflang="en".*?hreflang="fr".*?hreflang="x-default"/s;
    expect(xml).toMatch(homePattern);
    // /fr entry also has full cluster
    const frPattern = /<url>\s*<loc>https:\/\/yesid\.dev\/fr<\/loc>.*?hreflang="en".*?hreflang="fr".*?hreflang="x-default"/s;
    expect(xml).toMatch(frPattern);
  });

  test('sitemap: cache-control headers allow long CDN cache', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    const cacheControl = response?.headers()['cache-control'];
    // Per +server.ts: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
    expect(cacheControl).toContain('public');
    expect(cacheControl).toContain('s-maxage=86400');
  });
});

