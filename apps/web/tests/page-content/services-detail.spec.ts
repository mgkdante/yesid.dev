import { test, expect } from '@playwright/test';

// Ground truth (src/lib/content/services.ts + ServiceDetailPage.svelte):
// The /services listing's first station (sorted by station number) is
// `database-engineering`. It carries an SVG panel, an impact metric
// ("3x faster" / "avg query improvement"), a value proposition, 8
// deliverables, and 3 related projects — so the first detail page always
// renders every section under test. Station tabs in navigate mode are a
// <nav class="station-tabs"> of <a class="station-tab"> links wrapped in a
// .tabs-bar div (NO role="tab"/role="tablist"). Section headings render in
// CollapsibleSection's <h2 class="section-title">.

/** Open the first service detail page and return its href. */
async function gotoFirstService(page: import('@playwright/test').Page): Promise<string> {
  await page.goto('/services');
  const firstServiceLink = page.locator('a[href^="/services/"]').first();
  const href = await firstServiceLink.getAttribute('href');
  expect(href).toBeTruthy();
  await page.goto(href!);
  await expect(page.locator('[data-testid="service-detail-page"]')).toBeVisible();
  return href!;
}

test.describe('/services/[id] detail page content', () => {
  test('service detail page renders with hero SVG panel', async ({ page }) => {
    await gotoFirstService(page);

    // SVG panel (art) is rendered on desktop — the first service always has one.
    test.skip(test.info().project.name !== 'desktop-chrome', 'desktop-only SVG panel');
    const svgPanel = page.locator('.svg-desktop svg').first();
    await expect(svgPanel).toBeVisible();
    const box = await svgPanel.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  });

  test('service detail renders station tabs in navigate mode', async ({ page }) => {
    await gotoFirstService(page);

    // Navigate-mode tabs: a .tabs-bar wrapper holding a .station-tabs <nav>.
    // There is no role="tablist"/role="tab" — the controls are <a.station-tab> links.
    const tabsBar = page.locator('.tabs-bar');
    await expect(tabsBar).toBeVisible();

    const tabLinks = tabsBar.locator('a.station-tab');
    expect(await tabLinks.count()).toBeGreaterThan(0);
    await expect(tabLinks.first()).toBeVisible();

    // Every tab links to a /services/[id] route, and exactly one is the active station.
    await expect(tabLinks.first()).toHaveAttribute('href', /\/services\//);
    expect(await tabsBar.locator('a.station-tab[data-active="true"]').count()).toBe(1);
  });

  test('service detail shows impact metric when present', async ({ page }) => {
    await gotoFirstService(page);

    // The first service carries an impact metric — on desktop it renders in the
    // sticky .impact-column as .impact-value + .impact-label, both non-empty.
    test.skip(test.info().project.name !== 'desktop-chrome', 'desktop-only impact column');
    const metricValue = page.locator('.impact-column .impact-value');
    await expect(metricValue).toBeVisible();
    expect((await metricValue.textContent())?.trim().length).toBeGreaterThan(0);

    const metricLabel = page.locator('.impact-column .impact-label');
    await expect(metricLabel).toBeVisible();
    expect((await metricLabel.textContent())?.trim().length).toBeGreaterThan(0);
  });

  test('service detail renders value-proposition + deliverables sections', async ({ page }) => {
    await gotoFirstService(page);

    // CollapsibleSection renders each title in <h2 class="section-title">.
    // Real copy: "How This Helps You" (value proposition) + "Typical Deliverables".
    await expect(
      page.locator('h2.section-title', { hasText: 'How This Helps You' })
    ).toBeVisible();
    await expect(
      page.locator('h2.section-title', { hasText: 'Typical Deliverables' })
    ).toBeVisible();

    // Deliverables list is populated (the first service has 8).
    const deliverables = page.locator('.deliverables-grid .deliverable-item');
    expect(await deliverables.count()).toBeGreaterThan(0);
  });

  test('service detail renders related projects section', async ({ page }) => {
    await gotoFirstService(page);

    // The first service has related projects — the panel heading reads
    // "Related Projects (N)" and the list holds N project links.
    const relatedHeading = page
      .locator('h2.section-title')
      .filter({ hasText: /related projects/i })
      .first();
    await expect(relatedHeading).toBeVisible();

    // Scope to the desktop right-panel (the mobile .projects-mobile copy is
    // display:none at desktop width) so .first() resolves to a visible link.
    const projectLinks = page.locator('.projects-panel .projects-list a.project-link');
    expect(await projectLinks.count()).toBeGreaterThan(0);
    await expect(projectLinks.first()).toBeVisible();
    await expect(projectLinks.first()).toHaveAttribute('href', /\/projects\//);
  });

  test('service detail back link navigates to /services', async ({ page }) => {
    await gotoFirstService(page);

    const backLink = page.locator('a.back-link[href$="/services"]').first();
    await expect(backLink).toBeVisible();
    expect((await backLink.textContent())?.trim().length).toBeGreaterThan(0);
  });
});
