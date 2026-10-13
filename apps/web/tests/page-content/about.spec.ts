import { test, expect } from '@playwright/test';

for (const locale of ['', '/fr', '/es'])
	for (const theme of ['light', 'dark']) {
		test(`about prose determines card height: ${locale || 'en'} ${theme}`, async ({ page }) => {
			await page.setViewportSize({ width: 1280, height: 600 });
			await page.emulateMedia({
				reducedMotion: 'reduce',
				colorScheme: theme as 'light' | 'dark',
			});
			await page.goto(`${locale}/about`);
			await expect(page.getByTestId('about-quote-controls')).toBeVisible();
			for (const id of ['about-identity', 'about-method']) {
				const sizes = await page.getByTestId(id).locator('p').evaluateAll(els => els.map(el => parseFloat(getComputedStyle(el).fontSize)));
				expect(Math.min(...sizes), `${id} prose keeps the approved body-text floor`).toBeGreaterThanOrEqual(16);
			}
			for (const id of ['about-identity-scroll', 'about-method-scroll', 'about-quote-body']) {
				const body = page.getByTestId(id);
				await body.evaluate((el) => {
					const paragraph = document.createElement('p');
					paragraph.textContent =
						'Representative longer localized prose with changing details. '.repeat(20);
					el.append(paragraph);
				});
				expect(
					await body.evaluate((el) => el.scrollHeight - el.clientHeight),
					`${id} must grow with its prose`,
				).toBeLessThanOrEqual(1);
				expect(
					await body.evaluate(
						(el) =>
							el.getBoundingClientRect().bottom -
							el.closest('[data-slot="card"]')!.getBoundingClientRect().bottom,
					),
					`${id} must fit inside its card`,
				).toBeLessThanOrEqual(1);
			}
			const terminal = page.getByTestId('about-cta').locator('.terminal-body');
			expect(
				await terminal.evaluate((el) => el.scrollHeight - el.clientHeight),
			).toBeLessThanOrEqual(1);
			await page.getByTestId('about-cta-button').focus();
			await expect(page.getByTestId('about-cta-button')).toBeInViewport();
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
			).toBeLessThanOrEqual(1);
		});
	}

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

  // WS10-041: /about shipped ZERO heading elements in all three locales — no
  // <h1> for search, and no way for a screen-reader user to navigate the bento
  // by heading (WCAG 1.3.1 Level A; axe page-has-heading-one). The outline is
  // built from copy that already existed: the identity title is the h1, and
  // each remaining card's stop label is that card's h2.
  for (const [locale, path] of [
    ['en', '/about'],
    ['fr', '/fr/about'],
    ['es', '/es/about'],
  ] as const) {
    test(`about exposes one h1 and an h2 outline (${locale})`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);

      await expect(page.locator('[data-testid="page-about"]')).toBeVisible();

      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h2')).toHaveCount(9);
      await expect(page.locator('h3, h4, h5, h6')).toHaveCount(0);

      // The h1 carries real localized copy (the identity title), not chrome.
      const h1Text = await page.locator('h1').textContent();
      expect(h1Text?.trim().length).toBeGreaterThan(0);
      expect(h1Text?.trim()).not.toMatch(/^(STOP|ARRÊT|PARADA)\b/);

      // Every h2 is a card stop label, and each one has text.
      const stopHeadings = page.locator('h2[data-slot="stop-label"]');
      await expect(stopHeadings).toHaveCount(9);
      for (const text of await stopHeadings.allTextContents()) {
        expect(text.trim().length).toBeGreaterThan(0);
      }

      // Document order: the h1 leads, so the outline never opens on an h2.
      const firstLevel = await page.evaluate(
        () => document.querySelector('h1, h2, h3, h4, h5, h6')?.tagName ?? null,
      );
      expect(firstLevel).toBe('H1');
    });
  }

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

    // Language names: each language is a flag button (data-testid="about-language-flag")
    // carrying its visible name in a span.flag-label.
    const langNames = langCell.locator('.flag-label');
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
