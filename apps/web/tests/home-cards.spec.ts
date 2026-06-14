// go2/home-cards: story-first proof cards — visibility-grade e2e.
//
// Operator verdict drove the recompose: each home featured-project card must
// SAY something — the one-liner excerpt, the station signage chip, the
// YELLOW-voice metric and the orange exploration line, with the image as a
// supporting band instead of a dominating slab.
//
// Runs on every Playwright project (desktop-chrome + 3 mobile profiles):
// presence is asserted per card with real computed boxes (non-zero sizes) and
// clip guards — "stacks gracefully, nothing clipped" on mobile.
//
// Content words are CMS-owned (slice-16 decoupling precedent): assertions
// check presence/geometry/voice-colors, never specific copy.
import { test, expect } from '@playwright/test';

// Brand default story — pin a dark-preferring user (Playwright's default
// emulated colorScheme is light; the pre-paint script honors it otherwise).
test.use({ colorScheme: 'dark' });

const DARK_CARD = 'rgb(26, 26, 26)'; // #1a1a1a --card — solid panel, no grid bleed
const DARK_PRIMARY = 'rgb(224, 120, 0)'; // #E07800 — orange standard action
const DARK_ACCENT_TEXT = 'rgb(255, 182, 39)'; // #FFB627 — yellow voice
const SIGNAGE_BG = 'rgb(28, 24, 20)'; // #1C1814 — theme-invariant signage pair
const SIGNAGE_TEXT = 'rgb(255, 182, 39)'; // #FFB627

test('home cards surface excerpt + station chip + metric + exploration line (non-zero boxes)', async ({ page }) => {
	await page.goto('/');
	const section = page.getByTestId('proof-reel-section');
	// Deterministic replacement for networkidle: the proof reel is the landmark
	// every following read/geometry assertion depends on — wait for it to paint
	// (web-first, auto-retrying) instead of for the contact weather fetch to idle.
	await expect(section).toBeVisible();
	await section.scrollIntoViewIfNeeded();

	const cards = page.getByTestId('proof-card');
	const count = await cards.count();
	expect(count, 'proof reel must render at least one card').toBeGreaterThan(0);

	// Data-quality guard (same spirit as the unit CMS-integrity guard): at
	// least one featured project must declare the station that built it.
	expect(await page.getByTestId('proof-station-chip').count()).toBeGreaterThan(0);

	for (let i = 0; i < count; i++) {
		const card = cards.nth(i);

		// Excerpt — the story line. Real text present.
		const excerpt = card.getByTestId('proof-excerpt');
		await expect(excerpt, `card ${i} excerpt`).toBeAttached();
		expect((await excerpt.textContent())?.trim().length).toBeGreaterThan(0);

		// Voice colors — self-contained computed-style assertions.
		await expect(card.getByTestId('proof-see-build')).toHaveCSS('color', DARK_PRIMARY);
		const metric = card.getByTestId('proof-metric-value');
		await expect(metric, `card ${i} metric span`).toBeAttached();
		const hasMetric = (((await metric.textContent()) ?? '').trim().length ?? 0) > 0;
		if (hasMetric) {
			await expect(metric).toHaveCSS('color', DARK_ACCENT_TEXT);
		}
		// A card renders one chip per related station (many-to-many post slice-30);
		// the signage palette is identical across them, so assert the first.
		const chip = card.getByTestId('proof-station-chip').first();
		const hasChip = (await card.getByTestId('proof-station-chip').count()) > 0;
		if (hasChip) {
			await expect(chip).toHaveCSS('background-color', SIGNAGE_BG);
			await expect(chip).toHaveCSS('color', SIGNAGE_TEXT);
		}

		// Geometry grade — ALL rects sampled in ONE frame (a single evaluate).
		// The hero's scroll-driven setup reflows the page late; comparing
		// boxes captured at different times produces false clip offsets.
		const geo = await card.evaluate((link) => {
			const rect = (el: Element | null) => {
				if (!el) return null;
				const b = el.getBoundingClientRect();
				return { x: b.x, y: b.y, w: b.width, h: b.height, bottom: b.bottom, right: b.right };
			};
			return {
				card: rect(link),
				excerpt: rect(link.querySelector('[data-testid="proof-excerpt"]')),
				seeBuild: rect(link.querySelector('[data-testid="proof-see-build"]')),
				metric: rect(link.querySelector('[data-testid="proof-metric-value"]')),
				chip: rect(link.querySelector('[data-testid="proof-station-chip"]')),
				footer: rect(link.querySelector('.proof-footer')),
			};
		});

		// Non-zero computed sizes — the pieces are visibly there, not shells.
		expect(geo.excerpt!.w, `card ${i} excerpt width`).toBeGreaterThan(0);
		expect(geo.excerpt!.h, `card ${i} excerpt height`).toBeGreaterThan(0);
		expect(geo.seeBuild!.w, `card ${i} see-build width`).toBeGreaterThan(0);
		expect(geo.seeBuild!.h, `card ${i} see-build height`).toBeGreaterThan(0);
		if (hasMetric) expect(geo.metric!.h, `card ${i} metric height`).toBeGreaterThan(0);
		if (hasChip) {
			expect(geo.chip!.w, `card ${i} chip width`).toBeGreaterThan(0);
			expect(geo.chip!.h, `card ${i} chip height`).toBeGreaterThan(0);
			// Chip fully inside the card (clip guard).
			expect(geo.chip!.x).toBeGreaterThanOrEqual(geo.card!.x - 1);
			expect(geo.chip!.right).toBeLessThanOrEqual(geo.card!.right + 1);
		}

		// Nothing clipped: the footer (last interior row) ends inside the card.
		expect(geo.footer!.bottom, `card ${i} footer inside card`).toBeLessThanOrEqual(
			geo.card!.bottom + 1,
		);
	}
});

