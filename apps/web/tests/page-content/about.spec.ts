import { test, expect, type Page } from '@playwright/test';
import { aboutPageContent } from '../../src/lib/content/about-page';

for (const locale of ['', '/fr', '/es'])
	test(`about prose determines card height: ${locale || 'en'}`, { tag: '@theme' }, async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 600 });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await forceWeather(page, CASES[0]);
		await page.goto(`${locale}/about`);
		await expect(page.getByTestId('about-quote-controls')).toBeVisible();
		for (const control of await page.getByTestId('about-quote-controls').locator('button').all()) {
			const box = (await control.boundingBox())!;
			expect(Math.min(box.width, box.height), 'quote controls keep a 44px target').toBeGreaterThanOrEqual(44);
		}
		for (const id of ['about-identity', 'about-method']) {
			const sizes = await page.getByTestId(id).locator('p').evaluateAll(els => els.map(el => parseFloat(getComputedStyle(el).fontSize)));
			expect(Math.min(...sizes), `${id} prose keeps the approved body-text floor`).toBeGreaterThanOrEqual(16);
		}
		const card = page.getByTestId('about-testimonials');
		const dots = card.getByRole('tab');
		for (const viewport of [{ width: 1920, height: 1080 }, { width: 390, height: 844 }, { width: 820, height: 1180 }, { width: 1280, height: 600 }]) {
			await page.setViewportSize(viewport);
			await page.evaluate(() => document.fonts.ready);
			const baseline = await card.evaluate(el => ({ height: el.getBoundingClientRect().height, controls: el.querySelector('[data-testid="about-quote-controls"]')!.getBoundingClientRect().top - el.getBoundingClientRect().top }));
			for (const dot of await dots.all()) {
				await expect(async () => {
					await dot.click();
					await expect(dot).toHaveAttribute('aria-selected', 'true', { timeout: 1000 });
				}).toPass();
				await expect(dot).toBeFocused();
				const geometry = await card.evaluate((el) => {
					const style = getComputedStyle(el), bounds = el.getBoundingClientRect();
					const label = el.querySelector('[data-slot="stop-label"]')!;
					const controls = el.querySelector('[data-testid="about-quote-controls"]')!;
					const quote = [...el.querySelectorAll('blockquote')].find(item => getComputedStyle(item).visibility === 'visible')!.parentElement!.getBoundingClientRect();
					const top = label.getBoundingClientRect().bottom + parseFloat(getComputedStyle(label).marginBottom);
					const bottom = controls.getBoundingClientRect().top - parseFloat(getComputedStyle(controls).marginTop);
					return {
						height: bounds.height,
						controls: controls.getBoundingClientRect().top - bounds.top,
						topGap: label.getBoundingClientRect().top - bounds.top - parseFloat(style.borderTopWidth) - parseFloat(style.paddingTop),
						bottomGap: bounds.bottom - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom) - controls.getBoundingClientRect().bottom,
						centreOffset: (quote.top + quote.bottom - top - bottom) / 2,
						clearsLabel: quote.top >= top,
						clearsControls: quote.bottom <= bottom,
					};
				});
				expect(Math.abs(geometry.height - baseline.height), 'all quotes share the largest intrinsic card height').toBeLessThanOrEqual(1);
				expect(Math.abs(geometry.controls - baseline.controls), 'selection never moves the controls within the card').toBeLessThanOrEqual(1);
				await expect(card.getByRole('blockquote')).toHaveCount(1);
				expect(Math.abs(geometry.topGap), 'the stop label stays at the padded card top').toBeLessThanOrEqual(1);
				expect(Math.abs(geometry.bottomGap), 'controls sit at the padded card bottom').toBeLessThanOrEqual(1);
				expect(Math.abs(geometry.centreOffset), 'quote and attribution centre between label and controls').toBeLessThanOrEqual(1);
				expect(geometry.clearsLabel && geometry.clearsControls, 'quote content does not overlap the label or controls').toBe(true);
			}
		}
		for (const id of ['about-quote-body', 'about-identity-scroll', 'about-method-scroll']) {
			const body = page.getByTestId(id);
			const beforeHeight = await body.evaluate(el => el.closest('[data-slot="card"]')!.getBoundingClientRect().height);
			await body.evaluate((el) => {
				const paragraph = document.createElement('p');
				paragraph.textContent =
					'Representative longer localized prose with changing details. '.repeat(20);
				(el.querySelector('blockquote') ?? el).append(paragraph);
			});
			if (id === 'about-quote-body') expect(await body.evaluate(el => el.closest('[data-slot="card"]')!.getBoundingClientRect().height), 'a longer inactive quote expands the card too').toBeGreaterThan(beforeHeight);
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

test.describe('/about page content', () => {
  test('interest images fill their strips on phones and tablets', async ({ page }) => {
    test.skip(page.viewportSize()!.width >= 1024, 'Phone and tablet strips.');
    await forceWeather(page, CASES[0]);
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
  });

  test('page-about renders with all bento cells visible', async ({ page }) => {
		test.skip(page.viewportSize()!.width < 1024, 'Desktop only.');
    await forceWeather(page, CASES[0]);
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
		test.skip(page.viewportSize()!.width < 1024, 'Desktop only.');
      await forceWeather(page, CASES[0]);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);

      await expect(page.locator('[data-testid="page-about"]')).toBeVisible();

      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h2')).toHaveCount(Object.keys(aboutPageContent.stopLabels).length - 1);
      await expect(page.locator('h3, h4, h5, h6')).toHaveCount(0);

      // The h1 carries real localized copy (the identity title), not chrome.
      const h1Text = await page.locator('h1').textContent();
      expect(h1Text?.trim().length).toBeGreaterThan(0);
      expect(h1Text?.trim()).not.toMatch(/^(STOP|ARRÊT|PARADA)\b/);

      // Every h2 is a card stop label, and each one has text.
      const stopHeadings = page.locator('h2[data-slot="stop-label"]');
      await expect(stopHeadings).toHaveCount(Object.keys(aboutPageContent.stopLabels).length - 1);
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

interface SceneCase {
	name: string;
	icon: string | null;
	scene: string;
	night: boolean;
	temp: number;
	condition: string;
}

const CASES: SceneCase[] = [
	{ name: 'clear-day', icon: '01d', scene: 'clear', night: false, temp: 24, condition: 'clear sky' },
	{ name: 'storm-night', icon: '11n', scene: 'storm', night: true, temp: 15, condition: 'thunderstorm' },
];

const SCENE = '[data-testid="about-weather"] .weather-scene';

async function forceWeather(page: Page, c: SceneCase) {
	await page.route('**/api/weather', (route) =>
		route.fulfill({
			json: c.icon ? { temp: c.temp, condition: c.condition, icon: c.icon } : null,
		})
	);
}

test.describe('weather scene system (GO Wave 4)', () => {
	test('storm night: stubbed /api/weather drives the full composition', async ({ page }) => {
		test.skip(page.viewportSize()!.width < 1024, 'Desktop only.');
		const c = CASES.find((x) => x.name === 'storm-night')!;
		await forceWeather(page, c);
		await page.goto('/about');
		const scene = page.locator(SCENE);
		await expect(scene).toHaveAttribute('data-scene', c.scene);
		await expect(scene).toHaveAttribute('data-weather-night', String(c.night));
		await expect(scene.locator('.weather-bolt')).toHaveCount(1);
		await expect(scene.locator('.weather-windows')).toHaveCount(1);
	});

	test('unknown icon code falls back to the clear scene', async ({ page }) => {
		test.skip(page.viewportSize()!.width < 1024, 'Desktop only.');
		await page.route('**/api/weather', (route) =>
			route.fulfill({ json: { temp: 21, condition: 'meteor shower', icon: '77d' } })
		);
		await page.goto('/about');
		await expect(page.locator(SCENE)).toHaveAttribute('data-scene', 'clear');
	});

	test('scene is never blank: sky + skyline render', async ({
		page,
	}) => {
		test.skip(page.viewportSize()!.width < 1024, 'Desktop only.');
		await forceWeather(page, CASES[0]);
		await page.goto('/about');
		const scene = page.locator(SCENE);
		await expect(scene).toHaveCount(1);
		await expect(scene.locator('.weather-sky')).toHaveCount(1);
		await expect(scene.locator('.weather-skyline')).toBeVisible();
	});
});

test.describe('reduced motion', () => {

	test('under reduced motion, about train↔rocket renders the train, idle bob gated off', { tag: '@motion' }, async ({ page }) => {
		await forceWeather(page, CASES[0]);
		await page.goto('/about');
		// SVG morph widget paints the train at rest (paths present, not blank).
		const widget = page.getByTestId('about-train-button');
		await expect(widget).toBeVisible();
		const paths = widget.locator('svg path');
		expect(await paths.count()).toBeGreaterThan(0);
		// The ceaseless idle bob must be suppressed under reduced motion.
		await expect
			.poll(() => widget.evaluate((el) => getComputedStyle(el).animationName), { timeout: 1000 })
			.toBe('none');
	});

	test('under reduced motion, weather scene is a static composition (parked, never blank)', { tag: '@motion' }, async ({
		page,
	}) => {
		await forceWeather(page, CASES[0]);
		await page.goto('/about');
		await expect(page.locator('[data-testid="about-weather"]')).toBeVisible();
		// GO Wave 4 scene system: the scene root + skyline always render
		// (whatever the live condition — offline included), so reduce must show
		// a composed still, not an empty card.
		const scene = page.locator('[data-testid="about-weather"] .weather-scene');
		await expect(scene).toHaveCount(1);
		await expect(scene.locator('.weather-sky')).toHaveCount(1);
		await expect(scene.locator('.weather-skyline')).toBeVisible();
		// Every scene element (animated or not) must compute animation none.
		const particles = page.locator('[data-testid="about-weather"] [class*="weather-"]');
		const count = await particles.count();
		expect(count).toBeGreaterThan(0);
		for (let i = 0; i < count; i++) {
			await expect
				.poll(() => particles.nth(i).evaluate((el) => getComputedStyle(el).animationName), {
					timeout: 1000,
				})
				.toBe('none');
		}
	});
});
