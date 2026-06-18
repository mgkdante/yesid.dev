// Hero intro replay — go2/w5 deliverable 4 + taste round 2. Runs on every
// Playwright project (desktop-chrome + mobile profiles → both breakpoints).
//
//   1. First visit of the day: the scroll intro plays as today; scrolling it
//      through persists the localStorage day-key, arms the pulsing dot AND
//      (taste-2) collapses the intro's scroll allowance in place — the page
//      scroll height shrinks and the settled hero becomes natural top-of-page.
//   2. Same-day reload: intro SKIPPED — land in the same collapsed geometry;
//      the orange dot after "DON'T BREAK" heartbeats, is clickable (aria
//      "Replay intro"); clicking RE-ENLARGES the track, film-rewinds to the
//      top, and scrolling through again re-collapses.
//   3. The metro art carries ONE caption ('STM métro + REM') that never
//      overlaps the SVG; the old in-frame legend is gone.

import { test, expect, type Page } from '@playwright/test';
import { decodePng, pixelAt, isBrandOrange, type Rgb } from './lib/png.js';

const KEY = 'yesid:hero-intro-day';

// PAINT probe points (fractions of the viewport, below the floating nav).
// The orange-wall regression painted brand orange at EVERY one of these;
// a healthy frame never does (page background dominates at least one).
const PAINT_PROBES: ReadonlyArray<readonly [number, number]> = [
	[0.5, 0.5],
	[0.5, 0.85],
	[0.15, 0.6],
	[0.85, 0.6],
	[0.3, 0.35],
];

/**
 * Screenshot the viewport and assert it is NOT painting the orange wall.
 * Threshold: ≥3 of 5 spread probes brand-orange = wall (the regression hit
 * 4-5/5; healthy frames hit at most 1 — a stray glyph or metro stroke).
 */
async function expectNotOrangeWall(page: Page, moment: string): Promise<void> {
	const png = decodePng(await page.screenshot());
	const samples: Rgb[] = PAINT_PROBES.map(([fx, fy]) => pixelAt(png, fx, fy));
	const orange = samples.filter(isBrandOrange).length;
	expect(
		orange,
		`${moment}: viewport paints a brand-orange wall — ` +
			`probes [${samples.map((rgb) => rgb.join(',')).join(' | ')}]`,
	).toBeLessThan(3);
}

/** Local-timezone YYYY-MM-DD — must match heroIntroDayKey(). */
function localDayKeyScript(storageKey: string): string {
	return `(() => {
		const now = new Date();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		try { window.localStorage.setItem('${storageKey}', now.getFullYear() + '-' + m + '-' + d); } catch {}
	})()`;
}

