import { siteLabels } from '../src/lib/content/site-labels';
// go2 integration regression locks — two operator-reported deploy bugs.
//
// BUG 1 — service SVGs "nowhere to be found" on /services + /services/[id].
//   Root cause: server loads fetched /svg/services/* via SvelteKit fetch; on
//   Vercel the static dir isn't in the function bundle, so kit fell back to a
//   network self-fetch that 401s behind preview deployment protection →
//   every svgContent was '' → {#if svgContent} rendered nothing. Fixed by
//   build-time import.meta.glob(?raw) inlining in $lib/utils/service-svg.ts.
//   The lock asserts PAINT-level visibility (computed style + non-zero box),
//   not DOM presence — DOM-presence checks passed while the user saw nothing.
//
import { test, expect, type Page } from '@playwright/test';

async function openMenu(page: Page, key = 'Enter') {
	// SSR can expose the trigger before client handlers hydrate. Retry only an unopened dialog.
	await expect(async () => {
		if ((await page.getByRole('dialog').count()) === 0)
			await page.getByTestId('nav-menu-toggle').press(key);
		await expect(page.getByRole('dialog')).toHaveCount(1, { timeout: 1000 });
	}).toPass({ timeout: 15_000 });
}

test.describe('responsive shell and interrupted menu', () => {
	test('mobile TOC leaves the section reached by Tab visibly focused after collapse-all', async ({ page }) => {
		test.skip(page.viewportSize()!.width < 1024, 'Sets its own viewports.');
		await page.setViewportSize({ width: 683, height: 300 });
		await page.goto('/projects/transit-data-pipeline');
		await openMenu(page);
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await page.getByTestId('quiet-mode-toggle').click();
		await expect(page.getByTestId('quiet-mode-toggle')).toHaveText(siteLabels.a11y.quietModeLabelCollapsed.en);
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		const section = page.locator('main .section-header:visible').first();
		await expect(section).toBeFocused();
		const focused = await section.boundingBox();
		const toc = await page.getByTestId('toc-pill').boundingBox();
		expect(focused!.y + focused!.height + 2).toBeLessThanOrEqual(toc!.y);
	});
	test('listing summary owns its readable size independently of inherited title sizing', async ({
		page,
	}) => {
		test.skip(page.viewportSize()!.width < 1024, 'Sets its own viewports.');
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/blog');
		await page.locator('.listing-header-text').evaluate((el) => {
			(el as HTMLElement).style.fontSize = '40px';
		});
		expect(
			await page
				.locator('.listing-header-subtitle')
				.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
		).toBe(16);
	});
	test('long listing rail labels fit the short viewport without consuming the content column', async ({
		page,
	}) => {
		test.skip(page.viewportSize()!.width < 1024, 'Sets its own viewports.');
		await page.setViewportSize({ width: 1366, height: 600 });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/blog');
		await openMenu(page);
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toHaveCount(0);
		const title = page.locator('.listing-layout > .edge-title-column .edge-title');
		// Replace renderer-owned text only after client hydration.
		await title.evaluate((el) => {
			el.textContent = 'Un catalogue de travaux et de recherches.';
		});
		const bounds = await title.boundingBox();
		expect(bounds!.height).toBeLessThanOrEqual(568);
		const content = await page.locator('.listing-layout > .listing-main').boundingBox();
		expect(content!.width).toBeGreaterThan(300);
	});
	test('wrapped listing titles and summaries stay below the narrow-screen pill', async ({
		page,
	}) => {
		test.skip(page.viewportSize()!.width < 1024, 'Sets its own viewports.');
		await page.setViewportSize({ width: 320, height: 568 });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		for (const route of ['/blog', '/blog/personal', '/projects']) {
			await page.goto(route);
			await page.evaluate(() => document.fonts.ready);
			const pill = await page.getByTestId('nav-pill').boundingBox();
			const title = await page.locator('.listing-mobile-heading').boundingBox();
			const summary = await page.locator('.listing-header-subtitle').boundingBox();
			const header = await page.locator('.listing-blueprint-header').boundingBox();
			expect(title!.y).toBeGreaterThanOrEqual(pill!.y + pill!.height + 14);
			expect(summary!.y + summary!.height).toBeLessThanOrEqual(header!.y + header!.height);
		}
	});
	for (const width of [1280, 1366]) {
		test(`short-laptop headers expose title, summary or action, and content at ${width}x600`, async ({
			page,
		}) => {
		test.skip(page.viewportSize()!.width < 1024, 'Sets its own viewports.');
			await page.setViewportSize({ width, height: 600 });
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.goto('/');
			const homePill = await page.getByTestId('nav-pill').boundingBox();
			const title = await page.getByTestId('hero-line1').boundingBox();
			expect(title!.y).toBeGreaterThanOrEqual(homePill!.y + homePill!.height + 14);
			await expect(page.getByTestId('hero-subtitle')).toBeInViewport();
			await expect(page.getByTestId('hero-cta-projects')).toBeInViewport();
			for (const route of [
				'/projects/transit-data-pipeline',
				'/blog/50-to-0-an-oracle-always-free-vm',
			]) {
				await page.goto(route);
				await page.evaluate(() => document.fonts.ready);
				const pill = await page.getByTestId('nav-pill').boundingBox();
				const heading = await page.locator('main h1').boundingBox();
				const header = await page.locator('[data-slot="article-header"]').boundingBox();
				expect(
					await page.locator('main h1').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
				).toBeLessThanOrEqual(56);
				expect(heading!.y).toBeGreaterThanOrEqual(pill!.y + pill!.height + 14);
				expect(header!.y + header!.height).toBeLessThanOrEqual(568);
				await expect(page.locator('.header__back')).toBeInViewport();
			}
			await page.goto('/legal/privacy');
			for (const link of await page.locator('[data-testid="footer"] .footer-link').all()) {
				expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
			}
		});
	}

});