test('home cards: solid card chassis (3px blog parity) + tamed image band', async ({ page }) => {
	await page.goto('/');
	const section = page.getByTestId('proof-reel-section');
	// Deterministic replacement for networkidle: wait for the proof reel landmark
	// to paint before scrolling/reading the computed card chassis.
	await expect(section).toBeVisible();
	await section.scrollIntoViewIfNeeded();

	// Solid panel per the system — computed card surface, no transparency.
	const cardRoot = page.locator('.proof-card').first();
	const chassis = await cardRoot.evaluate((el) => {
		const s = getComputedStyle(el);
		return { bg: s.backgroundColor, borderW: s.borderTopWidth };
	});
	expect(chassis.bg).toBe(DARK_CARD);
	expect(chassis.borderW).toBe('3px'); // round-5 blog-card chassis parity

	// The image is a BAND now, not the card: its height stays under half the
	// card's height (content leads, image supports). Both rects sampled in
	// one frame (late hero reflow shifts the page between separate calls).
	const band = await cardRoot.evaluate((el) => ({
		img: el.querySelector('[data-testid="proof-card-image"]')!.getBoundingClientRect().height,
		card: el.getBoundingClientRect().height,
	}));
	expect(band.img).toBeLessThan(band.card * 0.62); // round 8: bigger band by operator order — still must not dominate

	// Active slide spotlight keeps the fun pass: in color (grayscale(0)).
	const activeImg = page.locator('.proof-card[data-active="true"] .proof-img');
	if ((await activeImg.count()) > 0) {
		const filter = await activeImg.evaluate((el) => getComputedStyle(el).filter);
		expect(filter).toContain('grayscale(0)');
	}
	// Non-active slides rest dimmed B&W in dark mode.
	const restingImg = page.locator('.proof-card[data-active="false"] .proof-img');
	if ((await restingImg.count()) > 0) {
		const filter = await restingImg.first().evaluate((el) => getComputedStyle(el).filter);
		expect(filter).toContain('grayscale(1)');
		expect(filter).toContain('brightness(0.7)');
	}
});
