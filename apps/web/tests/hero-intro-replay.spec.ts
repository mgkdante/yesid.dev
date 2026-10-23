import { test, expect, type Page } from '@playwright/test';
import { decodePng, pixelAt, isBrandOrange, type Rgb } from './lib/png.js';


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

/**
 * Drive the intro scroll-through DETERMINISTICALLY (CI-flake hardening): a
 * single scrollTo(bottom) jump can leave the GSAP scrub short of the pin end
 * on a loaded shard — the completion callback (track collapse)
 * then never fires and the poll below times out. Stepping a viewport at a
 * time emits real scroll events the scrub renders one by one, and the loop
 * exits on the true completion signal: the pin-spacer detaching.
 */
async function scrollIntroThrough(page: Page): Promise<void> {
	// Budget: ~40 steps × 0.9 viewport ≈ 36 viewports — far beyond the
	// 600–900svh track. On budget exhaustion the caller's own assertions
	// report the failure precisely.
	for (let step = 0; step < 40; step++) {
		const spacerGone = await page.evaluate(() => {
			if (document.querySelector('.pin-spacer') === null) return true;
			const atBottom =
				window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
			if (!atBottom) window.scrollBy(0, window.innerHeight * 0.9);
			return false;
		});
		if (spacerGone) return;
		// A beat between steps lets the scrub render the segment it just entered.
		await page.waitForTimeout(50);
	}
}

test('first visit stays idle; dot activation plays and completion collapses the track', async ({
	page,
}) => {
	await page.goto('/');

	// Fresh storage starts with a visible headline and no metro track.
	await expect(page.locator('[data-testid="hero-banner"]')).toBeVisible();
	expect(
		await page
			.locator('[data-testid="hero-banner"]')
			.evaluate((el) => el.classList.contains('hero-intro-done')),
	).toBe(true);
	await expect(page.locator('[data-testid="metro-network-container"]')).toBeHidden();
	await expect(page.locator('.hero-pin').locator('..')).not.toHaveClass(/pin-spacer/);
	await page.getByTestId('hero-dot-replay').click();
	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBeGreaterThan(0);
	await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15_000 }).toBeLessThan(8);
	await expect(page.getByTestId('metro-network-container')).toBeVisible();

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


	// Wait for the scroll-scrub to mount (GSAP wraps the pin in .pin-spacer).
	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBeGreaterThan(0);

	const expandedHeight = await page.evaluate(() => document.documentElement.scrollHeight);
	const viewportHeight = page.viewportSize()!.height;

	// Scroll the intro through — stepped, so the scrub renders every segment
	// and the completion signal (pin-spacer detach) is awaited BEFORE the
	// completion assertions.
	await scrollIntroThrough(page);
	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBe(0);


	// …taste-2: the intro's scroll allowance collapses IN PLACE — the
	// completed-state class lands live, the pin spacer is gone, and the page
	// scroll height shrinks by viewports (the settled hero is now natural
	// top-of-page geometry).
	await expect(page.locator('[data-testid="hero-banner"]')).toHaveClass(/hero-intro-done/, {
		timeout: 15_000,
	});
	const collapsedHeight = await page.evaluate(() => document.documentElement.scrollHeight);
	expect(
		expandedHeight - collapsedHeight,
		`scroll allowance did not collapse (was ${expandedHeight}, now ${collapsedHeight})`,
	).toBeGreaterThan(viewportHeight * 2);
	await expect(page.locator('[data-testid="metro-network-container"]')).toBeHidden();

	// …and the dot is armed: enabled, labelled, heartbeating.
	const dot = page.locator('[data-testid="hero-dot-replay"]');
	await expect(dot).toBeEnabled();
	await expect(dot).toHaveAccessibleName(/\S/);
	await expect
		.poll(
			() =>
				dot
					.locator('[data-testid="hero-dot"]')
					.evaluate((el) => el.getAnimations({ subtree: true }).some(animation => animation.playState === 'running')),
			{ timeout: 2000 },
		)
		.toBe(true);
});

