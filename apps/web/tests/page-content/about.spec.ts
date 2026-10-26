import { test, expect } from '@playwright/test';

for (const locale of ['', '/fr', '/es'])
	for (const theme of ['light', 'dark']) {
		test(`about prose determines card height: ${locale || 'en'} ${theme}`, async ({ page }) => {
			await page.setViewportSize({ width: 1280, height: 600 });
			await page.emulateMedia({
				reducedMotion: 'reduce',
				colorScheme: theme as 'light' | 'dark',
			});
			await page.addInitScript(value => localStorage.setItem('theme', value), theme);
			await page.goto(`${locale}/about`);
			await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
			await expect(page.getByTestId('about-quote-controls')).toBeVisible();
			for (const control of await page.getByTestId('about-quote-controls').locator('button').all()) {
				const box = (await control.boundingBox())!;
				expect(Math.min(box.width, box.height), 'quote controls keep a 44px target').toBeGreaterThanOrEqual(44);
			}
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
  test('interest images fill their strips on phones and tablets', async ({ page }) => {
    for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/about');
      await page.getByTestId('about-interests').scrollIntoViewIfNeeded();
      const dimensions = await page.locator('[data-testid="about-interests"] .strip-bg img').evaluateAll(els => els.map(el => {
        const image = el.getBoundingClientRect();
        const parent = el.parentElement!.getBoundingClientRect();
        return { width: image.width, height: image.height, parentWidth: parent.width, parentHeight: parent.height };
      }));
      expect(dimensions.length).toBeGreaterThan(0);
      for (const image of dimensions) {
        expect(image.height).toBeGreaterThanOrEqual(image.parentHeight - 1);
        expect(image.width).toBeGreaterThanOrEqual(image.parentWidth - 1);
      }
    }
  });

  test('page-about renders with all bento cells visible', async ({ page }) => {
    const response = await page.goto('/about');
    expect(response?.status()).toBe(200);

    await expect(page.locator('[data-testid="page-about"]')).toBeVisible();

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

  // Each card remains navigable by a nonempty heading in every locale.
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
      for (const selector of ['.school', '.program', '.flag-label', 'blockquote']) {
        const collection = page.getByTestId('page-about').locator(selector);
        expect(await collection.count(), `${selector} renders a nonempty collection`).toBeGreaterThan(0);
        for (const text of await collection.allTextContents()) {
          expect(text.trim().length).toBeGreaterThan(0);
        }
      }
      for (const id of ['about-education', 'about-polaroids']) {
        const images = page.getByTestId(id).locator('img');
        expect(await images.count(), `${id} renders its media`).toBeGreaterThan(0);
        for (const image of await images.all()) {
          expect(await image.getAttribute('src')).toBeTruthy();
          expect(await image.getAttribute('alt')).not.toBeNull();
        }
      }
    });
  }

});
