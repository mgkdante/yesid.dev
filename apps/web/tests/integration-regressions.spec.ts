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
// BUG 2 — navbar disappeared whenever the menu sheet opened.
//   Root cause: round-2 `isolation: isolate` on .circuit-grid trapped the
//   fixed Nav (z 70) inside a stacking context while MenuOverlay portals to
//   <body> at z 60 — the sheet covered the nav at the root context. Fixed by
//   painting the grid as .circuit-grid's own background-image (no isolation).
//   The lock asserts paint order via elementFromPoint and closes the sheet
//   through the toggle (a covered toggle would fail actionability).

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
		await page.setViewportSize({ width: 683, height: 300 });
		await page.goto('/projects/transit-data-pipeline');
		await openMenu(page);
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await page.getByRole('button', { name: 'Collapse all', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Expand all', exact: true })).toBeVisible();
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		const section = page.locator('main .section-header:visible').first();
		await expect(section).toBeFocused();
		const focused = await section.boundingBox();
		const toc = await page.getByTestId('toc-pill').boundingBox();
		expect(focused!.y + focused!.height + 2).toBeLessThanOrEqual(toc!.y);
	});
	test('wheel input scrolls the bounded menu while the background stays locked', async ({ page }) => {
		await page.setViewportSize({ width: 683, height: 300 });
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto('/legal/privacy');
		await openMenu(page);
		const before = await page.evaluate(() => window.scrollY);
		const panel = page.locator('.menu-overlay');
		await panel.hover();
		await page.mouse.wheel(0, 600);
		await expect.poll(() => panel.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
		expect(await page.evaluate(() => window.scrollY)).toBe(before);
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toHaveCount(0);
		expect(await page.evaluate(() => window.scrollY)).toBe(before);
	});
	test('opening during a wheel glide holds the page through the dialog lifetime', async ({ page, isMobile }) => {
		test.skip(isMobile, 'Lenis intentionally runs only on pointer desktops.');
		await page.setViewportSize({ width: 1366, height: 600 });
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto('/legal/privacy');
		await expect(page.locator('html')).toHaveClass(/\blenis\b/);
		await page.getByTestId('nav-menu-toggle').focus();
		await page.evaluate(() => document.fonts.ready);
		await page.waitForTimeout(100); // Let the mounted GSAP ticker establish its first frame.
		await page.mouse.move(1100, 450);
		await page.mouse.wheel(0, 1000);
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
		expect(await page.evaluate(() => window.scrollY)).toBeLessThan(1000);
		await page.keyboard.press('Enter');
		await expect(page.getByRole('dialog')).toHaveCount(1);
		const before = await page.evaluate(() => window.scrollY);
		// Observe longer than the existing 1.2s Lenis glide, including CSS closing.
		await page.waitForTimeout(1300);
		expect(await page.evaluate(() => window.scrollY)).toBe(before);
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toHaveCount(0);
		expect(await page.evaluate(() => window.scrollY)).toBe(before);
	});
	test('history navigation retains the closing dialog boundary until its transition completes', async ({
		page,
	}) => {
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto('/projects');
		await openMenu(page);
		await page.keyboard.press('Escape');
		await expect(page.getByTestId('nav-menu-toggle')).toBeFocused();
		await page.locator('a[href="/blog"]').first().click();
		await page.waitForURL('**/blog');
		await page.addStyleTag({
			content: '.menu-overlay.closing { transition-duration: 1s !important; }',
		});
		for (const direction of ['back', 'forward']) {
			await openMenu(page);
			await page.evaluate(() => {
				const state = window as typeof window & { menuDuringHistory?: boolean };
				delete state.menuDuringHistory;
				window.addEventListener(
					'popstate',
					() =>
						requestAnimationFrame(() => {
							state.menuDuringHistory =
								Boolean(document.querySelector('[role="dialog"] .menu-overlay.closing')) &&
								document.querySelectorAll('[role="dialog"] [data-testid="nav-pill"]').length ===
									1 &&
								document.body.style.overflow === 'hidden';
						}),
					{ once: true },
				);
			});
			await page.keyboard.press('Escape');
			if (direction === 'back') await page.goBack();
			else await page.goForward();
			await expect
				.poll(() =>
					page.evaluate(
						() => (window as typeof window & { menuDuringHistory?: boolean }).menuDuringHistory,
					),
				)
				.toBe(true);
			await expect(page.getByRole('dialog')).toHaveCount(0);
			await expect(page.getByTestId('nav-menu-toggle')).not.toBeFocused();
		}
	});
	test('listing summary owns its readable size independently of inherited title sizing', async ({
		page,
	}) => {
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
		await page.setViewportSize({ width: 1366, height: 600 });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/blog');
		const title = page.locator('.listing-layout > .edge-title-column .edge-title');
		// Rendering stress fixture; ListingShell's unit test separately proves the supplied text contract.
		await title.evaluate((el) => {
			el.textContent = 'Un catalogue de travaux et de recherches.';
		});
		const bounds = await title.boundingBox();
		expect(bounds!.height).toBeLessThanOrEqual(568);
		const content = await page.locator('.listing-layout > .listing-content').boundingBox();
		expect(content!.width).toBeGreaterThan(300);
	});
	test('wrapped listing titles and summaries stay below the narrow-screen pill', async ({
		page,
	}) => {
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
	for (const locale of ['en', 'fr', 'es'])
		for (const width of [375, 1366]) {
		for (const reducedMotion of ['reduce', 'no-preference'] as const) {
			test(`long supplied menu stays reachable in ${locale} at ${width}px with ${reducedMotion}`, async ({ page }) => {
				await page.setViewportSize({ width, height: 600 });
				await page.emulateMedia({ reducedMotion });
				const menu = Array.from({ length: 10 }, (_, i) => ({
					href: `/fixture-${i}`,
					priority: 1,
					label: {
						en: `Research and reliable infrastructure ${i}`,
						fr: `Recherche et infrastructure fiable ${i}`,
						es: `Investigación e infraestructura confiable ${i}`,
					},
					...(i % 2
						? {}
						: {
								subtitle: {
									en: 'Optional supporting detail',
									fr: 'Précision facultative',
									es: 'Detalle opcional',
								},
							}),
				}));
				await page.route('**/legal/privacy', async (route) => {
					const response = await route.fetch();
					const html = await response.text();
					expect(html).toMatch(/menuItems:\[[\s\S]*?\](?=,|})/);
					await route.fulfill({
						response,
						body: html.replace(
							/menuItems:\[[\s\S]*?\](?=,|})/,
							`menuItems:${JSON.stringify(menu)}`,
						),
					});
				});
				await page.goto(`${locale === 'en' ? '' : '/' + locale}/legal/privacy`);
				for (const theme of ['dark', 'light']) {
					await page.evaluate((value) => {
						document.documentElement.dataset.theme = value;
					}, theme);
					await openMenu(page);
					const items = page.getByRole('dialog').locator('[data-menu-item]');
					await expect(items).toHaveCount(menu.length);
					const first = await items.first().boundingBox();
					const pill = await page.getByTestId('nav-pill').boundingBox();
					expect(first!.y).toBeGreaterThanOrEqual(pill!.y + pill!.height);
					const before = await page.evaluate(() => window.scrollY);
					const panel = page.locator('.menu-overlay');
					await panel.hover();
					for (const delta of [10000, 10000, -10000, -10000]) {
						await page.mouse.wheel(0, delta);
						await expect.poll(() => panel.evaluate(el => el.scrollTop)).toBe(delta > 0
							? await panel.evaluate(el => el.scrollHeight - el.clientHeight) : 0);
						expect(await page.evaluate(() => window.scrollY)).toBe(before);
					}
					await items.last().focus();
					const last = await items.last().boundingBox();
					expect(last!.x).toBeGreaterThanOrEqual(0);
					expect(last!.x + last!.width).toBeLessThanOrEqual(width);
					expect(last!.y).toBeGreaterThanOrEqual(pill!.y + pill!.height);
					expect(last!.y + last!.height).toBeLessThanOrEqual(601);
					await page.keyboard.press('Escape');
					await expect(page.getByRole('dialog')).toHaveCount(0);
				}
			});
		}
		}
	for (const width of [1280, 1366]) {
		test(`short-laptop headers expose title, summary or action, and content at ${width}x600`, async ({
			page,
		}) => {
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
				const header = await page.locator('.detail-header-shell').boundingBox();
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
	for (const theme of ['dark', 'light'] as const) {
		for (const reducedMotion of ['reduce', 'no-preference'] as const) {
			for (const viewport of [
				{ width: 375, height: 667 },
				{ width: 1366, height: 600 },
			]) {
				test.describe(`${theme} ${reducedMotion} ${viewport.width}x${viewport.height}`, () => {
					test.use({ colorScheme: theme, viewport });
					test.beforeEach(async ({ page }) => {
						await page.emulateMedia({ reducedMotion });
						await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
						await page.goto('/legal/privacy?menu=fixture#fixture');
						await expect(page.getByTestId('nav-menu-toggle')).toBeVisible();
						await page.evaluate(() => document.fonts.ready);
						await expect(page.getByTestId('language-toggle')).toHaveAttribute(
							'href',
							/\?menu=fixture#fixture$/,
						);
					});

					test('one modal pill contains controls, traps real keyboard focus and restores dismissal', async ({
						page,
					}) => {
						await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
						const scroll = await page.evaluate(() => window.scrollY);
						for (const key of ['Enter', 'Space', 'Enter']) {
							const toggle = page.getByTestId('nav-menu-toggle');
							await toggle.focus();
							await openMenu(page, key);
							const dialog = page.getByRole('dialog');
							await expect(dialog.getByTestId('nav-pill')).toHaveCount(1);
							await expect(toggle).toHaveAttribute('aria-expanded', 'true');
							await expect(dialog).toHaveAttribute(
								'id',
								(await toggle.getAttribute('aria-controls'))!,
							);
							await expect(dialog.locator('.nav-links')).toHaveAttribute('inert', '');
							for (let i = 0; i < 12; i++) {
								await page.keyboard.press(i % 3 === 0 ? 'Shift+Tab' : 'Tab');
								expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(
									true,
								);
							}
							await dialog.getByTestId('theme-toggle').focus();
							await page.keyboard.press('Space');
							await expect(dialog.getByTestId('theme-toggle')).toBeFocused();
							await page.keyboard.press('Escape');
							await page.keyboard.press('Escape');
							await expect(dialog).toHaveCount(0);
							await expect(toggle).toBeFocused();
							await expect(toggle).toHaveAttribute('aria-expanded', 'false');
							expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(scroll, 0);
							await expect
								.poll(() => page.locator('body').evaluate((el) => el.style.overflow))
								.not.toBe('hidden');
						}
					});

					test('rapid reopen cancels close completion without moving the pill to the page', async ({
						page,
					}) => {
						const toggle = page.getByTestId('nav-menu-toggle');
						await openMenu(page);
						await expect(page.getByRole('dialog').getByTestId('nav-pill')).toHaveCount(1);
						await toggle.focus();
						await page.keyboard.press('Escape');
						await page.keyboard.press('Enter');
						await expect(page.getByRole('dialog')).toBeVisible();
						await page.waitForTimeout(550); // exceeds the cancelled close fallback
						await expect(page.getByRole('dialog').getByTestId('nav-pill')).toHaveCount(1);
						await expect(page.getByTestId('nav-pill')).toHaveCount(1);
						await expect(toggle).toHaveAttribute('aria-expanded', 'true');
						await page.keyboard.press('Escape');
						await expect(page.getByRole('dialog')).toHaveCount(0);
					});

					for (const closing of [false, true]) {
						test(`locale navigation while ${closing ? 'closing' : 'opening'} preserves destination ownership`, async ({
							page,
						}) => {
							await openMenu(page);
							await expect(page.getByRole('dialog').getByTestId('nav-menu-toggle')).toBeFocused();
							const language = page.getByTestId('language-toggle');
							const destination = await language.getAttribute('href');
							await language.focus();
							if (closing) {
								await page.keyboard.press('Escape');
								// Reduced motion completes closure immediately; activate the destination shell's control.
								if (reducedMotion === 'reduce') await language.focus();
							}
							await page.keyboard.press('Enter');
							await page.waitForURL((url) => url.pathname === new URL(destination!, url).pathname);
							expect(new URL(page.url()).search).toBe('?menu=fixture');
							expect(new URL(page.url()).hash).toBe('#fixture');
							await expect(page.getByTestId('nav-pill')).toHaveCount(1);
							if (closing) {
								await expect(page.getByRole('dialog')).toHaveCount(0);
								await expect(page.getByTestId('nav-menu-toggle')).not.toBeFocused();
								await expect
									.poll(() => page.locator('body').evaluate((el) => el.style.overflow))
									.not.toBe('hidden');
							} else {
								await expect(page.getByRole('dialog').getByTestId('language-toggle')).toBeFocused();
								await page.keyboard.press('Escape');
								await expect(page.getByRole('dialog')).toHaveCount(0);
							}
						});
					}

					test('Back and Forward during closing use destination focus and release the lock', async ({
						page,
					}) => {
						await page.goto('/projects');
						await page.locator('a[href="/blog"]').first().click();
						await page.waitForURL('**/blog');
						for (const direction of ['back', 'forward']) {
							await openMenu(page);
							await expect(page.getByRole('dialog').getByTestId('nav-pill')).toHaveCount(1);
							await page.keyboard.press('Escape');
							if (direction === 'back') await page.goBack();
							else await page.goForward();
							await expect(page.getByRole('dialog')).toHaveCount(0);
							await expect(page.getByTestId('nav-pill')).toHaveCount(1);
							await expect(page.getByTestId('nav-menu-toggle')).not.toBeFocused();
							await expect
								.poll(() => page.locator('body').evaluate((el) => el.style.overflow))
								.not.toBe('hidden');
						}
					});
				});
			}
		}
	}

	for (const [width, height, bottom] of [
		[320, 568, 76],
		[480, 667, 80],
		[1280, 600, 88],
		[1366, 600, 88],
	]) {
		test(`menu content clears the pill and its final link remains reachable at ${width}x${height}`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height });
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.goto('/');
			await openMenu(page);
			const dialog = page.getByRole('dialog');
			await expect(dialog.getByTestId('nav-pill')).toHaveCount(1);
			const pill = await page.getByTestId('nav-pill').boundingBox();
			expect(pill!.y + pill!.height).toBeCloseTo(bottom, 0);
			const first = await dialog.locator('[data-menu-item]').first().boundingBox();
			expect(first!.y).toBeGreaterThanOrEqual(bottom + 14);
			const last = dialog.locator('[data-menu-item]').last();
			await last.focus();
			const end = await last.boundingBox();
			expect(end!.y).toBeGreaterThanOrEqual(bottom);
			expect(end!.y + end!.height).toBeLessThanOrEqual(height + 1);
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

test('nav pill stays painted ABOVE the menu sheet while it is open', async ({ page }) => {
	await page.goto('/');
	const pill = page.locator('[data-testid="nav-pill"]');
	await expect(pill).toBeVisible();

	await page.click('[data-testid="nav-menu-toggle"]');
	const overlay = page.locator('.menu-overlay');
	await expect(overlay).toBeVisible();
	// Let the sheet's open transition fully land before probing paint order:
	// poll the overlay's computed transform until it stops changing across two
	// consecutive reads (transition settled), instead of a fixed sleep.
	let prevTransform: string | null = null;
	await expect
		.poll(
			async () => {
				const current = await overlay.evaluate((el) => getComputedStyle(el).transform);
				const stable = prevTransform !== null && current === prevTransform;
				prevTransform = current;
				return stable;
			},
			{ timeout: 2000, intervals: [50] },
		)
		.toBe(true);

	// Paint-order probe: the element at the pill's center must belong to the
	// nav. (toBeVisible() passes even when another layer covers the pill —
	// this is the check that actually failed before the fix.)
	const paint = await page.evaluate(() => {
		const pillEl = document.querySelector('[data-testid="nav-pill"]')!;
		const r = pillEl.getBoundingClientRect();
		const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
		return {
			topElementInNav: Boolean(top?.closest('[data-testid="nav"]')),
			pillW: r.width,
			pillH: r.height,
		};
	});
	expect(paint.pillW).toBeGreaterThan(0);
	expect(paint.pillH).toBeGreaterThan(0);
	expect(paint.topElementInNav, 'menu sheet must not cover the nav pill').toBe(true);

	// Functional guarantee: the toggle (now an ✕) is hit-testable and closes
	// the sheet. A covered toggle fails Playwright's actionability check.
	await page.click('[data-testid="nav-menu-toggle"]');
	await expect(page.locator('.menu-overlay')).toBeHidden();
});
