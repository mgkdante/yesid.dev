// slice-038 PR-1 — anchor landing offset under the floating nav pill.
//
// THE CONTRACT: every in-page anchor target (`h1..h6[id]`, `[data-section-index]`)
// carries `scroll-margin-top` = the SAME clearance the rest of the shell reserves
// for the fixed nav pill — `--nav-clearance` (+ the iOS safe-area inset) — plus a
// 1rem breathing gap. app.css previously spelled that as
// `calc(var(--nav-height, 64px) + 1rem)`, and `--nav-height` is defined NOWHERE in
// the codebase, so every anchor silently landed on the 64px fallback → 80px, i.e.
// 24px short of the 104px the shell actually reserves (88 + 16). At 80px a hash
// target lands 4px under the pill's 76px bottom edge — visually tucked.
//
// SCOPING (deliberate, both dimensions):
//  · desktop-chrome ONLY (pinned in playwright.config.ts DESKTOP_ONLY_SPECS).
//    Test 2 asserts the DESKTOP composition — the `.toc-column` rail is
//    display:none below 1024px — and test 1's assertion is viewport-independent,
//    so re-running it on the phone matrix buys nothing.
//  · ZERO-INSET ENVIRONMENT. Chromium-on-Linux reports
//    `env(safe-area-inset-top)` = 0px, so the expected offset below reduces to
//    `--nav-clearance + 1rem`. The env() term is still part of the production
//    equation (notched iOS); this guard simply runs where it evaluates to zero
//    and therefore never observes it. A notched-device guard would need a real
//    WebKit/iOS surface, which this repo's sandbox cannot run (see the
//    browser-engine note in playwright.config.ts).
//
// ORACLE INDEPENDENCE: the expected value is derived from `--nav-clearance` (the
// shell doctrine in +layout.svelte:139-149) — NEVER from the target's own
// computed `scroll-margin-top`. Reading the target's own margin would make the
// assertion tautological: the broken 80px implementation would pass it.

import { test, expect, type Page } from '@playwright/test';

// A LEGAL page: legal bodies render through BlockRenderer → Heading.svelte, which
// stamps a deterministic kebab-case id on every heading, and those ids ship in the
// SERVER-RENDERED HTML (legal routes are prerendered) — so a cold load with a hash
// fragment is a genuine native browser fragment navigation, not a client-side
// scroll. Blog posts cannot serve here: all their headings are level-2 → data-toc
// cards with no heading ids.
//
// `who-i-am` = the FIRST h2 of /legal/privacy ("Who I am" → kebabSlug). Chosen
// because (a) it is the most durable heading on the most durable legal page — a
// "Who I am" section is structural, not a wording detail, (b) it sits far enough
// down (below the shell's 88px reserve, the article's py-16 and the h1) that the
// document can actually scroll it to the target offset, and (c) ~40 blocks of
// policy follow it, so the scroll is never clamped by the end of the document.
const LEGAL_ANCHOR_PATH = '/legal/privacy';
const LEGAL_ANCHOR_ID = 'who-i-am';

// The project whose detail page carries the desktop TOC rail used by test 2.
const PROJECT_PATH = '/projects/yesid-dev';

// Anchor landing tolerance. Sub-pixel layout rounding only — 2px is far tighter
// than the 24px defect this guard exists to catch.
const TOLERANCE_PX = 2;

/** Resolve the shell's nav clearance IN PIXELS from the doctrine custom property.
 *  `--nav-clearance` is declared on the `.circuit-grid` shell wrapper and inherits
 *  to every page node, so any in-page element resolves it. Non-registered custom
 *  properties compute to their raw token stream ("5.5rem"), hence the explicit
 *  rem→px conversion against the root font size. */
async function navClearancePx(page: Page, selector: string): Promise<number> {
	return page.evaluate((sel) => {
		const el = document.querySelector(sel);
		if (!el) throw new Error(`clearance probe: no element for ${sel}`);
		const raw = getComputedStyle(el).getPropertyValue('--nav-clearance').trim();
		const rootFontPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
		if (raw.endsWith('rem')) return parseFloat(raw) * rootFontPx;
		if (raw.endsWith('px')) return parseFloat(raw);
		throw new Error(`clearance probe: unhandled --nav-clearance value "${raw}"`);
	}, selector);
}

/** The `1rem` breathing gap of the app.css equation, in pixels. */
async function rootFontPx(page: Page): Promise<number> {
	return page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
}

/** Wait until the (possibly smooth / animated) scroll position stops moving. */
async function settleScroll(page: Page): Promise<void> {
	await page.evaluate(() => {
		const w = window as unknown as { __navOffsetY?: number; __navOffsetStable?: number };
		w.__navOffsetY = -1;
		w.__navOffsetStable = 0;
	});
	await page.waitForFunction(
		() => {
			const w = window as unknown as { __navOffsetY?: number; __navOffsetStable?: number };
			const y = Math.round(window.scrollY);
			if (w.__navOffsetY === y) w.__navOffsetStable = (w.__navOffsetStable ?? 0) + 1;
			else {
				w.__navOffsetY = y;
				w.__navOffsetStable = 0;
			}
			return (w.__navOffsetStable ?? 0) >= 5;
		},
		undefined,
		{ polling: 50, timeout: 10_000 },
	);
}

