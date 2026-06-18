// go2/home-cards: story-first proof cards — visibility-grade e2e.
//
// Operator verdict drove the recompose: each home featured-project card must
// SAY something — the one-liner excerpt, the station it was built at, the
// YELLOW-voice metric and a surviving orange exploration action, with the
// image as a supporting band instead of a dominating slab.
//
// Post-consolidation the home reel renders the SHARED ProjectCard.svelte in
// variant="proof" (FeaturedProjects.svelte). The bespoke proof markup is gone:
//   - chassis surface moved from `.proof-card` onto the inner `.card-surface`;
//   - the station-signage chip became the per-service STM roundel `.line-bullet`
//     under the card's "Services" badge row (the station that built it);
//   - the per-card orange "see the build →" line was removed (the whole card is
//     now the link) — the surviving orange exploration action is the
//     section-level `proof-view-all`;
//   - the footer is now the metric strip `[data-testid="proof-metric-strip"]`;
//   - the active-slide spotlight is the chassis border/box-shadow, not an image
//     grayscale filter (the B&W resting treatment was dropped in the redesign).
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

const DARK_CARD = 'rgb(26, 26, 26)'; // #1a1a1a --card / --surface-2 — solid panel, no grid bleed
const DARK_PRIMARY = 'rgb(224, 120, 0)'; // #E07800 — orange standard action
const DARK_ACCENT_TEXT = 'rgb(255, 182, 39)'; // #FFB627 — yellow voice

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
	// least one featured project must declare the station that built it. The
	// The station-signage chip (which station built each project) was restored
	// to the proof variant after the consolidation: one theme-invariant signage
	// chip per related station, leading the card body.
	expect(await page.locator('[data-testid="proof-station-chip"]').count()).toBeGreaterThan(0);

	// The orange exploration action survived as the section-level "view all"
	// link (the per-card "see the build →" line was removed: the whole card is
	// now the link). Orange --primary voice, present and visible — one per reel.
	const viewAll = section.getByTestId('proof-view-all');
	await expect(viewAll).toBeVisible();
	await expect(viewAll).toHaveCSS('color', DARK_PRIMARY);

	for (let i = 0; i < count; i++) {
		const card = cards.nth(i);

		// Excerpt — the story line. Real text present.
		const excerpt = card.getByTestId('proof-excerpt');
		await expect(excerpt, `card ${i} excerpt`).toBeAttached();
		expect((await excerpt.textContent())?.trim().length).toBeGreaterThan(0);

		// Yellow metric voice — self-contained computed-style assertion.
		const metric = card.getByTestId('proof-metric-value').first();
		await expect(metric, `card ${i} metric span`).toBeAttached();
		const hasMetric = (((await metric.textContent()) ?? '').trim().length ?? 0) > 0;
		if (hasMetric) {
			await expect(metric).toHaveCSS('color', DARK_ACCENT_TEXT);
		}
		// A card renders one station roundel per related station (many-to-many
		// post slice-30); each dot is colored by its station's line color, so
		// the only invariant across them is presence + a non-zero box (below).
		const hasChip = (await card.locator('.line-bullet').count()) > 0;

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
				metric: rect(link.querySelector('[data-testid="proof-metric-value"]')),
				chip: rect(link.querySelector('.line-bullet')),
				footer: rect(link.querySelector('[data-testid="proof-metric-strip"]')),
			};
		});

		// Non-zero computed sizes — the pieces are visibly there, not shells.
		expect(geo.excerpt!.w, `card ${i} excerpt width`).toBeGreaterThan(0);
		expect(geo.excerpt!.h, `card ${i} excerpt height`).toBeGreaterThan(0);
		if (hasMetric) expect(geo.metric!.h, `card ${i} metric height`).toBeGreaterThan(0);
		if (hasChip) {
			// The station roundel is a small dot — a non-zero box, fully inside
			// the card (clip guard).
			expect(geo.chip!.w, `card ${i} station roundel width`).toBeGreaterThan(0);
			expect(geo.chip!.h, `card ${i} station roundel height`).toBeGreaterThan(0);
			expect(geo.chip!.x).toBeGreaterThanOrEqual(geo.card!.x - 1);
			expect(geo.chip!.right).toBeLessThanOrEqual(geo.card!.right + 1);
		}

		// Nothing clipped: the metric strip (last interior row) ends inside the
		// card.
		expect(geo.footer!.bottom, `card ${i} metric strip inside card`).toBeLessThanOrEqual(
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

	// Solid panel per the system — computed card surface, no transparency. The
	// chassis (bg + 3px brand border) lives on the inner `.card-surface`, not on
	// the `.project-card` link wrapper, post-consolidation.
	const cardRoot = page.getByTestId('proof-card').first();
	const chassis = await cardRoot.locator('.card-surface').first().evaluate((el) => {
		const s = getComputedStyle(el);
		return { bg: s.backgroundColor, borderW: s.borderTopWidth };
	});
	expect(chassis.bg).toBe(DARK_CARD);
	expect(chassis.borderW).toBe('3px'); // round-5 blog-card chassis parity

	// The image is a BAND now, not the card: its height stays under ~62% of the
	// card's height (content leads, image supports). Both rects sampled in
	// one frame (late hero reflow shifts the page between separate calls).
	const band = await cardRoot.evaluate((el) => ({
		img: el.querySelector('[data-testid="proof-card-image"]')!.getBoundingClientRect().height,
		card: el.querySelector('.card-surface')!.getBoundingClientRect().height,
	}));
	expect(band.img).toBeLessThan(band.card * 0.62); // round 8: bigger band by operator order — still must not dominate

	// Active-slide spotlight: the fun pass moved from an image grayscale filter
	// to the chassis treatment. The active card's `.card-surface` carries the
	// section box-shadow spotlight (var(--shadow-section)); resting cards do not.
	// Assert the active surface is visibly distinguished from a resting one.
	const activeSurface = page.locator('[data-testid="proof-card"][data-active="true"] .card-surface');
	const restingSurface = page.locator('[data-testid="proof-card"][data-active="false"] .card-surface');
	if ((await activeSurface.count()) > 0 && (await restingSurface.count()) > 0) {
		const activeShadow = await activeSurface
			.first()
			.evaluate((el) => getComputedStyle(el).boxShadow);
		const restingShadow = await restingSurface
			.first()
			.evaluate((el) => getComputedStyle(el).boxShadow);
		// The active card is spotlit — a non-empty, multi-layer shadow that the
		// resting card does not share.
		expect(activeShadow).not.toBe('none');
		expect(activeShadow).not.toBe(restingShadow);
	}
});