test('first visit plays the intro; scrolling through persists, arms the dot + collapses the track', async ({
	page,
}) => {
	await page.goto('/');

	// Fresh storage → intro state: no completed-state class, metro art present.
	await expect(page.locator('[data-testid="hero-banner"]')).toBeVisible();
	expect(
		await page
			.locator('[data-testid="hero-banner"]')
			.evaluate((el) => el.classList.contains('hero-intro-done')),
	).toBe(false);
	await expect(page.locator('[data-testid="metro-network-container"]')).toBeVisible();

	// Taste-2: the in-frame legend is GONE; ONE caption names the art. The
	// caption's shrink-wrapped text box must never overlap DRAWN metro ink at
	// any project shape. Element-box math is the wrong proxy here (the wide
	// art bleeds past its 80dvh frame on short viewports, and the mobile
	// viewBox crop + overflow:visible bleeds ink outside the element box), so
	// sample the caption box and test true ink presence per drawn path via
	// isPointInStroke/isPointInFill in path-local coordinates.
	await expect(page.locator('[data-testid="metro-legend"]')).toHaveCount(0);
	const caption = page.locator('[data-testid="metro-caption"]');
	await expect(caption).toHaveCount(1);
	expect(await caption.textContent()).toContain('STM métro + REM');
	const inkHits = await page.evaluate(() => {
		const svg = document.querySelector('[data-testid="metro-network-container"] svg');
		const cap = document.querySelector('[data-testid="metro-caption"]');
		if (!svg || !cap) return null;
		const c = cap.getBoundingClientRect();
		const hits: string[] = [];
		const paths = Array.from(svg.querySelectorAll('path')) as SVGGeometryElement[];
		for (const el of paths) {
			const r = el.getBoundingClientRect();
			if (r.width === 0 && r.height === 0) continue;
			// Cheap reject: bounding boxes don't even touch.
			if (!(r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top)) {
				continue;
			}
			const ctm = el.getScreenCTM();
			if (!ctm) continue;
			const inv = ctm.inverse();
			let hit = false;
			for (let gx = 0; gx <= 12 && !hit; gx++) {
				for (let gy = 0; gy <= 4 && !hit; gy++) {
					const px = c.left + (c.width * gx) / 12;
					const py = c.top + (c.height * gy) / 4;
					const pt = new DOMPoint(px, py).matrixTransform(inv);
					try {
						if (el.getAttribute('stroke') && el.isPointInStroke(pt as DOMPointInit)) hit = true;
						const fill = el.getAttribute('fill');
						if (fill && fill !== 'none' && el.isPointInFill(pt as DOMPointInit)) hit = true;
					} catch {
						// isPointIn* unsupported — treat the bbox touch as a hit
						// so a regression can never silently pass.
						hit = true;
					}
				}
			}
			if (hit) hits.push(el.getAttribute('class') || 'unclassed');
		}
		return hits;
	});
	expect(inkHits, 'caption or metro svg missing').not.toBeNull();
	expect(inkHits, `caption overlaps drawn metro ink: ${inkHits?.join(', ')}`).toEqual([]);

	// Dot exists but is dormant until the intro completes.
	await expect(page.locator('[data-testid="hero-dot-replay"]')).toBeDisabled();

	// Wait for the scroll-scrub to mount (GSAP wraps the pin in .pin-spacer).
	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBeGreaterThan(0);

	const expandedHeight = await page.evaluate(() => document.documentElement.scrollHeight);
	const viewportHeight = page.viewportSize()!.height;

	// Scroll the intro through (straight past the pin end).
	await page.evaluate(() => {
		window.scrollTo(0, document.body.scrollHeight);
	});

	// Day-key persisted…
	await expect
		.poll(() => page.evaluate((k) => window.localStorage.getItem(k), KEY), { timeout: 15_000 })
		.toMatch(/^\d{4}-\d{2}-\d{2}$/);

	// …taste-2: the intro's scroll allowance collapses IN PLACE — the
	// completed-state class lands live, the pin spacer is gone, and the page
	// scroll height shrinks by viewports (the settled hero is now natural
	// top-of-page geometry, so same-day reloads restore 1:1).
	await expect(page.locator('[data-testid="hero-banner"]')).toHaveClass(/hero-intro-done/, {
		timeout: 15_000,
	});
	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBe(0);
	const collapsedHeight = await page.evaluate(() => document.documentElement.scrollHeight);
	expect(
		expandedHeight - collapsedHeight,
		`scroll allowance did not collapse (was ${expandedHeight}, now ${collapsedHeight})`,
	).toBeGreaterThan(viewportHeight * 2);
	await expect(page.locator('[data-testid="metro-network-container"]')).toBeHidden();

	// …and the dot is armed: enabled, labelled, heartbeating.
	const dot = page.locator('[data-testid="hero-dot-replay"]');
	await expect(dot).toBeEnabled();
	await expect(dot).toHaveAttribute('aria-label', 'Replay intro');
	await expect
		.poll(
			() =>
				dot
					.locator('[data-testid="hero-dot"]')
					.evaluate((el) => getComputedStyle(el).animationName),
			{ timeout: 2000 },
		)
		.toMatch(/hero-dot-pulse/); // Svelte scopes @keyframes names
});