test('keyboard activation rewinds without an orange wall and supports repeated playback', async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.addInitScript(() => {
		const events: string[] = [];
		Reflect.set(window, 'heroInkEvents', events);
		document.addEventListener('animationstart', event => {
			const id = (event.target as Element).getAttribute('data-testid');
			if (id?.startsWith('hero-annotation-')) events.push(id);
		});
	});
	await page.goto('/');
	await expect(page.getByTestId('hero-dot-annotation')).toBeVisible();
	const annotation = await page.getByTestId('hero-dot-annotation').elementHandle();
	await expect.poll(() => page.evaluate(() => (Reflect.get(window, 'heroInkEvents') as string[]).at(-1))).toBe('hero-annotation-tip');
	await expect.poll(() => page.getByTestId('hero-annotation-tip').evaluate(el => parseFloat(getComputedStyle(el).strokeDashoffset))).toBe(0);
	const inkEvents = await page.evaluate(() => Reflect.get(window, 'heroInkEvents') as string[]);
	expect(inkEvents.length).toBeGreaterThan(2);
	expect(inkEvents.at(-2)).toBe('hero-annotation-arrow');
	expect(inkEvents.at(-1)).toBe('hero-annotation-tip');
	expect(inkEvents.slice(0, -2).every(id => id === 'hero-annotation-letter')).toBe(true);

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
	await expect(dot).toHaveAccessibleName(/\S/);
	const dotGlyph = dot.locator('[data-testid="hero-dot"]');
	await expect
		.poll(() => dotGlyph.evaluate((el) => el.getAnimations({ subtree: true }).some(animation => animation.playState === 'running')), { timeout: 2000 })
		.toBe(true);
	const dotBox = await dotGlyph.evaluate((el) => {
		const r = el.getBoundingClientRect();
		return { width: r.width, height: r.height };
	});
	expect(dotBox.width).toBeGreaterThan(2);
	expect(dotBox.height).toBeGreaterThan(2);
	await expect(dotGlyph).toBeInViewport();

	// Click = re-enlarge + film-rewind: the track re-expands (scroll height
	// grows back by viewports), the scroll-scrub pin rebuilds, the metro art
	// returns, and we ride the rewind back to the very top.
	const collapsedHeight = await page.evaluate(() => document.documentElement.scrollHeight);
	for (let step = 0; step < 16; step++) {
		if (await dot.evaluate(el => el === document.activeElement)) break;
		await page.keyboard.press('Tab');
	}
	await expect(dot).toBeFocused();
	expect(await dot.evaluate(el => {
		const style = getComputedStyle(el);
		return el.matches(':focus-visible') && parseFloat(style.outlineWidth) > 0 && !['none', 'hidden'].includes(style.outlineStyle);
	}), 'keyboard focus should have a visible indicator').toBe(true);
	await page.keyboard.press('Enter');
	await page.keyboard.press('Enter');
	await expect(banner).not.toHaveClass(/hero-intro-done/, { timeout: 15_000 });
	// Glitch lock (operator: "the hero animation glitches on clicking the
	// dot"): the moment a replay starts, GSAP owns the dot svg — the beacon
	// dress must be GONE. An infinite CSS transform animation overrides
	// GSAP's inline transform every frame, and a drop-shadow filter
	// rasterizes a gigantic surface mid-zoom; either reads as the glitch.
	const bare = await dot
		.locator('[data-testid="hero-dot"]')
		.evaluate((el) => ({
			isAnimating: el.getAnimations({ subtree: true }).some(animation => animation.playState === 'running'),
			hasFilter: getComputedStyle(el).filter !== 'none',
		}));
	expect(bare.isAnimating, 'the pulse must yield to the replay zoom').toBe(false);
	expect(bare.hasFilter, 'the zoom must not rasterize the beacon glow at a huge scale').toBe(false);
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
	// the round-trip is idempotent. Same stepped drive as the first pass.
	await scrollIntroThrough(page);
	await expect(banner).toHaveClass(/hero-intro-done/, { timeout: 15_000 });
	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBe(0);
	await expect.poll(() => page.evaluate(() => (Reflect.get(window, 'heroInkEvents') as string[]).filter(id => id === 'hero-annotation-tip').length)).toBe(2);
	await expect.poll(() => page.getByTestId('hero-annotation-tip').evaluate(el => parseFloat(getComputedStyle(el).strokeDashoffset))).toBe(0);
	expect(await page.evaluate(() => Reflect.get(window, 'heroInkEvents'))).toEqual([...inkEvents, ...inkEvents]);
	await dot.focus();
	await page.keyboard.press('Space');
	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBe(1);
	await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15_000 }).toBeLessThan(8);
	await scrollIntroThrough(page);
	await expect(banner).toHaveClass(/hero-intro-done/, { timeout: 15_000 });
	await expect(dot).toBeFocused();
	expect(await annotation!.evaluate(el => el.isConnected)).toBe(true);
	await expect.poll(() => page.evaluate(() => (Reflect.get(window, 'heroInkEvents') as string[]).filter(id => id === 'hero-annotation-tip').length)).toBe(3);
	expect(await page.evaluate(() => Reflect.get(window, 'heroInkEvents'))).toEqual([...inkEvents, ...inkEvents, ...inkEvents]);
});

test('reduced motion keeps the annotation static and the metro unavailable', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await expect(page.getByTestId('hero-banner')).toHaveClass(/hero-intro-done/);
	await expect(page.getByTestId('hero-dot-replay')).toBeDisabled();
	await expect(page.getByTestId('hero-dot-annotation')).toBeVisible();
	expect(await page.getByTestId('hero-dot-annotation').evaluate(el =>
		el.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0);
	await page.keyboard.press('Enter');
	await page.keyboard.press('Space');
	await expect(page.locator('.hero-pin').locator('..')).not.toHaveClass(/pin-spacer/);
	await expect(page.getByTestId('metro-network-container')).toBeHidden();
});
