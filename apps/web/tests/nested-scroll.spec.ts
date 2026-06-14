// go2 — nested-scroll contract for internally-scrollable cards (detail pages).
//
// The canon scroll-law: no child may block page scroll — but while the cursor
// is over a scrollable card with room to move in the wheel direction, the CARD
// owns the wheel; the page resumes only when the card hits its limit.
//
// The bug this guards against: after the card bottoms out and hands the wheel
// to Lenis (page glide starts), reversing the wheel direction over the card
// re-claims the wheel for the card (data-lenis-prevent toggles on) — but the
// in-flight Lenis ease kept scrolling the page underneath for up to 1.2s, so
// "scroll up over a scrolled card" felt dead: the page swept while the card
// crept. scrollChain must freeze the Lenis glide the moment a card claims a
// wheel event.
//
// Lenis is desktop-wheel only — wheel tests skip on mobile projects. The
// mobile test asserts native touch scrolling is untouched by the exemptions.

import { test, expect, type Page, type Locator } from '@playwright/test';

const PROJECT_URL = '/projects/transit-data-pipeline';
const TICK = 120; // one notched mouse-wheel detent
const SETTLE = 60; // ms between synthetic wheel events (human-burst spacing)

interface CardState {
	cardTop: number;
	cardMax: number;
	pageY: number;
}

async function cardState(page: Page, selector: string): Promise<CardState> {
	return page.evaluate((sel) => {
		const el = document.querySelector(sel) as HTMLElement;
		return {
			cardTop: Math.round(el.scrollTop),
			cardMax: Math.round(el.scrollHeight - el.clientHeight),
			pageY: Math.round(window.scrollY),
		};
	}, selector);
}

/** Pin the sticky panel (mid-read position) and park the cursor over the card. */
async function hoverScrolledCard(page: Page, card: Locator): Promise<void> {
	await page.evaluate(() => window.scrollTo(0, 600));
	await page.waitForTimeout(400);
	const box = await card.boundingBox();
	if (!box) throw new Error('card not visible');
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}

/** Wheel down until the card bottoms out, then two more ticks (page handoff). */
async function scrollCardToBottomAndHandOff(page: Page, selector: string): Promise<void> {
	for (let i = 0; i < 16; i++) {
		await page.mouse.wheel(0, TICK);
		await page.waitForTimeout(SETTLE);
		const s = await cardState(page, selector);
		if (s.cardTop >= s.cardMax) break;
	}
	expect((await cardState(page, selector)).cardTop).toBeGreaterThan(0);
	// Two extra ticks at the boundary — wheel chains to Lenis, page glide starts.
	await page.mouse.wheel(0, TICK);
	await page.waitForTimeout(SETTLE);
	await page.mouse.wheel(0, TICK);
	await page.waitForTimeout(SETTLE);
}

function wheelReversalContract(name: string, selector: string) {
	test(`${name}: wheel reversal scrolls the card back up while the page stays put`, async ({
		page,
		isMobile,
	}) => {
		test.skip(Boolean(isMobile), 'Lenis is desktop-wheel only');
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.goto(PROJECT_URL);
		await expect(page.getByTestId('project-detail-page')).toBeVisible();
		// expect.poll auto-waits for client hydration to add the lenis class —
		// the deterministic "page JS is live" signal the old networkidle guarded.
		await expect
			.poll(() => page.evaluate(() => document.documentElement.classList.contains('lenis')))
			.toBe(true);

		const card = page.locator(selector);
		await card.waitFor({ state: 'visible' });
		await hoverScrolledCard(page, card);

		const start = await cardState(page, selector);
		expect(start.cardMax, 'card must be internally scrollable at this viewport').toBeGreaterThan(
			TICK,
		);

		await scrollCardToBottomAndHandOff(page, selector);
		const atBottom = await cardState(page, selector);
		expect(atBottom.cardTop).toBe(atBottom.cardMax);

		// IMMEDIATE reversal — the bug scenario. First up-tick must move the CARD.
		await page.mouse.wheel(0, -TICK);
		await page.waitForTimeout(SETTLE);
		const afterUp1 = await cardState(page, selector);
		expect(afterUp1.cardTop, 'first reversal tick must scroll the card up').toBeLessThan(
			atBottom.cardMax,
		);

		// Second up-tick: card keeps unwinding AND the page is frozen — the
		// residual Lenis glide must have been cancelled when the card claimed
		// the wheel (this is the assertion that fails before the fix).
		await page.mouse.wheel(0, -TICK);
		await page.waitForTimeout(SETTLE);
		const afterUp2 = await cardState(page, selector);
		expect(afterUp2.cardTop, 'card keeps unwinding').toBeLessThan(afterUp1.cardTop);
		expect(
			Math.abs(afterUp2.pageY - afterUp1.pageY),
			'page must not move while the card owns the wheel',
		).toBeLessThanOrEqual(2);

		// Unwind to the top, then keep wheeling: the page must resume (canon law —
		// the card never traps page scroll at its limit). Budget a few ticks for
		// the seam: nested shells (e.g. the StickyPanel around the glance panel)
		// may eat a tick unwinding their own few px, and Chromium's wheel
		// latching can drop one tick at a scroller boundary.
		for (let i = 0; i < 16; i++) {
			await page.mouse.wheel(0, -TICK);
			await page.waitForTimeout(SETTLE);
			const s = await cardState(page, selector);
			if (s.cardTop <= 0) break;
		}
		expect((await cardState(page, selector)).cardTop).toBe(0);
		const pageBefore = (await cardState(page, selector)).pageY;
		let pageAfter = pageBefore;
		for (let i = 0; i < 6; i++) {
			await page.mouse.wheel(0, -TICK);
			await page.waitForTimeout(SETTLE);
			pageAfter = (await cardState(page, selector)).pageY;
			if (pageAfter < pageBefore - 5) break;
		}
		await page.waitForTimeout(400);
		pageAfter = (await cardState(page, selector)).pageY;
		expect(pageAfter, 'page resumes scrolling when the card hits its top').toBeLessThan(
			pageBefore,
		);
	});
}