test.describe('anchor targets land below the floating nav pill', () => {
	test('cold-loading a legal page with a hash fragment lands the heading at the shell clearance', async ({
		page,
	}) => {
		const response = await page.goto(`${LEGAL_ANCHOR_PATH}#${LEGAL_ANCHOR_ID}`);
		expect(response?.status(), `${LEGAL_ANCHOR_PATH} status`).toBe(200);
		await expect(page.getByTestId('page-legal')).toBeVisible();

		// The id must exist in the served document — a typo'd/renamed heading would
		// otherwise make this whole guard vacuous (no target = no scroll = no fail).
		const heading = page.locator(`#${LEGAL_ANCHOR_ID}`);
		await expect(heading, `#${LEGAL_ANCHOR_ID} must exist on ${LEGAL_ANCHOR_PATH}`).toBeVisible();

		// Web fonts change line-box metrics; let them land before measuring, then let
		// the browser's fragment scroll settle.
		await page.evaluate(async () => {
			await document.fonts.ready;
		});
		await settleScroll(page);

		// INDEPENDENT oracle: shell doctrine + the equation's 1rem gap.
		// env(safe-area-inset-top) === 0 in this environment (see SCOPING above).
		const clearance = await navClearancePx(page, `#${LEGAL_ANCHOR_ID}`);
		const gap = await rootFontPx(page);
		const expected = clearance + gap;

		// Doctrine pin: 88px clearance (+layout.svelte `--nav-clearance: 5.5rem`)
		// + 16px gap = 104px. If this ever trips, the shell doctrine moved and the
		// app.css equation must be re-read against it — not silently re-baselined.
		expect(clearance, '--nav-clearance resolves to 88px').toBeCloseTo(88, 1);
		expect(expected, 'expected anchor offset = 88 + 16').toBeCloseTo(104, 1);

		// The page really did scroll (guards against a vacuous pass where the target
		// happens to sit at the right place without any fragment navigation).
		expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

		const box = await heading.boundingBox();
		expect(box, 'heading must have a bounding box').not.toBeNull();
		// THE ASSERTION the 80px (`--nav-height` fallback) implementation must fail:
		// |80 - 104| = 24px, twelvefold the tolerance.
		expect(
			box!.y,
			`#${LEGAL_ANCHOR_ID} must land ${expected}px from the viewport top (got ${box!.y})`,
		).toBeGreaterThan(expected - TOLERANCE_PX);
		expect(box!.y).toBeLessThan(expected + TOLERANCE_PX);
	});

	test('project TOC navigation centres a [data-section-index] block in the viewport', async ({
		page,
	}) => {
		await page.goto(PROJECT_PATH);
		await expect(page.getByTestId('project-detail-page')).toBeVisible();

		// The desktop TOC lists only non-rail entries, in order: one button per
		// article section (`section-N`), then README when present — and every one of
		// those ids resolves through toc.ts to `[data-section-index="N"]`. Sub-items
		// (README children) are excluded, so button i ⇒ [data-section-index="i"].
		const tocItems = page.locator('.toc-column .toc-nav > button.toc-item:not(.toc-sub-item)');
		const blocks = page.locator('[data-section-index]');
		const blockCount = await blocks.count();
		expect(blockCount, 'project must render section blocks').toBeGreaterThan(1);
		await expect(
			tocItems,
			'desktop TOC buttons must map 1:1 onto [data-section-index] blocks',
		).toHaveCount(blockCount);

		// Target the SECOND block: far enough from both document ends that a
		// block:center scroll is never clamped by the scroll range.
		const targetIndex = 1;
		// The TOC button's onclick attaches on hydration, so the first click can land
		// before it is wired (repo idiom — see mobile/small-device-fit.spec.ts). And
		// the handler runs a SMOOTH scroll, so wait for the scroll to actually START
		// before waiting for it to stop; otherwise "position unchanged" reads as
		// "settled" while the animation has merely not begun (a vacuous pass at 0).
		await expect(async () => {
			const y0 = await page.evaluate(() => window.scrollY);
			await tocItems.nth(targetIndex).click();
			await page.waitForFunction((y) => Math.abs(window.scrollY - y) > 4, y0, {
				timeout: 1500,
			});
		}).toPass({ timeout: 15_000 });
		await settleScroll(page);

		const geometry = await page.evaluate((index) => {
			const el = document.querySelector(`[data-section-index="${index}"]`);
			if (!el) throw new Error(`no [data-section-index="${index}"]`);
			const rect = el.getBoundingClientRect();
			return { centre: rect.top + rect.height / 2, viewport: window.innerHeight };
		}, targetIndex);

		// Central band: proves the block was CENTRED (not start-aligned, not left
		// off-screen) without pinning a pixel — the scroll-margin-top change shifts a
		// block:center landing by only M/2, which stays comfortably inside the band.
		const viewportCentre = geometry.viewport / 2;
		const band = geometry.viewport * 0.15;
		expect(
			Math.abs(geometry.centre - viewportCentre),
			`block centre ${geometry.centre} must sit within ±${band}px of viewport centre ${viewportCentre}`,
		).toBeLessThanOrEqual(band);
	});
});