test('same-day reload lands collapsed; heartbeat dot rewinds, replays + re-collapses', async ({
	page,
}) => {
	// Seed today's day-key BEFORE the app boots.
	await page.addInitScript(localDayKeyScript(KEY));
	await page.goto('/');

	// Completed state: collapse class on, metro art hidden, hero text visible.
	const banner = page.locator('[data-testid="hero-banner"]');
	await expect(banner).toHaveClass(/hero-intro-done/);
	await expect(page.locator('[data-testid="metro-network-container"]')).toBeHidden();
	await expect(page.locator('[data-testid="hero-text-container"]')).toBeVisible();
	await expect(page.locator('[data-testid="hero-line1"]')).toBeVisible();

	// No 600/900svh reservation — the hero is roughly one viewport tall.
	const viewport = page.viewportSize()!;
	const bannerHeight = await banner.evaluate((el) => el.getBoundingClientRect().height);
	expect(bannerHeight).toBeLessThan(viewport.height * 3);

	// The dot heartbeats (scale keyframes), reads as clickable, aria-labelled,
	// and renders as a true '.': a real box, never clipped away.
	const dot = page.locator('[data-testid="hero-dot-replay"]');
	await expect(dot).toBeEnabled();
	await expect(dot).toHaveAttribute('aria-label', 'Replay intro');
	expect(await dot.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer');
	const dotGlyph = dot.locator('[data-testid="hero-dot"]');
	await expect
		.poll(() => dotGlyph.evaluate((el) => getComputedStyle(el).animationName), { timeout: 2000 })
		.toMatch(/hero-dot-pulse/); // Svelte scopes @keyframes names
	const dotBox = await dotGlyph.evaluate((el) => {
		const r = el.getBoundingClientRect();
		return { width: r.width, height: r.height, overflow: getComputedStyle(el).overflow };
	});
	expect(dotBox.width).toBeGreaterThan(2);
	expect(dotBox.height).toBeGreaterThan(2);
	expect(dotBox.overflow).toBe('visible');

	// Click = re-enlarge + film-rewind: the track re-expands (scroll height
	// grows back by viewports), the scroll-scrub pin rebuilds, the metro art
	// returns, and we ride the rewind back to the very top.
	const collapsedHeight = await page.evaluate(() => document.documentElement.scrollHeight);
	await dot.click();
	// Operator lock: the click FORGETS the day-key immediately — a refresh
	// from here on lands on the animation again ("still to do"). Completing
	// the replay scroll-through below re-persists it.
	await expect
		.poll(() => page.evaluate(() => window.localStorage.getItem('yesid:hero-intro-day')))
		.toBeNull();
	// Glitch lock (operator: "the hero animation glitches on clicking the
	// dot"): the moment a replay starts, GSAP owns the dot svg — the beacon
	// dress must be GONE. An infinite CSS transform animation overrides
	// GSAP's inline transform every frame, and a drop-shadow filter
	// rasterizes a gigantic surface mid-zoom; either reads as the glitch.
	const bare = await dot
		.locator('[data-testid="hero-dot"]')
		.evaluate((el) => {
			const cs = getComputedStyle(el);
			return { animation: cs.animationName, filter: cs.filter };
		});
	expect(bare.animation).toBe('none');
	expect(bare.filter).toBe('none');
	await expect(banner).not.toHaveClass(/hero-intro-done/, { timeout: 15_000 });
	await expect
		.poll(() => page.evaluate(() => document.documentElement.scrollHeight), { timeout: 15_000 })
		.toBeGreaterThan(collapsedHeight + viewport.height * 2);
	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBeGreaterThan(0);
	await expect(page.locator('[data-testid="metro-network-container"]')).toBeVisible();

	// PAINT-LEVEL rewind probe (regression: the rewind once painted a solid
	// brand-orange wall — the hero-text container stuck at its 200×+ initial
	// scale with the replay opacity shield, its giant dot glyph covering the
	// viewport, because the pre-position jumps were clamped to Lenis' stale
	// cached limit and the scrub never rendered the track's top segment).
	// Scroll assertions alone can't catch that class of bug, so: wait for the
	// rewind to pass BELOW 40% of the pin distance (timeline time < Phase 5
	// start ⇒ no legitimate full-viewport orange zoom frame exists), then
	// assert real painted pixels + the offending element's scrubbed state.
	const pinDistance = await page
		.locator('.pin-spacer')
		.evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
	expect(pinDistance).toBeGreaterThan(viewport.height);
	await page.waitForFunction(
		(band) => window.scrollY < band,
		pinDistance * 0.4,
		{ polling: 'raf', timeout: 15_000 },
	);
	await expectNotOrangeWall(page, 'mid-rewind (below Phase 5 band)');
	// The scrub must have rendered the backward pass: below Phase 6 the
	// hero-text container is scrubbed back to opacity 0 (the temporary
	// replay shield released before the rebuilt timeline's first render).
	// In the orange-wall bug it stayed at the shield's opacity 1 forever.
	expect(
		await page
			.locator('[data-testid="hero-text-container"]')
			.evaluate((el) => getComputedStyle(el).opacity),
	).toBe('0');

	await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15_000 }).toBeLessThan(8);

	// Settled paint: top-of-track is the Phase 1 frame (Berri dot + page
	// background) — never a wall, and the hero text layer stays scrubbed out.
	await expectNotOrangeWall(page, 'settled at top after rewind');
	expect(
		await page
			.locator('[data-testid="hero-text-container"]')
			.evaluate((el) => getComputedStyle(el).opacity),
	).toBe('0');

	// Scrolling the replayed intro through again re-applies the collapse —
	// the round-trip is idempotent.
	await page.evaluate(() => {
		window.scrollTo(0, document.body.scrollHeight);
	});
	await expect(banner).toHaveClass(/hero-intro-done/, { timeout: 15_000 });
	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBe(0);
});
