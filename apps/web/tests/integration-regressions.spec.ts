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
			await page.waitForTimeout(150);

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
	await expect(page.locator('.menu-overlay')).toBeVisible();
	// Let the sheet's open transition fully land before probing paint order.
	await page.waitForTimeout(700);

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
