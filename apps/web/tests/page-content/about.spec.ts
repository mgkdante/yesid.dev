import { test, expect } from '@playwright/test';

test.describe('/about page content', () => {
  test('page-about renders with all bento cells visible', async ({ page }) => {
    const response = await page.goto('/about');
    expect(response?.status()).toBe(200);

    await expect(page.locator('[data-testid="page-about"]')).toBeVisible();

    // All 10 cells must be present
    const cellTestids = [
      'about-identity',
      'about-metrics',
      'about-method',
      'about-education',
      'about-testimonials',
      'about-languages',
      'about-interests',
      'about-polaroids',
      'about-weather',
      'about-train',
      'about-cta',
    ];

    for (const testid of cellTestids) {
      await expect(page.locator(`[data-testid="${testid}"]`)).toBeVisible();
    }
  });

  test('about-education renders non-empty schools + programs + icons', async ({ page }) => {
    await page.goto('/about');
    const eduCell = page.locator('[data-testid="about-education"]');
    await expect(eduCell).toBeVisible();

    // Schools: find divs with class="school" and verify text
    const schoolDivs = eduCell.locator('.school');
    const schoolCount = await schoolDivs.count();
    expect(schoolCount).toBeGreaterThan(0);

    for (let i = 0; i < schoolCount; i++) {
      const schoolText = await schoolDivs.nth(i).textContent();
      expect(schoolText?.trim().length).toBeGreaterThan(0);
    }

    // Programs: find divs with class="program"
    const programDivs = eduCell.locator('.program');
    const programCount = await programDivs.count();
    expect(programCount).toBeGreaterThan(0);

    for (let i = 0; i < programCount; i++) {
      const programText = await programDivs.nth(i).textContent();
      expect(programText?.trim().length).toBeGreaterThan(0);
    }

    // Icons: verify img src present (Champlain/Bishops)
    const icons = eduCell.locator('img');
    const iconCount = await icons.count();
    expect(iconCount).toBeGreaterThan(0);
    const firstIconSrc = await icons.first().getAttribute('src');
    expect(
      firstIconSrc?.includes('edu-champlain') || firstIconSrc?.includes('edu-bishops')
    ).toBeTruthy();
  });

  test('about-testimonials renders Guy-Sensei quote non-empty (EN)', async ({ page }) => {
    await page.goto('/about');
    const testimCell = page.locator('[data-testid="about-testimonials"]');
    await expect(testimCell).toBeVisible();

    // Blockquote must have text
    const blockquote = testimCell.locator('blockquote');
    await expect(blockquote).toBeVisible();
    const quoteText = await blockquote.textContent();
    expect(quoteText?.trim().length).toBeGreaterThan(0);
    // Specific Guy-Sensei content check: the quote includes "perseverance"
    expect(quoteText?.toLowerCase()).toContain('perseverance');
  });

  test('about-languages renders language list non-empty', async ({ page }) => {
    await page.goto('/about');
    const langCell = page.locator('[data-testid="about-languages"]');
    await expect(langCell).toBeVisible();

    // Language names: spans with class="lang-name"
    const langNames = langCell.locator('.lang-name');
    const langCount = await langNames.count();
    expect(langCount).toBeGreaterThan(0);

    for (let i = 0; i < langCount; i++) {
      const text = await langNames.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('about-polaroids-cell renders snapshots with images', async ({ page }) => {
    await page.goto('/about');
    const polaroidCell = page.locator('[data-testid="about-polaroids-cell"]');
    await expect(polaroidCell).toBeVisible();

    const polaroidCard = page.locator('[data-testid="about-polaroids"]');
    await expect(polaroidCard).toBeVisible();

    // Verify at least one polaroid img
    const imgs = polaroidCard.locator('img');
    expect(await imgs.count()).toBeGreaterThan(0);

    // Verify src contains polaroid path
    const firstSrc = await imgs.first().getAttribute('src');
    expect(firstSrc?.includes('polaroid')).toBeTruthy();
  });

  test('about-testimonials quote renders in FR when locale=fr', async ({ page }) => {
    const response = await page.goto('/fr/about');
    expect(response?.status()).toBe(200);

    const testimCell = page.locator('[data-testid="about-testimonials"]');
    await expect(testimCell).toBeVisible();

    // Blockquote in French version
    const blockquote = testimCell.locator('blockquote');
    await expect(blockquote).toBeVisible();
    const quoteText = await blockquote.textContent();
    expect(quoteText?.trim().length).toBeGreaterThan(0);
    // Guy-Sensei quote has a native FR translation (about-page.ts): the
    // rendered text is "Tu as le don de la persévérance, …" — assert the
    // real accented French word.
    expect(quoteText?.toLowerCase()).toContain('persévérance');
  });
});