test.describe('nested scrollables escape the Lenis trap (go2)', () => {
	// The 'On this page' TOC card (left column).
	wheelReversalContract('toc card', '.toc-column .toc-scroll');
	// The Impact/Stack glance sidebar (right column) — nested inner scroller.
	wheelReversalContract('glance card', '.glance-column .glance-panel');

	test('reduced motion: native nested scroll stays symmetric (no Lenis)', async ({
		page,
		isMobile,
	}) => {
		test.skip(Boolean(isMobile), 'wheel input is desktop-only');
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto(PROJECT_URL);
		await expect(page.getByTestId('project-detail-page')).toBeVisible();
		// Reduced motion: initLenis() returns early, so the lenis class is never
		// added. expect.poll lets hydration run (the old networkidle's job) while
		// asserting the class stays absent — deterministic, not a pre-hydration read.
		await expect
			.poll(() => page.evaluate(() => document.documentElement.classList.contains('lenis')))
			.toBe(false);

		const selector = '.toc-column .toc-scroll';
		const card = page.locator(selector);
		await card.waitFor({ state: 'visible' });
		await hoverScrolledCard(page, card);

		await scrollCardToBottomAndHandOff(page, selector);
		const atBottom = await cardState(page, selector);
		expect(atBottom.cardTop).toBe(atBottom.cardMax);

		await page.mouse.wheel(0, -TICK);
		await page.waitForTimeout(SETTLE);
		const afterUp1 = await cardState(page, selector);
		expect(afterUp1.cardTop, 'native path: card scrolls back up').toBeLessThan(
			atBottom.cardMax,
		);
		expect(
			Math.abs(afterUp1.pageY - atBottom.pageY),
			'native path: page stays while card unwinds',
		).toBeLessThanOrEqual(2);
	});

	test('mobile: native touch scrolling unaffected (no Lenis, no trapped page)', async ({
		page,
		isMobile,
		browserName,
	}) => {
		test.skip(!isMobile, 'mobile-profile assertion');
		test.skip(browserName !== 'chromium', 'CDP gesture is chromium-only');
		await page.goto(PROJECT_URL);
		await expect(page.getByTestId('project-detail-page')).toBeVisible();
		// Touch device: initLenis() bails before constructing Lenis, so the class
		// never lands. expect.poll gives hydration the runway the old networkidle
		// provided while asserting the class stays absent.
		await expect
			.poll(() => page.evaluate(() => document.documentElement.classList.contains('lenis')))
			.toBe(false);

		const client = await page.context().newCDPSession(page);
		const viewport = page.viewportSize();
		if (!viewport) throw new Error('no viewport');
		await client.send('Input.synthesizeScrollGesture', {
			x: Math.round(viewport.width / 2),
			y: Math.round(viewport.height / 2),
			yDistance: -600,
			speed: 1200,
		});
		await page.waitForTimeout(600);
		expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
	});
});