const SVG_ROUTES = ['/services', '/services/database-engineering'] as const;
const THEMES = ['dark', 'light'] as const;

interface PanelPaint {
	display: string;
	visibility: string;
	opacity: number;
	iconW: number;
	iconH: number;
	shapeCount: number;
}

/** Paint-level facts for every service SVG panel whose wrapper is rendered. */
async function collectPanelPaint(page: Page): Promise<PanelPaint[]> {
	return page.evaluate(() => {
		const out: PanelPaint[] = [];
		for (const panel of document.querySelectorAll<HTMLElement>(
			'[data-testid="service-svg-panel"]',
		)) {
			// Skip wrappers hidden by responsive design (e.g. the desktop panel
			// on mobile detail and vice versa) — zero client rects means a
			// display:none ancestor, which is intentional there.
			if (panel.getClientRects().length === 0) continue;
			const cs = getComputedStyle(panel);
			const icon = panel.querySelector<HTMLElement>('[data-slot="svg-icon"]');
			const iconRect = icon?.getBoundingClientRect();
			const svg = panel.querySelector('svg');
			out.push({
				display: cs.display,
				visibility: cs.visibility,
				opacity: parseFloat(cs.opacity),
				iconW: iconRect?.width ?? 0,
				iconH: iconRect?.height ?? 0,
				shapeCount: svg
					? svg.querySelectorAll('path, rect, line, circle, ellipse, polyline, polygon').length
					: 0,
			});
		}
		return out;
	});
}

for (const route of SVG_ROUTES) {
	test(`service SVG art paints on ${route} (both themes, computed visibility + non-zero size)`, async ({
		page,
	}) => {
		await page.goto(route);
		await page
			.locator('[data-testid="service-svg-panel"] svg')
			.first()
			.waitFor({ state: 'attached' });

		for (const theme of THEMES) {
			await page.evaluate((t) => {
				document.documentElement.dataset.theme = t;
			}, theme);
			// Deterministic settle: wait until the first rendered panel reports the
			// computed visibility the per-panel loop later asserts ('visible'),
			// instead of a fixed sleep after flipping data-theme.
			await expect
				.poll(
					() =>
						page
							.locator('[data-testid="service-svg-panel"]')
							.first()
							.evaluate((el) => getComputedStyle(el).visibility),
					{ timeout: 2000 },
				)
				.toBe('visible');

			const panels = await collectPanelPaint(page);

			// At least one panel must actually paint on every route/viewport.
			expect(panels.length, `${route} [${theme}]: no rendered svg panels`).toBeGreaterThan(0);

			for (const [i, p] of panels.entries()) {
				const label = `${route} [${theme}] panel #${i}`;
				expect(p.display, `${label} display`).not.toBe('none');
				expect(p.visibility, `${label} visibility`).toBe('visible');
				expect(p.opacity, `${label} opacity`).toBeGreaterThan(0.5);
				// Non-zero painted size — the mobile listing icon is ~30px, the
				// desktop panel ~224px; anything under 24px is a collapse.
				expect(p.iconW, `${label} icon width`).toBeGreaterThanOrEqual(24);
				expect(p.iconH, `${label} icon height`).toBeGreaterThanOrEqual(24);
				// The art itself made it into the document (raw svg inlined).
				expect(p.shapeCount, `${label} drawable shapes`).toBeGreaterThan(0);
			}
		}
	});
}

test('listing renders a painted SVG panel for every service card', async ({ page }) => {
	await page.goto('/services');
	await page
		.locator('[data-testid="service-svg-panel"] svg')
		.first()
		.waitFor({ state: 'attached' });

	const { cards, paintedPanels } = await page.evaluate(() => {
		const cards = document.querySelectorAll('[data-testid^="service-card-"]').length;
		let paintedPanels = 0;
		for (const panel of document.querySelectorAll('[data-testid="service-svg-panel"]')) {
			if (panel.getClientRects().length > 0) paintedPanels += 1;
		}
		return { cards, paintedPanels };
	});

	expect(cards).toBeGreaterThan(0);
	expect(paintedPanels, 'every service card carries painted svg art').toBe(cards);
});

test.describe('section navigation keyboard continuity', () => {
	test('three section journeys on a project page', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/projects/transit-data-pipeline');
		const pill = (await page.getByTestId('nav-pill').boundingBox())!;
		await openMenu(page);
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await expect(page.getByTestId('nav-menu-toggle')).toBeFocused();
		const heading = page.locator('[data-section-index="1"] .section-header').first();
		// Section index 1 has number badge 02; copy may repeat across sections.
		for (let cycle = 0; cycle < 3; cycle++) {
			if (page.viewportSize()!.width < 1024) {
				const pill = page.getByTestId('toc-pill').locator('button.toc-pill');
				await pill.press('Enter');
				await expect(page.locator('.toc-drawer')).toBeVisible();
				await page.keyboard.press('Escape');
				await expect(pill).toBeFocused();
				await pill.press('Space');
				await page
					.locator('.toc-drawer-item:not(.toc-drawer-sub)')
					.filter({ has: page.locator('.toc-drawer-badge').getByText('02', { exact: true }) })
					.press('Enter');
				await expect(pill).toBeFocused();
				await expect(page.locator('.toc-drawer')).toHaveCount(0);
			} else
				await page
					.locator('.toc-column .toc-nav > button.toc-item:not(.toc-sub-item)')
					.filter({ has: page.locator('.toc-badge').getByText('02', { exact: true }) })
					.press('Enter');
			await expect(async () => {
				const box = (await heading.boundingBox())!;
				expect(box.y).toBeGreaterThanOrEqual(pill.y + pill.height);
				expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
			}).toPass();
			await expect(heading).toHaveAttribute('aria-expanded', 'false');
			await heading.press('Enter');
			await expect(heading).toHaveAttribute('aria-expanded', 'true');
			await heading.press('Space');
			await expect(heading).toHaveAttribute('aria-expanded', 'false');
		}
	});
});

test('programmatic collapse returns interior focus visibly', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/projects/transit-data-pipeline');
	const pill = (await page.getByTestId('nav-pill').boundingBox())!;
	await openMenu(page);
	await page.keyboard.press('Escape');
	await expect(page.getByTestId('nav-menu-toggle')).toBeFocused();
	const section = page.locator('[data-section-index="0"]');
	await section
		.locator('.section-body:not([data-slot="collapsible-content"])')
		.first()
		.evaluate((el) => {
			const link = document.createElement('a');
			link.href = '#focus-fixture';
			link.textContent = 'Interior focus fixture';
			el.append(link);
		});
	await page.getByRole('link', { name: 'Interior focus fixture' }).focus();
	const heading = section.locator('.section-header').first();
	await page
		.getByTestId('quiet-mode-toggle')
		.evaluate((el: HTMLButtonElement) => el.click());
	await expect(heading).toBeFocused();
	await expect(heading).toHaveAttribute('aria-expanded', 'false');
	await expect(async () => {
		const box = (await heading.boundingBox())!;
		expect(box.y).toBeGreaterThanOrEqual(pill.y + pill.height);
		expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
	}).toPass();
});
